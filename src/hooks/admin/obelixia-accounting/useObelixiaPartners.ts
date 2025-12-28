/**
 * useObelixiaPartners Hook
 * Gestión de socios de ObelixIA
 * Fase 11 - Enterprise SaaS 2025-2026
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface Partner {
  id: string;
  user_id: string | null;
  partner_name: string;
  partner_tax_id: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  ownership_percentage: number;
  capital_contributed: number;
  current_account_balance: number;
  is_administrator: boolean;
  administrator_remuneration: number;
  entry_date: string;
  exit_date: string | null;
  status: 'active' | 'inactive' | 'pending';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerTransaction {
  id: string;
  partner_id: string;
  transaction_type: 'capital_contribution' | 'capital_withdrawal' | 'loan_to_company' | 
                    'loan_repayment' | 'dividend' | 'expense_reimbursement' | 
                    'admin_remuneration' | 'other';
  transaction_date: string;
  amount: number;
  description: string | null;
  journal_entry_id: string | null;
  tax_withholding: number;
  net_amount: number | null;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export type TransactionType = PartnerTransaction['transaction_type'];

// === HOOK ===
export function useObelixiaPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [transactions, setTransactions] = useState<PartnerTransaction[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // === FETCH PARTNERS ===
  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('obelixia_partners')
        .select('*')
        .order('ownership_percentage', { ascending: false });

      if (error) throw error;
      setPartners((data || []) as Partner[]);
      return data;
    } catch (err) {
      console.error('[useObelixiaPartners] fetchPartners error:', err);
      toast.error('Error al cargar socios');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FETCH TRANSACTIONS ===
  const fetchTransactions = useCallback(async (partnerId?: string) => {
    try {
      let query = supabase
        .from('obelixia_partner_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (partnerId) {
        query = query.eq('partner_id', partnerId);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setTransactions((data || []) as PartnerTransaction[]);
      return data;
    } catch (err) {
      console.error('[useObelixiaPartners] fetchTransactions error:', err);
      return null;
    }
  }, []);

  // === CREATE PARTNER ===
  const createPartner = useCallback(async (partnerData: { partner_name: string; ownership_percentage: number } & Partial<Partner>) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('obelixia_partners')
        .insert([partnerData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Socio creado correctamente');
      await fetchPartners();
      return data as Partner;
    } catch (err) {
      console.error('[useObelixiaPartners] createPartner error:', err);
      toast.error('Error al crear socio');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchPartners]);

  // === UPDATE PARTNER ===
  const updatePartner = useCallback(async (partnerId: string, updates: Partial<Partner>) => {
    try {
      const { error } = await supabase
        .from('obelixia_partners')
        .update(updates as Record<string, unknown>)
        .eq('id', partnerId);

      if (error) throw error;

      toast.success('Socio actualizado');
      await fetchPartners();
      return true;
    } catch (err) {
      console.error('[useObelixiaPartners] updatePartner error:', err);
      toast.error('Error al actualizar socio');
      return false;
    }
  }, [fetchPartners]);

  // === CREATE TRANSACTION ===
  const createTransaction = useCallback(async (
    partnerId: string,
    transactionType: TransactionType,
    amount: number,
    transactionDate: string,
    description?: string
  ) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'partner_transaction',
            params: {
              partner_id: partnerId,
              transaction_type: transactionType,
              amount,
              transaction_date: transactionDate,
              description,
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Transacción registrada');
        await fetchPartners();
        await fetchTransactions(partnerId);
        return data.data;
      }

      throw new Error(data?.error || 'Error al crear transacción');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchPartners, fetchTransactions]);

  // === APPROVE TRANSACTION ===
  const approveTransaction = useCallback(async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('obelixia_partner_transactions')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      if (error) throw error;

      toast.success('Transacción aprobada');
      await fetchTransactions();
      return true;
    } catch (err) {
      console.error('[useObelixiaPartners] approveTransaction error:', err);
      toast.error('Error al aprobar transacción');
      return false;
    }
  }, [fetchTransactions]);

  // === CALCULATE DISTRIBUTION ===
  const calculateDistribution = useCallback((totalAmount: number) => {
    return partners
      .filter(p => p.status === 'active')
      .map(partner => ({
        partner,
        percentage: partner.ownership_percentage,
        grossAmount: (totalAmount * partner.ownership_percentage) / 100,
        withholding: partner.is_administrator 
          ? 0 
          : ((totalAmount * partner.ownership_percentage) / 100) * 0.19, // 19% IRPF dividendos
        netAmount: partner.is_administrator
          ? (totalAmount * partner.ownership_percentage) / 100
          : ((totalAmount * partner.ownership_percentage) / 100) * 0.81,
      }));
  }, [partners]);

  // === INITIAL LOAD ===
  useEffect(() => {
    fetchPartners();
    fetchTransactions();
  }, [fetchPartners, fetchTransactions]);

  return {
    // State
    partners,
    transactions,
    selectedPartner,
    isLoading,
    // Actions
    fetchPartners,
    fetchTransactions,
    createPartner,
    updatePartner,
    createTransaction,
    approveTransaction,
    setSelectedPartner,
    calculateDistribution,
  };
}

export default useObelixiaPartners;
