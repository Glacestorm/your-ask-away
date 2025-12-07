-- =====================================================
-- MEJORAS DE SEGURIDAD CRÍTICAS - CREAND BANKING APP
-- =====================================================

-- 1. CREAR FUNCIÓN para verificar si usuario puede ver perfiles de su oficina
CREATE OR REPLACE FUNCTION public.can_view_profile(_viewer_id uuid, _profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Usuario puede ver su propio perfil
    _viewer_id = _profile_id
    OR
    -- Admins/superadmins pueden ver todos
    is_admin_or_superadmin(_viewer_id)
    OR
    -- Directors comerciales pueden ver todos
    has_role(_viewer_id, 'director_comercial')
    OR
    -- Responsables comerciales pueden ver todos
    has_role(_viewer_id, 'responsable_comercial')
    OR
    -- Director oficina puede ver perfiles de su misma oficina
    (
      has_role(_viewer_id, 'director_oficina')
      AND EXISTS (
        SELECT 1 FROM profiles p1, profiles p2
        WHERE p1.id = _viewer_id
        AND p2.id = _profile_id
        AND p1.oficina = p2.oficina
        AND p1.oficina IS NOT NULL
      )
    )
    OR
    -- Gestores pueden ver perfiles de su misma oficina
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = _viewer_id
      AND p2.id = _profile_id
      AND p1.oficina = p2.oficina
      AND p1.oficina IS NOT NULL
    )
$$;

-- 2. CREAR FUNCIÓN para verificar acceso a alertas
CREATE OR REPLACE FUNCTION public.can_view_alert(_user_id uuid, _alert_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admins pueden ver todas
    is_admin_or_superadmin(_user_id)
    OR
    has_role(_user_id, 'director_comercial')
    OR
    has_role(_user_id, 'responsable_comercial')
    OR
    -- El usuario es target de la alerta
    EXISTS (
      SELECT 1 FROM alerts a
      WHERE a.id = _alert_id
      AND a.target_gestor_id = _user_id
    )
    OR
    -- Director de oficina puede ver alertas de su oficina
    (
      has_role(_user_id, 'director_oficina')
      AND EXISTS (
        SELECT 1 FROM alerts a
        JOIN profiles p ON a.target_gestor_id = p.id
        JOIN profiles viewer ON viewer.id = _user_id
        WHERE a.id = _alert_id
        AND p.oficina = viewer.oficina
      )
    )
$$;

-- 3. CREAR FUNCIÓN para verificar acceso a visit_sheets basado en jerarquía
CREATE OR REPLACE FUNCTION public.can_view_visit_sheet(_user_id uuid, _visit_sheet_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admins pueden ver todos
    is_admin_or_superadmin(_user_id)
    OR
    has_role(_user_id, 'director_comercial')
    OR
    has_role(_user_id, 'responsable_comercial')
    OR
    -- Gestor propietario puede ver
    EXISTS (
      SELECT 1 FROM visit_sheets vs
      WHERE vs.id = _visit_sheet_id
      AND vs.gestor_id = _user_id
    )
    OR
    -- Director de oficina puede ver de su oficina
    (
      has_role(_user_id, 'director_oficina')
      AND EXISTS (
        SELECT 1 FROM visit_sheets vs
        JOIN profiles gestor ON vs.gestor_id = gestor.id
        JOIN profiles director ON director.id = _user_id
        WHERE vs.id = _visit_sheet_id
        AND gestor.oficina = director.oficina
      )
    )
$$;

-- 4. CREAR tabla para rate limiting del geocoding
CREATE TABLE IF NOT EXISTS public.geocode_rate_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address text NOT NULL,
    request_count integer DEFAULT 1,
    window_start timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- Índice para búsqueda rápida por IP
CREATE INDEX IF NOT EXISTS idx_geocode_rate_limits_ip ON public.geocode_rate_limits(ip_address);

-- RLS para rate limits (solo sistema puede acceder)
ALTER TABLE public.geocode_rate_limits ENABLE ROW LEVEL SECURITY;

-- 5. ACTUALIZAR política de profiles para usar la nueva función
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Admins pueden ver todos los perfiles" ON public.profiles;

CREATE POLICY "Usuarios pueden ver perfiles de su ámbito"
ON public.profiles FOR SELECT
TO authenticated
USING (can_view_profile(auth.uid(), id));

-- 6. ACTUALIZAR política de alertas para restringir visibilidad
DROP POLICY IF EXISTS "Users can view all alerts" ON public.alerts;

CREATE POLICY "Usuarios pueden ver alertas de su ámbito"
ON public.alerts FOR SELECT
TO authenticated
USING (can_view_alert(auth.uid(), id));

-- 7. ACTUALIZAR política de visit_sheets para mayor granularidad
DROP POLICY IF EXISTS "Users can view appropriate visit sheets" ON public.visit_sheets;

CREATE POLICY "Usuarios pueden ver fichas de su ámbito"
ON public.visit_sheets FOR SELECT
TO authenticated
USING (can_view_visit_sheet(auth.uid(), id));

-- 8. CREAR tabla de auditoría de seguridad
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id text,
    ip_address text,
    user_agent text,
    details jsonb,
    severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    created_at timestamp with time zone DEFAULT now()
);

-- Índices para consultas de auditoría
CREATE INDEX IF NOT EXISTS idx_security_audit_user ON public.security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_action ON public.security_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_audit_created ON public.security_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_severity ON public.security_audit_logs(severity);

-- RLS para security audit logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo admins pueden ver logs de seguridad"
ON public.security_audit_logs FOR SELECT
TO authenticated
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Sistema puede insertar logs de seguridad"
ON public.security_audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- 9. CREAR función para registrar eventos de seguridad
CREATE OR REPLACE FUNCTION public.log_security_event(
    _action text,
    _resource_type text,
    _resource_id text DEFAULT NULL,
    _details jsonb DEFAULT NULL,
    _severity text DEFAULT 'info'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.security_audit_logs (user_id, action, resource_type, resource_id, details, severity)
    VALUES (auth.uid(), _action, _resource_type, _resource_id, _details, _severity);
END;
$$;

-- 10. CREAR función para limpiar rate limits antiguos (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.geocode_rate_limits
    WHERE window_start < now() - interval '1 hour';
END;
$$;