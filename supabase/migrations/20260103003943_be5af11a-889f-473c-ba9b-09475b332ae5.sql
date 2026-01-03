-- =============================================
-- FASE 2: Descuento Comercial Nacional/Internacional
-- =============================================

-- Tabla principal de operaciones de descuento
CREATE TABLE public.erp_commercial_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  discount_number TEXT NOT NULL,
  entity_id UUID REFERENCES public.erp_financial_entities(id),
  operation_type TEXT NOT NULL DEFAULT 'national' CHECK (operation_type IN ('national', 'international')),
  
  -- Importes
  total_nominal DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_effective DECIMAL(15,2) DEFAULT 0,
  interest_rate DECIMAL(5,4) DEFAULT 0,
  interest_amount DECIMAL(15,2) DEFAULT 0,
  commission_rate DECIMAL(5,4) DEFAULT 0,
  commission_amount DECIMAL(15,2) DEFAULT 0,
  expenses DECIMAL(15,2) DEFAULT 0,
  net_amount DECIMAL(15,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Fechas
  discount_date DATE,
  value_date DATE,
  
  -- Estado y referencias
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'sent', 'discounted', 'partial_paid', 'paid', 'returned', 'cancelled')),
  bank_reference TEXT,
  internal_notes TEXT,
  
  -- Contabilidad
  accounting_entry_id UUID,
  is_accounted BOOLEAN DEFAULT false,
  
  -- Documentos adjuntos
  documents JSONB DEFAULT '[]'::jsonb,
  
  -- Auditoría
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Efectos individuales del descuento
CREATE TABLE public.erp_discount_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id UUID REFERENCES public.erp_commercial_discounts(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  
  -- Tipo de efecto
  effect_type TEXT NOT NULL CHECK (effect_type IN ('bill', 'promissory_note', 'receipt', 'check')),
  effect_number TEXT,
  
  -- Partes
  drawer_name TEXT,
  drawer_tax_id TEXT,
  drawee_name TEXT NOT NULL,
  drawee_tax_id TEXT,
  drawee_address TEXT,
  
  -- Importes
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Fechas
  issue_date DATE NOT NULL,
  maturity_date DATE NOT NULL,
  
  -- Domiciliación bancaria
  bank_domiciliation TEXT,
  bank_iban TEXT,
  bank_swift TEXT,
  
  -- Estado
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'discounted', 'paid', 'returned', 'protested')),
  return_reason TEXT,
  return_date DATE,
  payment_date DATE,
  
  -- Referencias
  customer_id UUID,
  invoice_id UUID,
  invoice_number TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Remesas de descuento (agrupación para envío al banco)
CREATE TABLE public.erp_discount_remittances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  remittance_number TEXT NOT NULL,
  entity_id UUID REFERENCES public.erp_financial_entities(id),
  
  -- Totales
  total_effects INTEGER DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  
  -- Estado
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'sent', 'confirmed', 'rejected')),
  generation_date TIMESTAMPTZ,
  sent_date TIMESTAMPTZ,
  confirmation_date TIMESTAMPTZ,
  
  -- Archivo generado
  file_format TEXT DEFAULT 'norma19',
  file_content TEXT,
  file_url TEXT,
  
  -- Referencias
  bank_reference TEXT,
  response_message TEXT,
  
  -- Auditoría
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Relación remesa-efectos
CREATE TABLE public.erp_remittance_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remittance_id UUID REFERENCES public.erp_discount_remittances(id) ON DELETE CASCADE,
  effect_id UUID REFERENCES public.erp_discount_effects(id) ON DELETE CASCADE,
  included_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(remittance_id, effect_id)
);

-- Índices
CREATE INDEX idx_commercial_discounts_company ON public.erp_commercial_discounts(company_id);
CREATE INDEX idx_commercial_discounts_entity ON public.erp_commercial_discounts(entity_id);
CREATE INDEX idx_commercial_discounts_status ON public.erp_commercial_discounts(status);
CREATE INDEX idx_commercial_discounts_date ON public.erp_commercial_discounts(discount_date);

CREATE INDEX idx_discount_effects_discount ON public.erp_discount_effects(discount_id);
CREATE INDEX idx_discount_effects_company ON public.erp_discount_effects(company_id);
CREATE INDEX idx_discount_effects_status ON public.erp_discount_effects(status);
CREATE INDEX idx_discount_effects_maturity ON public.erp_discount_effects(maturity_date);
CREATE INDEX idx_discount_effects_customer ON public.erp_discount_effects(customer_id);

CREATE INDEX idx_discount_remittances_company ON public.erp_discount_remittances(company_id);
CREATE INDEX idx_discount_remittances_entity ON public.erp_discount_remittances(entity_id);

-- RLS
ALTER TABLE public.erp_commercial_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_discount_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_discount_remittances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_remittance_effects ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view commercial discounts" ON public.erp_commercial_discounts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage commercial discounts" ON public.erp_commercial_discounts
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view discount effects" ON public.erp_discount_effects
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage discount effects" ON public.erp_discount_effects
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view remittances" ON public.erp_discount_remittances
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage remittances" ON public.erp_discount_remittances
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view remittance effects" ON public.erp_remittance_effects
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage remittance effects" ON public.erp_remittance_effects
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_erp_commercial_discounts_updated_at
  BEFORE UPDATE ON public.erp_commercial_discounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_erp_discount_effects_updated_at
  BEFORE UPDATE ON public.erp_discount_effects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_erp_discount_remittances_updated_at
  BEFORE UPDATE ON public.erp_discount_remittances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();