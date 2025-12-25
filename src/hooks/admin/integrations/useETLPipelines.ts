import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ETLPipeline {
  id: string;
  name: string;
  description?: string;
  stages: ETLStage[];
  schedule?: string;
  is_active: boolean;
  last_run_at?: string;
  avg_duration_ms?: number;
  created_at: string;
  updated_at: string;
}

export interface ETLStage {
  id: string;
  name: string;
  type: 'extract' | 'transform' | 'load' | 'validate';
  config: Record<string, unknown>;
  order: number;
  dependencies?: string[];
}

export interface ETLExecution {
  id: string;
  pipeline_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  current_stage?: string;
  stages_completed: number;
  stages_total: number;
  records_processed: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  logs: ETLLog[];
}

export interface ETLLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  stage: string;
  message: string;
  details?: Record<string, unknown>;
}

export function useETLPipelines() {
  const [pipelines, setPipelines] = useState<ETLPipeline[]>([]);
  const [executions, setExecutions] = useState<ETLExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPipelines = useCallback(async (): Promise<ETLPipeline[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('etl-pipelines', {
        body: { action: 'list_pipelines' }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.pipelines) {
        setPipelines(data.pipelines);
        return data.pipelines;
      }

      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching ETL pipelines';
      setError(message);
      console.error('[useETLPipelines] fetchPipelines error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPipeline = useCallback(async (pipeline: Partial<ETLPipeline>): Promise<ETLPipeline | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('etl-pipelines', {
        body: { action: 'create_pipeline', pipeline }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.pipeline) {
        setPipelines(prev => [...prev, data.pipeline]);
        toast.success('Pipeline ETL creado');
        return data.pipeline;
      }

      return null;
    } catch (err) {
      console.error('[useETLPipelines] createPipeline error:', err);
      toast.error('Error al crear pipeline');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePipeline = useCallback(async (id: string, updates: Partial<ETLPipeline>): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('etl-pipelines', {
        body: { action: 'update_pipeline', id, updates }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setPipelines(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
        toast.success('Pipeline actualizado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useETLPipelines] updatePipeline error:', err);
      toast.error('Error al actualizar pipeline');
      return false;
    }
  }, []);

  const runPipeline = useCallback(async (pipelineId: string): Promise<ETLExecution | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('etl-pipelines', {
        body: { action: 'run_pipeline', pipelineId }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.execution) {
        setExecutions(prev => [data.execution, ...prev]);
        toast.success('Pipeline iniciado');
        return data.execution;
      }

      return null;
    } catch (err) {
      console.error('[useETLPipelines] runPipeline error:', err);
      toast.error('Error al iniciar pipeline');
      return null;
    }
  }, []);

  const cancelExecution = useCallback(async (executionId: string): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('etl-pipelines', {
        body: { action: 'cancel_execution', executionId }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setExecutions(prev => prev.map(e => 
          e.id === executionId ? { ...e, status: 'cancelled' as const } : e
        ));
        toast.success('Ejecución cancelada');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useETLPipelines] cancelExecution error:', err);
      toast.error('Error al cancelar ejecución');
      return false;
    }
  }, []);

  const fetchExecutions = useCallback(async (pipelineId?: string, limit: number = 20): Promise<ETLExecution[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('etl-pipelines', {
        body: { action: 'list_executions', pipelineId, limit }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.executions) {
        setExecutions(data.executions);
        return data.executions;
      }

      return [];
    } catch (err) {
      console.error('[useETLPipelines] fetchExecutions error:', err);
      return [];
    }
  }, []);

  const getExecutionLogs = useCallback(async (executionId: string): Promise<ETLLog[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('etl-pipelines', {
        body: { action: 'get_logs', executionId }
      });

      if (fnError) throw fnError;

      return data?.logs || [];
    } catch (err) {
      console.error('[useETLPipelines] getExecutionLogs error:', err);
      return [];
    }
  }, []);

  return {
    pipelines,
    executions,
    isLoading,
    error,
    fetchPipelines,
    createPipeline,
    updatePipeline,
    runPipeline,
    cancelExecution,
    fetchExecutions,
    getExecutionLogs,
  };
}

export default useETLPipelines;
