-- Create simplified RLS policies for initial setup

-- erp_companies: allow insert if no companies exist
CREATE POLICY "Allow initial company creation" 
ON erp_companies FOR INSERT 
TO authenticated 
WITH CHECK (
  NOT EXISTS (SELECT 1 FROM erp_companies LIMIT 1)
);

-- erp_roles: allow insert for company where user owns the company or no roles exist
CREATE POLICY "Allow initial role creation" 
ON erp_roles FOR INSERT 
TO authenticated 
WITH CHECK (
  NOT EXISTS (SELECT 1 FROM erp_roles LIMIT 1)
  OR EXISTS (
    SELECT 1 FROM erp_user_companies uc
    JOIN erp_role_permissions rp ON rp.role_id = uc.role_id
    JOIN erp_permissions p ON p.id = rp.permission_id
    WHERE uc.user_id = auth.uid() 
    AND uc.company_id = erp_roles.company_id
    AND uc.is_active = true
    AND p.key = 'admin.all'
  )
);

-- erp_role_permissions: allow insert if no role_permissions exist or user is admin
CREATE POLICY "Allow initial role permissions" 
ON erp_role_permissions FOR INSERT 
TO authenticated 
WITH CHECK (
  NOT EXISTS (SELECT 1 FROM erp_role_permissions LIMIT 1)
  OR EXISTS (
    SELECT 1 FROM erp_user_companies uc
    JOIN erp_role_permissions rp2 ON rp2.role_id = uc.role_id
    JOIN erp_permissions p ON p.id = rp2.permission_id
    WHERE uc.user_id = auth.uid()
    AND uc.is_active = true
    AND p.key = 'admin.all'
  )
);

-- erp_user_companies: allow insert for initial assignment or by admin
CREATE POLICY "Allow initial user assignment" 
ON erp_user_companies FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Allow if inserting own user_id and no assignments exist
  (user_id = auth.uid() AND NOT EXISTS (SELECT 1 FROM erp_user_companies LIMIT 1))
  -- Or user is admin
  OR EXISTS (
    SELECT 1 FROM erp_user_companies uc
    JOIN erp_role_permissions rp ON rp.role_id = uc.role_id
    JOIN erp_permissions p ON p.id = rp.permission_id
    WHERE uc.user_id = auth.uid()
    AND uc.is_active = true
    AND p.key = 'admin.all'
  )
);