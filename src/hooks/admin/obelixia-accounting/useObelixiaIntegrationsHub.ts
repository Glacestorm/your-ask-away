/**
 * useObelixiaIntegrationsHub Hook
 * Hub de Integraciones Empresariales: ERPs, Bancos, Facturación Electrónica
 * Fase 11A - Enterprise SaaS 2025-2026
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface Integration {
  id: string;
  name: string;
  type: 'erp' | 'bank' | 'invoicing' | 'api';
  provider: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  lastSync?: string;
  config?: Record<string, unknown>;
  credentials?: Record<string, unknown>;
  metrics?: {
    successRate: number;
    totalSyncs: number;
    lastError?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  integrationId: string;
  status: 'success' | 'error' | 'partial';
  recordsProcessed: number;
  recordsFailed: number;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  details?: Record<string, unknown>;
}

// === HOOK ===
export function useObelixiaIntegrationsHub() {
  const [isLoading, setIsLoading] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  // === FETCH INTEGRATIONS ===
  const fetchIntegrations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-integrations',
        {
          body: { action: 'list_integrations' }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setIntegrations(data.data.integrations || []);
        setSyncLogs(data.data.syncLogs || []);
        return data.data;
      }

      // Demo data if no real data
      const demoIntegrations: Integration[] = [
        {
          id: '1',
          name: 'SAP Business One',
          type: 'erp',
          provider: 'SAP',
          status: 'active',
          lastSync: new Date().toISOString(),
          metrics: { successRate: 98.5, totalSyncs: 1250 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Santander Open Banking',
          type: 'bank',
          provider: 'Santander',
          status: 'active',
          lastSync: new Date().toISOString(),
          metrics: { successRate: 99.2, totalSyncs: 890 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'FacturaE / SII',
          type: 'invoicing',
          provider: 'AEAT',
          status: 'active',
          lastSync: new Date().toISOString(),
          metrics: { successRate: 100, totalSyncs: 456 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Sage 50',
          type: 'erp',
          provider: 'Sage',
          status: 'pending',
          metrics: { successRate: 0, totalSyncs: 0 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      const demoLogs: SyncLog[] = [
        {
          id: '1',
          integrationId: 'SAP Business One',
          status: 'success',
          recordsProcessed: 145,
          recordsFailed: 0,
          startedAt: new Date().toISOString()
        },
        {
          id: '2',
          integrationId: 'Santander',
          status: 'success',
          recordsProcessed: 23,
          recordsFailed: 0,
          startedAt: new Date().toISOString()
        }
      ];

      setIntegrations(demoIntegrations);
      setSyncLogs(demoLogs);
      return { integrations: demoIntegrations, syncLogs: demoLogs };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useObelixiaIntegrationsHub] fetchIntegrations error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === SYNC INTEGRATION ===
  const syncIntegration = useCallback(async (integrationId: string) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-integrations',
        {
          body: { 
            action: 'sync_integration',
            integrationId 
          }
        }
      );

      if (fnError) throw fnError;

      toast.success('Sincronización iniciada');
      await fetchIntegrations();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      console.error('[useObelixiaIntegrationsHub] syncIntegration error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchIntegrations]);

  // === TEST CONNECTION ===
  const testConnection = useCallback(async (integrationId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-integrations',
        {
          body: { 
            action: 'test_connection',
            integrationId 
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Conexión verificada correctamente');
        return true;
      }

      toast.error('Error en la conexión');
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      return false;
    }
  }, []);

  // === ADD INTEGRATION ===
  const addIntegration = useCallback(async (
    integration: Omit<Integration, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-integrations',
        {
          body: { 
            action: 'add_integration',
            integration 
          }
        }
      );

      if (fnError) throw fnError;

      toast.success('Integración añadida');
      await fetchIntegrations();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      return null;
    }
  }, [fetchIntegrations]);

  // === REMOVE INTEGRATION ===
  const removeIntegration = useCallback(async (integrationId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-integrations',
        {
          body: { 
            action: 'remove_integration',
            integrationId 
          }
        }
      );

      if (fnError) throw fnError;

      toast.success('Integración eliminada');
      await fetchIntegrations();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      return false;
    }
  }, [fetchIntegrations]);

  return {
    // State
    isLoading,
    integrations,
    syncLogs,
    error,
    // Actions
    fetchIntegrations,
    syncIntegration,
    testConnection,
    addIntegration,
    removeIntegration
  };
}

export default useObelixiaIntegrationsHub;
