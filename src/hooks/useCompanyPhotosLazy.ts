import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from './core';

interface UseCompanyPhotosLazyReturn {
  getPhoto: (companyId: string) => string | undefined;
  loadPhotosForCompanies: (companyIds: string[]) => Promise<void>;
  isLoading: boolean;
  // KB 2.0
  status: KBStatus;
  isIdle: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: KBError | null;
  lastRefresh: Date | null;
  lastSuccess: Date | null;
  retryCount: number;
  clearError: () => void;
  reset: () => void;
}

export function useCompanyPhotosLazy(): UseCompanyPhotosLazyReturn {
  const [photosMap, setPhotosMap] = useState<Map<string, string>>(new Map());
  const loadedCompaniesRef = useRef<Set<string>>(new Set());
  const pendingRequestsRef = useRef<Set<string>>(new Set());

  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);

  const loadPhotosForCompanies = useCallback(async (companyIds: string[]) => {
    // Filter out already loaded or pending companies
    const newCompanyIds = companyIds.filter(
      id => !loadedCompaniesRef.current.has(id) && !pendingRequestsRef.current.has(id)
    );

    if (newCompanyIds.length === 0) return;

    // Mark as pending
    newCompanyIds.forEach(id => pendingRequestsRef.current.add(id));
    
    setStatus('loading');
    setError(null);
    const startTime = Date.now();

    try {
      // Batch load photos - only fetch the most recent for each company
      const { data, error: fetchError } = await supabase
        .from('company_photos')
        .select('company_id, photo_url, uploaded_at')
        .in('company_id', newCompanyIds)
        .order('uploaded_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Process results - keep only the most recent photo per company
      const newPhotosMap = new Map<string, string>();
      data?.forEach(photo => {
        if (!newPhotosMap.has(photo.company_id)) {
          newPhotosMap.set(photo.company_id, photo.photo_url);
        }
      });

      // Update state
      setPhotosMap(prev => {
        const updated = new Map(prev);
        newPhotosMap.forEach((url, id) => updated.set(id, url));
        return updated;
      });

      // Mark as loaded
      newCompanyIds.forEach(id => {
        loadedCompaniesRef.current.add(id);
        pendingRequestsRef.current.delete(id);
      });

      setStatus('success');
      setLastSuccess(new Date());
      setRetryCount(0);
      collectTelemetry('useCompanyPhotosLazy', 'loadPhotosForCompanies', 'success', Date.now() - startTime);
    } catch (err) {
      console.error('Error loading company photos:', err);
      const kbError = parseError(err);
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useCompanyPhotosLazy', 'loadPhotosForCompanies', 'error', Date.now() - startTime, kbError);
      // Remove from pending on error
      newCompanyIds.forEach(id => pendingRequestsRef.current.delete(id));
    } finally {
      setLastRefresh(new Date());
    }
  }, []);

  const getPhoto = useCallback((companyId: string): string | undefined => {
    return photosMap.get(companyId);
  }, [photosMap]);

  return {
    getPhoto,
    loadPhotosForCompanies,
    isLoading,
    // === KB 2.0 ===
    status,
    isIdle,
    isSuccess,
    isError,
    error,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
    reset,
  };
}
