-- Fix infinite recursion on erp_user_companies INSERT policy
-- The previous policy referenced erp_user_companies inside its own WITH CHECK.

DROP POLICY IF EXISTS "erp_user_companies_insert_v2" ON public.erp_user_companies;

-- Helper: check if a company already has any user-company memberships (bypasses RLS)
CREATE OR REPLACE FUNCTION public.erp_company_has_users(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.erp_user_companies uc
    WHERE uc.company_id = p_company_id
    LIMIT 1
  );
$$;

-- New INSERT policy:
-- - Allow the first membership row for a company (bootstrap) when user is adding themselves
-- - Allow admins to manage memberships
-- - Enforce that role_id belongs to the same company
CREATE POLICY "erp_user_companies_insert_v3"
ON public.erp_user_companies
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.erp_roles r
    WHERE r.id = role_id
      AND r.company_id = company_id
  )
  AND (
    public.erp_is_company_admin(auth.uid(), company_id)
    OR (
      user_id = auth.uid()
      AND NOT public.erp_company_has_users(company_id)
    )
  )
);
