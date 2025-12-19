-- =====================================================
-- FASE 3: MOTOR BPMN + PROCESS MINING
-- Event Log Unificado + Definiciones BPMN + Instancias
-- =====================================================

-- 1. TABLA: process_events (Event Log Unificado)
-- Cada acción relevante genera un evento para Process Mining
CREATE TABLE public.process_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  
  -- Actor (quién realizó la acción)
  actor_id UUID,
  actor_type TEXT NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'automation', 'trigger')),
  
  -- Entity (sobre qué entidad)
  entity_type TEXT NOT NULL CHECK (entity_type IN ('opportunity', 'company', 'visit', 'visit_sheet', 'task', 'quote', 'invoice', 'workflow', 'document', 'contact')),
  entity_id UUID NOT NULL,
  
  -- Action (qué pasó)
  action TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT,
  
  -- Metadata adicional
  metadata JSONB DEFAULT '{}',
  duration_ms INTEGER, -- tiempo desde evento anterior para misma entidad
  
  -- Process Mining fields
  process_definition_id UUID, -- si está asociado a un proceso BPMN
  process_instance_id UUID, -- instancia específica del proceso
  node_id TEXT, -- nodo BPMN actual
  
  -- Timestamps
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices optimizados para Process Mining queries
CREATE INDEX idx_process_events_entity ON public.process_events(entity_type, entity_id);
CREATE INDEX idx_process_events_tenant_time ON public.process_events(tenant_id, occurred_at DESC);
CREATE INDEX idx_process_events_action ON public.process_events(action);
CREATE INDEX idx_process_events_process ON public.process_events(process_definition_id, process_instance_id);
CREATE INDEX idx_process_events_occurred ON public.process_events(occurred_at DESC);
CREATE INDEX idx_process_events_actor ON public.process_events(actor_id, actor_type);

-- 2. TABLA: bpmn_process_definitions (Diseñador BPMN)
-- Almacena las definiciones de procesos BPMN
CREATE TABLE public.bpmn_process_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  
  -- Identificación
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  is_template BOOLEAN DEFAULT false,
  
  -- Tipo de entidad que gestiona este proceso
  entity_type TEXT NOT NULL CHECK (entity_type IN ('opportunity', 'company', 'visit', 'task', 'quote', 'invoice', 'workflow', 'custom')),
  
  -- BPMN Structure (JSON-based para flexibilidad)
  nodes JSONB NOT NULL DEFAULT '[]', -- [{id, type, label, position, config}]
  edges JSONB NOT NULL DEFAULT '[]', -- [{id, source, target, condition, label}]
  
  -- Configuración de SLA
  sla_config JSONB DEFAULT '{}', -- {nodeId: {maxDuration: hours, warningAt: percentage}}
  
  -- Reglas de escalado
  escalation_rules JSONB DEFAULT '[]', -- [{condition, escalateTo, notifyVia}]
  
  -- Variables del proceso
  variables_schema JSONB DEFAULT '{}', -- definición de variables disponibles
  
  -- Trigger conditions (cuándo iniciar el proceso)
  trigger_conditions JSONB DEFAULT '{}', -- {onEntityCreate: bool, onStatusChange: [...], manual: bool}
  
  -- Metadata
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_bpmn_definitions_entity ON public.bpmn_process_definitions(entity_type);
CREATE INDEX idx_bpmn_definitions_active ON public.bpmn_process_definitions(is_active) WHERE is_active = true;
CREATE INDEX idx_bpmn_definitions_tenant ON public.bpmn_process_definitions(tenant_id);

