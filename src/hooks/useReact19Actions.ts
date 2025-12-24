import { useCallback, useState, useTransition, useOptimistic, useActionState } from 'react';
import { toast } from '@/hooks/use-toast';

// === ERROR TIPADO KB ===
export interface React19ActionsError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * React 19 Actions hook - Form handling with optimistic updates
 * Provides consistent action patterns across the application
 */
export function useFormAction<TData, TResult>(
  action: (data: TData) => Promise<TResult>,
  options: {
    onSuccess?: (result: TResult) => void;
    onError?: (error: Error) => void;
    successMessage?: string;
    errorMessage?: string;
  } = {}
) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<TResult | null>(null);

  const execute = useCallback(async (data: TData) => {
    setError(null);
    
    startTransition(async () => {
      try {
        const res = await action(data);
        setResult(res);
        options.onSuccess?.(res);
        
        if (options.successMessage) {
          toast({
            title: "Èxit",
            description: options.successMessage,
          });
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Action failed');
        setError(error);
        options.onError?.(error);
        
        toast({
          title: "Error",
          description: options.errorMessage || error.message,
          variant: "destructive",
        });
      }
    });
  }, [action, options]);

  return { execute, isPending, error, result };
}

/**
 * Optimistic list updates with React 19 useOptimistic
 */
export function useOptimisticList<T extends { id: string }>(
  initialItems: T[],
  options: {
    addAction?: (item: Omit<T, 'id'>) => Promise<T>;
    updateAction?: (item: T) => Promise<T>;
    deleteAction?: (id: string) => Promise<void>;
  } = {}
) {
  const [items, setItems] = useState(initialItems);
  const [isPending, startTransition] = useTransition();
  
  const [optimisticItems, addOptimistic] = useOptimistic(
    items,
    (state: T[], action: { type: 'add' | 'update' | 'delete'; item?: T; id?: string }) => {
      switch (action.type) {
        case 'add':
          return action.item ? [...state, action.item] : state;
        case 'update':
          return action.item 
            ? state.map(i => i.id === action.item!.id ? action.item! : i)
            : state;
        case 'delete':
          return action.id ? state.filter(i => i.id !== action.id) : state;
        default:
          return state;
      }
    }
  );

  const addItem = useCallback(async (item: Omit<T, 'id'>) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticItem = { ...item, id: tempId } as T;
    
    startTransition(async () => {
      addOptimistic({ type: 'add', item: optimisticItem });
      
      if (options.addAction) {
        try {
          const newItem = await options.addAction(item);
          setItems(prev => [...prev.filter(i => i.id !== tempId), newItem]);
        } catch (error) {
          setItems(prev => prev.filter(i => i.id !== tempId));
          throw error;
        }
      }
    });
  }, [options.addAction, addOptimistic]);

  const updateItem = useCallback(async (item: T) => {
    const originalItem = items.find(i => i.id === item.id);
    
    startTransition(async () => {
      addOptimistic({ type: 'update', item });
      
      if (options.updateAction) {
        try {
          const updatedItem = await options.updateAction(item);
          setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
        } catch (error) {
          if (originalItem) {
            setItems(prev => prev.map(i => i.id === item.id ? originalItem : i));
          }
          throw error;
        }
      }
    });
  }, [items, options.updateAction, addOptimistic]);

  const deleteItem = useCallback(async (id: string) => {
    const originalItem = items.find(i => i.id === id);
    
    startTransition(async () => {
      addOptimistic({ type: 'delete', id });
      
      if (options.deleteAction) {
        try {
          await options.deleteAction(id);
          setItems(prev => prev.filter(i => i.id !== id));
        } catch (error) {
          if (originalItem) {
            setItems(prev => [...prev, originalItem]);
          }
          throw error;
        }
      }
    });
  }, [items, options.deleteAction, addOptimistic]);

  return {
    items: optimisticItems,
    isPending,
    addItem,
    updateItem,
    deleteItem,
    setItems,
  };
}

/**
 * React 19 cache integration for SSR prerendering
 */
const cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

export function useCachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number; staleWhileRevalidate?: boolean } = {}
) {
  const { ttl = 60000, staleWhileRevalidate = true } = options;
  const [data, setData] = useState<T | null>(() => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<Error | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback(async (background = false) => {
    if (!background) setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      cache.set(key, { data: result, timestamp: Date.now(), ttl });
      
      startTransition(() => {
        setData(result);
      });
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Fetch failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, ttl]);

  // Initial fetch or revalidation
  useState(() => {
    const cached = cache.get(key);
    const isStale = cached && Date.now() - cached.timestamp >= cached.ttl;
    
    if (!cached || (isStale && staleWhileRevalidate)) {
      fetchData(!!cached);
    }
  });

  const invalidate = useCallback(() => {
    cache.delete(key);
    return fetchData();
  }, [key, fetchData]);

  return {
    data,
    isLoading,
    isPending,
    error,
    refetch: fetchData,
    invalidate,
  };
}

/**
 * Preload data for navigation (React 19 preload pattern)
 */
const preloadCache = new Map<string, Promise<unknown>>();

export function preloadData<T>(key: string, fetcher: () => Promise<T>): void {
  if (!preloadCache.has(key)) {
    preloadCache.set(key, fetcher());
  }
}

export function usePreloadedData<T>(key: string): T | null {
  const [data, setData] = useState<T | null>(null);

  useState(() => {
    const promise = preloadCache.get(key) as Promise<T> | undefined;
    if (promise) {
      promise.then(setData).catch(console.error);
    }
  });

  return data;
}

/**
 * Clear preload cache
 */
export function clearPreloadCache(key?: string): void {
  if (key) {
    preloadCache.delete(key);
  } else {
    preloadCache.clear();
  }
}
