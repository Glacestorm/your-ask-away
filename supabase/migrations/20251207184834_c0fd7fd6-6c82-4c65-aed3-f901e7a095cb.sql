-- =============================================
-- 1. RESTRINGIR visit_sheets RLS
-- Solo gestor asignado + supervisores (director oficina, responsable comercial, director comercial, superadmin)
-- =============================================

-- Asegurar que la función can_view_visit_sheet existe y es correcta
CREATE OR REPLACE FUNCTION public.can_view_visit_sheet(_user_id uuid, _visit_sheet_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    -- Admins y superadmins pueden ver todos
    is_admin_or_superadmin(_user_id)
    OR
    -- Director comercial puede ver todos
    has_role(_user_id, 'director_comercial')
    OR
    -- Responsable comercial puede ver todos
    has_role(_user_id, 'responsable_comercial')
    OR
    -- Gestor propietario puede ver sus propias fichas
    EXISTS (
      SELECT 1 FROM visit_sheets vs
      WHERE vs.id = _visit_sheet_id
      AND vs.gestor_id = _user_id
    )
    OR
    -- Director de oficina puede ver fichas de gestores de su oficina (supervisor directo)
    (
      has_role(_user_id, 'director_oficina')
      AND EXISTS (
        SELECT 1 FROM visit_sheets vs
        JOIN profiles gestor ON vs.gestor_id = gestor.id
        JOIN profiles director ON director.id = _user_id
        WHERE vs.id = _visit_sheet_id
        AND gestor.oficina = director.oficina
        AND gestor.oficina IS NOT NULL
      )
    )
$$;

-- Eliminar políticas existentes de visit_sheets
DROP POLICY IF EXISTS "Authenticated users can view visit sheets" ON public.visit_sheets;
DROP POLICY IF EXISTS "Users can view own visit sheets" ON public.visit_sheets;
DROP POLICY IF EXISTS "Admins can view all visit sheets" ON public.visit_sheets;
DROP POLICY IF EXISTS "Users can view visit sheets in scope" ON public.visit_sheets;

-- Crear política restrictiva para SELECT
CREATE POLICY "Users can view visit sheets in scope"
ON public.visit_sheets
FOR SELECT
TO authenticated
USING (can_view_visit_sheet(auth.uid(), id));

-- Política para INSERT - solo el gestor asignado puede crear
DROP POLICY IF EXISTS "Users can insert own visit sheets" ON public.visit_sheets;
CREATE POLICY "Users can insert own visit sheets"
ON public.visit_sheets
FOR INSERT
TO authenticated
WITH CHECK (gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()));

-- Política para UPDATE - gestor asignado + supervisores
DROP POLICY IF EXISTS "Users can update own visit sheets" ON public.visit_sheets;
DROP POLICY IF EXISTS "Admins can update all visit sheets" ON public.visit_sheets;
CREATE POLICY "Users can update visit sheets in scope"
ON public.visit_sheets
FOR UPDATE
TO authenticated
USING (can_view_visit_sheet(auth.uid(), id))
WITH CHECK (can_view_visit_sheet(auth.uid(), id));

-- Política para DELETE - solo admins
DROP POLICY IF EXISTS "Admins can delete visit sheets" ON public.visit_sheets;
CREATE POLICY "Admins can delete visit sheets"
ON public.visit_sheets
FOR DELETE
TO authenticated
USING (is_admin_or_superadmin(auth.uid()) OR has_role(auth.uid(), 'director_comercial') OR has_role(auth.uid(), 'responsable_comercial'));

-- =============================================
-- 2. RESTRINGIR alerts RLS  
-- Solo administradores + usuarios objetivo
-- =============================================

-- La función can_view_alert ya existe, verificar que es correcta
CREATE OR REPLACE FUNCTION public.can_view_alert(_user_id uuid, _alert_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    -- Admins y superadmins pueden ver todas
    is_admin_or_superadmin(_user_id)
    OR
    -- Director comercial puede ver todas
    has_role(_user_id, 'director_comercial')
    OR
    -- Responsable comercial puede ver todas
    has_role(_user_id, 'responsable_comercial')
    OR
    -- El usuario es objetivo de la alerta
    EXISTS (
      SELECT 1 FROM alerts a
      WHERE a.id = _alert_id
      AND a.target_gestor_id = _user_id
    )
    OR
    -- Director de oficina puede ver alertas de gestores de su oficina
    (
      has_role(_user_id, 'director_oficina')
      AND EXISTS (
        SELECT 1 FROM alerts a
        JOIN profiles p ON a.target_gestor_id = p.id
        JOIN profiles viewer ON viewer.id = _user_id
        WHERE a.id = _alert_id
        AND p.oficina = viewer.oficina
        AND p.oficina IS NOT NULL
      )
    )
$$;

-- Eliminar políticas existentes de alerts
DROP POLICY IF EXISTS "Authenticated users can view alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can view alerts" ON public.alerts;
DROP POLICY IF EXISTS "Admins can view all alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can view alerts in scope" ON public.alerts;

-- Crear política restrictiva para SELECT
CREATE POLICY "Users can view alerts in scope"
ON public.alerts
FOR SELECT
TO authenticated
USING (can_view_alert(auth.uid(), id));

-- Política para INSERT - solo admins pueden crear alertas
DROP POLICY IF EXISTS "Admins can insert alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can insert alerts" ON public.alerts;
CREATE POLICY "Admins can insert alerts"
ON public.alerts
FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_superadmin(auth.uid()) OR has_role(auth.uid(), 'director_comercial') OR has_role(auth.uid(), 'responsable_comercial'));

-- Política para UPDATE - solo admins pueden modificar alertas
DROP POLICY IF EXISTS "Admins can update alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can update alerts" ON public.alerts;
CREATE POLICY "Admins can update alerts"
ON public.alerts
FOR UPDATE
TO authenticated
USING (is_admin_or_superadmin(auth.uid()) OR has_role(auth.uid(), 'director_comercial') OR has_role(auth.uid(), 'responsable_comercial'))
WITH CHECK (is_admin_or_superadmin(auth.uid()) OR has_role(auth.uid(), 'director_comercial') OR has_role(auth.uid(), 'responsable_comercial'));

-- Política para DELETE - solo admins pueden eliminar alertas
DROP POLICY IF EXISTS "Admins can delete alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can delete alerts" ON public.alerts;
CREATE POLICY "Admins can delete alerts"
ON public.alerts
FOR DELETE
TO authenticated
USING (is_admin_or_superadmin(auth.uid()) OR has_role(auth.uid(), 'director_comercial') OR has_role(auth.uid(), 'responsable_comercial'));