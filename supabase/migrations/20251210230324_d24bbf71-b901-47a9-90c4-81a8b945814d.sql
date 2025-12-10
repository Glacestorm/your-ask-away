-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Service role can insert login locations" ON public.user_login_locations;

-- Create a proper INSERT policy - users can only insert their own login locations
CREATE POLICY "Users can insert own login locations"
ON public.user_login_locations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Update SELECT policy to include security personnel (auditors)
DROP POLICY IF EXISTS "Users can view own login locations" ON public.user_login_locations;

CREATE POLICY "Users and security personnel can view login locations"
ON public.user_login_locations
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  is_admin_or_superadmin(auth.uid()) OR
  has_role(auth.uid(), 'auditor'::app_role)
);

-- Add DELETE policy - only admins can delete location history
CREATE POLICY "Admins can delete login locations"
ON public.user_login_locations
FOR DELETE
TO authenticated
USING (is_admin_or_superadmin(auth.uid()));

-- Add UPDATE policy - location data should be immutable, only admins can update if needed
CREATE POLICY "Admins can update login locations"
ON public.user_login_locations
FOR UPDATE
TO authenticated
USING (is_admin_or_superadmin(auth.uid()))
WITH CHECK (is_admin_or_superadmin(auth.uid()));