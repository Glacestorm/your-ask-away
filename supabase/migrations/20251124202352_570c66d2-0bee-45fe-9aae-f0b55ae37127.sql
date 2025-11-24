-- Add DELETE policy for companies table to allow admins to delete companies
DROP POLICY IF EXISTS "Admins pueden eliminar empresas" ON public.companies;

CREATE POLICY "Admins pueden eliminar empresas"
ON public.companies
FOR DELETE
TO authenticated
USING (is_admin_or_superadmin(auth.uid()));

-- Also ensure the import_batches table has proper DELETE policy
DROP POLICY IF EXISTS "Admins pueden eliminar lotes" ON public.import_batches;

CREATE POLICY "Admins pueden eliminar lotes"
ON public.import_batches
FOR DELETE
TO authenticated
USING (is_admin_or_superadmin(auth.uid()));