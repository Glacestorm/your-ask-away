-- ================================================
-- ERP MODULAR - FASE 1: FUNDACIÓN
-- Multi-tenant, RBAC, Auditoría, Ejercicios/Series
-- ================================================

-- 1) ENUM para roles de app
DO $$ BEGIN
  CREATE TYPE public.erp_role_type AS ENUM ('superadmin', 'admin', 'manager', 'user', 'auditor', 'readonly');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2) GRUPOS DE EMPRESAS (Holdings)
CREATE TABLE IF NOT EXISTS public.erp_company_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.erp_company_groups ENABLE ROW LEVEL SECURITY;

-- 3) EMPRESAS (Multi-tenant core)
CREATE TABLE IF NOT EXISTS public.erp_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.erp_company_groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  legal_name TEXT,
  tax_id TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'ES',
  currency TEXT DEFAULT 'EUR',
  timezone TEXT DEFAULT 'Europe/Madrid',
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.erp_companies ENABLE ROW LEVEL SECURITY;

-- 4) RELACIÓN USUARIO-EMPRESA
CREATE TABLE IF NOT EXISTS public.erp_user_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  role_id UUID, -- Se enlazará con erp_roles
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, company_id)
);

ALTER TABLE public.erp_user_companies ENABLE ROW LEVEL SECURITY;

-- 5) PERMISOS GRANULARES
CREATE TABLE IF NOT EXISTS public.erp_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar permisos iniciales
INSERT INTO public.erp_permissions (key, module, action, description) VALUES
  ('admin.all', 'admin', 'all', 'Acceso total de administración'),
  ('masters.read', 'masters', 'read', 'Leer maestros'),
  ('masters.write', 'masters', 'write', 'Escribir maestros'),
  ('sales.read', 'sales', 'read', 'Leer ventas'),
  ('sales.write', 'sales', 'write', 'Escribir ventas'),
  ('sales.post', 'sales', 'post', 'Contabilizar ventas'),
  ('purchases.read', 'purchases', 'read', 'Leer compras'),
  ('purchases.write', 'purchases', 'write', 'Escribir compras'),
  ('purchases.post', 'purchases', 'post', 'Contabilizar compras'),
  ('inventory.read', 'inventory', 'read', 'Leer inventario'),
  ('inventory.write', 'inventory', 'write', 'Escribir inventario'),
  ('inventory.recalc', 'inventory', 'recalc', 'Recalcular inventario'),
  ('accounting.read', 'accounting', 'read', 'Leer contabilidad'),
  ('accounting.write', 'accounting', 'write', 'Escribir contabilidad'),
  ('accounting.close', 'accounting', 'close', 'Cerrar periodos'),
  ('treasury.read', 'treasury', 'read', 'Leer tesorería'),
  ('treasury.write', 'treasury', 'write', 'Escribir tesorería'),
  ('treasury.sepa', 'treasury', 'sepa', 'Generar SEPA'),
  ('tax.read', 'tax', 'read', 'Leer fiscal'),
  ('tax.write', 'tax', 'write', 'Escribir fiscal'),
  ('tax.sii', 'tax', 'sii', 'Enviar SII'),
  ('audit.read', 'audit', 'read', 'Leer auditoría'),
  ('config.read', 'config', 'read', 'Leer configuración'),
  ('config.write', 'config', 'write', 'Escribir configuración')
ON CONFLICT (key) DO NOTHING;

-- 6) ROLES POR EMPRESA
CREATE TABLE IF NOT EXISTS public.erp_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.erp_roles ENABLE ROW LEVEL SECURITY;

-- 7) PERMISOS POR ROL
CREATE TABLE IF NOT EXISTS public.erp_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.erp_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.erp_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

ALTER TABLE public.erp_role_permissions ENABLE ROW LEVEL SECURITY;

-- Actualizar FK en user_companies
ALTER TABLE public.erp_user_companies 
  ADD CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES public.erp_roles(id) ON DELETE SET NULL;

-- 8) EVENTOS DE AUDITORÍA
CREATE TABLE IF NOT EXISTS public.erp_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  actor_user_id UUID,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  action TEXT NOT NULL,
  before_json JSONB,
  after_json JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.erp_audit_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_erp_audit_company ON public.erp_audit_events(company_id);
CREATE INDEX idx_erp_audit_entity ON public.erp_audit_events(entity_type, entity_id);
CREATE INDEX idx_erp_audit_actor ON public.erp_audit_events(actor_user_id);
CREATE INDEX idx_erp_audit_created ON public.erp_audit_events(created_at DESC);

-- 9) EJERCICIOS FISCALES
CREATE TABLE IF NOT EXISTS public.erp_fiscal_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, name)
);

ALTER TABLE public.erp_fiscal_years ENABLE ROW LEVEL SECURITY;

