/**
 * Hook para Remesas SEPA ERP
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';

export interface SEPARemittance {
  id: string;
  company_id: string;
  series_id?: string;
  number?: string;
  remittance_type: 'SDD_CORE' | 'SDD_B2B' | 'SCT';
  status: 'draft' | 'validated' | 'generated' | 'sent' | 'rejected';
  presentation_date?: string;
  charge_date?: string;
  total_amount: number;
  currency_code: string;
  file_path?: string;
  generated_at?: string;
  sent_at?: string;
  created_at: string;
  lines?: SEPARemittanceLine[];
}

export interface SEPARemittanceLine {
  id: string;
  remittance_id: string;
  line_number: number;
  customer_id?: string;
  supplier_id?: string;
  receivable_id?: string;
  payable_id?: string;
  due_date: string;
  amount: number;
  currency_code: string;
  mandate_id?: string;
  iban: string;
  bic?: string;
  status: 'pending' | 'included' | 'rejected';
  rejection_reason?: string;
}

export interface SEPAMandate {
  id: string;
  company_id: string;
  customer_id: string;
  mandate_reference: string;
  signature_date: string;
  mandate_type: 'CORE' | 'B2B';
  sequence_type: string;
  iban: string;
  bic?: string;
  debtor_name: string;
  status: 'active' | 'cancelled' | 'expired';
}

export function useERPSEPARemittances() {
  const { currentCompany } = useERPContext();
  const [remittances, setRemittances] = useState<SEPARemittance[]>([]);
  const [mandates, setMandates] = useState<SEPAMandate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchRemittances = useCallback(async () => {
    if (!currentCompany?.id) return [];
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('erp_sepa_remittances')
        .select(`
          *,
          lines:erp_sepa_remittance_lines(*)
        `)
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRemittances(data as SEPARemittance[]);
      return data;
    } catch (error) {
      console.error('[useERPSEPARemittances] Error:', error);
      toast.error('Error al cargar remesas');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  const fetchMandates = useCallback(async () => {
    if (!currentCompany?.id) return [];
    
    try {
      const { data, error } = await supabase
        .from('erp_sepa_mandates')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('status', 'active')
        .order('signature_date', { ascending: false });

      if (error) throw error;

      setMandates(data as SEPAMandate[]);
      return data;
    } catch (error) {
      console.error('[useERPSEPARemittances] fetchMandates error:', error);
      return [];
    }
  }, [currentCompany?.id]);

  const createRemittance = useCallback(async (data: {
    remittance_type: 'SDD_CORE' | 'SDD_B2B' | 'SCT';
    presentation_date: string;
    charge_date: string;
    receivable_ids?: string[];
    payable_ids?: string[];
  }) => {
    if (!currentCompany?.id) return null;

    try {
      // Create remittance
      const { data: remittance, error } = await supabase
        .from('erp_sepa_remittances')
        .insert({
          company_id: currentCompany.id,
          remittance_type: data.remittance_type,
          presentation_date: data.presentation_date,
          charge_date: data.charge_date,
          total_amount: 0,
          currency_code: 'EUR',
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Remesa creada');
      await fetchRemittances();
      return remittance;
    } catch (error) {
      console.error('[useERPSEPARemittances] createRemittance error:', error);
      toast.error('Error al crear remesa');
      return null;
    }
  }, [currentCompany?.id, fetchRemittances]);

  const generateXML = useCallback(async (remittanceId: string) => {
    if (!currentCompany?.id) return null;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('erp-sepa-generator', {
        body: {
          action: 'generate_xml',
          company_id: currentCompany.id,
          remittance_id: remittanceId
        }
      });

      if (error) throw error;

      // Update remittance status
      await supabase
        .from('erp_sepa_remittances')
        .update({
          status: 'generated',
          generated_at: new Date().toISOString(),
          file_path: data?.file_path
        })
        .eq('id', remittanceId);

      toast.success('XML SEPA generado');
      await fetchRemittances();
      return data;
    } catch (error) {
      console.error('[useERPSEPARemittances] generateXML error:', error);
      toast.error('Error al generar XML');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [currentCompany?.id, fetchRemittances]);

  const createMandate = useCallback(async (data: {
    customer_id: string;
    mandate_reference: string;
    signature_date: string;
    mandate_type: 'CORE' | 'B2B';
    iban: string;
    bic?: string;
    debtor_name: string;
  }) => {
    if (!currentCompany?.id) return null;

    try {
      const { data: mandate, error } = await supabase
        .from('erp_sepa_mandates')
        .insert({
          company_id: currentCompany.id,
          ...data,
          sequence_type: 'RCUR',
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Mandato SEPA creado');
      await fetchMandates();
      return mandate;
    } catch (error) {
      console.error('[useERPSEPARemittances] createMandate error:', error);
      toast.error('Error al crear mandato');
      return null;
    }
  }, [currentCompany?.id, fetchMandates]);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchRemittances();
      fetchMandates();
    }
  }, [currentCompany?.id, fetchRemittances, fetchMandates]);

  return {
    remittances,
    mandates,
    isLoading,
    isGenerating,
    fetchRemittances,
    fetchMandates,
    createRemittance,
    generateXML,
    createMandate
  };
}

export default useERPSEPARemittances;
