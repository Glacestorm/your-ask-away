-- Drop existing policies on company_bank_affiliations
DROP POLICY IF EXISTS "Admins full access to bank affiliations" ON public.company_bank_affiliations;
DROP POLICY IF EXISTS "Gestores manage their companies affiliations" ON public.company_bank_affiliations;
DROP POLICY IF EXISTS "Gestores view their companies affiliations" ON public.company_bank_affiliations;

-- Create separate policies for better clarity
CREATE POLICY "Gestores view their companies affiliations"
ON public.company_bank_affiliations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id = company_bank_affiliations.company_id
    AND companies.gestor_id = auth.uid()
  )
);

CREATE POLICY "Gestores insert affiliations for their companies"
ON public.company_bank_affiliations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id = company_bank_affiliations.company_id
    AND companies.gestor_id = auth.uid()
  )
);

CREATE POLICY "Gestores update their companies affiliations"
ON public.company_bank_affiliations
FOR UPDATE
TO authenticated
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

CREATE POLICY "Gestores delete their companies affiliations"
ON public.company_bank_affiliations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id = company_bank_affiliations.company_id
    AND companies.gestor_id = auth.uid()
  )
);

-- Admins have full access
CREATE POLICY "Admins full access to bank affiliations"
ON public.company_bank_affiliations
FOR ALL
TO authenticated
USING (is_admin_or_superadmin(auth.uid()))
WITH CHECK (is_admin_or_superadmin(auth.uid()));