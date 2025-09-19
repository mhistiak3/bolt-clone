import { useState, useCallback, useRef } from 'react';
import { GeneratedCode, CodeHistory } from '../types';

interface UseCodeHistoryReturn {
  history: CodeHistory[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  addToHistory: (code: GeneratedCode, message: string) => void;
  undo: () => GeneratedCode | null;
  redo: () => GeneratedCode | null;
  goToHistory: (index: number) => GeneratedCode | null;
  clearHistory: () => void;
  getHistoryItem: (index: number) => CodeHistory | null;
}

export const useCodeHistory = (maxHistorySize: number = 50): UseCodeHistoryReturn => {
  const [history, setHistory] = useState<CodeHistory[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const lastSavedRef = useRef<GeneratedCode | null>(null);

  const addToHistory = useCallback((code: GeneratedCode, message: string) => {
    // Don't add if it's the same as the last saved code
    if (lastSavedRef.current && 
        JSON.stringify(lastSavedRef.current) === JSON.stringify(code)) {
      return;
    }

    const newHistoryItem: CodeHistory = {
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      code: { ...code },
      message,
      timestamp: new Date()
    };

    setHistory(prevHistory => {
      const newHistory = [...prevHistory];
      
      // Remove any history after current index (when branching)
      if (currentIndex < newHistory.length - 1) {
        newHistory.splice(currentIndex + 1);
      }
      
      // Add new item
      newHistory.push(newHistoryItem);
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
        setCurrentIndex(prev => prev - 1);
      }
      
      return newHistory;
    });

    setCurrentIndex(prev => {
      const newIndex = Math.min(prev + 1, maxHistorySize - 1);
      return newIndex;
    });

    lastSavedRef.current = { ...code };
  }, [currentIndex, maxHistorySize]);

  const undo = useCallback((): GeneratedCode | null => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      const historyItem = history[newIndex];
      return historyItem ? { ...historyItem.code } : null;
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback((): GeneratedCode | null => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      const historyItem = history[newIndex];
      return historyItem ? { ...historyItem.code } : null;
    }
    return null;
  }, [currentIndex, history]);

  const goToHistory = useCallback((index: number): GeneratedCode | null => {
    if (index >= 0 && index < history.length) {
      setCurrentIndex(index);
      const historyItem = history[index];
      return historyItem ? { ...historyItem.code } : null;
    }
    return null;
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
    lastSavedRef.current = null;
  }, []);

  const getHistoryItem = useCallback((index: number): CodeHistory | null => {
    return history[index] || null;
  }, [history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    history,
    currentIndex,
    canUndo,
    canRedo,
    addToHistory,
    undo,
    redo,
    goToHistory,
    clearHistory,
    getHistoryItem
  };
};
