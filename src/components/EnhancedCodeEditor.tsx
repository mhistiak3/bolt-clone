import { useState, useEffect, useRef } from 'react'
import { Highlight, themes } from 'prism-react-renderer'
import { Copy, Check, Search, Replace, Settings, Maximize2, Minimize2 } from 'lucide-react'

interface EnhancedCodeEditorProps {
  code: string
  language: string
  onCodeChange?: (code: string) => void
  readOnly?: boolean
  showLineNumbers?: boolean
  showMinimap?: boolean
  theme?: 'dark' | 'light'
  fontSize?: number
  tabSize?: number
  wordWrap?: boolean
  autoComplete?: boolean
  onCopy?: () => void
}

export default function EnhancedCodeEditor({
  code,
  language,
  onCodeChange,
  readOnly = false,
  showLineNumbers = true,
  showMinimap = false,
  theme = 'dark',
  fontSize = 14,
  tabSize = 2,
  wordWrap = true,
  autoComplete = true,
  onCopy
}: EnhancedCodeEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [replaceTerm, setReplaceTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showReplace, setShowReplace] = useState(false)
  const [searchResults, setSearchResults] = useState<number[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const [settings, setSettings] = useState({
    fontSize,
    tabSize,
    wordWrap,
    autoComplete,
    showLineNumbers,
    showMinimap
  })
  const [showSettings, setShowSettings] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [code])

  // Search functionality
  useEffect(() => {
    if (searchTerm) {
      const lines = code.split('\n')
      const results: number[] = []
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push(index)
        }
      })
      setSearchResults(results)
      setCurrentSearchIndex(0)
    } else {
      setSearchResults([])
    }
  }, [searchTerm, code])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault()
            setShowSearch(true)
            break
          case 'h':
            e.preventDefault()
            setShowReplace(true)
            break
          case 's':
            e.preventDefault()
            if (onCodeChange && textareaRef.current) {
              onCodeChange(textareaRef.current.value)
            }
            break
          case 'c':
            if (e.shiftKey) {
              e.preventDefault()
              handleCopy()
            }
            break
          case 'Enter':
            if (showSearch) {
              e.preventDefault()
              handleNextSearch()
            }
            break
        }
      }
      
      if (e.key === 'Escape') {
        setShowSearch(false)
        setShowReplace(false)
        setShowSettings(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showSearch, showReplace, onCodeChange])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      if (onCopy) onCopy()
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const handleNextSearch = () => {
    if (searchResults.length > 0) {
      const nextIndex = (currentSearchIndex + 1) % searchResults.length
      setCurrentSearchIndex(nextIndex)
      // Scroll to the found line
      const lineNumber = searchResults[nextIndex]
      if (textareaRef.current) {
        const lines = code.split('\n')
        const textBeforeLine = lines.slice(0, lineNumber).join('\n')
        const position = textBeforeLine.length + 1
        textareaRef.current.setSelectionRange(position, position)
        textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  const handleReplace = () => {
    if (searchTerm && replaceTerm && onCodeChange) {
      const newCode = code.replace(new RegExp(searchTerm, 'gi'), replaceTerm)
      onCodeChange(newCode)
    }
  }

  const handleReplaceAll = () => {
    if (searchTerm && replaceTerm && onCodeChange) {
      const newCode = code.replace(new RegExp(searchTerm, 'gi'), replaceTerm)
      onCodeChange(newCode)
      setSearchTerm('')
      setReplaceTerm('')
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const updateSettings = (newSettings: Partial<typeof settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  const getTheme = () => {
    return theme === 'dark' ? themes.vsDark : themes.vsLight
  }

  const getLanguage = (lang: string) => {
    const languageMap: { [key: string]: string } = {
      'html': 'markup',
      'css': 'css',
      'js': 'javascript',
      'javascript': 'javascript',
      'ts': 'typescript',
      'typescript': 'typescript',
      'json': 'json',
      'xml': 'markup'
    }
    return languageMap[lang.toLowerCase()] || lang
  }

  return (
    <div className={`enhanced-code-editor ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <button
            className="toolbar-button"
            onClick={() => setShowSearch(true)}
            title="Search (Ctrl+F)"
          >
            <Search size={16} />
          </button>
          <button
            className="toolbar-button"
            onClick={() => setShowReplace(true)}
            title="Replace (Ctrl+H)"
          >
            <Replace size={16} />
          </button>
          <button
            className="toolbar-button"
            onClick={handleCopy}
            title="Copy (Ctrl+Shift+C)"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        
        <div className="toolbar-right">
          <button
            className="toolbar-button"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <Settings size={16} />
          </button>
          <button
            className="toolbar-button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Search/Replace Panel */}
      {(showSearch || showReplace) && (
        <div className="search-panel">
          <div className="search-controls">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              autoFocus
            />
            {searchResults.length > 0 && (
              <span className="search-results">
                {currentSearchIndex + 1} of {searchResults.length}
              </span>
            )}
            <button
              className="search-button"
              onClick={handleNextSearch}
              disabled={searchResults.length === 0}
            >
              Next
            </button>
            {showReplace && (
              <>
                <input
                  type="text"
                  placeholder="Replace with..."
                  value={replaceTerm}
                  onChange={(e) => setReplaceTerm(e.target.value)}
                  className="search-input"
                />
                <button
                  className="search-button"
                  onClick={handleReplace}
                  disabled={!searchTerm || !replaceTerm}
                >
                  Replace
                </button>
                <button
                  className="search-button"
                  onClick={handleReplaceAll}
                  disabled={!searchTerm || !replaceTerm}
                >
                  Replace All
                </button>
              </>
            )}
            <button
              className="search-button close"
              onClick={() => {
                setShowSearch(false)
                setShowReplace(false)
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-content">
            <h3>Editor Settings</h3>
            <div className="setting-group">
              <label>Font Size: {settings.fontSize}px</label>
              <input
                type="range"
                min="10"
                max="24"
                value={settings.fontSize}
                onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
              />
            </div>
            <div className="setting-group">
              <label>Tab Size: {settings.tabSize} spaces</label>
              <input
                type="range"
                min="2"
                max="8"
                value={settings.tabSize}
                onChange={(e) => updateSettings({ tabSize: parseInt(e.target.value) })}
              />
            </div>
            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={settings.wordWrap}
                  onChange={(e) => updateSettings({ wordWrap: e.target.checked })}
                />
                Word Wrap
              </label>
            </div>
            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={settings.showLineNumbers}
                  onChange={(e) => updateSettings({ showLineNumbers: e.target.checked })}
                />
                Show Line Numbers
              </label>
            </div>
            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={settings.autoComplete}
                  onChange={(e) => updateSettings({ autoComplete: e.target.checked })}
                />
                Auto Complete
              </label>
            </div>
            <button
              className="settings-close"
              onClick={() => setShowSettings(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Code Editor */}
      <div className="editor-container" ref={editorRef}>
        {readOnly ? (
          <div className="code-display">
            <Highlight
              theme={getTheme()}
              code={code}
              language={getLanguage(language)}
            >
              {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <pre className={className} style={style}>
                  {tokens.map((line, i) => (
                    <div key={i} {...getLineProps({ line })}>
                      {settings.showLineNumbers && (
                        <span className="line-number">{i + 1}</span>
                      )}
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </div>
                  ))}
                </pre>
              )}
            </Highlight>
          </div>
        ) : (
          <div className="code-input-container">
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => onCodeChange?.(e.target.value)}
              className="code-textarea"
              style={{
                fontSize: `${settings.fontSize}px`,
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                lineHeight: '1.5',
                tabSize: settings.tabSize,
                whiteSpace: settings.wordWrap ? 'pre-wrap' : 'pre',
                overflow: settings.wordWrap ? 'visible' : 'auto'
              }}
              spellCheck={false}
              placeholder={`Enter your ${language} code here...`}
            />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="editor-status-bar">
        <span className="status-item">
          {language.toUpperCase()}
        </span>
        <span className="status-item">
          {code.split('\n').length} lines
        </span>
        <span className="status-item">
          {code.length} characters
        </span>
        {searchResults.length > 0 && (
          <span className="status-item">
            {searchResults.length} matches
          </span>
        )}
      </div>
    </div>
  )
}
