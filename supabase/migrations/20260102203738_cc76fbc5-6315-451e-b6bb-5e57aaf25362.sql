
-- ============================================
-- TABLAS MAESTRAS ERP (PRODUCTOS, IMPUESTOS, CLIENTES, PROVEEDORES)
-- ============================================

-- 1. Tabla de impuestos
CREATE TABLE IF NOT EXISTS erp_taxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  rate NUMERIC(5,2) NOT NULL,
  type TEXT DEFAULT 'vat' CHECK (type IN ('vat', 'withholding', 'other')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla de clientes
CREATE TABLE IF NOT EXISTS erp_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  code TEXT,
  name TEXT NOT NULL,
  tax_id TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'ES',
  iban TEXT,
  bic TEXT,
  payment_terms INTEGER DEFAULT 30,
  credit_limit NUMERIC(15,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla de proveedores
CREATE TABLE IF NOT EXISTS erp_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  code TEXT,
  name TEXT NOT NULL,
  tax_id TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'ES',
  iban TEXT,
  bic TEXT,
  payment_terms INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabla de productos/servicios
CREATE TABLE IF NOT EXISTS erp_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'product' CHECK (type IN ('product', 'service')),
  unit TEXT DEFAULT 'UN',
  sale_price NUMERIC(15,4),
  purchase_price NUMERIC(15,4),
  tax_id UUID REFERENCES erp_taxes(id),
  sales_account_id UUID REFERENCES erp_chart_accounts(id),
  purchase_account_id UUID REFERENCES erp_chart_accounts(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_erp_taxes_company ON erp_taxes(company_id);
CREATE INDEX IF NOT EXISTS idx_erp_customers_company ON erp_customers(company_id);
CREATE INDEX IF NOT EXISTS idx_erp_suppliers_company ON erp_suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_erp_products_company ON erp_products(company_id);

-- 6. RLS
ALTER TABLE erp_taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage taxes" ON erp_taxes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can manage customers" ON erp_customers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can manage suppliers" ON erp_suppliers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can manage products" ON erp_products
  FOR ALL USING (true) WITH CHECK (true);
