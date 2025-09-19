import React from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { CodeValidationResult } from '../types';

interface ValidationPanelProps {
  validationResult: CodeValidationResult | null;
  onClose: () => void;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({ validationResult, onClose }) => {
  if (!validationResult) return null;

  const hasErrors = validationResult.html.errors.length > 0 || 
                   validationResult.css.errors.length > 0 || 
                   validationResult.js.errors.length > 0;

  const hasWarnings = validationResult.html.warnings.length > 0 || 
                     validationResult.css.warnings.length > 0 || 
                     validationResult.js.warnings.length > 0;

  const allErrors = [
    ...validationResult.html.errors.map(e => ({ type: 'HTML', message: e })),
    ...validationResult.css.errors.map(e => ({ type: 'CSS', message: e })),
    ...validationResult.js.errors.map(e => ({ type: 'JavaScript', message: e }))
  ];

  const allWarnings = [
    ...validationResult.html.warnings.map(w => ({ type: 'HTML', message: w })),
    ...validationResult.css.warnings.map(w => ({ type: 'CSS', message: w })),
    ...validationResult.js.warnings.map(w => ({ type: 'JavaScript', message: w }))
  ];

  return (
    <div className="validation-panel">
      <div className="validation-header">
        <div className="validation-title">
          {hasErrors ? (
            <AlertTriangle size={16} className="error-icon" />
          ) : hasWarnings ? (
            <Info size={16} className="warning-icon" />
          ) : (
            <CheckCircle size={16} className="success-icon" />
          )}
          <span>
            {hasErrors ? 'Code Validation Errors' : 
             hasWarnings ? 'Code Validation Warnings' : 
             'Code Validation Passed'}
          </span>
        </div>
        <button className="close-button" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="validation-content">
        {allErrors.length > 0 && (
          <div className="validation-section">
            <h4 className="section-title error-title">
              <AlertTriangle size={14} />
              Errors ({allErrors.length})
            </h4>
            <div className="validation-list">
              {allErrors.map((error, index) => (
                <div key={index} className="validation-item error-item">
                  <span className="error-type">{error.type}:</span>
                  <span className="error-message">{error.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {allWarnings.length > 0 && (
          <div className="validation-section">
            <h4 className="section-title warning-title">
              <Info size={14} />
              Warnings ({allWarnings.length})
            </h4>
            <div className="validation-list">
              {allWarnings.map((warning, index) => (
                <div key={index} className="validation-item warning-item">
                  <span className="warning-type">{warning.type}:</span>
                  <span className="warning-message">{warning.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasErrors && !hasWarnings && (
          <div className="validation-success">
            <CheckCircle size={20} className="success-icon" />
            <p>All code validation checks passed!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationPanel;
