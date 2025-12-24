import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { addDays } from 'date-fns';

export interface AuditorAccessToken {
  id: string;
  organization_id: string | null;
  auditor_email: string;
  auditor_name: string | null;
  token_hash: string;
  permissions: {
    view_reports: boolean;
    view_evidence: boolean;
    download: boolean;
  };
  expires_at: string;
  last_accessed_at: string | null;
  access_count: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

// Generate secure token
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Hash token for storage
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useAuditorPortal() {
  const [tokens, setTokens] = useState<AuditorAccessToken[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('auditor_access_tokens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokens((data as AuditorAccessToken[]) || []);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createAccessToken = useCallback(async (
    auditorEmail: string,
    auditorName: string,
    permissions: { view_reports: boolean; view_evidence: boolean; download: boolean },
    validDays: number = 30
  ) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    try {
      const token = generateSecureToken();
      const tokenHash = await hashToken(token);
      const expiresAt = addDays(new Date(), validDays);

      const { data, error } = await supabase
        .from('auditor_access_tokens')
        .insert({
          auditor_email: auditorEmail,
          auditor_name: auditorName,
          token_hash: tokenHash,
          permissions,
          expires_at: expiresAt.toISOString(),
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      const newToken = data as AuditorAccessToken;
      setTokens(prev => [newToken, ...prev]);
      
      // Return the plain token (only shown once)
      toast.success('Token de acceso creado');
      return { ...newToken, plainToken: token };
    } catch (error) {
      console.error('Error creating access token:', error);
      toast.error('Error al crear token de acceso');
      return null;
    }
  }, [user?.id]);

  const revokeToken = useCallback(async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from('auditor_access_tokens')
        .update({ is_active: false })
        .eq('id', tokenId);

      if (error) throw error;

      setTokens(prev => prev.map(t => 
        t.id === tokenId ? { ...t, is_active: false } : t
      ));
      toast.success('Token revocado');
      return true;
    } catch (error) {
      console.error('Error revoking token:', error);
      toast.error('Error al revocar token');
      return false;
    }
  }, []);

  const validateToken = useCallback(async (token: string) => {
    try {
      const tokenHash = await hashToken(token);
      
      const { data, error } = await supabase
        .from('auditor_access_tokens')
        .select('*')
        .eq('token_hash', tokenHash)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { valid: false, message: 'Token inválido o expirado' };
      }

      const accessToken = data as AuditorAccessToken;
      
      if (new Date(accessToken.expires_at) < new Date()) {
        return { valid: false, message: 'Token expirado' };
      }

      // Update last accessed
      await supabase
        .from('auditor_access_tokens')
        .update({ 
          last_accessed_at: new Date().toISOString(),
          access_count: accessToken.access_count + 1
        })
        .eq('id', accessToken.id);

      return { valid: true, token: accessToken, permissions: accessToken.permissions };
    } catch (error) {
      console.error('Error validating token:', error);
      return { valid: false, message: 'Error de validación' };
    }
  }, []);

  const extendToken = useCallback(async (tokenId: string, additionalDays: number) => {
    try {
      const token = tokens.find(t => t.id === tokenId);
      if (!token) return false;

      const newExpiry = addDays(new Date(token.expires_at), additionalDays);
      
      const { error } = await supabase
        .from('auditor_access_tokens')
        .update({ expires_at: newExpiry.toISOString() })
        .eq('id', tokenId);

      if (error) throw error;

      setTokens(prev => prev.map(t => 
        t.id === tokenId ? { ...t, expires_at: newExpiry.toISOString() } : t
      ));
      toast.success('Token extendido');
      return true;
    } catch (error) {
      console.error('Error extending token:', error);
      return false;
    }
  }, [tokens]);

  return {
    tokens,
    loading,
    createAccessToken,
    revokeToken,
    validateToken,
    extendToken,
    fetchTokens
  };
}
