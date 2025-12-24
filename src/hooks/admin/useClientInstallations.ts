import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

// === INTERFACES ===
export interface ClientInstallation {
  id: string;
  company_id: string | null;
  user_id: string | null;
  installation_name: string;
  installation_key: string;
  preferred_locale: string;
  secondary_locales: string[];
  remote_access_allowed: boolean;
  remote_access_pin: string | null;
  remote_access_pin_expires_at: string | null;
  installation_config: Json;
  version: string;
  last_sync_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  company?: { name: string };
  user?: { full_name: string; email: string };
}

export interface RemoteAccessSession {
  id: string;
  installation_id: string;
  support_user_id: string;
  session_type: string;
  session_status: string;
  started_at: string | null;
  ended_at: string | null;
  actions_performed: Json[];
  notes: string | null;
  client_notified_at: string | null;
  client_acknowledged_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  support_user?: { full_name: string };
  installation?: { installation_name: string };
}

export interface InstallationDownload {
  id: string;
  installation_id: string;
  module_id: string;
  module_version: string;
  locale_downloaded: string;
  download_type: string;
  download_size_bytes: number | null;
  download_duration_ms: number | null;
  download_status: string;
  error_message: string | null;
  downloaded_at: string;
  module?: { module_name: string; module_key: string };
}

export interface ClientInstallationsError {
  code: string;
  message: string;
  details?: string;
}

// === HOOK: useClientInstallations ===
export function useClientInstallations() {
  const [installations, setInstallations] = useState<ClientInstallation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ClientInstallationsError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Refs para auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchInstallations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('client_installations')
        .select(`*, company:companies(name), user:profiles(full_name, email)`)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setInstallations(data as unknown as ClientInstallation[]);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching installations:', err);
      const message = err instanceof Error ? err.message : 'Error al cargar las instalaciones';
      setError({ code: 'FETCH_ERROR', message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 60000) => {
    stopAutoRefresh();
    fetchInstallations();
    autoRefreshInterval.current = setInterval(() => {
      fetchInstallations();
    }, intervalMs);
  }, [fetchInstallations]);

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

  useEffect(() => { fetchInstallations(); }, [fetchInstallations]);

  const createInstallation = async (data: { installation_name: string; preferred_locale?: string }) => {
    try {
      const { data: newInstallation, error: insertError } = await supabase
        .from('client_installations')
        .insert({ installation_name: data.installation_name, preferred_locale: data.preferred_locale || 'es' })
        .select()
        .single();

      if (insertError) throw insertError;
      toast.success('Instalación creada correctamente');
      await fetchInstallations();
      return newInstallation;
    } catch (err) {
      console.error('Error creating installation:', err);
      toast.error('Error al crear la instalación');
      throw err;
    }
  };

  const updateInstallation = async (id: string, data: { preferred_locale?: string; is_active?: boolean }) => {
    try {
      const { error: updateError } = await supabase.from('client_installations').update(data).eq('id', id);
      if (updateError) throw updateError;
      toast.success('Instalación actualizada correctamente');
      await fetchInstallations();
    } catch (err) {
      console.error('Error updating installation:', err);
      toast.error('Error al actualizar la instalación');
      throw err;
    }
  };

  const toggleRemoteAccess = async (id: string, enabled: boolean) => {
    try {
      const { error: updateError } = await supabase.from('client_installations').update({ remote_access_allowed: enabled }).eq('id', id);
      if (updateError) throw updateError;
      toast.success(enabled ? 'Acceso remoto habilitado' : 'Acceso remoto deshabilitado');
      await fetchInstallations();
    } catch (err) {
      console.error('Error toggling remote access:', err);
      toast.error('Error al cambiar el acceso remoto');
      throw err;
    }
  };

  const generateAccessPin = async (id: string, validHours: number = 24) => {
    try {
      const { data, error: rpcError } = await supabase.rpc('generate_remote_access_pin', { p_installation_id: id, p_valid_hours: validHours });
      if (rpcError) throw rpcError;
      toast.success(`PIN generado: ${data}`);
      await fetchInstallations();
      return data as string;
    } catch (err) {
      console.error('Error generating PIN:', err);
      toast.error('Error al generar el PIN');
      throw err;
    }
  };

  // KB Pattern: Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { 
    installations, 
    loading, 
    error,
    lastRefresh,
    fetchInstallations, 
    createInstallation, 
    updateInstallation, 
    toggleRemoteAccess, 
    generateAccessPin,
    startAutoRefresh,
    stopAutoRefresh,
    clearError
  };
}