-- 10) PERIODOS CONTABLES
CREATE TABLE IF NOT EXISTS public.erp_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year_id UUID NOT NULL REFERENCES public.erp_fiscal_years(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fiscal_year_id, month)
);

ALTER TABLE public.erp_periods ENABLE ROW LEVEL SECURITY;

-- 11) SERIES DOCUMENTALES
CREATE TABLE IF NOT EXISTS public.erp_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  document_type TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  prefix TEXT DEFAULT '',
  suffix TEXT DEFAULT '',
  next_number INTEGER DEFAULT 1,
  padding INTEGER DEFAULT 6,
  reset_annually BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, module, code)
);

ALTER TABLE public.erp_series ENABLE ROW LEVEL SECURITY;

-- 12) FUNCIÓN PARA OBTENER SIGUIENTE NÚMERO DE DOCUMENTO (con bloqueo)
CREATE OR REPLACE FUNCTION public.erp_get_next_document_number(
  p_company_id UUID,
  p_series_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_series RECORD;
  v_number INTEGER;
  v_result TEXT;
  v_year TEXT;
BEGIN
  -- Bloquear la fila de la serie para evitar duplicados
  SELECT * INTO v_series
  FROM erp_series
  WHERE id = p_series_id AND company_id = p_company_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Serie no encontrada';
  END IF;
  
  IF NOT v_series.is_active THEN
    RAISE EXCEPTION 'Serie no activa';
  END IF;
  
  v_number := v_series.next_number;
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Construir número formateado
  v_result := v_series.prefix || 
              LPAD(v_number::TEXT, v_series.padding, '0') || 
              v_series.suffix;
  
  -- Si reset anual, incluir año
  IF v_series.reset_annually THEN
    v_result := v_year || '-' || v_result;
  END IF;
  
  -- Incrementar contador
  UPDATE erp_series 
  SET next_number = next_number + 1, 
      updated_at = now()
  WHERE id = p_series_id;
  
  RETURN v_result;
END;
$$;

-- 13) FUNCIÓN PARA VERIFICAR PERMISOS
CREATE OR REPLACE FUNCTION public.erp_has_permission(
  p_user_id UUID,
  p_company_id UUID,
  p_permission_key TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM erp_user_companies uc
    JOIN erp_roles r ON r.id = uc.role_id
    JOIN erp_role_permissions rp ON rp.role_id = r.id
    JOIN erp_permissions p ON p.id = rp.permission_id
    WHERE uc.user_id = p_user_id
      AND uc.company_id = p_company_id
      AND uc.is_active = true
      AND (p.key = p_permission_key OR p.key = 'admin.all')
  )
$$;

-- 14) FUNCIÓN PARA OBTENER EMPRESAS DEL USUARIO
CREATE OR REPLACE FUNCTION public.erp_get_user_companies(p_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id 
  FROM erp_user_companies 
  WHERE user_id = p_user_id AND is_active = true
$$;

-- 15) POLÍTICAS RLS

-- erp_companies: usuarios solo ven empresas donde están asignados
CREATE POLICY "erp_companies_select" ON public.erp_companies
  FOR SELECT USING (
    id IN (SELECT erp_get_user_companies(auth.uid()))
  );

CREATE POLICY "erp_companies_insert" ON public.erp_companies
  FOR INSERT WITH CHECK (
    erp_has_permission(auth.uid(), id, 'admin.all')
  );

CREATE POLICY "erp_companies_update" ON public.erp_companies
  FOR UPDATE USING (
    erp_has_permission(auth.uid(), id, 'config.write')
  );

-- erp_user_companies
CREATE POLICY "erp_user_companies_select" ON public.erp_user_companies
  FOR SELECT USING (
    user_id = auth.uid() OR 
    company_id IN (SELECT erp_get_user_companies(auth.uid()))
  );

CREATE POLICY "erp_user_companies_all" ON public.erp_user_companies
  FOR ALL USING (
    erp_has_permission(auth.uid(), company_id, 'admin.all')
  );

-- erp_roles
CREATE POLICY "erp_roles_select" ON public.erp_roles
  FOR SELECT USING (
    company_id IS NULL OR company_id IN (SELECT erp_get_user_companies(auth.uid()))
  );

CREATE POLICY "erp_roles_all" ON public.erp_roles
  FOR ALL USING (
    erp_has_permission(auth.uid(), company_id, 'admin.all')
  );

-- erp_role_permissions
CREATE POLICY "erp_role_permissions_select" ON public.erp_role_permissions
  FOR SELECT USING (
    role_id IN (
      SELECT id FROM erp_roles WHERE company_id IN (SELECT erp_get_user_companies(auth.uid()))
    )
  );

-- erp_fiscal_years
CREATE POLICY "erp_fiscal_years_select" ON public.erp_fiscal_years
  FOR SELECT USING (company_id IN (SELECT erp_get_user_companies(auth.uid())));

