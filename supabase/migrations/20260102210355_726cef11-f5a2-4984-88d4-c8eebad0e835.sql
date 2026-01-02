
-- ============================================
-- PHASE 4 COMPLETA: IVA Y MODELOS FISCALES
-- ============================================

-- 0. Función helper para updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Tipos de IVA
CREATE TABLE public.erp_vat_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  vat_type VARCHAR(20) NOT NULL DEFAULT 'general',
  deductible_account_id UUID REFERENCES public.erp_chart_accounts(id),
  payable_account_id UUID REFERENCES public.erp_chart_accounts(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  applies_to VARCHAR(20) DEFAULT 'both',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- 2. Tipos de Retención
CREATE TABLE public.erp_withholding_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  withholding_type VARCHAR(30) NOT NULL DEFAULT 'irpf',
  account_id UUID REFERENCES public.erp_chart_accounts(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  applies_to VARCHAR(20) DEFAULT 'both',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- 3. Modelos Tributarios
CREATE TABLE public.erp_tax_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  model_code VARCHAR(10) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  frequency VARCHAR(20) NOT NULL DEFAULT 'quarterly',
  is_active BOOLEAN NOT NULL DEFAULT true,
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, model_code)
);

-- 4. Presentaciones de Modelos
CREATE TABLE public.erp_tax_model_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  tax_model_id UUID NOT NULL REFERENCES public.erp_tax_models(id) ON DELETE CASCADE,
  fiscal_year_id UUID REFERENCES public.erp_fiscal_years(id),
  period_id UUID REFERENCES public.erp_periods(id),
  period_type VARCHAR(20) NOT NULL,
  period_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  calculated_data JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  submitted_by UUID,
  reference_number VARCHAR(50),
  result_amount DECIMAL(15,2),
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Claves de operación IVA
CREATE TABLE public.erp_vat_operation_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  register_type VARCHAR(20) NOT NULL DEFAULT 'both',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Índices
CREATE INDEX idx_erp_vat_types_co ON public.erp_vat_types(company_id);
CREATE INDEX idx_erp_withholding_co ON public.erp_withholding_types(company_id);
CREATE INDEX idx_erp_tax_models_co ON public.erp_tax_models(company_id);
CREATE INDEX idx_erp_tax_filings_co ON public.erp_tax_model_filings(company_id);
CREATE INDEX idx_erp_tax_filings_md ON public.erp_tax_model_filings(tax_model_id);

-- RLS
ALTER TABLE public.erp_vat_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_withholding_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_tax_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_tax_model_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_vat_operation_keys ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "p_vat_types_s" ON public.erp_vat_types FOR SELECT TO authenticated USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "p_vat_types_i" ON public.erp_vat_types FOR INSERT TO authenticated WITH CHECK (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "p_vat_types_u" ON public.erp_vat_types FOR UPDATE TO authenticated USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "p_vat_types_d" ON public.erp_vat_types FOR DELETE TO authenticated USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "p_withholding_s" ON public.erp_withholding_types FOR SELECT TO authenticated USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "p_withholding_i" ON public.erp_withholding_types FOR INSERT TO authenticated WITH CHECK (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "p_withholding_u" ON public.erp_withholding_types FOR UPDATE TO authenticated USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "p_withholding_d" ON public.erp_withholding_types FOR DELETE TO authenticated USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "p_tax_models_s" ON public.erp_tax_models FOR SELECT TO authenticated USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "p_tax_models_i" ON public.erp_tax_models FOR INSERT TO authenticated WITH CHECK (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "p_tax_models_u" ON public.erp_tax_models FOR UPDATE TO authenticated USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "p_tax_models_d" ON public.erp_tax_models FOR DELETE TO authenticated USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "p_tax_filings_s" ON public.erp_tax_model_filings FOR SELECT TO authenticated USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "p_tax_filings_i" ON public.erp_tax_model_filings FOR INSERT TO authenticated WITH CHECK (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "p_tax_filings_u" ON public.erp_tax_model_filings FOR UPDATE TO authenticated USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "p_tax_filings_d" ON public.erp_tax_model_filings FOR DELETE TO authenticated USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "p_vat_keys_s" ON public.erp_vat_operation_keys FOR SELECT TO authenticated USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "p_vat_keys_i" ON public.erp_vat_operation_keys FOR INSERT TO authenticated WITH CHECK (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "p_vat_keys_u" ON public.erp_vat_operation_keys FOR UPDATE TO authenticated USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "p_vat_keys_d" ON public.erp_vat_operation_keys FOR DELETE TO authenticated USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));

-- Triggers
CREATE TRIGGER trg_erp_vat_types_upd BEFORE UPDATE ON public.erp_vat_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_erp_withholding_upd BEFORE UPDATE ON public.erp_withholding_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_erp_tax_models_upd BEFORE UPDATE ON public.erp_tax_models FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_erp_tax_filings_upd BEFORE UPDATE ON public.erp_tax_model_filings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
