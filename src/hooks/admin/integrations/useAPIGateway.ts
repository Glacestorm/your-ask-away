/**
 * useAPIGateway Hook
 * Fase 10 - Integration & External Services
 * Gestión de API Gateway y endpoints
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  name: string;
  description: string | null;
  is_public: boolean;
  rate_limit: number;
  rate_limit_window_ms: number;
  authentication_required: boolean;
  allowed_origins: string[];
  cache_ttl_seconds: number | null;
  is_active: boolean;
  version: string;
  created_at: string;
}

export interface APIMetrics {
  endpoint_id: string;
  total_requests: number;
  success_count: number;
  error_count: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  requests_per_minute: number;
  period_start: string;
  period_end: string;
}

export interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  rate_limit: number | null;
  expires_at: string | null;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export function useAPIGateway() {
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [metrics, setMetrics] = useState<APIMetrics[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEndpoints = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('api-gateway', {
        body: { action: 'list_endpoints' }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        setEndpoints(data.endpoints || []);
        return data.endpoints;
      }
      throw new Error(data?.error || 'Error fetching endpoints');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useAPIGateway] fetchEndpoints error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createEndpoint = useCallback(async (endpoint: Partial<APIEndpoint>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('api-gateway', {
        body: { action: 'create_endpoint', endpoint }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Endpoint creado');
        setEndpoints(prev => [...prev, data.endpoint]);
        return data.endpoint;
      }
      throw new Error(data?.error || 'Creation failed');
    } catch (err) {
      toast.error('Error al crear endpoint');
      return null;
    }
  }, []);

  const updateEndpoint = useCallback(async (id: string, updates: Partial<APIEndpoint>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('api-gateway', {
        body: { action: 'update_endpoint', endpointId: id, updates }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Endpoint actualizado');
        setEndpoints(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
        return true;
      }
      return false;
    } catch (err) {
      toast.error('Error al actualizar');
      return false;
    }
  }, []);

  const fetchMetrics = useCallback(async (endpointId?: string, period = '24h') => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('api-gateway', {
        body: { action: 'get_metrics', endpointId, period }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        setMetrics(data.metrics || []);
        return data.metrics;
      }
      return [];
    } catch (err) {
      console.error('[useAPIGateway] fetchMetrics error:', err);
      return [];
    }
  }, []);

  const fetchApiKeys = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('api-gateway', {
        body: { action: 'list_api_keys' }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        setApiKeys(data.apiKeys || []);
        return data.apiKeys;
      }
      return [];
    } catch (err) {
      console.error('[useAPIGateway] fetchApiKeys error:', err);
      return [];
    }
  }, []);

  const createApiKey = useCallback(async (name: string, scopes: string[], expiresAt?: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('api-gateway', {
        body: { action: 'create_api_key', name, scopes, expiresAt }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('API Key creada');
        await fetchApiKeys();
        return data.apiKey; // Contains the full key (only shown once)
      }
      return null;
    } catch (err) {
      toast.error('Error al crear API Key');
      return null;
    }
  }, [fetchApiKeys]);

  const revokeApiKey = useCallback(async (keyId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('api-gateway', {
        body: { action: 'revoke_api_key', keyId }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('API Key revocada');
        setApiKeys(prev => prev.filter(k => k.id !== keyId));
        return true;
      }
      return false;
    } catch (err) {
      toast.error('Error al revocar');
      return false;
    }
  }, []);

  return {
    endpoints,
    metrics,
    apiKeys,
    isLoading,
    error,
    fetchEndpoints,
    createEndpoint,
    updateEndpoint,
    fetchMetrics,
    fetchApiKeys,
    createApiKey,
    revokeApiKey,
  };
}

export default useAPIGateway;
