import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from './core';

export type CNAEPricingError = KBError;
export interface CNAEPriceDetail {
  cnae_code: string;
  base_price: number;
  turnover_tier: string;
  tier_multiplier: number;
  volume_discount_pct: number;
  bundle_discount_pct: number;
  final_price: number;
  complexity_tier: string;
}

export interface BundleInfo {
  bundle_id: string;
  bundle_name: string;
  discount_percentage: number;
  matching_cnaes: string[];
  match_count: number;
}

export interface PricingSummary {
  total_cnaes: number;
  existing_cnaes: number;
  total_base_price: number;
  total_final_price: number;
  total_savings: number;
  savings_percentage: number;
  volume_discount_tier: string;
  bundle_applied: {
    name: string;
    discount: number;
    matching_cnaes: string[];
  } | null;
}

export interface PricingResult {
  summary: PricingSummary;
  details: CNAEPriceDetail[];
  available_bundles: BundleInfo[];
  recommendations: string[];
}

export interface BundleSuggestion {
  bundle_id: string;
  bundle_name: string;
  bundle_description: string;
  discount_percentage: number;
  matching_cnaes: string[];
  missing_cnaes: string[];
  completion_percentage: number;
  is_complete: boolean;
  min_cnaes_required: number;
  qualifies_for_discount: boolean;
  missing_cnaes_cost: number;
  potential_savings: number;
  roi_ratio: number;
}

export interface BundleSuggestionResult {
  current_cnaes: string[];
  current_sectors: string[];
  bundle_suggestions: BundleSuggestion[];
  complementary_cnaes: any[];
  ai_recommendations: string[];
}

export function useCNAEPricing() {
  const { toast } = useToast();
  // === KB 2.0 STATE MACHINE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  const [bundleSuggestions, setBundleSuggestions] = useState<BundleSuggestionResult | null>(null);
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const canRetry = isError && retryCount < 3;

  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reset = useCallback(() => {
    setStatus('idle');
    setPricingResult(null);
    setBundleSuggestions(null);
    setError(null);
    setRetryCount(0);
  }, []);
  const calculatePricing = useCallback(async (
    cnaeCodes: string[],
    companyTurnover?: number,
    companyId?: string
  ): Promise<PricingResult | null> => {
    setStatus('loading');
    setError(null);
    const startTime = new Date();
    try {
      const { data, error: fnError } = await supabase.functions.invoke('calculate-multi-cnae-pricing', {
        body: {
          cnae_codes: cnaeCodes,
          company_turnover: companyTurnover,
          company_id: companyId
        }
      });

      if (fnError) throw fnError;

      setPricingResult(data);
      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setRetryCount(0);
      collectTelemetry({ hookName: 'useCNAEPricing', operationName: 'calculatePricing', startTime, endTime: new Date(), durationMs: Date.now() - startTime.getTime(), status: 'success', retryCount: 0 });
      return data;
    } catch (err) {
      const kbError: KBError = { ...parseError(err), code: 'CALCULATE_PRICING_ERROR' };
      setError(kbError);
      setStatus('error');
      collectTelemetry({ hookName: 'useCNAEPricing', operationName: 'calculatePricing', startTime, endTime: new Date(), durationMs: Date.now() - startTime.getTime(), status: 'error', error: kbError, retryCount });
      toast({ title: 'Error', description: kbError.message, variant: 'destructive' });
      return null;
    }
  }, [toast]);

  const suggestBundles = useCallback(async (
    currentCnaes: string[],
    companySector?: string,
    companyTurnover?: number
  ): Promise<BundleSuggestionResult | null> => {
    setStatus('loading');
    try {
      const { data, error } = await supabase.functions.invoke('suggest-cnae-bundles', {
        body: {
          current_cnaes: currentCnaes,
          company_sector: companySector,
          company_turnover: companyTurnover
        }
      });

      if (error) throw error;

      setBundleSuggestions(data);
      setStatus('success');
      return data;
    } catch (err) {
      const kbError: KBError = { ...parseError(err), code: 'SUGGEST_BUNDLES_ERROR' };
      setError(kbError);
      setStatus('error');
      toast({ title: 'Error', description: 'No se pudieron obtener sugerencias', variant: 'destructive' });
      return null;
    }
  }, [toast]);

  const fetchCNAEPricing = useCallback(async () => {
    const { data, error } = await supabase
      .from('cnae_pricing')
      .select('*')
      .eq('is_active', true)
      .order('sector_category', { ascending: true });

    if (error) throw error;
    return data;
  }, []);

  const fetchBundles = useCallback(async () => {
    const { data, error } = await supabase
      .from('cnae_bundles')
      .select('*')
      .eq('is_active', true)
      .order('discount_percentage', { ascending: false });

    if (error) throw error;
    return data;
  }, []);

  const fetchCompanyCnaes = useCallback(async (companyId: string) => {
    const { data, error } = await supabase
      .from('company_cnaes')
      .select('*')
      .eq('company_id', companyId)
      .order('is_primary', { ascending: false });

    if (error) throw error;
    return data;
  }, []);

  const addCompanyCnae = useCallback(async (
    companyId: string,
    cnaeCode: string,
    isPrimary: boolean = false,
    percentageActivity: number = 100
  ) => {
    // First calculate the price
    const pricing = await calculatePricing([cnaeCode]);
    const finalPrice = pricing?.details[0]?.final_price || 0;

    const { data, error } = await supabase
      .from('company_cnaes')
      .insert({
        company_id: companyId,
        cnae_code: cnaeCode,
        is_primary: isPrimary,
        percentage_activity: percentageActivity,
        license_price: finalPrice
      })
      .select()
      .single();

    if (error) throw error;

    toast({
      title: 'CNAE añadido',
      description: `CNAE ${cnaeCode} añadido correctamente`
    });

    return data;
  }, [calculatePricing, toast]);

  const removeCompanyCnae = useCallback(async (companyCnaeId: string) => {
    const { error } = await supabase
      .from('company_cnaes')
      .delete()
      .eq('id', companyCnaeId);

    if (error) throw error;

    toast({
      title: 'CNAE eliminado',
      description: 'CNAE eliminado correctamente'
    });
  }, [toast]);

  const getComplexityTierColor = (tier: string): string => {
    switch (tier) {
      case 'basic': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'standard': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'enterprise': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTurnoverTierLabel = (tier: string): string => {
    switch (tier) {
      case 'micro': return '< 500K€';
      case 'small': return '500K€ - 1M€';
      case 'medium': return '1M€ - 10M€';
      case 'large': return '10M€ - 50M€';
      case 'enterprise': return '> 50M€';
      default: return tier;
    }
  };

  return {
    data: pricingResult,
    pricingResult,
    bundleSuggestions,
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    error,
    clearError,
    retryCount,
    canRetry,
    execute: calculatePricing,
    calculatePricing,
    suggestBundles,
    fetchCNAEPricing,
    fetchBundles,
    fetchCompanyCnaes,
    addCompanyCnae,
    removeCompanyCnae,
    reset,
    lastRefresh,
    lastSuccess,
    getComplexityTierColor,
    getTurnoverTierLabel,
  };
}
