-- =====================================================
-- FASE 1: AGENTIC AI & AUTO-RESOLUCIÓN
-- Tablas para Multi-Agent Orchestrator, Action Execution y Reinforcement Learning
-- =====================================================

-- Tabla principal de agentes especializados de soporte
CREATE TABLE IF NOT EXISTS public.support_specialized_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key TEXT NOT NULL UNIQUE,
  agent_name TEXT NOT NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('diagnostic', 'resolution', 'documentation', 'escalation', 'triage', 'specialist')),
  description TEXT,
  capabilities JSONB DEFAULT '[]'::jsonb,
  system_prompt TEXT,
  confidence_threshold NUMERIC(3,2) DEFAULT 0.75,
  max_autonomous_actions INTEGER DEFAULT 5,
  requires_approval_above NUMERIC(3,2) DEFAULT 0.90,
  is_active BOOLEAN DEFAULT true,
  execution_priority INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de sesiones de orquestación multi-agente
CREATE TABLE IF NOT EXISTS public.support_orchestration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  support_session_id UUID REFERENCES remote_support_sessions(id) ON DELETE SET NULL,
  initiated_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'escalated', 'failed', 'paused')),
  orchestration_mode TEXT DEFAULT 'collaborative' CHECK (orchestration_mode IN ('sequential', 'parallel', 'collaborative', 'competitive')),
  active_agents TEXT[] DEFAULT '{}',
  context_data JSONB DEFAULT '{}'::jsonb,
  resolution_summary JSONB,
  total_actions_taken INTEGER DEFAULT 0,
  auto_resolved BOOLEAN DEFAULT false,
  resolution_time_ms INTEGER,
  escalated_to UUID REFERENCES auth.users(id),
  escalation_reason TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de tareas asignadas a agentes en una sesión
CREATE TABLE IF NOT EXISTS public.support_agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orchestration_session_id UUID NOT NULL REFERENCES support_orchestration_sessions(id) ON DELETE CASCADE,
  agent_key TEXT NOT NULL REFERENCES support_specialized_agents(agent_key),
  task_type TEXT NOT NULL,
  task_description TEXT,
  input_context JSONB,
  output_result JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped', 'awaiting_approval')),
  confidence_score NUMERIC(3,2),
  execution_time_ms INTEGER,
  tokens_used INTEGER,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  parent_task_id UUID REFERENCES support_agent_tasks(id),
  depends_on_tasks UUID[] DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de acciones ejecutables predefinidas
CREATE TABLE IF NOT EXISTS public.support_executable_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key TEXT NOT NULL UNIQUE,
  action_name TEXT NOT NULL,
  action_category TEXT NOT NULL CHECK (action_category IN ('diagnostic', 'remediation', 'configuration', 'communication', 'documentation', 'escalation')),
  description TEXT,
  script_type TEXT CHECK (script_type IN ('powershell', 'bash', 'python', 'api_call', 'database', 'workflow')),
  script_template TEXT,
  input_schema JSONB,
  output_schema JSONB,
  required_permissions TEXT[] DEFAULT '{}',
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  requires_approval BOOLEAN DEFAULT false,
  approval_roles TEXT[] DEFAULT '{}',
  rollback_action_key TEXT,
  max_execution_time_seconds INTEGER DEFAULT 300,
  is_active BOOLEAN DEFAULT true,
  success_rate NUMERIC(5,2) DEFAULT 0,
  avg_execution_time_ms INTEGER,
  execution_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de ejecuciones de acciones
CREATE TABLE IF NOT EXISTS public.support_action_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orchestration_session_id UUID REFERENCES support_orchestration_sessions(id) ON DELETE SET NULL,
  agent_task_id UUID REFERENCES support_agent_tasks(id) ON DELETE SET NULL,
  action_key TEXT NOT NULL REFERENCES support_executable_actions(action_key),
  executed_by_agent TEXT,
  approved_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'executing', 'completed', 'failed', 'rolled_back', 'cancelled')),
  input_params JSONB,
  output_result JSONB,
  error_details JSONB,
  pre_execution_snapshot JSONB,
  post_execution_snapshot JSONB,
  can_rollback BOOLEAN DEFAULT false,
  rolled_back_at TIMESTAMPTZ,
  rollback_result JSONB,
  execution_time_ms INTEGER,
  confidence_score NUMERIC(3,2),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de feedback para reinforcement learning
