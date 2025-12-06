
-- Create enum for period types
CREATE TYPE provisional_period_type AS ENUM ('quarterly', 'semiannual', 'annual');

-- Create provisional financial statements table
CREATE TABLE public.provisional_financial_statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  period_type provisional_period_type NOT NULL DEFAULT 'annual',
  period_number INTEGER NOT NULL DEFAULT 1, -- Q1-Q4, S1-S2, or 1 for annual
  statement_type financial_statement_type NOT NULL DEFAULT 'abreujat',
  status financial_statement_status NOT NULL DEFAULT 'draft',
  source financial_data_source NOT NULL DEFAULT 'manual',
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, fiscal_year, period_type, period_number)
);

-- Create provisional balance sheets table
CREATE TABLE public.provisional_balance_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provisional_statement_id UUID NOT NULL REFERENCES public.provisional_financial_statements(id) ON DELETE CASCADE,
  -- Assets
  intangible_assets NUMERIC DEFAULT 0,
  tangible_assets NUMERIC DEFAULT 0,
  real_estate_investments NUMERIC DEFAULT 0,
  long_term_financial_investments NUMERIC DEFAULT 0,
  deferred_tax_assets NUMERIC DEFAULT 0,
  inventory NUMERIC DEFAULT 0,
  trade_receivables NUMERIC DEFAULT 0,
  short_term_financial_investments NUMERIC DEFAULT 0,
  cash_equivalents NUMERIC DEFAULT 0,
  -- Equity
  share_capital NUMERIC DEFAULT 0,
  share_premium NUMERIC DEFAULT 0,
  reserves NUMERIC DEFAULT 0,
  retained_earnings NUMERIC DEFAULT 0,
  current_year_result NUMERIC DEFAULT 0,
  -- Liabilities
  long_term_provisions NUMERIC DEFAULT 0,
  long_term_debts NUMERIC DEFAULT 0,
  deferred_tax_liabilities NUMERIC DEFAULT 0,
  short_term_provisions NUMERIC DEFAULT 0,
  short_term_debts NUMERIC DEFAULT 0,
  trade_payables NUMERIC DEFAULT 0,
  other_creditors NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provisional_statement_id)
);

-- Create provisional income statements table
CREATE TABLE public.provisional_income_statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provisional_statement_id UUID NOT NULL REFERENCES public.provisional_financial_statements(id) ON DELETE CASCADE,
  net_turnover NUMERIC DEFAULT 0,
  inventory_variation NUMERIC DEFAULT 0,
  capitalized_work NUMERIC DEFAULT 0,
  supplies NUMERIC DEFAULT 0,
  other_operating_income NUMERIC DEFAULT 0,
  personnel_expenses NUMERIC DEFAULT 0,
  other_operating_expenses NUMERIC DEFAULT 0,
  depreciation NUMERIC DEFAULT 0,
  operating_grants NUMERIC DEFAULT 0,
  impairment_trade_operations NUMERIC DEFAULT 0,
  other_operating_results NUMERIC DEFAULT 0,
  financial_income NUMERIC DEFAULT 0,
  financial_expenses NUMERIC DEFAULT 0,
  exchange_differences NUMERIC DEFAULT 0,
  impairment_financial_instruments NUMERIC DEFAULT 0,
  other_financial_results NUMERIC DEFAULT 0,
  corporate_tax NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provisional_statement_id)
);

-- Enable RLS
ALTER TABLE public.provisional_financial_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provisional_balance_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provisional_income_statements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for provisional_financial_statements
CREATE POLICY "Admins can manage all provisional statements" 
ON public.provisional_financial_statements 
FOR ALL 
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view provisional statements of their companies" 
ON public.provisional_financial_statements 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = provisional_financial_statements.company_id
    AND (c.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
  )
  AND NOT has_role(auth.uid(), 'auditor'::app_role)
);