-- 3. TABLA: bpmn_process_instances (Ejecuciones de procesos)
-- Cada vez que se ejecuta un proceso, se crea una instancia
CREATE TABLE public.bpmn_process_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_definition_id UUID NOT NULL REFERENCES public.bpmn_process_definitions(id) ON DELETE CASCADE,
  
  -- Entidad asociada
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  
  -- Estado actual
  current_node_id TEXT NOT NULL,
  previous_node_id TEXT,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'suspended', 'cancelled')),
  
  -- SLA tracking
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expected_completion TIMESTAMPTZ,
  actual_completion TIMESTAMPTZ,
  sla_status TEXT DEFAULT 'on_track' CHECK (sla_status IN ('on_track', 'at_risk', 'breached')),
  
  -- Variables del proceso (estado actual)
  variables JSONB DEFAULT '{}',
  
  -- Historial de nodos visitados
  history JSONB DEFAULT '[]', -- [{nodeId, enteredAt, exitedAt, duration}]
  
  -- Metadata
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_bpmn_instances_definition ON public.bpmn_process_instances(process_definition_id);
CREATE INDEX idx_bpmn_instances_entity ON public.bpmn_process_instances(entity_type, entity_id);
CREATE INDEX idx_bpmn_instances_status ON public.bpmn_process_instances(status);
CREATE INDEX idx_bpmn_instances_sla ON public.bpmn_process_instances(sla_status) WHERE status = 'running';
CREATE INDEX idx_bpmn_instances_current ON public.bpmn_process_instances(current_node_id);

-- 4. TABLA: process_sla_violations (Violaciones de SLA)
CREATE TABLE public.process_sla_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.bpmn_process_instances(id) ON DELETE CASCADE,
  process_definition_id UUID REFERENCES public.bpmn_process_definitions(id) ON DELETE SET NULL,
  
  -- Dónde ocurrió
  node_id TEXT NOT NULL,
  node_name TEXT,
  
  -- Tipo de violación
  violation_type TEXT NOT NULL CHECK (violation_type IN ('time_exceeded', 'escalation_triggered', 'warning_threshold', 'deadline_missed')),
  
  -- Valores
  expected_duration INTERVAL,
  actual_duration INTERVAL,
  exceeded_by INTERVAL,
  exceeded_percentage NUMERIC(5,2),
  
  -- Escalado
  escalated_to UUID[] DEFAULT '{}',
  escalation_level INTEGER DEFAULT 1,
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  
  -- Resolución
  acknowledged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_sla_violations_instance ON public.process_sla_violations(instance_id);
CREATE INDEX idx_sla_violations_unresolved ON public.process_sla_violations(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_sla_violations_type ON public.process_sla_violations(violation_type);

-- 5. TABLA: process_mining_snapshots (Análisis guardados)
CREATE TABLE public.process_mining_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Filtros aplicados
  process_definition_id UUID REFERENCES public.bpmn_process_definitions(id) ON DELETE SET NULL,
  entity_type TEXT,
  date_from TIMESTAMPTZ,
  date_to TIMESTAMPTZ,
  
  -- Resultados del análisis
  analysis_results JSONB NOT NULL DEFAULT '{}',
  -- {
  --   processMap: {...},
  --   bottlenecks: [...],
  --   variants: [...],
  --   slaCompliance: {...},
  --   statistics: {...}
  -- }
  
  -- Metadata
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.process_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bpmn_process_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bpmn_process_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_sla_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_mining_snapshots ENABLE ROW LEVEL SECURITY;

-- process_events: lectura para autenticados, escritura para sistema
CREATE POLICY "Authenticated users can view process events"
  ON public.process_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert process events"
  ON public.process_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- bpmn_process_definitions: admins pueden CRUD, otros pueden leer activos
CREATE POLICY "Anyone can view active process definitions"
  ON public.bpmn_process_definitions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage process definitions"
  ON public.bpmn_process_definitions FOR ALL
  TO authenticated
  USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can insert process definitions"
  ON public.bpmn_process_definitions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own process definitions"
  ON public.bpmn_process_definitions FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR is_admin_or_superadmin(auth.uid()));

-- bpmn_process_instances: usuarios ven instancias de sus entidades
CREATE POLICY "Users can view process instances"
  ON public.bpmn_process_instances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert process instances"
  ON public.bpmn_process_instances FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update process instances"
  ON public.bpmn_process_instances FOR UPDATE
  TO authenticated
  USING (true);

-- process_sla_violations: lectura para autenticados
CREATE POLICY "Users can view SLA violations"
  ON public.process_sla_violations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert SLA violations"
  ON public.process_sla_violations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update SLA violations"
  ON public.process_sla_violations FOR UPDATE
  TO authenticated
  USING (true);

