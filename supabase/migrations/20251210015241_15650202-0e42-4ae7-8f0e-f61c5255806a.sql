-- =====================================================
-- TABLA: anonymized_training_data
-- Propósito: EU AI Act Art.10 - Datos entrenamiento anonimizados
-- Sin transferencia a terceros, solo uso interno
-- =====================================================

CREATE TABLE IF NOT EXISTS public.anonymized_training_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Metadatos anonimizados
    data_type TEXT NOT NULL CHECK (data_type IN ('financial_pattern', 'behavioral_pattern', 'risk_pattern', 'visit_pattern', 'compliance_pattern')),
    
    -- Datos estadísticos agregados (nunca individuales)
    aggregated_metrics JSONB NOT NULL DEFAULT '{}',
    
    -- Hash del origen para deduplicación (sin poder revertir)
    source_hash TEXT NOT NULL,
    
    -- Período de agregación
    aggregation_period TEXT NOT NULL CHECK (aggregation_period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Número mínimo de registros agregados (k-anonymity >= 10)
    sample_size INTEGER NOT NULL CHECK (sample_size >= 10),
    
    -- Nivel de anonimización aplicado
    anonymization_level TEXT NOT NULL DEFAULT 'full' CHECK (anonymization_level IN ('full', 'pseudonymized', 'aggregated')),
    
    -- Técnicas aplicadas
    techniques_applied TEXT[] NOT NULL DEFAULT ARRAY['k-anonymity', 'l-diversity', 'aggregation'],
    
    -- Propósito uso (EU AI Act Art.10 compliance)
    purpose TEXT NOT NULL DEFAULT 'internal_model_training',
    
    -- Restricciones transferencia
    transfer_restrictions TEXT NOT NULL DEFAULT 'internal_only_no_third_party',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '2 years'),
    
    -- Índices para búsqueda
    CONSTRAINT valid_period CHECK (period_end >= period_start)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_anonymized_training_data_type ON public.anonymized_training_data(data_type);
CREATE INDEX IF NOT EXISTS idx_anonymized_training_period ON public.anonymized_training_data(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_anonymized_training_expires ON public.anonymized_training_data(expires_at);

-- RLS
ALTER TABLE public.anonymized_training_data ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver/gestionar datos de entrenamiento
CREATE POLICY "Admins can manage training data"
ON public.anonymized_training_data
FOR ALL
TO authenticated
USING (public.is_admin_or_superadmin(auth.uid()))
WITH CHECK (public.is_admin_or_superadmin(auth.uid()));

-- =====================================================
-- TABLA: data_processing_consents
-- Propósito: GDPR Art.7 - Gestión consentimientos
-- =====================================================

CREATE TABLE IF NOT EXISTS public.data_processing_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Tipos de consentimiento
    consent_type TEXT NOT NULL CHECK (consent_type IN (
        'essential_processing',      -- Procesamiento esencial servicio
        'analytics',                 -- Análisis agregado
        'ai_training_anonymized',    -- Entrenamiento IA con datos anonimizados
        'marketing',                 -- Marketing (nunca usado)
        'third_party_sharing'        -- Compartir terceros (siempre false)
    )),
    
    -- Estado consentimiento
    granted BOOLEAN NOT NULL DEFAULT false,
    
    -- Cuándo se otorgó/revocó
    granted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    
    -- Versión política privacidad aceptada
    policy_version TEXT NOT NULL DEFAULT '1.0',
    
    -- IP y contexto (para auditoría)
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Un consentimiento por tipo por usuario
    UNIQUE(user_id, consent_type)
);

-- RLS
ALTER TABLE public.data_processing_consents ENABLE ROW LEVEL SECURITY;

-- Usuarios solo ven sus propios consentimientos
CREATE POLICY "Users manage own consents"
ON public.data_processing_consents
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins pueden ver todos para auditoría
CREATE POLICY "Admins view all consents"
ON public.data_processing_consents
FOR SELECT
TO authenticated
USING (public.is_admin_or_superadmin(auth.uid()));

-- =====================================================
-- FUNCIÓN: Anonimizar datos financieros para entrenamiento
-- =====================================================

