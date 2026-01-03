-- ============================================
-- TABLA MAESTRA: SOCIOS COMERCIALES (TRADE PARTNERS)
-- ============================================

CREATE TABLE public.erp_trade_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  
  -- Identificación
  partner_code TEXT NOT NULL,
  partner_type TEXT NOT NULL CHECK (partner_type IN ('customer', 'supplier', 'both')),
  
  -- Datos básicos
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  tax_id TEXT,
  country TEXT NOT NULL DEFAULT 'ES',
  
  -- Contacto
  address TEXT,
  city TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  
  -- Comercio exterior
  is_international BOOLEAN DEFAULT false,
  default_incoterm TEXT,
  default_currency TEXT DEFAULT 'EUR',
  credit_limit DECIMAL(18,2),
  payment_terms_days INTEGER DEFAULT 30,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_erp_trade_partners_company ON public.erp_trade_partners(company_id);
CREATE INDEX idx_erp_trade_partners_type ON public.erp_trade_partners(partner_type);
CREATE INDEX idx_erp_trade_partners_country ON public.erp_trade_partners(country);

-- RLS
ALTER TABLE public.erp_trade_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage trade partners" ON public.erp_trade_partners
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Trigger updated_at
CREATE TRIGGER update_erp_trade_partners_updated_at
  BEFORE UPDATE ON public.erp_trade_partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FASE 4: CRÉDITOS DOCUMENTARIOS (CARTAS DE CRÉDITO)
-- ============================================

-- Tabla principal de créditos documentarios
CREATE TABLE public.erp_documentary_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  
  -- Identificación
  credit_number TEXT NOT NULL,
  credit_type TEXT NOT NULL CHECK (credit_type IN ('import', 'export')),
  operation_type TEXT NOT NULL CHECK (operation_type IN ('irrevocable', 'revocable', 'confirmed', 'unconfirmed', 'transferable', 'back_to_back', 'standby')),
  
  -- Partes involucradas
  applicant_id UUID REFERENCES public.erp_trade_partners(id),
  beneficiary_id UUID REFERENCES public.erp_trade_partners(id),
  issuing_bank_id UUID REFERENCES public.erp_financial_entities(id),
  advising_bank_id UUID REFERENCES public.erp_financial_entities(id),
  confirming_bank_id UUID REFERENCES public.erp_financial_entities(id),
  negotiating_bank_id UUID REFERENCES public.erp_financial_entities(id),
  
  -- Importes
  amount DECIMAL(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  tolerance_percentage DECIMAL(5,2) DEFAULT 0,
  max_amount DECIMAL(18,2),
  utilized_amount DECIMAL(18,2) DEFAULT 0,
  
  -- Fechas
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  latest_shipment_date DATE,
  presentation_period_days INTEGER DEFAULT 21,
  
  -- Términos
  incoterm TEXT,
  port_of_loading TEXT,
  port_of_discharge TEXT,
  place_of_delivery TEXT,
  partial_shipments_allowed BOOLEAN DEFAULT true,
  transshipment_allowed BOOLEAN DEFAULT true,
  
  -- Documentos requeridos
  required_documents JSONB DEFAULT '[]'::jsonb,
  special_conditions TEXT,
  
  -- Estado
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'requested', 'issued', 'advised', 'confirmed', 'amended', 'utilized', 'expired', 'cancelled')),
  swift_reference TEXT,
  
  -- Comisiones
  commission_rate DECIMAL(5,4),
  commission_amount DECIMAL(18,2),
  expenses JSONB DEFAULT '[]'::jsonb,
  
  -- Auditoría
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enmiendas
CREATE TABLE public.erp_credit_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id UUID NOT NULL REFERENCES public.erp_documentary_credits(id) ON DELETE CASCADE,
  amendment_number INTEGER NOT NULL,
  amendment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  changes JSONB NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  response_date DATE,
  response_notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Presentaciones
CREATE TABLE public.erp_credit_presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id UUID NOT NULL REFERENCES public.erp_documentary_credits(id) ON DELETE CASCADE,
  presentation_number INTEGER NOT NULL,
  presentation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  documents_presented JSONB NOT NULL DEFAULT '[]'::jsonb,
  amount_claimed DECIMAL(18,2) NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'compliant', 'discrepant', 'rejected')),
  discrepancies JSONB DEFAULT '[]'::jsonb,
  discrepancy_waived BOOLEAN DEFAULT false,
  waiver_date DATE,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'approved', 'paid', 'refused')),
  payment_date DATE,
  payment_amount DECIMAL(18,2),
  payment_reference TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_erp_documentary_credits_company ON public.erp_documentary_credits(company_id);
CREATE INDEX idx_erp_documentary_credits_status ON public.erp_documentary_credits(status);
CREATE INDEX idx_erp_documentary_credits_type ON public.erp_documentary_credits(credit_type);
CREATE INDEX idx_erp_credit_amendments_credit ON public.erp_credit_amendments(credit_id);
CREATE INDEX idx_erp_credit_presentations_credit ON public.erp_credit_presentations(credit_id);

-- RLS
ALTER TABLE public.erp_documentary_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_credit_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_credit_presentations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage documentary credits" ON public.erp_documentary_credits
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage credit amendments" ON public.erp_credit_amendments
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage credit presentations" ON public.erp_credit_presentations
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Triggers
CREATE TRIGGER update_erp_documentary_credits_updated_at
  BEFORE UPDATE ON public.erp_documentary_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_erp_credit_presentations_updated_at
  BEFORE UPDATE ON public.erp_credit_presentations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();