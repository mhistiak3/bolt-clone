import { validateHTML, validateCSS, validateJS, validateCode } from '../validation'

describe('Code Validation', () => {
  describe('validateHTML', () => {
    test('validates correct HTML', () => {
      const validHTML = '<div><h1>Hello</h1></div>'
      const result = validateHTML(validHTML)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('detects unclosed tags', () => {
      const invalidHTML = '<div><h1>Hello</h1>'
      const result = validateHTML(invalidHTML)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    test('detects malformed HTML', () => {
      const invalidHTML = '<div><h1>Hello</h1></div></div>'
      const result = validateHTML(invalidHTML)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validateCSS', () => {
    test('validates correct CSS', () => {
      const validCSS = '.container { color: red; margin: 10px; }'
      const result = validateCSS(validCSS)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('detects unclosed braces', () => {
      const invalidCSS = '.container { color: red; margin: 10px;'
      const result = validateCSS(invalidCSS)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    test('detects malformed selectors', () => {
      const invalidCSS = '.container { color: red; } . { margin: 10px; }'
      const result = validateCSS(invalidCSS)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validateJS', () => {
    test('validates correct JavaScript', () => {
      const validJS = 'function test() { return "hello"; }'
      const result = validateJS(validJS)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('detects syntax errors', () => {
      const invalidJS = 'function test() { return "hello";'
      const result = validateJS(invalidJS)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    test('detects unclosed brackets', () => {
      const invalidJS = 'if (true) { console.log("test");'
      const result = validateJS(invalidJS)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validateCode', () => {
    test('validates complete code set', () => {
      const code = {
        html: '<div><h1>Hello</h1></div>',
        css: '.container { color: red; }',
        js: 'function test() { return "hello"; }'
      }
      
      const result = validateCode(code)
      
      expect(result.html.isValid).toBe(true)
      expect(result.css.isValid).toBe(true)
      expect(result.js.isValid).toBe(true)
    })

    test('handles empty code', () => {
      const code = {
        html: '',
        css: '',
        js: ''
      }
      
      const result = validateCode(code)
      
      expect(result.html.isValid).toBe(true)
      expect(result.css.isValid).toBe(true)
      expect(result.js.isValid).toBe(true)
    })

    test('detects errors in multiple files', () => {
      const code = {
        html: '<div><h1>Hello</h1>',
        css: '.container { color: red;',
        js: 'function test() { return "hello";'
      }
      
      const result = validateCode(code)
      
      expect(result.html.isValid).toBe(false)
      expect(result.css.isValid).toBe(false)
      expect(result.js.isValid).toBe(false)
    })
  })
})
