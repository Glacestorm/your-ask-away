
-- ============================================
-- MÓDULO MAESTROS ERP - MIGRACIÓN COMPLETA
-- ============================================

-- 1) CONDICIONES DE PAGO (payment_terms)
CREATE TABLE IF NOT EXISTS public.payment_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  days INTEGER NOT NULL DEFAULT 0,
  day_of_month INTEGER,
  installments_json JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, name)
);

-- 2) IMPUESTOS (taxes)
CREATE TABLE IF NOT EXISTS public.taxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tax_code TEXT,
  rate NUMERIC(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
  type TEXT DEFAULT 'vat' CHECK (type IN ('vat', 'withholding', 'other')),
  is_default_sales BOOLEAN DEFAULT false,
  is_default_purchases BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, name)
);

-- 3) CLIENTES (customers)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  tax_id TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, code)
);

-- 4) DIRECCIONES DE CLIENTES
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL CHECK (address_type IN ('billing', 'shipping')),
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT,
  postal_code TEXT,
  region TEXT,
  country TEXT DEFAULT 'ES',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5) CONTACTOS DE CLIENTES
CREATE TABLE IF NOT EXISTS public.customer_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6) POLÍTICA DE CRÉDITO DE CLIENTES
CREATE TABLE IF NOT EXISTS public.customer_credit_policy (
  customer_id UUID PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  credit_limit NUMERIC(15,2) DEFAULT 0,
  block_on_overdue BOOLEAN DEFAULT true,
  allow_override_with_permission BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7) CONDICIONES DE PAGO DE CLIENTES
CREATE TABLE IF NOT EXISTS public.customer_payment (
  customer_id UUID PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  payment_terms_id UUID REFERENCES payment_terms(id),
  refundido_automatico BOOLEAN DEFAULT false,
  giro_day_of_week INTEGER CHECK (giro_day_of_week IS NULL OR (giro_day_of_week >= 1 AND giro_day_of_week <= 7)),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8) ENVÍOS DE CLIENTES
CREATE TABLE IF NOT EXISTS public.customer_shipping (
  customer_id UUID PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  portes_mode TEXT DEFAULT 'debidos' CHECK (portes_mode IN ('debidos', 'pagados')),
  free_shipping_threshold NUMERIC(15,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9) PROVEEDORES (suppliers)
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  tax_id TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, code)
);

-- 10) DIRECCIONES DE PROVEEDORES
CREATE TABLE IF NOT EXISTS public.supplier_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL CHECK (address_type IN ('billing', 'shipping')),
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT,
  postal_code TEXT,
  region TEXT,
  country TEXT DEFAULT 'ES',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11) CONTACTOS DE PROVEEDORES
CREATE TABLE IF NOT EXISTS public.supplier_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12) CONDICIONES DE PAGO DE PROVEEDORES
CREATE TABLE IF NOT EXISTS public.supplier_payment (
  supplier_id UUID PRIMARY KEY REFERENCES suppliers(id) ON DELETE CASCADE,
  payment_terms_id UUID REFERENCES payment_terms(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13) FAMILIAS DE ARTÍCULOS
CREATE TABLE IF NOT EXISTS public.item_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, name)
);

-- 14) ALMACENES
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, code)
);

-- 15) UBICACIONES DE ALMACÉN
CREATE TABLE IF NOT EXISTS public.warehouse_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(warehouse_id, code)
);

-- 16) ARTÍCULOS / SERVICIOS
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  item_type TEXT DEFAULT 'product' CHECK (item_type IN ('product', 'service')),
  family_id UUID REFERENCES item_families(id),
  unit TEXT DEFAULT 'UND',
  barcode TEXT,
  is_stocked BOOLEAN DEFAULT true,
  track_lots BOOLEAN DEFAULT false,
  track_serials BOOLEAN DEFAULT false,
  tax_id UUID REFERENCES taxes(id),
  cost_method TEXT DEFAULT 'avg' CHECK (cost_method IN ('avg', 'fifo', 'lifo', 'standard')),
  standard_cost NUMERIC(15,4) DEFAULT 0,
  sale_price NUMERIC(15,4) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, sku)
);

