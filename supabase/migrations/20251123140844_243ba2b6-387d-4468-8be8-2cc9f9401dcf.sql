-- Add new roles for directors
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'director_comercial';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'director_oficina';

-- Note: The existing has_role and is_admin_or_superadmin functions will work with these new roles
-- No changes needed to the user_roles table structure