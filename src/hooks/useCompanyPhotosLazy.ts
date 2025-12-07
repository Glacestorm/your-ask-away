import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseCompanyPhotosLazyReturn {
  getPhoto: (companyId: string) => string | undefined;
  loadPhotosForCompanies: (companyIds: string[]) => Promise<void>;
  isLoading: boolean;
}

export function useCompanyPhotosLazy(): UseCompanyPhotosLazyReturn {
  const [photosMap, setPhotosMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const loadedCompaniesRef = useRef<Set<string>>(new Set());
  const pendingRequestsRef = useRef<Set<string>>(new Set());

  const loadPhotosForCompanies = useCallback(async (companyIds: string[]) => {
    // Filter out already loaded or pending companies
    const newCompanyIds = companyIds.filter(
      id => !loadedCompaniesRef.current.has(id) && !pendingRequestsRef.current.has(id)
    );

    if (newCompanyIds.length === 0) return;

    // Mark as pending
    newCompanyIds.forEach(id => pendingRequestsRef.current.add(id));
    
    setIsLoading(true);

    try {
      // Batch load photos - only fetch the most recent for each company
      const { data, error } = await supabase
        .from('company_photos')
        .select('company_id, photo_url, uploaded_at')
        .in('company_id', newCompanyIds)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

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
    } catch (error) {
      console.error('Error loading company photos:', error);
      // Remove from pending on error
      newCompanyIds.forEach(id => pendingRequestsRef.current.delete(id));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPhoto = useCallback((companyId: string): string | undefined => {
    return photosMap.get(companyId);
  }, [photosMap]);

  return {
    getPhoto,
    loadPhotosForCompanies,
    isLoading,
  };
}
