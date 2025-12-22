-- =====================================================
-- FASE 5: REVENUE OPERATIONS ADVANCED
-- =====================================================

-- 1. Revenue Scenarios Table
CREATE TABLE public.revenue_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID,
  scenario_type TEXT DEFAULT 'what-if' CHECK (scenario_type IN ('what-if', 'forecast', 'stress-test', 'budget')),
  base_mrr NUMERIC NOT NULL DEFAULT 0,
  variables JSONB NOT NULL DEFAULT '{}',
  projections JSONB NOT NULL DEFAULT '{}',
  time_horizon_months INTEGER DEFAULT 12,
  comparison_baseline_id UUID REFERENCES public.revenue_scenarios(id),
  is_baseline BOOLEAN DEFAULT false,
  confidence_level NUMERIC DEFAULT 0.8,
  assumptions TEXT[],
  risks TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Revenue Workflows Table
CREATE TABLE public.revenue_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('event', 'threshold', 'schedule', 'signal')),
  trigger_config JSONB NOT NULL DEFAULT '{}',
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  priority INTEGER DEFAULT 5,
  cooldown_minutes INTEGER DEFAULT 60,
  last_triggered_at TIMESTAMPTZ,
  execution_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Revenue Workflow Executions Table
CREATE TABLE public.revenue_workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.revenue_workflows(id) ON DELETE CASCADE,
  triggered_by TEXT,
  trigger_data JSONB,
  actions_executed JSONB,
  execution_status TEXT DEFAULT 'pending' CHECK (execution_status IN ('pending', 'running', 'completed', 'failed')),
  result JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 4. Revenue Copilot Sessions Table
CREATE TABLE public.revenue_copilot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_type TEXT DEFAULT 'chat',
  messages JSONB NOT NULL DEFAULT '[]',
  context JSONB DEFAULT '{}',
  insights_generated JSONB DEFAULT '[]',
  actions_taken JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 5. Revenue Anomaly Alerts Table
CREATE TABLE public.revenue_anomaly_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence NUMERIC NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  indicators JSONB,
  affected_entities JSONB,
  recommended_actions TEXT[],
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  assigned_to UUID,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.revenue_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_copilot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_anomaly_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for revenue_scenarios
CREATE POLICY "Users can view all revenue scenarios" ON public.revenue_scenarios
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create scenarios" ON public.revenue_scenarios
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own scenarios" ON public.revenue_scenarios
  FOR UPDATE USING (created_by = auth.uid() OR created_by IS NULL);
CREATE POLICY "Users can delete their own scenarios" ON public.revenue_scenarios
  FOR DELETE USING (created_by = auth.uid() OR created_by IS NULL);

-- RLS Policies for revenue_workflows
CREATE POLICY "Users can view all workflows" ON public.revenue_workflows
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create workflows" ON public.revenue_workflows
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update workflows" ON public.revenue_workflows
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete their own workflows" ON public.revenue_workflows
  FOR DELETE USING (created_by = auth.uid() OR created_by IS NULL);

-- RLS Policies for revenue_workflow_executions
CREATE POLICY "Users can view all executions" ON public.revenue_workflow_executions
  FOR SELECT USING (true);
CREATE POLICY "System can insert executions" ON public.revenue_workflow_executions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update executions" ON public.revenue_workflow_executions
  FOR UPDATE USING (true);

-- RLS Policies for revenue_copilot_sessions
CREATE POLICY "Users can view their own sessions" ON public.revenue_copilot_sessions
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Authenticated users can create sessions" ON public.revenue_copilot_sessions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own sessions" ON public.revenue_copilot_sessions
  FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);

-- RLS Policies for revenue_anomaly_alerts
CREATE POLICY "Users can view all anomaly alerts" ON public.revenue_anomaly_alerts
  FOR SELECT USING (true);
CREATE POLICY "System can insert alerts" ON public.revenue_anomaly_alerts
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update alerts" ON public.revenue_anomaly_alerts
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Enable Realtime for anomaly alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.revenue_anomaly_alerts;

-- Update timestamp trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION public.update_revenue_phase5_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_revenue_scenarios_timestamp
  BEFORE UPDATE ON public.revenue_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.update_revenue_phase5_timestamp();

CREATE TRIGGER update_revenue_workflows_timestamp
  BEFORE UPDATE ON public.revenue_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_revenue_phase5_timestamp();