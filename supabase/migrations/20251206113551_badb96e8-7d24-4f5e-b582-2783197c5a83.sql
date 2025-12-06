
-- Create table for consolidation groups
CREATE TABLE public.consolidation_groups (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_name TEXT NOT NULL,
    fiscal_year INTEGER NOT NULL,
    parent_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    notes TEXT
);

-- Create table for consolidation group members
CREATE TABLE public.consolidation_group_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.consolidation_groups(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    consolidation_method TEXT NOT NULL DEFAULT 'global' CHECK (consolidation_method IN ('global', 'proportional', 'equity')),
    participation_percentage NUMERIC NOT NULL DEFAULT 100 CHECK (participation_percentage >= 0 AND participation_percentage <= 100),
    is_parent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(group_id, company_id)
);

-- Create table for consolidated financial statements
CREATE TABLE public.consolidated_financial_statements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.consolidation_groups(id) ON DELETE CASCADE,
    fiscal_year INTEGER NOT NULL,
    statement_type TEXT NOT NULL DEFAULT 'normal' CHECK (statement_type IN ('normal', 'abreujat', 'simplificat')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved')),
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'pdf_import', 'calculated')),
    created_by UUID REFERENCES public.profiles(id),
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for consolidated balance sheet data
CREATE TABLE public.consolidated_balance_sheets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    statement_id UUID NOT NULL REFERENCES public.consolidated_financial_statements(id) ON DELETE CASCADE,
    -- Assets
    intangible_assets NUMERIC DEFAULT 0,
    goodwill NUMERIC DEFAULT 0,
    tangible_assets NUMERIC DEFAULT 0,
    real_estate_investments NUMERIC DEFAULT 0,
    long_term_group_investments NUMERIC DEFAULT 0,
    long_term_financial_investments NUMERIC DEFAULT 0,
    deferred_tax_assets NUMERIC DEFAULT 0,
    long_term_trade_receivables NUMERIC DEFAULT 0,
    non_current_assets_held_for_sale NUMERIC DEFAULT 0,
    accruals_assets NUMERIC DEFAULT 0,
    inventory NUMERIC DEFAULT 0,
    trade_receivables NUMERIC DEFAULT 0,
    short_term_group_receivables NUMERIC DEFAULT 0,
    short_term_financial_investments NUMERIC DEFAULT 0,
    cash_equivalents NUMERIC DEFAULT 0,
    -- Equity
    share_capital NUMERIC DEFAULT 0,
    share_premium NUMERIC DEFAULT 0,
    revaluation_reserve NUMERIC DEFAULT 0,
    legal_reserve NUMERIC DEFAULT 0,
    statutory_reserves NUMERIC DEFAULT 0,
    voluntary_reserves NUMERIC DEFAULT 0,
    retained_earnings NUMERIC DEFAULT 0,
    current_year_result NUMERIC DEFAULT 0,
    interim_dividend NUMERIC DEFAULT 0,
    treasury_shares NUMERIC DEFAULT 0,
    other_equity_instruments NUMERIC DEFAULT 0,
    translation_differences NUMERIC DEFAULT 0,
    available_for_sale_assets_adjustment NUMERIC DEFAULT 0,
    hedging_operations_adjustment NUMERIC DEFAULT 0,
    other_value_adjustments NUMERIC DEFAULT 0,
    capital_grants NUMERIC DEFAULT 0,
    -- Minority interests (specific to consolidated)
    minority_interests NUMERIC DEFAULT 0,
    -- Liabilities
    long_term_provisions NUMERIC DEFAULT 0,
    long_term_debts NUMERIC DEFAULT 0,
    long_term_group_debts NUMERIC DEFAULT 0,
    deferred_tax_liabilities NUMERIC DEFAULT 0,
    long_term_accruals NUMERIC DEFAULT 0,
    liabilities_held_for_sale NUMERIC DEFAULT 0,
    short_term_provisions NUMERIC DEFAULT 0,
    short_term_debts NUMERIC DEFAULT 0,
    short_term_group_debts NUMERIC DEFAULT 0,
    trade_payables NUMERIC DEFAULT 0,
    other_creditors NUMERIC DEFAULT 0,
    short_term_accruals NUMERIC DEFAULT 0,
    -- Consolidation adjustments
    intercompany_eliminations NUMERIC DEFAULT 0,
    goodwill_eliminations NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consolidation_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consolidation_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consolidated_financial_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consolidated_balance_sheets ENABLE ROW LEVEL SECURITY;

-- RLS policies for consolidation_groups
CREATE POLICY "Admins can manage all consolidation groups"
ON public.consolidation_groups FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view consolidation groups"
ON public.consolidation_groups FOR SELECT
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'auditor'::app_role));

-- RLS policies for consolidation_group_members
CREATE POLICY "Admins can manage all group members"
ON public.consolidation_group_members FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view group members"
ON public.consolidation_group_members FOR SELECT
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'auditor'::app_role));

-- RLS policies for consolidated_financial_statements
CREATE POLICY "Admins can manage consolidated statements"
ON public.consolidated_financial_statements FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view consolidated statements"
ON public.consolidated_financial_statements FOR SELECT
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'auditor'::app_role));

-- RLS policies for consolidated_balance_sheets
CREATE POLICY "Admins can manage consolidated balance sheets"
ON public.consolidated_balance_sheets FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view consolidated balance sheets"
ON public.consolidated_balance_sheets FOR SELECT
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'auditor'::app_role));

-- Create indexes for performance
CREATE INDEX idx_consolidation_groups_parent ON public.consolidation_groups(parent_company_id);
CREATE INDEX idx_consolidation_groups_fiscal_year ON public.consolidation_groups(fiscal_year);
CREATE INDEX idx_consolidation_group_members_company ON public.consolidation_group_members(company_id);
CREATE INDEX idx_consolidation_group_members_group ON public.consolidation_group_members(group_id);
CREATE INDEX idx_consolidated_statements_group ON public.consolidated_financial_statements(group_id);

-- Create trigger for updated_at
CREATE TRIGGER update_consolidation_groups_updated_at
BEFORE UPDATE ON public.consolidation_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consolidated_balance_sheets_updated_at
BEFORE UPDATE ON public.consolidated_balance_sheets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consolidated_financial_statements_updated_at
BEFORE UPDATE ON public.consolidated_financial_statements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
