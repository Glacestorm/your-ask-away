/**
 * Hook for testimonials data with persistent caching and offline support
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  CACHE_DURATIONS, 
  getPersistentQueryOptions,
  saveToIDB,
  loadFromIDB,
  updateLastSync
} from '@/lib/queryPersister';
import { useEffect, useCallback, useState } from 'react';

// === ERROR TIPADO KB ===
export interface PersistentTestimonialsError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface Testimonial {
  id: string;
  company_name: string;
  company_logo_url: string | null;
  author_name: string;
  author_role: string;
  author_avatar_url: string | null;
  quote: string;
  rating: number | null;
  is_featured: boolean;
  is_active: boolean;
  display_order: number | null;
  created_at: string;
}

const TESTIMONIALS_KEY = ['testimonials'] as const;

async function fetchTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[usePersistentTestimonialsQuery] Fetch error:', error);
    throw error;
  }

  return data || [];
}

export function usePersistentTestimonialsQuery() {
  const queryClient = useQueryClient();
  // === ESTADO KB ===
  const [error, setError] = useState<PersistentTestimonialsError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  const query = useQuery({
    queryKey: TESTIMONIALS_KEY,
    queryFn: fetchTestimonials,
    ...getPersistentQueryOptions('TESTIMONIALS'),
  });

  // Load from IDB on mount if no cached data
  useEffect(() => {
    async function loadCached() {
      if (!query.data && !query.isFetching) {
        const cached = await loadFromIDB<Testimonial[]>('testimonials');
        if (cached) {
          queryClient.setQueryData(TESTIMONIALS_KEY, cached);
        }
      }
    }
    loadCached();
  }, [query.data, query.isFetching, queryClient]);

  // Save to IDB when data changes
  useEffect(() => {
    if (query.data && query.data.length > 0) {
      saveToIDB('testimonials', query.data);
      updateLastSync();
    }
  }, [query.data]);

  // Sync on reconnect
  useEffect(() => {
    const handleSync = () => {
      query.refetch();
    };

    window.addEventListener('cache-sync-needed', handleSync);
    return () => window.removeEventListener('cache-sync-needed', handleSync);
  }, [query]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: TESTIMONIALS_KEY });
  }, [queryClient]);

  const prefetch = useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: TESTIMONIALS_KEY,
      queryFn: fetchTestimonials,
      staleTime: CACHE_DURATIONS.TESTIMONIALS,
    });
  }, [queryClient]);

  return {
    ...query,
    testimonials: query.data ?? [],
    invalidate,
    prefetch,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError,
  };
}

export default usePersistentTestimonialsQuery;
