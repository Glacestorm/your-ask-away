-- Factoring Contracts Table
CREATE TABLE public.erp_factoring_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  contract_number TEXT NOT NULL,
  financial_entity_id UUID REFERENCES public.erp_financial_entities(id),
  contract_type TEXT NOT NULL DEFAULT 'with_recourse', -- 'with_recourse', 'without_recourse', 'reverse_factoring'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'terminated', 'expired'
  
  -- Limits
  global_limit NUMERIC(15,2) NOT NULL DEFAULT 0,
  used_limit NUMERIC(15,2) NOT NULL DEFAULT 0,
  available_limit NUMERIC(15,2) GENERATED ALWAYS AS (global_limit - used_limit) STORED,
  
  -- Conditions
  advance_percentage NUMERIC(5,2) NOT NULL DEFAULT 80,
  interest_rate NUMERIC(5,4) NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Debtor limits (JSONB for flexibility)
  debtor_limits JSONB DEFAULT '{}',
  
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Factoring Assignments (Invoice Assignments)
CREATE TABLE public.erp_factoring_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  contract_id UUID NOT NULL REFERENCES public.erp_factoring_contracts(id) ON DELETE CASCADE,
  
  -- Invoice Reference (no FK, just store data)
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Debtor Info
  debtor_id UUID REFERENCES public.erp_trade_partners(id),
  debtor_name TEXT NOT NULL,
  debtor_tax_id TEXT,
  
  -- Amounts
  invoice_amount NUMERIC(15,2) NOT NULL,
  assigned_amount NUMERIC(15,2) NOT NULL,
  advance_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  advance_percentage NUMERIC(5,2) NOT NULL DEFAULT 80,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Dates
  assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  advance_date DATE,
  collection_date DATE,
  
  -- Settlement
  collected_amount NUMERIC(15,2),
  interest_charged NUMERIC(15,2) DEFAULT 0,
  commission_charged NUMERIC(15,2) DEFAULT 0,
  net_settlement NUMERIC(15,2),
  
  -- Recourse
  recourse_date DATE,
  recourse_exercised BOOLEAN DEFAULT false,
  
  currency TEXT NOT NULL DEFAULT 'EUR',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_factoring_contracts_company ON public.erp_factoring_contracts(company_id);
CREATE INDEX idx_factoring_contracts_entity ON public.erp_factoring_contracts(financial_entity_id);
CREATE INDEX idx_factoring_contracts_status ON public.erp_factoring_contracts(status);
CREATE INDEX idx_factoring_assignments_contract ON public.erp_factoring_assignments(contract_id);
CREATE INDEX idx_factoring_assignments_debtor ON public.erp_factoring_assignments(debtor_id);
CREATE INDEX idx_factoring_assignments_status ON public.erp_factoring_assignments(status);
CREATE INDEX idx_factoring_assignments_due_date ON public.erp_factoring_assignments(due_date);

-- Enable RLS
ALTER TABLE public.erp_factoring_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_factoring_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contracts
CREATE POLICY "Users can view factoring contracts" ON public.erp_factoring_contracts FOR SELECT USING (true);
CREATE POLICY "Users can insert factoring contracts" ON public.erp_factoring_contracts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update factoring contracts" ON public.erp_factoring_contracts FOR UPDATE USING (true);
CREATE POLICY "Users can delete factoring contracts" ON public.erp_factoring_contracts FOR DELETE USING (true);

-- RLS Policies for assignments
CREATE POLICY "Users can view factoring assignments" ON public.erp_factoring_assignments FOR SELECT USING (true);
CREATE POLICY "Users can insert factoring assignments" ON public.erp_factoring_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update factoring assignments" ON public.erp_factoring_assignments FOR UPDATE USING (true);
CREATE POLICY "Users can delete factoring assignments" ON public.erp_factoring_assignments FOR DELETE USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_erp_factoring_contracts_updated_at
  BEFORE UPDATE ON public.erp_factoring_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_erp_factoring_assignments_updated_at
  BEFORE UPDATE ON public.erp_factoring_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();