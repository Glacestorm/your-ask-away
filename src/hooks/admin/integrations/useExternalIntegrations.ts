/**
 * useExternalIntegrations Hook
 * Fase 10 - Integration & External Services
 * Gestión de integraciones con servicios externos
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ExternalIntegration {
  id: string;
  name: string;
  provider: string;
  integration_type: 'api' | 'webhook' | 'oauth' | 'sdk';
  status: 'active' | 'inactive' | 'error' | 'pending';
  config: Record<string, unknown>;
  credentials_encrypted: boolean;
  last_sync_at: string | null;
  health_status: 'healthy' | 'degraded' | 'down';
  rate_limit_remaining: number | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationHealth {
  integration_id: string;
  latency_ms: number;
  success_rate: number;
  last_error: string | null;
  checked_at: string;
}

export function useExternalIntegrations() {
  const [integrations, setIntegrations] = useState<ExternalIntegration[]>([]);
  const [healthStatus, setHealthStatus] = useState<IntegrationHealth[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('external-integrations', {
        body: { action: 'list_integrations' }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        setIntegrations(data.integrations || []);
        return data.integrations;
      }
      throw new Error(data?.error || 'Error fetching integrations');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useExternalIntegrations] fetchIntegrations error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkHealth = useCallback(async (integrationId?: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('external-integrations', {
        body: { action: 'check_health', integrationId }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        setHealthStatus(data.health || []);
        return data.health;
      }
      return [];
    } catch (err) {
      console.error('[useExternalIntegrations] checkHealth error:', err);
      return [];
    }
  }, []);

  const connectIntegration = useCallback(async (provider: string, config: Record<string, unknown>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('external-integrations', {
        body: { action: 'connect', provider, config }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        toast.success(`Integración con ${provider} conectada`);
        await fetchIntegrations();
        return data.integration;
      }
      throw new Error(data?.error || 'Connection failed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection error';
      toast.error(message);
      return null;
    }
  }, [fetchIntegrations]);

  const disconnectIntegration = useCallback(async (integrationId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('external-integrations', {
        body: { action: 'disconnect', integrationId }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Integración desconectada');
        setIntegrations(prev => prev.filter(i => i.id !== integrationId));
        return true;
      }
      return false;
    } catch (err) {
      toast.error('Error al desconectar');
      return false;
    }
  }, []);

  const syncIntegration = useCallback(async (integrationId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('external-integrations', {
        body: { action: 'sync', integrationId }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Sincronización completada');
        return data.syncResult;
      }
      return null;
    } catch (err) {
      toast.error('Error en sincronización');
      return null;
    }
  }, []);

  return {
    integrations,
    healthStatus,
    isLoading,
    error,
    fetchIntegrations,
    checkHealth,
    connectIntegration,
    disconnectIntegration,
    syncIntegration,
  };
}

export default useExternalIntegrations;
