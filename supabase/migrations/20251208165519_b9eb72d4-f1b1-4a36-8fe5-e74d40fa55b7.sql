-- Create stress test simulations table
CREATE TABLE public.stress_test_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_name TEXT NOT NULL,
  simulation_type TEXT NOT NULL CHECK (simulation_type IN ('availability', 'capacity', 'recovery', 'failover', 'cyber_attack', 'data_loss', 'network_outage', 'custom')),
  scenario_description TEXT,
  target_systems TEXT[],
  execution_mode TEXT NOT NULL DEFAULT 'manual' CHECK (execution_mode IN ('manual', 'scheduled', 'automated')),
  schedule_cron TEXT,
  last_execution TIMESTAMPTZ,
  next_execution TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'running', 'completed', 'failed')),
  success_criteria JSONB,
  results JSONB,
  metrics JSONB,
  passed BOOLEAN,
  execution_duration_seconds INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create stress test execution history
CREATE TABLE public.stress_test_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id UUID NOT NULL REFERENCES public.stress_test_simulations(id) ON DELETE CASCADE,
  execution_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  execution_end TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'aborted')),
  results JSONB,
  metrics JSONB,
  passed BOOLEAN,
  error_message TEXT,
  executed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stress_test_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stress_test_executions ENABLE ROW LEVEL SECURITY;

-- RLS policies for simulations
CREATE POLICY "Authenticated users can view stress test simulations"
  ON public.stress_test_simulations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert stress test simulations"
  ON public.stress_test_simulations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update stress test simulations"
  ON public.stress_test_simulations FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete stress test simulations"
  ON public.stress_test_simulations FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- RLS policies for executions
CREATE POLICY "Authenticated users can view stress test executions"
  ON public.stress_test_executions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert stress test executions"
  ON public.stress_test_executions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update stress test executions"
  ON public.stress_test_executions FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_stress_test_simulations_updated_at
  BEFORE UPDATE ON public.stress_test_simulations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_stress_test_simulations_status ON public.stress_test_simulations(status);
CREATE INDEX idx_stress_test_simulations_type ON public.stress_test_simulations(simulation_type);
CREATE INDEX idx_stress_test_executions_simulation ON public.stress_test_executions(simulation_id);
CREATE INDEX idx_stress_test_executions_status ON public.stress_test_executions(status);

-- Insert default stress test scenarios
INSERT INTO public.stress_test_simulations (simulation_name, simulation_type, scenario_description, target_systems, execution_mode, success_criteria) VALUES
('Test de Disponibilidad de Base de Datos', 'availability', 'Simula alta carga de consultas y verifica tiempo de respuesta', ARRAY['database', 'api'], 'automated', '{"max_response_time_ms": 500, "min_success_rate": 99.9}'::jsonb),
('Simulación de Failover de Servidor', 'failover', 'Verifica la recuperación automática ante caída del servidor principal', ARRAY['backend', 'load_balancer'], 'scheduled', '{"max_recovery_time_seconds": 30, "zero_data_loss": true}'::jsonb),
('Prueba de Capacidad Máxima', 'capacity', 'Incrementa usuarios concurrentes hasta límite del sistema', ARRAY['frontend', 'backend', 'database'], 'manual', '{"max_concurrent_users": 1000, "degradation_threshold": 0.1}'::jsonb),
('Simulación de Ciberataque DDoS', 'cyber_attack', 'Simula ataque de denegación de servicio distribuido', ARRAY['firewall', 'cdn', 'api'], 'automated', '{"mitigation_time_seconds": 60, "service_availability": 99.5}'::jsonb),
('Test de Recuperación de Datos', 'data_loss', 'Verifica backup y restauración de datos críticos', ARRAY['database', 'storage'], 'scheduled', '{"max_recovery_time_minutes": 15, "data_integrity": 100}'::jsonb),
('Prueba de Resiliencia de Red', 'network_outage', 'Simula interrupción de conectividad entre servicios', ARRAY['network', 'api', 'microservices'], 'automated', '{"graceful_degradation": true, "recovery_time_seconds": 45}'::jsonb);