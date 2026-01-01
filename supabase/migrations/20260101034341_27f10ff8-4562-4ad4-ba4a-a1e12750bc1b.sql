-- ============================================================
-- ERP - MÓDULO COMPRAS Y ALMACÉN (Tablas principales)
-- ============================================================

-- ================== COMPRAS ==================

-- Pedidos de compra
CREATE TABLE IF NOT EXISTS erp_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  series_id UUID REFERENCES erp_series(id),
  document_number TEXT,
  supplier_id UUID REFERENCES erp_suppliers(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','confirmed','partial','received','cancelled')),
  currency TEXT DEFAULT 'EUR',
  exchange_rate NUMERIC(12,6) DEFAULT 1,
  subtotal NUMERIC(15,2) DEFAULT 0,
  tax_total NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Líneas pedido compra
CREATE TABLE IF NOT EXISTS erp_purchase_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES erp_purchase_orders(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  item_id UUID REFERENCES erp_items(id),
  description TEXT,
  quantity NUMERIC(15,4) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,4) DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 21,
  subtotal NUMERIC(15,2) DEFAULT 0,
  received_qty NUMERIC(15,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Albaranes de entrada (recepción mercancía)
CREATE TABLE IF NOT EXISTS erp_goods_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  series_id UUID REFERENCES erp_series(id),
  document_number TEXT,
  purchase_order_id UUID REFERENCES erp_purchase_orders(id),
  supplier_id UUID REFERENCES erp_suppliers(id),
  warehouse_id UUID REFERENCES erp_warehouses(id),
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','confirmed','cancelled')),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Líneas albarán entrada
CREATE TABLE IF NOT EXISTS erp_goods_receipt_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES erp_goods_receipts(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  order_line_id UUID REFERENCES erp_purchase_order_lines(id),
  item_id UUID REFERENCES erp_items(id),
  description TEXT,
  quantity NUMERIC(15,4) NOT NULL DEFAULT 1,
  location_id UUID REFERENCES erp_warehouse_locations(id),
  lot_number TEXT,
  serial_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Facturas proveedor
CREATE TABLE IF NOT EXISTS erp_supplier_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  series_id UUID REFERENCES erp_series(id),
  document_number TEXT,
  supplier_invoice_number TEXT,
  supplier_id UUID REFERENCES erp_suppliers(id),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  fiscal_year_id UUID REFERENCES erp_fiscal_years(id),
  period_id UUID REFERENCES erp_periods(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','posted','paid','cancelled')),
  currency TEXT DEFAULT 'EUR',
  exchange_rate NUMERIC(12,6) DEFAULT 1,
  subtotal NUMERIC(15,2) DEFAULT 0,
  tax_total NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Líneas factura proveedor
CREATE TABLE IF NOT EXISTS erp_supplier_invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES erp_supplier_invoices(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  goods_receipt_id UUID REFERENCES erp_goods_receipts(id),
  item_id UUID REFERENCES erp_items(id),
  description TEXT,
  quantity NUMERIC(15,4) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,4) DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 21,
  subtotal NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================== ALMACÉN ==================

-- Stock por almacén/ubicación
CREATE TABLE IF NOT EXISTS erp_warehouse_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES erp_warehouses(id) ON DELETE CASCADE,
  location_id UUID REFERENCES erp_warehouse_locations(id),
  item_id UUID NOT NULL REFERENCES erp_items(id) ON DELETE CASCADE,
  quantity NUMERIC(15,4) NOT NULL DEFAULT 0,
  reserved_qty NUMERIC(15,4) DEFAULT 0,
  available_qty NUMERIC(15,4) GENERATED ALWAYS AS (quantity - COALESCE(reserved_qty, 0)) STORED,
  avg_cost NUMERIC(15,4) DEFAULT 0,
  last_movement_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(warehouse_id, location_id, item_id)
);

-- Movimientos de stock
CREATE TABLE IF NOT EXISTS erp_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES erp_warehouses(id),
  location_id UUID REFERENCES erp_warehouse_locations(id),
  item_id UUID NOT NULL REFERENCES erp_items(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in','out','transfer','adjustment','initial')),
  quantity NUMERIC(15,4) NOT NULL,
  unit_cost NUMERIC(15,4) DEFAULT 0,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  movement_date TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inventarios físicos
CREATE TABLE IF NOT EXISTS erp_inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES erp_warehouses(id),
  count_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','counting','review','closed','cancelled')),
  notes TEXT,
  created_by UUID,
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Líneas inventario
CREATE TABLE IF NOT EXISTS erp_inventory_count_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id UUID NOT NULL REFERENCES erp_inventory_counts(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES erp_items(id),
  location_id UUID REFERENCES erp_warehouse_locations(id),
  system_qty NUMERIC(15,4) DEFAULT 0,
  counted_qty NUMERIC(15,4),
  difference NUMERIC(15,4) GENERATED ALWAYS AS (COALESCE(counted_qty, 0) - COALESCE(system_qty, 0)) STORED,
  notes TEXT,
  counted_by UUID,
  counted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transferencias entre almacenes
CREATE TABLE IF NOT EXISTS erp_stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  series_id UUID REFERENCES erp_series(id),
  document_number TEXT,
  from_warehouse_id UUID NOT NULL REFERENCES erp_warehouses(id),
  to_warehouse_id UUID NOT NULL REFERENCES erp_warehouses(id),
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','in_transit','received','cancelled')),
  notes TEXT,
  created_by UUID,
  shipped_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  received_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Líneas transferencia
CREATE TABLE IF NOT EXISTS erp_stock_transfer_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES erp_stock_transfers(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES erp_items(id),
  from_location_id UUID REFERENCES erp_warehouse_locations(id),
  to_location_id UUID REFERENCES erp_warehouse_locations(id),
  quantity NUMERIC(15,4) NOT NULL,
  received_qty NUMERIC(15,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lotes
CREATE TABLE IF NOT EXISTS erp_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES erp_items(id),
  lot_number TEXT NOT NULL,
  expiration_date DATE,
  manufacturing_date DATE,
  supplier_lot TEXT,
  notes TEXT,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, item_id, lot_number)
);

-- Números de serie
CREATE TABLE IF NOT EXISTS erp_serials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES erp_items(id),
  serial_number TEXT NOT NULL,
  lot_id UUID REFERENCES erp_lots(id),
  status TEXT DEFAULT 'available' CHECK (status IN ('available','reserved','sold','returned','scrapped')),
  warehouse_id UUID REFERENCES erp_warehouses(id),
  location_id UUID REFERENCES erp_warehouse_locations(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, item_id, serial_number)
);

-- ================== ÍNDICES ==================
CREATE INDEX IF NOT EXISTS idx_po_company ON erp_purchase_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON erp_purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON erp_purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_gr_company ON erp_goods_receipts(company_id);
CREATE INDEX IF NOT EXISTS idx_si_company ON erp_supplier_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_ws_warehouse_item ON erp_warehouse_stock(warehouse_id, item_id);
CREATE INDEX IF NOT EXISTS idx_sm_company ON erp_stock_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_sm_item ON erp_stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_lots_company ON erp_lots(company_id);
CREATE INDEX IF NOT EXISTS idx_serials_company ON erp_serials(company_id);

-- ================== RLS ==================
ALTER TABLE erp_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_purchase_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_goods_receipt_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_supplier_invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_warehouse_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_inventory_count_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_stock_transfer_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_serials ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (basadas en company_id del usuario)
CREATE POLICY "erp_purchase_orders_policy" ON erp_purchase_orders FOR ALL USING (
  EXISTS (SELECT 1 FROM erp_user_companies uc WHERE uc.company_id = erp_purchase_orders.company_id AND uc.user_id = auth.uid() AND uc.is_active = true)
);

CREATE POLICY "erp_purchase_order_lines_policy" ON erp_purchase_order_lines FOR ALL USING (
  EXISTS (SELECT 1 FROM erp_purchase_orders po JOIN erp_user_companies uc ON uc.company_id = po.company_id WHERE po.id = erp_purchase_order_lines.order_id AND uc.user_id = auth.uid() AND uc.is_active = true)
);

CREATE POLICY "erp_goods_receipts_policy" ON erp_goods_receipts FOR ALL USING (
  EXISTS (SELECT 1 FROM erp_user_companies uc WHERE uc.company_id = erp_goods_receipts.company_id AND uc.user_id = auth.uid() AND uc.is_active = true)
);

CREATE POLICY "erp_goods_receipt_lines_policy" ON erp_goods_receipt_lines FOR ALL USING (
  EXISTS (SELECT 1 FROM erp_goods_receipts gr JOIN erp_user_companies uc ON uc.company_id = gr.company_id WHERE gr.id = erp_goods_receipt_lines.receipt_id AND uc.user_id = auth.uid() AND uc.is_active = true)
);

CREATE POLICY "erp_supplier_invoices_policy" ON erp_supplier_invoices FOR ALL USING (
  EXISTS (SELECT 1 FROM erp_user_companies uc WHERE uc.company_id = erp_supplier_invoices.company_id AND uc.user_id = auth.uid() AND uc.is_active = true)
);

CREATE POLICY "erp_supplier_invoice_lines_policy" ON erp_supplier_invoice_lines FOR ALL USING (
  EXISTS (SELECT 1 FROM erp_supplier_invoices si JOIN erp_user_companies uc ON uc.company_id = si.company_id WHERE si.id = erp_supplier_invoice_lines.invoice_id AND uc.user_id = auth.uid() AND uc.is_active = true)
);

CREATE POLICY "erp_warehouse_stock_policy" ON erp_warehouse_stock FOR ALL USING (
  EXISTS (SELECT 1 FROM erp_user_companies uc WHERE uc.company_id = erp_warehouse_stock.company_id AND uc.user_id = auth.uid() AND uc.is_active = true)
);

CREATE POLICY "erp_stock_movements_policy" ON erp_stock_movements FOR ALL USING (
  EXISTS (SELECT 1 FROM erp_user_companies uc WHERE uc.company_id = erp_stock_movements.company_id AND uc.user_id = auth.uid() AND uc.is_active = true)
);

CREATE POLICY "erp_inventory_counts_policy" ON erp_inventory_counts FOR ALL USING (
  EXISTS (SELECT 1 FROM erp_user_companies uc WHERE uc.company_id = erp_inventory_counts.company_id AND uc.user_id = auth.uid() AND uc.is_active = true)
);

CREATE POLICY "erp_inventory_count_lines_policy" ON erp_inventory_count_lines FOR ALL USING (
  EXISTS (SELECT 1 FROM erp_inventory_counts ic JOIN erp_user_companies uc ON uc.company_id = ic.company_id WHERE ic.id = erp_inventory_count_lines.count_id AND uc.user_id = auth.uid() AND uc.is_active = true)
);

CREATE POLICY "erp_stock_transfers_policy" ON erp_stock_transfers FOR ALL USING (
  EXISTS (SELECT 1 FROM erp_user_companies uc WHERE uc.company_id = erp_stock_transfers.company_id AND uc.user_id = auth.uid() AND uc.is_active = true)
);

CREATE POLICY "erp_stock_transfer_lines_policy" ON erp_stock_transfer_lines FOR ALL USING (
  EXISTS (SELECT 1 FROM erp_stock_transfers st JOIN erp_user_companies uc ON uc.company_id = st.company_id WHERE st.id = erp_stock_transfer_lines.transfer_id AND uc.user_id = auth.uid() AND uc.is_active = true)
);

CREATE POLICY "erp_lots_policy" ON erp_lots FOR ALL USING (
  EXISTS (SELECT 1 FROM erp_user_companies uc WHERE uc.company_id = erp_lots.company_id AND uc.user_id = auth.uid() AND uc.is_active = true)
);

CREATE POLICY "erp_serials_policy" ON erp_serials FOR ALL USING (
  EXISTS (SELECT 1 FROM erp_user_companies uc WHERE uc.company_id = erp_serials.company_id AND uc.user_id = auth.uid() AND uc.is_active = true)
);

-- ================== TRIGGERS ==================
DROP TRIGGER IF EXISTS tr_po_updated ON erp_purchase_orders;
CREATE TRIGGER tr_po_updated BEFORE UPDATE ON erp_purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_gr_updated ON erp_goods_receipts;
CREATE TRIGGER tr_gr_updated BEFORE UPDATE ON erp_goods_receipts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_si_updated ON erp_supplier_invoices;
CREATE TRIGGER tr_si_updated BEFORE UPDATE ON erp_supplier_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_ws_updated ON erp_warehouse_stock;
CREATE TRIGGER tr_ws_updated BEFORE UPDATE ON erp_warehouse_stock FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_ic_updated ON erp_inventory_counts;
CREATE TRIGGER tr_ic_updated BEFORE UPDATE ON erp_inventory_counts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_st_updated ON erp_stock_transfers;
CREATE TRIGGER tr_st_updated BEFORE UPDATE ON erp_stock_transfers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();