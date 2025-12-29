/**
 * useObelixiaWorkflow Hook
 * Phase 11B: Collaborative Workflow - Approvals, Digital Signatures, Tasks
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface WorkflowTask {
  id: string;
  title: string;
  description?: string;
  type: 'approval' | 'review' | 'signature' | 'action';
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  assignedToName?: string;
  dueDate?: string;
  createdAt: string;
  relatedEntity?: {
    type: 'journal_entry' | 'invoice' | 'payment' | 'report';
    id: string;
    reference: string;
  };
  approvalChain?: ApprovalStep[];
}

export interface ApprovalStep {
  order: number;
  approverRole: string;
  approverId?: string;
  approverName?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
  comments?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  triggerType: 'manual' | 'automatic';
  triggerConditions?: Record<string, unknown>;
  steps: ApprovalStep[];
  isActive: boolean;
}

export interface WorkflowContext {
  userId: string;
  companyId: string;
}

// === HOOK ===
export function useObelixiaWorkflow() {
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH TASKS ===
  const fetchTasks = useCallback(async (context?: WorkflowContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-workflow',
        {
          body: {
            action: 'get_tasks',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        setTasks(fnData.data.tasks || []);
        setTemplates(fnData.data.templates || []);
        setLastRefresh(new Date());
        return fnData.data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useObelixiaWorkflow] fetchTasks error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === APPROVE TASK ===
  const approveTask = useCallback(async (taskId: string, comments?: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-workflow',
        {
          body: {
            action: 'approve',
            taskId,
            comments
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Tarea aprobada');
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, status: 'approved' as const } : t
        ));
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaWorkflow] approveTask error:', err);
      toast.error('Error al aprobar');
      return null;
    }
  }, []);

  // === REJECT TASK ===
  const rejectTask = useCallback(async (taskId: string, reason: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-workflow',
        {
          body: {
            action: 'reject',
            taskId,
            reason
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Tarea rechazada');
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, status: 'rejected' as const } : t
        ));
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaWorkflow] rejectTask error:', err);
      toast.error('Error al rechazar');
      return null;
    }
  }, []);

  // === DELEGATE TASK ===
  const delegateTask = useCallback(async (taskId: string, newAssigneeId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-workflow',
        {
          body: {
            action: 'delegate',
            taskId,
            newAssigneeId
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Tarea delegada');
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaWorkflow] delegateTask error:', err);
      toast.error('Error al delegar');
      return null;
    }
  }, []);

  // === REQUEST SIGNATURE ===
  const requestSignature = useCallback(async (
    documentId: string,
    signerIds: string[]
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-workflow',
        {
          body: {
            action: 'request_signature',
            documentId,
            signerIds
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Solicitud de firma enviada');
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaWorkflow] requestSignature error:', err);
      toast.error('Error al solicitar firma');
      return null;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: WorkflowContext, intervalMs = 30000) => {
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
    templates,
    error,
    lastRefresh,
    fetchTasks,
    approveTask,
    rejectTask,
    delegateTask,
    requestSignature,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useObelixiaWorkflow;
