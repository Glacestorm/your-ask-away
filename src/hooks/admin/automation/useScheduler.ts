/**
 * useScheduler - Hook para programación de tareas
 * Fase 5 - Automation & Orchestration
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ScheduledJob {
  id: string;
  job_name: string;
  job_type: 'cron' | 'interval' | 'one_time' | 'recurring';
  schedule: string;
  timezone: string;
  action_type: 'function' | 'workflow' | 'api_call' | 'notification';
  action_config: Record<string, unknown>;
  is_active: boolean;
  next_run_at: string;
  last_run_at?: string;
  last_run_status?: 'success' | 'failed' | 'timeout';
  run_count: number;
  failure_count: number;
  max_retries: number;
  timeout_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface JobExecution {
  id: string;
  job_id: string;
  job_name: string;
  status: 'running' | 'completed' | 'failed' | 'timeout' | 'cancelled';
  started_at: string;
  completed_at?: string;
  duration_ms: number;
  output?: Record<string, unknown>;
  error_message?: string;
  retry_attempt: number;
}

export interface SchedulerMetrics {
  active_jobs: number;
  jobs_today: number;
  success_rate: number;
  avg_execution_time_ms: number;
  upcoming_jobs: number;
  failed_jobs_24h: number;
}

export function useScheduler() {
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [executions, setExecutions] = useState<JobExecution[]>([]);
  const [metrics, setMetrics] = useState<SchedulerMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'scheduler',
        {
          body: {
            action: 'list_jobs'
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setJobs(data.jobs || []);
        setMetrics(data.metrics || null);
        setLastRefresh(new Date());
        return data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useScheduler] fetchJobs error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createJob = useCallback(async (job: Partial<ScheduledJob>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'scheduler',
        {
          body: {
            action: 'create_job',
            job
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Job programado exitosamente');
        await fetchJobs();
        return data.job;
      }

      return null;
    } catch (err) {
      console.error('[useScheduler] createJob error:', err);
      toast.error('Error al crear job');
      return null;
    }
  }, [fetchJobs]);

  const updateJob = useCallback(async (jobId: string, updates: Partial<ScheduledJob>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'scheduler',
        {
          body: {
            action: 'update_job',
            jobId,
            updates
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Job actualizado');
        await fetchJobs();
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useScheduler] updateJob error:', err);
      toast.error('Error al actualizar job');
      return false;
    }
  }, [fetchJobs]);

  const deleteJob = useCallback(async (jobId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'scheduler',
        {
          body: {
            action: 'delete_job',
            jobId
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Job eliminado');
        await fetchJobs();
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useScheduler] deleteJob error:', err);
      toast.error('Error al eliminar job');
      return false;
    }
  }, [fetchJobs]);

  const runJobNow = useCallback(async (jobId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'scheduler',
        {
          body: {
            action: 'run_now',
            jobId
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Job ejecutado');
        return data.execution;
      }

      return null;
    } catch (err) {
      console.error('[useScheduler] runJobNow error:', err);
      toast.error('Error al ejecutar job');
      return null;
    }
  }, []);

  const toggleJob = useCallback(async (jobId: string, isActive: boolean) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'scheduler',
        {
          body: {
            action: 'toggle_job',
            jobId,
            isActive
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(isActive ? 'Job activado' : 'Job pausado');
        await fetchJobs();
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useScheduler] toggleJob error:', err);
      toast.error('Error al cambiar estado');
      return false;
    }
  }, [fetchJobs]);

  const getJobHistory = useCallback(async (jobId: string, limit = 20) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'scheduler',
        {
          body: {
            action: 'get_history',
            jobId,
            limit
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setExecutions(data.executions || []);
        return data.executions;
      }

      return [];
    } catch (err) {
      console.error('[useScheduler] getJobHistory error:', err);
      return [];
    }
  }, []);

  const startAutoRefresh = useCallback((intervalMs = 30000) => {
    stopAutoRefresh();
    fetchJobs();
    autoRefreshInterval.current = setInterval(() => {
      fetchJobs();
    }, intervalMs);
  }, [fetchJobs]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    isLoading,
    jobs,
    executions,
    metrics,
    error,
    lastRefresh,
    fetchJobs,
    createJob,
    updateJob,
    deleteJob,
    runJobNow,
    toggleJob,
    getJobHistory,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useScheduler;
