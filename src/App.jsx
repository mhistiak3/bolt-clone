import { useState, useRef, useEffect } from 'react'
import ChatPanel from './components/ChatPanel'
import CodePanel from './components/CodePanel'

function App() {
  const [messages, setMessages] = useState([])
  const [generatedCode, setGeneratedCode] = useState({
    html: '',
    css: '',
    js: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async (message) => {
    setIsLoading(true)
    
    // Add user message to chat
    const newMessages = [...messages, { type: 'user', content: message }]
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

      const data = await response.json()

      if (data.success) {
        console.log('Received data from API:', data)
        
        // Update generated code - only update if new code exists, otherwise keep previous
        const newCode = {
          html: data.code.html || generatedCode.html,
          css: data.code.css || generatedCode.css,
          js: data.code.js || generatedCode.js
        }
        
        console.log('Updating code:', newCode)
        setGeneratedCode(newCode)

        // Add assistant response
        setMessages([...newMessages, { 
          type: 'assistant', 
          content: data.explanation || 'Code generated successfully!' 
        }])
      } else {
        console.error('API error:', data.error)
        setMessages([...newMessages, { 
          type: 'assistant', 
          content: data.error || 'Sorry, there was an error generating the code. Please try again.' 
        }])
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages([...newMessages, { 
        type: 'assistant', 
        content: 'Sorry, there was an error connecting to the server. Please try again.' 
      }])
    }

    setIsLoading(false)
  }

  return (
    <div className="app">
      <ChatPanel 
        messages={messages}
        onSendMessage={sendMessage}
        isLoading={isLoading}
      />
      <CodePanel 
        code={generatedCode}
        onCodeChange={setGeneratedCode}
      />
    </div>
  )
}

export default App