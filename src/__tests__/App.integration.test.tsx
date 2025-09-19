import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '../contexts/ThemeContext'
import App from '../App'

// Mock the server API
const mockFetch = jest.fn()
global.fetch = mockFetch

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  )
}

describe('App Integration Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  test('renders main application components', () => {
    renderWithTheme(<App />)
    
    // Check if main components are rendered
    expect(screen.getByText('Bolt Clone')).toBeInTheDocument()
    expect(screen.getByText('AI-Powered Code Generator')).toBeInTheDocument()
    expect(screen.getByText('Preview')).toBeInTheDocument()
    expect(screen.getByText('Code')).toBeInTheDocument()
  })

  test('handles code generation flow', async () => {
    const user = userEvent.setup()
    
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        code: {
          html: '<div><h1>Hello World</h1></div>',
          css: '.container { color: blue; }',
          js: 'console.log("Hello World");'
        }
      })
    })

    renderWithTheme(<App />)
    
    // Find the input field and send a message
    const input = screen.getByPlaceholderText('Describe what you want to build...')
    await user.type(input, 'Create a hello world app')
    
    // Submit the form
    const sendButton = screen.getByRole('button', { name: /send/i })
    await user.click(sendButton)
    
    // Wait for the code to be generated and displayed
    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument()
    })
    
    // Verify API was called
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/generate',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    )
  })

  test('handles API errors gracefully', async () => {
    const user = userEvent.setup()
    
    // Mock API error
    mockFetch.mockRejectedValueOnce(new Error('API Error'))

    renderWithTheme(<App />)
    
    const input = screen.getByPlaceholderText('Describe what you want to build...')
    await user.type(input, 'Create a hello world app')
    
    const sendButton = screen.getByRole('button', { name: /send/i })
    await user.click(sendButton)
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  test('theme toggle functionality', async () => {
    const user = userEvent.setup()
    
    renderWithTheme(<App />)
    
    // Initial theme should be dark
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    
    // Find and click theme toggle
    const themeToggle = screen.getByRole('button', { name: /theme/i })
    await user.click(themeToggle)
    
    // Theme should change to light
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })

  test('code tab switching', async () => {
    const user = userEvent.setup()
    
    // Mock code generation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        code: {
          html: '<div><h1>Hello</h1></div>',
          css: '.container { color: blue; }',
          js: 'console.log("Hello");'
        }
      })
    })

    renderWithTheme(<App />)
    
    // Generate some code first
    const input = screen.getByPlaceholderText('Describe what you want to build...')
    await user.type(input, 'Create a hello world app')
    
    const sendButton = screen.getByRole('button', { name: /send/i })
    await user.click(sendButton)
    
    // Wait for code to be generated
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument()
    })
    
    // Switch to code view
    const codeTab = screen.getByText('Code')
    await user.click(codeTab)
    
    // Switch between HTML, CSS, JS tabs
    const htmlTab = screen.getByText('HTML')
    const cssTab = screen.getByText('CSS')
    const jsTab = screen.getByText('JS')
    
    await user.click(htmlTab)
    expect(htmlTab).toHaveClass('active')
    
    await user.click(cssTab)
    expect(cssTab).toHaveClass('active')
    
    await user.click(jsTab)
    expect(jsTab).toHaveClass('active')
  })

  test('keyboard shortcuts work', async () => {
    renderWithTheme(<App />)
    
    // Test Ctrl+K to focus input
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    
    const input = screen.getByPlaceholderText('Describe what you want to build...')
    expect(input).toHaveFocus()
    
    // Test Ctrl+/ to show shortcuts
    fireEvent.keyDown(document, { key: '/', ctrlKey: true })
    
    // Should show shortcuts panel
    await waitFor(() => {
      expect(screen.getByText(/keyboard shortcuts/i)).toBeInTheDocument()
    })
  })
})
