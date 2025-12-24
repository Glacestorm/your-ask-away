/**
 * KB 4.5 - Debounce & Throttle
 * Fase 14 - Control optimizado de inputs
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface KBDebounceConfig {
  delay: number;
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export interface KBThrottleConfig {
  interval: number;
  leading?: boolean;
  trailing?: boolean;
}

export interface KBDebouncedState<T> {
  value: T;
  debouncedValue: T;
  isPending: boolean;
}

export interface KBThrottledState<T> {
  value: T;
  throttledValue: T;
  isPending: boolean;
}

// ============================================================================
// DEBOUNCE HOOK
// ============================================================================

/**
 * Hook para debounce de valores
 */
export function useKBDebounce<T>(
  value: T,
  delay: number
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para debounce con estado completo
 */
export function useKBDebounceState<T>(
  initialValue: T,
  config: KBDebounceConfig
): KBDebouncedState<T> & {
  setValue: (value: T) => void;
  flush: () => void;
  cancel: () => void;
} {
  const { delay, leading = false, trailing = true, maxWait } = config;

  const [value, setValueState] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const [isPending, setIsPending] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const lastInvokeTimeRef = useRef<number>(0);
  const pendingValueRef = useRef<T>(initialValue);

  const invoke = useCallback((val: T) => {
    setDebouncedValue(val);
    setIsPending(false);
    lastInvokeTimeRef.current = Date.now();
  }, []);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (maxWaitTimerRef.current) {
      clearTimeout(maxWaitTimerRef.current);
      maxWaitTimerRef.current = null;
    }
    if (isPending) {
      invoke(pendingValueRef.current);
    }
  }, [isPending, invoke]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (maxWaitTimerRef.current) {
      clearTimeout(maxWaitTimerRef.current);
      maxWaitTimerRef.current = null;
    }
    setIsPending(false);
  }, []);

  const setValue = useCallback((newValue: T) => {
    const now = Date.now();
    const isFirstCall = lastCallTimeRef.current === 0;
    lastCallTimeRef.current = now;
    pendingValueRef.current = newValue;

    setValueState(newValue);

    // Leading edge
    if (leading && isFirstCall) {
      invoke(newValue);
      return;
    }

    setIsPending(true);

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set maxWait timer if configured
    if (maxWait && !maxWaitTimerRef.current) {
      maxWaitTimerRef.current = setTimeout(() => {
        maxWaitTimerRef.current = null;
        if (trailing) {
          invoke(pendingValueRef.current);
        }
      }, maxWait);
    }

    // Trailing edge
    if (trailing) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (maxWaitTimerRef.current) {
          clearTimeout(maxWaitTimerRef.current);
          maxWaitTimerRef.current = null;
        }
        invoke(pendingValueRef.current);
      }, delay);
    }
  }, [delay, leading, trailing, maxWait, invoke]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (maxWaitTimerRef.current) clearTimeout(maxWaitTimerRef.current);
    };
  }, []);

  return {
    value,
    debouncedValue,
    isPending,
    setValue,
    flush,
    cancel,
  };
}

/**
 * Hook para debounce de callbacks
 */
