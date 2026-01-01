-- Definitive fix for ERP initial setup: avoid RLS-blocked subqueries in policies
-- 1) Provide SECURITY DEFINER helpers to read role->company mapping without depending on SELECT policies
-- 2) Recreate INSERT policies to use these helpers (prevents recursion + prevents NULL bypass)

-- === Helpers ===
CREATE OR REPLACE FUNCTION public.erp_role_company_id(p_role_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT company_id
  FROM public.erp_roles
  WHERE id = p_role_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.erp_role_belongs_to_company(p_role_id uuid, p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.erp_roles
    WHERE id = p_role_id
      AND company_id = p_company_id
    LIMIT 1
  );
$$;

-- === Fix erp_user_companies INSERT policy ===
DROP POLICY IF EXISTS "erp_user_companies_insert_v3" ON public.erp_user_companies;

CREATE POLICY "erp_user_companies_insert_v4"
ON public.erp_user_companies
FOR INSERT
TO authenticated
WITH CHECK (
  public.erp_role_belongs_to_company(role_id, company_id)
  AND (
    public.erp_is_company_admin(auth.uid(), company_id)
    OR (
      user_id = auth.uid()
      AND NOT public.erp_company_has_users(company_id)
    )
  )
);

-- === Fix erp_role_permissions INSERT policy ===
DROP POLICY IF EXISTS "erp_role_permissions_insert_v3" ON public.erp_role_permissions;

CREATE POLICY "erp_role_permissions_insert_v4"
ON public.erp_role_permissions
FOR INSERT
TO authenticated
WITH CHECK (
  public.erp_role_company_id(role_id) IS NOT NULL
  AND (
    NOT public.erp_company_has_role_permissions(public.erp_role_company_id(role_id))
    OR public.erp_is_company_admin(auth.uid(), public.erp_role_company_id(role_id))
  )
);
