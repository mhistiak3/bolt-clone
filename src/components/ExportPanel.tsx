import React, { useState } from 'react';
import { Download, FileText, Code, Palette, Package, Copy, Check } from 'lucide-react';
import { GeneratedCode } from '../types';
import { CodeExporter } from '../utils/export';

interface ExportPanelProps {
  code: GeneratedCode;
  isOpen: boolean;
  onClose: () => void;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ code, isOpen, onClose }) => {
  const [projectName, setProjectName] = useState('bolt-project');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = async (content: string, type: string) => {
    try {
      await CodeExporter.copyToClipboard(content);
      setCopiedItem(type);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const exportOptions = [
    {
      id: 'zip',
      title: 'Download as ZIP',
      description: 'Complete project with all files',
      icon: Package,
      action: () => CodeExporter.exportAsZip(code, projectName),
      color: '#3b82f6'
    },
    {
      id: 'html',
      title: 'Download HTML',
      description: 'Complete HTML file with embedded styles and scripts',
      icon: FileText,
      action: () => CodeExporter.exportAsHTML(code, `${projectName}.html`),
      color: '#f59e0b'
    },
    {
      id: 'all',
      title: 'Download All Files',
      description: 'Individual HTML, CSS, and JS files',
      icon: Download,
      action: () => CodeExporter.exportAllFiles(code, projectName),
      color: '#10b981'
    }
  ];

  const copyOptions = [
    {
      id: 'html',
      title: 'Copy HTML',
      content: code.html,
      icon: FileText,
      color: '#f59e0b'
    },
    {
      id: 'css',
      title: 'Copy CSS',
      content: code.css,
      icon: Palette,
      color: '#8b5cf6'
    },
    {
      id: 'js',
      title: 'Copy JavaScript',
      content: code.js,
      icon: Code,
      color: '#f59e0b'
    }
  ];

  return (
    <div className="export-panel-overlay" onClick={onClose}>
      <div className="export-panel" onClick={(e) => e.stopPropagation()}>
        <div className="export-header">
          <h3>Export Project</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="export-content">
          <div className="project-name-section">
            <label htmlFor="project-name">Project Name:</label>
            <input
              id="project-name"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
              className="project-name-input"
            />
          </div>

          <div className="export-section">
            <h4>Download Files</h4>
            <div className="export-options">
              {exportOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    className="export-option"
                    onClick={option.action}
                    style={{ '--option-color': option.color } as React.CSSProperties}
                  >
                    <Icon size={20} />
                    <div className="option-content">
                      <div className="option-title">{option.title}</div>
                      <div className="option-description">{option.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="copy-section">
            <h4>Copy to Clipboard</h4>
            <div className="copy-options">
              {copyOptions.map((option) => {
                const Icon = option.icon;
                const isCopied = copiedItem === option.id;
                return (
                  <button
                    key={option.id}
                    className="copy-option"
                    onClick={() => handleCopy(option.content, option.id)}
                    disabled={!option.content}
                    style={{ '--option-color': option.color } as React.CSSProperties}
                  >
                    <Icon size={16} />
                    <span>{option.title}</span>
                    {isCopied ? (
                      <Check size={14} className="copied-icon" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;