-- 17) CÓDIGOS DE BARRAS ADICIONALES
CREATE TABLE IF NOT EXISTS public.item_barcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL UNIQUE,
  barcode_type TEXT DEFAULT 'EAN13',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 18) LISTAS DE PRECIOS
CREATE TABLE IF NOT EXISTS public.price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  currency TEXT DEFAULT 'EUR',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, name)
);

-- 19) PRECIOS POR LISTA
CREATE TABLE IF NOT EXISTS public.price_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  price NUMERIC(15,4) NOT NULL,
  min_qty NUMERIC(15,4) DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(price_list_id, item_id, min_qty)
);

-- 20) REGLAS DE DESCUENTO
CREATE TABLE IF NOT EXISTS public.discount_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  scope TEXT NOT NULL CHECK (scope IN ('customer', 'family', 'item', 'global')),
  customer_id UUID REFERENCES customers(id),
  family_id UUID REFERENCES item_families(id),
  item_id UUID REFERENCES items(id),
  min_qty NUMERIC(15,4),
  discount_percent NUMERIC(5,2),
  discount_amount NUMERIC(15,4),
  valid_from DATE,
  valid_to DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 21) CUENTAS BANCARIAS
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('company', 'customer', 'supplier')),
  owner_id UUID NOT NULL,
  iban TEXT NOT NULL,
  bic TEXT,
  bank_name TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 22) MANDATOS SEPA
CREATE TABLE IF NOT EXISTS public.sepa_mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  mandate_ref TEXT NOT NULL,
  signed_date DATE NOT NULL,
  scheme TEXT DEFAULT 'CORE' CHECK (scheme IN ('CORE', 'B2B', 'COR1')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, mandate_ref)
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_items_company ON items(company_id);
CREATE INDEX IF NOT EXISTS idx_items_family ON items(family_id);
CREATE INDEX IF NOT EXISTS idx_items_sku ON items(company_id, sku);
CREATE INDEX IF NOT EXISTS idx_discount_rules_company ON discount_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_discount_rules_dates ON discount_rules(valid_from, valid_to);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE payment_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_credit_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_shipping ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sepa_mandates ENABLE ROW LEVEL SECURITY;

-- Políticas para tablas con company_id directo
CREATE POLICY "payment_terms_company_access" ON payment_terms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM erp_user_companies uc
      WHERE uc.company_id = payment_terms.company_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "taxes_company_access" ON taxes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM erp_user_companies uc
      WHERE uc.company_id = taxes.company_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "customers_company_access" ON customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM erp_user_companies uc
      WHERE uc.company_id = customers.company_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "customer_addresses_access" ON customer_addresses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM customers c
      JOIN erp_user_companies uc ON uc.company_id = c.company_id
      WHERE c.id = customer_addresses.customer_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "customer_contacts_access" ON customer_contacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM customers c
      JOIN erp_user_companies uc ON uc.company_id = c.company_id
      WHERE c.id = customer_contacts.customer_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "customer_credit_policy_access" ON customer_credit_policy
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM customers c
      JOIN erp_user_companies uc ON uc.company_id = c.company_id
      WHERE c.id = customer_credit_policy.customer_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "customer_payment_access" ON customer_payment
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM customers c
      JOIN erp_user_companies uc ON uc.company_id = c.company_id
      WHERE c.id = customer_payment.customer_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "customer_shipping_access" ON customer_shipping
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM customers c
      JOIN erp_user_companies uc ON uc.company_id = c.company_id
      WHERE c.id = customer_shipping.customer_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "suppliers_company_access" ON suppliers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM erp_user_companies uc
      WHERE uc.company_id = suppliers.company_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "supplier_addresses_access" ON supplier_addresses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM suppliers s
      JOIN erp_user_companies uc ON uc.company_id = s.company_id
      WHERE s.id = supplier_addresses.supplier_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "supplier_contacts_access" ON supplier_contacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM suppliers s
      JOIN erp_user_companies uc ON uc.company_id = s.company_id
      WHERE s.id = supplier_contacts.supplier_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "supplier_payment_access" ON supplier_payment
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM suppliers s
      JOIN erp_user_companies uc ON uc.company_id = s.company_id
      WHERE s.id = supplier_payment.supplier_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "item_families_company_access" ON item_families
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM erp_user_companies uc
      WHERE uc.company_id = item_families.company_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "warehouses_company_access" ON warehouses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM erp_user_companies uc
      WHERE uc.company_id = warehouses.company_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "warehouse_locations_access" ON warehouse_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM warehouses w
      JOIN erp_user_companies uc ON uc.company_id = w.company_id
      WHERE w.id = warehouse_locations.warehouse_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "items_company_access" ON items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM erp_user_companies uc
      WHERE uc.company_id = items.company_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "item_barcodes_access" ON item_barcodes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM items i
      JOIN erp_user_companies uc ON uc.company_id = i.company_id
      WHERE i.id = item_barcodes.item_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "price_lists_company_access" ON price_lists
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM erp_user_companies uc
      WHERE uc.company_id = price_lists.company_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "price_list_items_access" ON price_list_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM price_lists pl
      JOIN erp_user_companies uc ON uc.company_id = pl.company_id
      WHERE pl.id = price_list_items.price_list_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "discount_rules_company_access" ON discount_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM erp_user_companies uc
      WHERE uc.company_id = discount_rules.company_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "bank_accounts_company_access" ON bank_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM erp_user_companies uc
      WHERE uc.company_id = bank_accounts.company_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

