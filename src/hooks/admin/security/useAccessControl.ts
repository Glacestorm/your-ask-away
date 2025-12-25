import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AccessPolicy {
  id: string;
  policy_name: string;
  description: string;
  policy_type: 'rbac' | 'abac' | 'pbac';
  priority: number;
  is_active: boolean;
  conditions: Record<string, unknown>;
  actions_allowed: string[];
  resources: string[];
  subjects: string[];
  effect: 'allow' | 'deny';
  created_at: string;
  updated_at: string;
}

export interface AccessSession {
  id: string;
  user_id: string;
  user_email: string;
  session_start: string;
  last_activity: string;
  ip_address: string;
  device_info: string;
  location?: string;
  is_active: boolean;
  risk_score: number;
  mfa_verified: boolean;
  permissions: string[];
}

export interface AccessRequest {
  id: string;
  requester_id: string;
  requester_email: string;
  resource_type: string;
  resource_id: string;
  access_level: string;
  justification: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  requested_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  expires_at?: string;
}

export interface RoleDefinition {
  id: string;
  role_name: string;
  description: string;
  permissions: string[];
  inherits_from?: string[];
  is_system_role: boolean;
  user_count: number;
  created_at: string;
}

export function useAccessControl() {
  const [isLoading, setIsLoading] = useState(false);
  const [policies, setPolicies] = useState<AccessPolicy[]>([]);
  const [sessions, setSessions] = useState<AccessSession[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchAccessData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'access-control',
        {
          body: {
            action: 'get_overview'
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setPolicies(data.policies || []);
        setSessions(data.sessions || []);
        setRequests(data.requests || []);
        setRoles(data.roles || []);
        setLastRefresh(new Date());
        return data;
      }

      throw new Error(data?.error || 'Error fetching access data');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useAccessControl] fetchAccessData error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPolicy = useCallback(async (policy: Partial<AccessPolicy>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'access-control',
        {
          body: {
            action: 'create_policy',
            policy
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Política creada correctamente');
        await fetchAccessData();
        return data.policy;
      }

      return null;
    } catch (err) {
      console.error('[useAccessControl] createPolicy error:', err);
      toast.error('Error al crear política');
      return null;
    }
  }, [fetchAccessData]);

  const updatePolicy = useCallback(async (policyId: string, updates: Partial<AccessPolicy>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'access-control',
        {
          body: {
            action: 'update_policy',
            policyId,
            updates
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Política actualizada');
        await fetchAccessData();
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useAccessControl] updatePolicy error:', err);
      toast.error('Error al actualizar política');
      return false;
    }
  }, [fetchAccessData]);

  const revokeSession = useCallback(async (sessionId: string, reason?: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'access-control',
        {
          body: {
            action: 'revoke_session',
            sessionId,
            reason
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Sesión revocada');
        await fetchAccessData();
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useAccessControl] revokeSession error:', err);
      toast.error('Error al revocar sesión');
      return false;
    }
  }, [fetchAccessData]);

  const reviewAccessRequest = useCallback(async (
    requestId: string,
    decision: 'approved' | 'denied',
    notes?: string
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'access-control',
        {
          body: {
            action: 'review_request',
            requestId,
            decision,
            notes
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(`Solicitud ${decision === 'approved' ? 'aprobada' : 'denegada'}`);
        await fetchAccessData();
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useAccessControl] reviewAccessRequest error:', err);
      toast.error('Error al revisar solicitud');
      return false;
    }
  }, [fetchAccessData]);

  const assignRole = useCallback(async (userId: string, roleId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'access-control',
        {
          body: {
            action: 'assign_role',
            userId,
            roleId
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Rol asignado correctamente');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useAccessControl] assignRole error:', err);
      toast.error('Error al asignar rol');
      return false;
    }
  }, []);

  const startAutoRefresh = useCallback((intervalMs = 60000) => {
    stopAutoRefresh();
    fetchAccessData();
    autoRefreshInterval.current = setInterval(() => {
      fetchAccessData();
    }, intervalMs);
  }, [fetchAccessData]);

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
    policies,
    sessions,
    requests,
    roles,
    error,
    lastRefresh,
    fetchAccessData,
    createPolicy,
    updatePolicy,
    revokeSession,
    reviewAccessRequest,
    assignRole,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useAccessControl;
