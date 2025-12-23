import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

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

export function useClientInstallations() {
  const [installations, setInstallations] = useState<ClientInstallation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInstallations = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_installations')
        .select(`*, company:companies(name), user:profiles(full_name, email)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstallations(data as unknown as ClientInstallation[]);
    } catch (error) {
      console.error('Error fetching installations:', error);
      toast.error('Error al cargar las instalaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInstallations(); }, [fetchInstallations]);

  const createInstallation = async (data: { installation_name: string; preferred_locale?: string }) => {
    try {
      const { data: newInstallation, error } = await supabase
        .from('client_installations')
        .insert({ installation_name: data.installation_name, preferred_locale: data.preferred_locale || 'es' })
        .select()
        .single();

      if (error) throw error;
      toast.success('Instalación creada correctamente');
      await fetchInstallations();
      return newInstallation;
    } catch (error) {
      console.error('Error creating installation:', error);
      toast.error('Error al crear la instalación');
      throw error;
    }
  };

  const updateInstallation = async (id: string, data: { preferred_locale?: string; is_active?: boolean }) => {
    try {
      const { error } = await supabase.from('client_installations').update(data).eq('id', id);
      if (error) throw error;
      toast.success('Instalación actualizada correctamente');
      await fetchInstallations();
    } catch (error) {
      console.error('Error updating installation:', error);
      toast.error('Error al actualizar la instalación');
      throw error;
    }
  };

  const toggleRemoteAccess = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase.from('client_installations').update({ remote_access_allowed: enabled }).eq('id', id);
      if (error) throw error;
      toast.success(enabled ? 'Acceso remoto habilitado' : 'Acceso remoto deshabilitado');
      await fetchInstallations();
    } catch (error) {
      console.error('Error toggling remote access:', error);
      toast.error('Error al cambiar el acceso remoto');
      throw error;
    }
  };

  const generateAccessPin = async (id: string, validHours: number = 24) => {
    try {
      const { data, error } = await supabase.rpc('generate_remote_access_pin', { p_installation_id: id, p_valid_hours: validHours });
      if (error) throw error;
      toast.success(`PIN generado: ${data}`);
      await fetchInstallations();
      return data as string;
    } catch (error) {
      console.error('Error generating PIN:', error);
      toast.error('Error al generar el PIN');
      throw error;
    }
  };

  return { installations, loading, fetchInstallations, createInstallation, updateInstallation, toggleRemoteAccess, generateAccessPin };
}

export function useRemoteAccessSessions(installationId?: string) {
  const [sessions, setSessions] = useState<RemoteAccessSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('remote_access_sessions').select(`*, support_user:profiles(full_name), installation:client_installations(installation_name)`).order('created_at', { ascending: false });
      if (installationId) query = query.eq('installation_id', installationId);
      const { data, error } = await query;
      if (error) throw error;
      setSessions(data as unknown as RemoteAccessSession[]);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Error al cargar las sesiones');
    } finally {
      setLoading(false);
    }
  }, [installationId]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const createSession = async (data: { installation_id: string; support_user_id: string; session_type: string; session_status: string; started_at: string; client_notified_at: string }) => {
    try {
      const { data: session, error } = await supabase.from('remote_access_sessions').insert(data).select().single();
      if (error) throw error;
      toast.success('Sesión de soporte iniciada');
      await fetchSessions();
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Error al crear la sesión');
      throw error;
    }
  };

  const endSession = async (id: string, notes?: string) => {
    try {
      const { error } = await supabase.from('remote_access_sessions').update({ session_status: 'completed', ended_at: new Date().toISOString(), notes }).eq('id', id);
      if (error) throw error;
      toast.success('Sesión finalizada');
      await fetchSessions();
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Error al finalizar la sesión');
      throw error;
    }
  };

  return { sessions, loading, fetchSessions, createSession, endSession };
}

export function useInstallationDownloads(installationId?: string) {
  const [downloads, setDownloads] = useState<InstallationDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalDownloads: 0, byLocale: {} as Record<string, number>, byModule: {} as Record<string, number>, recentDownloads: 0 });

  const fetchDownloads = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('installation_downloads').select(`*, module:app_modules(module_name, module_key)`).order('downloaded_at', { ascending: false });
      if (installationId) query = query.eq('installation_id', installationId);
      const { data, error } = await query;
      if (error) throw error;
      
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
    } catch (error) {
      console.error('Error fetching downloads:', error);
      toast.error('Error al cargar las descargas');
    } finally {
      setLoading(false);
    }
  }, [installationId]);

  useEffect(() => { fetchDownloads(); }, [fetchDownloads]);

  const recordDownload = async (data: { installation_id: string; module_id: string; module_version: string; locale_downloaded: string; download_type: string; download_status: string }) => {
    try {
      const { error } = await supabase.from('installation_downloads').insert(data);
      if (error) throw error;
      await fetchDownloads();
    } catch (error) {
      console.error('Error recording download:', error);
      throw error;
    }
  };

  return { downloads, loading, stats, fetchDownloads, recordDownload };
}
