
-- ============================================
-- TABLAS DE FACTURAS ERP (VENTAS Y COMPRAS)
-- ============================================

-- 1. Tabla de facturas de venta
CREATE TABLE IF NOT EXISTS erp_sales_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES erp_customers(id),
  series_id UUID REFERENCES erp_series(id),
  invoice_number TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC(15,2) DEFAULT 0,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  exchange_rate NUMERIC(10,6) DEFAULT 1,
  payment_terms TEXT,
  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'posted', 'paid', 'cancelled')),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Líneas de factura de venta
CREATE TABLE IF NOT EXISTS erp_sales_invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES erp_sales_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES erp_products(id),
  description TEXT NOT NULL,
  quantity NUMERIC(15,4) DEFAULT 1,
  unit_price NUMERIC(15,4) NOT NULL,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  tax_id UUID REFERENCES erp_taxes(id),
  tax_percent NUMERIC(5,2) DEFAULT 0,
  line_total NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla de facturas de proveedor
CREATE TABLE IF NOT EXISTS erp_supplier_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES erp_suppliers(id),
  series_id UUID REFERENCES erp_series(id),
  invoice_number TEXT,
  supplier_invoice_ref TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC(15,2) DEFAULT 0,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  exchange_rate NUMERIC(10,6) DEFAULT 1,
  payment_terms TEXT,
  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'posted', 'paid', 'cancelled')),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Líneas de factura de proveedor
CREATE TABLE IF NOT EXISTS erp_supplier_invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES erp_supplier_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES erp_products(id),
  description TEXT NOT NULL,
  quantity NUMERIC(15,4) DEFAULT 1,
  unit_price NUMERIC(15,4) NOT NULL,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  tax_id UUID REFERENCES erp_taxes(id),
  tax_percent NUMERIC(5,2) DEFAULT 0,
  line_total NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_sales_invoices_company ON erp_sales_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON erp_sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_date ON erp_sales_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON erp_sales_invoices(status);

CREATE INDEX IF NOT EXISTS idx_supplier_invoices_company ON erp_supplier_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_supplier ON erp_supplier_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_date ON erp_supplier_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_status ON erp_supplier_invoices(status);

-- 6. RLS
ALTER TABLE erp_sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_sales_invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_supplier_invoice_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage sales invoices" ON erp_sales_invoices
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can manage sales invoice lines" ON erp_sales_invoice_lines
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can manage supplier invoices" ON erp_supplier_invoices
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can manage supplier invoice lines" ON erp_supplier_invoice_lines
  FOR ALL USING (true) WITH CHECK (true);

-- 7. Triggers de updated_at
CREATE TRIGGER update_erp_sales_invoices_updated_at
  BEFORE UPDATE ON erp_sales_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_erp_supplier_invoices_updated_at
  BEFORE UPDATE ON erp_supplier_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
