import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

function ChatPanel({ messages, onSendMessage, isLoading }) {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Also scroll when loading state changes
  useEffect(() => {
    scrollToBottom()
  }, [isLoading])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim())
      setInputValue('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h1>Bolt Clone</h1>
        <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.25rem' }}>
          AI Code Generator - Describe what you want to build!
        </p>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 && (
          <div style={{ 
            color: '#666', 
            textAlign: 'center', 
            margin: 'auto',
            maxWidth: '300px'
          }}>
            <p>Welcome! Start by describing what you'd like to build.</p>
            <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
              <p><strong>Examples:</strong></p>
              <ul style={{ textAlign: 'left', marginTop: '0.5rem' }}>
                <li>• "Create a todo app"</li>
                <li>• "Build a calculator"</li>
                <li>• "Make a simple landing page"</li>
                <li>• "Create a weather widget"</li>
              </ul>
              <div style={{ marginTop: '1rem', padding: '10px', background: '#2a2a2a', borderRadius: '4px' }}>
                <p><strong>Test Mode:</strong></p>
                <ul style={{ textAlign: 'left', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                  <li>• "test: create todo app" (for testing)</li>
                  <li>• "test: add delete functionality" (for updates)</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            {message.content}
          </div>
        ))}
        
        {isLoading && (
          <div className="message assistant">
            <div className="loading">
              <div className="spinner"></div>
              Generating code...
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container">
        <form onSubmit={handleSubmit}>
          <textarea
            className="chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build or how to modify the existing code..."
            rows="3"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={!inputValue.trim() || isLoading}
          >
            <Send size={16} style={{ marginRight: '0.5rem' }} />
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatPanel