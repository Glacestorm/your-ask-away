-- Add Compliance notification channel
INSERT INTO notification_channels (channel_name, description, channel_type, is_active)
VALUES (
  'compliance_normativas',
  'Notificaciones de cumplimiento normativo, documentos internos, firmas pendientes y alertas de incumplimiento',
  'compliance',
  true
) ON CONFLICT (channel_name) DO NOTHING;

-- Function to notify admins of new official regulations
CREATE OR REPLACE FUNCTION notify_new_official_regulation()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  sector_name TEXT;
BEGIN
  -- Only trigger for official regulations
  IF NEW.document_type = 'official_regulation' THEN
    -- Get sector name
    SELECT sm.sector_name INTO sector_name
    FROM cnae_sector_mapping sm
    WHERE sm.sector = NEW.sector_key
    LIMIT 1;
    
    -- Notify all admins and superadmins
    FOR admin_record IN 
      SELECT DISTINCT p.id 
      FROM profiles p
      JOIN user_roles ur ON p.id = ur.user_id
      WHERE ur.role IN ('superadmin', 'director_comercial', 'responsable_comercial', 'admin')
    LOOP
      INSERT INTO notifications (user_id, title, message, severity, type, data)
      VALUES (
        admin_record.id,
        'Nueva Normativa Oficial: ' || NEW.title,
        'Se ha detectado una nueva normativa para el sector ' || COALESCE(sector_name, NEW.sector_key) || ': ' || NEW.description,
        'warning',
        'compliance',
        jsonb_build_object(
          'document_id', NEW.id,
          'document_type', 'official_regulation',
          'sector', NEW.sector_key,
          'source_url', NEW.source_url
        )
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new official regulations
DROP TRIGGER IF EXISTS trg_notify_new_official_regulation ON organization_compliance_documents;
CREATE TRIGGER trg_notify_new_official_regulation
  AFTER INSERT ON organization_compliance_documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_official_regulation();

-- Function to notify employees of new internal documents
CREATE OR REPLACE FUNCTION notify_new_internal_document()
RETURNS TRIGGER AS $$
DECLARE
  employee_record RECORD;
BEGIN
  -- Only trigger for internal documents
  IF NEW.document_type = 'internal_policy' OR NEW.document_type = 'internal_procedure' THEN
    -- Notify all active employees in the organization
    FOR employee_record IN 
      SELECT DISTINCT p.id 
      FROM profiles p
      WHERE p.id IS NOT NULL
    LOOP
      INSERT INTO notifications (user_id, title, message, severity, type, data)
      VALUES (
        employee_record.id,
        'Nuevo Documento Interno: ' || NEW.title,
        'Se ha publicado un nuevo documento que requiere tu revisión: ' || COALESCE(NEW.description, NEW.title),
        'info',
        'compliance',
        jsonb_build_object(
          'document_id', NEW.id,
          'document_type', NEW.document_type,
          'requires_acknowledgment', NEW.requires_acknowledgment
        )
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new internal documents
DROP TRIGGER IF EXISTS trg_notify_new_internal_document ON organization_compliance_documents;
CREATE TRIGGER trg_notify_new_internal_document
  AFTER INSERT ON organization_compliance_documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_internal_document();

-- Function to check and notify pending acknowledgments (to be called by cron)
CREATE OR REPLACE FUNCTION check_pending_acknowledgments()
RETURNS void AS $$
DECLARE
  pending_record RECORD;
  days_pending INTEGER;
BEGIN
  -- Find documents requiring acknowledgment that haven't been acknowledged
  FOR pending_record IN
    SELECT 
      ocd.id AS document_id,
      ocd.title AS document_title,
      ocd.organization_id,
      p.id AS user_id,
      p.full_name,
      ocd.created_at
    FROM organization_compliance_documents ocd
    CROSS JOIN profiles p
    LEFT JOIN compliance_acknowledgments ca 
      ON ca.document_id = ocd.id AND ca.user_id = p.id
    WHERE ocd.requires_acknowledgment = true
      AND ocd.is_active = true
      AND ca.id IS NULL
      AND ocd.created_at < NOW() - INTERVAL '3 days'
  LOOP
    days_pending := EXTRACT(DAY FROM NOW() - pending_record.created_at);
    
    -- Don't spam - only notify every 3 days
    IF days_pending % 3 = 0 THEN
      INSERT INTO notifications (user_id, title, message, severity, type, data)
      VALUES (
        pending_record.user_id,
        'Documento Pendiente de Firma',
        'Tienes pendiente la firma del documento "' || pending_record.document_title || '" desde hace ' || days_pending || ' días.',
        CASE WHEN days_pending > 7 THEN 'error' ELSE 'warning' END,
        'compliance',
        jsonb_build_object(
          'document_id', pending_record.document_id,
          'days_pending', days_pending,
          'action_required', 'acknowledge'
        )
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check expiring acknowledgments (annual/quarterly renewal)
CREATE OR REPLACE FUNCTION check_expiring_acknowledgments()
RETURNS void AS $$
DECLARE
  expiring_record RECORD;
  days_until_expiry INTEGER;
BEGIN
  -- Find acknowledgments expiring within 30 days
  FOR expiring_record IN
    SELECT 
      ca.id AS acknowledgment_id,
      ca.user_id,
      ca.document_id,
      ocd.title AS document_title,
      ocd.renewal_frequency,
      ca.acknowledged_at,
      CASE 
        WHEN ocd.renewal_frequency = 'annual' THEN ca.acknowledged_at + INTERVAL '1 year'
        WHEN ocd.renewal_frequency = 'quarterly' THEN ca.acknowledged_at + INTERVAL '3 months'
        WHEN ocd.renewal_frequency = 'monthly' THEN ca.acknowledged_at + INTERVAL '1 month'
        ELSE ca.acknowledged_at + INTERVAL '1 year'
      END AS expiry_date
    FROM compliance_acknowledgments ca
    JOIN organization_compliance_documents ocd ON ca.document_id = ocd.id
    WHERE ocd.renewal_frequency IS NOT NULL
      AND ocd.is_active = true
  LOOP
    days_until_expiry := EXTRACT(DAY FROM expiring_record.expiry_date - NOW());
    
    -- Notify at 30, 14, 7, and 1 day before expiry
    IF days_until_expiry IN (30, 14, 7, 1) OR days_until_expiry <= 0 THEN
      INSERT INTO notifications (user_id, title, message, severity, type, data)
      VALUES (
        expiring_record.user_id,
        CASE 
          WHEN days_until_expiry <= 0 THEN 'Firma Expirada: ' || expiring_record.document_title
          ELSE 'Renovación Próxima: ' || expiring_record.document_title
        END,
        CASE 
          WHEN days_until_expiry <= 0 THEN 'Tu firma del documento ha expirado. Por favor, renueva tu confirmación.'
          ELSE 'Tu firma del documento expira en ' || days_until_expiry || ' días. Renueva tu confirmación.'
        END,
        CASE 
          WHEN days_until_expiry <= 0 THEN 'error'
          WHEN days_until_expiry <= 7 THEN 'warning'
          ELSE 'info'
        END,
        'compliance',
        jsonb_build_object(
          'document_id', expiring_record.document_id,
          'acknowledgment_id', expiring_record.acknowledgment_id,
          'days_until_expiry', days_until_expiry,
          'renewal_frequency', expiring_record.renewal_frequency,
          'action_required', 'renew'
        )
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to notify supervisor on non-compliance
CREATE OR REPLACE FUNCTION notify_compliance_issue()
RETURNS TRIGGER AS $$
DECLARE
  supervisor_record RECORD;
  employee_name TEXT;
BEGIN
  -- Only trigger when status changes to non_compliant
  IF NEW.status = 'non_compliant' AND (OLD.status IS NULL OR OLD.status != 'non_compliant') THEN
    -- Get employee name
    SELECT full_name INTO employee_name FROM profiles WHERE id = NEW.employee_id;
    
    -- Notify supervisors (directors and responsables)
    FOR supervisor_record IN 
      SELECT DISTINCT p.id 
      FROM profiles p
      JOIN user_roles ur ON p.id = ur.user_id
      WHERE ur.role IN ('superadmin', 'director_comercial', 'responsable_comercial', 'director_oficina')
    LOOP
      INSERT INTO notifications (user_id, title, message, severity, type, data)
      VALUES (
        supervisor_record.id,
        'Incumplimiento Detectado',
        'Se ha detectado un incumplimiento normativo para ' || COALESCE(employee_name, 'un empleado') || ': ' || COALESCE(NEW.notes, 'Sin detalles'),
        'error',
        'compliance',
        jsonb_build_object(
          'requirement_id', NEW.id,
          'employee_id', NEW.employee_id,
          'employee_name', employee_name,
          'status', NEW.status
        )
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for compliance issues
DROP TRIGGER IF EXISTS trg_notify_compliance_issue ON compliance_requirements;
CREATE TRIGGER trg_notify_compliance_issue
  AFTER INSERT OR UPDATE ON compliance_requirements
  FOR EACH ROW
  EXECUTE FUNCTION notify_compliance_issue();

-- Add renewal_frequency to organization_compliance_documents if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organization_compliance_documents' 
    AND column_name = 'renewal_frequency'
  ) THEN
    ALTER TABLE organization_compliance_documents 
    ADD COLUMN renewal_frequency TEXT CHECK (renewal_frequency IN ('monthly', 'quarterly', 'annual'));
  END IF;
END $$;