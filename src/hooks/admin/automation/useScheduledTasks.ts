import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface ScheduledTask {
  id: string;
  name: string;
  description?: string;
  task_type: 'cron' | 'interval' | 'one_time' | 'delayed';
  schedule: string; // cron expression or interval
  action_type: string;
  action_config: Record<string, unknown>;
  is_active: boolean;
  next_run_at?: string;
  last_run_at?: string;
  last_run_status?: 'success' | 'failed' | 'running';
  retry_count: number;
  max_retries: number;
  timeout_ms: number;
  created_at: string;
  updated_at: string;
}

export interface TaskExecution {
  id: string;
  task_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  result?: Record<string, unknown>;
  error_message?: string;
  attempt_number: number;
}

export interface TaskStats {
  total_tasks: number;
  active_tasks: number;
  executions_today: number;
  success_rate: number;
  average_duration_ms: number;
  failed_last_24h: number;
}

export interface ScheduledTasksContext {
  taskType?: string;
  status?: string;
}

// === HOOK ===
export function useScheduledTasks() {
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [executions, setExecutions] = useState<TaskExecution[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH TASKS ===
  const fetchTasks = useCallback(async (context?: ScheduledTasksContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'scheduled-tasks',
        {
          body: {
            action: 'list_tasks',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.tasks) {
        setTasks(fnData.tasks);
        if (fnData.stats) setStats(fnData.stats);
        setLastRefresh(new Date());
        return fnData.tasks;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useScheduledTasks] fetchTasks error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CREATE TASK ===
  const createTask = useCallback(async (task: Partial<ScheduledTask>) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'scheduled-tasks',
        {
          body: {
            action: 'create_task',
            task
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Tarea programada creada');
        return fnData.task;
      }

      return null;
    } catch (err) {
      console.error('[useScheduledTasks] createTask error:', err);
      toast.error('Error al crear tarea');
      return null;
    }
  }, []);

  // === EXECUTE TASK NOW ===
  const executeNow = useCallback(async (taskId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'scheduled-tasks',
        {
          body: {
            action: 'execute_now',
            taskId
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Tarea ejecutada');
        return fnData.execution;
      }

      return null;
    } catch (err) {
      console.error('[useScheduledTasks] executeNow error:', err);
      toast.error('Error al ejecutar tarea');
      return null;
    }
  }, []);

  // === TOGGLE TASK ===
  const toggleTask = useCallback(async (taskId: string, isActive: boolean) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'scheduled-tasks',
        {
          body: {
            action: 'toggle_task',
            taskId,
            isActive
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success(isActive ? 'Tarea activada' : 'Tarea pausada');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useScheduledTasks] toggleTask error:', err);
      toast.error('Error al cambiar estado');
      return false;
    }
  }, []);

  // === GET EXECUTIONS ===
  const getExecutions = useCallback(async (taskId?: string, limit = 50) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'scheduled-tasks',
        {
          body: {
            action: 'get_executions',
            taskId,
            limit
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.executions) {
        setExecutions(fnData.executions);
        return fnData.executions;
      }

      return null;
    } catch (err) {
      console.error('[useScheduledTasks] getExecutions error:', err);
      return null;
    }
  }, []);

  // === DELETE TASK ===
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'scheduled-tasks',
        {
          body: {
            action: 'delete_task',
            taskId
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Tarea eliminada');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useScheduledTasks] deleteTask error:', err);
      toast.error('Error al eliminar tarea');
      return false;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: ScheduledTasksContext, intervalMs = 30000) => {
    stopAutoRefresh();
    fetchTasks(context);
    autoRefreshInterval.current = setInterval(() => {
      fetchTasks(context);
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
    executions,
    stats,
    error,
    lastRefresh,
    fetchTasks,
    createTask,
    executeNow,
    toggleTask,
    getExecutions,
    deleteTask,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useScheduledTasks;
