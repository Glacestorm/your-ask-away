-- Crear tabla para configuración general del mapa
CREATE TABLE IF NOT EXISTS public.map_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value jsonb NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.map_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Anyone can view map config"
  ON public.map_config
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage map config"
  ON public.map_config
  FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

-- Insertar configuración por defecto para el zoom mínimo
INSERT INTO public.map_config (config_key, config_value, description)
VALUES (
  'min_zoom_vinculacion',
  '{"value": 15}'::jsonb,
  'Nivel de zoom mínimo para mostrar el porcentaje de vinculación en las chinchetas'
);