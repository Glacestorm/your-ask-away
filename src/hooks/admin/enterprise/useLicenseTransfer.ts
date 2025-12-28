/**
 * License Transfer Hook
 * Gestión de transferencias de licencias entre organizaciones
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LicenseTransfer {
  id: string;
  license_id: string;
  from_organization_id: string;
  to_organization_id: string;
  from_email: string;
  to_email: string;
  transfer_reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  initiated_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface InitiateTransferParams {
  license_id: string;
  to_organization_id: string;
  to_email: string;
  transfer_reason?: string;
}

export function useLicenseTransfer() {
  const [transfers, setTransfers] = useState<LicenseTransfer[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransfers = useCallback(async (licenseId?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('license_transfers')
        .select('*')
        .order('created_at', { ascending: false });

      if (licenseId) {
        query = query.eq('license_id', licenseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTransfers((data || []) as LicenseTransfer[]);
    } catch (err) {
      console.error('[useLicenseTransfer] fetchTransfers error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const initiateTransfer = useCallback(async (params: InitiateTransferParams) => {
    try {
      // Get license info
      const { data: license } = await supabase
        .from('licenses')
        .select('organization_id, licensee_email')
        .eq('id', params.license_id)
        .single();

      if (!license) {
        toast.error('Licencia no encontrada');
        return null;
      }

      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('license_transfers')
        .insert([{
          license_id: params.license_id,
          from_organization_id: license.organization_id,
          to_organization_id: params.to_organization_id,
          from_email: license.licensee_email,
          to_email: params.to_email,
          transfer_reason: params.transfer_reason || null,
          status: 'pending',
          initiated_by: userData?.user?.id || null,
        }])
        .select()
        .single();

      if (error) throw error;

      setTransfers(prev => [data as LicenseTransfer, ...prev]);
      toast.success('Transferencia iniciada');
      return data as LicenseTransfer;
    } catch (err) {
      console.error('[useLicenseTransfer] initiateTransfer error:', err);
      toast.error('Error al iniciar transferencia');
      return null;
    }
  }, []);

  const approveTransfer = useCallback(async (id: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('license_transfers')
        .update({ 
          status: 'approved', 
          approved_by: userData?.user?.id || null,
          approved_at: now,
          updated_at: now 
        })
        .eq('id', id);

      if (error) throw error;

      setTransfers(prev => prev.map(t => 
        t.id === id ? { ...t, status: 'approved' as const, approved_at: now } : t
      ));
      
      toast.success('Transferencia aprobada');
      return true;
    } catch (err) {
      console.error('[useLicenseTransfer] approveTransfer error:', err);
      toast.error('Error al aprobar transferencia');
      return false;
    }
  }, []);

  const completeTransfer = useCallback(async (id: string) => {
    try {
      const transfer = transfers.find(t => t.id === id);
      if (!transfer || transfer.status !== 'approved') {
        toast.error('La transferencia debe estar aprobada primero');
        return false;
      }

      const now = new Date().toISOString();

      // Update license ownership
      await supabase
        .from('licenses')
        .update({ 
          organization_id: transfer.to_organization_id,
          licensee_email: transfer.to_email,
          updated_at: now
        })
        .eq('id', transfer.license_id);

      // Mark transfer as completed
      await supabase
        .from('license_transfers')
        .update({ status: 'completed', completed_at: now, updated_at: now })
        .eq('id', id);

      setTransfers(prev => prev.map(t => 
        t.id === id ? { ...t, status: 'completed' as const, completed_at: now } : t
      ));
      
      toast.success('Transferencia completada');
      return true;
    } catch (err) {
      console.error('[useLicenseTransfer] completeTransfer error:', err);
      toast.error('Error al completar transferencia');
      return false;
    }
  }, [transfers]);

  const rejectTransfer = useCallback(async (id: string, reason?: string) => {
    try {
      const now = new Date().toISOString();

      await supabase
        .from('license_transfers')
        .update({ 
          status: 'rejected', 
          metadata: { rejection_reason: reason },
          updated_at: now 
        })
        .eq('id', id);

      setTransfers(prev => prev.map(t => 
        t.id === id ? { ...t, status: 'rejected' as const } : t
      ));
      
      toast.success('Transferencia rechazada');
      return true;
    } catch (err) {
      console.error('[useLicenseTransfer] rejectTransfer error:', err);
      toast.error('Error al rechazar transferencia');
      return false;
    }
  }, []);

  const cancelTransfer = useCallback(async (id: string) => {
    try {
      const now = new Date().toISOString();

      await supabase
        .from('license_transfers')
        .update({ status: 'cancelled', updated_at: now })
        .eq('id', id);

      setTransfers(prev => prev.map(t => 
        t.id === id ? { ...t, status: 'cancelled' as const } : t
      ));
      
      toast.success('Transferencia cancelada');
      return true;
    } catch (err) {
      console.error('[useLicenseTransfer] cancelTransfer error:', err);
      toast.error('Error al cancelar transferencia');
      return false;
    }
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  return {
    transfers,
    loading,
    fetchTransfers,
    initiateTransfer,
    approveTransfer,
    completeTransfer,
    rejectTransfer,
    cancelTransfer,
  };
}

export default useLicenseTransfer;
