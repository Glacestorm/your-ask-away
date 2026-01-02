/**
 * useERPSales Hook
 * Módulo de Ventas ERP - Fase 2
 * Flujo: Presupuesto → Pedido → Albarán → Factura → Abono
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from './useERPContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Types
export interface SalesQuote {
  id: string;
  company_id: string;
  series_id?: string;
  number?: string;
  customer_id: string;
  customer_name?: string;
  customer_tax_id?: string;
  customer_address?: string;
  date: string;
  valid_until?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  currency: string;
  notes?: string;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  total: number;
  created_at: string;
  lines?: SalesQuoteLine[];
}

export interface SalesQuoteLine {
  id: string;
  quote_id: string;
  line_number: number;
  item_id?: string;
  item_code?: string;
  description: string;
  qty: number;
  unit: string;
  unit_price: number;
  discount_percent: number;
  discount_total: number;
  tax_rate: number;
  tax_total: number;
  line_total: number;
  pricing_breakdown_json?: unknown;
}

export interface SalesOrder {
  id: string;
  company_id: string;
  series_id?: string;
  number?: string;
  quote_id?: string;
  customer_id: string;
  customer_name?: string;
  customer_tax_id?: string;
  customer_address?: string;
  date: string;
  delivery_date?: string;
  status: 'draft' | 'confirmed' | 'partial' | 'completed' | 'cancelled';
  currency: string;
  notes?: string;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  total: number;
  credit_check_passed: boolean;
  created_at: string;
  lines?: SalesOrderLine[];
}

export interface SalesOrderLine {
  id: string;
  order_id: string;
  quote_line_id?: string;
  line_number: number;
  item_id?: string;
  item_code?: string;
  description: string;
  qty: number;
  qty_delivered: number;
  qty_invoiced: number;
  unit: string;
  unit_price: number;
  discount_percent: number;
  discount_total: number;
  tax_rate: number;
  tax_total: number;
  line_total: number;
}

export interface DeliveryNote {
  id: string;
  company_id: string;
  series_id?: string;
  number?: string;
  order_id?: string;
  customer_id: string;
  customer_name?: string;
  delivery_address?: string;
  date: string;
  shipped_at?: string;
  status: 'draft' | 'ready' | 'shipped' | 'delivered' | 'invoiced' | 'cancelled';
  carrier?: string;
  tracking_number?: string;
  notes?: string;
  subtotal: number;
  tax_total: number;
  total: number;
  created_at: string;
  lines?: DeliveryNoteLine[];
}

export interface DeliveryNoteLine {
  id: string;
  delivery_note_id: string;
  order_line_id?: string;
  line_number: number;
  item_id?: string;
  item_code?: string;
  description: string;
  qty: number;
  qty_invoiced: number;
  unit: string;
  unit_price: number;
  tax_rate: number;
  tax_total: number;
  line_total: number;
}

export interface SalesInvoice {
  id: string;
  company_id: string;
  series_id?: string;
  number?: string;
  customer_id: string;
  customer_name?: string;
  customer_tax_id?: string;
  customer_address?: string;
  invoice_date: string;
  due_date?: string;
  due_dates_json?: Record<string, unknown> | null;
  status: 'draft' | 'confirmed' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  currency: string;
  payment_method?: string;
  payment_terms?: string;
  notes?: string;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  total: number;
  paid_amount: number;
  pdf_url?: string;
  created_at: string;
  lines?: SalesInvoiceLine[];
}

export interface SalesInvoiceLine {
  id: string;
  invoice_id: string;
  delivery_note_line_id?: string;
  order_line_id?: string;
  line_number: number;
  item_id?: string;
  item_code?: string;
  description: string;
  qty: number;
  unit: string;
  unit_price: number;
  discount_percent: number;
  discount_total: number;
  tax_rate: number;
  tax_total: number;
  line_total: number;
}

export interface SalesCreditNote {
  id: string;
  company_id: string;
  series_id?: string;
  number?: string;
  invoice_id?: string;
  customer_id: string;
  customer_name?: string;
  date: string;
  reason?: string;
  status: 'draft' | 'confirmed' | 'applied' | 'cancelled';
  currency: string;
  notes?: string;
  subtotal: number;
  tax_total: number;
  total: number;
  created_at: string;
  lines?: SalesCreditNoteLine[];
}

export interface SalesCreditNoteLine {
  id: string;
  credit_note_id: string;
  invoice_line_id?: string;
  line_number: number;
  item_id?: string;
  item_code?: string;
  description: string;
  qty: number;
  unit: string;
  unit_price: number;
  tax_rate: number;
  tax_total: number;
  line_total: number;
}

export interface Receivable {
  id: string;
  company_id: string;
  invoice_id?: string;
  customer_id: string;
  customer_name?: string;
  due_date: string;
  amount: number;
  paid_amount: number;
  status: 'unpaid' | 'partial' | 'paid' | 'cancelled';
  payment_date?: string;
}

export interface CreditCheckResult {
  current_debt: number;
  overdue_debt: number;
  new_amount: number;
  total_exposure: number;
  credit_limit: number;
  has_policy: boolean;
  passed: boolean;
  blocked: boolean;
  reason?: string;
}

export function useERPSales() {
  const { currentCompany, hasPermission } = useERPContext();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // ===================== PRESUPUESTOS =====================

  const fetchQuotes = useCallback(async (filters?: {
    status?: string;
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<SalesQuote[]> => {
    if (!currentCompany) return [];
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('sales_quotes')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('date', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.customerId) query = query.eq('customer_id', filters.customerId);
      if (filters?.dateFrom) query = query.gte('date', filters.dateFrom);
      if (filters?.dateTo) query = query.lte('date', filters.dateTo);

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return (data || []) as SalesQuote[];
    } catch (err) {
      console.error('[useERPSales] fetchQuotes error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  const fetchQuoteWithLines = useCallback(async (quoteId: string): Promise<SalesQuote | null> => {
    try {
      const { data: quote, error: quoteError } = await supabase
        .from('sales_quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (quoteError) throw quoteError;

      const { data: lines, error: linesError } = await supabase
        .from('sales_quote_lines')
        .select('*')
        .eq('quote_id', quoteId)
        .order('line_number');

      if (linesError) throw linesError;

      return { ...(quote as SalesQuote), lines: lines as SalesQuoteLine[] };
    } catch (err) {
      console.error('[useERPSales] fetchQuoteWithLines error:', err);
      return null;
    }
  }, []);

  const createQuote = useCallback(async (
    quote: Omit<SalesQuote, 'id' | 'created_at' | 'company_id'>,
    lines: Omit<SalesQuoteLine, 'id' | 'quote_id'>[]
  ): Promise<SalesQuote | null> => {
    if (!currentCompany || !user) return null;

    setIsLoading(true);
    try {
      // Crear cabecera
      const { data: newQuote, error: quoteError } = await supabase
        .from('sales_quotes')
        .insert([{
          ...quote,
          company_id: currentCompany.id,
          created_by: user.id,
        }])
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Crear líneas
      if (lines.length > 0) {
        const linesToInsert = lines.map((line, idx) => {
          const { pricing_breakdown_json, ...rest } = line;
          return {
            ...rest,
            quote_id: newQuote.id,
            line_number: idx + 1,
            pricing_breakdown_json: pricing_breakdown_json as Record<string, unknown> | null,
          };
        });

        const { error: linesError } = await supabase
          .from('sales_quote_lines')
          .insert(linesToInsert as never[]);

        if (linesError) throw linesError;
      }

      // Registrar auditoría
      await logSalesAudit('QUOTE_CREATED', 'quote', newQuote.id, null, newQuote);

      toast.success('Presupuesto creado');
      return newQuote as SalesQuote;
    } catch (err) {
      console.error('[useERPSales] createQuote error:', err);
      toast.error('Error al crear presupuesto');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, user]);

  const updateQuote = useCallback(async (
    quoteId: string,
    updates: Partial<SalesQuote>,
    lines?: Omit<SalesQuoteLine, 'id' | 'quote_id'>[]
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('sales_quotes')
        .update(updates)
        .eq('id', quoteId);

      if (updateError) throw updateError;

      // Si se proporcionan líneas, reemplazar todas
      if (lines) {
        await supabase.from('sales_quote_lines').delete().eq('quote_id', quoteId);
        
        if (lines.length > 0) {
          const linesToInsert = lines.map((line, idx) => {
            const { pricing_breakdown_json, ...rest } = line;
            return {
              ...rest,
              quote_id: quoteId,
              line_number: idx + 1,
              pricing_breakdown_json: pricing_breakdown_json as Record<string, unknown> | null,
            };
          });
          await supabase.from('sales_quote_lines').insert(linesToInsert as never[]);
        }
      }

      toast.success('Presupuesto actualizado');
      return true;
    } catch (err) {
      console.error('[useERPSales] updateQuote error:', err);
      toast.error('Error al actualizar presupuesto');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===================== PEDIDOS =====================

  const fetchOrders = useCallback(async (filters?: {
    status?: string;
    customerId?: string;
  }): Promise<SalesOrder[]> => {
    if (!currentCompany) return [];
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('sales_orders')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('date', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.customerId) query = query.eq('customer_id', filters.customerId);

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return (data || []) as SalesOrder[];
    } catch (err) {
      console.error('[useERPSales] fetchOrders error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  const fetchOrderWithLines = useCallback(async (orderId: string): Promise<SalesOrder | null> => {
    try {
      const { data: order, error: orderError } = await supabase
        .from('sales_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const { data: lines, error: linesError } = await supabase
        .from('sales_order_lines')
        .select('*')
        .eq('order_id', orderId)
        .order('line_number');

      if (linesError) throw linesError;

      return { ...(order as SalesOrder), lines: lines as SalesOrderLine[] };
    } catch (err) {
      console.error('[useERPSales] fetchOrderWithLines error:', err);
      return null;
    }
  }, []);

  const convertQuoteToOrder = useCallback(async (quoteId: string): Promise<SalesOrder | null> => {
    if (!currentCompany || !user) return null;

    setIsLoading(true);
    try {
      // Obtener presupuesto con líneas
      const quote = await fetchQuoteWithLines(quoteId);
      if (!quote) throw new Error('Presupuesto no encontrado');

      // Verificar crédito
      const creditCheck = await checkCustomerCredit(quote.customer_id, quote.total);
      if (creditCheck && creditCheck.blocked) {
        toast.error(`Operación bloqueada: ${creditCheck.reason}`);
        return null;
      }

      // Crear pedido
      const { data: newOrder, error: orderError } = await supabase
        .from('sales_orders')
        .insert([{
          company_id: currentCompany.id,
          quote_id: quoteId,
          customer_id: quote.customer_id,
          customer_name: quote.customer_name,
          customer_tax_id: quote.customer_tax_id,
          customer_address: quote.customer_address,
          date: new Date().toISOString().split('T')[0],
          status: 'draft',
          currency: quote.currency,
          notes: quote.notes,
          subtotal: quote.subtotal,
          discount_total: quote.discount_total,
          tax_total: quote.tax_total,
          total: quote.total,
          credit_check_passed: creditCheck?.passed ?? true,
          created_by: user.id,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Copiar líneas
      if (quote.lines && quote.lines.length > 0) {
        const orderLines = quote.lines.map((line, idx) => ({
          order_id: newOrder.id,
          quote_line_id: line.id,
          line_number: idx + 1,
          item_id: line.item_id,
          item_code: line.item_code,
          description: line.description,
          qty: line.qty,
          unit: line.unit,
          unit_price: line.unit_price,
          discount_percent: line.discount_percent,
          discount_total: line.discount_total,
          tax_rate: line.tax_rate,
          tax_total: line.tax_total,
          line_total: line.line_total,
          pricing_breakdown_json: line.pricing_breakdown_json as Record<string, unknown> | null,
        }));

        await supabase.from('sales_order_lines').insert(orderLines as never[]);
      }

      // Actualizar estado del presupuesto
      await supabase
        .from('sales_quotes')
        .update({ status: 'converted' })
        .eq('id', quoteId);

      // Registrar link
      await supabase.from('sales_document_links').insert([{
        source_type: 'quote',
        source_id: quoteId,
        target_type: 'order',
        target_id: newOrder.id,
      }]);

      await logSalesAudit('QUOTE_CONVERTED', 'order', newOrder.id, null, { from_quote: quoteId });

      toast.success('Pedido creado desde presupuesto');
      return newOrder as SalesOrder;
    } catch (err) {
      console.error('[useERPSales] convertQuoteToOrder error:', err);
      toast.error('Error al convertir presupuesto');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, user, fetchQuoteWithLines]);

  const createOrder = useCallback(async (
    order: Omit<SalesOrder, 'id' | 'created_at' | 'company_id' | 'lines'>,
    lines: Omit<SalesOrderLine, 'id' | 'order_id'>[],
    skipCreditCheck: boolean = false
  ): Promise<SalesOrder | null> => {
    if (!currentCompany || !user) return null;

    setIsLoading(true);
    try {
      const { data: newOrder, error: orderError } = await supabase
        .from('sales_orders')
        .insert([{
          ...order,
          company_id: currentCompany.id,
          credit_check_passed: skipCreditCheck || order.credit_check_passed,
          created_by: user.id,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      if (lines.length > 0) {
        const linesToInsert = lines.map((line, idx) => ({
          ...line,
          order_id: newOrder.id,
          line_number: idx + 1,
          qty_delivered: 0,
          qty_invoiced: 0,
        }));

        await supabase.from('sales_order_lines').insert(linesToInsert as never[]);
      }

      await logSalesAudit('ORDER_CREATED', 'order', newOrder.id, null, newOrder);
      toast.success('Pedido creado');
      return newOrder as SalesOrder;
    } catch (err) {
      console.error('[useERPSales] createOrder error:', err);
      toast.error('Error al crear pedido');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, user]);

  const confirmOrder = useCallback(async (orderId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('sales_orders')
        .update({ status: 'confirmed' })
        .eq('id', orderId);

      if (error) throw error;
      
      await logSalesAudit('ORDER_CONFIRMED', 'order', orderId, null, null);
      toast.success('Pedido confirmado');
      return true;
    } catch (err) {
      console.error('[useERPSales] confirmOrder error:', err);
      toast.error('Error al confirmar pedido');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===================== ALBARANES =====================

  const fetchDeliveryNotes = useCallback(async (filters?: {
    status?: string;
    customerId?: string;
  }): Promise<DeliveryNote[]> => {
    if (!currentCompany) return [];
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('delivery_notes')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('date', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.customerId) query = query.eq('customer_id', filters.customerId);

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return (data || []) as DeliveryNote[];
    } catch (err) {
      console.error('[useERPSales] fetchDeliveryNotes error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  const convertOrderToDeliveryNote = useCallback(async (
    orderId: string,
    lineQuantities?: { lineId: string; qty: number }[]
  ): Promise<DeliveryNote | null> => {
    if (!currentCompany || !user) return null;

    setIsLoading(true);
    try {
      const order = await fetchOrderWithLines(orderId);
      if (!order) throw new Error('Pedido no encontrado');

      // Crear albarán
      const { data: newDN, error: dnError } = await supabase
        .from('delivery_notes')
        .insert([{
          company_id: currentCompany.id,
          order_id: orderId,
          customer_id: order.customer_id,
          customer_name: order.customer_name,
          customer_tax_id: order.customer_tax_id,
          delivery_address: order.customer_address,
          date: new Date().toISOString().split('T')[0],
          status: 'draft',
          created_by: user.id,
        }])
        .select()
        .single();

      if (dnError) throw dnError;

      // Crear líneas (parciales o totales)
      if (order.lines && order.lines.length > 0) {
        const dnLines = order.lines
          .map((line, idx) => {
            const qtyToDeliver = lineQuantities
              ? (lineQuantities.find(lq => lq.lineId === line.id)?.qty ?? 0)
              : (line.qty - line.qty_delivered);
            
            if (qtyToDeliver <= 0) return null;

            return {
              delivery_note_id: newDN.id,
              order_line_id: line.id,
              line_number: idx + 1,
              item_id: line.item_id,
              item_code: line.item_code,
              description: line.description,
              qty: qtyToDeliver,
              unit: line.unit,
              unit_price: line.unit_price,
              tax_rate: line.tax_rate,
              tax_total: qtyToDeliver * line.unit_price * (line.tax_rate / 100),
              line_total: qtyToDeliver * line.unit_price,
            };
          })
          .filter(Boolean);

        if (dnLines.length > 0) {
          await supabase.from('delivery_note_lines').insert(dnLines);
        }
      }

      // Recalcular totales
      const { data: lines } = await supabase
        .from('delivery_note_lines')
        .select('line_total, tax_total')
        .eq('delivery_note_id', newDN.id);

      const subtotal = lines?.reduce((sum, l) => sum + Number(l.line_total), 0) || 0;
      const taxTotal = lines?.reduce((sum, l) => sum + Number(l.tax_total), 0) || 0;

      await supabase
        .from('delivery_notes')
        .update({ subtotal, tax_total: taxTotal, total: subtotal + taxTotal })
        .eq('id', newDN.id);

      await supabase.from('sales_document_links').insert([{
        source_type: 'order',
        source_id: orderId,
        target_type: 'delivery_note',
        target_id: newDN.id,
      }]);

      toast.success('Albarán creado');
      return { ...newDN, subtotal, tax_total: taxTotal, total: subtotal + taxTotal } as DeliveryNote;
    } catch (err) {
      console.error('[useERPSales] convertOrderToDeliveryNote error:', err);
      toast.error('Error al crear albarán');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, user, fetchOrderWithLines]);

  // ===================== FACTURAS =====================

  const fetchInvoices = useCallback(async (filters?: {
    status?: string;
    customerId?: string;
  }): Promise<SalesInvoice[]> => {
    if (!currentCompany) return [];
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('sales_invoices')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('invoice_date', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.customerId) query = query.eq('customer_id', filters.customerId);

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return (data || []) as SalesInvoice[];
    } catch (err) {
      console.error('[useERPSales] fetchInvoices error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  const fetchInvoiceWithLines = useCallback(async (invoiceId: string): Promise<SalesInvoice | null> => {
    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from('sales_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      const { data: lines, error: linesError } = await supabase
        .from('sales_invoice_lines')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('line_number');

      if (linesError) throw linesError;

      return { ...(invoice as SalesInvoice), lines: lines as SalesInvoiceLine[] };
    } catch (err) {
      console.error('[useERPSales] fetchInvoiceWithLines error:', err);
      return null;
    }
  }, []);

  const invoiceDeliveryNotes = useCallback(async (
    deliveryNoteIds: string[]
  ): Promise<SalesInvoice | null> => {
    if (!currentCompany || !user || deliveryNoteIds.length === 0) return null;

    setIsLoading(true);
    try {
      // Obtener albaranes
      const { data: deliveryNotes, error: dnError } = await supabase
        .from('delivery_notes')
        .select('*, lines:delivery_note_lines(*)')
        .in('id', deliveryNoteIds);

      if (dnError) throw dnError;
      if (!deliveryNotes || deliveryNotes.length === 0) throw new Error('Albaranes no encontrados');

      // Verificar que son del mismo cliente
      const customerId = deliveryNotes[0].customer_id;
      if (!deliveryNotes.every(dn => dn.customer_id === customerId)) {
        throw new Error('Todos los albaranes deben ser del mismo cliente');
      }

      // Verificar crédito
      const totalAmount = deliveryNotes.reduce((sum, dn) => sum + Number(dn.total), 0);
      const creditCheck = await checkCustomerCredit(customerId, totalAmount);
      if (creditCheck && creditCheck.blocked) {
        toast.error(`Operación bloqueada: ${creditCheck.reason}`);
        return null;
      }

      // Calcular totales
      let subtotal = 0;
      let discountTotal = 0;
      let taxTotal = 0;

      const allLines: Array<{
        delivery_note_line_id: string;
        line_number: number;
        item_id?: string;
        item_code?: string;
        description: string;
        qty: number;
        unit: string;
        unit_price: number;
        discount_percent: number;
        discount_total: number;
        tax_rate: number;
        tax_total: number;
        line_total: number;
      }> = [];

      let lineNum = 1;
      for (const dn of deliveryNotes) {
        const lines = dn.lines as DeliveryNoteLine[] || [];
        for (const line of lines) {
          subtotal += Number(line.line_total);
          taxTotal += Number(line.tax_total);
          allLines.push({
            delivery_note_line_id: line.id,
            line_number: lineNum++,
            item_id: line.item_id,
            item_code: line.item_code,
            description: line.description,
            qty: line.qty,
            unit: line.unit,
            unit_price: line.unit_price,
            discount_percent: 0,
            discount_total: 0,
            tax_rate: line.tax_rate,
            tax_total: line.tax_total,
            line_total: line.line_total,
          });
        }
      }

      // Crear factura
      const { data: newInvoice, error: invError } = await supabase
        .from('sales_invoices')
        .insert([{
          company_id: currentCompany.id,
          customer_id: customerId,
          customer_name: deliveryNotes[0].customer_name,
          customer_tax_id: deliveryNotes[0].customer_tax_id,
          customer_address: deliveryNotes[0].delivery_address,
          invoice_date: new Date().toISOString().split('T')[0],
          status: 'draft',
          currency: 'EUR',
          subtotal,
          discount_total: discountTotal,
          tax_total: taxTotal,
          total: subtotal + taxTotal,
          credit_check_passed: creditCheck?.passed ?? true,
          created_by: user.id,
        }])
        .select()
        .single();

      if (invError) throw invError;

      // Crear líneas
      const invoiceLines = allLines.map(line => ({
        ...line,
        invoice_id: newInvoice.id,
      }));

      await supabase.from('sales_invoice_lines').insert(invoiceLines);

      // Marcar albaranes como facturados
      await supabase
        .from('delivery_notes')
        .update({ status: 'invoiced' })
        .in('id', deliveryNoteIds);

      // Registrar links
      for (const dnId of deliveryNoteIds) {
        await supabase.from('sales_document_links').insert([{
          source_type: 'delivery_note',
          source_id: dnId,
          target_type: 'invoice',
          target_id: newInvoice.id,
        }]);
      }

      await logSalesAudit('INVOICE_CREATED', 'invoice', newInvoice.id, null, { from_delivery_notes: deliveryNoteIds });

      toast.success('Factura creada');
      return newInvoice as SalesInvoice;
    } catch (err) {
      console.error('[useERPSales] invoiceDeliveryNotes error:', err);
      toast.error('Error al crear factura');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, user]);

  const confirmInvoice = useCallback(async (invoiceId: string): Promise<boolean> => {
    if (!currentCompany) return false;
    
    setIsLoading(true);
    try {
      // Obtener factura
      const invoice = await fetchInvoiceWithLines(invoiceId);
      if (!invoice) throw new Error('Factura no encontrada');

      // Actualizar estado
      const { error } = await supabase
        .from('sales_invoices')
        .update({ status: 'confirmed' })
        .eq('id', invoiceId);

      if (error) throw error;

      // Generar vencimientos (receivables)
      const dueDate = invoice.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      await supabase.from('receivables').insert([{
        company_id: currentCompany.id,
        invoice_id: invoiceId,
        customer_id: invoice.customer_id,
        customer_name: invoice.customer_name,
        due_date: dueDate,
        amount: invoice.total,
        paid_amount: 0,
        status: 'unpaid',
      }]);
      
      await logSalesAudit('INVOICE_CONFIRMED', 'invoice', invoiceId, null, { receivable_generated: true });
      toast.success('Factura confirmada y vencimiento generado');
      return true;
    } catch (err) {
      console.error('[useERPSales] confirmInvoice error:', err);
      toast.error('Error al confirmar factura');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, fetchInvoiceWithLines]);

  // Crear factura directa (sin albarán)
  const createInvoice = useCallback(async (
    invoice: Omit<SalesInvoice, 'id' | 'created_at' | 'company_id' | 'lines'>,
    lines: Omit<SalesInvoiceLine, 'id' | 'invoice_id'>[]
  ): Promise<SalesInvoice | null> => {
    if (!currentCompany || !user) return null;

    setIsLoading(true);
    try {
      const { due_dates_json, ...invoiceData } = invoice;
      const { data: newInvoice, error: invoiceError } = await supabase
        .from('sales_invoices')
        .insert([{
          ...invoiceData,
          due_dates_json: due_dates_json ? JSON.parse(JSON.stringify(due_dates_json)) : null,
          company_id: currentCompany.id,
          paid_amount: 0,
          created_by: user.id,
        } as never])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      if (lines.length > 0) {
        const linesToInsert = lines.map((line, idx) => ({
          ...line,
          invoice_id: newInvoice.id,
          line_number: idx + 1,
        }));

        await supabase.from('sales_invoice_lines').insert(linesToInsert as never[]);
      }

      await logSalesAudit('INVOICE_CREATED', 'invoice', newInvoice.id, null, newInvoice);
      toast.success('Factura creada');
      return newInvoice as SalesInvoice;
    } catch (err) {
      console.error('[useERPSales] createInvoice error:', err);
      toast.error('Error al crear factura');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, user]);

  // Crear albarán directo (sin pedido)
  const createDeliveryNote = useCallback(async (
    delivery: Omit<DeliveryNote, 'id' | 'created_at' | 'company_id' | 'lines'>,
    lines: Omit<DeliveryNoteLine, 'id' | 'delivery_note_id'>[]
  ): Promise<DeliveryNote | null> => {
    if (!currentCompany || !user) return null;

    setIsLoading(true);
    try {
      const { data: newDN, error: dnError } = await supabase
        .from('delivery_notes')
        .insert([{
          ...delivery,
          company_id: currentCompany.id,
          created_by: user.id,
        }])
        .select()
        .single();

      if (dnError) throw dnError;

      if (lines.length > 0) {
        const linesToInsert = lines.map((line, idx) => ({
          ...line,
          delivery_note_id: newDN.id,
          line_number: idx + 1,
          qty_invoiced: 0,
        }));

        await supabase.from('delivery_note_lines').insert(linesToInsert as never[]);
      }

      // Recalcular totales
      const subtotal = lines.reduce((sum, l) => sum + l.line_total, 0);
      const taxTotal = lines.reduce((sum, l) => sum + l.tax_total, 0);

      await supabase
        .from('delivery_notes')
        .update({ subtotal, tax_total: taxTotal, total: subtotal + taxTotal })
        .eq('id', newDN.id);

      await logSalesAudit('DELIVERY_NOTE_CREATED', 'delivery_note', newDN.id, null, newDN);
      toast.success('Albarán creado');
      return { ...newDN, subtotal, tax_total: taxTotal, total: subtotal + taxTotal } as DeliveryNote;
    } catch (err) {
      console.error('[useERPSales] createDeliveryNote error:', err);
      toast.error('Error al crear albarán');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, user]);

  // Crear abono directo
  const createCreditNoteDirect = useCallback(async (
    creditNote: Omit<SalesCreditNote, 'id' | 'created_at' | 'company_id' | 'lines'>,
    lines: Omit<SalesCreditNoteLine, 'id' | 'credit_note_id'>[]
  ): Promise<SalesCreditNote | null> => {
    if (!currentCompany || !user) return null;

    setIsLoading(true);
    try {
      const { data: newCN, error: cnError } = await supabase
        .from('sales_credit_notes')
        .insert([{
          ...creditNote,
          company_id: currentCompany.id,
          created_by: user.id,
        }])
        .select()
        .single();

      if (cnError) throw cnError;

      if (lines.length > 0) {
        const linesToInsert = lines.map((line, idx) => ({
          ...line,
          credit_note_id: newCN.id,
          line_number: idx + 1,
        }));

        await supabase.from('sales_credit_note_lines').insert(linesToInsert as never[]);
      }

      await logSalesAudit('CREDIT_NOTE_CREATED', 'credit_note', newCN.id, null, newCN);
      toast.success('Abono creado');
      return newCN as SalesCreditNote;
    } catch (err) {
      console.error('[useERPSales] createCreditNoteDirect error:', err);
      toast.error('Error al crear abono');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, user]);

  // ===================== ABONOS =====================

  const fetchCreditNotes = useCallback(async (filters?: {
    status?: string;
    customerId?: string;
  }): Promise<SalesCreditNote[]> => {
    if (!currentCompany) return [];
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('sales_credit_notes')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('date', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.customerId) query = query.eq('customer_id', filters.customerId);

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return (data || []) as SalesCreditNote[];
    } catch (err) {
      console.error('[useERPSales] fetchCreditNotes error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  const createCreditNote = useCallback(async (
    invoiceId: string,
    reason: string,
    lineQuantities?: { lineId: string; qty: number }[]
  ): Promise<SalesCreditNote | null> => {
    if (!currentCompany || !user) return null;

    setIsLoading(true);
    try {
      const invoice = await fetchInvoiceWithLines(invoiceId);
      if (!invoice) throw new Error('Factura no encontrada');

      // Calcular líneas del abono
      const creditLines: Array<{
        invoice_line_id: string;
        line_number: number;
        item_id?: string;
        item_code?: string;
        description: string;
        qty: number;
        unit: string;
        unit_price: number;
        tax_rate: number;
        tax_total: number;
        line_total: number;
      }> = [];

      let lineNum = 1;
      let subtotal = 0;
      let taxTotal = 0;

      for (const line of (invoice.lines || [])) {
        const qtyToCredit = lineQuantities
          ? (lineQuantities.find(lq => lq.lineId === line.id)?.qty ?? 0)
          : line.qty;

        if (qtyToCredit > 0) {
          const lineTotal = qtyToCredit * line.unit_price;
          const lineTax = lineTotal * (line.tax_rate / 100);
          
          creditLines.push({
            invoice_line_id: line.id,
            line_number: lineNum++,
            item_id: line.item_id,
            item_code: line.item_code,
            description: line.description,
            qty: qtyToCredit,
            unit: line.unit,
            unit_price: line.unit_price,
            tax_rate: line.tax_rate,
            tax_total: lineTax,
            line_total: lineTotal,
          });

          subtotal += lineTotal;
          taxTotal += lineTax;
        }
      }

      if (creditLines.length === 0) {
        toast.error('No hay líneas para abonar');
        return null;
      }

      // Crear abono
      const { data: newCN, error: cnError } = await supabase
        .from('sales_credit_notes')
        .insert([{
          company_id: currentCompany.id,
          invoice_id: invoiceId,
          customer_id: invoice.customer_id,
          customer_name: invoice.customer_name,
          customer_tax_id: invoice.customer_tax_id,
          customer_address: invoice.customer_address,
          date: new Date().toISOString().split('T')[0],
          reason,
          status: 'draft',
          currency: invoice.currency,
          subtotal,
          tax_total: taxTotal,
          total: subtotal + taxTotal,
          created_by: user.id,
        }])
        .select()
        .single();

      if (cnError) throw cnError;

      // Crear líneas
      const cnLines = creditLines.map(line => ({
        ...line,
        credit_note_id: newCN.id,
      }));

      await supabase.from('sales_credit_note_lines').insert(cnLines);

      await supabase.from('sales_document_links').insert([{
        source_type: 'invoice',
        source_id: invoiceId,
        target_type: 'credit_note',
        target_id: newCN.id,
      }]);

      await logSalesAudit('CREDIT_NOTE_CREATED', 'credit_note', newCN.id, null, { from_invoice: invoiceId });

      toast.success('Abono creado');
      return newCN as SalesCreditNote;
    } catch (err) {
      console.error('[useERPSales] createCreditNote error:', err);
      toast.error('Error al crear abono');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, user, fetchInvoiceWithLines]);

  // ===================== VENCIMIENTOS =====================

  const fetchReceivables = useCallback(async (filters?: {
    status?: string;
    customerId?: string;
    overdue?: boolean;
  }): Promise<Receivable[]> => {
    if (!currentCompany) return [];
    
    try {
      let query = supabase
        .from('receivables')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('due_date', { ascending: true });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.customerId) query = query.eq('customer_id', filters.customerId);
      if (filters?.overdue) query = query.lt('due_date', new Date().toISOString().split('T')[0]);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Receivable[];
    } catch (err) {
      console.error('[useERPSales] fetchReceivables error:', err);
      return [];
    }
  }, [currentCompany]);

  // ===================== CONTROL DE CRÉDITO =====================

  const checkCustomerCredit = useCallback(async (
    customerId: string,
    amount: number
  ): Promise<CreditCheckResult | null> => {
    if (!currentCompany) return null;

    try {
      const { data, error } = await supabase.rpc('check_customer_credit', {
        p_company_id: currentCompany.id,
        p_customer_id: customerId,
        p_amount: amount,
      });

      if (error) {
        console.warn('[useERPSales] checkCustomerCredit RPC error (function may not exist):', error);
        return null;
      }

      return data as unknown as CreditCheckResult;
    } catch (err) {
      console.error('[useERPSales] checkCustomerCredit error:', err);
      return null;
    }
  }, [currentCompany]);

  // ===================== AUDITORÍA =====================

  const logSalesAudit = async (
    action: string,
    documentType: string,
    documentId: string,
    oldData: unknown,
    newData: unknown
  ) => {
    if (!currentCompany || !user) return;

    try {
      await supabase.from('sales_audit_events').insert([{
        company_id: currentCompany.id,
        document_type: documentType,
        document_id: documentId,
        action,
        old_data: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
        new_data: newData ? JSON.parse(JSON.stringify(newData)) : null,
        user_id: user.id,
      }]);
    } catch (err) {
      console.error('[useERPSales] logSalesAudit error:', err);
    }
  };

  return {
    isLoading,
    // Presupuestos
    fetchQuotes,
    fetchQuoteWithLines,
    createQuote,
    updateQuote,
    // Pedidos
    fetchOrders,
    fetchOrderWithLines,
    createOrder,
    convertQuoteToOrder,
    confirmOrder,
    // Albaranes
    fetchDeliveryNotes,
    convertOrderToDeliveryNote,
    createDeliveryNote,
    // Facturas
    fetchInvoices,
    fetchInvoiceWithLines,
    invoiceDeliveryNotes,
    confirmInvoice,
    createInvoice,
    // Abonos
    fetchCreditNotes,
    createCreditNote,
    createCreditNoteDirect,
    // Vencimientos
    fetchReceivables,
    // Control de crédito
    checkCustomerCredit,
  };
}

export default useERPSales;
