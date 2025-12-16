-- Trigger function for new official regulations
CREATE OR REPLACE FUNCTION public.notify_new_official_regulation_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO notifications (user_id, title, message, type, severity, data)
    SELECT 
        ns.user_id,
        'Nueva normativa oficial publicada',
        'Se ha publicado: ' || NEW.regulation_name || ' (' || NEW.regulation_code || ')',
        'compliance',
        'info',
        jsonb_build_object(
            'regulation_id', NEW.id,
            'regulation_code', NEW.regulation_code,
            'sector', NEW.sector_key
        )
    FROM notification_subscriptions ns
    JOIN notification_channels nc ON ns.channel_id = nc.id
    WHERE nc.channel_name = 'compliance_normativas'
    AND ns.is_active = true;
    
    RETURN NEW;
END;
$$;

-- Trigger function for new internal documents
CREATE OR REPLACE FUNCTION public.notify_new_internal_document_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO notifications (user_id, title, message, type, severity, data)
    SELECT 
        ns.user_id,
        'Nuevo documento interno requiere firma',
        'Se ha publicado: ' || NEW.title || ' - Requiere su reconocimiento',
        'compliance',
        'warning',
        jsonb_build_object(
            'document_id', NEW.id,
            'document_title', NEW.title,
            'organization_id', NEW.organization_id
        )
    FROM notification_subscriptions ns
    JOIN notification_channels nc ON ns.channel_id = nc.id
    WHERE nc.channel_name = 'compliance_normativas'
    AND ns.is_active = true;
    
    RETURN NEW;
END;
$$;

-- Trigger function for compliance non-conformity
CREATE OR REPLACE FUNCTION public.notify_compliance_non_conformity_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF NEW.status IN ('non_compliant', 'overdue') AND (OLD IS NULL OR OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO notifications (user_id, title, message, type, severity, data)
        SELECT 
            ns.user_id,
            'Alerta de incumplimiento normativo',
            'Requisito "' || NEW.requirement_title || '" marcado como ' || 
            CASE NEW.status WHEN 'non_compliant' THEN 'NO CONFORME' ELSE 'VENCIDO' END,
            'compliance',
            'error',
            jsonb_build_object(
                'requirement_id', NEW.id,
                'requirement_key', NEW.requirement_key,
                'status', NEW.status
            )
        FROM notification_subscriptions ns
        JOIN notification_channels nc ON ns.channel_id = nc.id
        WHERE nc.channel_name = 'compliance_normativas'
        AND ns.is_active = true;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER notify_new_official_regulation
    AFTER INSERT ON sector_regulations
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_official_regulation_fn();

CREATE TRIGGER notify_new_internal_document
    AFTER INSERT ON organization_compliance_documents
    FOR EACH ROW
    WHEN (NEW.status = 'active')
    EXECUTE FUNCTION notify_new_internal_document_fn();

CREATE TRIGGER notify_compliance_non_conformity
    AFTER INSERT OR UPDATE ON compliance_requirements
    FOR EACH ROW
    EXECUTE FUNCTION notify_compliance_non_conformity_fn();