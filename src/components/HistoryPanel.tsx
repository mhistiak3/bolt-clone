import React from 'react';
import { History, Undo, Redo, Trash2, Clock, MessageSquare } from 'lucide-react';
import { CodeHistory } from '../types';

interface HistoryPanelProps {
  history: CodeHistory[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onGoToHistory: (index: number) => void;
  onClearHistory: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  currentIndex,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onGoToHistory,
  onClearHistory,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getCodePreview = (code: { html: string; css: string; js: string }) => {
    const totalLength = code.html.length + code.css.length + code.js.length;
    if (totalLength === 0) return 'Empty';
    
    const parts = [];
    if (code.html) parts.push('HTML');
    if (code.css) parts.push('CSS');
    if (code.js) parts.push('JS');
    
    return parts.join(', ') + ` (${totalLength} chars)`;
  };

  return (
    <div className="history-overlay" onClick={onClose}>
      <div className="history-panel" onClick={(e) => e.stopPropagation()}>
        <div className="history-header">
          <div className="history-title">
            <History size={20} />
            <h3>Code History</h3>
            <span className="history-count">({history.length})</span>
          </div>
          <div className="history-actions">
            <button
              className="history-action-btn"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo size={16} />
            </button>
            <button
              className="history-action-btn"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
            >
              <Redo size={16} />
            </button>
            <button
              className="history-action-btn danger"
              onClick={onClearHistory}
              title="Clear History"
            >
              <Trash2 size={16} />
            </button>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="history-content">
          {history.length === 0 ? (
            <div className="history-empty">
              <History size={48} className="empty-icon" />
              <p>No code history yet</p>
              <p className="empty-subtitle">Start generating code to see your history</p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((item, index) => (
                <div
                  key={item.id}
                  className={`history-item ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => onGoToHistory(index)}
                >
                  <div className="history-item-header">
                    <div className="history-item-time">
                      <Clock size={14} />
                      <span>{formatTime(item.timestamp)}</span>
                      <span className="history-item-date">{formatDate(item.timestamp)}</span>
                    </div>
                    <div className="history-item-index">
                      #{index + 1}
                    </div>
                  </div>
                  
                  <div className="history-item-message">
                    <MessageSquare size={14} />
                    <span>{item.message || 'Code generated'}</span>
                  </div>
                  
                  <div className="history-item-preview">
                    {getCodePreview(item.code)}
                  </div>
                  
                  {index === currentIndex && (
                    <div className="history-item-current">
                      Current Version
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;
