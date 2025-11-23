-- Insert porcentaje_vinculacion field into map_tooltip_config
INSERT INTO public.map_tooltip_config (field_name, field_label, display_order, enabled)
VALUES ('porcentaje_vinculacion', '% Vinculación', 9, true)
ON CONFLICT DO NOTHING;