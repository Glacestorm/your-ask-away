/**
 * Hook para gestión de Créditos Documentarios (Cartas de Crédito)
 * Import/Export Letters of Credit Management
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface DocumentaryCredit {
  id: string;
  company_id: string | null;
  credit_number: string;
  credit_type: 'import' | 'export';
  operation_type: 'irrevocable' | 'revocable' | 'confirmed' | 'unconfirmed' | 'transferable' | 'back_to_back' | 'standby';
  applicant_id: string | null;
  beneficiary_id: string | null;
  issuing_bank_id: string | null;
  advising_bank_id: string | null;
  confirming_bank_id: string | null;
  negotiating_bank_id: string | null;
  amount: number;
  currency: string;
  tolerance_percentage: number | null;
  max_amount: number | null;
  utilized_amount: number | null;
  issue_date: string;
  expiry_date: string;
  latest_shipment_date: string | null;
  presentation_period_days: number | null;
  incoterm: string | null;
  port_of_loading: string | null;
  port_of_discharge: string | null;
  place_of_delivery: string | null;
  partial_shipments_allowed: boolean | null;
  transshipment_allowed: boolean | null;
  required_documents: unknown[];
  special_conditions: string | null;
  status: 'draft' | 'requested' | 'issued' | 'advised' | 'confirmed' | 'amended' | 'utilized' | 'expired' | 'cancelled';
  swift_reference: string | null;
  commission_rate: number | null;
  commission_amount: number | null;
  expenses: unknown[];
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditAmendment {
  id: string;
  credit_id: string;
  amendment_number: number;
  amendment_date: string;
  changes: Record<string, { old: unknown; new: unknown }>;
  reason: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  response_date: string | null;
  response_notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CreditPresentation {
  id: string;
  credit_id: string;
  presentation_number: number;
  presentation_date: string;
  documents_presented: unknown[];
  amount_claimed: number;
  review_status: 'pending' | 'compliant' | 'discrepant' | 'rejected';
  discrepancies: unknown[];
  discrepancy_waived: boolean | null;
  waiver_date: string | null;
  payment_status: 'pending' | 'approved' | 'paid' | 'refused' | null;
  payment_date: string | null;
  payment_amount: number | null;
  payment_reference: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TradePartner {
  id: string;
  company_id: string | null;
  partner_code: string;
  partner_type: 'customer' | 'supplier' | 'both';
  legal_name: string;
  trade_name: string | null;
  tax_id: string | null;
  country: string;
  is_international: boolean | null;
  is_active: boolean | null;
}

export function useERPDocumentaryCredits() {
  const [credits, setCredits] = useState<DocumentaryCredit[]>([]);
  const [amendments, setAmendments] = useState<CreditAmendment[]>([]);
  const [presentations, setPresentations] = useState<CreditPresentation[]>([]);
  const [partners, setPartners] = useState<TradePartner[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch documentary credits
  const fetchCredits = useCallback(async (companyId?: string) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('erp_documentary_credits')
        .select('*')
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCredits((data || []) as DocumentaryCredit[]);
      return data;
    } catch (error) {
      console.error('Error fetching documentary credits:', error);
      toast.error('Error al cargar créditos documentarios');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create documentary credit
  const createCredit = useCallback(async (credit: Partial<DocumentaryCredit>) => {
    try {
      const { data, error } = await supabase
        .from('erp_documentary_credits')
        .insert([credit as never])
        .select()
        .single();

      if (error) throw error;
      setCredits(prev => [data as DocumentaryCredit, ...prev]);
      toast.success('Crédito documentario creado');
      return data;
    } catch (error) {
      console.error('Error creating documentary credit:', error);
      toast.error('Error al crear crédito documentario');
      return null;
    }
  }, []);

  // Update documentary credit
  const updateCredit = useCallback(async (id: string, updates: Partial<DocumentaryCredit>) => {
    try {
      const { data, error } = await supabase
        .from('erp_documentary_credits')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setCredits(prev => prev.map(c => c.id === id ? data as DocumentaryCredit : c));
      toast.success('Crédito documentario actualizado');
      return data;
    } catch (error) {
      console.error('Error updating documentary credit:', error);
      toast.error('Error al actualizar crédito documentario');
      return null;
    }
  }, []);

  // Fetch amendments for a credit
  const fetchAmendments = useCallback(async (creditId: string) => {
    try {
      const { data, error } = await supabase
        .from('erp_credit_amendments')
        .select('*')
        .eq('credit_id', creditId)
        .order('amendment_number', { ascending: true });

      if (error) throw error;
      setAmendments((data || []) as CreditAmendment[]);
      return data;
    } catch (error) {
      console.error('Error fetching amendments:', error);
      return [];
    }
  }, []);

  // Create amendment
  const createAmendment = useCallback(async (amendment: Partial<CreditAmendment>) => {
    try {
      const { data, error } = await supabase
        .from('erp_credit_amendments')
        .insert([amendment as never])
        .select()
        .single();

      if (error) throw error;
      setAmendments(prev => [...prev, data as CreditAmendment]);
      toast.success('Enmienda creada');
      return data;
    } catch (error) {
      console.error('Error creating amendment:', error);
      toast.error('Error al crear enmienda');
      return null;
    }
  }, []);

  // Fetch presentations for a credit
  const fetchPresentations = useCallback(async (creditId: string) => {
    try {
      const { data, error } = await supabase
        .from('erp_credit_presentations')
        .select('*')
        .eq('credit_id', creditId)
        .order('presentation_number', { ascending: true });

      if (error) throw error;
      setPresentations((data || []) as CreditPresentation[]);
      return data;
    } catch (error) {
      console.error('Error fetching presentations:', error);
      return [];
    }
  }, []);

  // Create presentation
  const createPresentation = useCallback(async (presentation: Partial<CreditPresentation>) => {
    try {
      const { data, error } = await supabase
        .from('erp_credit_presentations')
        .insert([presentation as never])
        .select()
        .single();

      if (error) throw error;
      setPresentations(prev => [...prev, data as CreditPresentation]);
      toast.success('Presentación creada');
      return data;
    } catch (error) {
      console.error('Error creating presentation:', error);
      toast.error('Error al crear presentación');
      return null;
    }
  }, []);

  // Update presentation
  const updatePresentation = useCallback(async (id: string, updates: Partial<CreditPresentation>) => {
    try {
      const { data, error } = await supabase
        .from('erp_credit_presentations')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setPresentations(prev => prev.map(p => p.id === id ? data as CreditPresentation : p));
      toast.success('Presentación actualizada');
      return data;
    } catch (error) {
      console.error('Error updating presentation:', error);
      toast.error('Error al actualizar presentación');
      return null;
    }
  }, []);

  // Fetch trade partners
  const fetchPartners = useCallback(async (companyId?: string) => {
    try {
      let query = supabase
        .from('erp_trade_partners')
        .select('*')
        .eq('is_active', true)
        .order('legal_name');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPartners((data || []) as TradePartner[]);
      return data;
    } catch (error) {
      console.error('Error fetching trade partners:', error);
      return [];
    }
  }, []);

  // Calculate available amount
  const getAvailableAmount = useCallback((credit: DocumentaryCredit): number => {
    const maxAmount = credit.max_amount || credit.amount * (1 + (credit.tolerance_percentage || 0) / 100);
    return maxAmount - (credit.utilized_amount || 0);
  }, []);

  // Check if credit is expired
  const isCreditExpired = useCallback((credit: DocumentaryCredit): boolean => {
    return new Date(credit.expiry_date) < new Date();
  }, []);

  return {
    credits,
    amendments,
    presentations,
    partners,
    isLoading,
    fetchCredits,
    createCredit,
    updateCredit,
    fetchAmendments,
    createAmendment,
    fetchPresentations,
    createPresentation,
    updatePresentation,
    fetchPartners,
    getAvailableAmount,
    isCreditExpired,
  };
}

export default useERPDocumentaryCredits;
