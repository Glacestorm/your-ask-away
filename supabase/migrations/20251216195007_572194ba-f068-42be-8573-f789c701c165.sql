-- FASE 7: Auto-activate compliance when sector module is installed
CREATE OR REPLACE FUNCTION public.activate_compliance_on_module_install()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_module app_modules%ROWTYPE;
    v_sector TEXT;
BEGIN
    -- Get module details
    SELECT * INTO v_module FROM app_modules WHERE id = NEW.module_id;
    
    IF v_module IS NULL THEN
        RETURN NEW;
    END IF;
    
    v_sector := v_module.sector::TEXT;
    
    -- Only proceed if module has a sector (is a vertical/sectorial module)
    IF v_sector IS NOT NULL AND v_sector != '' THEN
        -- 1. Load official regulations for this sector from sector_regulations
        INSERT INTO organization_compliance_documents (
            organization_id,
            document_type,
            title,
            description,
            sector,
            sector_key,
            regulation_source,
            effective_date,
            is_mandatory,
            requires_acknowledgment,
            status,
            metadata
        )
        SELECT 
            NEW.organization_id,
            'official_regulation',
            sr.regulation_name,
            sr.description,
            v_sector,
            v_sector,
            COALESCE(sr.source, 'BOE/DOUE'),
            sr.effective_date,
            COALESCE(sr.mandatory, true),
            COALESCE(sr.mandatory, true),
            'active',
            jsonb_build_object(
                'regulation_code', sr.regulation_code,
                'auto_loaded', true,
                'module_id', NEW.module_id,
                'installed_at', NOW()
            )
        FROM sector_regulations sr
        WHERE sr.sector = v_sector
        AND sr.is_active = true
        AND NOT EXISTS (
            SELECT 1 FROM organization_compliance_documents ocd
            WHERE ocd.organization_id = NEW.organization_id
            AND ocd.title = sr.regulation_name
            AND ocd.sector = v_sector
        );
        
        -- 2. Create notification for admins about new compliance requirements
        INSERT INTO notifications (user_id, title, message, type, severity, data)
        SELECT 
            p.id,
            'Módulo Sectorial Instalado - Compliance Activado',
            'Se ha instalado el módulo ' || v_module.module_name || '. Las normativas del sector ' || v_sector || ' han sido cargadas automáticamente.',
            'compliance',
            'info',
            jsonb_build_object(
                'module_id', NEW.module_id,
                'module_key', v_module.module_key,
                'sector', v_sector,
                'organization_id', NEW.organization_id
            )
        FROM profiles p
        JOIN user_roles ur ON p.id = ur.user_id
        WHERE ur.role IN ('superadmin', 'director_comercial', 'responsable_comercial');
        
        -- 3. Log the activation
        PERFORM log_audit_event(
            'compliance_auto_activated',
            'installed_modules',
            NEW.id,
            NULL,
            jsonb_build_object(
                'module_key', v_module.module_key,
                'sector', v_sector,
                'organization_id', NEW.organization_id
            ),
            NULL, NULL, 'compliance', 'info'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger on module installation
DROP TRIGGER IF EXISTS auto_activate_compliance_on_module_install ON installed_modules;
CREATE TRIGGER auto_activate_compliance_on_module_install
    AFTER INSERT ON installed_modules
    FOR EACH ROW
    WHEN (NEW.is_active = true)
    EXECUTE FUNCTION activate_compliance_on_module_install();

-- Function to load compliance for existing modules (can be called manually)
CREATE OR REPLACE FUNCTION public.load_sector_compliance(
    p_organization_id UUID,
    p_sector TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Load official regulations for the sector
    INSERT INTO organization_compliance_documents (
        organization_id,
        document_type,
        title,
        description,
        sector,
        sector_key,
        regulation_source,
        effective_date,
        is_mandatory,
        requires_acknowledgment,
        status,
        metadata
    )
    SELECT 
        p_organization_id,
        'official_regulation',
        sr.regulation_name,
        sr.description,
        p_sector,
        p_sector,
        COALESCE(sr.source, 'BOE/DOUE'),
        sr.effective_date,
        COALESCE(sr.mandatory, true),
        COALESCE(sr.mandatory, true),
        'active',
        jsonb_build_object(
            'regulation_code', sr.regulation_code,
            'manually_loaded', true,
            'loaded_at', NOW()
        )
    FROM sector_regulations sr
    WHERE sr.sector = p_sector
    AND sr.is_active = true
    AND NOT EXISTS (
        SELECT 1 FROM organization_compliance_documents ocd
        WHERE ocd.organization_id = p_organization_id
        AND ocd.title = sr.regulation_name
        AND ocd.sector = p_sector
    );
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN v_count;
END;
$$;