CREATE POLICY "Users can insert provisional statements for their companies" 
ON public.provisional_financial_statements 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = provisional_financial_statements.company_id
    AND (c.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
  )
  AND NOT has_role(auth.uid(), 'auditor'::app_role)
);

CREATE POLICY "Users can update provisional statements of their companies" 
ON public.provisional_financial_statements 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = provisional_financial_statements.company_id
    AND (c.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
  )
  AND NOT has_role(auth.uid(), 'auditor'::app_role)
);

CREATE POLICY "Users can delete provisional statements of their companies" 
ON public.provisional_financial_statements 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = provisional_financial_statements.company_id
    AND (c.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
  )
  AND NOT has_role(auth.uid(), 'auditor'::app_role)
);

-- RLS Policies for provisional_balance_sheets
CREATE POLICY "Admins can manage all provisional balance sheets" 
ON public.provisional_balance_sheets 
FOR ALL 
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view provisional balance sheets" 
ON public.provisional_balance_sheets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM provisional_financial_statements pfs
    JOIN companies c ON c.id = pfs.company_id
    WHERE pfs.id = provisional_balance_sheets.provisional_statement_id
    AND (c.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
  )
  AND NOT has_role(auth.uid(), 'auditor'::app_role)
);

CREATE POLICY "Users can insert provisional balance sheets" 
ON public.provisional_balance_sheets 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM provisional_financial_statements pfs
    JOIN companies c ON c.id = pfs.company_id
    WHERE pfs.id = provisional_balance_sheets.provisional_statement_id
    AND (c.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
  )
  AND NOT has_role(auth.uid(), 'auditor'::app_role)
);

CREATE POLICY "Users can update provisional balance sheets" 
ON public.provisional_balance_sheets 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM provisional_financial_statements pfs
    JOIN companies c ON c.id = pfs.company_id
    WHERE pfs.id = provisional_balance_sheets.provisional_statement_id
    AND (c.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
  )
  AND NOT has_role(auth.uid(), 'auditor'::app_role)
);

-- RLS Policies for provisional_income_statements
CREATE POLICY "Admins can manage all provisional income statements" 
ON public.provisional_income_statements 
FOR ALL 
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view provisional income statements" 
ON public.provisional_income_statements 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM provisional_financial_statements pfs
    JOIN companies c ON c.id = pfs.company_id
    WHERE pfs.id = provisional_income_statements.provisional_statement_id
    AND (c.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
  )
  AND NOT has_role(auth.uid(), 'auditor'::app_role)
);

CREATE POLICY "Users can insert provisional income statements" 
ON public.provisional_income_statements 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM provisional_financial_statements pfs
    JOIN companies c ON c.id = pfs.company_id
    WHERE pfs.id = provisional_income_statements.provisional_statement_id
    AND (c.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
  )
  AND NOT has_role(auth.uid(), 'auditor'::app_role)
);

CREATE POLICY "Users can update provisional income statements" 
ON public.provisional_income_statements 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM provisional_financial_statements pfs
    JOIN companies c ON c.id = pfs.company_id
    WHERE pfs.id = provisional_income_statements.provisional_statement_id
    AND (c.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
  )
  AND NOT has_role(auth.uid(), 'auditor'::app_role)
);

-- Create indexes for performance
CREATE INDEX idx_provisional_statements_company ON public.provisional_financial_statements(company_id);
CREATE INDEX idx_provisional_statements_year ON public.provisional_financial_statements(fiscal_year);
CREATE INDEX idx_provisional_balance_statement ON public.provisional_balance_sheets(provisional_statement_id);
CREATE INDEX idx_provisional_income_statement ON public.provisional_income_statements(provisional_statement_id);

-- Create trigger for updated_at
CREATE TRIGGER update_provisional_statements_updated_at
BEFORE UPDATE ON public.provisional_financial_statements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provisional_balance_updated_at
BEFORE UPDATE ON public.provisional_balance_sheets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provisional_income_updated_at
BEFORE UPDATE ON public.provisional_income_statements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