export function useKBDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  config: KBDebounceConfig
): T & { flush: () => void; cancel: () => void; isPending: () => boolean } {
  const { delay, leading = false, trailing = true, maxWait } = config;

  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<unknown[] | null>(null);
  const pendingRef = useRef(false);
  const lastCallTimeRef = useRef<number>(0);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const invoke = useCallback(() => {
    if (lastArgsRef.current) {
      callbackRef.current(...lastArgsRef.current);
      lastArgsRef.current = null;
      pendingRef.current = false;
    }
  }, []);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (maxWaitTimerRef.current) {
      clearTimeout(maxWaitTimerRef.current);
      maxWaitTimerRef.current = null;
    }
    invoke();
  }, [invoke]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (maxWaitTimerRef.current) {
      clearTimeout(maxWaitTimerRef.current);
      maxWaitTimerRef.current = null;
    }
    lastArgsRef.current = null;
    pendingRef.current = false;
  }, []);

  const isPending = useCallback(() => pendingRef.current, []);

  const debouncedFn = useCallback((...args: unknown[]) => {
    const now = Date.now();
    const isFirstCall = lastCallTimeRef.current === 0;
    lastCallTimeRef.current = now;
    lastArgsRef.current = args;
    pendingRef.current = true;

    // Leading edge
    if (leading && isFirstCall) {
      invoke();
      return;
    }

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set maxWait timer
    if (maxWait && !maxWaitTimerRef.current) {
      maxWaitTimerRef.current = setTimeout(() => {
        maxWaitTimerRef.current = null;
        if (trailing) {
          invoke();
        }
      }, maxWait);
    }

    // Trailing edge
    if (trailing) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (maxWaitTimerRef.current) {
          clearTimeout(maxWaitTimerRef.current);
          maxWaitTimerRef.current = null;
        }
        invoke();
      }, delay);
    }
  }, [delay, leading, trailing, maxWait, invoke]) as T;

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (maxWaitTimerRef.current) clearTimeout(maxWaitTimerRef.current);
    };
  }, []);

  return Object.assign(debouncedFn, { flush, cancel, isPending });
}

// ============================================================================
// THROTTLE HOOK
// ============================================================================

/**
 * Hook para throttle de valores
 */
export function useKBThrottle<T>(
  value: T,
  interval: number
): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdateRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    if (timeSinceLastUpdate >= interval) {
      setThrottledValue(value);
      lastUpdateRef.current = now;
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      timerRef.current = setTimeout(() => {
        setThrottledValue(value);
        lastUpdateRef.current = Date.now();
      }, interval - timeSinceLastUpdate);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, interval]);

  return throttledValue;
}

/**
 * Hook para throttle con estado completo
 */
export function useKBThrottleState<T>(
  initialValue: T,
  config: KBThrottleConfig
): KBThrottledState<T> & {
  setValue: (value: T) => void;
  flush: () => void;
  cancel: () => void;
} {
  const { interval, leading = true, trailing = true } = config;

  const [value, setValueState] = useState<T>(initialValue);
  const [throttledValue, setThrottledValue] = useState<T>(initialValue);
  const [isPending, setIsPending] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInvokeTimeRef = useRef<number>(0);
  const pendingValueRef = useRef<T>(initialValue);

  const invoke = useCallback((val: T) => {
    setThrottledValue(val);
    setIsPending(false);
    lastInvokeTimeRef.current = Date.now();
  }, []);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (isPending) {
      invoke(pendingValueRef.current);
    }
  }, [isPending, invoke]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPending(false);
  }, []);

  const setValue = useCallback((newValue: T) => {
    const now = Date.now();
    const timeSinceLastInvoke = now - lastInvokeTimeRef.current;
    
    setValueState(newValue);
    pendingValueRef.current = newValue;

    if (timeSinceLastInvoke >= interval) {
      if (leading) {
        invoke(newValue);
      } else {
        setIsPending(true);
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          invoke(pendingValueRef.current);
        }, interval);
      }
    } else {
      setIsPending(true);
      
      if (!timerRef.current && trailing) {
        const remaining = interval - timeSinceLastInvoke;
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          invoke(pendingValueRef.current);
        }, remaining);
      }
    }
  }, [interval, leading, trailing, invoke]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    value,
    throttledValue,
    isPending,
    setValue,
    flush,
    cancel,
  };
}

/**
 * Hook para throttle de callbacks
 */
export function useKBThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  config: KBThrottleConfig
): T & { flush: () => void; cancel: () => void; isPending: () => boolean } {
  const { interval, leading = true, trailing = true } = config;

  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<unknown[] | null>(null);
  const lastInvokeTimeRef = useRef<number>(0);
  const pendingRef = useRef(false);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const invoke = useCallback(() => {
    if (lastArgsRef.current) {
      callbackRef.current(...lastArgsRef.current);
      lastInvokeTimeRef.current = Date.now();
      pendingRef.current = false;
    }
  }, []);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    invoke();
  }, [invoke]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    lastArgsRef.current = null;
    pendingRef.current = false;
  }, []);

  const isPending = useCallback(() => pendingRef.current, []);

  const throttledFn = useCallback((...args: unknown[]) => {
    const now = Date.now();
    const timeSinceLastInvoke = now - lastInvokeTimeRef.current;

    lastArgsRef.current = args;

    if (timeSinceLastInvoke >= interval) {
      if (leading) {
        invoke();
      } else {
        pendingRef.current = true;
        timerRef.current = setTimeout(invoke, interval);
      }
    } else {
      pendingRef.current = true;
      
      if (!timerRef.current && trailing) {
        const remaining = interval - timeSinceLastInvoke;
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          invoke();
        }, remaining);
      }
    }
  }, [interval, leading, trailing, invoke]) as T;

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return Object.assign(throttledFn, { flush, cancel, isPending });
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook para búsqueda con debounce optimizado
 */
