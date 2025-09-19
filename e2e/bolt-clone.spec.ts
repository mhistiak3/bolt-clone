import { test, expect } from '@playwright/test'

test.describe('Bolt Clone E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API responses
    await page.route('**/api/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: {
            html: '<div class="container"><h1>Hello World</h1><p>This is a test app</p></div>',
            css: '.container { padding: 20px; text-align: center; } h1 { color: #333; }',
            js: 'console.log("Hello World!"); document.querySelector("h1").addEventListener("click", () => alert("Clicked!"));'
          }
        })
      })
    })

    await page.route('**/api/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'ok',
          gemini: {
            model: 'gemini-1.5-flash',
            running: true,
            apiKey: 'configured'
          }
        })
      })
    })

    await page.goto('http://localhost:5173')
  })

  test('should load the application', async ({ page }) => {
    await expect(page).toHaveTitle(/Bolt Clone/)
    await expect(page.getByText('Bolt Clone')).toBeVisible()
    await expect(page.getByText('AI-Powered Code Generator')).toBeVisible()
  })

  test('should generate code when user sends a message', async ({ page }) => {
    // Type a message
    await page.fill('textarea[placeholder*="Describe what you want to build"]', 'Create a hello world app')
    
    // Click send button
    await page.click('button[type="submit"]')
    
    // Wait for code to be generated
    await expect(page.getByText('Hello World')).toBeVisible()
    await expect(page.getByText('This is a test app')).toBeVisible()
  })

  test('should switch between preview and code tabs', async ({ page }) => {
    // Generate some code first
    await page.fill('textarea[placeholder*="Describe what you want to build"]', 'Create a hello world app')
    await page.click('button[type="submit"]')
    
    // Wait for code to be generated
    await expect(page.getByText('Hello World')).toBeVisible()
    
    // Switch to code tab
    await page.click('text=Code')
    
    // Check that code tabs are visible
    await expect(page.getByText('HTML')).toBeVisible()
    await expect(page.getByText('CSS')).toBeVisible()
    await expect(page.getByText('JS')).toBeVisible()
  })

  test('should switch between HTML, CSS, and JS code tabs', async ({ page }) => {
    // Generate some code first
    await page.fill('textarea[placeholder*="Describe what you want to build"]', 'Create a hello world app')
    await page.click('button[type="submit"]')
    
    // Wait for code to be generated
    await expect(page.getByText('Hello World')).toBeVisible()
    
    // Switch to code tab
    await page.click('text=Code')
    
    // Test HTML tab
    await page.click('text=HTML')
    await expect(page.getByText('<div class="container">')).toBeVisible()
    
    // Test CSS tab
    await page.click('text=CSS')
    await expect(page.getByText('.container {')).toBeVisible()
    
    // Test JS tab
    await page.click('text=JS')
    await expect(page.getByText('console.log')).toBeVisible()
  })

  test('should toggle theme', async ({ page }) => {
    // Check initial theme
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    
    // Click theme toggle
    await page.click('button[title*="theme"]')
    
    // Check theme changed
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    
    // Toggle back
    await page.click('button[title*="theme"]')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test('should show keyboard shortcuts', async ({ page }) => {
    // Press Ctrl+/
    await page.keyboard.press('Control+/')
    
    // Check that shortcuts panel is visible
    await expect(page.getByText('Keyboard Shortcuts')).toBeVisible()
    await expect(page.getByText('Ctrl+K')).toBeVisible()
    await expect(page.getByText('Focus input')).toBeVisible()
  })

  test('should show history panel', async ({ page }) => {
    // Generate some code first
    await page.fill('textarea[placeholder*="Describe what you want to build"]', 'Create a hello world app')
    await page.click('button[type="submit"]')
    
    // Wait for code to be generated
    await expect(page.getByText('Hello World')).toBeVisible()
    
    // Press Ctrl+H to show history
    await page.keyboard.press('Control+h')
    
    // Check that history panel is visible
    await expect(page.getByText('Code History')).toBeVisible()
  })

  test('should export code', async ({ page }) => {
    // Generate some code first
    await page.fill('textarea[placeholder*="Describe what you want to build"]', 'Create a hello world app')
    await page.click('button[type="submit"]')
    
    // Wait for code to be generated
    await expect(page.getByText('Hello World')).toBeVisible()
    
    // Switch to code tab
    await page.click('text=Code')
    
    // Click export button
    await page.click('button:has-text("Export")')
    
    // Check that export panel is visible
    await expect(page.getByText('Export Project')).toBeVisible()
    await expect(page.getByText('Download as ZIP')).toBeVisible()
  })

  test('should validate code', async ({ page }) => {
    // Generate some code first
    await page.fill('textarea[placeholder*="Describe what you want to build"]', 'Create a hello world app')
    await page.click('button[type="submit"]')
    
    // Wait for code to be generated
    await expect(page.getByText('Hello World')).toBeVisible()
    
    // Switch to code tab
    await page.click('text=Code')
    
    // Click validate button
    await page.click('button:has-text("Validate")')
    
    // Check that validation panel is visible
    await expect(page.getByText('Code Validation')).toBeVisible()
  })

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check that the app is still functional
    await expect(page.getByText('Bolt Clone')).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.getByText('Bolt Clone')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.getByText('Bolt Clone')).toBeVisible()
  })

  test('should handle errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/generate', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error'
        })
      })
    })

    // Try to generate code
    await page.fill('textarea[placeholder*="Describe what you want to build"]', 'Create a hello world app')
    await page.click('button[type="submit"]')
    
    // Check that error message is shown
    await expect(page.getByText(/error/i)).toBeVisible()
  })
})
