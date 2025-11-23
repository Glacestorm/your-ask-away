-- Create table for map tooltip configuration
CREATE TABLE IF NOT EXISTS public.map_tooltip_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.map_tooltip_config ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view tooltip config"
  ON public.map_tooltip_config
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage tooltip config"
  ON public.map_tooltip_config
  FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

-- Insert default configuration
INSERT INTO public.map_tooltip_config (field_name, field_label, display_order, enabled) VALUES
  ('name', 'Nombre', 1, true),
  ('address', 'Dirección', 2, true),
  ('phone', 'Teléfono', 3, true),
  ('email', 'Email', 4, false),
  ('employees', 'Empleados', 5, true),
  ('turnover', 'Facturación', 6, false),
  ('sector', 'Sector', 7, true),
  ('status_name', 'Estado', 8, true)
ON CONFLICT DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_map_tooltip_config_updated_at
  BEFORE UPDATE ON public.map_tooltip_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();