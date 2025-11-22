-- Agregar campos adicionales a la tabla profiles
ALTER TABLE public.profiles
ADD COLUMN gestor_number TEXT,
ADD COLUMN oficina TEXT,
ADD COLUMN cargo TEXT;

COMMENT ON COLUMN public.profiles.gestor_number IS 'Número de identificación del gestor';
COMMENT ON COLUMN public.profiles.oficina IS 'Oficina asignada al usuario';
COMMENT ON COLUMN public.profiles.cargo IS 'Cargo o puesto del usuario';