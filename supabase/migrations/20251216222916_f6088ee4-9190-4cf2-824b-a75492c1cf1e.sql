
-- =====================================================
-- FASE 1: Tabla de ratios sectoriales benchmark
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sector_ratio_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnae_code TEXT NOT NULL,
    sector_key TEXT NOT NULL,
    ratio_name TEXT NOT NULL,
    ratio_category TEXT NOT NULL DEFAULT 'general',
    average_value NUMERIC,
    min_value NUMERIC,
    max_value NUMERIC,
    standard_deviation NUMERIC,
    sample_size INTEGER DEFAULT 0,
    source TEXT,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(cnae_code, ratio_name)
);

-- Tabla de coeficientes Z-Score por sector
CREATE TABLE IF NOT EXISTS public.sector_zscore_coefficients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_key TEXT NOT NULL UNIQUE,
    sector_name TEXT NOT NULL,
    x1_coefficient NUMERIC DEFAULT 1.2,
    x2_coefficient NUMERIC DEFAULT 1.4,
    x3_coefficient NUMERIC DEFAULT 3.3,
    x4_coefficient NUMERIC DEFAULT 0.6,
    x5_coefficient NUMERIC DEFAULT 1.0,
    safe_zone_min NUMERIC DEFAULT 2.99,
    gray_zone_min NUMERIC DEFAULT 1.81,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- FASE 2: Funciones de sincronización
-- =====================================================

