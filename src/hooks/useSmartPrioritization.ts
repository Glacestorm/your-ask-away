import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      const { data, error } = await supabase.functions.invoke('prioritize-accounts', {
        body: params
      });
      
      if (error) throw error;
      return data as { prioritizedAccounts: PrioritizedAccount[] };
    },
    onSuccess: () => {
      toast.success('Cuentas priorizadas con IA');
    },
    onError: (error) => {
      toast.error('Error al priorizar: ' + error.message);
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
    getTotalAtRiskRevenue
  };
};
