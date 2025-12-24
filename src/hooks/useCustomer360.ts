/**
 * useCustomer360 - KB 2.0 Migration
 * Enterprise-grade customer 360 with state machine, retry, and telemetry
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  KBStatus, 
  KBError, 
  createKBError, 
  parseError, 
  collectTelemetry 
} from './core';

// === TIPOS KB 2.0 ===
export interface Customer360Profile {
  id: string;
  company_id: string;
  rfm_score: {
    r: number;
    f: number;
    m: number;
    score: number;
  } | null;
  churn_probability: number | null;
  credit_score: number | null;
  clv_score: number | null;
  health_score: number | null;
  total_visits: number;
  successful_visits: number;
  last_visit_date: string | null;
  avg_visit_frequency_days: number | null;
  total_products: number;
  active_products: number;
  total_transaction_volume: number;
  avg_monthly_volume: number;
  segment: string | null;
  tier: string | null;
  lifecycle_stage: string | null;
  preferred_channel: string | null;
  recommended_products: string[];
  cross_sell_opportunities: Array<{
    product: string;
    reason: string;
    priority: string;
  }>;
  next_best_actions: Array<{
    action: string;
    priority: string;
    expected_impact: string;
  }>;
  risk_flags: string[];
  compliance_status: string;
  interaction_summary: {
    total_visits: number;
    last_30_days: number;
    by_result: {
      positive: number;
      negative: number;
      pending: number;
    };
    channels_used: string[];
  } | null;
  last_calculated_at: string | null;
}

export interface CustomerInteraction {
  id: string;
  company_id: string;
  interaction_type: string;
  interaction_date: string;
  channel: string | null;
  subject: string | null;
  description: string | null;
  outcome: string | null;
  sentiment: string | null;
  importance: string;
  metadata: Record<string, unknown>;
}

// === HOOK PRINCIPAL KB 2.0 ===
export function useCustomer360(companyId: string | null) {
  const queryClient = useQueryClient();
  const [isCalculating, setIsCalculating] = useState(false);
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
    if (companyId) {
      queryClient.resetQueries({ queryKey: ['customer-360-profile', companyId] });
    }
  }, [companyId, queryClient]);

  // === QUERIES ===
  const { data: profile, isLoading: isLoadingProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['customer-360-profile', companyId],
    queryFn: async () => {
      const startTime = new Date();
      if (!companyId) return null;
      
      try {
        const { data, error: queryError } = await supabase
          .from('customer_360_profiles')
          .select('*')
          .eq('company_id', companyId)
          .maybeSingle();

        if (queryError) throw queryError;

        setLastRefresh(new Date());
        setLastSuccess(new Date());

        collectTelemetry({
          hookName: 'useCustomer360',
          operationName: 'fetchProfile',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'success',
          retryCount: 0,
        });

        return data as unknown as Customer360Profile | null;
      } catch (err) {
        const parsed = parseError(err);
        setError(parsed);

        collectTelemetry({
          hookName: 'useCustomer360',
          operationName: 'fetchProfile',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'error',
          error: parsed,
          retryCount: 0,
        });

        throw err;
      }
    },
    enabled: !!companyId,
    retry: 3,
  });

  const { data: interactions, isLoading: isLoadingInteractions } = useQuery({
    queryKey: ['customer-interactions', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error: queryError } = await supabase
        .from('customer_interactions')
        .select('*')
        .eq('company_id', companyId)
        .order('interaction_date', { ascending: false })
        .limit(50);

      if (queryError) throw queryError;
      return data as CustomerInteraction[];
    },
    enabled: !!companyId,
    retry: 3,
  });

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['enriched-transactions', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error: queryError } = await supabase
        .from('enriched_transactions')
        .select('*')
        .eq('company_id', companyId)
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (queryError) throw queryError;
      return data || [];
    },
    enabled: !!companyId,
    retry: 3,
  });

  // === CALCULATE PROFILE ===
  const calculateProfile = useCallback(async () => {
    if (!companyId) return;
    
    const startTime = new Date();
    setIsCalculating(true);
    setStatus('loading');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('calculate-customer-360', {
        body: { companyId }
      });

      if (fnError) throw fnError;

      queryClient.invalidateQueries({ queryKey: ['customer-360-profile', companyId] });
      queryClient.invalidateQueries({ queryKey: ['customer-interactions', companyId] });
      
      setStatus('success');
      setLastSuccess(new Date());
      toast.success('Perfil 360° actualizado correctamente');

      collectTelemetry({
        hookName: 'useCustomer360',
        operationName: 'calculateProfile',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'success',
        retryCount: 0,
      });

      return data;
    } catch (err) {
      const parsed = parseError(err);
      setError(parsed);
      setStatus('error');

      collectTelemetry({
        hookName: 'useCustomer360',
        operationName: 'calculateProfile',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'error',
        error: parsed,
        retryCount: 0,
      });

      toast.error('Error al calcular el perfil: ' + parsed.message);
      throw err;
    } finally {
      setIsCalculating(false);
    }
  }, [companyId, queryClient]);

  // === ENRICH TRANSACTIONS ===
  const enrichTransactions = useCallback(async (transactionsData: unknown[]) => {
    if (!companyId) return;

    const startTime = new Date();

    try {
      const { data, error: fnError } = await supabase.functions.invoke('enrich-transaction', {
        body: { 
          companyId,
          transactions: transactionsData 
        }
      });

      if (fnError) throw fnError;

      queryClient.invalidateQueries({ queryKey: ['enriched-transactions', companyId] });
      toast.success(`${data.enriched_count} transacciones enriquecidas`);

      collectTelemetry({
        hookName: 'useCustomer360',
        operationName: 'enrichTransactions',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'success',
        retryCount: 0,
      });

      return data;
    } catch (err) {
      const parsed = parseError(err);
      setError(parsed);

      collectTelemetry({
        hookName: 'useCustomer360',
        operationName: 'enrichTransactions',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'error',
        error: parsed,
        retryCount: 0,
      });

      toast.error('Error al enriquecer transacciones: ' + parsed.message);
      throw err;
    }
  }, [companyId, queryClient]);

  // === ADD INTERACTION MUTATION ===
  const addInteractionMutation = useMutation({
    mutationFn: async (interaction: Omit<CustomerInteraction, 'id'>) => {
      const { data, error: mutationError } = await supabase
        .from('customer_interactions')
        .insert(interaction as any)
        .select()
        .single();

      if (mutationError) throw mutationError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-interactions', companyId] });
      toast.success('Interacción registrada');
    },
    onError: (err) => {
      const parsed = parseError(err);
      setError(parsed);
      toast.error('Error al registrar interacción: ' + parsed.message);
    }
  });

  // === COMPUTED STATUS ===
  const computedStatus: KBStatus = isLoadingProfile || isLoadingInteractions || isLoadingTransactions
    ? 'loading'
    : error
      ? 'error'
      : profile
        ? 'success'
        : 'idle';

  // === KB 2.0 COMPUTED ===
  const isIdle = computedStatus === 'idle';
  const isLoading = computedStatus === 'loading' || isCalculating;
  const isSuccess = computedStatus === 'success';
  const isError = computedStatus === 'error';
  const canRetry = error?.retryable === true && retryCount < 3;

  // === RETURN KB 2.0 ===
  return {
    // Data
    profile,
    interactions,
    transactions,
    data: profile,
    
    // State Machine KB 2.0
    status: computedStatus,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    isCalculating,
    
    // Error Management KB 2.0
    error,
    clearError,
    
    // Retry Management
    retryCount,
    canRetry,
    retry: refetchProfile,
    
    // Request Control
    refetch: refetchProfile,
    reset,
    
    // Metadata
    lastRefresh,
    lastSuccess,
    
    // Actions
    calculateProfile,
    enrichTransactions,
    addInteraction: addInteractionMutation.mutate,
    addInteractionAsync: addInteractionMutation.mutateAsync,
  };
}

// === HOOK BULK KB 2.0 ===
export function useCustomer360Bulk() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reset = useCallback(() => {
    setIsProcessing(false);
    setProgress(0);
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);

  const calculateAllProfiles = useCallback(async () => {
    const startTime = new Date();
    setIsProcessing(true);
    setProgress(0);
    setStatus('loading');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('calculate-customer-360', {
        body: { calculateAll: true }
      });

      if (fnError) throw fnError;

      setProgress(100);
      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());

      collectTelemetry({
        hookName: 'useCustomer360Bulk',
        operationName: 'calculateAllProfiles',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'success',
        retryCount: 0,
        metadata: { processedCount: data.processed },
      });

      toast.success(`${data.processed} perfiles calculados`);
      return data;
    } catch (err) {
      const parsed = parseError(err);
      setError(parsed);
      setStatus('error');

      collectTelemetry({
        hookName: 'useCustomer360Bulk',
        operationName: 'calculateAllProfiles',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'error',
        error: parsed,
        retryCount: 0,
      });

      toast.error('Error: ' + parsed.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const canRetry = error?.retryable === true && retryCount < 3;

  return {
    // Actions
    calculateAllProfiles,
    execute: calculateAllProfiles,
    
    // State
    isProcessing,
    progress,
    
    // State Machine KB 2.0
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    
    // Error Management KB 2.0
    error,
    clearError,
    
    // Retry Management
    retryCount,
    canRetry,
    retry: calculateAllProfiles,
    
    // Request Control
    reset,
    
    // Metadata
    lastRefresh,
    lastSuccess,
  };
}

export default useCustomer360;
