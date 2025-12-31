-- Fix RLS: allow authenticated users to create ERP companies (initial setup)

-- Drop the current INSERT policy that blocks new users when other companies already exist
DROP POLICY IF EXISTS "erp_companies_insert" ON public.erp_companies;

-- Create a simpler INSERT policy: any authenticated user can create a company.
-- (SELECT access is still restricted by existing SELECT policy.)
CREATE POLICY "erp_companies_insert_v2"
ON public.erp_companies
FOR INSERT
TO authenticated
WITH CHECK (true);
