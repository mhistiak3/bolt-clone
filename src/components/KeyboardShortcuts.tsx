import React from 'react';
import { Command, Keyboard } from 'lucide-react';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      category: 'General',
      items: [
        { keys: ['Ctrl', 'K'], description: 'Focus input field' },
        { keys: ['Ctrl', '/'], description: 'Show this help' },
        { keys: ['Ctrl', 'H'], description: 'Show code history' },
      ]
    },
    {
      category: 'Code Panel',
      items: [
        { keys: ['Ctrl', '1'], description: 'Switch to Preview tab' },
        { keys: ['Ctrl', '2'], description: 'Switch to Code tab' },
        { keys: ['Ctrl', 'E'], description: 'Export project' },
        { keys: ['Ctrl', 'V'], description: 'Validate code' },
      ]
    },
    {
      category: 'Code History',
      items: [
        { keys: ['Ctrl', 'Z'], description: 'Undo last change' },
        { keys: ['Ctrl', 'Y'], description: 'Redo last change' },
        { keys: ['Ctrl', 'H'], description: 'Show history panel' },
      ]
    },
    {
      category: 'Chat',
      items: [
        { keys: ['Enter'], description: 'Send message' },
        { keys: ['Shift', 'Enter'], description: 'New line' },
      ]
    }
  ];

  return (
    <div className="shortcuts-overlay" onClick={onClose}>
      <div className="shortcuts-panel" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-header">
          <div className="shortcuts-title">
            <Keyboard size={20} />
            <h3>Keyboard Shortcuts</h3>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="shortcuts-content">
          {shortcuts.map((category, index) => (
            <div key={index} className="shortcuts-category">
              <h4>{category.category}</h4>
              <div className="shortcuts-list">
                {category.items.map((shortcut, itemIndex) => (
                  <div key={itemIndex} className="shortcut-item">
                    <div className="shortcut-keys">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          <kbd className="key">{key}</kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="key-separator">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    <span className="shortcut-description">{shortcut.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
