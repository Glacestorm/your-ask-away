/**
 * useObelixiaInvoicing Hook
 * Workflow completo de facturación con automatización
 * Fase 11.3 - Enterprise SaaS 2025-2026
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: 'standard' | 'rectificative' | 'proforma';
  status: 'draft' | 'sent' | 'pending_payment' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  partner_id?: string;
  partner_name: string;
  partner_tax_id?: string;
  partner_address?: string;
  issue_date: string;
  due_date: string;
  sent_at?: string;
  paid_at?: string;
  subtotal: number;
  tax_amount: number;
  retention_amount: number;
  total: number;
  amount_paid: number;
  tax_rate: number;
  retention_rate: number;
  quote_id?: string;
  journal_entry_id?: string;
  reminder_count: number;
  last_reminder_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLine {
  id?: string;
  invoice_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
  account_code?: string;
  line_total: number;
  order_index: number;
}

export interface InvoiceWorkflow {
  id: string;
  invoice_id: string;
  from_status?: string;
  to_status: string;
  action: string;
  notes?: string;
  performed_by?: string;
  performed_at: string;
}

export interface CreateInvoiceParams {
  partner_id?: string;
  partner_name: string;
  partner_tax_id?: string;
  partner_address?: string;
  invoice_type?: 'standard' | 'rectificative' | 'proforma';
  issue_date?: string;
  due_date?: string;
  tax_rate?: number;
  retention_rate?: number;
  lines: Omit<InvoiceLine, 'id' | 'invoice_id'>[];
  notes?: string;
  auto_send?: boolean;
}

// === HOOK ===
export function useObelixiaInvoicing() {
  const [isLoading, setIsLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLine[]>([]);
  const [workflow, setWorkflow] = useState<InvoiceWorkflow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // === FETCH INVOICES ===
  const fetchInvoices = useCallback(async (filters?: {
    status?: string;
    partner_id?: string;
    from_date?: string;
    to_date?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'get_invoices',
            params: filters
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setInvoices(data.data.invoices || []);
        return data.data;
      }

      throw new Error(data?.error || 'Error al obtener facturas');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useObelixiaInvoicing] fetchInvoices error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET INVOICE BY ID ===
  const getInvoice = useCallback(async (invoiceId: string) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'get_invoice',
            params: { invoice_id: invoiceId }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setCurrentInvoice(data.data.invoice);
        setInvoiceLines(data.data.lines || []);
        setWorkflow(data.data.workflow || []);
        return data.data;
      }

      throw new Error(data?.error || 'Error al obtener factura');
    } catch (err) {
      console.error('[useObelixiaInvoicing] getInvoice error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CREATE INVOICE ===
  const createInvoice = useCallback(async (params: CreateInvoiceParams) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'create_invoice',
            params
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(`Factura ${data.data.invoice.invoice_number} creada`);
        await fetchInvoices();
        return data.data;
      }

      throw new Error(data?.error || 'Error al crear factura');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      console.error('[useObelixiaInvoicing] createInvoice error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchInvoices]);

  // === UPDATE INVOICE STATUS (Workflow) ===
  const updateInvoiceStatus = useCallback(async (
    invoiceId: string,
    newStatus: Invoice['status'],
    notes?: string
  ) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'update_invoice_status',
            params: {
              invoice_id: invoiceId,
              status: newStatus,
              notes
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Estado actualizado');
        await fetchInvoices();
        return true;
      }

      throw new Error(data?.error || 'Error al actualizar estado');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchInvoices]);

  // === SEND INVOICE ===
  const sendInvoice = useCallback(async (
    invoiceId: string,
    sendMethod: 'email' | 'download' = 'email'
  ) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'send_invoice',
            params: {
              invoice_id: invoiceId,
              send_method: sendMethod
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Factura enviada correctamente');
        await fetchInvoices();
        return data.data;
      }

      throw new Error(data?.error || 'Error al enviar factura');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchInvoices]);

  // === RECORD PAYMENT ===
  const recordPayment = useCallback(async (
    invoiceId: string,
    amount: number,
    paymentDate?: string,
    paymentMethod?: string
  ) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'record_payment',
            params: {
              invoice_id: invoiceId,
              amount,
              payment_date: paymentDate || new Date().toISOString().split('T')[0],
              payment_method: paymentMethod
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Pago registrado');
        await fetchInvoices();
        return data.data;
      }

      throw new Error(data?.error || 'Error al registrar pago');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchInvoices]);

  // === SEND REMINDER ===
  const sendReminder = useCallback(async (invoiceId: string) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'send_reminder',
            params: { invoice_id: invoiceId }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Recordatorio enviado');
        await fetchInvoices();
        return true;
      }

      throw new Error(data?.error || 'Error al enviar recordatorio');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchInvoices]);

  // === CONVERT QUOTE TO INVOICE ===
  const convertQuoteToInvoice = useCallback(async (quoteId: string) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'convert_quote_to_invoice',
            params: { quote_id: quoteId }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(`Factura ${data.data.invoice.invoice_number} creada desde presupuesto`);
        await fetchInvoices();
        return data.data;
      }

      throw new Error(data?.error || 'Error al convertir presupuesto');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchInvoices]);

  // === CANCEL INVOICE ===
  const cancelInvoice = useCallback(async (invoiceId: string, reason?: string) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'cancel_invoice',
            params: {
              invoice_id: invoiceId,
              reason
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Factura anulada');
        await fetchInvoices();
        return true;
      }

      throw new Error(data?.error || 'Error al anular factura');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchInvoices]);

  // === GET OVERDUE INVOICES ===
  const getOverdueInvoices = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'get_overdue_invoices'
          }
        }
      );

      if (fnError) throw fnError;
      return data?.data?.invoices || [];
    } catch (err) {
      console.error('[useObelixiaInvoicing] getOverdueInvoices error:', err);
      return [];
    }
  }, []);

  // === AGING REPORT ===
  const getAgingReport = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'get_aging_report',
            params: { type: 'receivables' }
          }
        }
      );

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('[useObelixiaInvoicing] getAgingReport error:', err);
      return null;
    }
  }, []);

  return {
    // State
    isLoading,
    invoices,
    currentInvoice,
    invoiceLines,
    workflow,
    error,
    // Actions
    fetchInvoices,
    getInvoice,
    createInvoice,
    updateInvoiceStatus,
    sendInvoice,
    recordPayment,
    sendReminder,
    convertQuoteToInvoice,
    cancelInvoice,
    getOverdueInvoices,
    getAgingReport,
    setCurrentInvoice
  };
}

export default useObelixiaInvoicing;
