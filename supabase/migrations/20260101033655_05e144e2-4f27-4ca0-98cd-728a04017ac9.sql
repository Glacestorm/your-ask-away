-- ============================================================
-- ERP - TABLAS BASE FALTANTES (Proveedores, Almacenes)
-- ============================================================

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_erp_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Proveedores
CREATE TABLE IF NOT EXISTS erp_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  code TEXT,
  name TEXT NOT NULL,
  legal_name TEXT,
  tax_id TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'ES',
  phone TEXT,
  email TEXT,
  website TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  payment_terms INTEGER DEFAULT 30,
  currency TEXT DEFAULT 'EUR',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Almacenes
CREATE TABLE IF NOT EXISTS erp_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'ES',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ubicaciones dentro del almacén
CREATE TABLE IF NOT EXISTS erp_warehouse_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES erp_warehouses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT,
  zone TEXT,
  aisle TEXT,
  rack TEXT,
  shelf TEXT,
  bin TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON erp_suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_company ON erp_warehouses(company_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_locations_warehouse ON erp_warehouse_locations(warehouse_id);

-- RLS
ALTER TABLE erp_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_warehouse_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "erp_suppliers_policy" ON erp_suppliers FOR ALL USING (
  EXISTS (SELECT 1 FROM erp_user_companies uc WHERE uc.company_id = erp_suppliers.company_id AND uc.user_id = auth.uid() AND uc.is_active = true)
);

CREATE POLICY "erp_warehouses_policy" ON erp_warehouses FOR ALL USING (
  EXISTS (SELECT 1 FROM erp_user_companies uc WHERE uc.company_id = erp_warehouses.company_id AND uc.user_id = auth.uid() AND uc.is_active = true)
);

CREATE POLICY "erp_warehouse_locations_policy" ON erp_warehouse_locations FOR ALL USING (
  EXISTS (SELECT 1 FROM erp_warehouses w JOIN erp_user_companies uc ON uc.company_id = w.company_id WHERE w.id = erp_warehouse_locations.warehouse_id AND uc.user_id = auth.uid() AND uc.is_active = true)
);

-- Triggers updated_at
DROP TRIGGER IF EXISTS tr_suppliers_updated ON erp_suppliers;
CREATE TRIGGER tr_suppliers_updated BEFORE UPDATE ON erp_suppliers FOR EACH ROW EXECUTE FUNCTION update_erp_timestamp();

DROP TRIGGER IF EXISTS tr_warehouses_updated ON erp_warehouses;
CREATE TRIGGER tr_warehouses_updated BEFORE UPDATE ON erp_warehouses FOR EACH ROW EXECUTE FUNCTION update_erp_timestamp();