-- Tabla de facturas de ObelixIA
CREATE TABLE public.obelixia_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  quote_id UUID REFERENCES public.customer_quotes(id),
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_company TEXT,
  customer_tax_id TEXT,
  customer_address TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 21,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  payment_date DATE,
  payment_method TEXT,
  notes TEXT,
  cover_letter TEXT,
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de contenidos gestionables
CREATE TABLE public.obelixia_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'html', 'json', 'image')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de precios de módulos (editable)
CREATE TABLE public.obelixia_module_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_key TEXT NOT NULL UNIQUE,
  module_name TEXT NOT NULL,
  base_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  perpetual_multiplier NUMERIC(4,2) DEFAULT 5,
  monthly_divisor NUMERIC(4,2) DEFAULT 10,
  min_discount NUMERIC(5,2) DEFAULT 0,
  max_discount NUMERIC(5,2) DEFAULT 30,
  category TEXT DEFAULT 'horizontal' CHECK (category IN ('core', 'horizontal', 'vertical', 'enterprise')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.obelixia_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_module_pricing ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (solo admins)
CREATE POLICY "Admins can manage invoices" ON public.obelixia_invoices
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin', 'director_comercial')
  ));

CREATE POLICY "Admins can manage content" ON public.obelixia_content
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin', 'director_comercial')
  ));

CREATE POLICY "Admins can manage pricing" ON public.obelixia_module_pricing
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin', 'director_comercial')
  ));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_obelixia_tables_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_obelixia_invoices_timestamp
  BEFORE UPDATE ON public.obelixia_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_obelixia_tables_timestamp();

CREATE TRIGGER update_obelixia_content_timestamp
  BEFORE UPDATE ON public.obelixia_content
  FOR EACH ROW EXECUTE FUNCTION public.update_obelixia_tables_timestamp();

CREATE TRIGGER update_obelixia_pricing_timestamp
  BEFORE UPDATE ON public.obelixia_module_pricing
  FOR EACH ROW EXECUTE FUNCTION public.update_obelixia_tables_timestamp();

-- Insertar precios iniciales de módulos
INSERT INTO public.obelixia_module_pricing (module_key, module_name, base_price, category, description) VALUES
  ('core', 'Core CRM', 39000, 'core', 'Módulo base requerido'),
  ('visits', 'Gestión de Visitas', 24000, 'horizontal', 'Planificación y seguimiento de visitas'),
  ('accounting', 'Contabilidad', 49000, 'horizontal', 'Gestión contable completa'),
  ('goals', 'Objetivos', 19000, 'horizontal', 'Gestión de objetivos y KPIs'),
  ('documentation', 'Documentación', 15000, 'horizontal', 'Gestión documental'),
  ('notifications', 'Notificaciones', 12000, 'horizontal', 'Sistema de alertas'),
  ('banking_ai', 'IA Bancaria Avanzada', 149000, 'enterprise', 'ML predictivo, scoring crediticio'),
  ('compliance_pro', 'Compliance Bancario Pro', 119000, 'enterprise', 'DORA, NIS2, PSD2, Basel III/IV'),
  ('open_banking', 'Open Banking API', 79000, 'enterprise', 'APIs FAPI, gestión TPP');

-- Secuencia para números de factura
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1000;