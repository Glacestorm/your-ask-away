/**
 * Hook for Currency Exposure and FX Risk Management
 */

import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';

export interface CurrencyExposure {
  currency: string;
  receivables: number;
  payables: number;
  netExposure: number;
  hedged: number;
  unhedged: number;
  documentaryCredits: number;
  guarantees: number;
}

export interface ExchangeRate {
  id: string;
  base_currency: string;
  quote_currency: string;
  rate: number;
  rate_date: string;
  source: string;
  created_at: string;
}

export interface FXHedge {
  id: string;
  company_id: string;
  hedge_type: 'forward' | 'option' | 'swap' | 'collar';
  buy_currency: string;
  sell_currency: string;
  notional_amount: number;
  strike_rate: number;
  maturity_date: string;
  counterparty: string;
  status: 'active' | 'matured' | 'cancelled';
  premium?: number;
  created_at: string;
}

export interface CurrencyStats {
  totalExposure: number;
  hedgeRatio: number;
  mainCurrencies: { currency: string; exposure: number }[];
  riskLevel: 'low' | 'medium' | 'high';
}

// Mock exchange rates (in production would come from API)
const MOCK_RATES: Record<string, number> = {
  'EUR/USD': 1.0850,
  'EUR/GBP': 0.8560,
  'EUR/JPY': 162.45,
  'EUR/CHF': 0.9420,
  'EUR/CNY': 7.8650,
  'USD/EUR': 0.9217,
  'GBP/EUR': 1.1682,
};

