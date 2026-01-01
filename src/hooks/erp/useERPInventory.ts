/**
 * useERPInventory Hook
 * Módulo de Almacén ERP
 * Stock, Movimientos, Inventarios, Transferencias, Lotes/Series
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from './useERPContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Types
export interface Warehouse {
  id: string;
  company_id: string;
  code: string;
  name: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WarehouseLocation {
  id: string;
  warehouse_id: string;
  code: string;
  name?: string;
  zone?: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  is_active: boolean;
  created_at: string;
}

export interface WarehouseStock {
  id: string;
  company_id: string;
  warehouse_id: string;
  warehouse_name?: string;
  location_id?: string;
  location_code?: string;
  item_id: string;
  item_code?: string;
  item_name?: string;
  quantity: number;
  reserved_qty: number;
  available_qty: number;
  avg_cost: number;
  last_movement_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  company_id: string;
  warehouse_id: string;
  warehouse_name?: string;
  location_id?: string;
  item_id: string;
  item_code?: string;
  item_name?: string;
  movement_type: 'in' | 'out' | 'transfer' | 'adjustment' | 'initial';
  quantity: number;
  unit_cost: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  movement_date: string;
  created_by?: string;
  created_at: string;
}

export interface InventoryCount {
  id: string;
  company_id: string;
  warehouse_id: string;
  warehouse_name?: string;
  count_date: string;
  status: 'open' | 'counting' | 'review' | 'closed' | 'cancelled';
  notes?: string;
  created_by?: string;
  closed_at?: string;
  closed_by?: string;
  created_at: string;
  updated_at: string;
  lines?: InventoryCountLine[];
}

export interface InventoryCountLine {
  id: string;
  count_id: string;
  item_id: string;
  item_code?: string;
  item_name?: string;
  location_id?: string;
  system_qty: number;
  counted_qty?: number;
  difference: number;
  notes?: string;
  counted_by?: string;
  counted_at?: string;
  created_at: string;
}

export interface StockTransfer {
  id: string;
  company_id: string;
  series_id?: string;
  document_number?: string;
  from_warehouse_id: string;
  from_warehouse_name?: string;
  to_warehouse_id: string;
  to_warehouse_name?: string;
  transfer_date: string;
  status: 'draft' | 'in_transit' | 'received' | 'cancelled';
  notes?: string;
  created_by?: string;
  shipped_at?: string;
  received_at?: string;
  received_by?: string;
  created_at: string;
  updated_at: string;
  lines?: StockTransferLine[];
}

export interface StockTransferLine {
  id: string;
  transfer_id: string;
  item_id: string;
  item_code?: string;
  item_name?: string;
  from_location_id?: string;
  to_location_id?: string;
  quantity: number;
  received_qty: number;
  created_at: string;
}

export interface Lot {
  id: string;
  company_id: string;
  item_id: string;
  item_code?: string;
  item_name?: string;
  lot_number: string;
  expiration_date?: string;
  manufacturing_date?: string;
  supplier_lot?: string;
  notes?: string;
  is_blocked: boolean;
  created_at: string;
}

export interface Serial {
  id: string;
  company_id: string;
  item_id: string;
  item_code?: string;
  item_name?: string;
  serial_number: string;
  lot_id?: string;
  status: 'available' | 'reserved' | 'sold' | 'returned' | 'scrapped';
  warehouse_id?: string;
  location_id?: string;
  notes?: string;
  created_at: string;
}

export function useERPInventory() {
  const { currentCompany } = useERPContext();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // ===================== ALMACENES =====================

  const fetchWarehouses = useCallback(async (filters?: {
    isActive?: boolean;
  }): Promise<Warehouse[]> => {
    if (!currentCompany) return [];
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('erp_warehouses')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('name');

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Warehouse[];
    } catch (err) {
      console.error('[useERPInventory] fetchWarehouses error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  const createWarehouse = useCallback(async (
    warehouse: Omit<Warehouse, 'id' | 'company_id' | 'created_at' | 'updated_at'>
  ): Promise<Warehouse | null> => {
    if (!currentCompany) return null;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('erp_warehouses')
        .insert([{ ...warehouse, company_id: currentCompany.id }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Almacén creado');
      return data as Warehouse;
    } catch (err) {
      console.error('[useERPInventory] createWarehouse error:', err);
      toast.error('Error al crear almacén');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  const fetchLocations = useCallback(async (warehouseId: string): Promise<WarehouseLocation[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('erp_warehouse_locations')
        .select('*')
        .eq('warehouse_id', warehouseId)
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      return (data || []) as WarehouseLocation[];
    } catch (err) {
      console.error('[useERPInventory] fetchLocations error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===================== STOCK =====================

  const fetchStock = useCallback(async (filters?: {
    warehouseId?: string;
    itemId?: string;
    onlyWithStock?: boolean;
  }): Promise<WarehouseStock[]> => {
    if (!currentCompany) return [];
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('erp_warehouse_stock')
        .select(`
          *,
          warehouse:erp_warehouses(name, code),
          location:erp_warehouse_locations(code),
          item:erp_items(code, name)
        `)
        .eq('company_id', currentCompany.id)
        .order('item_id');

      if (filters?.warehouseId) query = query.eq('warehouse_id', filters.warehouseId);
      if (filters?.itemId) query = query.eq('item_id', filters.itemId);
      if (filters?.onlyWithStock) query = query.gt('quantity', 0);

      const { data, error } = await query.limit(500);
      if (error) throw error;
      
      return (data || []).map((s: Record<string, unknown>) => ({
        ...s,
        warehouse_name: (s.warehouse as { name?: string } | null)?.name || '',
        location_code: (s.location as { code?: string } | null)?.code || '',
        item_code: (s.item as { code?: string } | null)?.code || '',
        item_name: (s.item as { name?: string } | null)?.name || '',
      })) as WarehouseStock[];
    } catch (err) {
      console.error('[useERPInventory] fetchStock error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  // ===================== MOVIMIENTOS =====================

  const fetchMovements = useCallback(async (filters?: {
    warehouseId?: string;
    itemId?: string;
    movementType?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<StockMovement[]> => {
    if (!currentCompany) return [];
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('erp_stock_movements')
        .select(`
          *,
          warehouse:erp_warehouses(name),
          item:erp_items(code, name)
        `)
        .eq('company_id', currentCompany.id)
        .order('movement_date', { ascending: false });

      if (filters?.warehouseId) query = query.eq('warehouse_id', filters.warehouseId);
      if (filters?.itemId) query = query.eq('item_id', filters.itemId);
      if (filters?.movementType) query = query.eq('movement_type', filters.movementType);
      if (filters?.dateFrom) query = query.gte('movement_date', filters.dateFrom);
      if (filters?.dateTo) query = query.lte('movement_date', filters.dateTo);

      const { data, error } = await query.limit(200);
      if (error) throw error;
      
      return (data || []).map((m: Record<string, unknown>) => ({
        ...m,
        warehouse_name: (m.warehouse as { name?: string } | null)?.name || '',
        item_code: (m.item as { code?: string } | null)?.code || '',
        item_name: (m.item as { name?: string } | null)?.name || '',
      })) as StockMovement[];
    } catch (err) {
      console.error('[useERPInventory] fetchMovements error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  const createMovement = useCallback(async (
    movement: Omit<StockMovement, 'id' | 'company_id' | 'created_at'>
  ): Promise<StockMovement | null> => {
    if (!currentCompany || !user) return null;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('erp_stock_movements')
        .insert([{
          ...movement,
          company_id: currentCompany.id,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      // Actualizar stock
      await updateStockFromMovement(movement);

      toast.success('Movimiento registrado');
      return data as StockMovement;
    } catch (err) {
      console.error('[useERPInventory] createMovement error:', err);
      toast.error('Error al registrar movimiento');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, user]);

  const updateStockFromMovement = async (movement: Partial<StockMovement>) => {
    if (!currentCompany || !movement.warehouse_id || !movement.item_id) return;

    const qty = movement.movement_type === 'out' 
      ? -(movement.quantity || 0)
      : (movement.quantity || 0);

    // Buscar registro de stock existente
    const { data: existing } = await supabase
      .from('erp_warehouse_stock')
      .select('id, quantity')
      .eq('warehouse_id', movement.warehouse_id)
      .eq('item_id', movement.item_id)
      .eq('location_id', movement.location_id || null)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('erp_warehouse_stock')
        .update({
          quantity: existing.quantity + qty,
          last_movement_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('erp_warehouse_stock')
        .insert([{
          company_id: currentCompany.id,
          warehouse_id: movement.warehouse_id,
          location_id: movement.location_id,
          item_id: movement.item_id,
          quantity: qty,
          avg_cost: movement.unit_cost || 0,
          last_movement_at: new Date().toISOString(),
        }]);
    }
  };

  // ===================== INVENTARIOS =====================

  const fetchInventoryCounts = useCallback(async (filters?: {
    status?: string;
    warehouseId?: string;
  }): Promise<InventoryCount[]> => {
    if (!currentCompany) return [];
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('erp_inventory_counts')
        .select(`
          *,
          warehouse:erp_warehouses(name)
        `)
        .eq('company_id', currentCompany.id)
        .order('count_date', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.warehouseId) query = query.eq('warehouse_id', filters.warehouseId);

      const { data, error } = await query.limit(50);
      if (error) throw error;
      
      return (data || []).map((ic: Record<string, unknown>) => ({
        ...ic,
        warehouse_name: (ic.warehouse as { name?: string } | null)?.name || '',
      })) as InventoryCount[];
    } catch (err) {
      console.error('[useERPInventory] fetchInventoryCounts error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  const createInventoryCount = useCallback(async (
    count: Omit<InventoryCount, 'id' | 'company_id' | 'created_at' | 'updated_at'>
  ): Promise<InventoryCount | null> => {
    if (!currentCompany || !user) return null;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('erp_inventory_counts')
        .insert([{
          ...count,
          company_id: currentCompany.id,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Inventario creado');
      return data as InventoryCount;
    } catch (err) {
      console.error('[useERPInventory] createInventoryCount error:', err);
      toast.error('Error al crear inventario');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, user]);

  // ===================== TRANSFERENCIAS =====================

  const fetchTransfers = useCallback(async (filters?: {
    status?: string;
    fromWarehouseId?: string;
    toWarehouseId?: string;
  }): Promise<StockTransfer[]> => {
    if (!currentCompany) return [];
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('erp_stock_transfers')
        .select(`
          *,
          from_warehouse:erp_warehouses!erp_stock_transfers_from_warehouse_id_fkey(name),
          to_warehouse:erp_warehouses!erp_stock_transfers_to_warehouse_id_fkey(name)
        `)
        .eq('company_id', currentCompany.id)
        .order('transfer_date', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.fromWarehouseId) query = query.eq('from_warehouse_id', filters.fromWarehouseId);
      if (filters?.toWarehouseId) query = query.eq('to_warehouse_id', filters.toWarehouseId);

      const { data, error } = await query.limit(100);
      if (error) throw error;
      
      return (data || []).map((t: Record<string, unknown>) => ({
        ...t,
        from_warehouse_name: (t.from_warehouse as { name?: string } | null)?.name || '',
        to_warehouse_name: (t.to_warehouse as { name?: string } | null)?.name || '',
      })) as StockTransfer[];
    } catch (err) {
      console.error('[useERPInventory] fetchTransfers error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  const createTransfer = useCallback(async (
    transfer: Omit<StockTransfer, 'id' | 'company_id' | 'created_at' | 'updated_at'>,
    lines: Omit<StockTransferLine, 'id' | 'transfer_id' | 'created_at'>[]
  ): Promise<StockTransfer | null> => {
    if (!currentCompany || !user) return null;

    setIsLoading(true);
    try {
      const { data: newTransfer, error: transferError } = await supabase
        .from('erp_stock_transfers')
        .insert([{
          ...transfer,
          company_id: currentCompany.id,
          created_by: user.id,
        }])
        .select()
        .single();

      if (transferError) throw transferError;

      if (lines.length > 0) {
        const linesToInsert = lines.map((line) => ({
          ...line,
          transfer_id: newTransfer.id,
        }));

        const { error: linesError } = await supabase
          .from('erp_stock_transfer_lines')
          .insert(linesToInsert);

        if (linesError) throw linesError;
      }

      toast.success('Transferencia creada');
      return newTransfer as StockTransfer;
    } catch (err) {
      console.error('[useERPInventory] createTransfer error:', err);
      toast.error('Error al crear transferencia');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, user]);

  // ===================== LOTES Y SERIES =====================

  const fetchLots = useCallback(async (filters?: {
    itemId?: string;
    isBlocked?: boolean;
  }): Promise<Lot[]> => {
    if (!currentCompany) return [];
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('erp_lots')
        .select(`
          *,
          item:erp_items(code, name)
        `)
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (filters?.itemId) query = query.eq('item_id', filters.itemId);
      if (filters?.isBlocked !== undefined) query = query.eq('is_blocked', filters.isBlocked);

      const { data, error } = await query.limit(200);
      if (error) throw error;
      
      return (data || []).map((l: Record<string, unknown>) => ({
        ...l,
        item_code: (l.item as { code?: string } | null)?.code || '',
        item_name: (l.item as { name?: string } | null)?.name || '',
      })) as Lot[];
    } catch (err) {
      console.error('[useERPInventory] fetchLots error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  const fetchSerials = useCallback(async (filters?: {
    itemId?: string;
    status?: string;
    warehouseId?: string;
  }): Promise<Serial[]> => {
    if (!currentCompany) return [];
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('erp_serials')
        .select(`
          *,
          item:erp_items(code, name)
        `)
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (filters?.itemId) query = query.eq('item_id', filters.itemId);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.warehouseId) query = query.eq('warehouse_id', filters.warehouseId);

      const { data, error } = await query.limit(200);
      if (error) throw error;
      
      return (data || []).map((s: Record<string, unknown>) => ({
        ...s,
        item_code: (s.item as { code?: string } | null)?.code || '',
        item_name: (s.item as { name?: string } | null)?.name || '',
      })) as Serial[];
    } catch (err) {
      console.error('[useERPInventory] fetchSerials error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  return {
    isLoading,
    // Almacenes
    fetchWarehouses,
    createWarehouse,
    fetchLocations,
    // Stock
    fetchStock,
    // Movimientos
    fetchMovements,
    createMovement,
    // Inventarios
    fetchInventoryCounts,
    createInventoryCount,
    // Transferencias
    fetchTransfers,
    createTransfer,
    // Lotes y Series
    fetchLots,
    fetchSerials,
  };
}

export default useERPInventory;
