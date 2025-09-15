import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function ChatPanel({ messages, onSendMessage, isLoading }) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 120) + "px";
    }
  };

  useEffect(() => {
    autoResize();
  }, [inputValue]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Also scroll when loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">⚡</div>
            <div>
              <h1>Bolt Clone</h1>
              <p className="header-subtitle">
                AI Code Generator - Describe what you want to build!
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <div className="welcome-icon">🚀</div>
            <h3>Welcome to Bolt Clone!</h3>
            <p>Start by describing what you'd like to build.</p>

            <div className="examples-section">
              <h4>💡 Examples:</h4>
              <div className="example-grid">
                <div className="example-item">📝 Create a todo app</div>
                <div className="example-item">🧮 Build a calculator</div>
                <div className="example-item">🌐 Make a landing page</div>
                <div className="example-item">🌤️ Create a weather widget</div>
              </div>
            </div>

            <div className="test-mode-section">
              <h4>🧪 Test Mode:</h4>
              <div className="test-examples">
                <code>"test: create todo app"</code> - for testing
                <br />
                <code>"test: add delete functionality"</code> - for updates
              </div>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`message-wrapper ${message.type}`}>
            <div className={`message ${message.type}`}>
              <div className="message-avatar">
                {message.type === "user" ? "👤" : "🤖"}
              </div>
              <div className="message-content">{message.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message-wrapper assistant">
            <div className="message assistant loading-message">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="loading">
                  <div className="spinner"></div>
                  Generating code...
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="input-form">
          <div className="input-wrapper">
            <div className="input-field-container">
              <textarea
                ref={textareaRef}
                className="chat-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to build or how to modify the existing code..."
                rows="1"
                disabled={isLoading}
                maxLength="1000"
              />
              <div className="input-actions">
                <div className="character-count">
                  {inputValue.length > 0 && (
                    <span
                      className={
                        inputValue.length > 500
                          ? "count-warning"
                          : "count-normal"
                      }
                    >
                      {inputValue.length}/1000
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  className={`send-button ${
                    inputValue.trim() && !isLoading ? "active" : ""
                  }`}
                  disabled={!inputValue.trim() || isLoading}
                  title="Send message (Enter)"
                >
                  {isLoading ? (
                    <div className="button-spinner"></div>
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="input-hints">
            <span className="hint">💡 Tip: Use Shift+Enter for new lines</span>
            <span className="hint">⚡ Press Enter to send</span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatPanel;
