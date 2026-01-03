/**
 * Hook para gestión de Tipos de Interés de Mercado
 * Euribor, SOFR, SONIA, tipos oficiales BCE/FED/BoE
 */

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MarketRate {
  rate_code: string;
  currency: string;
  tenor: string;
  rate_value: number;
  rate_date: string;
  source: string;
}

export interface RateHistory {
  date: string;
  value: number;
}

export function useERPMarketRates() {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('EUR');

  // === FETCH ALL RATES ===
  const {
    data: rates = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['erp-market-rates', selectedCurrency],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('erp-market-rates', {
        body: {
          action: 'get_all_rates',
          currency: selectedCurrency || undefined
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to fetch rates');

      return data.data as MarketRate[];
    },
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    staleTime: 2 * 60 * 1000
  });

  // === FETCH CENTRAL BANK RATES ===
  const {
    data: centralBankRates = [],
    isLoading: isLoadingCentralBank
  } = useQuery({
    queryKey: ['erp-central-bank-rates'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('erp-market-rates', {
        body: { action: 'get_central_bank_rates' }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to fetch central bank rates');

      return data.data as MarketRate[];
    },
    staleTime: 10 * 60 * 1000
  });

  // === FETCH REFERENCE RATES ===
  const {
    data: referenceRates = [],
    isLoading: isLoadingReference
  } = useQuery({
    queryKey: ['erp-reference-rates'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('erp-market-rates', {
        body: { action: 'get_reference_rates' }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to fetch reference rates');

      return data.data as MarketRate[];
    },
    staleTime: 5 * 60 * 1000
  });

  // === FETCH RATE HISTORY ===
  const fetchRateHistory = useCallback(async (rateCode: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('erp-market-rates', {
        body: {
          action: 'get_rate_history',
          rate_code: rateCode
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to fetch rate history');

      return data.data as { rate: MarketRate; history: RateHistory[] };
    } catch (err) {
      console.error('Error fetching rate history:', err);
      toast.error('Error al obtener histórico');
      return null;
    }
  }, []);

  // === GROUP RATES BY CURRENCY ===
  const ratesByCurrency = rates.reduce((acc, rate) => {
    if (!acc[rate.currency]) {
      acc[rate.currency] = [];
    }
    acc[rate.currency].push(rate);
    return acc;
  }, {} as Record<string, MarketRate[]>);

  // === GET EURIBOR RATES ===
  const euriborRates = rates.filter(r => r.rate_code.startsWith('euribor_'));

  return {
    rates,
    ratesByCurrency,
    euriborRates,
    centralBankRates,
    referenceRates,
    isLoading: isLoading || isLoadingCentralBank || isLoadingReference,
    error,
    selectedCurrency,
    setSelectedCurrency,
    refetch,
    fetchRateHistory
  };
}

export default useERPMarketRates;