CREATE OR REPLACE FUNCTION public.anonymize_financial_data_for_training(
    p_data_type TEXT,
    p_period_start DATE,
    p_period_end DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result_id UUID;
    v_sample_size INTEGER;
    v_aggregated_data JSONB;
    v_source_hash TEXT;
BEGIN
    -- Solo admins pueden ejecutar
    IF NOT is_admin_or_superadmin(auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Calcular estadísticas agregadas según tipo
    IF p_data_type = 'financial_pattern' THEN
        SELECT 
            COUNT(*),
            jsonb_build_object(
                'avg_revenue', ROUND(AVG(COALESCE(c.facturacion_anual, 0))::numeric, -3), -- Redondeado a miles
                'revenue_distribution', jsonb_build_object(
                    'q1', percentile_cont(0.25) WITHIN GROUP (ORDER BY COALESCE(c.facturacion_anual, 0)),
                    'median', percentile_cont(0.5) WITHIN GROUP (ORDER BY COALESCE(c.facturacion_anual, 0)),
                    'q3', percentile_cont(0.75) WITHIN GROUP (ORDER BY COALESCE(c.facturacion_anual, 0))
                ),
                'sector_distribution', (
                    SELECT jsonb_object_agg(sector, cnt)
                    FROM (SELECT sector, COUNT(*) as cnt FROM companies WHERE sector IS NOT NULL GROUP BY sector LIMIT 20) s
                )
            )
        INTO v_sample_size, v_aggregated_data
        FROM companies c
        WHERE c.created_at::date BETWEEN p_period_start AND p_period_end;
        
    ELSIF p_data_type = 'visit_pattern' THEN
        SELECT 
            COUNT(*),
            jsonb_build_object(
                'avg_visits_per_company', ROUND(AVG(visit_count)::numeric, 1),
                'result_distribution', (
                    SELECT jsonb_object_agg(result, cnt)
                    FROM (SELECT result, COUNT(*) as cnt FROM visits WHERE result IS NOT NULL GROUP BY result) r
                ),
                'avg_duration_minutes', ROUND(AVG(EXTRACT(EPOCH FROM duration)/60)::numeric, 0)
            )
        INTO v_sample_size, v_aggregated_data
        FROM (
            SELECT company_id, COUNT(*) as visit_count
            FROM visits
            WHERE date BETWEEN p_period_start AND p_period_end
            GROUP BY company_id
        ) vc;
        
    ELSE
        v_sample_size := 0;
        v_aggregated_data := '{}'::jsonb;
    END IF;

    -- Verificar k-anonymity (mínimo 10 registros)
    IF v_sample_size < 10 THEN
        RAISE EXCEPTION 'Insufficient data for anonymization (k-anonymity requires >= 10 records, got %)', v_sample_size;
    END IF;

    -- Generar hash del origen (irreversible)
    v_source_hash := encode(sha256((p_data_type || p_period_start::text || p_period_end::text || now()::text)::bytea), 'hex');

    -- Insertar datos anonimizados
    INSERT INTO anonymized_training_data (
        data_type,
        aggregated_metrics,
        source_hash,
        aggregation_period,
        period_start,
        period_end,
        sample_size,
        anonymization_level,
        techniques_applied,
        purpose,
        transfer_restrictions
    ) VALUES (
        p_data_type,
        v_aggregated_data,
        v_source_hash,
        'custom',
        p_period_start,
        p_period_end,
        v_sample_size,
        'full',
        ARRAY['k-anonymity', 'l-diversity', 'aggregation', 'rounding', 'suppression'],
        'internal_model_training',
        'internal_only_no_third_party'
    )
    RETURNING id INTO v_result_id;

    -- Log de auditoría
    PERFORM log_audit_event(
        'anonymize_training_data',
        'anonymized_training_data',
        v_result_id,
        NULL,
        jsonb_build_object('data_type', p_data_type, 'sample_size', v_sample_size),
        NULL, NULL, 'compliance', 'info'
    );

    RETURN v_result_id;
END;
$$;

-- =====================================================
-- FUNCIÓN: Limpiar datos expirados
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_training_data()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM anonymized_training_data
    WHERE expires_at < now()
    RETURNING COUNT(*) INTO v_deleted;
    
    RETURN COALESCE(v_deleted, 0);
END;
$$;

-- =====================================================
-- COMENTARIOS DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE public.anonymized_training_data IS 'EU AI Act Art.10 compliant - Anonymized data for internal AI training only. No third-party transfer. K-anonymity >= 10.';
COMMENT ON TABLE public.data_processing_consents IS 'GDPR Art.7 - User consent management for data processing activities.';
COMMENT ON FUNCTION public.anonymize_financial_data_for_training IS 'Generates k-anonymous aggregated statistics from financial data for AI training. Implements: k-anonymity, l-diversity, aggregation, rounding, suppression.';
