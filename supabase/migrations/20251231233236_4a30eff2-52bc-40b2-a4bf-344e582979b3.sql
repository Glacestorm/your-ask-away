-- Drop all problematic policies on erp_companies
DROP POLICY IF EXISTS "Allow initial company creation" ON erp_companies;
DROP POLICY IF EXISTS "erp_companies_insert" ON erp_companies;
DROP POLICY IF EXISTS "erp_companies_select" ON erp_companies;
DROP POLICY IF EXISTS "erp_companies_update" ON erp_companies;

-- Drop conflicting policies on erp_user_companies
DROP POLICY IF EXISTS "Allow initial user assignment" ON erp_user_companies;
DROP POLICY IF EXISTS "erp_user_companies_insert" ON erp_user_companies;

-- Drop conflicting policies on erp_role_permissions
DROP POLICY IF EXISTS "Allow initial role permissions" ON erp_role_permissions;
DROP POLICY IF EXISTS "erp_role_permissions_insert" ON erp_role_permissions;

-- Create a helper function that doesn't cause recursion
CREATE OR REPLACE FUNCTION erp_is_company_admin(p_user_id uuid, p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM erp_user_companies uc
    JOIN erp_role_permissions rp ON rp.role_id = uc.role_id
    JOIN erp_permissions p ON p.id = rp.permission_id
    WHERE uc.user_id = p_user_id
      AND uc.company_id = p_company_id
      AND uc.is_active = true
      AND p.key = 'admin.all'
  );
$$;

-- Create a function to check if any companies exist (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION erp_has_any_companies()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM erp_companies LIMIT 1);
$$;

-- Create a function to get user companies bypassing RLS
CREATE OR REPLACE FUNCTION erp_get_user_company_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id 
  FROM erp_user_companies 
  WHERE user_id = p_user_id AND is_active = true;
$$;

-- Simple SELECT policy using SECURITY DEFINER function
CREATE POLICY "erp_companies_select" ON erp_companies
FOR SELECT TO authenticated
USING (id IN (SELECT erp_get_user_company_ids(auth.uid())));

-- INSERT policy: allow first company OR user is admin of an existing company
CREATE POLICY "erp_companies_insert" ON erp_companies
FOR INSERT TO authenticated
WITH CHECK (
  NOT erp_has_any_companies()  -- First company ever
  OR EXISTS (  -- Or user is admin in at least one company
    SELECT 1 FROM erp_get_user_company_ids(auth.uid())
  )
);

-- UPDATE policy using SECURITY DEFINER function
CREATE POLICY "erp_companies_update" ON erp_companies
FOR UPDATE TO authenticated
USING (erp_is_company_admin(auth.uid(), id));

-- Fix erp_user_companies INSERT policy
CREATE POLICY "erp_user_companies_insert_v2" ON erp_user_companies
FOR INSERT TO authenticated
WITH CHECK (
  -- First user assignment (during initial setup) - user assigns themselves
  (user_id = auth.uid() AND NOT erp_has_any_companies())
  OR
  -- User is admin of the company they're assigning to
  erp_is_company_admin(auth.uid(), company_id)
  OR
  -- User is assigning themselves to a company with no users yet
  (user_id = auth.uid() AND NOT EXISTS (
    SELECT 1 FROM erp_user_companies uc2 WHERE uc2.company_id = company_id
  ))
);

-- Fix erp_role_permissions INSERT policy
CREATE POLICY "erp_role_permissions_insert_v2" ON erp_role_permissions
FOR INSERT TO authenticated
WITH CHECK (
  -- First assignment (no permissions exist for this company's roles)
  NOT EXISTS (
    SELECT 1 FROM erp_role_permissions rp2
    JOIN erp_roles r ON r.id = rp2.role_id
    JOIN erp_roles r_new ON r_new.id = role_id
    WHERE r.company_id = r_new.company_id
  )
  OR
  -- User is admin of the company that owns the role
  EXISTS (
    SELECT 1 FROM erp_roles r
    WHERE r.id = role_id AND erp_is_company_admin(auth.uid(), r.company_id)
  )
);