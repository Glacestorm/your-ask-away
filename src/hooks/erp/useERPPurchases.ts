/**
 * useERPPurchases Hook
 * Módulo de Compras ERP
 * Flujo: Pedido Compra → Albarán Entrada → Factura Proveedor
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from './useERPContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Types
export interface PurchaseOrder {
  id: string;
  company_id: string;
  series_id?: string;
  document_number?: string;
  supplier_id?: string;
  supplier_name?: string;
  order_date: string;
  expected_date?: string;
  status: 'draft' | 'confirmed' | 'partial' | 'received' | 'cancelled';
  currency: string;
  exchange_rate: number;
  subtotal: number;
  tax_total: number;
  total: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  lines?: PurchaseOrderLine[];
}

export interface PurchaseOrderLine {
  id: string;
  order_id: string;
  line_number: number;
  item_id?: string;
  item_code?: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
  subtotal: number;
  received_qty: number;
  created_at: string;
}

export interface GoodsReceipt {
  id: string;
  company_id: string;
  series_id?: string;
  document_number?: string;
  purchase_order_id?: string;
  supplier_id?: string;
  supplier_name?: string;
  warehouse_id?: string;
  warehouse_name?: string;
  receipt_date: string;
  status: 'draft' | 'confirmed' | 'cancelled';
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  lines?: GoodsReceiptLine[];
}

export interface GoodsReceiptLine {
  id: string;
  receipt_id: string;
  line_number: number;
  order_line_id?: string;
  item_id?: string;
  item_code?: string;
  description?: string;
  quantity: number;
  location_id?: string;
  lot_number?: string;
  serial_number?: string;
  created_at: string;
}

export interface SupplierInvoice {
  id: string;
  company_id: string;
  series_id?: string;
  document_number?: string;
  supplier_invoice_number?: string;
  supplier_id?: string;
  supplier_name?: string;
  invoice_date: string;
  due_date?: string;
  fiscal_year_id?: string;
  period_id?: string;
  status: 'draft' | 'posted' | 'paid' | 'cancelled';
  currency: string;
  exchange_rate: number;
  subtotal: number;
  tax_total: number;
  total: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  lines?: SupplierInvoiceLine[];
}

export interface SupplierInvoiceLine {
  id: string;
  invoice_id: string;
  line_number: number;
  goods_receipt_id?: string;
  item_id?: string;
  item_code?: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
  subtotal: number;
  created_at: string;
}

export interface Supplier {
  id: string;
  company_id: string;
  code?: string;
  name: string;
  legal_name?: string;
  tax_id?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  payment_terms: number;
  currency: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useERPPurchases() {
  const { currentCompany } = useERPContext();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // ===================== PROVEEDORES =====================

  const fetchSuppliers = useCallback(async (filters?: {
    isActive?: boolean;
    search?: string;
  }): Promise<Supplier[]> => {
    if (!currentCompany) return [];
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('erp_suppliers')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('name');

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,tax_id.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return (data || []) as Supplier[];
    } catch (err) {
      console.error('[useERPPurchases] fetchSuppliers error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  const createSupplier = useCallback(async (
    supplier: Omit<Supplier, 'id' | 'company_id' | 'created_at' | 'updated_at'>
  ): Promise<Supplier | null> => {
    if (!currentCompany) return null;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('erp_suppliers')
        .insert([{ ...supplier, company_id: currentCompany.id }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Proveedor creado');
      return data as Supplier;
    } catch (err) {
      console.error('[useERPPurchases] createSupplier error:', err);
      toast.error('Error al crear proveedor');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  // ===================== PEDIDOS DE COMPRA =====================

  const fetchPurchaseOrders = useCallback(async (filters?: {
    status?: string;
    supplierId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PurchaseOrder[]> => {
    if (!currentCompany) return [];
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('erp_purchase_orders')
        .select(`
          *,
          supplier:erp_suppliers(name)
        `)
        .eq('company_id', currentCompany.id)
        .order('order_date', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.supplierId) query = query.eq('supplier_id', filters.supplierId);
      if (filters?.dateFrom) query = query.gte('order_date', filters.dateFrom);
      if (filters?.dateTo) query = query.lte('order_date', filters.dateTo);

      const { data, error } = await query.limit(100);
      if (error) throw error;
      
      return (data || []).map((po: Record<string, unknown>) => ({
        ...po,
        supplier_name: (po.supplier as { name?: string } | null)?.name || '',
      })) as PurchaseOrder[];
    } catch (err) {
      console.error('[useERPPurchases] fetchPurchaseOrders error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  const fetchPurchaseOrderWithLines = useCallback(async (orderId: string): Promise<PurchaseOrder | null> => {
    try {
      const { data: order, error: orderError } = await supabase
        .from('erp_purchase_orders')
        .select(`*, supplier:erp_suppliers(name)`)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const { data: lines, error: linesError } = await supabase
        .from('erp_purchase_order_lines')
        .select(`*, item:erp_items(code, name)`)
        .eq('order_id', orderId)
        .order('line_number');

      if (linesError) throw linesError;

      return {
        ...(order as PurchaseOrder),
        supplier_name: (order.supplier as { name?: string } | null)?.name || '',
        lines: (lines || []).map((l: Record<string, unknown>) => ({
          ...l,
          item_code: (l.item as { code?: string } | null)?.code || '',
          description: l.description || (l.item as { name?: string } | null)?.name || '',
        })) as PurchaseOrderLine[],
      };
    } catch (err) {
      console.error('[useERPPurchases] fetchPurchaseOrderWithLines error:', err);
      return null;
    }
  }, []);

  const createPurchaseOrder = useCallback(async (
    order: Omit<PurchaseOrder, 'id' | 'company_id' | 'created_at' | 'updated_at'>,
    lines: Omit<PurchaseOrderLine, 'id' | 'order_id' | 'created_at'>[]
  ): Promise<PurchaseOrder | null> => {
    if (!currentCompany || !user) return null;

    setIsLoading(true);
    try {
      const { data: newOrder, error: orderError } = await supabase
        .from('erp_purchase_orders')
        .insert([{
          ...order,
          company_id: currentCompany.id,
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
        }));

        const { error: linesError } = await supabase
          .from('erp_purchase_order_lines')
          .insert(linesToInsert);

        if (linesError) throw linesError;
      }

      toast.success('Pedido de compra creado');
      return newOrder as PurchaseOrder;
    } catch (err) {
      console.error('[useERPPurchases] createPurchaseOrder error:', err);
      toast.error('Error al crear pedido de compra');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, user]);

  const updatePurchaseOrderStatus = useCallback(async (
    orderId: string,
    status: PurchaseOrder['status']
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('erp_purchase_orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      toast.success('Estado actualizado');
      return true;
    } catch (err) {
      console.error('[useERPPurchases] updatePurchaseOrderStatus error:', err);
      toast.error('Error al actualizar estado');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===================== ALBARANES DE ENTRADA =====================

  const fetchGoodsReceipts = useCallback(async (filters?: {
    status?: string;
    supplierId?: string;
    warehouseId?: string;
  }): Promise<GoodsReceipt[]> => {
    if (!currentCompany) return [];
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('erp_goods_receipts')
        .select(`
          *,
          supplier:erp_suppliers(name),
          warehouse:erp_warehouses(name)
        `)
        .eq('company_id', currentCompany.id)
        .order('receipt_date', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.supplierId) query = query.eq('supplier_id', filters.supplierId);
      if (filters?.warehouseId) query = query.eq('warehouse_id', filters.warehouseId);

      const { data, error } = await query.limit(100);
      if (error) throw error;
      
      return (data || []).map((gr: Record<string, unknown>) => ({
        ...gr,
        supplier_name: (gr.supplier as { name?: string } | null)?.name || '',
        warehouse_name: (gr.warehouse as { name?: string } | null)?.name || '',
      })) as GoodsReceipt[];
    } catch (err) {
      console.error('[useERPPurchases] fetchGoodsReceipts error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  const createGoodsReceipt = useCallback(async (
    receipt: Omit<GoodsReceipt, 'id' | 'company_id' | 'created_at' | 'updated_at'>,
    lines: Omit<GoodsReceiptLine, 'id' | 'receipt_id' | 'created_at'>[]
  ): Promise<GoodsReceipt | null> => {
    if (!currentCompany || !user) return null;

    setIsLoading(true);
    try {
      const { data: newReceipt, error: receiptError } = await supabase
        .from('erp_goods_receipts')
        .insert([{
          ...receipt,
          company_id: currentCompany.id,
          created_by: user.id,
        }])
        .select()
        .single();

      if (receiptError) throw receiptError;

      if (lines.length > 0) {
        const linesToInsert = lines.map((line, idx) => ({
          ...line,
          receipt_id: newReceipt.id,
          line_number: idx + 1,
        }));

        const { error: linesError } = await supabase
          .from('erp_goods_receipt_lines')
          .insert(linesToInsert);

        if (linesError) throw linesError;
      }

      toast.success('Albarán de entrada creado');
      return newReceipt as GoodsReceipt;
    } catch (err) {
      console.error('[useERPPurchases] createGoodsReceipt error:', err);
      toast.error('Error al crear albarán de entrada');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, user]);

  // ===================== FACTURAS PROVEEDOR =====================

  const fetchSupplierInvoices = useCallback(async (filters?: {
    status?: string;
    supplierId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<SupplierInvoice[]> => {
    if (!currentCompany) return [];
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('erp_supplier_invoices')
        .select(`
          *,
          supplier:erp_suppliers(name)
        `)
        .eq('company_id', currentCompany.id)
        .order('invoice_date', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.supplierId) query = query.eq('supplier_id', filters.supplierId);
      if (filters?.dateFrom) query = query.gte('invoice_date', filters.dateFrom);
      if (filters?.dateTo) query = query.lte('invoice_date', filters.dateTo);

      const { data, error } = await query.limit(100);
      if (error) throw error;
      
      return (data || []).map((inv: Record<string, unknown>) => ({
        ...inv,
        supplier_name: (inv.supplier as { name?: string } | null)?.name || '',
      })) as SupplierInvoice[];
    } catch (err) {
      console.error('[useERPPurchases] fetchSupplierInvoices error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  const createSupplierInvoice = useCallback(async (
    invoice: Omit<SupplierInvoice, 'id' | 'company_id' | 'created_at' | 'updated_at'>,
    lines: Omit<SupplierInvoiceLine, 'id' | 'invoice_id' | 'created_at'>[]
  ): Promise<SupplierInvoice | null> => {
    if (!currentCompany || !user) return null;

    setIsLoading(true);
    try {
      const { data: newInvoice, error: invoiceError } = await supabase
        .from('erp_supplier_invoices')
        .insert([{
          ...invoice,
          company_id: currentCompany.id,
          created_by: user.id,
        }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      if (lines.length > 0) {
        const linesToInsert = lines.map((line, idx) => ({
          ...line,
          invoice_id: newInvoice.id,
          line_number: idx + 1,
        }));

        const { error: linesError } = await supabase
          .from('erp_supplier_invoice_lines')
          .insert(linesToInsert);

        if (linesError) throw linesError;
      }

      toast.success('Factura de proveedor creada');
      return newInvoice as SupplierInvoice;
    } catch (err) {
      console.error('[useERPPurchases] createSupplierInvoice error:', err);
      toast.error('Error al crear factura de proveedor');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, user]);

  return {
    isLoading,
    // Proveedores
    fetchSuppliers,
    createSupplier,
    // Pedidos de compra
    fetchPurchaseOrders,
    fetchPurchaseOrderWithLines,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    // Albaranes de entrada
    fetchGoodsReceipts,
    createGoodsReceipt,
    // Facturas proveedor
    fetchSupplierInvoices,
    createSupplierInvoice,
  };
}

export default useERPPurchases;