CREATE POLICY "erp_fiscal_years_all" ON public.erp_fiscal_years
  FOR ALL USING (erp_has_permission(auth.uid(), company_id, 'config.write'));

-- erp_periods
CREATE POLICY "erp_periods_select" ON public.erp_periods
  FOR SELECT USING (company_id IN (SELECT erp_get_user_companies(auth.uid())));

CREATE POLICY "erp_periods_all" ON public.erp_periods
  FOR ALL USING (erp_has_permission(auth.uid(), company_id, 'config.write'));

-- erp_series
CREATE POLICY "erp_series_select" ON public.erp_series
  FOR SELECT USING (company_id IN (SELECT erp_get_user_companies(auth.uid())));

CREATE POLICY "erp_series_all" ON public.erp_series
  FOR ALL USING (erp_has_permission(auth.uid(), company_id, 'config.write'));

-- erp_audit_events
CREATE POLICY "erp_audit_events_select" ON public.erp_audit_events
  FOR SELECT USING (
    company_id IN (SELECT erp_get_user_companies(auth.uid())) AND
    erp_has_permission(auth.uid(), company_id, 'audit.read')
  );

CREATE POLICY "erp_audit_events_insert" ON public.erp_audit_events
  FOR INSERT WITH CHECK (company_id IN (SELECT erp_get_user_companies(auth.uid())));

-- erp_company_groups
CREATE POLICY "erp_company_groups_select" ON public.erp_company_groups
  FOR SELECT USING (
    id IN (SELECT DISTINCT group_id FROM erp_companies WHERE id IN (SELECT erp_get_user_companies(auth.uid())))
  );

-- 16) TRIGGER PARA AUDITORÍA AUTOMÁTICA
CREATE OR REPLACE FUNCTION public.erp_audit_trigger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_action TEXT;
  v_before JSONB;
  v_after JSONB;
BEGIN
  v_action := TG_OP;
  
  IF TG_OP = 'DELETE' THEN
    v_before := to_jsonb(OLD);
    v_after := NULL;
    v_company_id := COALESCE(OLD.company_id, NULL);
  ELSIF TG_OP = 'INSERT' THEN
    v_before := NULL;
    v_after := to_jsonb(NEW);
    v_company_id := COALESCE(NEW.company_id, NULL);
  ELSE
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
    v_company_id := COALESCE(NEW.company_id, OLD.company_id);
  END IF;
  
  INSERT INTO erp_audit_events (
    company_id, actor_user_id, entity_type, entity_id, 
    action, before_json, after_json
  ) VALUES (
    v_company_id, auth.uid(), TG_TABLE_NAME, 
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    v_action, v_before, v_after
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Aplicar triggers de auditoría
CREATE TRIGGER erp_companies_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.erp_companies
  FOR EACH ROW EXECUTE FUNCTION public.erp_audit_trigger_fn();

CREATE TRIGGER erp_fiscal_years_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.erp_fiscal_years
  FOR EACH ROW EXECUTE FUNCTION public.erp_audit_trigger_fn();

CREATE TRIGGER erp_series_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.erp_series
  FOR EACH ROW EXECUTE FUNCTION public.erp_audit_trigger_fn();

CREATE TRIGGER erp_roles_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.erp_roles
  FOR EACH ROW EXECUTE FUNCTION public.erp_audit_trigger_fn();

-- 17) FUNCIÓN DE UPDATED_AT
CREATE OR REPLACE FUNCTION public.erp_update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Aplicar a tablas con updated_at
CREATE TRIGGER erp_companies_updated_at
  BEFORE UPDATE ON public.erp_companies
  FOR EACH ROW EXECUTE FUNCTION public.erp_update_updated_at();

CREATE TRIGGER erp_fiscal_years_updated_at
  BEFORE UPDATE ON public.erp_fiscal_years
  FOR EACH ROW EXECUTE FUNCTION public.erp_update_updated_at();

CREATE TRIGGER erp_series_updated_at
  BEFORE UPDATE ON public.erp_series
  FOR EACH ROW EXECUTE FUNCTION public.erp_update_updated_at();

CREATE TRIGGER erp_roles_updated_at
  BEFORE UPDATE ON public.erp_roles
  FOR EACH ROW EXECUTE FUNCTION public.erp_update_updated_at();

CREATE TRIGGER erp_periods_updated_at
  BEFORE UPDATE ON public.erp_periods
  FOR EACH ROW EXECUTE FUNCTION public.erp_update_updated_at();

CREATE TRIGGER erp_user_companies_updated_at
  BEFORE UPDATE ON public.erp_user_companies
  FOR EACH ROW EXECUTE FUNCTION public.erp_update_updated_at();

CREATE TRIGGER erp_company_groups_updated_at
  BEFORE UPDATE ON public.erp_company_groups
  FOR EACH ROW EXECUTE FUNCTION public.erp_update_updated_at();