-- process_mining_snapshots
CREATE POLICY "Users can view mining snapshots"
  ON public.process_mining_snapshots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create mining snapshots"
  ON public.process_mining_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete own mining snapshots"
  ON public.process_mining_snapshots FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR is_admin_or_superadmin(auth.uid()));

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para emitir eventos de proceso
CREATE OR REPLACE FUNCTION public.emit_process_event(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_from_state TEXT DEFAULT NULL,
  p_to_state TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_actor_type TEXT DEFAULT 'user'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_tenant_id UUID;
  v_last_event_time TIMESTAMPTZ;
  v_duration_ms INTEGER;
BEGIN
  -- Obtener tenant_id basado en entity_type
  IF p_entity_type = 'opportunity' THEN
    SELECT company_id INTO v_tenant_id FROM opportunities WHERE id = p_entity_id;
  ELSIF p_entity_type = 'company' THEN
    v_tenant_id := p_entity_id;
  ELSIF p_entity_type = 'visit' THEN
    SELECT company_id INTO v_tenant_id FROM visits WHERE id = p_entity_id;
  ELSIF p_entity_type = 'visit_sheet' THEN
    SELECT company_id INTO v_tenant_id FROM visit_sheets WHERE id = p_entity_id;
  END IF;
  
  -- Calcular duración desde último evento de la misma entidad
  SELECT occurred_at INTO v_last_event_time
  FROM process_events
  WHERE entity_type = p_entity_type AND entity_id = p_entity_id
  ORDER BY occurred_at DESC
  LIMIT 1;
  
  IF v_last_event_time IS NOT NULL THEN
    v_duration_ms := EXTRACT(EPOCH FROM (now() - v_last_event_time)) * 1000;
  END IF;
  
  -- Insertar evento
  INSERT INTO process_events (
    tenant_id, actor_id, actor_type,
    entity_type, entity_id, action,
    from_state, to_state, metadata, duration_ms
  ) VALUES (
    v_tenant_id, auth.uid(), p_actor_type,
    p_entity_type, p_entity_id, p_action,
    p_from_state, p_to_state, p_metadata, v_duration_ms
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Función para calcular estadísticas de Process Mining
CREATE OR REPLACE FUNCTION public.get_process_mining_stats(
  p_entity_type TEXT DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT now() - INTERVAL '30 days',
  p_date_to TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_events', COUNT(*),
    'unique_entities', COUNT(DISTINCT entity_id),
    'unique_actors', COUNT(DISTINCT actor_id),
    'actions_distribution', (
      SELECT jsonb_object_agg(action, cnt)
      FROM (
        SELECT action, COUNT(*) as cnt
        FROM process_events
        WHERE (p_entity_type IS NULL OR entity_type = p_entity_type)
          AND occurred_at BETWEEN p_date_from AND p_date_to
        GROUP BY action
        ORDER BY cnt DESC
        LIMIT 20
      ) sub
    ),
    'avg_duration_ms', AVG(duration_ms),
    'entity_type_distribution', (
      SELECT jsonb_object_agg(entity_type, cnt)
      FROM (
        SELECT entity_type, COUNT(*) as cnt
        FROM process_events
        WHERE occurred_at BETWEEN p_date_from AND p_date_to
        GROUP BY entity_type
      ) sub
    )
  ) INTO v_result
  FROM process_events
  WHERE (p_entity_type IS NULL OR entity_type = p_entity_type)
    AND occurred_at BETWEEN p_date_from AND p_date_to;
  
  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- Función para detectar cuellos de botella
CREATE OR REPLACE FUNCTION public.detect_process_bottlenecks(
  p_process_definition_id UUID DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT now() - INTERVAL '30 days'
)
RETURNS TABLE(
  node_id TEXT,
  avg_duration_ms NUMERIC,
  max_duration_ms NUMERIC,
  min_duration_ms NUMERIC,
  event_count BIGINT,
  bottleneck_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH node_stats AS (
    SELECT 
      pe.node_id,
      AVG(pe.duration_ms) as avg_dur,
      MAX(pe.duration_ms) as max_dur,
      MIN(pe.duration_ms) as min_dur,
      COUNT(*) as cnt
    FROM process_events pe
    WHERE pe.node_id IS NOT NULL
      AND pe.duration_ms IS NOT NULL
      AND pe.occurred_at >= p_date_from
      AND (p_process_definition_id IS NULL OR pe.process_definition_id = p_process_definition_id)
    GROUP BY pe.node_id
  ),
  overall_avg AS (
    SELECT AVG(avg_dur) as global_avg FROM node_stats
  )
  SELECT 
    ns.node_id,
    ns.avg_dur::NUMERIC,
    ns.max_dur::NUMERIC,
    ns.min_dur::NUMERIC,
    ns.cnt,
    (ns.avg_dur / NULLIF(oa.global_avg, 0))::NUMERIC as bottleneck_score
  FROM node_stats ns
  CROSS JOIN overall_avg oa
  ORDER BY bottleneck_score DESC NULLS LAST;
END;
$$;

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION public.update_bpmn_tables_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_bpmn_definitions_timestamp
  BEFORE UPDATE ON public.bpmn_process_definitions
  FOR EACH ROW EXECUTE FUNCTION update_bpmn_tables_timestamp();

CREATE TRIGGER update_bpmn_instances_timestamp
  BEFORE UPDATE ON public.bpmn_process_instances
  FOR EACH ROW EXECUTE FUNCTION update_bpmn_tables_timestamp();

-- =====================================================
-- TRIGGERS PARA EMITIR EVENTOS AUTOMÁTICAMENTE
-- =====================================================

-- Trigger function para opportunities
CREATE OR REPLACE FUNCTION public.emit_opportunity_process_event()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM emit_process_event(
      'opportunity',
      NEW.id,
      'created',
      NULL,
      NEW.stage,
      jsonb_build_object('title', NEW.title, 'value', NEW.estimated_value)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.stage IS DISTINCT FROM NEW.stage THEN
      PERFORM emit_process_event(
        'opportunity',
        NEW.id,
        'stage_changed',
        OLD.stage,
        NEW.stage,
        jsonb_build_object('title', NEW.title, 'value', NEW.estimated_value)
      );
    END IF;
    IF OLD.owner_id IS DISTINCT FROM NEW.owner_id THEN
      PERFORM emit_process_event(
        'opportunity',
        NEW.id,
        'assigned',
        OLD.owner_id::TEXT,
        NEW.owner_id::TEXT,
        jsonb_build_object('title', NEW.title)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER opportunity_process_event_trigger
  AFTER INSERT OR UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION emit_opportunity_process_event();

-- Trigger function para visits
CREATE OR REPLACE FUNCTION public.emit_visit_process_event()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM emit_process_event(
      'visit',
      NEW.id,
      'created',
      NULL,
      NEW.result,
      jsonb_build_object('company_id', NEW.company_id, 'visit_date', NEW.visit_date)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.result IS DISTINCT FROM NEW.result THEN
      PERFORM emit_process_event(
        'visit',
        NEW.id,
        'result_changed',
        OLD.result,
        NEW.result,
        jsonb_build_object('company_id', NEW.company_id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER visit_process_event_trigger
  AFTER INSERT OR UPDATE ON public.visits
  FOR EACH ROW EXECUTE FUNCTION emit_visit_process_event();

-- Trigger function para visit_sheets
CREATE OR REPLACE FUNCTION public.emit_visit_sheet_process_event()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM emit_process_event(
      'visit_sheet',
      NEW.id,
      'created',
      NULL,
      NEW.tipo_visita,
      jsonb_build_object('company_id', NEW.company_id, 'probabilidad', NEW.probabilidad_cierre)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.probabilidad_cierre IS DISTINCT FROM NEW.probabilidad_cierre THEN
      PERFORM emit_process_event(
        'visit_sheet',
        NEW.id,
        'probability_changed',
        OLD.probabilidad_cierre::TEXT,
        NEW.probabilidad_cierre::TEXT,
        jsonb_build_object('company_id', NEW.company_id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER visit_sheet_process_event_trigger
  AFTER INSERT OR UPDATE ON public.visit_sheets
  FOR EACH ROW EXECUTE FUNCTION emit_visit_sheet_process_event();

-- Habilitar realtime para eventos
ALTER PUBLICATION supabase_realtime ADD TABLE public.process_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bpmn_process_instances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.process_sla_violations;