CREATE TABLE IF NOT EXISTS public.support_agent_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orchestration_session_id UUID REFERENCES support_orchestration_sessions(id) ON DELETE SET NULL,
  agent_task_id UUID REFERENCES support_agent_tasks(id) ON DELETE SET NULL,
  action_execution_id UUID REFERENCES support_action_executions(id) ON DELETE SET NULL,
  agent_key TEXT NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('explicit_rating', 'implicit_signal', 'outcome_based', 'correction', 'escalation_trigger')),
  outcome_score NUMERIC(3,2) NOT NULL CHECK (outcome_score >= -1 AND outcome_score <= 1),
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  feedback_source TEXT CHECK (feedback_source IN ('user', 'system', 'supervisor', 'automated')),
  feedback_text TEXT,
  context_snapshot JSONB,
  action_taken TEXT,
  expected_outcome TEXT,
  actual_outcome TEXT,
  improvement_suggestion TEXT,
  learned_pattern JSONB,
  applied_to_training BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  given_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de patrones aprendidos por los agentes
CREATE TABLE IF NOT EXISTS public.support_learned_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key TEXT NOT NULL,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('success_pattern', 'failure_pattern', 'escalation_pattern', 'optimization', 'context_rule')),
  pattern_name TEXT NOT NULL,
  pattern_description TEXT,
  trigger_conditions JSONB NOT NULL,
  recommended_actions JSONB,
  confidence_boost NUMERIC(3,2) DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_applied_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  derived_from_feedbacks UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de métricas de rendimiento de agentes
CREATE TABLE IF NOT EXISTS public.support_agent_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key TEXT NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_tasks INTEGER DEFAULT 0,
  successful_tasks INTEGER DEFAULT 0,
  failed_tasks INTEGER DEFAULT 0,
  escalated_tasks INTEGER DEFAULT 0,
  auto_resolved_count INTEGER DEFAULT 0,
  avg_confidence_score NUMERIC(3,2),
  avg_execution_time_ms INTEGER,
  total_tokens_used INTEGER DEFAULT 0,
  user_satisfaction_avg NUMERIC(3,2),
  feedback_count INTEGER DEFAULT 0,
  patterns_applied INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_key, metric_date)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_orchestration_sessions_status ON support_orchestration_sessions(status);