// === HOOK: useRemoteAccessSessions ===
export function useRemoteAccessSessions(installationId?: string) {
  const [sessions, setSessions] = useState<RemoteAccessSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ClientInstallationsError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Refs para auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('remote_access_sessions').select(`*, support_user:profiles(full_name), installation:client_installations(installation_name)`).order('created_at', { ascending: false });
      if (installationId) query = query.eq('installation_id', installationId);
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setSessions(data as unknown as RemoteAccessSession[]);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching sessions:', err);
      const message = err instanceof Error ? err.message : 'Error al cargar las sesiones';
      setError({ code: 'FETCH_ERROR', message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [installationId]);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 30000) => {
    stopAutoRefresh();
    fetchSessions();
    autoRefreshInterval.current = setInterval(() => {
      fetchSessions();
    }, intervalMs);
  }, [fetchSessions]);

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

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const createSession = async (data: { installation_id: string; support_user_id: string; session_type: string; session_status: string; started_at: string; client_notified_at: string }) => {
    try {
      const { data: session, error: insertError } = await supabase.from('remote_access_sessions').insert(data).select().single();
      if (insertError) throw insertError;
      toast.success('Sesión de soporte iniciada');
      await fetchSessions();
      return session;
    } catch (err) {
      console.error('Error creating session:', err);
      toast.error('Error al crear la sesión');
      throw err;
    }
  };

  const endSession = async (id: string, notes?: string) => {
    try {
      const { error: updateError } = await supabase.from('remote_access_sessions').update({ session_status: 'completed', ended_at: new Date().toISOString(), notes }).eq('id', id);
      if (updateError) throw updateError;
      toast.success('Sesión finalizada');
      await fetchSessions();
    } catch (err) {
      console.error('Error ending session:', err);
      toast.error('Error al finalizar la sesión');
      throw err;
    }
  };

  // KB Pattern: Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { 
    sessions, 
    loading, 
    error,
    lastRefresh,
    fetchSessions, 
    createSession, 
    endSession,
    startAutoRefresh,
    stopAutoRefresh,
    clearError
  };
}

// === HOOK: useInstallationDownloads ===
export function useInstallationDownloads(installationId?: string) {
  const [downloads, setDownloads] = useState<InstallationDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ClientInstallationsError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [stats, setStats] = useState({ totalDownloads: 0, byLocale: {} as Record<string, number>, byModule: {} as Record<string, number>, recentDownloads: 0 });

  // Refs para auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchDownloads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('installation_downloads').select(`*, module:app_modules(module_name, module_key)`).order('downloaded_at', { ascending: false });
      if (installationId) query = query.eq('installation_id', installationId);
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      
      const downloadsData = data as unknown as InstallationDownload[];
      setDownloads(downloadsData);

      const byLocale: Record<string, number> = {};
      const byModule: Record<string, number> = {};
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      let recentCount = 0;

      downloadsData.forEach(d => {
        byLocale[d.locale_downloaded] = (byLocale[d.locale_downloaded] || 0) + 1;
        const moduleName = d.module?.module_name || 'Unknown';
        byModule[moduleName] = (byModule[moduleName] || 0) + 1;
        if (new Date(d.downloaded_at) > oneWeekAgo) recentCount++;
      });

      setStats({ totalDownloads: downloadsData.length, byLocale, byModule, recentDownloads: recentCount });
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching downloads:', err);
      const message = err instanceof Error ? err.message : 'Error al cargar las descargas';
      setError({ code: 'FETCH_ERROR', message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [installationId]);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 60000) => {
    stopAutoRefresh();
    fetchDownloads();
    autoRefreshInterval.current = setInterval(() => {
      fetchDownloads();
    }, intervalMs);
  }, [fetchDownloads]);

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

  useEffect(() => { fetchDownloads(); }, [fetchDownloads]);

  const recordDownload = async (data: { installation_id: string; module_id: string; module_version: string; locale_downloaded: string; download_type: string; download_status: string }) => {
    try {
      const { error: insertError } = await supabase.from('installation_downloads').insert(data);
      if (insertError) throw insertError;
      await fetchDownloads();
    } catch (err) {
      console.error('Error recording download:', err);
      throw err;
    }
  };

  // KB Pattern: Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { 
    downloads, 
    loading, 
    error,
    lastRefresh,
    stats, 
    fetchDownloads, 
    recordDownload,
    startAutoRefresh,
    stopAutoRefresh,
    clearError
  };
}
