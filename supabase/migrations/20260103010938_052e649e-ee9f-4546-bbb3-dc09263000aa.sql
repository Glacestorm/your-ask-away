-- =============================================
-- PHASE 5: BANK GUARANTEES (AVALES BANCARIOS)
-- =============================================

-- Table: erp_bank_guarantees
CREATE TABLE public.erp_bank_guarantees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  
  -- Guarantee identification
  guarantee_number TEXT NOT NULL,
  guarantee_type TEXT NOT NULL CHECK (guarantee_type IN ('bid_bond', 'performance_bond', 'advance_payment', 'warranty', 'customs', 'rental', 'other')),
  
  -- Parties involved
  applicant_id UUID REFERENCES public.erp_trade_partners(id),
  beneficiary_id UUID REFERENCES public.erp_trade_partners(id),
  issuing_bank_id UUID REFERENCES public.erp_financial_entities(id),
  
  -- Amounts
  amount NUMERIC(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Dates
  issue_date DATE NOT NULL,
  effective_date DATE,
  expiry_date DATE NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'requested', 'issued', 'active', 'claimed', 'released', 'expired', 'cancelled')),
  
  -- Terms
  underlying_contract TEXT,
  purpose TEXT,
  terms_conditions TEXT,
  auto_renewal BOOLEAN DEFAULT false,
  renewal_period_months INTEGER,
  
  -- Costs
  commission_rate NUMERIC(5,4),
  commission_amount NUMERIC(18,2),
  issuance_fee NUMERIC(18,2),
  
  -- Additional info
  notes TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Table: erp_guarantee_claims
CREATE TABLE public.erp_guarantee_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guarantee_id UUID NOT NULL REFERENCES public.erp_bank_guarantees(id) ON DELETE CASCADE,
  
  claim_number TEXT NOT NULL,
  claim_date DATE NOT NULL,
  claim_amount NUMERIC(18,2) NOT NULL,
  
  -- Claim details
  reason TEXT NOT NULL,
  claimant_documents JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'under_review', 'accepted', 'partially_accepted', 'rejected', 'paid')),
  
  -- Resolution
  accepted_amount NUMERIC(18,2),
  payment_date DATE,
  rejection_reason TEXT,
  
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.erp_bank_guarantees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_guarantee_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies for erp_bank_guarantees
CREATE POLICY "Users can view guarantees of their companies"
  ON public.erp_bank_guarantees FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can insert guarantees for their companies"
  ON public.erp_bank_guarantees FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can update guarantees of their companies"
  ON public.erp_bank_guarantees FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can delete guarantees of their companies"
  ON public.erp_bank_guarantees FOR DELETE
  USING (company_id IN (
    SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true
  ));

-- RLS Policies for erp_guarantee_claims
CREATE POLICY "Users can view claims of their guarantees"
  ON public.erp_guarantee_claims FOR SELECT
  USING (guarantee_id IN (
    SELECT id FROM public.erp_bank_guarantees WHERE company_id IN (
      SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true
    )
  ));

CREATE POLICY "Users can insert claims for their guarantees"
  ON public.erp_guarantee_claims FOR INSERT
  WITH CHECK (guarantee_id IN (
    SELECT id FROM public.erp_bank_guarantees WHERE company_id IN (
      SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true
    )
  ));

CREATE POLICY "Users can update claims of their guarantees"
  ON public.erp_guarantee_claims FOR UPDATE
  USING (guarantee_id IN (
    SELECT id FROM public.erp_bank_guarantees WHERE company_id IN (
      SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true
    )
  ));

-- Indexes
CREATE INDEX idx_erp_bank_guarantees_company ON public.erp_bank_guarantees(company_id);
CREATE INDEX idx_erp_bank_guarantees_status ON public.erp_bank_guarantees(status);
CREATE INDEX idx_erp_bank_guarantees_expiry ON public.erp_bank_guarantees(expiry_date);
CREATE INDEX idx_erp_guarantee_claims_guarantee ON public.erp_guarantee_claims(guarantee_id);

-- Triggers for updated_at
CREATE TRIGGER update_erp_bank_guarantees_updated_at
  BEFORE UPDATE ON public.erp_bank_guarantees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_erp_guarantee_claims_updated_at
  BEFORE UPDATE ON public.erp_guarantee_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();