CREATE INDEX IF NOT EXISTS idx_orchestration_sessions_support ON support_orchestration_sessions(support_session_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_session ON support_agent_tasks(orchestration_session_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON support_agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_action_executions_session ON support_action_executions(orchestration_session_id);
CREATE INDEX IF NOT EXISTS idx_action_executions_status ON support_action_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_feedback_agent ON support_agent_feedback(agent_key);
CREATE INDEX IF NOT EXISTS idx_agent_feedback_session ON support_agent_feedback(orchestration_session_id);
CREATE INDEX IF NOT EXISTS idx_learned_patterns_agent ON support_learned_patterns(agent_key);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent_date ON support_agent_metrics(agent_key, metric_date);

-- Enable RLS
ALTER TABLE support_specialized_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_orchestration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_executable_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_action_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_agent_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_learned_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_agent_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies para support_specialized_agents (lectura pública para usuarios autenticados)
CREATE POLICY "Users can view specialized agents" ON support_specialized_agents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage specialized agents" ON support_specialized_agents
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- RLS Policies para support_orchestration_sessions
CREATE POLICY "Users can view their orchestration sessions" ON support_orchestration_sessions
  FOR SELECT TO authenticated USING (
    initiated_by = auth.uid() OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin', 'director_comercial'))
  );

CREATE POLICY "Authenticated users can create orchestration sessions" ON support_orchestration_sessions
  FOR INSERT TO authenticated WITH CHECK (initiated_by = auth.uid());

CREATE POLICY "Users can update their sessions" ON support_orchestration_sessions
  FOR UPDATE TO authenticated USING (
    initiated_by = auth.uid() OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- RLS Policies para support_agent_tasks
CREATE POLICY "Users can view tasks in their sessions" ON support_agent_tasks
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM support_orchestration_sessions s 
      WHERE s.id = orchestration_session_id 
      AND (s.initiated_by = auth.uid() OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')))
    )
  );

CREATE POLICY "System can manage agent tasks" ON support_agent_tasks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies para support_executable_actions
CREATE POLICY "Users can view executable actions" ON support_executable_actions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage executable actions" ON support_executable_actions
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- RLS Policies para support_action_executions
CREATE POLICY "Users can view action executions in their sessions" ON support_action_executions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM support_orchestration_sessions s 
      WHERE s.id = orchestration_session_id 
      AND (s.initiated_by = auth.uid() OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')))
    )
  );

CREATE POLICY "System can manage action executions" ON support_action_executions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies para support_agent_feedback
CREATE POLICY "Users can view and create feedback" ON support_agent_feedback
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies para support_learned_patterns
CREATE POLICY "Users can view learned patterns" ON support_learned_patterns
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage learned patterns" ON support_learned_patterns
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- RLS Policies para support_agent_metrics
CREATE POLICY "Users can view agent metrics" ON support_agent_metrics
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can manage agent metrics" ON support_agent_metrics
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_support_agentic_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_specialized_agents_timestamp
  BEFORE UPDATE ON support_specialized_agents
  FOR EACH ROW EXECUTE FUNCTION update_support_agentic_timestamp();

CREATE TRIGGER update_support_orchestration_sessions_timestamp
  BEFORE UPDATE ON support_orchestration_sessions
  FOR EACH ROW EXECUTE FUNCTION update_support_agentic_timestamp();

CREATE TRIGGER update_support_executable_actions_timestamp
  BEFORE UPDATE ON support_executable_actions
  FOR EACH ROW EXECUTE FUNCTION update_support_agentic_timestamp();

CREATE TRIGGER update_support_learned_patterns_timestamp
  BEFORE UPDATE ON support_learned_patterns
  FOR EACH ROW EXECUTE FUNCTION update_support_agentic_timestamp();

CREATE TRIGGER update_support_agent_metrics_timestamp
  BEFORE UPDATE ON support_agent_metrics
  FOR EACH ROW EXECUTE FUNCTION update_support_agentic_timestamp();

-- Insertar agentes especializados iniciales
INSERT INTO support_specialized_agents (agent_key, agent_name, agent_type, description, capabilities, confidence_threshold, max_autonomous_actions) VALUES
('diagnostic_agent', 'Agente de Diagnóstico', 'diagnostic', 'Identifica y analiza problemas automáticamente mediante análisis de logs, métricas y patrones históricos', '["log_analysis", "pattern_recognition", "anomaly_detection", "root_cause_analysis"]'::jsonb, 0.80, 10),
('resolution_agent', 'Agente de Resolución', 'resolution', 'Ejecuta scripts y acciones de resolución predefinidas de forma autónoma', '["script_execution", "configuration_change", "service_restart", "cache_clear"]'::jsonb, 0.85, 5),
('documentation_agent', 'Agente de Documentación', 'documentation', 'Genera documentación automática de sesiones, soluciones y runbooks', '["session_summary", "runbook_generation", "knowledge_extraction", "solution_documentation"]'::jsonb, 0.70, 15),
('escalation_agent', 'Agente de Escalación', 'escalation', 'Decide cuándo y a quién escalar basándose en complejidad, urgencia y capacidades', '["complexity_assessment", "urgency_detection", "skill_matching", "workload_balancing"]'::jsonb, 0.90, 3),
('triage_agent', 'Agente de Triaje', 'triage', 'Clasifica y prioriza tickets entrantes automáticamente', '["ticket_classification", "priority_assignment", "category_detection", "sentiment_analysis"]'::jsonb, 0.75, 20),
('specialist_connectivity', 'Especialista en Conectividad', 'specialist', 'Experto en problemas de red, VPN, firewall y conectividad', '["network_diagnostics", "vpn_troubleshooting", "firewall_analysis", "latency_optimization"]'::jsonb, 0.82, 8)
ON CONFLICT (agent_key) DO NOTHING;

-- Insertar acciones ejecutables iniciales
INSERT INTO support_executable_actions (action_key, action_name, action_category, description, script_type, risk_level, requires_approval) VALUES
('clear_browser_cache', 'Limpiar Caché del Navegador', 'remediation', 'Guía o ejecuta limpieza de caché del navegador', 'workflow', 'low', false),
('restart_service', 'Reiniciar Servicio', 'remediation', 'Reinicia un servicio específico del sistema', 'powershell', 'medium', true),
('check_connectivity', 'Verificar Conectividad', 'diagnostic', 'Ejecuta pruebas de conectividad y latencia', 'bash', 'low', false),
('collect_logs', 'Recopilar Logs', 'diagnostic', 'Recopila logs relevantes del sistema para análisis', 'powershell', 'low', false),
('reset_user_password', 'Resetear Contraseña', 'configuration', 'Genera y envía nueva contraseña temporal al usuario', 'api_call', 'medium', true),
('update_configuration', 'Actualizar Configuración', 'configuration', 'Modifica parámetros de configuración del sistema', 'api_call', 'high', true),
('send_notification', 'Enviar Notificación', 'communication', 'Envía notificación al usuario o equipo relevante', 'api_call', 'low', false),
('create_incident', 'Crear Incidente', 'escalation', 'Crea un incidente en el sistema de gestión', 'api_call', 'low', false),
('generate_report', 'Generar Reporte', 'documentation', 'Genera reporte detallado de la sesión de soporte', 'workflow', 'low', false),
('apply_hotfix', 'Aplicar Hotfix', 'remediation', 'Aplica parche o hotfix específico', 'powershell', 'critical', true)
ON CONFLICT (action_key) DO NOTHING;