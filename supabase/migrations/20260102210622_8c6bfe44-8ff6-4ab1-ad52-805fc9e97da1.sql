
-- ============================================================
-- FASE 5: FACTURACIÓN ELECTRÓNICA Y SII
-- ============================================================

-- 5.1 Tabla de configuración SII por empresa
CREATE TABLE public.erp_sii_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  
  -- Certificado digital
  certificate_name TEXT,
  certificate_expiry DATE,
  certificate_nif TEXT,
  
  -- Endpoints SII
  environment TEXT NOT NULL DEFAULT 'test' CHECK (environment IN ('test', 'production')),
  wsdl_url TEXT,
  
  -- Configuración de envío
  auto_send BOOLEAN DEFAULT false,
  send_delay_hours INTEGER DEFAULT 4,
  retry_attempts INTEGER DEFAULT 3,
  
  -- Últimos estados
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT erp_sii_config_company_unique UNIQUE (company_id)
);

-- 5.2 Tabla de facturas electrónicas
CREATE TABLE public.erp_electronic_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  fiscal_year_id UUID REFERENCES public.erp_fiscal_years(id),
  period_id UUID REFERENCES public.erp_periods(id),
  
  -- Referencia a factura origen (ventas o compras)
  source_type TEXT NOT NULL CHECK (source_type IN ('sales', 'purchases')),
  source_invoice_id UUID,
  
  -- Datos de la factura
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  operation_date DATE,
  
  -- Tercero
  partner_tax_id TEXT NOT NULL,
  partner_name TEXT NOT NULL,
  partner_country TEXT DEFAULT 'ES',
  
  -- Importes
  base_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  withholding_amount NUMERIC(15,2) DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  -- Desglose IVA (JSON array)
  vat_breakdown JSONB DEFAULT '[]',
  
  -- Clasificación fiscal
  invoice_type TEXT NOT NULL, -- F1, F2, R1, R2, etc.
  operation_key TEXT, -- Clave de operación SII
  special_regime TEXT, -- Régimen especial
  
  -- Estado SII
  sii_status TEXT DEFAULT 'pending' CHECK (sii_status IN ('pending', 'sent', 'accepted', 'rejected', 'error')),
  sii_csv TEXT, -- Código Seguro de Verificación
  sii_sent_at TIMESTAMPTZ,
  sii_response JSONB,
  sii_error_code TEXT,
  sii_error_message TEXT,
  sii_attempts INTEGER DEFAULT 0,
  
  -- TicketBAI / Verifactu (para futuras implementaciones)
  tbai_signature TEXT,
  tbai_qr_url TEXT,
  
  -- Metadatos
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 5.3 Tabla de libro registro IVA
CREATE TABLE public.erp_vat_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  fiscal_year_id UUID NOT NULL REFERENCES public.erp_fiscal_years(id),
  period_id UUID NOT NULL REFERENCES public.erp_periods(id),
  
  -- Tipo de libro
  ledger_type TEXT NOT NULL CHECK (ledger_type IN ('issued', 'received', 'assets', 'intra_community')),
  
  -- Referencia
  electronic_invoice_id UUID REFERENCES public.erp_electronic_invoices(id),
  entry_number INTEGER NOT NULL,
  
  -- Datos de la operación
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  operation_date DATE,
  accounting_date DATE NOT NULL,
  
  -- Tercero
  partner_tax_id TEXT NOT NULL,
  partner_name TEXT NOT NULL,
  partner_country TEXT DEFAULT 'ES',
  
  -- Clasificación
  operation_key TEXT,
  invoice_type TEXT,
  
  -- Importes
  base_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5,2),
  vat_amount NUMERIC(15,2) DEFAULT 0,
  equivalence_rate NUMERIC(5,2),
  equivalence_amount NUMERIC(15,2) DEFAULT 0,
  withholding_rate NUMERIC(5,2),
  withholding_amount NUMERIC(15,2) DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  -- Deducibilidad (para libro recibidas)
  deductible_percentage NUMERIC(5,2) DEFAULT 100,
  deductible_amount NUMERIC(15,2),
  
  -- Rectificaciones
  is_rectification BOOLEAN DEFAULT false,
  rectified_invoice_id UUID REFERENCES public.erp_electronic_invoices(id),
  rectification_type TEXT, -- I: sustitutiva, S: por diferencias
  
  -- Estado
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'declared')),
  declared_in_model TEXT, -- 303, 390, etc.
  declaration_period TEXT, -- 2024-01, 2024-1T, etc.
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5.4 Tabla de envíos SII (batch)
CREATE TABLE public.erp_sii_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  
  -- Tipo de envío
  submission_type TEXT NOT NULL CHECK (submission_type IN ('issued', 'received', 'assets', 'intra_community', 'payments', 'collections')),
  
  -- Datos del envío
  batch_id TEXT, -- ID del lote generado
  invoices_count INTEGER DEFAULT 0,
  
  -- Estado
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'partial', 'failed')),
  
  -- Respuesta SII
  sent_at TIMESTAMPTZ,
  response_at TIMESTAMPTZ,
  csv TEXT,
  response_xml TEXT,
  response_json JSONB,
  
  -- Contadores de resultado
  accepted_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  
  -- Errores
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 5.5 Tabla de detalle de envíos SII
CREATE TABLE public.erp_sii_submission_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.erp_sii_submissions(id) ON DELETE CASCADE,
  electronic_invoice_id UUID NOT NULL REFERENCES public.erp_electronic_invoices(id),
  
  -- Estado individual
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'error')),
  
  -- Respuesta
  csv TEXT,
  error_code TEXT,
  error_message TEXT,
  response_data JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_erp_sii_config_company ON public.erp_sii_config(company_id);

