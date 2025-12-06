-- Fix visit_sheets SELECT policy to restrict gestors to only see their own sheets
-- while allowing directors and responsable_comercial to see all for validation

-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Non-auditors can view visit sheets" ON public.visit_sheets;

-- Create a new more restrictive SELECT policy
-- Gestors can only see their own sheets, directors/responsable_comercial can see all for oversight
CREATE POLICY "Users can view appropriate visit sheets" 
ON public.visit_sheets 
FOR SELECT 
USING (
  -- Gestors can only see their own visit sheets
  (gestor_id = auth.uid())
  OR 
  -- Admin roles can see all for oversight/validation
  is_admin_or_superadmin(auth.uid())
  OR 
  has_role(auth.uid(), 'director_comercial'::app_role)
  OR 
  has_role(auth.uid(), 'director_oficina'::app_role)
  OR 
  has_role(auth.uid(), 'responsable_comercial'::app_role)
);