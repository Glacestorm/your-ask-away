import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for deferring non-critical updates
 * Improves INP by prioritizing user interactions
 */
export function useDeferredValue<T>(value: T, delay: number = 100): T {
  const [deferredValue, setDeferredValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDeferredValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return deferredValue;
}

/**
 * Hook for debouncing expensive operations
 * Improves INP by reducing main thread blocking
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for throttling updates
 * Limits the rate of state updates for better performance
 */
export function useThrottle<T>(value: T, interval: number = 100): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecuted.current;

    if (timeSinceLastExecution >= interval) {
      lastExecuted.current = now;
      setThrottledValue(value);
    } else {
      const timerId = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, interval - timeSinceLastExecution);

      return () => clearTimeout(timerId);
    }
  }, [value, interval]);

  return throttledValue;
}

/**
 * Hook for idle callback scheduling
 * Schedules non-critical work during browser idle time
 */
export function useIdleCallback(
  callback: () => void,
  options: { timeout?: number } = {}
): void {
  const { timeout = 1000 } = options;

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(callback, { timeout });
      return () => (window as any).cancelIdleCallback(id);
    } else {
      const id = setTimeout(callback, 1);
      return () => clearTimeout(id);
    }
  }, [callback, timeout]);
}

/**
 * Hook for scheduling updates with React transitions
 * Uses scheduler for non-blocking updates
 */
export function useScheduledUpdate<T>(
  initialValue: T
): [T, (value: T) => void, boolean] {
  const [value, setValue] = useState(initialValue);
  const [isPending, setIsPending] = useState(false);

  const scheduleUpdate = useCallback((newValue: T) => {
    setIsPending(true);
    
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        setValue(newValue);
        setIsPending(false);
      }, { timeout: 500 });
    } else {
      setTimeout(() => {
        setValue(newValue);
        setIsPending(false);
      }, 0);
    }
  }, []);

  return [value, scheduleUpdate, isPending];
}

export default useDeferredValue;
