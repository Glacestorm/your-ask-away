/**
 * License Grace Periods Hook
 * Gestión de períodos de gracia para licencias expiradas
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LicenseGracePeriod {
  id: string;
  license_id: string;
  original_expiry: string;
  grace_end_date: string;
  grace_days: number;
  reason: string | null;
  features_restricted: string[];
  status: 'active' | 'expired' | 'cancelled';
  activated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGracePeriodParams {
  license_id: string;
  grace_days: number;
  reason?: string;
  features_restricted?: string[];
}

export function useLicenseGrace() {
  const [gracePeriods, setGracePeriods] = useState<LicenseGracePeriod[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGracePeriods = useCallback(async (licenseId?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('license_grace_periods')
        .select('*')
        .order('created_at', { ascending: false });

      if (licenseId) {
        query = query.eq('license_id', licenseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setGracePeriods((data || []) as LicenseGracePeriod[]);
    } catch (err) {
      console.error('[useLicenseGrace] fetchGracePeriods error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createGracePeriod = useCallback(async (params: CreateGracePeriodParams) => {
    try {
      // Get original expiry from license
      const { data: license } = await supabase
        .from('licenses')
        .select('expires_at')
        .eq('id', params.license_id)
        .single();

      if (!license?.expires_at) {
        toast.error('La licencia no tiene fecha de expiración');
        return null;
      }

      const originalExpiry = new Date(license.expires_at);
      const graceEndDate = new Date(originalExpiry);
      graceEndDate.setDate(graceEndDate.getDate() + params.grace_days);

      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('license_grace_periods')
        .insert([{
          license_id: params.license_id,
          original_expiry: originalExpiry.toISOString(),
          grace_end_date: graceEndDate.toISOString(),
          grace_days: params.grace_days,
          reason: params.reason || null,
          features_restricted: params.features_restricted || [],
          status: 'active',
          activated_by: userData?.user?.id || null,
        }])
        .select()
        .single();

      if (error) throw error;

      // Update license expires_at to grace_end_date
      await supabase
        .from('licenses')
        .update({ expires_at: graceEndDate.toISOString() })
        .eq('id', params.license_id);

      setGracePeriods(prev => [data as LicenseGracePeriod, ...prev]);
      toast.success(`Período de gracia de ${params.grace_days} días activado`);
      return data as LicenseGracePeriod;
    } catch (err) {
      console.error('[useLicenseGrace] createGracePeriod error:', err);
      toast.error('Error al crear período de gracia');
      return null;
    }
  }, []);

  const cancelGracePeriod = useCallback(async (id: string) => {
    try {
      const gracePeriod = gracePeriods.find(g => g.id === id);
      if (!gracePeriod) return false;

      // Restore original expiry
      await supabase
        .from('licenses')
        .update({ expires_at: gracePeriod.original_expiry })
        .eq('id', gracePeriod.license_id);

      await supabase
        .from('license_grace_periods')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id);

      setGracePeriods(prev => prev.map(g => 
        g.id === id ? { ...g, status: 'cancelled' as const } : g
      ));
      
      toast.success('Período de gracia cancelado');
      return true;
    } catch (err) {
      console.error('[useLicenseGrace] cancelGracePeriod error:', err);
      toast.error('Error al cancelar período de gracia');
      return false;
    }
  }, [gracePeriods]);

  const checkExpiredGracePeriods = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('license_grace_periods')
        .update({ status: 'expired', updated_at: now })
        .eq('status', 'active')
        .lt('grace_end_date', now)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        // Update licenses status to expired
        const licenseIds = data.map(g => g.license_id);
        await supabase
          .from('licenses')
          .update({ status: 'expired' })
          .in('id', licenseIds);
      }

      return data?.length || 0;
    } catch (err) {
      console.error('[useLicenseGrace] checkExpiredGracePeriods error:', err);
      return 0;
    }
  }, []);

  useEffect(() => {
    fetchGracePeriods();
  }, [fetchGracePeriods]);

  return {
    gracePeriods,
    loading,
    fetchGracePeriods,
    createGracePeriod,
    cancelGracePeriod,
    checkExpiredGracePeriods,
  };
}

export default useLicenseGrace;
