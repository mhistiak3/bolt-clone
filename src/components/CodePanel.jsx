import { useState, useEffect } from 'react'
import { Highlight, themes } from 'prism-react-renderer'
import { Play, Code, Eye, Copy, Check } from 'lucide-react'

function CodePanel({ code, onCodeChange }) {
  const [activeTab, setActiveTab] = useState('preview')
  const [activeCodeTab, setActiveCodeTab] = useState('html')
  const [copiedTab, setCopiedTab] = useState('')

  // Debug logging
  useEffect(() => {
    console.log('CodePanel received code:', code)
  }, [code])

  // Copy to clipboard function
  const copyToClipboard = async (codeContent, tabName) => {
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

  const handleCodeEdit = (language, newCode) => {
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
          </div>
          
          <div className="code-content">
            {code[activeCodeTab] ? (
              <Highlight
                theme={themes.vsDark}
                code={code[activeCodeTab]}
                language={codeTabs.find(t => t.id === activeCodeTab)?.language || 'html'}
              >
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre
                    className={className}
                    style={{
                      ...style,
                      padding: '1rem',
                      margin: 0,
                      background: '#0f0f0f',
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      overflow: 'auto',
                      height: '100%'
                    }}
                  >
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line, key: i })}>
                        <span style={{ 
                          color: '#666', 
                          marginRight: '1rem', 
                          userSelect: 'none',
                          minWidth: '2rem',
                          display: 'inline-block',
                          textAlign: 'right'
                        }}>
                          {i + 1}
                        </span>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token, key })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
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
    </div>
  )
}

export default CodePanel