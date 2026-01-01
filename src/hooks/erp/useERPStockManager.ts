/**
 * Hook para gestionar movimientos de stock en el ERP
 * - Entrada de compra incrementa stock
 * - Albarán de venta descuenta stock
 * - Inventario ajusta stock
 * - Recálculo reconstruye stock
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StockActionParams {
  company_id: string;
  warehouse_id: string;
  item_id: string;
  quantity: number;
  unit_cost?: number;
  reference_type?: string;
  reference_id?: string;
  lot_id?: string;
  serial_id?: string;
  notes?: string;
}

interface StockActionResult {
  success: boolean;
  action?: string;
  movement_id?: string;
  movement_type?: string;
  quantity_changed?: number;
  calculated_stock?: number;
  movements_count?: number;
  message?: string;
  error?: string;
}

export function useERPStockManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<StockActionResult | null>(null);

  /**
   * Incrementar stock (entrada de compra / albarán de recepción)
   */
  const incrementStock = useCallback(async (params: StockActionParams): Promise<StockActionResult> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('erp-stock-manager', {
        body: {
          action: 'increment',
          ...params,
          reference_type: params.reference_type || 'goods_receipt'
        }
      });

      if (error) throw error;

      const result = data as StockActionResult;
      setLastResult(result);

      if (result.success) {
        toast.success(`Stock incrementado: +${params.quantity} unidades`);
      } else {
        toast.error(result.error || 'Error al incrementar stock');
      }

      return result;
    } catch (err) {
      console.error('[useERPStockManager] incrementStock error:', err);
      const result: StockActionResult = { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      };
      setLastResult(result);
      toast.error('Error al incrementar stock');
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Decrementar stock (salida por venta / albarán de entrega)
   */
  const decrementStock = useCallback(async (params: StockActionParams): Promise<StockActionResult> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('erp-stock-manager', {
        body: {
          action: 'decrement',
          ...params,
          reference_type: params.reference_type || 'delivery_note'
        }
      });

      if (error) throw error;

      const result = data as StockActionResult;
      setLastResult(result);

      if (result.success) {
        toast.success(`Stock decrementado: -${params.quantity} unidades`);
      } else {
        toast.error(result.error || 'Error al decrementar stock');
      }

      return result;
    } catch (err) {
      console.error('[useERPStockManager] decrementStock error:', err);
      const result: StockActionResult = { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      };
      setLastResult(result);
      toast.error('Error al decrementar stock');
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Ajustar stock (inventario físico)
   * El quantity es el nuevo valor absoluto del stock
   */
  const adjustStock = useCallback(async (params: StockActionParams): Promise<StockActionResult> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('erp-stock-manager', {
        body: {
          action: 'adjust',
          ...params,
          reference_type: params.reference_type || 'inventory_count'
        }
      });

      if (error) throw error;

      const result = data as StockActionResult;
      setLastResult(result);

      if (result.success) {
        const diff = result.quantity_changed || 0;
        const diffText = diff >= 0 ? `+${diff}` : `${diff}`;
        toast.success(`Stock ajustado a ${params.quantity} unidades (${diffText})`);
      } else {
        toast.error(result.error || 'Error al ajustar stock');
      }

      return result;
    } catch (err) {
      console.error('[useERPStockManager] adjustStock error:', err);
      const result: StockActionResult = { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      };
      setLastResult(result);
      toast.error('Error al ajustar stock');
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Recalcular stock desde movimientos
   */
  const recalculateStock = useCallback(async (
    company_id: string,
    warehouse_id: string,
    item_id: string
  ): Promise<StockActionResult> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('erp-stock-manager', {
        body: {
          action: 'recalculate',
          company_id,
          warehouse_id,
          item_id,
          quantity: 0 // No aplica para recálculo
        }
      });

      if (error) throw error;

      const result = data as StockActionResult;
      setLastResult(result);

      if (result.success) {
        toast.success(`Stock recalculado: ${result.calculated_stock} unidades (${result.movements_count} movimientos)`);
      } else {
        toast.error(result.error || 'Error al recalcular stock');
      }

      return result;
    } catch (err) {
      console.error('[useERPStockManager] recalculateStock error:', err);
      const result: StockActionResult = { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      };
      setLastResult(result);
      toast.error('Error al recalcular stock');
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Recalcular todo el stock de un almacén
   */
  const recalculateWarehouseStock = useCallback(async (
    company_id: string,
    warehouse_id: string
  ): Promise<{ success: boolean; items_processed: number }> => {
    setIsLoading(true);
    try {
      // Obtener todos los items con movimientos en este almacén
      const { data: items, error: itemsError } = await supabase
        .from('erp_stock_movements')
        .select('item_id')
        .eq('company_id', company_id)
        .eq('warehouse_id', warehouse_id);

      if (itemsError) throw itemsError;

      // Obtener items únicos
      const uniqueItems = [...new Set(items?.map(i => i.item_id) || [])];

      // Recalcular cada item
      let processed = 0;
      for (const item_id of uniqueItems) {
        await recalculateStock(company_id, warehouse_id, item_id);
        processed++;
      }

      toast.success(`Recálculo completo: ${processed} artículos procesados`);
      return { success: true, items_processed: processed };
    } catch (err) {
      console.error('[useERPStockManager] recalculateWarehouseStock error:', err);
      toast.error('Error al recalcular stock del almacén');
      return { success: false, items_processed: 0 };
    } finally {
      setIsLoading(false);
    }
  }, [recalculateStock]);

  return {
    isLoading,
    lastResult,
    // Acciones principales
    incrementStock,
    decrementStock,
    adjustStock,
    recalculateStock,
    recalculateWarehouseStock
  };
}

export default useERPStockManager;
