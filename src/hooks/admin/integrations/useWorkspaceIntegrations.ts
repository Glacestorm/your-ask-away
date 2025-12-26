/**
 * useWorkspaceIntegrations Hook
 * Fase 4 - Microsoft 365 & Google Workspace Integrations
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface ServiceStatus {
  enabled: boolean;
  lastSync: string;
  itemsSynced: number;
}

export interface IntegrationStatus {
  connected: boolean;
  lastSync: string;
  syncEnabled: boolean;
  provider: string;
  services: {
    outlook?: ServiceStatus;
    teams?: ServiceStatus;
    onedrive?: ServiceStatus;
    gmail?: ServiceStatus;
    calendar?: ServiceStatus;
    drive?: ServiceStatus;
  };
  user: {
    email: string;
    name: string;
    tenant?: string;
    domain?: string;
  };
}

export interface SyncResult {
  syncSummary: Record<string, number>;
  status: string;
  [key: string]: unknown;
}

export interface SyncHistoryItem {
  id: string;
  provider: string;
  type: string;
  status: string;
  startedAt: string;
  completedAt: string;
  itemsSynced: number;
  errors: number;
}

export interface SyncSettings {
  autoSync: boolean;
  syncInterval: number;
  syncDirection: 'bidirectional' | 'to_crm' | 'from_crm';
  services: Record<string, boolean>;
  conflictResolution: 'crm_priority' | 'workspace_priority' | 'newest';
  notifications: boolean;
}

// === HOOK ===
export function useWorkspaceIntegrations() {
  const [isLoading, setIsLoading] = useState(false);
  const [microsoftStatus, setMicrosoftStatus] = useState<IntegrationStatus | null>(null);
  const [googleStatus, setGoogleStatus] = useState<IntegrationStatus | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH STATUS ===
  const fetchStatus = useCallback(async (provider: 'microsoft' | 'google') => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('workspace-integrations', {
        body: { action: 'get_status', provider }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        if (provider === 'microsoft') {
          setMicrosoftStatus(data.data);
        } else {
          setGoogleStatus(data.data);
        }
        return data.data;
      }
      return null;
    } catch (err) {
      console.error(`[useWorkspaceIntegrations] fetchStatus error:`, err);
      return null;
    }
  }, []);

  // === FETCH ALL STATUS ===
  const fetchAllStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchStatus('microsoft'),
        fetchStatus('google')
      ]);
      setLastRefresh(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchStatus]);

  // === SYNC SERVICES ===
  const syncOutlook = useCallback(async (params?: { syncType?: string; folders?: string[] }) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('workspace-integrations', {
        body: { action: 'sync_outlook', provider: 'microsoft', params }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Outlook sincronizado', {
          description: `${data.data.syncSummary?.totalEmails || 0} emails procesados`
        });
        await fetchStatus('microsoft');
        return data.data;
      }
      return null;
    } catch (err) {
      toast.error('Error al sincronizar Outlook');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchStatus]);

  const syncTeams = useCallback(async (params?: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('workspace-integrations', {
        body: { action: 'sync_teams', provider: 'microsoft', params }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Teams sincronizado', {
          description: `${data.data.syncSummary?.meetings || 0} reuniones sincronizadas`
        });
        await fetchStatus('microsoft');
        return data.data;
      }
      return null;
    } catch (err) {
      toast.error('Error al sincronizar Teams');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchStatus]);

  const syncOneDrive = useCallback(async (params?: { folders?: string[] }) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('workspace-integrations', {
        body: { action: 'sync_onedrive', provider: 'microsoft', params }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('OneDrive sincronizado', {
          description: `${data.data.syncSummary?.totalFiles || 0} archivos procesados`
        });
        await fetchStatus('microsoft');
        return data.data;
      }
      return null;
    } catch (err) {
      toast.error('Error al sincronizar OneDrive');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchStatus]);

  const syncGmail = useCallback(async (params?: { labels?: string[] }) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('workspace-integrations', {
        body: { action: 'sync_gmail', provider: 'google', params }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Gmail sincronizado', {
          description: `${data.data.syncSummary?.totalEmails || 0} emails procesados`
        });
        await fetchStatus('google');
        return data.data;
      }
      return null;
    } catch (err) {
      toast.error('Error al sincronizar Gmail');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchStatus]);

  const syncCalendar = useCallback(async (params?: { calendars?: string[] }) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('workspace-integrations', {
        body: { action: 'sync_calendar', provider: 'google', params }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Google Calendar sincronizado', {
          description: `${data.data.syncSummary?.totalEvents || 0} eventos sincronizados`
        });
        await fetchStatus('google');
        return data.data;
      }
      return null;
    } catch (err) {
      toast.error('Error al sincronizar Calendar');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchStatus]);

  const syncDrive = useCallback(async (params?: { folders?: string[] }) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('workspace-integrations', {
        body: { action: 'sync_drive', provider: 'google', params }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Google Drive sincronizado', {
          description: `${data.data.syncSummary?.totalFiles || 0} archivos procesados`
        });
        await fetchStatus('google');
        return data.data;
      }
      return null;
    } catch (err) {
      toast.error('Error al sincronizar Drive');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchStatus]);

  // === ACTIONS ===
  const sendEmail = useCallback(async (
    provider: 'microsoft' | 'google',
    params: { to: string; subject: string; body: string; contactId?: string }
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('workspace-integrations', {
        body: { action: 'send_email', provider, params }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Email enviado correctamente');
        return data.data;
      }
      return null;
    } catch (err) {
      toast.error('Error al enviar email');
      return null;
    }
  }, []);

  const createEvent = useCallback(async (
    provider: 'microsoft' | 'google',
    params: { title: string; startTime: string; endTime: string; attendees?: string[]; dealId?: string }
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('workspace-integrations', {
        body: { action: 'create_event', provider, params }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Evento creado correctamente');
        return data.data;
      }
      return null;
    } catch (err) {
      toast.error('Error al crear evento');
      return null;
    }
  }, []);

  const createTeamsMeeting = useCallback(async (
    params: { subject: string; startTime: string; endTime: string; attendees?: string[]; dealId?: string }
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('workspace-integrations', {
        body: { action: 'create_teams_meeting', provider: 'microsoft', params }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Reunión de Teams creada', {
          description: 'Se ha enviado la invitación a los participantes'
        });
        return data.data;
      }
      return null;
    } catch (err) {
      toast.error('Error al crear reunión de Teams');
      return null;
    }
  }, []);

  const uploadFile = useCallback(async (
    provider: 'microsoft' | 'google',
    params: { fileName: string; folderId?: string; dealId?: string; companyId?: string }
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('workspace-integrations', {
        body: { action: 'upload_file', provider, params }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Archivo subido correctamente');
        return data.data;
      }
      return null;
    } catch (err) {
      toast.error('Error al subir archivo');
      return null;
    }
  }, []);

  // === HISTORY & SETTINGS ===
  const fetchSyncHistory = useCallback(async (provider: 'microsoft' | 'google') => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('workspace-integrations', {
        body: { action: 'get_sync_history', provider }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setSyncHistory(data.data.history);
        return data.data;
      }
      return null;
    } catch (err) {
      console.error('[useWorkspaceIntegrations] fetchSyncHistory error:', err);
      return null;
    }
  }, []);

  const configureSyncSettings = useCallback(async (
    provider: 'microsoft' | 'google',
    settings: Partial<SyncSettings>
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('workspace-integrations', {
        body: { action: 'configure_sync', provider, params: settings }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Configuración actualizada');
        return data.data;
      }
      return null;
    } catch (err) {
      toast.error('Error al actualizar configuración');
      return null;
    }
  }, []);

  const disconnectIntegration = useCallback(async (provider: 'microsoft' | 'google') => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('workspace-integrations', {
        body: { action: 'disconnect', provider }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        if (provider === 'microsoft') {
          setMicrosoftStatus(null);
        } else {
          setGoogleStatus(null);
        }
        toast.success(`${provider === 'microsoft' ? 'Microsoft 365' : 'Google Workspace'} desconectado`);
        return data.data;
      }
      return null;
    } catch (err) {
      toast.error('Error al desconectar');
      return null;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 120000) => {
    stopAutoRefresh();
    fetchAllStatus();
    autoRefreshInterval.current = setInterval(() => {
      fetchAllStatus();
    }, intervalMs);
  }, [fetchAllStatus]);

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

  // === RETURN ===
  return {
    // Estado
    isLoading,
    microsoftStatus,
    googleStatus,
    syncHistory,
    error,
    lastRefresh,
    // Fetch
    fetchStatus,
    fetchAllStatus,
    fetchSyncHistory,
    // Microsoft Sync
    syncOutlook,
    syncTeams,
    syncOneDrive,
    // Google Sync
    syncGmail,
    syncCalendar,
    syncDrive,
    // Actions
    sendEmail,
    createEvent,
    createTeamsMeeting,
    uploadFile,
    // Settings
    configureSyncSettings,
    disconnectIntegration,
    // Auto-refresh
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useWorkspaceIntegrations;
