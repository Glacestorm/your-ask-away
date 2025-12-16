-- =============================================
-- FASE 1: INFRAESTRUCTURA MULTI-CNAE HOLDINGS
-- =============================================

-- 1.1 Tabla de precios por CNAE
CREATE TABLE public.cnae_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnae_code TEXT NOT NULL,
  base_price NUMERIC NOT NULL DEFAULT 15000,
  complexity_tier TEXT NOT NULL DEFAULT 'standard' CHECK (complexity_tier IN ('basic', 'standard', 'advanced', 'enterprise')),
  tier_multipliers JSONB DEFAULT '{
    "micro": 0.4,
    "small": 0.6,
    "medium": 1.0,
    "large": 1.5,
    "enterprise": 2.0
  }'::jsonb,
  includes_features TEXT[] DEFAULT '{}',
  sector_category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(cnae_code)
);

-- 1.2 Tabla relación N:N empresas-CNAEs
CREATE TABLE public.company_cnaes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cnae_code TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  percentage_activity NUMERIC(5,2) DEFAULT 100,
  installed_module_id UUID REFERENCES public.installed_modules(id),
  license_price NUMERIC DEFAULT 0,
  discount_applied NUMERIC(5,2) DEFAULT 0,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, cnae_code)
);

-- 1.3 Tabla de bundles sectoriales
CREATE TABLE public.cnae_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_name TEXT NOT NULL,
  bundle_description TEXT,
  cnae_codes TEXT[] NOT NULL,
  discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 15,
  is_ai_suggested BOOLEAN DEFAULT false,
  min_cnaes_required INTEGER DEFAULT 2,
  max_discount_cap NUMERIC(5,2) DEFAULT 40,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 1.4 Tabla de suscripciones de holdings
CREATE TABLE public.holding_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL DEFAULT 'standard' CHECK (subscription_tier IN ('standard', 'professional', 'enterprise')),
  total_cnaes INTEGER DEFAULT 0,
  volume_discount NUMERIC(5,2) DEFAULT 0,
  monthly_total NUMERIC DEFAULT 0,
  annual_total NUMERIC DEFAULT 0,
  features_included JSONB DEFAULT '[]'::jsonb,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cnae_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_cnaes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cnae_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holding_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cnae_pricing
CREATE POLICY "Everyone can view cnae pricing" ON public.cnae_pricing
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage cnae pricing" ON public.cnae_pricing
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

-- RLS Policies for company_cnaes
CREATE POLICY "Users can view company cnaes" ON public.company_cnaes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage company cnaes" ON public.company_cnaes
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Gestors can manage their company cnaes" ON public.company_cnaes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.companies c 
      WHERE c.id = company_cnaes.company_id 
      AND c.gestor_id = auth.uid()
    )
  );

-- RLS Policies for cnae_bundles
CREATE POLICY "Everyone can view active bundles" ON public.cnae_bundles
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage bundles" ON public.cnae_bundles
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

-- RLS Policies for holding_subscriptions
CREATE POLICY "Users can view holding subscriptions" ON public.holding_subscriptions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage holding subscriptions" ON public.holding_subscriptions
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

-- =============================================
-- FASE 2: FUNCIONES DE PRICING DINÁMICO
-- =============================================

-- Función para determinar tier de facturación
CREATE OR REPLACE FUNCTION public.get_turnover_tier(p_turnover NUMERIC)
RETURNS TEXT AS $$
BEGIN
  IF p_turnover IS NULL OR p_turnover < 500000 THEN
    RETURN 'micro';
  ELSIF p_turnover < 1000000 THEN
    RETURN 'small';
  ELSIF p_turnover < 10000000 THEN
    RETURN 'medium';
  ELSIF p_turnover < 50000000 THEN
    RETURN 'large';
  ELSE
    RETURN 'enterprise';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para calcular descuento por volumen
CREATE OR REPLACE FUNCTION public.get_volume_discount(p_cnae_count INTEGER)
RETURNS NUMERIC AS $$
BEGIN
  IF p_cnae_count <= 1 THEN
    RETURN 0;
  ELSIF p_cnae_count = 2 THEN
    RETURN 10;
  ELSIF p_cnae_count = 3 THEN
    RETURN 15;
  ELSIF p_cnae_count = 4 THEN
    RETURN 20;
  ELSIF p_cnae_count = 5 THEN
    RETURN 25;
  ELSIF p_cnae_count <= 10 THEN
    RETURN 30;
  ELSE
    RETURN 35;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función principal de cálculo de precio
