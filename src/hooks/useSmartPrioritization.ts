import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError } from '@/hooks/core/types';
import { parseError, collectTelemetry } from '@/hooks/core/useKBBase';

export type SmartPrioritizationError = KBError;

export interface PrioritizedAccount {
  companyId: string;
  companyName: string;
  mrr: number;
  priority: 'expand' | 'retain' | 'nurture' | 'monitor';
  priorityScore: number;
  expansionPotential: number;
  churnRisk: number;
  recommendedActions: string[];
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  reasoning: string;
}

export const useSmartPrioritization = () => {
  const queryClient = useQueryClient();
  
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

  const prioritizeAccountsMutation = useMutation({
    mutationFn: async (params: { 
      accounts: Array<{
        companyId: string;
        companyName: string;
        mrr: number;
        healthScore: number;
        expansionScore: number;
        retentionScore: number;
        plgSignals: number;
        lastActivity: string;
      }>;
    }) => {
      setStatus('loading');
      const startTime = new Date();
      
      const { data, error: invokeError } = await supabase.functions.invoke('prioritize-accounts', {
        body: params
      });
      
      if (invokeError) {
        const kbError = parseError(invokeError);
        setError(kbError);
        setStatus('error');
        collectTelemetry({
          hookName: 'useSmartPrioritization',
          operationName: 'prioritizeAccounts',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'error',
          error: kbError,
          retryCount
        });
        throw invokeError;
      }
      
      collectTelemetry({
        hookName: 'useSmartPrioritization',
        operationName: 'prioritizeAccounts',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'success',
        retryCount
      });
      
      return data as { prioritizedAccounts: PrioritizedAccount[] };
    },
    onSuccess: () => {
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setStatus('success');
      setError(null);
      toast.success('Cuentas priorizadas con IA');
    },
    onError: (err) => {
      const kbError = parseError(err);
      setError(kbError);
      setStatus('error');
      toast.error('Error al priorizar: ' + kbError.message);
    }
  });

  const getPriorityMatrix = (accounts: PrioritizedAccount[]) => {
    return {
      expand: accounts.filter(a => a.priority === 'expand'),
      retain: accounts.filter(a => a.priority === 'retain'),
      nurture: accounts.filter(a => a.priority === 'nurture'),
      monitor: accounts.filter(a => a.priority === 'monitor')
    };
  };

  const getEffortImpactMatrix = (accounts: PrioritizedAccount[]) => {
    const matrix: Record<string, PrioritizedAccount[]> = {
      'high-high': [],
      'high-medium': [],
      'high-low': [],
      'medium-high': [],
      'medium-medium': [],
      'medium-low': [],
      'low-high': [],
      'low-medium': [],
      'low-low': []
    };

    accounts.forEach(a => {
      const key = `${a.effort}-${a.impact}`;
      if (matrix[key]) {
        matrix[key].push(a);
      }
    });

    return matrix;
  };

  const getQuickWins = (accounts: PrioritizedAccount[]) => {
    return accounts.filter(a => a.effort === 'low' && (a.impact === 'high' || a.impact === 'medium'));
  };

  const getStrategicBets = (accounts: PrioritizedAccount[]) => {
    return accounts.filter(a => a.impact === 'high' && a.effort !== 'low');
  };

  const getTotalPotentialRevenue = (accounts: PrioritizedAccount[]) => {
    return accounts.reduce((sum, a) => sum + (a.mrr * a.expansionPotential), 0);
  };

  const getTotalAtRiskRevenue = (accounts: PrioritizedAccount[]) => {
    return accounts.reduce((sum, a) => sum + (a.mrr * a.churnRisk), 0);
  };

  return {
    prioritizeAccounts: prioritizeAccountsMutation.mutateAsync,
    isPrioritizing: prioritizeAccountsMutation.isPending,
    prioritizedData: prioritizeAccountsMutation.data,
    getPriorityMatrix,
    getEffortImpactMatrix,
    getQuickWins,
    getStrategicBets,
    getTotalPotentialRevenue,
    getTotalAtRiskRevenue,
    // === KB 2.0 RETURN ===
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    error,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
    reset
  };
};
