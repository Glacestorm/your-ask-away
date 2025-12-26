import { useState, useCallback, useRef, useEffect } from 'react';

// === ERROR TIPADO KB ===
export interface NavigationHistoryError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface NavigationHistoryResult {
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => string | null;
  goForward: () => string | null;
  push: (section: string) => void;
  current: string | null;
  // === KB ADDITIONS ===
  error: NavigationHistoryError | null;
  lastRefresh: Date | null;
  clearError: () => void;
}

export function useNavigationHistory(initialSection?: string): NavigationHistoryResult {
  // Use refs to avoid stale closures
  const historyRef = useRef<string[]>(initialSection ? [initialSection] : []);
  const currentIndexRef = useRef(initialSection ? 0 : -1);
  const isNavigatingRef = useRef(false);
  
  // State for triggering re-renders
  const [, forceUpdate] = useState(0);
  
  // === ESTADO KB ===
  const [error] = useState<NavigationHistoryError | null>(null);
  const [lastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => {}, []);

  const triggerUpdate = useCallback(() => {
    forceUpdate(prev => prev + 1);
  }, []);

  const push = useCallback((section: string) => {
    // Don't add to history if we're navigating via back/forward
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    const currentHistory = historyRef.current;
    const currentIdx = currentIndexRef.current;

    // Don't add if it's the same as current
    if (currentHistory[currentIdx] === section) {
      return;
    }

    // Remove any forward history when pushing new section
    const newHistory = currentHistory.slice(0, currentIdx + 1);
    newHistory.push(section);
    
    historyRef.current = newHistory;
    currentIndexRef.current = currentIdx + 1;
    
    triggerUpdate();
  }, [triggerUpdate]);

  const goBack = useCallback(() => {
    const currentIdx = currentIndexRef.current;
    if (currentIdx <= 0) return null;
    
    isNavigatingRef.current = true;
    const newIndex = currentIdx - 1;
    currentIndexRef.current = newIndex;
    
    triggerUpdate();
    return historyRef.current[newIndex];
  }, [triggerUpdate]);

  const goForward = useCallback(() => {
    const currentIdx = currentIndexRef.current;
    const historyLength = historyRef.current.length;
    
    if (currentIdx >= historyLength - 1) return null;
    
    isNavigatingRef.current = true;
    const newIndex = currentIdx + 1;
    currentIndexRef.current = newIndex;
    
    triggerUpdate();
    return historyRef.current[newIndex];
  }, [triggerUpdate]);

  // Computed values from refs
  const canGoBack = currentIndexRef.current > 0;
  const canGoForward = currentIndexRef.current < historyRef.current.length - 1;
  const current = currentIndexRef.current >= 0 ? historyRef.current[currentIndexRef.current] : null;

  return {
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    push,
    current,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError,
  };
}
