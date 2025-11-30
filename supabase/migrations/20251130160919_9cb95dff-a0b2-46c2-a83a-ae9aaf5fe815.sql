-- Drop all existing policies on company_bank_affiliations
DROP POLICY IF EXISTS "Admins can manage all bank affiliations" ON public.company_bank_affiliations;
DROP POLICY IF EXISTS "Gestores can view affiliations of their companies" ON public.company_bank_affiliations;
DROP POLICY IF EXISTS "Gestores can insert affiliations for their companies" ON public.company_bank_affiliations;
DROP POLICY IF EXISTS "Gestores can update affiliations of their companies" ON public.company_bank_affiliations;
DROP POLICY IF EXISTS "Gestores can delete affiliations of their companies" ON public.company_bank_affiliations;

-- Create simplified policies that work correctly
-- Admin full access
CREATE POLICY "Admins full access to bank affiliations"
ON public.company_bank_affiliations
FOR ALL
USING (public.is_admin_or_superadmin(auth.uid()))
WITH CHECK (public.is_admin_or_superadmin(auth.uid()));

-- Gestores can view their companies' affiliations
CREATE POLICY "Gestores view their companies affiliations"
ON public.company_bank_affiliations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id = company_bank_affiliations.company_id
    AND companies.gestor_id = auth.uid()
  )
);

-- Gestores can manage (INSERT, UPDATE, DELETE) their companies' affiliations
CREATE POLICY "Gestores manage their companies affiliations"
ON public.company_bank_affiliations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id = company_bank_affiliations.company_id
    AND companies.gestor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id = company_bank_affiliations.company_id
    AND companies.gestor_id = auth.uid()
  )
);