-- =====================================================
-- FASE 1: SISTEMA DE REPORTING PARA AUDITORES POR SECTOR
-- =====================================================

-- 1.1 Crear tabla auditor_report_templates
CREATE TABLE IF NOT EXISTS public.auditor_report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_key TEXT NOT NULL CHECK (sector_key IN ('banking', 'health', 'industry', 'retail', 'services', 'technology')),
    regulation_code TEXT NOT NULL,
    template_name TEXT NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'annual')),
    sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    required_questions JSONB DEFAULT '[]'::jsonb,
    evidence_types TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.2 Crear tabla auditor_questions
CREATE TABLE IF NOT EXISTS public.auditor_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_key TEXT NOT NULL,
    regulation_code TEXT NOT NULL,
    question_code TEXT NOT NULL UNIQUE,
    question_text TEXT NOT NULL,
    expected_evidence JSONB DEFAULT '[]'::jsonb,
    standard_response_template TEXT,
    category TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.3 Crear tabla auditor_responses
CREATE TABLE IF NOT EXISTS public.auditor_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    question_id UUID NOT NULL REFERENCES public.auditor_questions(id) ON DELETE CASCADE,
    response_text TEXT,
    evidence_urls TEXT[] DEFAULT '{}',
    auto_generated_evidence JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('draft', 'reviewed', 'approved', 'submitted')) DEFAULT 'draft',
    last_updated_at TIMESTAMPTZ DEFAULT now(),
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.4 Crear tabla audit_reports_generated
CREATE TABLE IF NOT EXISTS public.audit_reports_generated (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    sector_key TEXT NOT NULL,
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'annual')),
    template_id UUID REFERENCES public.auditor_report_templates(id),
    compliance_score NUMERIC(5,2) CHECK (compliance_score >= 0 AND compliance_score <= 100),
    findings_summary JSONB DEFAULT '{}'::jsonb,
    sections_data JSONB DEFAULT '[]'::jsonb,
    pdf_url TEXT,
    sent_to_auditors BOOLEAN DEFAULT false,
    auditor_emails TEXT[] DEFAULT '{}',
    generated_at TIMESTAMPTZ DEFAULT now(),
    sent_at TIMESTAMPTZ,
    generated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.5 Crear tabla audit_evidence
CREATE TABLE IF NOT EXISTS public.audit_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    evidence_type TEXT NOT NULL,
    evidence_period_start DATE NOT NULL,
    evidence_period_end DATE NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    file_url TEXT,
    source_table TEXT,
    source_query TEXT,
    collected_at TIMESTAMPTZ DEFAULT now(),
    is_validated BOOLEAN DEFAULT false,
    validated_by UUID REFERENCES public.profiles(id),
    validated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_auditor_questions_sector ON public.auditor_questions(sector_key);
CREATE INDEX IF NOT EXISTS idx_auditor_questions_regulation ON public.auditor_questions(regulation_code);
CREATE INDEX IF NOT EXISTS idx_auditor_responses_question ON public.auditor_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_auditor_responses_status ON public.auditor_responses(status);
CREATE INDEX IF NOT EXISTS idx_audit_reports_sector ON public.audit_reports_generated(sector_key);
CREATE INDEX IF NOT EXISTS idx_audit_reports_period ON public.audit_reports_generated(report_period_start, report_period_end);
CREATE INDEX IF NOT EXISTS idx_audit_evidence_type ON public.audit_evidence(evidence_type);
CREATE INDEX IF NOT EXISTS idx_audit_evidence_period ON public.audit_evidence(evidence_period_start, evidence_period_end);

-- RLS Policies
ALTER TABLE public.auditor_report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditor_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_reports_generated ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_evidence ENABLE ROW LEVEL SECURITY;

-- Políticas para auditor_report_templates
CREATE POLICY "Anyone can view active templates" ON public.auditor_report_templates
    FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage templates" ON public.auditor_report_templates
    FOR ALL USING (is_admin_or_superadmin(auth.uid()));

-- Políticas para auditor_questions
CREATE POLICY "Anyone can view active questions" ON public.auditor_questions
    FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage questions" ON public.auditor_questions
    FOR ALL USING (is_admin_or_superadmin(auth.uid()));

-- Políticas para auditor_responses
CREATE POLICY "Authenticated users can view responses" ON public.auditor_responses
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage responses" ON public.auditor_responses
    FOR ALL USING (is_admin_or_superadmin(auth.uid()) OR has_role(auth.uid(), 'director_comercial') OR has_role(auth.uid(), 'responsable_comercial'));

-- Políticas para audit_reports_generated
CREATE POLICY "Authenticated users can view reports" ON public.audit_reports_generated
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage reports" ON public.audit_reports_generated
    FOR ALL USING (is_admin_or_superadmin(auth.uid()) OR has_role(auth.uid(), 'director_comercial'));

