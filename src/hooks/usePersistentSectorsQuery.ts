/**
 * Hook for sectors data with persistent caching and offline support
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  PERSISTENT_QUERY_KEYS, 
  CACHE_DURATIONS, 
  getPersistentQueryOptions,
  saveToIDB,
  loadFromIDB,
  updateLastSync
} from '@/lib/queryPersister';
import { useEffect, useCallback } from 'react';

interface Sector {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  icon_name: string | null;
  gradient_from: string | null;
  gradient_to: string | null;
  is_active: boolean;
  is_featured: boolean;
  order_position: number | null;
  created_at: string;
  updated_at: string;
}

async function fetchSectors(): Promise<Sector[]> {
  const { data, error } = await supabase
    .from('sectors')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('[usePersistentSectorsQuery] Fetch error:', error);
    throw error;
  }

  return data || [];
}

export function usePersistentSectorsQuery() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PERSISTENT_QUERY_KEYS.SECTORS,
    queryFn: fetchSectors,
    ...getPersistentQueryOptions('SECTORS'),
    // Fallback to IDB if available
    placeholderData: () => {
      // This will be replaced by actual data once loaded
      return undefined;
    },
  });

  // Load from IDB on mount if no cached data
  useEffect(() => {
    async function loadCached() {
      if (!query.data && !query.isFetching) {
        const cached = await loadFromIDB<Sector[]>('sectors');
        if (cached) {
          queryClient.setQueryData(PERSISTENT_QUERY_KEYS.SECTORS, cached);
        }
      }
    }
    loadCached();
  }, [query.data, query.isFetching, queryClient]);

  // Save to IDB when data changes
  useEffect(() => {
    if (query.data && query.data.length > 0) {
      saveToIDB('sectors', query.data);
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
    queryClient.invalidateQueries({ queryKey: PERSISTENT_QUERY_KEYS.SECTORS });
  }, [queryClient]);

  const prefetch = useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: PERSISTENT_QUERY_KEYS.SECTORS,
      queryFn: fetchSectors,
      staleTime: CACHE_DURATIONS.SECTORS,
    });
  }, [queryClient]);

  return {
    ...query,
    sectors: query.data ?? [],
    invalidate,
    prefetch,
  };
}

export default usePersistentSectorsQuery;
