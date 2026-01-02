/**
 * Hook principal para el módulo Maestros ERP
 * Gestiona Clientes, Proveedores, Artículos, Impuestos, Listas de Precios, etc.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============= TIPOS =============

export interface Customer {
  id: string;
  company_id: string;
  code: string;
  legal_name: string;
  trade_name: string | null;
  tax_id: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  address_type: 'billing' | 'shipping';
  line1: string;
  line2: string | null;
  city: string | null;
  postal_code: string | null;
  region: string | null;
  country: string;
  is_default: boolean;
  created_at?: string;
}

export interface CustomerContact {
  id: string;
  customer_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  is_primary: boolean;
  created_at?: string;
}

export interface Supplier {
  id: string;
  company_id: string;
  code: string;
  legal_name: string;
  tax_id: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Item {
  id: string;
  company_id: string;
  sku: string;
  name: string;
  description: string | null;
  item_type: 'product' | 'service';
  family_id: string | null;
  unit: string;
  barcode: string | null;
  is_stocked: boolean;
  track_lots: boolean;
  track_serials: boolean;
  tax_id: string | null;
  cost_method: 'avg' | 'fifo' | 'lifo' | 'standard';
  standard_cost: number;
  sale_price: number;
  is_active: boolean;
  created_at: string;
}

export interface ItemFamily {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface Tax {
  id: string;
  company_id: string;
  name: string;
  tax_code: string | null;
  rate: number;
  type: string;
  is_default_sales: boolean;
  is_default_purchases: boolean;
  is_active: boolean;
}

export interface PaymentTerm {
  id: string;
  company_id: string;
  name: string;
  days: number;
  day_of_month: number | null;
  installments_json: any;
  is_default: boolean;
  is_active: boolean;
}

export interface PriceList {
  id: string;
  company_id: string;
  name: string;
  currency: string;
  is_default: boolean;
  is_active: boolean;
}

export interface Warehouse {
  id: string;
  company_id: string;
  code: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
}

export interface BankAccount {
  id: string;
  company_id: string;
  owner_type: 'company' | 'customer' | 'supplier';
  owner_id: string;
  iban: string;
  bic: string | null;
  bank_name: string | null;
  is_default: boolean;
  is_active: boolean;
}

export interface SepaMandate {
  id: string;
  company_id: string;
  customer_id: string;
  mandate_ref: string;
  signed_date: string;
  scheme: 'CORE' | 'B2B' | 'COR1';
  is_active: boolean;
}

export interface PriceCalculation {
  item_id: string;
  item_name: string;
  quantity: number;
  base_price: number;
  price_source: string;
  total_discount: number;
  discounts_applied: Array<{
    rule_id: string;
    rule_name: string;
    scope: string;
    discount: number;
  }>;
  unit_price: number;
  total_price: number;
  error?: string;
}

// ============= HOOK PRINCIPAL =============

export function useMaestros() {
  const { currentCompany } = useERPContext();
  const queryClient = useQueryClient();
  const companyId = currentCompany?.id;

  // ===== CUSTOMERS =====
  const customersQuery = useQuery({
    queryKey: ['customers', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('company_id', companyId)
        .order('legal_name');
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!companyId
  });

  const createCustomer = useMutation({
    mutationFn: async (customer: Partial<Customer>) => {
      if (!companyId) throw new Error('No company selected');
      const { data, error } = await supabase
        .from('customers')
        .insert([{ ...customer, company_id: companyId }] as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', companyId] });
      toast.success('Cliente creado correctamente');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const updateCustomer = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Customer> & { id: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', companyId] });
      toast.success('Cliente actualizado');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', companyId] });
      toast.success('Cliente eliminado');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  // ===== SUPPLIERS =====
  const suppliersQuery = useQuery({
    queryKey: ['suppliers', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('company_id', companyId)
        .order('legal_name');
      if (error) throw error;
      return data as Supplier[];
    },
    enabled: !!companyId
  });

  const createSupplier = useMutation({
    mutationFn: async (supplier: Partial<Supplier>) => {
      if (!companyId) throw new Error('No company selected');
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{ ...supplier, company_id: companyId }] as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', companyId] });
      toast.success('Proveedor creado correctamente');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Supplier> & { id: string }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', companyId] });
      toast.success('Proveedor actualizado');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', companyId] });
      toast.success('Proveedor eliminado');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  // ===== ITEMS =====
  const itemsQuery = useQuery({
    queryKey: ['items', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      if (error) throw error;
      return data as Item[];
    },
    enabled: !!companyId
  });

  const createItem = useMutation({
    mutationFn: async (item: Partial<Item>) => {
      if (!companyId) throw new Error('No company selected');
      const { data, error } = await supabase
        .from('items')
        .insert([{ ...item, company_id: companyId }] as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', companyId] });
      toast.success('Artículo creado correctamente');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Item> & { id: string }) => {
      const { data, error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', companyId] });
      toast.success('Artículo actualizado');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  // ===== ITEM FAMILIES =====
  const familiesQuery = useQuery({
    queryKey: ['item_families', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('item_families')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      if (error) throw error;
      return data as ItemFamily[];
    },
    enabled: !!companyId
  });

  const createFamily = useMutation({
    mutationFn: async (family: Partial<ItemFamily>) => {
      if (!companyId) throw new Error('No company selected');
      const { data, error } = await supabase
        .from('item_families')
        .insert([{ ...family, company_id: companyId }] as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item_families', companyId] });
      toast.success('Familia creada');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  // ===== TAXES =====
  const taxesQuery = useQuery({
    queryKey: ['taxes', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('taxes')
        .select('*')
        .eq('company_id', companyId)
        .order('rate', { ascending: false });
      if (error) throw error;
      return data as Tax[];
    },
    enabled: !!companyId
  });

  const createTax = useMutation({
    mutationFn: async (tax: Partial<Tax>) => {
      if (!companyId) throw new Error('No company selected');
      const { data, error } = await supabase
        .from('taxes')
        .insert([{ ...tax, company_id: companyId }] as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes', companyId] });
      toast.success('Impuesto creado');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  // ===== PAYMENT TERMS =====
  const paymentTermsQuery = useQuery({
    queryKey: ['payment_terms', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('payment_terms')
        .select('*')
        .eq('company_id', companyId)
        .order('days');
      if (error) throw error;
      return data as PaymentTerm[];
    },
    enabled: !!companyId
  });

  const createPaymentTerm = useMutation({
    mutationFn: async (term: Partial<PaymentTerm>) => {
      if (!companyId) throw new Error('No company selected');
      const { data, error } = await supabase
        .from('payment_terms')
        .insert([{ ...term, company_id: companyId }] as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_terms', companyId] });
      toast.success('Condición de pago creada');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  // ===== PRICE LISTS =====
  const priceListsQuery = useQuery({
    queryKey: ['price_lists', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('price_lists')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      if (error) throw error;
      return data as PriceList[];
    },
    enabled: !!companyId
  });

  // ===== WAREHOUSES =====
  const warehousesQuery = useQuery({
    queryKey: ['warehouses', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      if (error) throw error;
      return data as Warehouse[];
    },
    enabled: !!companyId
  });

  const createWarehouse = useMutation({
    mutationFn: async (warehouse: Partial<Warehouse>) => {
      if (!companyId) throw new Error('No company selected');
      const { data, error } = await supabase
        .from('warehouses')
        .insert([{ ...warehouse, company_id: companyId }] as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses', companyId] });
      toast.success('Almacén creado');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  // ===== BANK ACCOUNTS =====
  const bankAccountsQuery = useQuery({
    queryKey: ['bank_accounts', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('company_id', companyId)
        .order('bank_name');
      if (error) throw error;
      return data as BankAccount[];
    },
    enabled: !!companyId
  });

  // ===== SEPA MANDATES =====
  const sepaMandatesQuery = useQuery({
    queryKey: ['sepa_mandates', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('sepa_mandates')
        .select('*, customers(legal_name)')
        .eq('company_id', companyId)
        .order('signed_date', { ascending: false });
      if (error) throw error;
      return data as (SepaMandate & { customers: { legal_name: string } })[];
    },
    enabled: !!companyId
  });

  // ===== PRICE CALCULATOR =====
  const calculatePrice = useCallback(async (
    customerId: string | null,
    itemId: string,
    quantity: number
  ): Promise<PriceCalculation | null> => {
    if (!companyId) return null;
    
    const { data, error } = await supabase.rpc('calculate_price', {
      p_company_id: companyId,
      p_customer_id: customerId,
      p_item_id: itemId,
      p_qty: quantity,
      p_date: new Date().toISOString().split('T')[0]
    });
    
    if (error) {
      toast.error('Error calculando precio: ' + error.message);
      return null;
    }
    
    return data as unknown as PriceCalculation;
  }, [companyId]);

  // ===== SEED DATA =====
  const seedDefaultData = useCallback(async () => {
    if (!companyId) return;
    
    try {
      await supabase.rpc('seed_default_taxes', { p_company_id: companyId });
      await supabase.rpc('seed_default_payment_terms', { p_company_id: companyId });
      queryClient.invalidateQueries({ queryKey: ['taxes', companyId] });
      queryClient.invalidateQueries({ queryKey: ['payment_terms', companyId] });
      toast.success('Datos por defecto creados');
    } catch (e: any) {
      toast.error('Error creando datos: ' + e.message);
    }
  }, [companyId, queryClient]);

  return {
    // Customers
    customers: customersQuery.data ?? [],
    customersLoading: customersQuery.isLoading,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    
    // Suppliers
    suppliers: suppliersQuery.data ?? [],
    suppliersLoading: suppliersQuery.isLoading,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    
    // Items
    items: itemsQuery.data ?? [],
    itemsLoading: itemsQuery.isLoading,
    createItem,
    updateItem,
    
    // Families
    families: familiesQuery.data ?? [],
    familiesLoading: familiesQuery.isLoading,
    createFamily,
    
    // Taxes
    taxes: taxesQuery.data ?? [],
    taxesLoading: taxesQuery.isLoading,
    createTax,
    
    // Payment Terms
    paymentTerms: paymentTermsQuery.data ?? [],
    paymentTermsLoading: paymentTermsQuery.isLoading,
    createPaymentTerm,
    
    // Price Lists
    priceLists: priceListsQuery.data ?? [],
    priceListsLoading: priceListsQuery.isLoading,
    
    // Warehouses
    warehouses: warehousesQuery.data ?? [],
    warehousesLoading: warehousesQuery.isLoading,
    createWarehouse,
    
    // Bank Accounts
    bankAccounts: bankAccountsQuery.data ?? [],
    bankAccountsLoading: bankAccountsQuery.isLoading,
    
    // SEPA Mandates
    sepaMandates: sepaMandatesQuery.data ?? [],
    sepaMandatesLoading: sepaMandatesQuery.isLoading,
    
    // Utils
    calculatePrice,
    seedDefaultData,
    companyId
  };
}

export default useMaestros;
