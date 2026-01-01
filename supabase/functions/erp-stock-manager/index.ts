import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StockAction {
  action: 'increment' | 'decrement' | 'adjust' | 'recalculate';
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
  performed_by?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: StockAction = await req.json();
    const { action, company_id, warehouse_id, item_id, quantity, unit_cost, reference_type, reference_id, lot_id, serial_id, notes, performed_by } = body;

    console.log(`[erp-stock-manager] Action: ${action}, Item: ${item_id}, Warehouse: ${warehouse_id}, Qty: ${quantity}`);

    // Validaciones básicas
    if (!action || !company_id || !warehouse_id || !item_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: action, company_id, warehouse_id, item_id' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === RECALCULATE: Reconstruir stock desde movimientos ===
    if (action === 'recalculate') {
      console.log(`[erp-stock-manager] Recalculating stock for item ${item_id} in warehouse ${warehouse_id}`);

      // Obtener todos los movimientos del item en el almacén
      const { data: movements, error: movError } = await supabase
        .from('erp_stock_movements')
        .select('movement_type, quantity')
        .eq('company_id', company_id)
        .eq('warehouse_id', warehouse_id)
        .eq('item_id', item_id);

      if (movError) {
        console.error('[erp-stock-manager] Error fetching movements:', movError);
        throw movError;
      }

      // Calcular stock total
      let totalStock = 0;
      for (const mov of movements || []) {
        if (['in', 'return_in', 'adjust_in', 'transfer_in'].includes(mov.movement_type)) {
          totalStock += Number(mov.quantity);
        } else if (['out', 'return_out', 'adjust_out', 'transfer_out'].includes(mov.movement_type)) {
          totalStock -= Number(mov.quantity);
        }
      }

      // Actualizar o crear registro de stock
      const { data: existingStock } = await supabase
        .from('erp_warehouse_stock')
        .select('id')
        .eq('company_id', company_id)
        .eq('warehouse_id', warehouse_id)
        .eq('item_id', item_id)
        .maybeSingle();

      if (existingStock) {
        const { error: updateError } = await supabase
          .from('erp_warehouse_stock')
          .update({ 
            quantity_available: Math.max(0, totalStock),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingStock.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('erp_warehouse_stock')
          .insert({
            company_id,
            warehouse_id,
            item_id,
            quantity_available: Math.max(0, totalStock),
            quantity_reserved: 0,
            reorder_point: 0,
            max_stock: 0
          });

        if (insertError) throw insertError;
      }

      console.log(`[erp-stock-manager] Stock recalculated: ${totalStock} units`);

      return new Response(JSON.stringify({
        success: true,
        action: 'recalculate',
        calculated_stock: totalStock,
        movements_count: movements?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === INCREMENT / DECREMENT / ADJUST ===
    if (!quantity || quantity <= 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Quantity must be greater than 0' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determinar tipo de movimiento
    let movement_type: string;
    let stockDelta: number;

    switch (action) {
      case 'increment':
        movement_type = reference_type === 'goods_receipt' ? 'in' : 'return_in';
        stockDelta = quantity;
        break;
      case 'decrement':
        movement_type = reference_type === 'delivery_note' ? 'out' : 'return_out';
        stockDelta = -quantity;
        break;
      case 'adjust':
        // Para ajuste, necesitamos saber el stock actual y calcular la diferencia
        const { data: currentStock } = await supabase
          .from('erp_warehouse_stock')
          .select('quantity_available')
          .eq('company_id', company_id)
          .eq('warehouse_id', warehouse_id)
          .eq('item_id', item_id)
          .maybeSingle();

        const currentQty = currentStock?.quantity_available || 0;
        const diff = quantity - currentQty;
        
        if (diff >= 0) {
          movement_type = 'adjust_in';
          stockDelta = diff;
        } else {
          movement_type = 'adjust_out';
          stockDelta = diff;
        }
        break;
      default:
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Invalid action: ${action}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // 1. Crear movimiento de stock
    const movementData: Record<string, unknown> = {
      company_id,
      warehouse_id,
      item_id,
      movement_type,
      quantity: Math.abs(action === 'adjust' ? stockDelta : quantity),
      unit_cost: unit_cost || 0,
      reference_type: reference_type || action,
      reference_id: reference_id || null,
      lot_id: lot_id || null,
      serial_id: serial_id || null,
      notes: notes || `Stock ${action}: ${quantity} units`,
      performed_by: performed_by || null
    };

    const { data: movement, error: movementError } = await supabase
      .from('erp_stock_movements')
      .insert(movementData)
      .select()
      .single();

    if (movementError) {
      console.error('[erp-stock-manager] Error creating movement:', movementError);
      throw movementError;
    }

    console.log(`[erp-stock-manager] Movement created: ${movement.id}, type: ${movement_type}`);

    // 2. Actualizar stock en almacén
    const { data: warehouseStock } = await supabase
      .from('erp_warehouse_stock')
      .select('id, quantity_available')
      .eq('company_id', company_id)
      .eq('warehouse_id', warehouse_id)
      .eq('item_id', item_id)
      .maybeSingle();

    if (warehouseStock) {
      // Actualizar existente
      let newQty: number;
      if (action === 'adjust') {
        newQty = quantity; // El adjust establece el valor absoluto
      } else {
        newQty = (warehouseStock.quantity_available || 0) + stockDelta;
      }

      const { error: updateError } = await supabase
        .from('erp_warehouse_stock')
        .update({ 
          quantity_available: Math.max(0, newQty),
          updated_at: new Date().toISOString()
        })
        .eq('id', warehouseStock.id);

      if (updateError) {
        console.error('[erp-stock-manager] Error updating stock:', updateError);
        throw updateError;
      }

      console.log(`[erp-stock-manager] Stock updated: ${warehouseStock.quantity_available} -> ${newQty}`);
    } else {
      // Crear nuevo registro de stock
      const { error: insertError } = await supabase
        .from('erp_warehouse_stock')
        .insert({
          company_id,
          warehouse_id,
          item_id,
          quantity_available: Math.max(0, action === 'adjust' ? quantity : stockDelta),
          quantity_reserved: 0,
          reorder_point: 0,
          max_stock: 0
        });

      if (insertError) {
        console.error('[erp-stock-manager] Error inserting stock:', insertError);
        throw insertError;
      }

      console.log(`[erp-stock-manager] New stock record created with qty: ${stockDelta}`);
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      movement_id: movement.id,
      movement_type,
      quantity_changed: action === 'adjust' ? stockDelta : (action === 'increment' ? quantity : -quantity),
      message: `Stock ${action}ed successfully`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-stock-manager] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
