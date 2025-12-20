-- Drop and recreate RLS policies for partner_applications to ensure public access
DROP POLICY IF EXISTS "Anyone can view published applications" ON partner_applications;
CREATE POLICY "Anyone can view published applications" 
ON partner_applications 
FOR SELECT 
TO public, anon, authenticated
USING (status = 'published');

-- Drop and recreate RLS policies for partner_companies to ensure public access
DROP POLICY IF EXISTS "Anyone can view active partner companies" ON partner_companies;
CREATE POLICY "Anyone can view active partner companies" 
ON partner_companies 
FOR SELECT 
TO public, anon, authenticated
USING (status = 'active');

-- Ensure premium_integrations policy also covers all roles
DROP POLICY IF EXISTS "Anyone can view active integrations" ON premium_integrations;
CREATE POLICY "Anyone can view active integrations" 
ON premium_integrations 
FOR SELECT 
TO public, anon, authenticated
USING (is_active = true);