import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SyncJob {
  id: string;
  name: string;
  source_type: 'database' | 'api' | 'file' | 'stream';
  destination_type: 'database' | 'api' | 'file' | 'warehouse';
  source_config: Record<string, unknown>;
  destination_config: Record<string, unknown>;
  sync_mode: 'full' | 'incremental' | 'cdc';
  schedule?: string;
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SyncRun {
  id: string;
  job_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  records_processed: number;
  records_synced: number;
  records_failed: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  duration_ms?: number;
}

export interface SyncMetrics {
  total_jobs: number;
  active_jobs: number;
  total_runs_today: number;
  success_rate: number;
  records_synced_today: number;
  avg_duration_ms: number;
}

export function useDataSync() {
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [metrics, setMetrics] = useState<SyncMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async (): Promise<SyncJob[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('data-sync', {
        body: { action: 'list_jobs' }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.jobs) {
        setJobs(data.jobs);
        return data.jobs;
      }

      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching sync jobs';
      setError(message);
      console.error('[useDataSync] fetchJobs error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createJob = useCallback(async (job: Partial<SyncJob>): Promise<SyncJob | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('data-sync', {
        body: { action: 'create_job', job }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.job) {
        setJobs(prev => [...prev, data.job]);
        toast.success('Job de sincronización creado');
        return data.job;
      }

      return null;
    } catch (err) {
      console.error('[useDataSync] createJob error:', err);
      toast.error('Error al crear job');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runJob = useCallback(async (jobId: string): Promise<SyncRun | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('data-sync', {
        body: { action: 'run_job', jobId }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.run) {
        setRuns(prev => [data.run, ...prev]);
        toast.success('Sincronización iniciada');
        return data.run;
      }

      return null;
    } catch (err) {
      console.error('[useDataSync] runJob error:', err);
      toast.error('Error al iniciar sincronización');
      return null;
    }
  }, []);

  const cancelRun = useCallback(async (runId: string): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('data-sync', {
        body: { action: 'cancel_run', runId }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setRuns(prev => prev.map(r => r.id === runId ? { ...r, status: 'cancelled' as const } : r));
        toast.success('Sincronización cancelada');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useDataSync] cancelRun error:', err);
      toast.error('Error al cancelar');
      return false;
    }
  }, []);

  const fetchRuns = useCallback(async (jobId?: string, limit: number = 20): Promise<SyncRun[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('data-sync', {
        body: { action: 'list_runs', jobId, limit }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.runs) {
        setRuns(data.runs);
        return data.runs;
      }

      return [];
    } catch (err) {
      console.error('[useDataSync] fetchRuns error:', err);
      return [];
    }
  }, []);

  const fetchMetrics = useCallback(async (): Promise<SyncMetrics | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('data-sync', {
        body: { action: 'get_metrics' }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.metrics) {
        setMetrics(data.metrics);
        return data.metrics;
      }

      return null;
    } catch (err) {
      console.error('[useDataSync] fetchMetrics error:', err);
      return null;
    }
  }, []);

  return {
    jobs,
    runs,
    metrics,
    isLoading,
    error,
    fetchJobs,
    createJob,
    runJob,
    cancelRun,
    fetchRuns,
    fetchMetrics,
  };
}

export default useDataSync;
