import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

// === ERROR TIPADO KB ===
export interface AccountingConfigError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface SectorChartOfAccounts {
  id: string;
  sector_key: string;
  sector_name: string;
  cnae_codes: string[];
  account_structure: {
    groups: string[];
    critical_accounts: string[];
  };
  ratio_definitions: Record<string, {
    formula: string;
    weight: number;
    optimal_range: [number, number];
  }>;
  zscore_model: string;
  zscore_coefficients: {
    a: number;
    b: number;
    c: number;
    d: number;
    e?: number;
    thresholds: {
      safe: number;
      grey_upper: number;
      grey_lower: number;
      distress: number;
    };
  };
  benchmark_ranges: Record<string, {
    min: number;
    max: number;
    optimal: number;
  }>;
  compliance_rules: Record<string, unknown>;
}

export interface CompanyAccountingConfig {
  company_id: string;
  total_weight: number;
  sector_ratios: Record<string, {
    weight: number;
    ratios: Record<string, unknown>;
    is_primary: boolean;
  }>;
  sector_zscore: Record<string, {
    weight: number;
    model: string;
    coefficients: Record<string, unknown>;
  }>;
  sector_benchmarks: Record<string, {
    weight: number;
    benchmarks: Record<string, unknown>;
  }>;
  generated_at: string;
}

export interface WeightedZScoreCoefficients {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  thresholds: {
    safe: number;
    grey_upper: number;
    grey_lower: number;
    distress: number;
  };
  model: string;
  sectors: string[];
}

export interface WeightedBenchmarks {
  [key: string]: {
    min: number;
    max: number;
    optimal: number;
    weight: number;
  };
}

export interface SyncStatus {
  is_synced: boolean;
  cnae_count: number;
  ratio_configs: number;
  zscore_configs: number;
  issues: string[];
  checked_at: string;
}

interface UseAccountingConfigReturn {
  loading: boolean;
  error: string | null;
  config: CompanyAccountingConfig | null;
  sectorCharts: SectorChartOfAccounts[];
  syncStatus: SyncStatus | null;
  weightedZScore: WeightedZScoreCoefficients | null;
  weightedBenchmarks: WeightedBenchmarks;
  fetchConfig: (companyId: string) => Promise<void>;
  validateSync: (companyId: string) => Promise<SyncStatus | null>;
  forceSyncConfig: (companyId: string) => Promise<void>;
  getSectorForCnae: (cnaeCode: string) => SectorChartOfAccounts | null;
  // === KB ADDITIONS ===
  lastRefresh: Date | null;
  clearError: () => void;
}

// Helper to safely parse JSON fields
function parseSectorChart(data: Record<string, Json>): SectorChartOfAccounts {
  return {
    id: data.id as string,
    sector_key: data.sector_key as string,
    sector_name: data.sector_name as string,
    cnae_codes: (data.cnae_codes as string[]) || [],
    account_structure: (data.account_structure as SectorChartOfAccounts['account_structure']) || { groups: [], critical_accounts: [] },
    ratio_definitions: (data.ratio_definitions as SectorChartOfAccounts['ratio_definitions']) || {},
    zscore_model: (data.zscore_model as string) || 'altman_original',
    zscore_coefficients: (data.zscore_coefficients as SectorChartOfAccounts['zscore_coefficients']) || {
      a: 1.2, b: 1.4, c: 3.3, d: 0.6, e: 1.0,
      thresholds: { safe: 2.99, grey_upper: 2.99, grey_lower: 1.81, distress: 1.81 }
    },
    benchmark_ranges: (data.benchmark_ranges as SectorChartOfAccounts['benchmark_ranges']) || {},
    compliance_rules: (data.compliance_rules as Record<string, unknown>) || {}
  };
}