CREATE INDEX idx_erp_electronic_invoices_company ON public.erp_electronic_invoices(company_id);
CREATE INDEX idx_erp_electronic_invoices_fiscal_year ON public.erp_electronic_invoices(fiscal_year_id);
CREATE INDEX idx_erp_electronic_invoices_period ON public.erp_electronic_invoices(period_id);
CREATE INDEX idx_erp_electronic_invoices_source ON public.erp_electronic_invoices(source_type, source_invoice_id);
CREATE INDEX idx_erp_electronic_invoices_status ON public.erp_electronic_invoices(sii_status);
CREATE INDEX idx_erp_electronic_invoices_date ON public.erp_electronic_invoices(invoice_date);
CREATE INDEX idx_erp_electronic_invoices_partner ON public.erp_electronic_invoices(partner_tax_id);

CREATE INDEX idx_erp_vat_ledger_company ON public.erp_vat_ledger(company_id);
CREATE INDEX idx_erp_vat_ledger_fiscal_year ON public.erp_vat_ledger(fiscal_year_id);
CREATE INDEX idx_erp_vat_ledger_period ON public.erp_vat_ledger(period_id);
CREATE INDEX idx_erp_vat_ledger_type ON public.erp_vat_ledger(ledger_type);
CREATE INDEX idx_erp_vat_ledger_status ON public.erp_vat_ledger(status);
CREATE INDEX idx_erp_vat_ledger_partner ON public.erp_vat_ledger(partner_tax_id);

CREATE INDEX idx_erp_sii_submissions_company ON public.erp_sii_submissions(company_id);
CREATE INDEX idx_erp_sii_submissions_status ON public.erp_sii_submissions(status);

CREATE INDEX idx_erp_sii_submission_items_submission ON public.erp_sii_submission_items(submission_id);
CREATE INDEX idx_erp_sii_submission_items_invoice ON public.erp_sii_submission_items(electronic_invoice_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.erp_sii_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_electronic_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_vat_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_sii_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_sii_submission_items ENABLE ROW LEVEL SECURITY;

-- Políticas para erp_sii_config
CREATE POLICY "Users can view sii config of their companies"
  ON public.erp_sii_config FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can manage sii config of their companies"
  ON public.erp_sii_config FOR ALL
  USING (company_id IN (
    SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true
  ));

-- Políticas para erp_electronic_invoices
CREATE POLICY "Users can view electronic invoices of their companies"
  ON public.erp_electronic_invoices FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can manage electronic invoices of their companies"
  ON public.erp_electronic_invoices FOR ALL
  USING (company_id IN (
    SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true
  ));

-- Políticas para erp_vat_ledger
CREATE POLICY "Users can view vat ledger of their companies"
  ON public.erp_vat_ledger FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can manage vat ledger of their companies"
  ON public.erp_vat_ledger FOR ALL
  USING (company_id IN (
    SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true
  ));

-- Políticas para erp_sii_submissions
CREATE POLICY "Users can view sii submissions of their companies"
  ON public.erp_sii_submissions FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can manage sii submissions of their companies"
  ON public.erp_sii_submissions FOR ALL
  USING (company_id IN (
    SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true
  ));

-- Políticas para erp_sii_submission_items
CREATE POLICY "Users can view sii submission items of their companies"
  ON public.erp_sii_submission_items FOR SELECT
  USING (submission_id IN (
    SELECT id FROM public.erp_sii_submissions WHERE company_id IN (
      SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true
    )
  ));

CREATE POLICY "Users can manage sii submission items of their companies"
  ON public.erp_sii_submission_items FOR ALL
  USING (submission_id IN (
    SELECT id FROM public.erp_sii_submissions WHERE company_id IN (
      SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true
    )
  ));

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================

CREATE TRIGGER set_erp_sii_config_updated_at
  BEFORE UPDATE ON public.erp_sii_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_erp_electronic_invoices_updated_at
  BEFORE UPDATE ON public.erp_electronic_invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_erp_vat_ledger_updated_at
  BEFORE UPDATE ON public.erp_vat_ledger
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
