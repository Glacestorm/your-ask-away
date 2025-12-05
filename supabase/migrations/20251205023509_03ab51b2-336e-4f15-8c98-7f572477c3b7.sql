-- Drop existing update policies
DROP POLICY IF EXISTS "Gestors can update their visit sheets" ON public.visit_sheets;

-- Create new update policy: Only directors and responsable_comercial can update
CREATE POLICY "Directors can update visit sheets"
ON public.visit_sheets
FOR UPDATE
USING (
  has_role(auth.uid(), 'director_comercial'::app_role) OR
  has_role(auth.uid(), 'director_oficina'::app_role) OR
  has_role(auth.uid(), 'responsable_comercial'::app_role) OR
  has_role(auth.uid(), 'superadmin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'director_comercial'::app_role) OR
  has_role(auth.uid(), 'director_oficina'::app_role) OR
  has_role(auth.uid(), 'responsable_comercial'::app_role) OR
  has_role(auth.uid(), 'superadmin'::app_role)
);