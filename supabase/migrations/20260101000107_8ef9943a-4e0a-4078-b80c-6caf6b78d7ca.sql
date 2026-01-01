-- Fix infinite recursion on erp_role_permissions by removing self-referential policy logic

-- Drop problematic policy (it referenced erp_role_permissions inside its own WITH CHECK)
DROP POLICY IF EXISTS "erp_role_permissions_insert_v2" ON public.erp_role_permissions;

-- Helper: check if a company already has any role permissions (bypasses RLS)
CREATE OR REPLACE FUNCTION public.erp_company_has_role_permissions(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.erp_role_permissions rp
    JOIN public.erp_roles r ON r.id = rp.role_id
    WHERE r.company_id = p_company_id
    LIMIT 1
  );
$$;

-- New INSERT policy:
-- - Allow inserting role permissions during initial setup (no role permissions yet for that company)
-- - Or allow if user is admin of that company
CREATE POLICY "erp_role_permissions_insert_v3"
ON public.erp_role_permissions
FOR INSERT
TO authenticated
WITH CHECK (
  (
    NOT public.erp_company_has_role_permissions(
      (SELECT r.company_id FROM public.erp_roles r WHERE r.id = role_id)
    )
  )
  OR public.erp_is_company_admin(
    auth.uid(),
    (SELECT r.company_id FROM public.erp_roles r WHERE r.id = role_id)
  )
);
