-- Fix infinite recursion on erp_roles by simplifying INSERT policies

-- Drop conflicting policies on erp_roles
DROP POLICY IF EXISTS "Allow initial role creation" ON public.erp_roles;
DROP POLICY IF EXISTS "erp_roles_insert" ON public.erp_roles;

-- Create a helper function to check if a company has any roles (bypassing RLS)
CREATE OR REPLACE FUNCTION public.erp_company_has_roles(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.erp_roles WHERE company_id = p_company_id LIMIT 1
  );
$$;

-- Simplified INSERT policy for erp_roles:
-- Allow INSERT if:
--   1. The company has no roles yet (initial setup) OR
--   2. User is already an admin of that company
CREATE POLICY "erp_roles_insert_v2"
ON public.erp_roles
FOR INSERT
TO authenticated
WITH CHECK (
  (NOT erp_company_has_roles(company_id))
  OR erp_is_company_admin(auth.uid(), company_id)
);