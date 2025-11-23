-- Añadir el rol 'auditor' al enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'auditor';

-- Comentario explicativo
COMMENT ON TYPE public.app_role IS 'Roles de usuario: superadmin (control total), admin (gestión), auditor (solo lectura avanzada), user (usuario básico)';