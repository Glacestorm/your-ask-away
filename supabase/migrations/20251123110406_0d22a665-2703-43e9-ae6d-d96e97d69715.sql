-- Agregar campos necesarios a la tabla companies
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS pl_banco numeric,
ADD COLUMN IF NOT EXISTS beneficios numeric;

-- Crear tabla para configuración de coloración del mapa
CREATE TABLE IF NOT EXISTS public.map_color_mode (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL DEFAULT 'status', -- status, vinculacion, facturacion, pl_banco, beneficios, visitas
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.map_color_mode ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Anyone can view color mode"
  ON public.map_color_mode
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage color mode"
  ON public.map_color_mode
  FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

-- Insertar configuración por defecto
INSERT INTO public.map_color_mode (mode)
VALUES ('status')
ON CONFLICT DO NOTHING;