-- Políticas para audit_evidence
CREATE POLICY "Authenticated users can view evidence" ON public.audit_evidence
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage evidence" ON public.audit_evidence
    FOR ALL USING (is_admin_or_superadmin(auth.uid()));

-- =====================================================
-- FASE 2: SEED DATA - PREGUNTAS ESTÁNDAR DE AUDITORES
-- =====================================================

-- BANCA (DORA + ISO27001 + MiFID II)
INSERT INTO public.auditor_questions (sector_key, regulation_code, question_code, question_text, expected_evidence, standard_response_template, category, priority) VALUES
('banking', 'DORA', 'DORA-ICT-01', '¿Cómo gestiona los riesgos TIC?', '["matriz_riesgos", "evaluaciones_periodicas", "plan_mitigacion"]', 'La organización implementa un marco de gestión de riesgos TIC basado en...', 'Gestión de Riesgos', 'critical'),
('banking', 'DORA', 'DORA-ICT-02', '¿Existe plan de continuidad de negocio documentado?', '["bcp_documento", "tests_realizados", "rto_rpo_definidos"]', 'Disponemos de un Plan de Continuidad de Negocio (BCP) que incluye...', 'Continuidad', 'critical'),
('banking', 'DORA', 'DORA-ICT-03', '¿Cómo gestiona proveedores TIC terceros?', '["registro_proveedores", "contratos_sla", "evaluaciones_riesgo"]', 'Mantenemos un registro actualizado de proveedores TIC con...', 'Terceros', 'high'),
('banking', 'DORA', 'DORA-INC-01', '¿Cuál es el proceso de gestión de incidentes TIC?', '["log_incidentes", "tiempos_resolucion", "procedimiento_escalado"]', 'El proceso de gestión de incidentes incluye detección, clasificación...', 'Incidentes', 'critical'),
('banking', 'DORA', 'DORA-RES-01', '¿Con qué frecuencia se realizan pruebas de resiliencia?', '["informes_stress_test", "simulacros", "resultados"]', 'Realizamos pruebas de resiliencia digital con frecuencia...', 'Resiliencia', 'high'),
('banking', 'ISO27001', 'ISO27001-A5.1', '¿Las políticas de seguridad están documentadas y firmadas?', '["politicas_firmadas", "fecha_revision", "aprobacion_direccion"]', 'Las políticas de seguridad de la información están documentadas...', 'Políticas', 'critical'),
('banking', 'ISO27001', 'ISO27001-A8.1', '¿El inventario de activos está actualizado?', '["lista_activos", "clasificacion", "propietarios"]', 'Mantenemos un inventario actualizado de activos de información...', 'Activos', 'high'),
('banking', 'ISO27001', 'ISO27001-A9.2', '¿El control de accesos está basado en roles?', '["matriz_permisos", "logs_acceso", "revisiones_periodicas"]', 'Implementamos control de accesos basado en roles (RBAC) con...', 'Accesos', 'critical'),
('banking', 'ISO27001', 'ISO27001-A12.4', '¿Los logs de auditoría están habilitados?', '["muestra_logs_30dias", "politica_retencion", "monitorizacion"]', 'Los logs de auditoría están habilitados en todos los sistemas críticos...', 'Auditoría', 'critical'),
('banking', 'ISO27001', 'ISO27001-A18.1', '¿Se identifican los requisitos legales aplicables?', '["matriz_requisitos", "actualizaciones", "responsables"]', 'Mantenemos una matriz actualizada de requisitos legales...', 'Cumplimiento', 'high'),
('banking', 'MiFID-II', 'MiFID-II-01', '¿Se mantiene registro de operaciones con clientes?', '["historico_transacciones", "comunicaciones", "consentimientos"]', 'Mantenemos registro completo de todas las operaciones...', 'Operaciones', 'critical'),
('banking', 'MiFID-II', 'MiFID-II-02', '¿Cómo se gestionan los conflictos de interés?', '["politica_conflictos", "registro_conflictos", "medidas_mitigacion"]', 'Disponemos de una política de conflictos de interés que...', 'Conflictos', 'high'),
('banking', 'PSD2', 'PSD2-SCA-01', '¿Se implementa autenticación reforzada (SCA)?', '["metodos_autenticacion", "excepciones", "logs_sca"]', 'Implementamos Strong Customer Authentication (SCA) mediante...', 'Autenticación', 'critical'),