CREATE OR REPLACE FUNCTION public.calculate_cnae_price(
  p_cnae_code TEXT,
  p_company_turnover NUMERIC DEFAULT NULL,
  p_existing_cnaes INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_pricing RECORD;
  v_tier TEXT;
  v_multiplier NUMERIC;
  v_base_price NUMERIC;
  v_volume_discount NUMERIC;
  v_final_price NUMERIC;
  v_bundle_discount NUMERIC := 0;
BEGIN
  -- Obtener pricing del CNAE
  SELECT * INTO v_pricing FROM public.cnae_pricing WHERE cnae_code = p_cnae_code AND is_active = true;
  
  IF NOT FOUND THEN
    -- Precio por defecto si no existe pricing específico
    v_base_price := 15000;
    v_tier := get_turnover_tier(p_company_turnover);
    v_multiplier := CASE v_tier
      WHEN 'micro' THEN 0.4
      WHEN 'small' THEN 0.6
      WHEN 'medium' THEN 1.0
      WHEN 'large' THEN 1.5
      WHEN 'enterprise' THEN 2.0
      ELSE 1.0
    END;
  ELSE
    v_base_price := v_pricing.base_price;
    v_tier := get_turnover_tier(p_company_turnover);
    v_multiplier := COALESCE((v_pricing.tier_multipliers->>v_tier)::NUMERIC, 1.0);
  END IF;
  
  -- Calcular descuento por volumen
  v_volume_discount := get_volume_discount(p_existing_cnaes + 1);
  
  -- Calcular precio final
  v_final_price := v_base_price * v_multiplier * (1 - v_volume_discount / 100);
  
  RETURN jsonb_build_object(
    'cnae_code', p_cnae_code,
    'base_price', v_base_price,
    'turnover_tier', v_tier,
    'tier_multiplier', v_multiplier,
    'volume_discount_pct', v_volume_discount,
    'bundle_discount_pct', v_bundle_discount,
    'final_price', ROUND(v_final_price, 2),
    'complexity_tier', COALESCE(v_pricing.complexity_tier, 'standard')
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Función para detectar bundles aplicables
CREATE OR REPLACE FUNCTION public.find_applicable_bundles(p_cnae_codes TEXT[])
RETURNS TABLE(
  bundle_id UUID,
  bundle_name TEXT,
  discount_percentage NUMERIC,
  matching_cnaes TEXT[],
  match_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.bundle_name,
    b.discount_percentage,
    ARRAY(SELECT unnest(b.cnae_codes) INTERSECT SELECT unnest(p_cnae_codes)) as matching,
    ARRAY_LENGTH(ARRAY(SELECT unnest(b.cnae_codes) INTERSECT SELECT unnest(p_cnae_codes)), 1) as cnt
  FROM public.cnae_bundles b
  WHERE b.is_active = true
    AND ARRAY_LENGTH(ARRAY(SELECT unnest(b.cnae_codes) INTERSECT SELECT unnest(p_cnae_codes)), 1) >= b.min_cnaes_required
  ORDER BY b.discount_percentage DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================
-- SEED DATA: PRECIOS POR SECTOR/CNAE
-- =============================================

-- Sectores Básicos (12.000€ - 15.000€)
INSERT INTO public.cnae_pricing (cnae_code, base_price, complexity_tier, sector_category, includes_features) VALUES
('0111', 12000, 'basic', 'agriculture', ARRAY['visits', 'basic_accounting', 'compliance_pac']),
('0113', 12000, 'basic', 'agriculture', ARRAY['visits', 'basic_accounting', 'compliance_pac']),
('0121', 12000, 'basic', 'agriculture', ARRAY['visits', 'basic_accounting', 'compliance_pac']),
('4711', 14000, 'basic', 'retail', ARRAY['visits', 'pos_integration', 'inventory']),
('4719', 14000, 'basic', 'retail', ARRAY['visits', 'pos_integration', 'inventory']),
('4721', 13000, 'basic', 'retail', ARRAY['visits', 'basic_accounting']),
('4781', 13000, 'basic', 'retail', ARRAY['visits', 'basic_accounting']),
('5610', 15000, 'basic', 'hospitality', ARRAY['visits', 'reservations', 'pos_integration']),
('5630', 14000, 'basic', 'hospitality', ARRAY['visits', 'pos_integration']);

-- Sectores Estándar (18.000€ - 25.000€)
INSERT INTO public.cnae_pricing (cnae_code, base_price, complexity_tier, sector_category, includes_features) VALUES
('4110', 22000, 'standard', 'construction', ARRAY['visits', 'project_management', 'compliance_construction']),
('4121', 22000, 'standard', 'construction', ARRAY['visits', 'project_management', 'compliance_construction']),
('4211', 24000, 'standard', 'construction', ARRAY['visits', 'project_management', 'compliance_infrastructure']),
('4391', 20000, 'standard', 'construction', ARRAY['visits', 'project_management']),
('4941', 20000, 'standard', 'transport', ARRAY['visits', 'fleet_management', 'compliance_transport']),
('4942', 18000, 'standard', 'transport', ARRAY['visits', 'fleet_management']),
('6201', 22000, 'standard', 'technology', ARRAY['visits', 'project_management', 'agile_tools']),
('6202', 20000, 'standard', 'technology', ARRAY['visits', 'consulting_tools']),
('6910', 25000, 'standard', 'legal', ARRAY['visits', 'case_management', 'compliance_legal']),
('6920', 24000, 'standard', 'accounting', ARRAY['visits', 'advanced_accounting', 'audit_tools']),
('7010', 20000, 'standard', 'consulting', ARRAY['visits', 'project_management']),
('7022', 22000, 'standard', 'consulting', ARRAY['visits', 'advisory_tools']);

-- Sectores Avanzados (35.000€ - 50.000€)
INSERT INTO public.cnae_pricing (cnae_code, base_price, complexity_tier, sector_category, includes_features) VALUES
('6419', 45000, 'advanced', 'finance', ARRAY['visits', 'risk_management', 'compliance_banking', 'aml_tools']),
('6420', 42000, 'advanced', 'finance', ARRAY['visits', 'portfolio_management', 'compliance_mifid']),
('6430', 48000, 'advanced', 'finance', ARRAY['visits', 'fund_management', 'compliance_ucits']),
('6511', 40000, 'advanced', 'insurance', ARRAY['visits', 'policy_management', 'compliance_solvency']),
('6512', 42000, 'advanced', 'insurance', ARRAY['visits', 'claims_management', 'compliance_insurance']),
('8610', 38000, 'advanced', 'healthcare', ARRAY['visits', 'patient_management', 'compliance_gdpr_health']),
('8621', 35000, 'advanced', 'healthcare', ARRAY['visits', 'medical_records', 'compliance_health']),
('3511', 45000, 'advanced', 'energy', ARRAY['visits', 'grid_management', 'compliance_energy']),
('3512', 42000, 'advanced', 'energy', ARRAY['visits', 'trading_tools', 'compliance_energy']),
('2110', 50000, 'advanced', 'pharma', ARRAY['visits', 'compliance_pharma', 'clinical_trials']);

-- Sectores Enterprise (60.000€+)
INSERT INTO public.cnae_pricing (cnae_code, base_price, complexity_tier, sector_category, includes_features) VALUES
('6411', 75000, 'enterprise', 'central_banking', ARRAY['visits', 'monetary_policy', 'compliance_full']),
('6110', 65000, 'enterprise', 'telecom', ARRAY['visits', 'network_management', 'compliance_telecom']),
('6120', 62000, 'enterprise', 'telecom', ARRAY['visits', 'spectrum_management', 'compliance_telecom']),
('3513', 68000, 'enterprise', 'utilities', ARRAY['visits', 'distribution_management', 'compliance_utilities']),
('3514', 70000, 'enterprise', 'utilities', ARRAY['visits', 'trading_platform', 'compliance_energy']),
('6810', 60000, 'enterprise', 'real_estate', ARRAY['visits', 'portfolio_management', 'compliance_socimi']),
('6820', 58000, 'enterprise', 'real_estate', ARRAY['visits', 'property_management', 'compliance_real_estate']);

-- =============================================
-- SEED DATA: BUNDLES SECTORIALES
-- =============================================

INSERT INTO public.cnae_bundles (bundle_name, bundle_description, cnae_codes, discount_percentage, min_cnaes_required) VALUES
('Pack Retail Completo', 'Bundle para comercio minorista integral', ARRAY['4711', '4719', '4721', '4781', '4799'], 25, 2),
('Pack Construcción', 'Bundle para empresas constructoras', ARRAY['4110', '4121', '4211', '4291', '4391', '4399'], 20, 2),
('Pack Financiero', 'Bundle para entidades financieras', ARRAY['6419', '6420', '6430', '6491', '6492', '6499'], 30, 2),
('Pack Seguros', 'Bundle para aseguradoras', ARRAY['6511', '6512', '6520', '6530'], 25, 2),
('Pack Hospitality', 'Bundle para hostelería y turismo', ARRAY['5510', '5520', '5610', '5621', '5630', '7911', '7912'], 25, 2),
('Pack Salud', 'Bundle para sector sanitario', ARRAY['8610', '8621', '8622', '8623', '8690'], 22, 2),
('Pack Tecnología', 'Bundle para empresas tech', ARRAY['6201', '6202', '6203', '6209', '6311', '6312'], 20, 2),
('Pack Energía', 'Bundle para sector energético', ARRAY['3511', '3512', '3513', '3514', '3521', '3522', '3523'], 25, 2),
('Pack Industrial', 'Bundle para industria manufacturera', ARRAY['1011', '1012', '1013', '2041', '2042', '2511', '2512'], 18, 3),
('Pack Servicios Profesionales', 'Bundle para consulting y profesionales', ARRAY['6910', '6920', '7010', '7021', '7022', '7311', '7312'], 20, 2),
('Pack Transporte y Logística', 'Bundle para transporte', ARRAY['4941', '4942', '5210', '5221', '5222', '5223', '5224'], 22, 2),
('Pack Holding Diversificado', 'Bundle especial para holdings multi-sector', ARRAY['6420', '6810', '7010', '7022'], 35, 3);

-- Triggers para updated_at
CREATE TRIGGER update_cnae_pricing_updated_at BEFORE UPDATE ON public.cnae_pricing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_cnaes_updated_at BEFORE UPDATE ON public.company_cnaes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cnae_bundles_updated_at BEFORE UPDATE ON public.cnae_bundles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_holding_subscriptions_updated_at BEFORE UPDATE ON public.holding_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();