CREATE POLICY "sepa_mandates_company_access" ON sepa_mandates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM erp_user_companies uc
      WHERE uc.company_id = sepa_mandates.company_id
      AND uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

-- ============================================
-- TRIGGERS DE AUDITORÍA
-- ============================================
CREATE TRIGGER payment_terms_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON payment_terms FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();
CREATE TRIGGER taxes_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON taxes FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();
CREATE TRIGGER customers_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON customers FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();
CREATE TRIGGER customer_addresses_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON customer_addresses FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();
CREATE TRIGGER customer_contacts_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON customer_contacts FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();
CREATE TRIGGER customer_credit_policy_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON customer_credit_policy FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();
CREATE TRIGGER customer_payment_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON customer_payment FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();
CREATE TRIGGER customer_shipping_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON customer_shipping FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();
CREATE TRIGGER suppliers_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON suppliers FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();
CREATE TRIGGER supplier_addresses_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON supplier_addresses FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();
CREATE TRIGGER supplier_contacts_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON supplier_contacts FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();
CREATE TRIGGER supplier_payment_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON supplier_payment FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();
CREATE TRIGGER item_families_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON item_families FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();
CREATE TRIGGER warehouses_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON warehouses FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();
CREATE TRIGGER warehouse_locations_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON warehouse_locations FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();
CREATE TRIGGER items_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON items FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();
CREATE TRIGGER item_barcodes_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON item_barcodes FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();
CREATE TRIGGER price_lists_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON price_lists FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();
CREATE TRIGGER price_list_items_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON price_list_items FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();
CREATE TRIGGER discount_rules_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON discount_rules FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();
CREATE TRIGGER bank_accounts_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();
CREATE TRIGGER sepa_mandates_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON sepa_mandates FOR EACH ROW EXECUTE FUNCTION erp_audit_trigger_fn();

