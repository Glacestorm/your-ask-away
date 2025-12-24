import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// === TYPES ===
export type ApprovalRequestType = 'high_risk_action' | 'session_end' | 'data_export' | 'config_change';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

// === INTERFACES ===
export interface ApprovalRequest {
  id: string;
  session_id: string;
  action_id: string | null;
  request_type: ApprovalRequestType;
  requested_by: string | null;
  requested_at: string;
  status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  expires_at: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateApprovalParams {
  sessionId: string;
  actionId?: string;
  requestType: ApprovalRequestType;
  metadata?: Record<string, any>;
  expiresInMinutes?: number;
}

export interface DualApprovalError {
  code: string;
  message: string;
  details?: string;
}

// === HOOK ===
export function useDualApproval(sessionId: string | null) {
  const [pendingRequests, setPendingRequests] = useState<ApprovalRequest[]>([]);
  const [allRequests, setAllRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<DualApprovalError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Refs para auto-refresh (aunque realtime lo cubre, mantenemos para consistencia con KB)
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch pending requests for this session
  const fetchRequests = useCallback(async () => {
    if (!sessionId) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('support_approval_requests')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const requests = (data || []) as ApprovalRequest[];
      setAllRequests(requests);
      setPendingRequests(requests.filter(r => r.status === 'pending'));
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching approval requests:', err);
      const message = err instanceof Error ? err.message : 'Error al cargar solicitudes';
      setError({ code: 'FETCH_ERROR', message });
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Subscribe to real-time updates (esto sustituye auto-refresh para este hook)
  useEffect(() => {
    if (!sessionId) return;

    fetchRequests();

    const channel = supabase
      .channel(`approval-requests-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_approval_requests',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Approval request change:', payload);
          setLastRefresh(new Date());
          
          if (payload.eventType === 'INSERT') {
            const newRequest = payload.new as ApprovalRequest;
            setAllRequests(prev => [newRequest, ...prev]);
            if (newRequest.status === 'pending') {
              setPendingRequests(prev => [newRequest, ...prev]);
              toast({
                title: "Nueva solicitud de aprobación",
                description: `Tipo: ${getRequestTypeLabel(newRequest.request_type)}`,
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as ApprovalRequest;
            setAllRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
            
            if (updated.status !== 'pending') {
              setPendingRequests(prev => prev.filter(r => r.id !== updated.id));
              
              if (updated.status === 'approved') {
                toast({
                  title: "Solicitud aprobada",
                  description: `La acción ha sido autorizada`,
                });
              } else if (updated.status === 'rejected') {
                toast({
                  title: "Solicitud rechazada",
                  description: updated.rejection_reason || 'Sin motivo especificado',
                  variant: "destructive"
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchRequests]);

  // === AUTO-REFRESH (opcional, realtime ya cubre esto) ===
  const startAutoRefresh = useCallback((intervalMs = 30000) => {
    stopAutoRefresh();
    // Nota: Realtime ya maneja actualizaciones, pero mantenemos esto por consistencia con KB
    autoRefreshInterval.current = setInterval(() => {
      fetchRequests();
    }, intervalMs);
  }, [fetchRequests]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  // Create a new approval request
  const requestApproval = async (params: CreateApprovalParams): Promise<ApprovalRequest | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuario no autenticado');

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + (params.expiresInMinutes || 15));

      const { data, error: insertError } = await supabase
        .from('support_approval_requests')
        .insert({
          session_id: params.sessionId,
          action_id: params.actionId || null,
          request_type: params.requestType,
          requested_by: userData.user.id,
          expires_at: expiresAt.toISOString(),
          metadata: params.metadata || {}
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: "Solicitud enviada",
        description: "Esperando aprobación del supervisor",
      });

      return data as ApprovalRequest;
    } catch (err) {
      console.error('Error creating approval request:', err);
      const message = err instanceof Error ? err.message : 'No se pudo crear la solicitud de aprobación';
      setError({ code: 'CREATE_ERROR', message });
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Approve a request
  const approveRequest = async (requestId: string): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuario no autenticado');

      const { error: updateError } = await supabase
        .from('support_approval_requests')
        .update({
          status: 'approved',
          approved_by: userData.user.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('status', 'pending');

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      console.error('Error approving request:', err);
      const message = err instanceof Error ? err.message : 'No se pudo aprobar la solicitud';
      setError({ code: 'APPROVE_ERROR', message });
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reject a request
  const rejectRequest = async (requestId: string, reason?: string): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuario no autenticado');

      const { error: updateError } = await supabase
        .from('support_approval_requests')
        .update({
          status: 'rejected',
          approved_by: userData.user.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('status', 'pending');

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      console.error('Error rejecting request:', err);
      const message = err instanceof Error ? err.message : 'No se pudo rechazar la solicitud';
      setError({ code: 'REJECT_ERROR', message });
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if an action requires approval
  const requiresApproval = (actionType: string, riskLevel: string): boolean => {
    const highRiskActions = ['user_impersonation', 'permission_change', 'data_modification'];
    const criticalRiskLevels = ['high', 'critical'];
    
    return highRiskActions.includes(actionType) || criticalRiskLevels.includes(riskLevel);
  };

  // Wait for approval (polling with timeout)
  const waitForApproval = async (requestId: string, timeoutMs: number = 900000): Promise<ApprovalStatus> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const { data, error: fetchError } = await supabase
        .from('support_approval_requests')
        .select('status')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;
      
      if (data.status !== 'pending') {
        return data.status as ApprovalStatus;
      }

      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return 'expired';
  };

  // KB Pattern: Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    pendingRequests,
    allRequests,
    loading,
    isSubmitting,
    error,
    lastRefresh,
    requestApproval,
    approveRequest,
    rejectRequest,
    requiresApproval,
    waitForApproval,
    refetch: fetchRequests,
    startAutoRefresh,
    stopAutoRefresh,
    clearError
  };
}

function getRequestTypeLabel(type: ApprovalRequestType): string {
  const labels: Record<ApprovalRequestType, string> = {
    high_risk_action: 'Acción de Alto Riesgo',
    session_end: 'Finalizar Sesión',
    data_export: 'Exportar Datos',
    config_change: 'Cambio de Configuración'
  };
  return labels[type] || type;
}
