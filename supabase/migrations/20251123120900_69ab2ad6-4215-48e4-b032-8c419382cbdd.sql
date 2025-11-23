-- Añadir campos de vinculación bancaria a la tabla companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS vinculacion_entidad_1 numeric CHECK (vinculacion_entidad_1 >= 0 AND vinculacion_entidad_1 <= 100),
ADD COLUMN IF NOT EXISTS vinculacion_entidad_2 numeric CHECK (vinculacion_entidad_2 >= 0 AND vinculacion_entidad_2 <= 100),
ADD COLUMN IF NOT EXISTS vinculacion_entidad_3 numeric CHECK (vinculacion_entidad_3 >= 0 AND vinculacion_entidad_3 <= 100);

-- Añadir comentarios explicativos
COMMENT ON COLUMN public.companies.vinculacion_entidad_1 IS 'Porcentaje de vinculación con entidad bancaria 1 (0-100)';
COMMENT ON COLUMN public.companies.vinculacion_entidad_2 IS 'Porcentaje de vinculación con entidad bancaria 2 (0-100)';
COMMENT ON COLUMN public.companies.vinculacion_entidad_3 IS 'Porcentaje de vinculación con entidad bancaria 3 (0-100)';