-- ============================================
-- FUNCIÓN MOTOR DE PRECIOS
-- ============================================
CREATE OR REPLACE FUNCTION calculate_price(
  p_company_id UUID,
  p_customer_id UUID,
  p_item_id UUID,
  p_qty NUMERIC,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_base_price NUMERIC := 0;
  v_price_source TEXT := 'item';
  v_total_discount NUMERIC := 0;
  v_discount_details JSONB := '[]'::jsonb;
  v_rule RECORD;
  v_discount_amount NUMERIC;
  v_customer_family_id UUID;
BEGIN
  -- Obtener artículo
  SELECT * INTO v_item FROM items WHERE id = p_item_id AND company_id = p_company_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Item not found');
  END IF;
  
  -- Precio base del artículo
  v_base_price := COALESCE(v_item.sale_price, 0);
  
  -- Buscar en lista de precios por defecto
  SELECT pli.price INTO v_base_price
  FROM price_list_items pli
  JOIN price_lists pl ON pl.id = pli.price_list_id
  WHERE pl.company_id = p_company_id
    AND pl.is_default = true
    AND pl.is_active = true
    AND pli.item_id = p_item_id
    AND pli.min_qty <= p_qty
  ORDER BY pli.min_qty DESC
  LIMIT 1;
  
  IF FOUND THEN
    v_price_source := 'price_list';
  END IF;
  
  -- Obtener familia del cliente (si existe)
  SELECT family_id INTO v_customer_family_id FROM items WHERE id = p_item_id;
  
  -- Aplicar reglas de descuento por prioridad
  FOR v_rule IN
    SELECT * FROM discount_rules
    WHERE company_id = p_company_id
      AND is_active = true
      AND (valid_from IS NULL OR valid_from <= p_date)
      AND (valid_to IS NULL OR valid_to >= p_date)
      AND (min_qty IS NULL OR min_qty <= p_qty)
      AND (
        (scope = 'global') OR
        (scope = 'customer' AND customer_id = p_customer_id) OR
        (scope = 'family' AND family_id = v_customer_family_id) OR
        (scope = 'item' AND item_id = p_item_id)
      )
    ORDER BY priority DESC
  LOOP
    -- Calcular descuento
    IF v_rule.discount_percent IS NOT NULL THEN
      v_discount_amount := v_base_price * (v_rule.discount_percent / 100);
    ELSIF v_rule.discount_amount IS NOT NULL THEN
      v_discount_amount := v_rule.discount_amount;
    ELSE
      v_discount_amount := 0;
    END IF;
    
    IF v_discount_amount > 0 THEN
      v_total_discount := v_total_discount + v_discount_amount;
      v_discount_details := v_discount_details || jsonb_build_object(
        'rule_id', v_rule.id,
        'rule_name', v_rule.name,
        'scope', v_rule.scope,
        'discount', v_discount_amount
      );
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'item_id', p_item_id,
    'item_name', v_item.name,
    'quantity', p_qty,
    'base_price', v_base_price,
    'price_source', v_price_source,
    'total_discount', v_total_discount,
    'discounts_applied', v_discount_details,
    'unit_price', GREATEST(v_base_price - v_total_discount, 0),
    'total_price', GREATEST(v_base_price - v_total_discount, 0) * p_qty
  );
END;
$$;

-- ============================================
-- SEEDS: IMPUESTOS POR DEFECTO
-- ============================================
-- Se insertarán al crear empresa mediante función
CREATE OR REPLACE FUNCTION seed_default_taxes(p_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO taxes (company_id, name, tax_code, rate, type, is_default_sales, is_default_purchases) VALUES
    (p_company_id, 'IVA 21%', 'IVA21', 21.00, 'vat', true, true),
    (p_company_id, 'IVA 10%', 'IVA10', 10.00, 'vat', false, false),
    (p_company_id, 'IVA 4%', 'IVA4', 4.00, 'vat', false, false),
    (p_company_id, 'IVA 0%', 'IVA0', 0.00, 'vat', false, false),
    (p_company_id, 'Exento', 'EXENTO', 0.00, 'vat', false, false)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Seed condiciones de pago
CREATE OR REPLACE FUNCTION seed_default_payment_terms(p_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO payment_terms (company_id, name, days, is_default) VALUES
    (p_company_id, 'Contado', 0, true),
    (p_company_id, '30 días', 30, false),
    (p_company_id, '60 días', 60, false),
    (p_company_id, '90 días', 90, false),
    (p_company_id, 'Fin de mes + 30', 30, false),
    (p_company_id, 'Confirming 60', 60, false)
  ON CONFLICT DO NOTHING;
END;
$$;
