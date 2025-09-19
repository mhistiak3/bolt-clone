import { renderHook, act } from '@testing-library/react'
import { useCodeHistory } from '../useCodeHistory'

describe('useCodeHistory', () => {
  test('initializes with empty history', () => {
    const { result } = renderHook(() => useCodeHistory())
    
    expect(result.current.history).toHaveLength(0)
    expect(result.current.currentIndex).toBe(-1)
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  test('adds new code to history', () => {
    const { result } = renderHook(() => useCodeHistory())
    
    const code1 = { html: '<div>Hello</div>', css: '', js: '' }
    
    act(() => {
      result.current.addToHistory(code1)
    })
    
    expect(result.current.history).toHaveLength(1)
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  test('supports undo and redo', () => {
    const { result } = renderHook(() => useCodeHistory())
    
    const code1 = { html: '<div>Hello</div>', css: '', js: '' }
    const code2 = { html: '<div>Hello World</div>', css: '', js: '' }
    
    act(() => {
      result.current.addToHistory(code1)
      result.current.addToHistory(code2)
    })
    
    expect(result.current.history).toHaveLength(2)
    expect(result.current.currentIndex).toBe(1)
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)
    
    // Undo
    act(() => {
      result.current.undo()
    })
    
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(true)
    
    // Redo
    act(() => {
      result.current.redo()
    })
    
    expect(result.current.currentIndex).toBe(1)
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)
  })

  test('jumps to specific history item', () => {
    const { result } = renderHook(() => useCodeHistory())
    
    const code1 = { html: '<div>Hello</div>', css: '', js: '' }
    const code2 = { html: '<div>Hello World</div>', css: '', js: '' }
    const code3 = { html: '<div>Hello Universe</div>', css: '', js: '' }
    
    act(() => {
      result.current.addToHistory(code1)
      result.current.addToHistory(code2)
      result.current.addToHistory(code3)
    })
    
    expect(result.current.currentIndex).toBe(2)
    
    // Jump to first item
    act(() => {
      result.current.jumpToHistory(0)
    })
    
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(true)
  })

  test('clears history', () => {
    const { result } = renderHook(() => useCodeHistory())
    
    const code1 = { html: '<div>Hello</div>', css: '', js: '' }
    const code2 = { html: '<div>Hello World</div>', css: '', js: '' }
    
    act(() => {
      result.current.addToHistory(code1)
      result.current.addToHistory(code2)
    })
    
    expect(result.current.history).toHaveLength(2)
    
    act(() => {
      result.current.clearHistory()
    })
    
    expect(result.current.history).toHaveLength(0)
    expect(result.current.currentIndex).toBe(-1)
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  test('limits history size', () => {
    const { result } = renderHook(() => useCodeHistory())
    
    // Add more than 50 items (default limit)
    for (let i = 0; i < 60; i++) {
      act(() => {
        result.current.addToHistory({
          html: `<div>Item ${i}</div>`,
          css: '',
          js: ''
        })
      })
    }
    
    expect(result.current.history).toHaveLength(50)
    expect(result.current.currentIndex).toBe(49)
  })
})
