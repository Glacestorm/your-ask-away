/**
 * useObelixiaBillingIntegration Hook
 * Integración completa del ciclo de facturación con la contabilidad
 * Fase 16 - Enterprise SaaS 2025-2026
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface BillingInvoice {
  id: string;
  invoice_number: string;
  invoice_type: 'sales' | 'purchase' | 'rectificative';
  status: 'draft' | 'issued' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  partner_id?: string;
  partner_name: string;
  partner_tax_id?: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  retention_amount: number;
  total: number;
  amount_paid: number;
  currency: string;
  exchange_rate: number;
  journal_entry_id?: string;
  payment_journal_entry_id?: string;
  is_accounted: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BillingPayment {
  id: string;
  invoice_id: string;
  payment_date: string;
  amount: number;
  payment_method: 'bank_transfer' | 'cash' | 'card' | 'check' | 'other';
  bank_account_id?: string;
  reference?: string;
  journal_entry_id?: string;
  is_accounted: boolean;
  created_at: string;
}

export interface BillingIntegrationConfig {
  auto_post_invoices: boolean;
  auto_post_payments: boolean;
  sales_account: string;
  purchases_account: string;
  receivables_account: string;
  payables_account: string;
  vat_output_account: string;
  vat_input_account: string;
  bank_account: string;
  retention_account: string;
  default_payment_terms: number;
  default_tax_rate: number;
  default_retention_rate: number;
}

export interface InvoiceSummary {
  total_sales: number;
  total_purchases: number;
  pending_receivables: number;
  pending_payables: number;
  overdue_receivables: number;
  overdue_payables: number;
  invoices_this_month: number;
  payments_this_month: number;
}

export interface AccountingIntegrationResult {
  success: boolean;
  journal_entry_id?: string;
  entry_number?: string;
  message: string;
  lines?: Array<{
    account_code: string;
    account_name: string;
    debit: number;
    credit: number;
  }>;
}

// === HOOK ===
export function useObelixiaBillingIntegration() {
  const [isLoading, setIsLoading] = useState(false);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [payments, setPayments] = useState<BillingPayment[]>([]);
  const [config, setConfig] = useState<BillingIntegrationConfig | null>(null);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // === FETCH CONFIG ===
  const fetchConfig = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'get_billing_config'
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setConfig(data.data.config);
        return data.data.config;
      }

      // Default config if not exists
      const defaultConfig: BillingIntegrationConfig = {
        auto_post_invoices: true,
        auto_post_payments: true,
        sales_account: '700',
        purchases_account: '600',
        receivables_account: '430',
        payables_account: '400',
        vat_output_account: '477',
        vat_input_account: '472',
        bank_account: '572',
        retention_account: '4751',
        default_payment_terms: 30,
        default_tax_rate: 21,
        default_retention_rate: 0
      };
      setConfig(defaultConfig);
      return defaultConfig;
    } catch (err) {
      console.error('[useObelixiaBillingIntegration] fetchConfig error:', err);
      return null;
    }
  }, []);

  // === FETCH INVOICES ===
  const fetchInvoices = useCallback(async (filters?: {
    type?: 'sales' | 'purchase';
    status?: string;
    from_date?: string;
    to_date?: string;
    unaccounted_only?: boolean;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'get_billing_invoices',
            params: filters
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setInvoices(data.data.invoices || []);
        setSummary(data.data.summary || null);
        return data.data;
      }

      throw new Error(data?.error || 'Error al obtener facturas');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useObelixiaBillingIntegration] fetchInvoices error:', err);
      
      // Demo data fallback
      const demoInvoices: BillingInvoice[] = [
        {
          id: '1',
          invoice_number: 'FV-2024-0001',
          invoice_type: 'sales',
          status: 'issued',
          partner_name: 'Cliente Demo S.L.',
          partner_tax_id: 'B12345678',
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subtotal: 1000,
          tax_amount: 210,
          retention_amount: 0,
          total: 1210,
          amount_paid: 0,
          currency: 'EUR',
          exchange_rate: 1,
          is_accounted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          invoice_number: 'FC-2024-0001',
          invoice_type: 'purchase',
          status: 'issued',
          partner_name: 'Proveedor Demo S.A.',
          partner_tax_id: 'A87654321',
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subtotal: 500,
          tax_amount: 105,
          retention_amount: 0,
          total: 605,
          amount_paid: 0,
          currency: 'EUR',
          exchange_rate: 1,
          is_accounted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      const demoSummary: InvoiceSummary = {
        total_sales: 15000,
        total_purchases: 8500,
        pending_receivables: 5200,
        pending_payables: 3100,
        overdue_receivables: 1200,
        overdue_payables: 0,
        invoices_this_month: 12,
        payments_this_month: 8
      };

      setInvoices(demoInvoices);
      setSummary(demoSummary);
      return { invoices: demoInvoices, summary: demoSummary };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CREATE SALES INVOICE ===
  const createSalesInvoice = useCallback(async (params: {
    partner_id?: string;
    partner_name: string;
    partner_tax_id?: string;
    issue_date?: string;
    due_date?: string;
    lines: Array<{
      description: string;
      quantity: number;
      unit_price: number;
      tax_rate?: number;
      discount_percent?: number;
      account_code?: string;
    }>;
    notes?: string;
    auto_account?: boolean;
  }) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'create_billing_invoice',
            params: {
              ...params,
              invoice_type: 'sales',
              auto_account: params.auto_account ?? config?.auto_post_invoices
            }
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
      console.error('[useObelixiaBillingIntegration] createSalesInvoice error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [config, fetchInvoices]);

  // === CREATE PURCHASE INVOICE ===
  const createPurchaseInvoice = useCallback(async (params: {
    partner_id?: string;
    partner_name: string;
    partner_tax_id?: string;
    issue_date?: string;
    due_date?: string;
    external_invoice_number?: string;
    lines: Array<{
      description: string;
      quantity: number;
      unit_price: number;
      tax_rate?: number;
      account_code?: string;
    }>;
    notes?: string;
    auto_account?: boolean;
  }) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'create_billing_invoice',
            params: {
              ...params,
              invoice_type: 'purchase',
              auto_account: params.auto_account ?? config?.auto_post_invoices
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(`Factura compra registrada`);
        await fetchInvoices();
        return data.data;
      }

      throw new Error(data?.error || 'Error al crear factura compra');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      console.error('[useObelixiaBillingIntegration] createPurchaseInvoice error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [config, fetchInvoices]);

  // === ACCOUNT INVOICE (Generate Journal Entry) ===
  const accountInvoice = useCallback(async (
    invoiceId: string,
    autoPost = true
  ): Promise<AccountingIntegrationResult | null> => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'account_billing_invoice',
            params: {
              invoice_id: invoiceId,
              auto_post: autoPost
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Factura contabilizada correctamente');
        await fetchInvoices();
        return {
          success: true,
          journal_entry_id: data.data.journal_entry_id,
          entry_number: data.data.entry_number,
          message: 'Asiento generado correctamente',
          lines: data.data.lines
        };
      }

      throw new Error(data?.error || 'Error al contabilizar factura');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      console.error('[useObelixiaBillingIntegration] accountInvoice error:', err);
      return {
        success: false,
        message
      };
    } finally {
      setIsLoading(false);
    }
  }, [fetchInvoices]);

  // === REGISTER PAYMENT ===
  const registerPayment = useCallback(async (params: {
    invoice_id: string;
    amount: number;
    payment_date?: string;
    payment_method?: BillingPayment['payment_method'];
    bank_account_id?: string;
    reference?: string;
    auto_account?: boolean;
  }) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'register_billing_payment',
            params: {
              ...params,
              payment_date: params.payment_date || new Date().toISOString().split('T')[0],
              payment_method: params.payment_method || 'bank_transfer',
              auto_account: params.auto_account ?? config?.auto_post_payments
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Pago registrado correctamente');
        await fetchInvoices();
        return data.data;
      }

      throw new Error(data?.error || 'Error al registrar pago');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      console.error('[useObelixiaBillingIntegration] registerPayment error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [config, fetchInvoices]);

  // === BATCH ACCOUNT INVOICES ===
  const batchAccountInvoices = useCallback(async (invoiceIds: string[]) => {
    setIsLoading(true);
    const results: AccountingIntegrationResult[] = [];

    try {
      for (const invoiceId of invoiceIds) {
        const result = await accountInvoice(invoiceId, true);
        if (result) results.push(result);
      }

      const successful = results.filter(r => r.success).length;
      toast.success(`${successful} de ${invoiceIds.length} facturas contabilizadas`);
      
      return results;
    } catch (err) {
      console.error('[useObelixiaBillingIntegration] batchAccountInvoices error:', err);
      return results;
    } finally {
      setIsLoading(false);
    }
  }, [accountInvoice]);

  // === GET AGING REPORT ===
  const getAgingReport = useCallback(async (type: 'receivables' | 'payables') => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'get_billing_aging',
            params: { type }
          }
        }
      );

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('[useObelixiaBillingIntegration] getAgingReport error:', err);
      return null;
    }
  }, []);

  // === RECONCILE WITH BANK ===
  const reconcileWithBank = useCallback(async (
    invoiceId: string,
    bankTransactionId: string
  ) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'reconcile_billing_with_bank',
            params: {
              invoice_id: invoiceId,
              bank_transaction_id: bankTransactionId
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Factura conciliada con movimiento bancario');
        await fetchInvoices();
        return data.data;
      }

      throw new Error(data?.error || 'Error al conciliar');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      console.error('[useObelixiaBillingIntegration] reconcileWithBank error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchInvoices]);

  // === SAVE CONFIG ===
  const saveConfig = useCallback(async (newConfig: Partial<BillingIntegrationConfig>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'save_billing_config',
            params: { config: { ...config, ...newConfig } }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setConfig({ ...config!, ...newConfig });
        toast.success('Configuración guardada');
        return true;
      }

      throw new Error(data?.error || 'Error al guardar configuración');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      console.error('[useObelixiaBillingIntegration] saveConfig error:', err);
      return false;
    }
  }, [config]);

  // === INITIAL LOAD ===
  useEffect(() => {
    fetchConfig();
    fetchInvoices();
  }, [fetchConfig, fetchInvoices]);

  return {
    // State
    isLoading,
    invoices,
    payments,
    config,
    summary,
    error,
    // Invoice Actions
    fetchInvoices,
    createSalesInvoice,
    createPurchaseInvoice,
    accountInvoice,
    batchAccountInvoices,
    // Payment Actions
    registerPayment,
    // Reports
    getAgingReport,
    // Reconciliation
    reconcileWithBank,
    // Config
    fetchConfig,
    saveConfig
  };
}

export default useObelixiaBillingIntegration;