export function useERPCurrencyExposure() {
  const { currentCompany } = useERPContext();
  const [exposures, setExposures] = useState<CurrencyExposure[]>([]);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [hedges, setHedges] = useState<FXHedge[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculate exposures from various sources
  const calculateExposures = useCallback(async () => {
    if (!currentCompany?.id) return;
    
    setLoading(true);
    try {
      // Fetch documentary credits by currency
      const { data: credits } = await supabase
        .from('erp_documentary_credits')
        .select('currency, amount, credit_type, status')
        .eq('company_id', currentCompany.id)
        .in('status', ['issued', 'advised', 'confirmed', 'amended', 'utilized']);

      // Fetch bank guarantees by currency
      const { data: guarantees } = await supabase
        .from('erp_bank_guarantees')
        .select('currency, amount, status')
        .eq('company_id', currentCompany.id)
        .in('status', ['issued', 'active']);

      // Fetch discount operations by currency
      const { data: discounts } = await supabase
        .from('erp_commercial_discounts')
        .select('currency, total_nominal, status')
        .eq('company_id', currentCompany.id)
        .in('status', ['pending', 'sent', 'discounted']);

      // Aggregate by currency
      const currencyMap = new Map<string, CurrencyExposure>();

      // Process documentary credits
      (credits || []).forEach((c) => {
        const curr = c.currency || 'EUR';
        if (!currencyMap.has(curr)) {
          currencyMap.set(curr, {
            currency: curr,
            receivables: 0,
            payables: 0,
            netExposure: 0,
            hedged: 0,
            unhedged: 0,
            documentaryCredits: 0,
            guarantees: 0,
          });
        }
        const exp = currencyMap.get(curr)!;
        exp.documentaryCredits += Number(c.amount) || 0;
        if (c.credit_type === 'export') {
          exp.receivables += Number(c.amount) || 0;
        } else {
          exp.payables += Number(c.amount) || 0;
        }
      });

      // Process guarantees
      (guarantees || []).forEach((g) => {
        const curr = g.currency || 'EUR';
        if (!currencyMap.has(curr)) {
          currencyMap.set(curr, {
            currency: curr,
            receivables: 0,
            payables: 0,
            netExposure: 0,
            hedged: 0,
            unhedged: 0,
            documentaryCredits: 0,
            guarantees: 0,
          });
        }
        const exp = currencyMap.get(curr)!;
        exp.guarantees += Number(g.amount) || 0;
      });

      // Process discounts (usually receivables)
      (discounts || []).forEach((d) => {
        const curr = d.currency || 'EUR';
        if (!currencyMap.has(curr)) {
          currencyMap.set(curr, {
            currency: curr,
            receivables: 0,
            payables: 0,
            netExposure: 0,
            hedged: 0,
            unhedged: 0,
            documentaryCredits: 0,
            guarantees: 0,
          });
        }
        const exp = currencyMap.get(curr)!;
        exp.receivables += Number(d.total_nominal) || 0;
      });

      // Calculate net exposure
      currencyMap.forEach((exp) => {
        exp.netExposure = exp.receivables - exp.payables;
        exp.unhedged = Math.abs(exp.netExposure) - exp.hedged;
        if (exp.unhedged < 0) exp.unhedged = 0;
      });

      // Filter out EUR (base currency) and sort by absolute exposure
      const result = Array.from(currencyMap.values())
        .filter(e => e.currency !== 'EUR' && (e.receivables > 0 || e.payables > 0))
        .sort((a, b) => Math.abs(b.netExposure) - Math.abs(a.netExposure));

      setExposures(result);
      return result;
    } catch (error) {
      console.error('Error calculating exposures:', error);
      toast.error('Error al calcular exposiciones');
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id]);

  // Get current exchange rate
  const getRate = useCallback((baseCurrency: string, quoteCurrency: string): number => {
    const pair = `${baseCurrency}/${quoteCurrency}`;
    const inversePair = `${quoteCurrency}/${baseCurrency}`;
    
    if (MOCK_RATES[pair]) return MOCK_RATES[pair];
    if (MOCK_RATES[inversePair]) return 1 / MOCK_RATES[inversePair];
    
    // If both are the same currency
    if (baseCurrency === quoteCurrency) return 1;
    
    return 0;
  }, []);

  // Convert amount between currencies
  const convertAmount = useCallback((
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): number => {
    const rate = getRate(fromCurrency, toCurrency);
    return rate > 0 ? amount * rate : 0;
  }, [getRate]);

  // Get statistics
  const stats = useMemo((): CurrencyStats => {
    const totalExposure = exposures.reduce(
      (sum, e) => sum + Math.abs(convertAmount(e.netExposure, e.currency, 'EUR')),
      0
    );
    
    const totalHedged = exposures.reduce(
      (sum, e) => sum + convertAmount(e.hedged, e.currency, 'EUR'),
      0
    );

    const hedgeRatio = totalExposure > 0 ? (totalHedged / totalExposure) * 100 : 0;

    const mainCurrencies = exposures
      .slice(0, 5)
      .map(e => ({
        currency: e.currency,
        exposure: convertAmount(Math.abs(e.netExposure), e.currency, 'EUR'),
      }));

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (hedgeRatio < 30 && totalExposure > 500000) riskLevel = 'high';
    else if (hedgeRatio < 60 && totalExposure > 100000) riskLevel = 'medium';

    return {
      totalExposure,
      hedgeRatio,
      mainCurrencies,
      riskLevel,
    };
  }, [exposures, convertAmount]);

  // Fetch rates from mock (in production would use external API)
  const fetchRates = useCallback(async () => {
    // Simulate API call
    const mockRates: ExchangeRate[] = Object.entries(MOCK_RATES).map(([pair, rate], idx) => {
      const [base, quote] = pair.split('/');
      return {
        id: `rate-${idx}`,
        base_currency: base,
        quote_currency: quote,
        rate,
        rate_date: new Date().toISOString().split('T')[0],
        source: 'ECB',
        created_at: new Date().toISOString(),
      };
    });
    setRates(mockRates);
    return mockRates;
  }, []);

  return {
    exposures,
    rates,
    hedges,
    loading,
    stats,
    calculateExposures,
    fetchRates,
    getRate,
    convertAmount,
  };
}

export default useERPCurrencyExposure;
