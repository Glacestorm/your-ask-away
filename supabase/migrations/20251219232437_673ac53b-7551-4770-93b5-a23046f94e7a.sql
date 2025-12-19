-- =====================================================
-- FASE 6: IA QUE VENDE - Tablas de Base de Datos
-- =====================================================

-- =====================================================
-- ENTREGABLE 1: COPILOTO POR ROL
-- =====================================================

-- Configuración de copilotos por rol
CREATE TABLE public.copilot_role_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  copilot_name TEXT NOT NULL,
  copilot_description TEXT,
  system_prompt TEXT NOT NULL,
  available_tools JSONB DEFAULT '[]'::jsonb,
  priority_metrics TEXT[] DEFAULT '{}',
  quick_actions JSONB DEFAULT '[]'::jsonb,
  context_sources TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sesiones del copiloto (historial por usuario)
CREATE TABLE public.copilot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  context_data JSONB DEFAULT '{}'::jsonb,
  active_suggestions JSONB DEFAULT '[]'::jsonb,
  metrics_snapshot JSONB DEFAULT '{}'::jsonb,
  last_interaction TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Acciones ejecutadas por recomendación IA
CREATE TABLE public.copilot_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.copilot_sessions(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_source TEXT NOT NULL, -- 'nba', 'copilot', 'control_continuo'
  entity_type TEXT,
  entity_id UUID,
  action_data JSONB DEFAULT '{}'::jsonb,
  ai_reasoning TEXT,
  outcome TEXT, -- 'completed', 'dismissed', 'deferred', 'failed'
  outcome_value NUMERIC, -- Valor MRR impactado
  outcome_details JSONB DEFAULT '{}'::jsonb,
  executed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ENTREGABLE 2: NEXT BEST ACTION (NBA)
-- =====================================================

-- Definición de tipos de acciones NBA
CREATE TABLE public.nba_action_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_code TEXT UNIQUE NOT NULL,
  action_name TEXT NOT NULL,
  action_description TEXT,
  action_category TEXT NOT NULL, -- 'revenue', 'retention', 'compliance', 'efficiency'
  target_roles TEXT[] NOT NULL,
  execution_type TEXT NOT NULL, -- 'automatic', 'one_click', 'wizard', 'external'
  execution_config JSONB DEFAULT '{}'::jsonb,
  estimated_mrr_impact NUMERIC,
  effort_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  priority_weight INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cola de acciones NBA pendientes por usuario
CREATE TABLE public.nba_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type_id UUID REFERENCES public.nba_action_types(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  priority INTEGER DEFAULT 5,
  score NUMERIC DEFAULT 0,
  context_data JSONB DEFAULT '{}'::jsonb,
  ai_reasoning TEXT,
  estimated_value NUMERIC,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'dismissed', 'expired'
  executed_at TIMESTAMPTZ,
  executed_by UUID,
  execution_result JSONB,
  mrr_impact_actual NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ENTREGABLE 3: CONTROLES CONTINUOS
-- =====================================================

-- Definición de controles continuos
CREATE TABLE public.continuous_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_code TEXT UNIQUE NOT NULL,
  control_name TEXT NOT NULL,
  control_description TEXT,
  control_category TEXT NOT NULL, -- 'compliance', 'risk', 'performance', 'security'
  check_query TEXT, -- SQL query para verificar
  check_logic JSONB DEFAULT '{}'::jsonb, -- Lógica de verificación
  check_frequency TEXT NOT NULL, -- 'realtime', 'hourly', 'daily', 'weekly'
  threshold_config JSONB DEFAULT '{}'::jsonb,
  severity_on_failure TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  auto_generate_evidence BOOLEAN DEFAULT true,
  evidence_template JSONB DEFAULT '{}'::jsonb,
  notification_channels TEXT[] DEFAULT '{email}'::text[],
  notification_recipients JSONB DEFAULT '[]'::jsonb,
  remediation_steps JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_execution_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ejecuciones de controles
CREATE TABLE public.control_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID NOT NULL REFERENCES public.continuous_controls(id) ON DELETE CASCADE,
  execution_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  execution_end TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'passed', 'failed', 'warning', 'error'
  items_checked INTEGER DEFAULT 0,
  items_passed INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  findings JSONB DEFAULT '[]'::jsonb,
  metrics_collected JSONB DEFAULT '{}'::jsonb,
  evidence_ids UUID[] DEFAULT '{}',
  ai_analysis TEXT,
  ai_recommendations JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Alertas de controles
CREATE TABLE public.control_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID NOT NULL REFERENCES public.continuous_controls(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES public.control_executions(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL, -- 'threshold_breach', 'anomaly', 'trend', 'compliance_gap'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  description TEXT,
  affected_entities JSONB DEFAULT '[]'::jsonb,
  affected_count INTEGER DEFAULT 0,
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  evidence_summary JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'open', -- 'open', 'acknowledged', 'in_progress', 'resolved', 'dismissed'
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_copilot_sessions_user_id ON public.copilot_sessions(user_id);
CREATE INDEX idx_copilot_sessions_role ON public.copilot_sessions(role);
CREATE INDEX idx_copilot_action_log_user_id ON public.copilot_action_log(user_id);
CREATE INDEX idx_copilot_action_log_action_source ON public.copilot_action_log(action_source);
CREATE INDEX idx_copilot_action_log_executed_at ON public.copilot_action_log(executed_at);

CREATE INDEX idx_nba_queue_user_id ON public.nba_queue(user_id);
CREATE INDEX idx_nba_queue_status ON public.nba_queue(status);
CREATE INDEX idx_nba_queue_priority ON public.nba_queue(priority DESC);
CREATE INDEX idx_nba_queue_entity ON public.nba_queue(entity_type, entity_id);

CREATE INDEX idx_control_executions_control_id ON public.control_executions(control_id);
CREATE INDEX idx_control_executions_status ON public.control_executions(status);
CREATE INDEX idx_control_alerts_control_id ON public.control_alerts(control_id);
CREATE INDEX idx_control_alerts_status ON public.control_alerts(status);
CREATE INDEX idx_control_alerts_severity ON public.control_alerts(severity);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.copilot_role_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_action_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nba_action_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nba_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.continuous_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_alerts ENABLE ROW LEVEL SECURITY;

-- Copilot Role Configs - Solo admins pueden modificar, todos autenticados pueden leer
CREATE POLICY "copilot_role_configs_select" ON public.copilot_role_configs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "copilot_role_configs_admin" ON public.copilot_role_configs
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

-- Copilot Sessions - Usuarios ven sus propias sesiones
CREATE POLICY "copilot_sessions_own" ON public.copilot_sessions
  FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "copilot_sessions_admin_read" ON public.copilot_sessions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

-- Copilot Action Log - Usuarios ven sus propias acciones
CREATE POLICY "copilot_action_log_own" ON public.copilot_action_log
  FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "copilot_action_log_admin_read" ON public.copilot_action_log
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin', 'director_comercial'))
  );

-- NBA Action Types - Solo admins modifican
CREATE POLICY "nba_action_types_select" ON public.nba_action_types
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "nba_action_types_admin" ON public.nba_action_types
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

-- NBA Queue - Usuarios ven su propia cola
CREATE POLICY "nba_queue_own" ON public.nba_queue
  FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "nba_queue_admin_read" ON public.nba_queue
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin', 'director_comercial'))
  );

-- Continuous Controls - Solo admins modifican
CREATE POLICY "continuous_controls_select" ON public.continuous_controls
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "continuous_controls_admin" ON public.continuous_controls
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

-- Control Executions - Todos autenticados pueden leer
CREATE POLICY "control_executions_select" ON public.control_executions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "control_executions_admin" ON public.control_executions
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

-- Control Alerts - Todos autenticados pueden leer, admins pueden modificar
CREATE POLICY "control_alerts_select" ON public.control_alerts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "control_alerts_admin" ON public.control_alerts
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin', 'director_comercial'))
  );

-- =====================================================
-- DATOS INICIALES: Configuración de Copilotos
-- =====================================================

INSERT INTO public.copilot_role_configs (role, copilot_name, copilot_description, system_prompt, available_tools, priority_metrics, quick_actions, context_sources) VALUES
('gestor', 'Copiloto de Ventas', 'Tu asistente de ventas personal que te ayuda a maximizar oportunidades', 
'Eres un copiloto de ventas experto para un CRM bancario. Tu objetivo es ayudar al gestor a:
1. Identificar las mejores oportunidades de venta del día
2. Preparar visitas con información relevante del cliente
3. Sugerir productos adicionales basados en el perfil del cliente
4. Priorizar acciones que maximicen el MRR
Siempre da recomendaciones accionables y específicas, no consejos genéricos.',
'["query_customer_360", "get_opportunities", "schedule_visit", "send_proposal", "cross_sell_analysis"]'::jsonb,
ARRAY['visitas_semanales', 'oportunidades_cerradas', 'revenue_generado'],
'[{"id": "next_visit", "label": "Próxima Visita", "icon": "Calendar"}, {"id": "hot_leads", "label": "Leads Calientes", "icon": "Flame"}, {"id": "pending_proposals", "label": "Propuestas Pendientes", "icon": "FileText"}]'::jsonb,
ARRAY['customer_360_profiles', 'opportunities', 'visits', 'company_products']),

('director_oficina', 'Copiloto de Dirección de Oficina', 'Tu asistente para gestionar el equipo y alcanzar objetivos', 
'Eres un copiloto de dirección de oficina para un CRM bancario. Tu objetivo es ayudar al director a:
1. Monitorear el rendimiento del equipo de gestores
2. Identificar gestores que necesitan apoyo
3. Detectar oportunidades de coaching
4. Asegurar el cumplimiento de objetivos de oficina
Proporciona insights accionables sobre el equipo.',
'["team_performance", "quota_tracking", "gestor_analysis", "pipeline_health"]'::jsonb,
ARRAY['objetivo_oficina', 'rendimiento_equipo', 'conversion_rate'],
'[{"id": "team_status", "label": "Estado del Equipo", "icon": "Users"}, {"id": "at_risk", "label": "Objetivos en Riesgo", "icon": "AlertTriangle"}, {"id": "coaching", "label": "Oportunidades Coaching", "icon": "GraduationCap"}]'::jsonb,
ARRAY['sales_quotas', 'sales_achievements', 'visits', 'profiles']),

('director_comercial', 'Copiloto de Dirección Comercial', 'Tu asistente estratégico para decisiones de negocio', 
'Eres un copiloto de dirección comercial para un CRM bancario. Tu objetivo es ayudar al director comercial a:
1. Analizar tendencias de mercado y rendimiento global
2. Identificar oportunidades estratégicas de crecimiento
3. Detectar riesgos en el pipeline y cartera
4. Optimizar la asignación de recursos
Proporciona análisis estratégico basado en datos.',
'["market_analysis", "pipeline_intelligence", "revenue_forecasting", "risk_analysis", "resource_optimization"]'::jsonb,
ARRAY['mrr_total', 'churn_rate', 'pipeline_value', 'nps'],
'[{"id": "strategic_risks", "label": "Riesgos Estratégicos", "icon": "Shield"}, {"id": "growth_opportunities", "label": "Oportunidades Crecimiento", "icon": "TrendingUp"}, {"id": "market_trends", "label": "Tendencias Mercado", "icon": "BarChart3"}]'::jsonb,
ARRAY['revenue_signals', 'analytics_predictions', 'pipeline_snapshots', 'companies']),

('admin', 'Copiloto de Administración', 'Tu asistente para compliance, seguridad y operaciones', 
'Eres un copiloto de administración para un CRM bancario. Tu objetivo es ayudar al administrador a:
1. Monitorear el cumplimiento regulatorio
2. Detectar anomalías de seguridad
3. Gestionar evidencias para auditorías
4. Optimizar procesos operativos
Prioriza siempre la seguridad y el compliance.',
'["compliance_check", "security_audit", "evidence_generation", "process_optimization"]'::jsonb,
ARRAY['compliance_score', 'open_alerts', 'pending_kyc', 'security_incidents'],
'[{"id": "compliance_status", "label": "Estado Compliance", "icon": "CheckCircle"}, {"id": "security_alerts", "label": "Alertas Seguridad", "icon": "ShieldAlert"}, {"id": "audit_prep", "label": "Preparación Auditoría", "icon": "FileSearch"}]'::jsonb,
ARRAY['audit_evidence', 'control_alerts', 'security_audit_logs', 'compliance_requirements']);

-- =====================================================
-- DATOS INICIALES: Tipos de Acciones NBA
-- =====================================================

INSERT INTO public.nba_action_types (action_code, action_name, action_description, action_category, target_roles, execution_type, estimated_mrr_impact, effort_level, priority_weight) VALUES
-- Acciones de Revenue
('CALL_HOT_LEAD', 'Llamar Lead Caliente', 'Contactar inmediatamente a un lead con alta probabilidad de conversión', 'revenue', ARRAY['gestor'], 'one_click', 500, 'low', 9),
('SCHEDULE_VISIT', 'Agendar Visita Prioritaria', 'Programar visita con cliente de alto valor', 'revenue', ARRAY['gestor'], 'wizard', 1000, 'medium', 8),
('SEND_PROPOSAL', 'Enviar Propuesta Personalizada', 'Generar y enviar propuesta adaptada al cliente', 'revenue', ARRAY['gestor'], 'wizard', 2000, 'medium', 8),
('CROSS_SELL_PRODUCT', 'Ofrecer Producto Adicional', 'Proponer producto complementario basado en análisis', 'revenue', ARRAY['gestor'], 'one_click', 800, 'low', 7),
('UPSELL_OPPORTUNITY', 'Upgrade de Producto', 'Ofrecer upgrade a un cliente existente', 'revenue', ARRAY['gestor'], 'wizard', 1500, 'medium', 7),

-- Acciones de Retención
('RETENTION_CALL', 'Llamada de Retención', 'Contactar cliente con riesgo de churn', 'retention', ARRAY['gestor', 'director_oficina'], 'one_click', 3000, 'high', 10),
('SPECIAL_OFFER', 'Oferta Especial Anti-churn', 'Preparar oferta especial para retener cliente', 'retention', ARRAY['gestor', 'director_comercial'], 'wizard', 2500, 'high', 9),
('SATISFACTION_SURVEY', 'Encuesta de Satisfacción', 'Enviar encuesta para detectar problemas', 'retention', ARRAY['gestor'], 'automatic', 0, 'low', 5),
('WIN_BACK_CAMPAIGN', 'Campaña de Recuperación', 'Iniciar campaña para cliente perdido', 'retention', ARRAY['director_comercial'], 'wizard', 2000, 'high', 6),

-- Acciones de Compliance
('UPDATE_KYC', 'Actualizar Documentación KYC', 'Solicitar actualización de documentos vencidos', 'compliance', ARRAY['gestor', 'admin'], 'wizard', 0, 'medium', 8),
('REVIEW_TRANSACTION', 'Revisar Transacción', 'Analizar transacción marcada como sospechosa', 'compliance', ARRAY['admin'], 'wizard', 0, 'high', 10),
('SIGN_DOCUMENT', 'Firmar Documento Regulatorio', 'Obtener firma en documento de compliance', 'compliance', ARRAY['gestor', 'admin'], 'one_click', 0, 'low', 7),
('AML_CHECK', 'Verificación AML', 'Ejecutar verificación anti-lavado', 'compliance', ARRAY['admin'], 'automatic', 0, 'high', 9),

-- Acciones de Eficiencia
('DELEGATE_TASK', 'Delegar Tarea', 'Asignar tarea a miembro del equipo adecuado', 'efficiency', ARRAY['director_oficina', 'director_comercial'], 'one_click', 0, 'low', 5),
('AUTOMATE_FOLLOW_UP', 'Automatizar Seguimiento', 'Configurar seguimiento automático', 'efficiency', ARRAY['gestor'], 'one_click', 0, 'low', 4),
('BATCH_UPDATE', 'Actualización en Lote', 'Actualizar múltiples registros relacionados', 'efficiency', ARRAY['admin'], 'wizard', 0, 'medium', 4);

-- =====================================================
-- DATOS INICIALES: Controles Continuos
-- =====================================================

INSERT INTO public.continuous_controls (control_code, control_name, control_description, control_category, check_frequency, severity_on_failure, auto_generate_evidence, threshold_config) VALUES
-- Controles de Compliance
('KYC_EXPIRED', 'Documentos KYC Vencidos', 'Detecta clientes con documentación KYC vencida o próxima a vencer', 'compliance', 'daily', 'high', true, 
'{"warning_days": 30, "critical_days": 0}'::jsonb),
('AML_PENDING', 'Transacciones AML Pendientes', 'Transacciones que requieren verificación AML', 'compliance', 'hourly', 'critical', true,
'{"max_pending_hours": 24}'::jsonb),
('SIGNATURE_PENDING', 'Firmas Compliance Pendientes', 'Documentos regulatorios pendientes de firma', 'compliance', 'daily', 'medium', true,
'{"max_pending_days": 7}'::jsonb),

-- Controles de Riesgo
('CHURN_HIGH_RISK', 'Clientes Alto Riesgo Churn', 'Clientes con probabilidad de churn superior al umbral', 'risk', 'daily', 'high', true,
'{"churn_threshold": 70}'::jsonb),
('OPPORTUNITY_STALE', 'Oportunidades Estancadas', 'Oportunidades sin actividad por más de 14 días', 'risk', 'daily', 'medium', true,
'{"stale_days": 14}'::jsonb),
('ANOMALY_DETECTION', 'Detección de Anomalías', 'Transacciones o comportamientos anómalos', 'risk', 'hourly', 'high', true,
'{"sensitivity": 0.8}'::jsonb),
('CONCENTRATION_RISK', 'Riesgo de Concentración', 'Exceso de exposición a un solo cliente o sector', 'risk', 'weekly', 'medium', true,
'{"max_concentration_pct": 20}'::jsonb),

-- Controles de Performance
('GESTOR_INACTIVE', 'Gestores Sin Actividad', 'Gestores sin visitas registradas en período', 'performance', 'daily', 'medium', false,
'{"inactive_days": 7}'::jsonb),
('QUOTA_AT_RISK', 'Objetivos en Riesgo', 'Gestores con bajo progreso hacia objetivo', 'performance', 'daily', 'high', false,
'{"min_progress_pct": 50, "days_into_period": 15}'::jsonb),
('SLA_BREACH', 'Incumplimiento SLA', 'Tiempos de respuesta que exceden SLA', 'performance', 'hourly', 'high', true,
'{"max_response_hours": 24}'::jsonb),

-- Controles de Seguridad
('LOGIN_FAILURES', 'Intentos Login Fallidos', 'Múltiples intentos de login fallidos', 'security', 'realtime', 'critical', true,
'{"max_failures": 5, "window_minutes": 15}'::jsonb),
('OFF_HOURS_ACCESS', 'Accesos Fuera de Horario', 'Accesos al sistema fuera del horario laboral', 'security', 'realtime', 'medium', true,
'{"work_hours_start": 7, "work_hours_end": 21}'::jsonb),
('PERMISSION_CHANGE', 'Cambios en Permisos', 'Modificaciones a roles o permisos críticos', 'security', 'realtime', 'high', true,
'{"critical_roles": ["superadmin", "admin"]}'::jsonb);

-- =====================================================
-- FUNCIÓN: Actualizar updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_phase6_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER copilot_role_configs_updated_at
  BEFORE UPDATE ON public.copilot_role_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER copilot_sessions_updated_at
  BEFORE UPDATE ON public.copilot_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER nba_action_types_updated_at
  BEFORE UPDATE ON public.nba_action_types
  FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER nba_queue_updated_at
  BEFORE UPDATE ON public.nba_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER continuous_controls_updated_at
  BEFORE UPDATE ON public.continuous_controls
  FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER control_alerts_updated_at
  BEFORE UPDATE ON public.control_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();