-- Crear función para verificar visibilidad de alert_history
CREATE OR REPLACE FUNCTION public.can_view_alert_history(_user_id uuid, _alert_history_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    -- Admins pueden ver todo
    is_admin_or_superadmin(_user_id)
    OR
    has_role(_user_id, 'director_comercial')
    OR
    has_role(_user_id, 'responsable_comercial')
    OR
    -- El usuario es target de la alerta
    EXISTS (
      SELECT 1 FROM alert_history ah
      WHERE ah.id = _alert_history_id
      AND ah.target_gestor_id = _user_id
    )
    OR
    -- Director de oficina puede ver historial de alertas de su oficina
    (
      has_role(_user_id, 'director_oficina')
      AND EXISTS (
        SELECT 1 FROM alert_history ah
        JOIN profiles p ON ah.target_gestor_id = p.id
        JOIN profiles viewer ON viewer.id = _user_id
        WHERE ah.id = _alert_history_id
        AND p.oficina = viewer.oficina
      )
    )
$$;

-- Eliminar política permisiva
DROP POLICY IF EXISTS "Users can view alert history" ON public.alert_history;

-- Crear política restrictiva usando la función
CREATE POLICY "Users can view alert history in scope"
ON public.alert_history
FOR SELECT
TO authenticated
USING (can_view_alert_history(auth.uid(), id));