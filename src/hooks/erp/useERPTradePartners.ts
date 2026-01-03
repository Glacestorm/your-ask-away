import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TradePartner {
  id: string;
  partner_code: string;
  legal_name: string;
  trade_name: string | null;
  tax_id: string | null;
  partner_type: string;
  is_active: boolean | null;
  is_international: boolean | null;
  country: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  credit_limit: number | null;
  payment_terms_days: number | null;
  default_currency: string | null;
  default_incoterm: string | null;
  notes: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useERPTradePartners() {
  const [partners, setPartners] = useState<TradePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('erp_trade_partners')
        .select('*')
        .order('legal_name', { ascending: true });

      if (fetchError) throw fetchError;

      setPartners((data || []) as TradePartner[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar socios comerciales';
      setError(message);
      console.error('[useERPTradePartners] fetchPartners error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPartner = useCallback(async (partnerData: Partial<TradePartner>): Promise<TradePartner | null> => {
    try {
      // Generate partner code if not provided
      const code = partnerData.partner_code || `TP-${Date.now().toString(36).toUpperCase()}`;
      
      const insertData = {
        partner_code: code,
        legal_name: partnerData.legal_name || partnerData.trade_name || 'Sin nombre',
        trade_name: partnerData.trade_name,
        tax_id: partnerData.tax_id,
        partner_type: partnerData.partner_type || 'customer',
        is_active: partnerData.is_active ?? true,
        is_international: partnerData.is_international ?? (partnerData.country !== 'ES'),
        country: partnerData.country || 'ES',
        address: partnerData.address,
        city: partnerData.city,
        postal_code: partnerData.postal_code,
        phone: partnerData.phone,
        email: partnerData.email,
        website: partnerData.website,
        credit_limit: partnerData.credit_limit,
        payment_terms_days: partnerData.payment_terms_days,
        default_currency: partnerData.default_currency || 'EUR',
        default_incoterm: partnerData.default_incoterm,
        notes: partnerData.notes
      };

      const { data, error: insertError } = await supabase
        .from('erp_trade_partners')
        .insert([insertData])
        .select()
        .single();

      if (insertError) throw insertError;

      const newPartner = data as TradePartner;
      setPartners(prev => [...prev, newPartner].sort((a, b) => a.legal_name.localeCompare(b.legal_name)));
      toast.success('Socio comercial creado correctamente');
      return newPartner;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear socio comercial';
      toast.error(message);
      console.error('[useERPTradePartners] createPartner error:', err);
      return null;
    }
  }, []);

  const updatePartner = useCallback(async (id: string, updates: Partial<TradePartner>): Promise<TradePartner | null> => {
    try {
      const { data, error: updateError } = await supabase
        .from('erp_trade_partners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      const updatedPartner = data as TradePartner;
      setPartners(prev => prev.map(p => p.id === id ? updatedPartner : p));
      toast.success('Socio comercial actualizado');
      return updatedPartner;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar socio comercial';
      toast.error(message);
      console.error('[useERPTradePartners] updatePartner error:', err);
      return null;
    }
  }, []);

  const deletePartner = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('erp_trade_partners')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setPartners(prev => prev.filter(p => p.id !== id));
      toast.success('Socio comercial eliminado');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar socio comercial';
      toast.error(message);
      console.error('[useERPTradePartners] deletePartner error:', err);
      return false;
    }
  }, []);

  const getPartnersByType = useCallback((type: string) => {
    return partners.filter(p => p.partner_type === type || p.partner_type === 'both');
  }, [partners]);

  const getActivePartners = useCallback(() => {
    return partners.filter(p => p.is_active === true);
  }, [partners]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  return {
    partners,
    loading,
    error,
    fetchPartners,
    createPartner,
    updatePartner,
    deletePartner,
    getPartnersByType,
    getActivePartners
  };
}
