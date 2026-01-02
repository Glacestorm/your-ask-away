/**
 * Hook para gestión de Cobros (Receivables) ERP
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';

export interface ERPReceivable {
  id: string;
  company_id: string;
  sales_invoice_id?: string;
  customer_id?: string;
  due_date: string;
  amount: number;
  currency_code: string;
  status: 'pending' | 'partial' | 'collected' | 'cancelled';
  collected_amount: number;
  remaining_amount: number;
  payment_method_id?: string;
  bank_account_id?: string;
  created_at: string;
  updated_at: string;
  customer?: { name: string };
}

export function useERPReceivables() {
  const { currentCompany } = useERPContext();
  const [receivables, setReceivables] = useState<ERPReceivable[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReceivables = useCallback(async (filters?: { status?: string; dueFrom?: string; dueTo?: string }) => {
    if (!currentCompany?.id) return [];
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('erp_receivables')
        .select(`
          *,
          customer:erp_customers(name)
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

      setReceivables(data as ERPReceivable[]);
      return data;
    } catch (error) {
      console.error('[useERPReceivables] Error:', error);
      toast.error('Error al cargar vencimientos');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  const createReceipt = useCallback(async (receivableIds: string[], receiptData: {
    receipt_date: string;
    payment_method_id: string;
    bank_account_id: string;
    reference?: string;
    notes?: string;
  }) => {
    if (!currentCompany?.id) return null;

    try {
      // Get receivables to collect
      const { data: receivablesToCollect } = await supabase
        .from('erp_receivables')
        .select('*')
        .in('id', receivableIds);

      if (!receivablesToCollect?.length) throw new Error('No se encontraron vencimientos');

      const totalAmount = receivablesToCollect.reduce((sum, r) => sum + Number(r.remaining_amount), 0);

      // Create receipt
      const { data: receipt, error: receiptError } = await supabase
        .from('erp_receipts')
        .insert([{
          company_id: currentCompany.id,
          receipt_date: receiptData.receipt_date,
          payment_method: receiptData.payment_method_id,
          bank_account_id: receiptData.bank_account_id,
          amount: totalAmount,
          currency_code: receivablesToCollect[0].currency_code,
          reference: receiptData.reference,
          notes: receiptData.notes,
          status: 'confirmed'
        }])
        .select()
        .single();

      if (receiptError) throw receiptError;

      // Update receivables as collected
      for (const receivable of receivablesToCollect) {
        await supabase
          .from('erp_receivables')
          .update({
            status: 'collected' as const,
            collected_amount: receivable.amount,
            remaining_amount: 0
          })
          .eq('id', receivable.id);
      }

      toast.success(`Cobro registrado: ${totalAmount.toFixed(2)} €`);
      await fetchReceivables();
      return receipt;
    } catch (error) {
      console.error('[useERPReceivables] createReceipt error:', error);
      toast.error('Error al registrar cobro');
      return null;
    }
  }, [currentCompany?.id, fetchReceivables]);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchReceivables();
    }
  }, [currentCompany?.id, fetchReceivables]);

  return {
    receivables,
    isLoading,
    fetchReceivables,
    createReceipt
  };
}

export default useERPReceivables;
