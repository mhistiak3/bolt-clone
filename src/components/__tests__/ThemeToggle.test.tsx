import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '../../contexts/ThemeContext'
import ThemeToggle from '../ThemeToggle'

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  )
}

describe('ThemeToggle', () => {
  test('renders theme toggle button', () => {
    renderWithTheme(<ThemeToggle />)
    
    const toggleButton = screen.getByRole('button')
    expect(toggleButton).toBeInTheDocument()
  })

  test('toggles theme when clicked', () => {
    renderWithTheme(<ThemeToggle />)
    
    const toggleButton = screen.getByRole('button')
    
    // Initial state should be dark theme
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    
    // Click to toggle to light theme
    fireEvent.click(toggleButton)
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    
    // Click again to toggle back to dark theme
    fireEvent.click(toggleButton)
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })

  test('persists theme preference in localStorage', () => {
    renderWithTheme(<ThemeToggle />)
    
    const toggleButton = screen.getByRole('button')
    
    // Toggle to light theme
    fireEvent.click(toggleButton)
    expect(localStorage.getItem('theme')).toBe('light')
    
    // Toggle back to dark theme
    fireEvent.click(toggleButton)
    expect(localStorage.getItem('theme')).toBe('dark')
  })
})