-- Función para obtener ratios sectoriales dinámicos
CREATE OR REPLACE FUNCTION public.get_sector_ratios(p_cnae_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_result JSONB := '{}'::jsonb;
    v_sector_key TEXT;
BEGIN
    -- Obtener sector del CNAE
    SELECT sector INTO v_sector_key
    FROM cnae_sector_mapping
    WHERE cnae_code = p_cnae_code
    LIMIT 1;
    
    IF v_sector_key IS NULL THEN
        -- Retornar ratios genéricos si no hay mapeo
        RETURN jsonb_build_object(
            'sector', 'generic',
            'ratios', jsonb_build_object(
                'liquidez_general', 1.5,
                'prueba_acida', 1.0,
                'endeudamiento', 0.5,
                'rotacion_activos', 1.0,
                'margen_neto', 0.05,
                'roe', 0.10,
                'roa', 0.05
            )
        );
    END IF;
    
    -- Construir objeto con ratios del sector
    SELECT jsonb_build_object(
        'sector', v_sector_key,
        'ratios', COALESCE(
            (SELECT jsonb_object_agg(ratio_name, average_value)
             FROM sector_ratio_benchmarks
             WHERE cnae_code = p_cnae_code OR sector_key = v_sector_key),
            '{}'::jsonb
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Función para obtener coeficientes Z-Score por sector
CREATE OR REPLACE FUNCTION public.get_zscore_coefficients(p_sector_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'x1', COALESCE(x1_coefficient, 1.2),
        'x2', COALESCE(x2_coefficient, 1.4),
        'x3', COALESCE(x3_coefficient, 3.3),
        'x4', COALESCE(x4_coefficient, 0.6),
        'x5', COALESCE(x5_coefficient, 1.0),
        'safe_zone_min', COALESCE(safe_zone_min, 2.99),
        'gray_zone_min', COALESCE(gray_zone_min, 1.81)
    ) INTO v_result
    FROM sector_zscore_coefficients
    WHERE sector_key = p_sector_key;
    
    IF v_result IS NULL THEN
        -- Coeficientes Altman estándar
        v_result := jsonb_build_object(
            'x1', 1.2,
            'x2', 1.4,
            'x3', 3.3,
            'x4', 0.6,
            'x5', 1.0,
            'safe_zone_min', 2.99,
            'gray_zone_min', 1.81
        );
    END IF;
    
    RETURN v_result;
END;
$$;

-- =====================================================
-- FASE 3: Triggers de sincronización CNAE ↔ Módulos
-- =====================================================

-- Trigger: Al añadir CNAE → crear installed_module si corresponde
CREATE OR REPLACE FUNCTION public.sync_cnae_to_installed_module()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_module_id UUID;
    v_sector_key TEXT;
    v_organization_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Buscar sector del CNAE
    SELECT sector INTO v_sector_key
    FROM cnae_sector_mapping
    WHERE cnae_code = NEW.cnae_code
    LIMIT 1;
    
    IF v_sector_key IS NOT NULL THEN
        -- Buscar módulo correspondiente al sector
        SELECT id INTO v_module_id
        FROM app_modules
        WHERE sector::text = v_sector_key
        AND is_active = true
        LIMIT 1;
        
        IF v_module_id IS NOT NULL THEN
            -- Crear installed_module si no existe
            INSERT INTO installed_modules (
                organization_id,
                module_id,
                installed_by,
                is_active,
                configuration
            )
            VALUES (
                v_organization_id,
                v_module_id,
                auth.uid(),
                true,
                jsonb_build_object(
                    'source', 'cnae_sync',
                    'cnae_code', NEW.cnae_code,
                    'company_id', NEW.company_id
                )
            )
            ON CONFLICT (organization_id, module_id) DO UPDATE
            SET configuration = installed_modules.configuration || 
                jsonb_build_object('linked_cnaes', 
                    COALESCE(installed_modules.configuration->'linked_cnaes', '[]'::jsonb) || 
                    to_jsonb(NEW.cnae_code)
                ),
                updated_at = now();
                
            -- Actualizar company_cnaes con el module_id
            UPDATE company_cnaes
            SET installed_module_id = v_module_id
            WHERE id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_cnae_to_module ON company_cnaes;
CREATE TRIGGER trg_sync_cnae_to_module
    AFTER INSERT ON company_cnaes
    FOR EACH ROW
    EXECUTE FUNCTION sync_cnae_to_installed_module();

-- Trigger: Al instalar módulo sectorial → vincular a company_cnaes si corresponde
CREATE OR REPLACE FUNCTION public.sync_module_to_cnae()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_sector TEXT;
    v_company_id UUID;
BEGIN
    -- Obtener sector del módulo
    SELECT sector::text INTO v_sector
    FROM app_modules
    WHERE id = NEW.module_id;
    
    IF v_sector IS NOT NULL THEN
        -- Si hay company_id en configuración, vincular
        v_company_id := (NEW.configuration->>'company_id')::uuid;
        
        IF v_company_id IS NOT NULL THEN
            -- Actualizar company_cnaes que coincidan con el sector
            UPDATE company_cnaes cc
            SET installed_module_id = NEW.module_id
            FROM cnae_sector_mapping csm
            WHERE cc.cnae_code = csm.cnae_code
            AND csm.sector = v_sector
            AND cc.company_id = v_company_id
            AND cc.installed_module_id IS NULL;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_module_to_cnae ON installed_modules;
CREATE TRIGGER trg_sync_module_to_cnae
    AFTER INSERT ON installed_modules
    FOR EACH ROW
    EXECUTE FUNCTION sync_module_to_cnae();

-- =====================================================
-- FASE 4: Añadir columna installed_module_id a company_cnaes
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'company_cnaes' 
        AND column_name = 'installed_module_id'
    ) THEN
        ALTER TABLE public.company_cnaes 
        ADD COLUMN installed_module_id UUID REFERENCES app_modules(id);
    END IF;
END $$;

-- =====================================================
-- FASE 5: Seed data para ratios y coeficientes
-- =====================================================

-- Coeficientes Z-Score por sector
INSERT INTO sector_zscore_coefficients (sector_key, sector_name, x1_coefficient, x2_coefficient, x3_coefficient, x4_coefficient, x5_coefficient, safe_zone_min, gray_zone_min, description)
VALUES 
    ('financial', 'Financiero/Banca', 0.8, 1.0, 2.5, 0.8, 0.5, 2.5, 1.5, 'Ajustado para sector financiero con alta apalancamiento'),
    ('retail', 'Comercio Minorista', 1.2, 1.4, 3.3, 0.6, 1.2, 2.99, 1.81, 'Estándar Altman con ajuste rotación'),
    ('manufacturing', 'Industria/Manufactura', 1.2, 1.4, 3.3, 0.6, 1.0, 2.99, 1.81, 'Altman original para manufactura'),
    ('construction', 'Construcción', 1.0, 1.2, 3.0, 0.5, 0.8, 2.7, 1.6, 'Ajustado ciclos largos construcción'),
    ('hospitality', 'Hostelería/Turismo', 1.1, 1.3, 3.1, 0.6, 1.1, 2.8, 1.7, 'Ajustado estacionalidad'),
    ('technology', 'Tecnología', 1.3, 1.5, 3.5, 0.7, 0.9, 3.2, 2.0, 'Mayor peso capital intelectual'),
    ('healthcare', 'Sanidad', 1.2, 1.4, 3.2, 0.6, 0.9, 2.99, 1.81, 'Estándar con ajuste regulatorio'),
    ('real_estate', 'Inmobiliario', 0.9, 1.1, 2.8, 0.7, 0.6, 2.5, 1.5, 'Ajustado activos fijos altos'),
    ('transport', 'Transporte/Logística', 1.1, 1.3, 3.1, 0.6, 1.0, 2.9, 1.75, 'Ajustado capital intensivo'),
    ('professional', 'Servicios Profesionales', 1.4, 1.5, 3.5, 0.5, 1.2, 3.1, 1.9, 'Mayor peso capital humano')
ON CONFLICT (sector_key) DO UPDATE SET
    x1_coefficient = EXCLUDED.x1_coefficient,
    x2_coefficient = EXCLUDED.x2_coefficient,
    x3_coefficient = EXCLUDED.x3_coefficient,
    x4_coefficient = EXCLUDED.x4_coefficient,
    x5_coefficient = EXCLUDED.x5_coefficient,
    safe_zone_min = EXCLUDED.safe_zone_min,
    gray_zone_min = EXCLUDED.gray_zone_min,
    updated_at = now();

-- Ratios benchmark por sector (ejemplos representativos)
INSERT INTO sector_ratio_benchmarks (cnae_code, sector_key, ratio_name, ratio_category, average_value, min_value, max_value)
VALUES 
    -- Financiero
    ('6419', 'financial', 'liquidez_general', 'liquidity', 1.1, 0.8, 1.5),
    ('6419', 'financial', 'roe', 'profitability', 0.12, 0.05, 0.20),
    ('6419', 'financial', 'roa', 'profitability', 0.01, 0.005, 0.02),
    ('6419', 'financial', 'ratio_eficiencia', 'efficiency', 0.55, 0.45, 0.70),
    -- Retail
    ('4711', 'retail', 'liquidez_general', 'liquidity', 1.3, 1.0, 1.8),
    ('4711', 'retail', 'rotacion_inventario', 'efficiency', 8.0, 4.0, 15.0),
    ('4711', 'retail', 'margen_bruto', 'profitability', 0.25, 0.15, 0.40),
    ('4711', 'retail', 'roe', 'profitability', 0.15, 0.08, 0.25),
    -- Construcción
    ('4121', 'construction', 'liquidez_general', 'liquidity', 1.2, 0.9, 1.6),
    ('4121', 'construction', 'endeudamiento', 'leverage', 0.65, 0.40, 0.80),
    ('4121', 'construction', 'margen_neto', 'profitability', 0.05, 0.02, 0.10),
    -- Hostelería
    ('5510', 'hospitality', 'liquidez_general', 'liquidity', 0.9, 0.6, 1.3),
    ('5510', 'hospitality', 'ocupacion_media', 'efficiency', 0.65, 0.50, 0.85),
    ('5510', 'hospitality', 'revpar', 'efficiency', 75.0, 40.0, 150.0),
    -- Manufactura
    ('2511', 'manufacturing', 'liquidez_general', 'liquidity', 1.5, 1.2, 2.0),
    ('2511', 'manufacturing', 'rotacion_activos', 'efficiency', 1.2, 0.8, 1.8),
    ('2511', 'manufacturing', 'margen_operativo', 'profitability', 0.08, 0.04, 0.15)
ON CONFLICT (cnae_code, ratio_name) DO UPDATE SET
    average_value = EXCLUDED.average_value,
    min_value = EXCLUDED.min_value,
    max_value = EXCLUDED.max_value,
    updated_at = now();

-- =====================================================
-- FASE 6: RLS Policies
-- =====================================================
ALTER TABLE public.sector_ratio_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sector_zscore_coefficients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read ratio benchmarks"
ON public.sector_ratio_benchmarks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage ratio benchmarks"
ON public.sector_ratio_benchmarks FOR ALL
TO authenticated
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Authenticated users can read zscore coefficients"
ON public.sector_zscore_coefficients FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage zscore coefficients"
ON public.sector_zscore_coefficients FOR ALL
TO authenticated
USING (is_admin_or_superadmin(auth.uid()));

-- Triggers de updated_at
CREATE TRIGGER update_sector_ratio_benchmarks_updated_at
    BEFORE UPDATE ON sector_ratio_benchmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sector_zscore_coefficients_updated_at
    BEFORE UPDATE ON sector_zscore_coefficients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
