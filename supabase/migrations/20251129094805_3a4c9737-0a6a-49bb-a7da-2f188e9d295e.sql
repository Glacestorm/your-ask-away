-- Crear tabla para participantes de visitas
CREATE TABLE IF NOT EXISTS public.visit_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(visit_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.visit_participants ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para visit_participants
-- Los usuarios pueden ver participantes de visitas donde son creadores o participantes
CREATE POLICY "Users can view participants of their visits"
ON public.visit_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.visits
    WHERE visits.id = visit_participants.visit_id
    AND (visits.gestor_id = auth.uid() OR visit_participants.user_id = auth.uid())
  )
  OR is_admin_or_superadmin(auth.uid())
);

-- El creador de la visita puede añadir participantes (todos los roles excepto auditor)
CREATE POLICY "Visit creator can add participants"
ON public.visit_participants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.visits
    WHERE visits.id = visit_participants.visit_id
    AND visits.gestor_id = auth.uid()
  )
  AND NOT has_role(auth.uid(), 'auditor'::app_role)
);

-- El creador de la visita puede eliminar participantes
CREATE POLICY "Visit creator can remove participants"
ON public.visit_participants
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.visits
    WHERE visits.id = visit_participants.visit_id
    AND visits.gestor_id = auth.uid()
  )
);

-- Admins pueden gestionar todos los participantes
CREATE POLICY "Admins can manage all participants"
ON public.visit_participants
FOR ALL
TO authenticated
USING (is_admin_or_superadmin(auth.uid()))
WITH CHECK (is_admin_or_superadmin(auth.uid()));

-- Actualizar política de SELECT en visits para incluir participantes
DROP POLICY IF EXISTS "Gestores pueden ver solo sus visitas" ON public.visits;

CREATE POLICY "Users can view their visits and participated visits"
ON public.visits
FOR SELECT
TO authenticated
USING (
  gestor_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.visit_participants
    WHERE visit_participants.visit_id = visits.id
    AND visit_participants.user_id = auth.uid()
  )
  OR is_admin_or_superadmin(auth.uid())
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_visit_participants_visit_id ON public.visit_participants(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_participants_user_id ON public.visit_participants(user_id);