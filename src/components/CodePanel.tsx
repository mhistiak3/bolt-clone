import { useState, useEffect } from 'react'
import { Highlight, themes } from 'prism-react-renderer'
import { Play, Code, Eye, Copy, Check, Shield, Download, History, Undo, Redo } from 'lucide-react'
import { CodePanelProps, GeneratedCode } from '../types'
import ExportPanel from './ExportPanel'
import EnhancedCodeEditor from './EnhancedCodeEditor'
import CollaborationPanel from './CollaborationPanel'
import { useCollaboration } from '../hooks/useCollaboration'

interface CodePanelPropsWithHistory extends CodePanelProps {
  onShowHistory?: () => void;
}

function CodePanel({ code, onCodeChange, onCodeHistory, canUndo, canRedo, onValidate, onShowHistory }: CodePanelPropsWithHistory) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview')
  const [activeCodeTab, setActiveCodeTab] = useState<'html' | 'css' | 'js'>('html')
  const [copiedTab, setCopiedTab] = useState<string>('')
  const [showExport, setShowExport] = useState<boolean>(false)
  const [collaborationEnabled, setCollaborationEnabled] = useState(false)

  // Collaboration hook
  const collaboration = useCollaboration({
    roomId: 'default',
    userId: `user_${Math.random().toString(36).substring(2, 8)}`,
    userName: 'Anonymous User',
    onCodeChange: (newCode) => {
      if (onCodeChange) {
        onCodeChange({
          ...code,
          [activeCodeTab]: newCode
        })
      }
    },
    onUsersChange: (users) => {
      console.log('Collaboration users updated:', users)
    }
  })

  // Debug logging
  useEffect(() => {
    console.log('CodePanel received code:', code)
  }, [code])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setActiveTab('preview');
            break;
          case '2':
            e.preventDefault();
            setActiveTab('code');
            break;
          case 'e':
            e.preventDefault();
            if (onValidate) {
              onValidate();
            }
            break;
          case 's':
            e.preventDefault();
            setShowExport(true);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onValidate])

  // Copy to clipboard function
  const copyToClipboard = async (codeContent: string, tabName: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(codeContent)
      setCopiedTab(tabName)
      setTimeout(() => setCopiedTab(''), 2000) // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = codeContent
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedTab(tabName)
      setTimeout(() => setCopiedTab(''), 2000)
    }
  }

  // Create preview HTML
  const previewHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
      <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>

  <style>
    body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    ${code.css || ''}
  </style>
</head>
<body>
  ${code.html || ''}
  <script>
    try {
      ${code.js || ''}
    } catch (error) {
      console.error('JavaScript error:', error);
    }
  </script>
</body>
</html>`

  const tabs = [
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'code', label: 'Code', icon: Code },
  ]

  const codeTabs = [
    { id: 'html', label: 'HTML', language: 'html' },
    { id: 'css', label: 'CSS', language: 'css' },
    { id: 'js', label: 'JavaScript', language: 'javascript' },
  ]

  const handleCodeEdit = (language: keyof GeneratedCode, newCode: string): void => {
    onCodeChange({
      ...code,
      [language]: newCode
    })
  }

  return (
    <div className="code-panel">
      <div className="code-tabs">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`code-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} style={{ marginRight: '0.5rem' }} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'preview' && (
        <div className="preview-container">
          {code.html || code.css || code.js ? (
            <iframe
              className="preview-iframe"
              srcDoc={previewHtml}
              title="Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%', 
              color: '#666',
              fontSize: '1.1rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <Play size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>Your generated code will appear here</p>
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Start by describing what you want to build in the chat
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'code' && (
        <div className="code-editor">
          <div className="code-tabs">
            <div className="tab-buttons">
              {codeTabs.map(tab => (
                <button
                  key={tab.id}
                  className={`code-tab ${activeCodeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveCodeTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="code-actions">
              {onCodeHistory && (
                <div className="history-controls">
                  <button
                    className="history-button"
                    onClick={() => onCodeHistory('prev')}
                    disabled={!canUndo}
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo size={14} />
                  </button>
                  <button
                    className="history-button"
                    onClick={() => onCodeHistory('next')}
                    disabled={!canRedo}
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo size={14} />
                  </button>
                  {onShowHistory && (
                    <button
                      className="history-button"
                      onClick={onShowHistory}
                      title="Show History (Ctrl+H)"
                    >
                      <History size={14} />
                    </button>
                  )}
                </div>
              )}
              <button
                className="export-button"
                onClick={() => setShowExport(true)}
                title="Export project"
              >
                <Download size={14} />
                Export
              </button>
              {onValidate && (
                <button
                  className="validate-button"
                  onClick={onValidate}
                  title="Validate code"
                >
                  <Shield size={14} />
                  Validate
                </button>
              )}
              {code[activeCodeTab] && (
                <button
                  className="copy-button"
                  onClick={() => copyToClipboard(code[activeCodeTab], activeCodeTab)}
                  title={`Copy ${activeCodeTab.toUpperCase()} code`}
                >
                  {copiedTab === activeCodeTab ? (
                    <><Check size={14} /> Copied!</>
                  ) : (
                    <><Copy size={14} /> Copy</>
                  )}
                </button>
              )}
              <CollaborationPanel
                isConnected={collaboration.isConnected}
                users={collaboration.users}
                isTyping={collaboration.isTyping}
                typingUsers={collaboration.typingUsers}
                onInviteUser={() => {
                  // TODO: Implement invite functionality
                  console.log('Invite user clicked')
                }}
                onSettings={() => {
                  setCollaborationEnabled(!collaborationEnabled)
                }}
                onShareRoom={() => {
                  // TODO: Implement share room functionality
                  console.log('Share room clicked')
                }}
              />
            </div>
          </div>
          
          <div className="code-content">
            {code[activeCodeTab] ? (
              <EnhancedCodeEditor
                code={code[activeCodeTab]}
                language={codeTabs.find(t => t.id === activeCodeTab)?.language || 'html'}
                onCodeChange={(newCode) => {
                  if (onCodeChange) {
                    onCodeChange({
                      ...code,
                      [activeCodeTab]: newCode
                    })
                  }
                  // Send to collaboration if enabled
                  if (collaborationEnabled) {
                    collaboration.sendCodeChange(newCode)
                  }
                }}
                readOnly={false}
                showLineNumbers={true}
                theme="dark"
                fontSize={14}
                tabSize={2}
                wordWrap={true}
                autoComplete={true}
                onCopy={() => copyToClipboard(code[activeCodeTab], activeCodeTab)}
              />
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#666'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <Code size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>No {activeCodeTab.toUpperCase()} code generated yet</p>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Start chatting to generate some code!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <ExportPanel 
        code={code}
        isOpen={showExport}
        onClose={() => setShowExport(false)}
      />
    </div>
  )
}

export default CodePanel