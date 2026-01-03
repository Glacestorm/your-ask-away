/**
 * Hook for ERP Bank Guarantees (Avales Bancarios)
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';

export interface BankGuarantee {
  id: string;
  company_id: string;
  guarantee_number: string;
  guarantee_type: 'bid_bond' | 'performance_bond' | 'advance_payment' | 'warranty' | 'customs' | 'rental' | 'other';
  applicant_id?: string;
  beneficiary_id?: string;
  issuing_bank_id?: string;
  amount: number;
  currency: string;
  issue_date: string;
  effective_date?: string;
  expiry_date: string;
  status: 'draft' | 'requested' | 'issued' | 'active' | 'claimed' | 'released' | 'expired' | 'cancelled';
  underlying_contract?: string;
  purpose?: string;
  terms_conditions?: string;
  auto_renewal?: boolean;
  renewal_period_months?: number;
  commission_rate?: number;
  commission_amount?: number;
  issuance_fee?: number;
  notes?: string;
  documents?: unknown[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Joined data
  applicant?: { id: string; name: string };
  beneficiary?: { id: string; name: string };
  issuing_bank?: { id: string; name: string };
}

export interface GuaranteeClaim {
  id: string;
  guarantee_id: string;
  claim_number: string;
  claim_date: string;
  claim_amount: number;
  reason: string;
  claimant_documents?: unknown[];
  status: 'received' | 'under_review' | 'accepted' | 'partially_accepted' | 'rejected' | 'paid';
  accepted_amount?: number;
  payment_date?: string;
  rejection_reason?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  processed_by?: string;
}

export interface CreateGuaranteeInput {
  guarantee_number: string;
  guarantee_type: BankGuarantee['guarantee_type'];
  applicant_id?: string;
  beneficiary_id?: string;
  issuing_bank_id?: string;
  amount: number;
  currency: string;
  issue_date: string;
  effective_date?: string;
  expiry_date: string;
  underlying_contract?: string;
  purpose?: string;
  terms_conditions?: string;
  auto_renewal?: boolean;
  renewal_period_months?: number;
  commission_rate?: number;
  commission_amount?: number;
  issuance_fee?: number;
  notes?: string;
}

export interface CreateClaimInput {
  guarantee_id: string;
  claim_number: string;
  claim_date: string;
  claim_amount: number;
  reason: string;
  claimant_documents?: unknown[];
  notes?: string;
}

export function useERPBankGuarantees() {
  const { currentCompany } = useERPContext();
  const [guarantees, setGuarantees] = useState<BankGuarantee[]>([]);
  const [claims, setClaims] = useState<GuaranteeClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all guarantees for current company
  const fetchGuarantees = useCallback(async () => {
    if (!currentCompany?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('erp_bank_guarantees')
        .select(`
          *,
          applicant:erp_trade_partners!erp_bank_guarantees_applicant_id_fkey(id, trade_name),
          beneficiary:erp_trade_partners!erp_bank_guarantees_beneficiary_id_fkey(id, trade_name),
          issuing_bank:erp_financial_entities!erp_bank_guarantees_issuing_bank_id_fkey(id, entity_name)
        `)
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      // Map trade_name/entity_name to name for consistent interface
      const mapped = (data || []).map((g: Record<string, unknown>) => ({
        ...g,
        applicant: g.applicant && typeof g.applicant === 'object' && 'id' in g.applicant 
          ? { id: (g.applicant as { id: string; trade_name: string }).id, name: (g.applicant as { id: string; trade_name: string }).trade_name } 
          : undefined,
        beneficiary: g.beneficiary && typeof g.beneficiary === 'object' && 'id' in g.beneficiary
          ? { id: (g.beneficiary as { id: string; trade_name: string }).id, name: (g.beneficiary as { id: string; trade_name: string }).trade_name }
          : undefined,
        issuing_bank: g.issuing_bank && typeof g.issuing_bank === 'object' && 'id' in g.issuing_bank
          ? { id: (g.issuing_bank as { id: string; entity_name: string }).id, name: (g.issuing_bank as { id: string; entity_name: string }).entity_name }
          : undefined,
      }));
      setGuarantees(mapped as BankGuarantee[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error loading guarantees';
      setError(message);
      console.error('[useERPBankGuarantees] fetchGuarantees error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id]);

  // Create new guarantee
  const createGuarantee = useCallback(async (input: CreateGuaranteeInput) => {
    if (!currentCompany?.id) {
      toast.error('No hay empresa seleccionada');
      return null;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('erp_bank_guarantees')
        .insert([{
          ...input,
          company_id: currentCompany.id,
          status: 'draft'
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('Aval creado correctamente');
      await fetchGuarantees();
      return data as BankGuarantee;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creating guarantee';
      toast.error(message);
      console.error('[useERPBankGuarantees] createGuarantee error:', err);
      return null;
    }
  }, [currentCompany?.id, fetchGuarantees]);

  // Update guarantee status
  const updateGuaranteeStatus = useCallback(async (
    guaranteeId: string, 
    status: BankGuarantee['status']
  ) => {
    try {
      const { error: updateError } = await supabase
        .from('erp_bank_guarantees')
        .update({ status })
        .eq('id', guaranteeId);

      if (updateError) throw updateError;

      toast.success('Estado actualizado');
      await fetchGuarantees();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating status';
      toast.error(message);
      console.error('[useERPBankGuarantees] updateGuaranteeStatus error:', err);
      return false;
    }
  }, [fetchGuarantees]);

  // Fetch claims for a guarantee
  const fetchClaims = useCallback(async (guaranteeId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('erp_guarantee_claims')
        .select('*')
        .eq('guarantee_id', guaranteeId)
        .order('claim_date', { ascending: false });

      if (fetchError) throw fetchError;
      setClaims(data as GuaranteeClaim[]);
      return data as GuaranteeClaim[];
    } catch (err) {
      console.error('[useERPBankGuarantees] fetchClaims error:', err);
      return [];
    }
  }, []);

  // Create claim
  const createClaim = useCallback(async (input: CreateClaimInput) => {
    try {
      const { data, error: insertError } = await supabase
        .from('erp_guarantee_claims')
        .insert([{
          guarantee_id: input.guarantee_id,
          claim_number: input.claim_number,
          claim_date: input.claim_date,
          claim_amount: input.claim_amount,
          reason: input.reason,
          claimant_documents: input.claimant_documents ? JSON.parse(JSON.stringify(input.claimant_documents)) : [],
          notes: input.notes || null,
          status: 'received' as const
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Update guarantee status to claimed
      await supabase
        .from('erp_bank_guarantees')
        .update({ status: 'claimed' })
        .eq('id', input.guarantee_id);

      toast.success('Reclamación registrada');
      await fetchClaims(input.guarantee_id);
      await fetchGuarantees();
      return data as GuaranteeClaim;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creating claim';
      toast.error(message);
      console.error('[useERPBankGuarantees] createClaim error:', err);
      return null;
    }
  }, [fetchClaims, fetchGuarantees]);

  // Get guarantee statistics
  const getStatistics = useCallback(() => {
    const active = guarantees.filter(g => g.status === 'active' || g.status === 'issued');
    const totalAmount = active.reduce((sum, g) => sum + Number(g.amount), 0);
    const expiringSoon = guarantees.filter(g => {
      if (g.status !== 'active' && g.status !== 'issued') return false;
      const expiry = new Date(g.expiry_date);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    });

    return {
      total: guarantees.length,
      active: active.length,
      totalAmount,
      expiringSoon: expiringSoon.length,
      byType: {
        bid_bond: guarantees.filter(g => g.guarantee_type === 'bid_bond').length,
        performance_bond: guarantees.filter(g => g.guarantee_type === 'performance_bond').length,
        advance_payment: guarantees.filter(g => g.guarantee_type === 'advance_payment').length,
        warranty: guarantees.filter(g => g.guarantee_type === 'warranty').length,
        customs: guarantees.filter(g => g.guarantee_type === 'customs').length,
        rental: guarantees.filter(g => g.guarantee_type === 'rental').length,
        other: guarantees.filter(g => g.guarantee_type === 'other').length,
      }
    };
  }, [guarantees]);

  return {
    guarantees,
    claims,
    loading,
    error,
    fetchGuarantees,
    createGuarantee,
    updateGuaranteeStatus,
    fetchClaims,
    createClaim,
    getStatistics,
  };
}

export default useERPBankGuarantees;
