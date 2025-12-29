/**
 * useObelixiaMultiCurrency - Fase 6: Multi-Currency & International Operations
 * Enterprise SaaS 2025-2026
 * 
 * Gestión de múltiples divisas, tipos de cambio, conversiones y exposición cambiaria
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  isBase: boolean;
  isActive: boolean;
  lastRate?: number;
  lastUpdated?: string;
}

export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  inverseRate: number;
  source: 'manual' | 'api' | 'bank';
  validFrom: string;
  validUntil?: string;
  createdAt: string;
}

export interface CurrencyConversion {
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  rate: number;
  timestamp: string;
  fees?: number;
}

export interface CurrencyExposure {
  currency: string;
  assets: number;
  liabilities: number;
  netExposure: number;
  percentageOfTotal: number;
  unrealizedGainLoss: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface MultiCurrencyReport {
  baseCurrency: string;
  reportDate: string;
  totalAssetsBase: number;
  totalLiabilitiesBase: number;
  exposures: CurrencyExposure[];
  recommendations: string[];
  riskScore: number;
  hedgingSuggestions: Array<{
    action: string;
    currency: string;
    amount: number;
    reason: string;
  }>;
}

export interface MultiCurrencyContext {
  companyId?: string;
  baseCurrency: string;
  activeTransactions?: number;
  reportingPeriod?: string;
}

// === HOOK ===
export function useObelixiaMultiCurrency() {
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [exposureReport, setExposureReport] = useState<MultiCurrencyReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Refs para auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH CURRENCIES ===
  const fetchCurrencies = useCallback(async (context?: MultiCurrencyContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-multi-currency',
        {
          body: {
            action: 'get_currencies',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        setCurrencies(fnData.data.currencies || []);
        setExchangeRates(fnData.data.exchangeRates || []);
        setLastRefresh(new Date());
        return fnData.data;
      }

      throw new Error('Invalid response from currency service');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useObelixiaMultiCurrency] fetchCurrencies error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === UPDATE EXCHANGE RATES ===
  const updateExchangeRates = useCallback(async (
    source: 'api' | 'manual' = 'api',
    manualRates?: Array<{ from: string; to: string; rate: number }>
  ) => {
    setIsLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-multi-currency',
        {
          body: {
            action: 'update_rates',
            params: {
              source,
              manualRates
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setExchangeRates(fnData.data.rates || []);
        toast.success('Tipos de cambio actualizados');
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaMultiCurrency] updateExchangeRates error:', err);
      toast.error('Error al actualizar tipos de cambio');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CONVERT CURRENCY ===
  const convertCurrency = useCallback(async (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<CurrencyConversion | null> => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-multi-currency',
        {
          body: {
            action: 'convert',
            params: {
              amount,
              fromCurrency,
              toCurrency
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        return fnData.data as CurrencyConversion;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaMultiCurrency] convertCurrency error:', err);
      toast.error('Error en conversión de divisa');
      return null;
    }
  }, []);

  // === GET EXPOSURE REPORT ===
  const getExposureReport = useCallback(async (context?: MultiCurrencyContext) => {
    setIsLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-multi-currency',
        {
          body: {
            action: 'exposure_report',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        setExposureReport(fnData.data as MultiCurrencyReport);
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaMultiCurrency] getExposureReport error:', err);
      toast.error('Error al generar reporte de exposición');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === ADD/REMOVE CURRENCY ===
  const manageCurrency = useCallback(async (
    action: 'add' | 'remove' | 'set_base',
    currencyCode: string
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-multi-currency',
        {
          body: {
            action: 'manage_currency',
            params: {
              operation: action,
              currencyCode
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        const messages = {
          add: `Divisa ${currencyCode} añadida`,
          remove: `Divisa ${currencyCode} eliminada`,
          set_base: `${currencyCode} establecida como divisa base`
        };
        toast.success(messages[action]);
        await fetchCurrencies();
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useObelixiaMultiCurrency] manageCurrency error:', err);
      toast.error('Error al gestionar divisa');
      return false;
    }
  }, [fetchCurrencies]);

  // === GET HISTORICAL RATES ===
  const getHistoricalRates = useCallback(async (
    currencyPair: { from: string; to: string },
    period: '7d' | '30d' | '90d' | '1y' = '30d'
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-multi-currency',
        {
          body: {
            action: 'historical_rates',
            params: {
              ...currencyPair,
              period
            }
          }
        }
      );

      if (fnError) throw fnError;

      return fnData?.success ? fnData.data : null;
    } catch (err) {
      console.error('[useObelixiaMultiCurrency] getHistoricalRates error:', err);
      return null;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: MultiCurrencyContext, intervalMs = 300000) => {
    stopAutoRefresh();
    fetchCurrencies(context);
    autoRefreshInterval.current = setInterval(() => {
      fetchCurrencies(context);
    }, intervalMs);
  }, [fetchCurrencies]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  // === RETURN ===
  return {
    // Estado
    isLoading,
    currencies,
    exchangeRates,
    exposureReport,
    error,
    lastRefresh,
    // Acciones
    fetchCurrencies,
    updateExchangeRates,
    convertCurrency,
    getExposureReport,
    manageCurrency,
    getHistoricalRates,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useObelixiaMultiCurrency;
