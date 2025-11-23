-- Arreglar constraint en map_tooltip_config para permitir ON CONFLICT
ALTER TABLE public.map_tooltip_config 
ADD CONSTRAINT map_tooltip_config_field_name_key UNIQUE (field_name);

-- Insertar configuración de tooltip para los nuevos campos
INSERT INTO public.map_tooltip_config (field_name, field_label, display_order, enabled)
VALUES 
  ('bank_affiliations', 'Bancos y Vinculación', 10, true),
  ('tpv_terminals', 'Terminales TPV', 11, true),
  ('tpv_revenue', 'Facturación TPV', 12, true)
ON CONFLICT (field_name) DO UPDATE 
SET field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    enabled = EXCLUDED.enabled;