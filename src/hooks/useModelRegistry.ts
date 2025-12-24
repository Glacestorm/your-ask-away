import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KBStatus, KBError } from '@/hooks/core/types';
import { parseError, collectTelemetry } from '@/hooks/core/useKBBase';

// Re-export for backwards compat
export type ModelRegistryError = KBError;
export interface MLModel {
  id: string;
  model_name: string;
  model_type: string;
  version: string;
  description: string | null;
  parameters: Record<string, unknown>;
  training_data_info: Record<string, unknown> | null;
  performance_metrics: {
    auc?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
  };
  is_active: boolean;
  is_production: boolean;
  ab_test_group: string | null;
  ab_test_weight: number;
  trained_at: string | null;
  deployed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ABTest {
  id: string;
  test_name: string;
  description: string | null;
  model_a_id: string;
  model_b_id: string;
  traffic_split_a: number;
  start_date: string;
  end_date: string | null;
  status: 'running' | 'completed' | 'stopped';
  results: Record<string, unknown>;
  winner_model_id: string | null;
  created_at: string;
}

export function useModelRegistry() {
  const queryClient = useQueryClient();
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoadingState = status === 'loading';
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

  // Fetch all models
  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ['ml-models'],
    queryFn: async () => {
      const startTime = new Date();
      setStatus('loading');
      
      try {
        const { data, error: fetchError } = await supabase
          .from('ml_model_registry')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        
        setStatus('success');
        setLastSuccess(new Date());
        setLastRefresh(new Date());
        
        collectTelemetry({
          hookName: 'useModelRegistry',
          operationName: 'fetchModels',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'success',
          retryCount
        });
        
        return data as MLModel[];
      } catch (err) {
        const kbError = parseError(err);
        setError(kbError);
        setStatus('error');
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch all A/B tests
  const { data: abTests, isLoading: abTestsLoading } = useQuery({
    queryKey: ['ml-ab-tests'],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from('ml_ab_tests')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      return data as ABTest[];
    },
    staleTime: 5 * 60 * 1000
  });

  // Register new model
  const registerModelMutation = useMutation({
    mutationFn: async (model: { 
      model_name: string; 
      model_type: string; 
      version: string;
      description?: string;
      parameters?: Record<string, unknown>;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('ml_model_registry')
        .insert({
          model_name: model.model_name,
          model_type: model.model_type,
          version: model.version,
          description: model.description || null,
          parameters: model.parameters as unknown as Record<string, never>,
          is_active: model.is_active ?? true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-models'] });
      toast.success('Model registrat correctament');
    },
    onError: (error) => {
      toast.error(`Error registrant model: ${error.message}`);
    }
  });

  // Update model
  const updateModelMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { 
      is_active?: boolean; 
      is_production?: boolean;
      description?: string;
    } }) => {
      const { data, error } = await supabase
        .from('ml_model_registry')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-models'] });
      toast.success('Model actualitzat');
    }
  });

  // Promote to production
  const promoteToProductionMutation = useMutation({
    mutationFn: async (modelId: string) => {
      // First, demote all other models of same type
      const model = models?.find(m => m.id === modelId);
      if (model) {
        await supabase
          .from('ml_model_registry')
          .update({ is_production: false })
          .eq('model_type', model.model_type);
      }

      // Then promote this one
      const { data, error } = await supabase
        .from('ml_model_registry')
        .update({ 
          is_production: true, 
          deployed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', modelId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-models'] });
      toast.success('Model promogut a producció');
    }
  });

  // Create A/B test
  const createABTestMutation = useMutation({
    mutationFn: async (test: { 
      test_name: string;
      model_a_id: string;
      model_b_id: string;
      description?: string;
      traffic_split_a?: number;
    }) => {
      const { data, error } = await supabase
        .from('ml_ab_tests')
        .insert({
          test_name: test.test_name,
          model_a_id: test.model_a_id,
          model_b_id: test.model_b_id,
          description: test.description || null,
          traffic_split_a: test.traffic_split_a ?? 0.5
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-ab-tests'] });
      toast.success('Test A/B creat');
    }
  });

  // Complete A/B test
  const completeABTestMutation = useMutation({
    mutationFn: async ({ testId, winnerId }: { testId: string; winnerId: string }) => {
      const { data, error } = await supabase
        .from('ml_ab_tests')
        .update({ 
          status: 'completed',
          end_date: new Date().toISOString(),
          winner_model_id: winnerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', testId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-ab-tests'] });
      toast.success('Test A/B completat');
    }
  });

  return {
    models,
    modelsLoading,
    abTests,
    abTestsLoading,
    registerModel: registerModelMutation.mutate,
    updateModel: updateModelMutation.mutate,
    promoteToProduction: promoteToProductionMutation.mutate,
    createABTest: createABTestMutation.mutate,
    completeABTest: completeABTestMutation.mutate,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError
  };
}

export default useModelRegistry;
