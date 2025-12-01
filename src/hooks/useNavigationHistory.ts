import { useState, useCallback, useRef, useEffect } from 'react';

interface NavigationHistoryResult {
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => string | null;
  goForward: () => string | null;
  push: (section: string) => void;
  current: string | null;
}

export function useNavigationHistory(initialSection?: string): NavigationHistoryResult {
  const [history, setHistory] = useState<string[]>(initialSection ? [initialSection] : []);
  const [currentIndex, setCurrentIndex] = useState(initialSection ? 0 : -1);
  const isNavigating = useRef(false);

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1;
  const current = currentIndex >= 0 ? history[currentIndex] : null;

  const push = useCallback((section: string) => {
    // Don't add to history if we're navigating via back/forward
    if (isNavigating.current) {
      isNavigating.current = false;
      return;
    }

    // Don't add if it's the same as current
    if (history[currentIndex] === section) {
      return;
    }

    setHistory(prev => {
      // Remove any forward history when pushing new section
      const newHistory = prev.slice(0, currentIndex + 1);
      return [...newHistory, section];
    });
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex, history]);

  const goBack = useCallback(() => {
    if (!canGoBack) return null;
    isNavigating.current = true;
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    return history[newIndex];
  }, [canGoBack, currentIndex, history]);

  const goForward = useCallback(() => {
    if (!canGoForward) return null;
    isNavigating.current = true;
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    return history[newIndex];
  }, [canGoForward, currentIndex, history]);

  return {
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    push,
    current,
  };
}
