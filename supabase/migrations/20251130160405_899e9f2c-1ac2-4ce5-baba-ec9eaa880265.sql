-- Drop existing policies
DROP POLICY IF EXISTS "Admins pueden gestionar afiliaciones bancarias" ON public.company_bank_affiliations;
DROP POLICY IF EXISTS "Gestores pueden ver afiliaciones de sus empresas" ON public.company_bank_affiliations;

-- Allow admins full access
CREATE POLICY "Admins can manage all bank affiliations"
ON public.company_bank_affiliations
FOR ALL
USING (public.is_admin_or_superadmin(auth.uid()));

-- Allow gestores to view affiliations of their companies
CREATE POLICY "Gestores can view affiliations of their companies"
ON public.company_bank_affiliations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id = company_bank_affiliations.company_id
    AND (companies.gestor_id = auth.uid() OR public.is_admin_or_superadmin(auth.uid()))
  )
);

-- Allow gestores to insert affiliations for their companies
CREATE POLICY "Gestores can insert affiliations for their companies"
ON public.company_bank_affiliations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id = company_bank_affiliations.company_id
    AND (companies.gestor_id = auth.uid() OR public.is_admin_or_superadmin(auth.uid()))
  )
);

-- Allow gestores to update affiliations of their companies
CREATE POLICY "Gestores can update affiliations of their companies"
ON public.company_bank_affiliations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id = company_bank_affiliations.company_id
    AND (companies.gestor_id = auth.uid() OR public.is_admin_or_superadmin(auth.uid()))
  )
);

-- Allow gestores to delete affiliations of their companies
CREATE POLICY "Gestores can delete affiliations of their companies"
ON public.company_bank_affiliations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id = company_bank_affiliations.company_id
    AND (companies.gestor_id = auth.uid() OR public.is_admin_or_superadmin(auth.uid()))
  )
);