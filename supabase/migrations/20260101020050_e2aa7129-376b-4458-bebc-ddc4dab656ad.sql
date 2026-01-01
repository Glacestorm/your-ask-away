-- ===========================================
-- ERP MASTERS: Customers & Items for Sales
-- ===========================================

-- ============ CUSTOMERS (Clientes) ============
CREATE TABLE IF NOT EXISTS public.erp_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  code VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  tax_id VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(3) DEFAULT 'ES',
  phone VARCHAR(50),
  email VARCHAR(255),
  contact_person VARCHAR(255),
  payment_terms_days INTEGER DEFAULT 30,
  payment_method VARCHAR(50) DEFAULT 'transfer',
  default_series_id UUID REFERENCES public.erp_series(id),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customer credit policy
CREATE TABLE IF NOT EXISTS public.customer_credit_policy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.erp_customers(id) ON DELETE CASCADE,
  credit_limit DECIMAL(15,2) DEFAULT 0,
  block_on_overdue BOOLEAN DEFAULT true,
  allow_override BOOLEAN DEFAULT false,
  overdue_days_tolerance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id)
);

-- ============ ITEMS (Artículos) ============
CREATE TABLE IF NOT EXISTS public.erp_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  item_type VARCHAR(20) DEFAULT 'product', -- product, service
  unit VARCHAR(20) DEFAULT 'UND',
  default_price DECIMAL(15,4) DEFAULT 0,
  cost_price DECIMAL(15,4) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 21,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_erp_customers_company ON public.erp_customers(company_id);
CREATE INDEX IF NOT EXISTS idx_erp_customers_tax_id ON public.erp_customers(tax_id);
CREATE INDEX IF NOT EXISTS idx_erp_customers_name ON public.erp_customers(name);
CREATE INDEX IF NOT EXISTS idx_erp_items_company ON public.erp_items(company_id);
CREATE INDEX IF NOT EXISTS idx_erp_items_code ON public.erp_items(company_id, code);
CREATE INDEX IF NOT EXISTS idx_customer_credit_policy_customer ON public.customer_credit_policy(customer_id);

-- ============ RLS ============
ALTER TABLE public.erp_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_credit_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_items ENABLE ROW LEVEL SECURITY;

-- Customers policies
CREATE POLICY "erp_customers_select" ON public.erp_customers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_customers_insert" ON public.erp_customers
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "erp_customers_update" ON public.erp_customers
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "erp_customers_delete" ON public.erp_customers
  FOR DELETE TO authenticated USING (true);

-- Credit policy policies
CREATE POLICY "credit_policy_select" ON public.customer_credit_policy
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "credit_policy_insert" ON public.customer_credit_policy
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "credit_policy_update" ON public.customer_credit_policy
  FOR UPDATE TO authenticated USING (true);

-- Items policies
CREATE POLICY "erp_items_select" ON public.erp_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_items_insert" ON public.erp_items
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "erp_items_update" ON public.erp_items
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "erp_items_delete" ON public.erp_items
  FOR DELETE TO authenticated USING (true);

-- ============ TRIGGERS ============
CREATE TRIGGER update_erp_customers_updated_at
  BEFORE UPDATE ON public.erp_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_credit_policy_updated_at
  BEFORE UPDATE ON public.customer_credit_policy
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_erp_items_updated_at
  BEFORE UPDATE ON public.erp_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SAMPLE DATA FOR TESTING ============
-- Insert sample customer (will use first company found)
INSERT INTO public.erp_customers (company_id, code, name, tax_id, email, payment_terms_days)
SELECT id, 'CLI001', 'Cliente Demo S.L.', 'B12345678', 'demo@cliente.es', 30
FROM public.erp_companies LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.erp_customers (company_id, code, name, tax_id, email, payment_terms_days)
SELECT id, 'CLI002', 'Empresa Prueba S.A.', 'A87654321', 'info@prueba.es', 60
FROM public.erp_companies LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert sample items
INSERT INTO public.erp_items (company_id, code, name, default_price, tax_rate, item_type)
SELECT id, 'ART001', 'Servicio de Consultoría', 150.00, 21, 'service'
FROM public.erp_companies LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.erp_items (company_id, code, name, default_price, tax_rate, item_type)
SELECT id, 'ART002', 'Licencia Software Anual', 1200.00, 21, 'service'
FROM public.erp_companies LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.erp_items (company_id, code, name, default_price, tax_rate, item_type)
SELECT id, 'ART003', 'Hardware Servidor', 2500.00, 21, 'product'
FROM public.erp_companies LIMIT 1
ON CONFLICT DO NOTHING;