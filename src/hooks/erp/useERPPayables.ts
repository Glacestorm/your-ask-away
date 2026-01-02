/**
 * Hook para gestión de Pagos (Payables) ERP
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';

export interface ERPPayable {
  id: string;
  company_id: string;
  supplier_invoice_id?: string;
  supplier_id?: string;
  due_date: string;
  amount: number;
  currency_code: string;
  status: 'pending' | 'partial' | 'paid' | 'cancelled';
  paid_amount: number;
  remaining_amount: number;
  payment_method_id?: string;
  bank_account_id?: string;
  created_at: string;
  updated_at: string;
  supplier?: { name: string };
}

export function useERPPayables() {
  const { currentCompany } = useERPContext();
  const [payables, setPayables] = useState<ERPPayable[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPayables = useCallback(async (filters?: { status?: string; dueFrom?: string; dueTo?: string }) => {
    if (!currentCompany?.id) return [];
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('erp_payables')
        .select(`
          *,
          supplier:erp_suppliers(name)
        `)
        .eq('company_id', currentCompany.id)
        .order('due_date', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.dueFrom) {
        query = query.gte('due_date', filters.dueFrom);
      }
      if (filters?.dueTo) {
        query = query.lte('due_date', filters.dueTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      setPayables(data as ERPPayable[]);
      return data;
    } catch (error) {
      console.error('[useERPPayables] Error:', error);
      toast.error('Error al cargar vencimientos');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  const createPayment = useCallback(async (payableIds: string[], paymentData: {
    payment_date: string;
    payment_method_id: string;
    bank_account_id: string;
    reference?: string;
    notes?: string;
  }) => {
    if (!currentCompany?.id) return null;

    try {
      // Get payables to pay
      const { data: payablesToPay } = await supabase
        .from('erp_payables')
        .select('*')
        .in('id', payableIds);

      if (!payablesToPay?.length) throw new Error('No se encontraron vencimientos');

      const totalAmount = payablesToPay.reduce((sum, p) => sum + Number(p.remaining_amount), 0);

      // Create payment
      const { data: payment, error: paymentError } = await supabase
        .from('erp_payments')
        .insert([{
          company_id: currentCompany.id,
          payment_date: paymentData.payment_date,
          payment_method: paymentData.payment_method_id,
          bank_account_id: paymentData.bank_account_id,
          amount: totalAmount,
          currency_code: payablesToPay[0].currency_code,
          reference: paymentData.reference,
          notes: paymentData.notes,
          status: 'confirmed'
        }])
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Update payables as paid
      for (const payable of payablesToPay) {
        await supabase
          .from('erp_payables')
          .update({
            status: 'paid' as const,
            paid_amount: payable.amount,
            remaining_amount: 0
          })
          .eq('id', payable.id);
      }

      toast.success(`Pago creado: ${totalAmount.toFixed(2)} €`);
      await fetchPayables();
      return payment;
    } catch (error) {
      console.error('[useERPPayables] createPayment error:', error);
      toast.error('Error al crear pago');
      return null;
    }
  }, [currentCompany?.id, fetchPayables]);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchPayables();
    }
  }, [currentCompany?.id, fetchPayables]);

  return {
    payables,
    isLoading,
    fetchPayables,
    createPayment
  };
}

export default useERPPayables;
