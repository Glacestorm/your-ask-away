-- Añadir columna de porcentaje de vinculación a company_bank_affiliations
ALTER TABLE public.company_bank_affiliations
ADD COLUMN IF NOT EXISTS affiliation_percentage numeric CHECK (affiliation_percentage >= 0 AND affiliation_percentage <= 100);

-- Añadir comentario descriptivo
COMMENT ON COLUMN public.company_bank_affiliations.affiliation_percentage IS 'Porcentaje de vinculación con esta entidad bancaria (0-100). La suma de todos los porcentajes de una empresa debe ser 100%';

-- Crear función para validar que los porcentajes sumen 100% por empresa
CREATE OR REPLACE FUNCTION public.validate_bank_affiliation_percentages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_percentage numeric;
BEGIN
  -- Calcular el total de porcentajes para esta empresa
  SELECT COALESCE(SUM(affiliation_percentage), 0)
  INTO total_percentage
  FROM public.company_bank_affiliations
  WHERE company_id = NEW.company_id
    AND active = true
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  -- Sumar el porcentaje del registro actual
  total_percentage := total_percentage + COALESCE(NEW.affiliation_percentage, 0);
  
  -- Validar que no exceda 100%
  IF total_percentage > 100 THEN
    RAISE EXCEPTION 'La suma de porcentajes de vinculación no puede superar el 100 por ciento. Actualmente suma: %', total_percentage
      USING ERRCODE = 'check_violation';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para validar antes de insertar o actualizar
DROP TRIGGER IF EXISTS validate_affiliation_percentages ON public.company_bank_affiliations;
CREATE TRIGGER validate_affiliation_percentages
  BEFORE INSERT OR UPDATE ON public.company_bank_affiliations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_bank_affiliation_percentages();