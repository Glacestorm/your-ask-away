import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface APIConnector {
  id: string;
  name: string;
  type: 'rest' | 'graphql' | 'soap' | 'grpc';
  endpoint: string;
  auth_type: 'none' | 'api_key' | 'oauth2' | 'basic' | 'bearer';
  status: 'active' | 'inactive' | 'error';
  last_sync_at?: string;
  sync_frequency?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ConnectorHealth {
  connector_id: string;
  status: 'healthy' | 'degraded' | 'down';
  latency_ms: number;
  success_rate: number;
  last_check_at: string;
  error_count: number;
}

export function useAPIConnectors() {
  const [connectors, setConnectors] = useState<APIConnector[]>([]);
  const [healthStatus, setHealthStatus] = useState<ConnectorHealth[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConnectors = useCallback(async (): Promise<APIConnector[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('api-connectors', {
        body: { action: 'list_connectors' }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.connectors) {
        setConnectors(data.connectors);
        return data.connectors;
      }

      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching connectors';
      setError(message);
      console.error('[useAPIConnectors] fetchConnectors error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createConnector = useCallback(async (connector: Partial<APIConnector>): Promise<APIConnector | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('api-connectors', {
        body: { action: 'create_connector', connector }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.connector) {
        setConnectors(prev => [...prev, data.connector]);
        toast.success('Conector API creado');
        return data.connector;
      }

      return null;
    } catch (err) {
      console.error('[useAPIConnectors] createConnector error:', err);
      toast.error('Error al crear conector');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testConnection = useCallback(async (connectorId: string): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('api-connectors', {
        body: { action: 'test_connection', connectorId }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Conexión exitosa');
        return true;
      }

      toast.error('Fallo en la conexión');
      return false;
    } catch (err) {
      console.error('[useAPIConnectors] testConnection error:', err);
      toast.error('Error al probar conexión');
      return false;
    }
  }, []);

  const checkHealth = useCallback(async (): Promise<ConnectorHealth[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('api-connectors', {
        body: { action: 'check_health' }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.health) {
        setHealthStatus(data.health);
        return data.health;
      }

      return [];
    } catch (err) {
      console.error('[useAPIConnectors] checkHealth error:', err);
      return [];
    }
  }, []);

  const syncConnector = useCallback(async (connectorId: string): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('api-connectors', {
        body: { action: 'sync_connector', connectorId }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Sincronización iniciada');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useAPIConnectors] syncConnector error:', err);
      toast.error('Error al sincronizar');
      return false;
    }
  }, []);

  return {
    connectors,
    healthStatus,
    isLoading,
    error,
    fetchConnectors,
    createConnector,
    testConnection,
    checkHealth,
    syncConnector,
  };
}

export default useAPIConnectors;
