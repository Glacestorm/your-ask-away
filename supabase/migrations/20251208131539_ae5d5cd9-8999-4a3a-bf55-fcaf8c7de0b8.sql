
-- Security incidents table for DORA/NIS2 compliance
CREATE TABLE public.security_incidents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_type TEXT NOT NULL CHECK (incident_type IN ('cyber_attack', 'data_breach', 'system_failure', 'third_party_incident', 'fraud', 'operational_disruption', 'other')),
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    affected_systems TEXT[],
    affected_data_types TEXT[],
    detection_time TIMESTAMP WITH TIME ZONE NOT NULL,
    containment_time TIMESTAMP WITH TIME ZONE,
    resolution_time TIMESTAMP WITH TIME ZONE,
    root_cause TEXT,
    remediation_actions TEXT,
    lessons_learned TEXT,
    reported_to_authority BOOLEAN DEFAULT FALSE,
    authority_report_date TIMESTAMP WITH TIME ZONE,
    authority_reference TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'contained', 'resolved', 'closed')),
    reported_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Risk assessments table
CREATE TABLE public.risk_assessments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_name TEXT NOT NULL,
    assessment_type TEXT NOT NULL CHECK (assessment_type IN ('ict_risk', 'third_party_risk', 'operational_risk', 'cyber_risk', 'compliance_risk')),
    scope TEXT NOT NULL,
    methodology TEXT,
    risk_score NUMERIC CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN risk_score >= 75 THEN 'critical'
            WHEN risk_score >= 50 THEN 'high'
            WHEN risk_score >= 25 THEN 'medium'
            ELSE 'low'
        END
    ) STORED,
    identified_risks JSONB DEFAULT '[]',
    mitigation_measures JSONB DEFAULT '[]',
    residual_risk_score NUMERIC,
    assessment_date DATE NOT NULL,
    next_review_date DATE,
    assessor_id UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'pending_review', 'approved', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Resilience tests table (pentesting, red/blue team)
CREATE TABLE public.resilience_tests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    test_name TEXT NOT NULL,
    test_type TEXT NOT NULL CHECK (test_type IN ('penetration_test', 'red_team', 'blue_team', 'purple_team', 'vulnerability_scan', 'disaster_recovery', 'business_continuity', 'tabletop_exercise')),
    scope TEXT NOT NULL,
    target_systems TEXT[],
    test_date DATE NOT NULL,
    test_duration_hours INTEGER,
    tester_organization TEXT,
    tester_certification TEXT,
    findings JSONB DEFAULT '[]',
    critical_findings_count INTEGER DEFAULT 0,
    high_findings_count INTEGER DEFAULT 0,
    medium_findings_count INTEGER DEFAULT 0,
    low_findings_count INTEGER DEFAULT 0,
    remediation_deadline DATE,
    remediation_status TEXT DEFAULT 'pending' CHECK (remediation_status IN ('pending', 'in_progress', 'completed', 'verified')),
    executive_summary TEXT,
    recommendations TEXT,
    report_url TEXT,
    conducted_by UUID REFERENCES auth.users(id),
    reviewed_by UUID REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Third party risk management (DORA requirement)
CREATE TABLE public.third_party_providers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_name TEXT NOT NULL,
    provider_type TEXT NOT NULL CHECK (provider_type IN ('cloud_service', 'ict_service', 'data_processor', 'software_vendor', 'infrastructure', 'consulting', 'other')),
    criticality TEXT NOT NULL CHECK (criticality IN ('critical', 'important', 'standard', 'low')),
    contract_start_date DATE,
    contract_end_date DATE,
    services_provided TEXT[],
    data_access_level TEXT CHECK (data_access_level IN ('full', 'limited', 'none')),
    data_location TEXT,
    certifications TEXT[],
    last_audit_date DATE,
    next_audit_date DATE,
    risk_score NUMERIC,
    risk_level TEXT,
    exit_strategy TEXT,
    substitute_provider TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    sla_compliance_rate NUMERIC,
    incident_count INTEGER DEFAULT 0,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'under_review', 'suspended', 'terminated')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- DORA compliance checklist
CREATE TABLE public.dora_compliance_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    article TEXT NOT NULL,
    requirement_category TEXT NOT NULL CHECK (requirement_category IN ('ict_risk_management', 'incident_reporting', 'resilience_testing', 'third_party_risk', 'information_sharing')),
    requirement_title TEXT NOT NULL,
    requirement_description TEXT,
    implementation_status TEXT NOT NULL DEFAULT 'not_started' CHECK (implementation_status IN ('not_started', 'in_progress', 'implemented', 'verified', 'not_applicable')),
    evidence_description TEXT,
    evidence_url TEXT,
    responsible_person UUID REFERENCES auth.users(id),
    target_date DATE,
    completion_date DATE,
    notes TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resilience_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.third_party_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dora_compliance_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for security_incidents
CREATE POLICY "Admins can manage security incidents"
    ON public.security_incidents FOR ALL
    USING (is_admin_or_superadmin(auth.uid()) OR has_role(auth.uid(), 'director_comercial'));

CREATE POLICY "Users can view security incidents"
    ON public.security_incidents FOR SELECT
    USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'auditor'));

-- RLS policies for risk_assessments
CREATE POLICY "Admins can manage risk assessments"
    ON public.risk_assessments FOR ALL
    USING (is_admin_or_superadmin(auth.uid()) OR has_role(auth.uid(), 'director_comercial'));

