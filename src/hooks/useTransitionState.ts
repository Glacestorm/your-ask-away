import { useState, useTransition, useCallback } from 'react';

// === ERROR TIPADO KB ===
export interface TransitionStateError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Custom hook that wraps useState with useTransition for non-blocking updates
 * Uses React 19's concurrent features for better Core Web Vitals (INP)
 */
export function useTransitionState<T>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [isPending, startTransition] = useTransition();

  const setValueWithTransition = useCallback((newValue: T | ((prev: T) => T)) => {
    startTransition(() => {
      setValue(newValue);
    });
  }, []);

  return [value, setValueWithTransition, isPending] as const;
}

/**
 * Hook for deferring expensive computations
 * Improves INP by keeping the main thread responsive
 */
export function useDeferredAction() {
  const [isPending, startTransition] = useTransition();

  const deferAction = useCallback(<T>(action: () => T): Promise<T> => {
    return new Promise((resolve) => {
      startTransition(() => {
        const result = action();
        resolve(result);
      });
    });
  }, []);

  return { deferAction, isPending };
}

/**
 * Hook for optimistic updates with automatic rollback
 * Improves perceived performance by showing immediate UI updates
 */
export function useOptimisticAction<TData, TVariable>(
  currentData: TData,
  mutationFn: (variable: TVariable) => Promise<TData>,
  optimisticUpdate: (current: TData, variable: TVariable) => TData
) {
  const [optimisticData, setOptimisticData] = useState<TData>(currentData);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (variable: TVariable) => {
    setError(null);
    
    // Apply optimistic update immediately
    startTransition(() => {
      setOptimisticData(optimisticUpdate(currentData, variable));
    });

    try {
      const result = await mutationFn(variable);
      setOptimisticData(result);
      return result;
    } catch (err) {
      // Rollback on error
      setOptimisticData(currentData);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  }, [currentData, mutationFn, optimisticUpdate]);

  return {
    data: optimisticData,
    execute,
    isPending,
    error,
  };
}
