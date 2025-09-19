import { useState, useRef, useEffect } from 'react'
import ChatPanel from './components/ChatPanel'
import CodePanel from './components/CodePanel'
import ValidationPanel from './components/ValidationPanel'
import KeyboardShortcuts from './components/KeyboardShortcuts'
import HistoryPanel from './components/HistoryPanel'
import { Message, GeneratedCode, AppState, ApiResponse, CodeValidationResult } from './types'
import { CodeValidator } from './utils/validation'
import { ThemeProvider } from './contexts/ThemeContext'
import { useCodeHistory } from './hooks/useCodeHistory'

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode>({
    html: '',
    css: '',
    js: ''
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [validationResult, setValidationResult] = useState<CodeValidationResult | null>(null)
  const [showValidation, setShowValidation] = useState<boolean>(false)
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false)
  const [showHistory, setShowHistory] = useState<boolean>(false)
  
  // Code history hook
  const {
    history,
    currentIndex,
    canUndo,
    canRedo,
    addToHistory,
    undo,
    redo,
    goToHistory,
    clearHistory
  } = useCodeHistory(50)

  const sendMessage = async (message: string): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    // Add user message to chat
    const newMessages: Message[] = [...messages, { 
      type: 'user', 
      content: message,
      timestamp: new Date()
    }]
    setMessages(newMessages)

    try {
      // Use test endpoint if message starts with "test:"
      const endpoint = message.startsWith('test:') ? '/api/test' : '/api/generate'
      const testMessage = message.startsWith('test:') ? message.substring(5).trim() : message
      
      // Send to API
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: testMessage,
          previousCode: generatedCode,
          conversationHistory: messages
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await response.json()

      if (data.success && data.code) {
        console.log('Received data from API:', data)
        
        // Update generated code - only update if new code exists, otherwise keep previous
        const newCode: GeneratedCode = {
          html: data.code.html || generatedCode.html,
          css: data.code.css || generatedCode.css,
          js: data.code.js || generatedCode.js
        }
        
        console.log('Updating code:', newCode)
        setGeneratedCode(newCode)

        // Add to history
        addToHistory(newCode, data.explanation || 'Code generated successfully!')

        // Add assistant response
        setMessages([...newMessages, { 
          type: 'assistant', 
          content: data.explanation || 'Code generated successfully!',
          timestamp: new Date()
        }])
      } else {
        console.error('API error:', data.error)
        const errorMessage = data.error || 'Sorry, there was an error generating the code. Please try again.'
        setError(errorMessage)
        setMessages([...newMessages, { 
          type: 'assistant', 
          content: errorMessage,
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Sorry, there was an error connecting to the server. Please try again.'
      setError(errorMessage)
      setMessages([...newMessages, { 
        type: 'assistant', 
        content: errorMessage,
        timestamp: new Date()
      }])
    }

    setIsLoading(false)
  }

  // Validate code whenever it changes
  useEffect(() => {
    if (generatedCode.html || generatedCode.css || generatedCode.js) {
      const validation = CodeValidator.validateAllCode(generatedCode)
      setValidationResult(validation)
      
      // Show validation panel if there are errors
      if (CodeValidator.hasErrors(validation)) {
        setShowValidation(true)
      }
    }
  }, [generatedCode])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '/':
            e.preventDefault();
            setShowShortcuts(true);
            break;
          case 'h':
            e.preventDefault();
            setShowHistory(true);
            break;
          case 'z':
            e.preventDefault();
            if (canUndo) {
              const previousCode = undo();
              if (previousCode) {
                setGeneratedCode(previousCode);
              }
            }
            break;
          case 'y':
            e.preventDefault();
            if (canRedo) {
              const nextCode = redo();
              if (nextCode) {
                setGeneratedCode(nextCode);
              }
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo])

  const handleCodeChange = (newCode: GeneratedCode) => {
    setGeneratedCode(newCode)
  }

  const handleValidateCode = () => {
    if (generatedCode.html || generatedCode.css || generatedCode.js) {
      const validation = CodeValidator.validateAllCode(generatedCode)
      setValidationResult(validation)
      setShowValidation(true)
    }
  }

  const handleHistoryItemClick = (index: number) => {
    const historyCode = goToHistory(index)
    if (historyCode) {
      setGeneratedCode(historyCode)
    }
  }

  return (
    <ThemeProvider>
      <div className="app">
        <ChatPanel 
          messages={messages}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          error={error}
          onShowShortcuts={() => setShowShortcuts(true)}
        />
        <CodePanel 
          code={generatedCode}
          onCodeChange={handleCodeChange}
          onValidate={handleValidateCode}
          onCodeHistory={(direction) => {
            if (direction === 'prev' && canUndo) {
              const previousCode = undo();
              if (previousCode) setGeneratedCode(previousCode);
            } else if (direction === 'next' && canRedo) {
              const nextCode = redo();
              if (nextCode) setGeneratedCode(nextCode);
            }
          }}
          canUndo={canUndo}
          canRedo={canRedo}
          onShowHistory={() => setShowHistory(true)}
        />
        {showValidation && validationResult && (
          <ValidationPanel 
            validationResult={validationResult}
            onClose={() => setShowValidation(false)}
          />
        )}
        <KeyboardShortcuts 
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
        />
        <HistoryPanel
          history={history}
          currentIndex={currentIndex}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={() => {
            const previousCode = undo();
            if (previousCode) setGeneratedCode(previousCode);
          }}
          onRedo={() => {
            const nextCode = redo();
            if (nextCode) setGeneratedCode(nextCode);
          }}
          onGoToHistory={handleHistoryItemClick}
          onClearHistory={clearHistory}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
        />
      </div>
    </ThemeProvider>
  )
}

export default App