export function useKBSearchDebounce(
  initialQuery: string = '',
  delay: number = 300
): {
  query: string;
  debouncedQuery: string;
  setQuery: (query: string) => void;
  isPending: boolean;
  clear: () => void;
} {
  const {
    value: query,
    debouncedValue: debouncedQuery,
    isPending,
    setValue: setQuery,
    cancel,
  } = useKBDebounceState(initialQuery, { delay, trailing: true });

  const clear = useCallback(() => {
    setQuery('');
    cancel();
  }, [setQuery, cancel]);

  return {
    query,
    debouncedQuery,
    setQuery,
    isPending,
    clear,
  };
}

/**
 * Hook para resize con throttle
 */
export function useKBResizeThrottle(
  interval: number = 100
): { width: number; height: number } {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const handleResize = useKBThrottledCallback(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, { interval });

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return dimensions;
}

/**
 * Hook para scroll con throttle
 */
export function useKBScrollThrottle(
  interval: number = 100
): {
  scrollX: number;
  scrollY: number;
  isScrolling: boolean;
} {
  const [scroll, setScroll] = useState({
    scrollX: typeof window !== 'undefined' ? window.scrollX : 0,
    scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
  });
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = useKBThrottledCallback(() => {
    setScroll({
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    });
    setIsScrolling(true);

    if (scrollEndTimerRef.current) {
      clearTimeout(scrollEndTimerRef.current);
    }

    scrollEndTimerRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, { interval });

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    };
  }, [handleScroll]);

  return { ...scroll, isScrolling };
}

/**
 * Hook para input con debounce y validación
 */
export function useKBInputDebounce<T>(
  initialValue: T,
  config: {
    delay?: number;
    validate?: (value: T) => boolean | string;
    transform?: (value: T) => T;
  } = {}
): {
  value: T;
  debouncedValue: T;
  error: string | null;
  isValid: boolean;
  isPending: boolean;
  onChange: (value: T) => void;
  reset: () => void;
} {
  const { delay = 300, validate, transform } = config;

  const [value, setValue] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);

  const debouncedValue = useKBDebounce(value, delay);
  const isPending = value !== debouncedValue;

  const isValid = useMemo(() => {
    if (!validate) return true;
    const result = validate(debouncedValue);
    return result === true;
  }, [debouncedValue, validate]);

  // Validate on debounced value change
  useEffect(() => {
    if (validate) {
      const result = validate(debouncedValue);
      if (typeof result === 'string') {
        setError(result);
      } else {
        setError(null);
      }
    }
  }, [debouncedValue, validate]);

  const onChange = useCallback((newValue: T) => {
    const transformedValue = transform ? transform(newValue) : newValue;
    setValue(transformedValue);
  }, [transform]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError(null);
  }, [initialValue]);

  return {
    value,
    debouncedValue,
    error,
    isValid,
    isPending,
    onChange,
    reset,
  };
}

// ============================================================================
// RAF THROTTLE
// ============================================================================

/**
 * Hook para throttle usando requestAnimationFrame
 */
export function useKBRAFThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef(callback);
  const frameRef = useRef<number | null>(null);
  const lastArgsRef = useRef<unknown[] | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledFn = useCallback((...args: unknown[]) => {
    lastArgsRef.current = args;

    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        if (lastArgsRef.current) {
          callbackRef.current(...lastArgsRef.current);
        }
      });
    }
  }, []) as T;

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return throttledFn;
}

export default useKBDebounce;