-- SALUD (HIPAA + SOC2 + ISO27799)
('health', 'HIPAA', 'HIPAA-164.308', '¿Se ha realizado análisis de riesgos PHI?', '["informe_analisis", "activos_phi", "medidas_proteccion"]', 'Realizamos análisis de riesgos para información sanitaria protegida (PHI)...', 'Riesgos', 'critical'),
('health', 'HIPAA', 'HIPAA-164.312', '¿Los datos están cifrados en tránsito y reposo?', '["config_tls", "cifrado_bd", "certificados"]', 'Implementamos cifrado AES-256 para datos en reposo y TLS 1.3 para...', 'Cifrado', 'critical'),
('health', 'HIPAA', 'HIPAA-164.530', '¿Los pacientes están informados del uso de sus datos?', '["formularios_consentimiento", "politica_privacidad", "registro_consentimientos"]', 'Todos los pacientes reciben información clara sobre el uso de sus datos...', 'Consentimiento', 'critical'),
('health', 'SOC2', 'SOC2-CC6.1', '¿Existe control de acceso lógico implementado?', '["politicas_acceso", "logs_autenticacion", "mfa"]', 'Implementamos control de acceso lógico mediante...', 'Accesos', 'critical'),
('health', 'SOC2', 'SOC2-CC7.2', '¿Los sistemas están monitorizados continuamente?', '["dashboards_monitoreo", "alertas_configuradas", "sla_respuesta"]', 'Disponemos de monitorización continua 24/7 con...', 'Monitorización', 'high'),
('health', 'ISO27799', 'ISO27799-01', '¿Cómo se gestiona la seguridad de datos clínicos?', '["procedimientos", "clasificacion_datos", "accesos_historiales"]', 'La gestión de seguridad de datos clínicos se realiza mediante...', 'Datos Clínicos', 'critical'),

-- INDUSTRIA (ISO 9001 + ISO 14001 + ISO 45001)
('industry', 'ISO9001', 'ISO9001-7.1', '¿Los recursos necesarios están identificados?', '["plan_recursos", "presupuestos", "asignaciones"]', 'Identificamos y asignamos los recursos necesarios para...', 'Recursos', 'high'),
('industry', 'ISO9001', 'ISO9001-8.5', '¿Existe control de producción y servicios?', '["registros_produccion", "kpis_calidad", "no_conformidades"]', 'El control de producción incluye...', 'Producción', 'high'),
('industry', 'ISO9001', 'ISO9001-9.1', '¿Se realiza seguimiento y medición de procesos?', '["indicadores", "auditorias_internas", "mejora_continua"]', 'Realizamos seguimiento mediante indicadores de proceso...', 'Procesos', 'medium'),
('industry', 'ISO14001', 'ISO14001-6.1', '¿Los riesgos ambientales están identificados?', '["matriz_aspectos", "evaluacion_impacto", "medidas_control"]', 'Identificamos aspectos ambientales significativos mediante...', 'Medio Ambiente', 'high'),
('industry', 'ISO14001', 'ISO14001-8.1', '¿Se controlan las operaciones con impacto ambiental?', '["controles_operacionales", "residuos", "emisiones"]', 'Los controles operacionales incluyen...', 'Operaciones', 'medium'),
('industry', 'ISO45001', 'ISO45001-6.1', '¿Existe evaluación de riesgos laborales?', '["plan_prl", "evaluaciones_puestos", "medidas_preventivas"]', 'La evaluación de riesgos laborales se realiza...', 'PRL', 'critical'),
('industry', 'ISO45001', 'ISO45001-8.2', '¿Se gestionan situaciones de emergencia?', '["plan_emergencias", "simulacros", "equipos_emergencia"]', 'Disponemos de planes de emergencia que incluyen...', 'Emergencias', 'high'),

-- RETAIL
('retail', 'PCI-DSS', 'PCI-DSS-3.4', '¿Los datos de tarjeta están protegidos?', '["cifrado_pan", "tokenizacion", "accesos_limitados"]', 'Los datos de tarjetas de pago se protegen mediante...', 'Pagos', 'critical'),
('retail', 'PCI-DSS', 'PCI-DSS-10.1', '¿Se registran accesos a datos de tarjetas?', '["logs_acceso", "alertas", "revision_periodica"]', 'Todos los accesos a datos de tarjetas se registran...', 'Auditoría', 'critical'),
('retail', 'GDPR', 'GDPR-ART-7', '¿Se obtiene consentimiento válido?', '["formularios_consentimiento", "registro", "retiro_consentimiento"]', 'El consentimiento se obtiene de forma clara y explícita...', 'Consentimiento', 'critical'),
('retail', 'GDPR', 'GDPR-ART-17', '¿Se implementa derecho de supresión?', '["procedimiento_supresion", "plazos", "confirmacion"]', 'Implementamos el derecho de supresión mediante...', 'Derechos', 'high'),

