-- Add financial fields to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS facturacion_anual numeric,
ADD COLUMN IF NOT EXISTS periodo_facturacion text CHECK (periodo_facturacion IN ('semestral', 'anual')),
ADD COLUMN IF NOT EXISTS ingresos_creand numeric,
ADD COLUMN IF NOT EXISTS vinculacion_modo text DEFAULT 'manual' CHECK (vinculacion_modo IN ('manual', 'automatica'));

-- Add comments for documentation
COMMENT ON COLUMN public.companies.facturacion_anual IS 'Facturación anual de la empresa';
COMMENT ON COLUMN public.companies.periodo_facturacion IS 'Periodo de los estados financieros: semestral o anual';
COMMENT ON COLUMN public.companies.ingresos_creand IS 'Total de ingresos realizados por Creand en esta empresa';
COMMENT ON COLUMN public.companies.vinculacion_modo IS 'Modo de cálculo de vinculación: manual o automatica';