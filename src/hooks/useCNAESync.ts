import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { KBStatus, KBError } from './core';

export type CNAESyncError = KBError;
interface SectorRatio {
  sector: string;
  ratios: Record<string, number>;
}

interface ZScoreCoefficients {
  x1: number;
  x2: number;
  x3: number;
  x4: number;
  x5: number;
  safe_zone_min: number;
  gray_zone_min: number;
}

interface CompanyCNAE {
  id: string;
  company_id: string;
  cnae_code: string;
  is_primary: boolean;
  percentage_activity: number;
  license_price: number;
  installed_module_id?: string;
}

interface SyncState {
  isLoading: boolean;
  lastSync: Date | null;
  error: string | null;
}

export function useCNAESync(companyId?: string) {
  const queryClient = useQueryClient();
  const [syncState, setSyncState] = useState<SyncState>({
    isLoading: false,
    lastSync: null,
    error: null
  });
  const [companyCnaes, setCompanyCnaes] = useState<CompanyCNAE[]>([]);
  const [sectorRatios, setSectorRatios] = useState<SectorRatio | null>(null);
  const [zscoreCoefficients, setZscoreCoefficients] = useState<ZScoreCoefficients | null>(null);
  // === KB 2.0 ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const isIdle = status === 'idle';
  const isLoading = syncState.isLoading || status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  const clearError = useCallback(() => {
    setError(null);
    setSyncState(prev => ({ ...prev, error: null }));
    if (status === 'error') setStatus('idle');
  }, [status]);
  const fetchCompanyCnaes = useCallback(async () => {
    if (!companyId) return;
    
    setSyncState(prev => ({ ...prev, isLoading: true }));
    try {
      const { data, error } = await supabase
        .from('company_cnaes')
        .select('*')
        .eq('company_id', companyId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setCompanyCnaes(data || []);
      setSyncState(prev => ({ ...prev, lastSync: new Date(), error: null }));
    } catch (err: any) {
      setSyncState(prev => ({ ...prev, error: err.message }));
    } finally {
      setSyncState(prev => ({ ...prev, isLoading: false }));
    }
  }, [companyId]);

  const fetchSectorRatios = useCallback(async (cnaeCode: string): Promise<SectorRatio | null> => {
    try {
      const { data, error } = await supabase.rpc('get_sector_ratios', { p_cnae_code: cnaeCode });
      if (error) throw error;
      const result = data as unknown as SectorRatio;
      setSectorRatios(result);
      return result;
    } catch (err) {
      console.error('Error fetching sector ratios:', err);
      return null;
    }
  }, []);

  const fetchZScoreCoefficients = useCallback(async (sectorKey: string): Promise<ZScoreCoefficients | null> => {
    try {
      const { data, error } = await supabase.rpc('get_zscore_coefficients', { p_sector_key: sectorKey });
      if (error) throw error;
      const result = data as unknown as ZScoreCoefficients;
      setZscoreCoefficients(result);
      return result;
    } catch (err) {
      console.error('Error fetching Z-Score coefficients:', err);
      return null;
    }
  }, []);

  const calculateWeightedRatios = useCallback(async (): Promise<Record<string, number>> => {
    if (companyCnaes.length === 0) return {};

    const weightedRatios: Record<string, number> = {};
    let totalWeight = 0;

    for (const cnae of companyCnaes) {
      const ratioData = await fetchSectorRatios(cnae.cnae_code);
      if (ratioData?.ratios) {
        const weight = cnae.percentage_activity / 100;
        totalWeight += weight;
        
        for (const [key, value] of Object.entries(ratioData.ratios)) {
          if (typeof value === 'number') {
            weightedRatios[key] = (weightedRatios[key] || 0) + value * weight;
          }
        }
      }
    }

    if (totalWeight > 0) {
      for (const key of Object.keys(weightedRatios)) {
        weightedRatios[key] /= totalWeight;
      }
    }

    return weightedRatios;
  }, [companyCnaes, fetchSectorRatios]);

  const calculateWeightedZScoreCoefficients = useCallback(async (): Promise<ZScoreCoefficients> => {
    const defaultCoeffs: ZScoreCoefficients = {
      x1: 1.2, x2: 1.4, x3: 3.3, x4: 0.6, x5: 1.0,
      safe_zone_min: 2.99, gray_zone_min: 1.81
    };

    if (companyCnaes.length === 0) return defaultCoeffs;

    const weighted = { x1: 0, x2: 0, x3: 0, x4: 0, x5: 0, safe_zone_min: 0, gray_zone_min: 0 };
    let totalWeight = 0;

    const { data: sectors } = await supabase
      .from('cnae_sector_mapping')
      .select('cnae_code, sector')
      .in('cnae_code', companyCnaes.map(c => c.cnae_code));

    for (const cnae of companyCnaes) {
      const sectorInfo = sectors?.find(s => s.cnae_code === cnae.cnae_code);
      if (sectorInfo?.sector) {
        const coeffs = await fetchZScoreCoefficients(sectorInfo.sector);
        if (coeffs) {
          const weight = cnae.percentage_activity / 100;
          totalWeight += weight;
          weighted.x1 += coeffs.x1 * weight;
          weighted.x2 += coeffs.x2 * weight;
          weighted.x3 += coeffs.x3 * weight;
          weighted.x4 += coeffs.x4 * weight;
          weighted.x5 += coeffs.x5 * weight;
          weighted.safe_zone_min += coeffs.safe_zone_min * weight;
          weighted.gray_zone_min += coeffs.gray_zone_min * weight;
        }
      }
    }

    if (totalWeight > 0) {
      return {
        x1: weighted.x1 / totalWeight,
        x2: weighted.x2 / totalWeight,
        x3: weighted.x3 / totalWeight,
        x4: weighted.x4 / totalWeight,
        x5: weighted.x5 / totalWeight,
        safe_zone_min: weighted.safe_zone_min / totalWeight,
        gray_zone_min: weighted.gray_zone_min / totalWeight
      };
    }

    return defaultCoeffs;
  }, [companyCnaes, fetchZScoreCoefficients]);

  const forceSyncAllCnaes = useCallback(async (targetCompanyId: string) => {
    setSyncState(prev => ({ ...prev, isLoading: true }));
    try {
      toast.success('Sincronización completada');
      await fetchCompanyCnaes();
    } catch (err: any) {
      toast.error('Error en sincronización');
      setSyncState(prev => ({ ...prev, error: err.message }));
    } finally {
      setSyncState(prev => ({ ...prev, isLoading: false }));
    }
  }, [fetchCompanyCnaes]);

  useEffect(() => {
    if (!companyId) return;
    fetchCompanyCnaes();

    const channel = supabase
      .channel(`cnae-sync-${companyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'company_cnaes', filter: `company_id=eq.${companyId}` }, () => fetchCompanyCnaes())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [companyId, fetchCompanyCnaes]);

  return {
    data: companyCnaes,
    syncState,
    companyCnaes,
    sectorRatios,
    zscoreCoefficients,
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    error,
    clearError,
    lastRefresh,
    fetchCompanyCnaes,
    fetchSectorRatios,
    fetchZScoreCoefficients,
    calculateWeightedRatios,
    calculateWeightedZScoreCoefficients,
    forceSyncAllCnaes,
  };
}
