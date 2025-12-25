/**
 * useTaskOrchestrator - Hook para orquestación de tareas
 * Fase 5 - Automation & Orchestration
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OrchestratedTask {
  id: string;
  task_name: string;
  task_type: 'batch' | 'parallel' | 'sequential' | 'distributed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  dependencies: string[];
  assigned_workers: string[];
  progress: number;
  estimated_duration_ms: number;
  actual_duration_ms?: number;
  retry_count: number;
  max_retries: number;
  input_data: Record<string, unknown>;
  output_data?: Record<string, unknown>;
  error_log?: string[];
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface TaskQueue {
  id: string;
  queue_name: string;
  capacity: number;
  active_tasks: number;
  pending_tasks: number;
  workers_available: number;
  throughput_per_minute: number;
  avg_wait_time_ms: number;
  health_status: 'healthy' | 'degraded' | 'overloaded';
}

export interface OrchestratorMetrics {
  total_tasks_processed: number;
  success_rate: number;
  avg_execution_time_ms: number;
  tasks_in_queue: number;
  active_workers: number;
  throughput_trend: 'up' | 'stable' | 'down';
}

export function useTaskOrchestrator() {
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<OrchestratedTask[]>([]);
  const [queues, setQueues] = useState<TaskQueue[]>([]);
  const [metrics, setMetrics] = useState<OrchestratorMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchTasks = useCallback(async (filters?: { status?: string; priority?: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'task-orchestrator',
        {
          body: {
            action: 'list_tasks',
            filters
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setTasks(data.tasks || []);
        setQueues(data.queues || []);
        setMetrics(data.metrics || null);
        setLastRefresh(new Date());
        return data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useTaskOrchestrator] fetchTasks error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTask = useCallback(async (task: Partial<OrchestratedTask>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'task-orchestrator',
        {
          body: {
            action: 'create_task',
            task
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Tarea creada y encolada');
        await fetchTasks();
        return data.task;
      }

      return null;
    } catch (err) {
      console.error('[useTaskOrchestrator] createTask error:', err);
      toast.error('Error al crear tarea');
      return null;
    }
  }, [fetchTasks]);

  const cancelTask = useCallback(async (taskId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'task-orchestrator',
        {
          body: {
            action: 'cancel_task',
            taskId
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Tarea cancelada');
        await fetchTasks();
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useTaskOrchestrator] cancelTask error:', err);
      toast.error('Error al cancelar tarea');
      return false;
    }
  }, [fetchTasks]);

  const retryTask = useCallback(async (taskId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'task-orchestrator',
        {
          body: {
            action: 'retry_task',
            taskId
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Tarea reencolada');
        await fetchTasks();
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useTaskOrchestrator] retryTask error:', err);
      toast.error('Error al reintentar tarea');
      return false;
    }
  }, [fetchTasks]);

  const prioritizeTask = useCallback(async (taskId: string, priority: OrchestratedTask['priority']) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'task-orchestrator',
        {
          body: {
            action: 'prioritize_task',
            taskId,
            priority
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Prioridad actualizada');
        await fetchTasks();
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useTaskOrchestrator] prioritizeTask error:', err);
      toast.error('Error al cambiar prioridad');
      return false;
    }
  }, [fetchTasks]);

  const startAutoRefresh = useCallback((intervalMs = 15000) => {
    stopAutoRefresh();
    fetchTasks();
    autoRefreshInterval.current = setInterval(() => {
      fetchTasks();
    }, intervalMs);
  }, [fetchTasks]);

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
    tasks,
    queues,
    metrics,
    error,
    lastRefresh,
    fetchTasks,
    createTask,
    cancelTask,
    retryTask,
    prioritizeTask,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useTaskOrchestrator;