-- SERVICIOS/TECNOLOGÍA
('technology', 'SOC2', 'SOC2-CC1.1', '¿La organización demuestra compromiso con la integridad?', '["codigo_etico", "politicas", "formacion"]', 'El compromiso con la integridad se demuestra mediante...', 'Integridad', 'high'),
('technology', 'SOC2', 'SOC2-CC2.1', '¿Se comunican los objetivos de seguridad?', '["comunicaciones", "formacion", "concienciacion"]', 'Los objetivos de seguridad se comunican a través de...', 'Comunicación', 'medium'),
('technology', 'ISO27001', 'ISO27001-A14.2', '¿La seguridad está integrada en el desarrollo?', '["sdlc_seguro", "revision_codigo", "pruebas_seguridad"]', 'La seguridad está integrada en el ciclo de desarrollo mediante...', 'Desarrollo', 'high')
ON CONFLICT (question_code) DO NOTHING;

-- SEED DATA: Plantillas de Informe
INSERT INTO public.auditor_report_templates (sector_key, regulation_code, template_name, frequency, sections, evidence_types) VALUES
('banking', 'DORA', 'Informe Mensual DORA', 'monthly', '[
    {"id": "executive_summary", "title": "Resumen Ejecutivo", "order": 1},
    {"id": "risk_management", "title": "Gestión de Riesgos TIC", "order": 2},
    {"id": "incident_management", "title": "Gestión de Incidentes", "order": 3},
    {"id": "resilience_testing", "title": "Pruebas de Resiliencia", "order": 4},
    {"id": "third_party_risk", "title": "Riesgo de Terceros", "order": 5},
    {"id": "findings", "title": "Hallazgos y Acciones", "order": 6},
    {"id": "metrics", "title": "Métricas KPI", "order": 7},
    {"id": "annexes", "title": "Anexos", "order": 8}
]'::jsonb, ARRAY['audit_logs', 'backup_verifications', 'security_incidents', 'stress_tests', 'risk_assessments']),
('banking', 'ISO27001', 'Informe Trimestral ISO27001', 'quarterly', '[
    {"id": "executive_summary", "title": "Resumen Ejecutivo", "order": 1},
    {"id": "policies", "title": "Políticas de Seguridad", "order": 2},
    {"id": "asset_management", "title": "Gestión de Activos", "order": 3},
    {"id": "access_control", "title": "Control de Acceso", "order": 4},
    {"id": "operations_security", "title": "Seguridad de Operaciones", "order": 5},
    {"id": "compliance", "title": "Cumplimiento", "order": 6},
    {"id": "findings", "title": "Hallazgos", "order": 7}
]'::jsonb, ARRAY['audit_logs', 'policy_signatures', 'access_reviews', 'asset_inventory']),
('health', 'HIPAA', 'Informe Mensual HIPAA', 'monthly', '[
    {"id": "executive_summary", "title": "Resumen Ejecutivo", "order": 1},
    {"id": "phi_protection", "title": "Protección de PHI", "order": 2},
    {"id": "access_controls", "title": "Controles de Acceso", "order": 3},
    {"id": "encryption", "title": "Cifrado", "order": 4},
    {"id": "consent_management", "title": "Gestión de Consentimientos", "order": 5},
    {"id": "incidents", "title": "Incidentes de Seguridad", "order": 6}
]'::jsonb, ARRAY['audit_logs', 'consent_records', 'encryption_configs', 'incident_logs']),
('industry', 'ISO9001', 'Informe Trimestral Calidad', 'quarterly', '[
    {"id": "executive_summary", "title": "Resumen Ejecutivo", "order": 1},
    {"id": "quality_objectives", "title": "Objetivos de Calidad", "order": 2},
    {"id": "process_performance", "title": "Rendimiento de Procesos", "order": 3},
    {"id": "non_conformities", "title": "No Conformidades", "order": 4},
    {"id": "corrective_actions", "title": "Acciones Correctivas", "order": 5},
    {"id": "improvement", "title": "Mejora Continua", "order": 6}
]'::jsonb, ARRAY['process_metrics', 'nc_records', 'corrective_actions', 'audit_findings']);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_auditor_tables_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_auditor_report_templates_timestamp
    BEFORE UPDATE ON public.auditor_report_templates
    FOR EACH ROW EXECUTE FUNCTION update_auditor_tables_timestamp();

CREATE TRIGGER update_auditor_questions_timestamp
    BEFORE UPDATE ON public.auditor_questions
    FOR EACH ROW EXECUTE FUNCTION update_auditor_tables_timestamp();

CREATE TRIGGER update_auditor_responses_timestamp
    BEFORE UPDATE ON public.auditor_responses
    FOR EACH ROW EXECUTE FUNCTION update_auditor_tables_timestamp();