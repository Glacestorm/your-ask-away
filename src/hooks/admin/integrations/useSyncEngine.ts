/**
 * useSyncEngine Hook
 * Fase 10 - Integration & External Services
 * Motor de sincronización de datos entre sistemas
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SyncConfig {
  id: string;
  name: string;
  source_system: string;
  target_system: string;
  sync_type: 'full' | 'incremental' | 'bidirectional';
  schedule_cron: string | null;
  is_active: boolean;
  field_mappings: FieldMapping[];
  conflict_resolution: 'source_wins' | 'target_wins' | 'newest_wins' | 'manual';
  batch_size: number;
  created_at: string;
  updated_at: string;
}

export interface FieldMapping {
  source_field: string;
  target_field: string;
  transform: string | null;
  is_key: boolean;
}

export interface SyncJob {
  id: string;
  config_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string | null;
  completed_at: string | null;
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_log: string[];
  progress_percentage: number;
}

export interface SyncStats {
  total_syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  records_synced_today: number;
  avg_sync_duration_ms: number;
  last_sync_at: string | null;
}

export function useSyncEngine() {
  const [configs, setConfigs] = useState<SyncConfig[]>([]);
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [activeJob, setActiveJob] = useState<SyncJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('sync-engine', {
        body: { action: 'list_configs' }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        setConfigs(data.configs || []);
        return data.configs;
      }
      throw new Error(data?.error || 'Error fetching configs');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useSyncEngine] fetchConfigs error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createConfig = useCallback(async (config: Partial<SyncConfig>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('sync-engine', {
        body: { action: 'create_config', config }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Configuración de sincronización creada');
        setConfigs(prev => [...prev, data.config]);
        return data.config;
      }
      throw new Error(data?.error || 'Creation failed');
    } catch (err) {
      toast.error('Error al crear configuración');
      return null;
    }
  }, []);

  const updateConfig = useCallback(async (id: string, updates: Partial<SyncConfig>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('sync-engine', {
        body: { action: 'update_config', configId: id, updates }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Configuración actualizada');
        setConfigs(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
        return true;
      }
      return false;
    } catch (err) {
      toast.error('Error al actualizar');
      return false;
    }
  }, []);

  const startSync = useCallback(async (configId: string, options?: { fullSync?: boolean }) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('sync-engine', {
        body: { action: 'start_sync', configId, options }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Sincronización iniciada');
        setActiveJob(data.job);
        return data.job;
      }
      throw new Error(data?.error || 'Sync start failed');
    } catch (err) {
      toast.error('Error al iniciar sincronización');
      return null;
    }
  }, []);

  const cancelSync = useCallback(async (jobId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('sync-engine', {
        body: { action: 'cancel_sync', jobId }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        toast.info('Sincronización cancelada');
        setActiveJob(null);
        return true;
      }
      return false;
    } catch (err) {
      toast.error('Error al cancelar');
      return false;
    }
  }, []);

  const getJobStatus = useCallback(async (jobId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('sync-engine', {
        body: { action: 'get_job_status', jobId }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        setActiveJob(data.job);
        return data.job;
      }
      return null;
    } catch (err) {
      console.error('[useSyncEngine] getJobStatus error:', err);
      return null;
    }
  }, []);

  const fetchJobs = useCallback(async (configId?: string, limit = 20) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('sync-engine', {
        body: { action: 'list_jobs', configId, limit }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        setJobs(data.jobs || []);
        return data.jobs;
      }
      return [];
    } catch (err) {
      console.error('[useSyncEngine] fetchJobs error:', err);
      return [];
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('sync-engine', {
        body: { action: 'get_stats' }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        setStats(data.stats);
        return data.stats;
      }
      return null;
    } catch (err) {
      console.error('[useSyncEngine] fetchStats error:', err);
      return null;
    }
  }, []);

  // Polling for active job progress
  const startPolling = useCallback((jobId: string, intervalMs = 2000) => {
    stopPolling();
    pollingRef.current = setInterval(() => {
      getJobStatus(jobId);
    }, intervalMs);
  }, [getJobStatus]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    configs,
    jobs,
    stats,
    activeJob,
    isLoading,
    error,
    fetchConfigs,
    createConfig,
    updateConfig,
    startSync,
    cancelSync,
    getJobStatus,
    fetchJobs,
    fetchStats,
    startPolling,
    stopPolling,
  };
}

export default useSyncEngine;
