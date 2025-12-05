-- Function to create notifications for high probability visit sheets
CREATE OR REPLACE FUNCTION public.notify_high_probability_visit_sheet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  gestor_name TEXT;
  company_name TEXT;
  director_id UUID;
BEGIN
  -- Only trigger on INSERT or UPDATE with high probability
  IF (NEW.probabilidad_cierre IS NOT NULL AND NEW.probabilidad_cierre >= 75) THEN
    -- Get gestor name
    SELECT full_name INTO gestor_name FROM profiles WHERE id = NEW.gestor_id;
    
    -- Get company name
    SELECT name INTO company_name FROM companies WHERE id = NEW.company_id;
    
    -- Create notification for the gestor
    INSERT INTO notifications (user_id, title, message, severity, metric_value, threshold_value)
    VALUES (
      NEW.gestor_id,
      'Ficha de Visita de Alta Probabilidad',
      'Se ha registrado una ficha de visita para ' || COALESCE(company_name, 'empresa') || ' con ' || NEW.probabilidad_cierre || '% de probabilidad de cierre.',
      'info',
      NEW.probabilidad_cierre,
      75
    );
    
    -- Notify office director if gestor has an office
    FOR director_id IN 
      SELECT ur.user_id 
      FROM user_roles ur 
      JOIN profiles p ON ur.user_id = p.id 
      WHERE ur.role = 'director_oficina' 
      AND p.oficina = (SELECT oficina FROM profiles WHERE id = NEW.gestor_id)
    LOOP
      INSERT INTO notifications (user_id, title, message, severity, metric_value, threshold_value)
      VALUES (
        director_id,
        'Nueva Oportunidad de Alta Probabilidad',
        COALESCE(gestor_name, 'Un gestor') || ' ha registrado una ficha para ' || COALESCE(company_name, 'empresa') || ' con ' || NEW.probabilidad_cierre || '% de probabilidad de cierre.',
        'info',
        NEW.probabilidad_cierre,
        75
      );
    END LOOP;
    
    -- Notify all commercial directors and superadmins
    FOR director_id IN 
      SELECT user_id FROM user_roles WHERE role IN ('director_comercial', 'superadmin')
    LOOP
      INSERT INTO notifications (user_id, title, message, severity, metric_value, threshold_value)
      VALUES (
        director_id,
        'Nueva Oportunidad de Alta Probabilidad',
        COALESCE(gestor_name, 'Un gestor') || ' ha registrado una ficha para ' || COALESCE(company_name, 'empresa') || ' con ' || NEW.probabilidad_cierre || '% de probabilidad de cierre.',
        'info',
        NEW.probabilidad_cierre,
        75
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for visit sheets
DROP TRIGGER IF EXISTS trigger_high_probability_visit_sheet ON visit_sheets;
CREATE TRIGGER trigger_high_probability_visit_sheet
  AFTER INSERT ON visit_sheets
  FOR EACH ROW
  EXECUTE FUNCTION notify_high_probability_visit_sheet();