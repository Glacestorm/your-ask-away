import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============ INTERFACES ============

export interface SmartTrial {
  id: string;
  company_id: string;
  plan_type: string;
  features: string[];
  duration_days: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'converted' | 'expired' | 'cancelled';
  usage_metrics: Record<string, number>;
  conversion_score: number;
  companies?: {
    name: string;
    cnae_code: string;
    sector: string;
  };
  ai_recommendations?: {
    recommended_duration_days: number;
    recommended_features: string[];
    conversion_probability: number;
    upsell_opportunities: string[];
    engagement_tactics?: string[];
  };
  created_at: string;
}

export interface UsageMetric {
  id: string;
  company_id: string;
  metric_type: string;
  quantity: number;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface BillingCalculation {
  company_id: string;
  period: { start: string; end: string };
  line_items: Record<string, { quantity: number; unit_price: number; total: number }>;
  subtotal: number;
  tax: number;
  total: number;
}

export interface Affiliate {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  affiliate_code: string;
  commission_rate: number;
  payment_method: string;
  status: 'active' | 'inactive' | 'suspended';
  total_referrals: number;
  total_earnings: number;
  pending_payout: number;
  created_at: string;
}

export interface AffiliateReferral {
  id: string;
  affiliate_id: string;
  referred_company_id: string;
  deal_value: number;
  commission_rate: number;
  commission_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  conversion_date: string;
}

export interface Quote {
  id: string;
  company_id: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  valid_until: string;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_terms?: string;
  delivery_timeline?: string;
  notes?: string;
  ai_suggestions?: string[];
  ai_generated: boolean;
  companies?: {
    name: string;
    cnae_code: string;
    sector: string;
  };
  created_at: string;
  approved_at?: string;
}

export interface RevenueEngineStats {
  active_trials: number;
  trial_conversion_rate: number;
  total_affiliates: number;
  pending_commissions: number;
  pending_quotes: number;
  monthly_usage_revenue: number;
}

// ============ HOOK ============

export function useRevenueEngine() {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [trials, setTrials] = useState<SmartTrial[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [stats, setStats] = useState<RevenueEngineStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // ============ SMART TRIALS ============

  const fetchTrials = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('revenue-engine', {
        body: { action: 'get_trials', params: { limit: 50 } }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setTrials(data.trials || []);
        setLastRefresh(new Date());
        return data.trials;
      }

      throw new Error(data?.error || 'Error fetching trials');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useRevenueEngine] fetchTrials error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTrial = useCallback(async (
    companyId: string,
    planType?: string,
    features?: string[],
    durationDays?: number
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('revenue-engine', {
        body: {
          action: 'create_trial',
          params: {
            company_id: companyId,
            plan_type: planType,
            features,
            duration_days: durationDays
          }
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Trial creado con configuración inteligente', {
          description: `Duración: ${data.smart_config?.duration} días`
        });
        await fetchTrials();
        return data.trial;
      }

      throw new Error(data?.error || 'Error creating trial');
    } catch (err) {
      console.error('[useRevenueEngine] createTrial error:', err);
      toast.error('Error al crear trial');
      return null;
    }
  }, [fetchTrials]);

  const analyzeTrialConversion = useCallback(async (trialId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('revenue-engine', {
        body: { action: 'analyze_trial_conversion', params: { trial_id: trialId } }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        return data.analysis;
      }

      throw new Error(data?.error || 'Error analyzing conversion');
    } catch (err) {
      console.error('[useRevenueEngine] analyzeTrialConversion error:', err);
      toast.error('Error al analizar conversión');
      return null;
    }
  }, []);

  // ============ USAGE-BASED BILLING ============

  const getUsageMetrics = useCallback(async (
    companyId: string,
    periodStart?: string,
    periodEnd?: string
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('revenue-engine', {
        body: {
          action: 'get_usage_metrics',
          params: {
            company_id: companyId,
            period_start: periodStart,
            period_end: periodEnd
          }
        }
      });

      if (fnError) throw fnError;
      return data?.success ? data : null;
    } catch (err) {
      console.error('[useRevenueEngine] getUsageMetrics error:', err);
      return null;
    }
  }, []);