CREATE POLICY "Users can view risk assessments"
    ON public.risk_assessments FOR SELECT
    USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'auditor'));

-- RLS policies for resilience_tests
CREATE POLICY "Admins can manage resilience tests"
    ON public.resilience_tests FOR ALL
    USING (is_admin_or_superadmin(auth.uid()) OR has_role(auth.uid(), 'director_comercial'));

CREATE POLICY "Users can view resilience tests"
    ON public.resilience_tests FOR SELECT
    USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'auditor'));

-- RLS policies for third_party_providers
CREATE POLICY "Admins can manage third party providers"
    ON public.third_party_providers FOR ALL
    USING (is_admin_or_superadmin(auth.uid()) OR has_role(auth.uid(), 'director_comercial'));

CREATE POLICY "Users can view third party providers"
    ON public.third_party_providers FOR SELECT
    USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'auditor'));

-- RLS policies for dora_compliance_items
CREATE POLICY "Admins can manage DORA compliance"
    ON public.dora_compliance_items FOR ALL
    USING (is_admin_or_superadmin(auth.uid()) OR has_role(auth.uid(), 'director_comercial'));

CREATE POLICY "Users can view DORA compliance"
    ON public.dora_compliance_items FOR SELECT
    USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'auditor'));

-- Indexes
CREATE INDEX idx_security_incidents_status ON public.security_incidents(status);
CREATE INDEX idx_security_incidents_severity ON public.security_incidents(severity);
CREATE INDEX idx_risk_assessments_status ON public.risk_assessments(status);
CREATE INDEX idx_resilience_tests_status ON public.resilience_tests(status);
CREATE INDEX idx_dora_compliance_status ON public.dora_compliance_items(implementation_status);

-- Triggers for updated_at
CREATE TRIGGER update_security_incidents_updated_at BEFORE UPDATE ON public.security_incidents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_risk_assessments_updated_at BEFORE UPDATE ON public.risk_assessments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_resilience_tests_updated_at BEFORE UPDATE ON public.resilience_tests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_third_party_providers_updated_at BEFORE UPDATE ON public.third_party_providers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dora_compliance_items_updated_at BEFORE UPDATE ON public.dora_compliance_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial DORA compliance checklist items
INSERT INTO public.dora_compliance_items (article, requirement_category, requirement_title, requirement_description, priority) VALUES
('Art. 5-6', 'ict_risk_management', 'Marco de gestión de riesgos TIC', 'Establecer un marco sólido de gestión de riesgos TIC', 'critical'),
('Art. 5-6', 'ict_risk_management', 'Estrategia de resiliencia operativa', 'Definir estrategia de resiliencia operativa digital', 'critical'),
('Art. 7', 'ict_risk_management', 'Sistemas TIC actualizados', 'Mantener sistemas TIC fiables, continuamente actualizados', 'high'),
('Art. 8', 'ict_risk_management', 'Identificación de funciones críticas', 'Identificar y documentar funciones críticas de negocio', 'critical'),
('Art. 9', 'ict_risk_management', 'Protección y prevención', 'Implementar políticas de seguridad TIC adecuadas', 'high'),
('Art. 10', 'ict_risk_management', 'Detección de amenazas', 'Establecer mecanismos de detección de actividades anómalas', 'high'),
('Art. 11', 'ict_risk_management', 'Respuesta y recuperación', 'Desarrollar planes de respuesta y recuperación ante incidentes', 'critical'),
('Art. 12', 'ict_risk_management', 'Políticas de backup', 'Implementar políticas de backup y restauración', 'high'),
('Art. 13', 'ict_risk_management', 'Aprendizaje y evolución', 'Establecer procesos de mejora continua', 'medium'),
('Art. 17-23', 'incident_reporting', 'Clasificación de incidentes', 'Clasificar incidentes TIC según criterios establecidos', 'critical'),
('Art. 17-23', 'incident_reporting', 'Notificación a autoridades', 'Notificar incidentes graves a autoridades competentes', 'critical'),
('Art. 17-23', 'incident_reporting', 'Registro de incidentes', 'Mantener registro de todos los incidentes TIC', 'high'),
('Art. 24-27', 'resilience_testing', 'Programa de pruebas', 'Establecer programa de pruebas de resiliencia operativa', 'critical'),
('Art. 24-27', 'resilience_testing', 'Pruebas de penetración (TLPT)', 'Realizar pruebas de penetración avanzadas', 'high'),
('Art. 24-27', 'resilience_testing', 'Pruebas de continuidad', 'Ejecutar pruebas de continuidad de negocio', 'high'),
('Art. 28-44', 'third_party_risk', 'Gestión de proveedores TIC', 'Establecer marco de gestión de terceros TIC', 'critical'),
('Art. 28-44', 'third_party_risk', 'Due diligence proveedores', 'Realizar due diligence de proveedores críticos', 'high'),
('Art. 28-44', 'third_party_risk', 'Estrategias de salida', 'Definir estrategias de salida para proveedores críticos', 'high'),
('Art. 28-44', 'third_party_risk', 'Supervisión continua', 'Monitorizar rendimiento y riesgos de proveedores', 'medium'),
('Art. 45', 'information_sharing', 'Intercambio de información', 'Participar en mecanismos de intercambio de amenazas', 'medium');