export function useAccountingConfig(companyId?: string): UseAccountingConfigReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<CompanyAccountingConfig | null>(null);
  const [sectorCharts, setSectorCharts] = useState<SectorChartOfAccounts[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [weightedZScore, setWeightedZScore] = useState<WeightedZScoreCoefficients | null>(null);
  const [weightedBenchmarks, setWeightedBenchmarks] = useState<WeightedBenchmarks>({});
  // === ESTADO KB ===
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  // Fetch all sector charts for reference
  const fetchSectorCharts = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('sector_chart_of_accounts')
      .select('*');

    if (fetchError) {
      console.error('Error fetching sector charts:', fetchError);
      return;
    }

    if (data) {
      const parsed = data.map(item => parseSectorChart(item as unknown as Record<string, Json>));
      setSectorCharts(parsed);
    }
  }, []);

  // Get sector config for a specific CNAE code
  const getSectorForCnae = useCallback((cnaeCode: string): SectorChartOfAccounts | null => {
    // Try exact match first
    let sector = sectorCharts.find(s => s.cnae_codes.includes(cnaeCode));
    
    if (!sector) {
      // Try prefix match (e.g., "4711" matches sector with "47")
      const prefix = cnaeCode.substring(0, 2);
      sector = sectorCharts.find(s => s.cnae_codes.includes(prefix));
    }
    
    return sector || null;
  }, [sectorCharts]);

  // Fetch company-specific accounting configuration
  const fetchConfig = useCallback(async (targetCompanyId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Call the database function to get weighted config
      const { data, error: rpcError } = await supabase
        .rpc('get_company_chart_of_accounts', { p_company_id: targetCompanyId });

      if (rpcError) {
        throw rpcError;
      }

      if (data) {
        const configData = data as unknown as CompanyAccountingConfig;
        setConfig(configData);

        // Calculate weighted Z-Score coefficients
        if (configData?.sector_zscore && Object.keys(configData.sector_zscore).length > 0) {
          const weightedCoeffs = calculateWeightedZScore(configData);
          setWeightedZScore(weightedCoeffs);
        }

        // Calculate weighted benchmarks
        if (configData?.sector_benchmarks && Object.keys(configData.sector_benchmarks).length > 0) {
          const weighted = calculateWeightedBenchmarks(configData);
          setWeightedBenchmarks(weighted);
        }
        setLastRefresh(new Date());
      }

    } catch (err) {
      console.error('Error fetching accounting config:', err);
      setError(err instanceof Error ? err.message : 'Error fetching config');
    } finally {
      setLoading(false);
    }
  }, []);

  // Validate synchronization status
  const validateSync = useCallback(async (targetCompanyId: string): Promise<SyncStatus | null> => {
    try {
      const { data, error: rpcError } = await supabase
        .rpc('validate_accounting_sync', { p_company_id: targetCompanyId });

      if (rpcError) {
        throw rpcError;
      }

      if (data) {
        const status = data as unknown as SyncStatus;
        setSyncStatus(status);
        return status;
      }
      return null;
    } catch (err) {
      console.error('Error validating sync:', err);
      return null;
    }
  }, []);

  // Force re-sync configuration for a company
  const forceSyncConfig = useCallback(async (targetCompanyId: string) => {
    setLoading(true);
    try {
      // Get company CNAEs
      const { data: cnaes, error: cnaeError } = await supabase
        .from('company_cnaes')
        .select('*')
        .eq('company_id', targetCompanyId);

      if (cnaeError) throw cnaeError;

      // Trigger sync for each CNAE (the trigger will handle it)
      for (const cnae of cnaes || []) {
        await supabase
          .from('company_cnaes')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', cnae.id);
      }

      // Refresh config
      await fetchConfig(targetCompanyId);
      await validateSync(targetCompanyId);

    } catch (err) {
      console.error('Error forcing sync:', err);
      setError(err instanceof Error ? err.message : 'Error forcing sync');
    } finally {
      setLoading(false);
    }
  }, [fetchConfig, validateSync]);

  // Calculate weighted Z-Score coefficients based on CNAE percentages
  const calculateWeightedZScore = (configData: CompanyAccountingConfig): WeightedZScoreCoefficients => {
    const sectorZscores = configData.sector_zscore;
    const sectors = Object.keys(sectorZscores);
    
    if (sectors.length === 0) {
      // Default Altman Original
      return {
        a: 1.2, b: 1.4, c: 3.3, d: 0.6, e: 1.0,
        thresholds: { safe: 2.99, grey_upper: 2.99, grey_lower: 1.81, distress: 1.81 },
        model: 'altman_original',
        sectors: []
      };
    }

    let totalWeight = 0;
    let weightedA = 0, weightedB = 0, weightedC = 0, weightedD = 0, weightedE = 0;
    let weightedSafe = 0, weightedGreyUpper = 0, weightedGreyLower = 0, weightedDistress = 0;
    let primaryModel = 'altman_original';

    sectors.forEach(sectorKey => {
      const sector = sectorZscores[sectorKey];
      const weight = sector.weight / 100;
      totalWeight += weight;

      const coeffs = sector.coefficients as Record<string, unknown>;
      weightedA += (coeffs.a as number || 1.2) * weight;
      weightedB += (coeffs.b as number || 1.4) * weight;
      weightedC += (coeffs.c as number || 3.3) * weight;
      weightedD += (coeffs.d as number || 0.6) * weight;
      weightedE += (coeffs.e as number || 1.0) * weight;

      const thresholds = coeffs.thresholds as Record<string, number> || {};
      weightedSafe += (thresholds.safe || 2.99) * weight;
      weightedGreyUpper += (thresholds.grey_upper || 2.99) * weight;
      weightedGreyLower += (thresholds.grey_lower || 1.81) * weight;
      weightedDistress += (thresholds.distress || 1.81) * weight;

      // Use the primary sector's model name
      if (weight > 0.5 || sectors.length === 1) {
        primaryModel = sector.model;
      }
    });

    // Normalize by total weight
    if (totalWeight > 0) {
      return {
        a: weightedA / totalWeight,
        b: weightedB / totalWeight,
        c: weightedC / totalWeight,
        d: weightedD / totalWeight,
        e: weightedE / totalWeight,
        thresholds: {
          safe: weightedSafe / totalWeight,
          grey_upper: weightedGreyUpper / totalWeight,
          grey_lower: weightedGreyLower / totalWeight,
          distress: weightedDistress / totalWeight
        },
        model: primaryModel,
        sectors
      };
    }

    return {
      a: 1.2, b: 1.4, c: 3.3, d: 0.6, e: 1.0,
      thresholds: { safe: 2.99, grey_upper: 2.99, grey_lower: 1.81, distress: 1.81 },
      model: 'altman_original',
      sectors: []
    };
  };

  // Calculate weighted benchmarks
  const calculateWeightedBenchmarks = (configData: CompanyAccountingConfig): WeightedBenchmarks => {
    const sectorBenchmarks = configData.sector_benchmarks;
    const result: WeightedBenchmarks = {};
    
    Object.entries(sectorBenchmarks).forEach(([sectorKey, sectorData]) => {
      const weight = sectorData.weight / 100;
      const benchmarks = sectorData.benchmarks as Record<string, { min: number; max: number; optimal: number }>;
      
      Object.entries(benchmarks).forEach(([key, value]) => {
        if (!result[key]) {
          result[key] = { min: 0, max: 0, optimal: 0, weight: 0 };
        }
        result[key].min += value.min * weight;
        result[key].max += value.max * weight;
        result[key].optimal += value.optimal * weight;
        result[key].weight += weight;
      });
    });

    // Normalize
    Object.keys(result).forEach(key => {
      if (result[key].weight > 0) {
        result[key].min /= result[key].weight;
        result[key].max /= result[key].weight;
        result[key].optimal /= result[key].weight;
      }
    });

    return result;
  };

  // Initial load of sector charts
  useEffect(() => {
    fetchSectorCharts();
  }, [fetchSectorCharts]);

  // Load config when companyId changes
  useEffect(() => {
    if (companyId) {
      fetchConfig(companyId);
      validateSync(companyId);
    }
  }, [companyId, fetchConfig, validateSync]);

  // Set up realtime subscription for company_cnaes changes
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel(`accounting-config-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_cnaes',
          filter: `company_id=eq.${companyId}`
        },
        () => {
          // Refresh config when CNAEs change
          fetchConfig(companyId);
          validateSync(companyId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, fetchConfig, validateSync]);

  return {
    loading,
    error,
    config,
    sectorCharts,
    syncStatus,
    weightedZScore,
    weightedBenchmarks,
    fetchConfig,
    validateSync,
    forceSyncConfig,
    getSectorForCnae,
    // === KB ADDITIONS ===
    lastRefresh,
    clearError
  };
}