  const calculateBilling = useCallback(async (
    companyId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<BillingCalculation | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('revenue-engine', {
        body: {
          action: 'calculate_billing',
          params: { company_id: companyId, period_start: periodStart, period_end: periodEnd }
        }
      });

      if (fnError) throw fnError;
      return data?.success ? data : null;
    } catch (err) {
      console.error('[useRevenueEngine] calculateBilling error:', err);
      toast.error('Error al calcular facturación');
      return null;
    }
  }, []);

  const generateInvoice = useCallback(async (companyId: string, billingData: BillingCalculation) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('revenue-engine', {
        body: {
          action: 'generate_invoice',
          params: { company_id: companyId, billing_data: billingData }
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.invoice_id) {
        toast.success('Factura generada', {
          description: `Total: €${data.amount?.toFixed(2)}`
        });
        return data;
      }

      throw new Error(data?.error || 'Error generating invoice');
    } catch (err) {
      console.error('[useRevenueEngine] generateInvoice error:', err);
      toast.error('Error al generar factura');
      return null;
    }
  }, []);

  // ============ AFFILIATES ============

  const fetchAffiliates = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('revenue-engine', {
        body: { action: 'get_affiliates' }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setAffiliates(data.affiliates || []);
        return data.affiliates;
      }

      throw new Error(data?.error || 'Error fetching affiliates');
    } catch (err) {
      console.error('[useRevenueEngine] fetchAffiliates error:', err);
      return [];
    }
  }, []);

  const registerAffiliate = useCallback(async (
    name: string,
    email: string,
    commissionRate?: number,
    paymentMethod?: string
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('revenue-engine', {
        body: {
          action: 'register_affiliate',
          params: { name, email, commission_rate: commissionRate, payment_method: paymentMethod }
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Afiliado registrado', {
          description: `Código: ${data.affiliate?.affiliate_code}`
        });
        await fetchAffiliates();
        return data.affiliate;
      }

      throw new Error(data?.error || 'Error registering affiliate');
    } catch (err) {
      console.error('[useRevenueEngine] registerAffiliate error:', err);
      toast.error('Error al registrar afiliado');
      return null;
    }
  }, [fetchAffiliates]);

  const trackReferral = useCallback(async (
    affiliateCode: string,
    referredCompanyId: string,
    dealValue: number
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('revenue-engine', {
        body: {
          action: 'track_referral',
          params: {
            affiliate_code: affiliateCode,
            referred_company_id: referredCompanyId,
            deal_value: dealValue
          }
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Referido registrado', {
          description: `Comisión: €${data.commission?.toFixed(2)}`
        });
        return data;
      }

      throw new Error(data?.error || 'Error tracking referral');
    } catch (err) {
      console.error('[useRevenueEngine] trackReferral error:', err);
      toast.error('Error al registrar referido');
      return null;
    }
  }, []);

  // ============ QUOTES ============

  const fetchQuotes = useCallback(async (status?: string, companyId?: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('revenue-engine', {
        body: { action: 'get_quotes', params: { status, company_id: companyId } }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setQuotes(data.quotes || []);
        return data.quotes;
      }

      throw new Error(data?.error || 'Error fetching quotes');
    } catch (err) {
      console.error('[useRevenueEngine] fetchQuotes error:', err);
      return [];
    }
  }, []);

  const generateQuote = useCallback(async (
    companyId: string,
    requirements: Record<string, unknown>,
    contactInfo?: Record<string, string>
  ) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('revenue-engine', {
        body: {
          action: 'generate_quote',
          params: { company_id: companyId, requirements, contact_info: contactInfo }
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Cotización generada con IA', {
          description: `Total: €${data.quote?.total?.toFixed(2)}`
        });
        await fetchQuotes();
        return data.quote;
      }

      throw new Error(data?.error || 'Error generating quote');
    } catch (err) {
      console.error('[useRevenueEngine] generateQuote error:', err);
      toast.error('Error al generar cotización');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchQuotes]);

  const approveQuote = useCallback(async (quoteId: string, approvedBy?: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('revenue-engine', {
        body: { action: 'approve_quote', params: { quote_id: quoteId, approved_by: approvedBy } }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Cotización aprobada');
        await fetchQuotes();
        return data.quote;
      }

      throw new Error(data?.error || 'Error approving quote');
    } catch (err) {
      console.error('[useRevenueEngine] approveQuote error:', err);
      toast.error('Error al aprobar cotización');
      return null;
    }
  }, [fetchQuotes]);

  // ============ STATS ============

  const calculateStats = useCallback(() => {
    const activeTrials = trials.filter(t => t.status === 'active').length;
    const convertedTrials = trials.filter(t => t.status === 'converted').length;
    const totalTrials = trials.length;

    const pendingCommissions = affiliates.reduce((sum, a) => sum + (a.pending_payout || 0), 0);
    const pendingQuotes = quotes.filter(q => q.status === 'sent' || q.status === 'draft').length;

    setStats({
      active_trials: activeTrials,
      trial_conversion_rate: totalTrials > 0 ? (convertedTrials / totalTrials) * 100 : 0,
      total_affiliates: affiliates.filter(a => a.status === 'active').length,
      pending_commissions: pendingCommissions,
      pending_quotes: pendingQuotes,
      monthly_usage_revenue: 0 // Would need to calculate from billing
    });
  }, [trials, affiliates, quotes]);

  // ============ AUTO-REFRESH ============

  const startAutoRefresh = useCallback((intervalMs = 60000) => {
    stopAutoRefresh();
    
    Promise.all([fetchTrials(), fetchAffiliates(), fetchQuotes()]);
    
    autoRefreshInterval.current = setInterval(() => {
      fetchTrials();
      fetchAffiliates();
      fetchQuotes();
    }, intervalMs);
  }, [fetchTrials, fetchAffiliates, fetchQuotes]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  // Calculate stats when data changes
  useEffect(() => {
    calculateStats();
  }, [trials, affiliates, quotes, calculateStats]);

  // Cleanup
  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    // State
    isLoading,
    trials,
    affiliates,
    quotes,
    stats,
    error,
    lastRefresh,

    // Trials
    fetchTrials,
    createTrial,
    analyzeTrialConversion,

    // Billing
    getUsageMetrics,
    calculateBilling,
    generateInvoice,

    // Affiliates
    fetchAffiliates,
    registerAffiliate,
    trackReferral,

    // Quotes
    fetchQuotes,
    generateQuote,
    approveQuote,

    // Auto-refresh
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useRevenueEngine;
