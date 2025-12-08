-- Table for storing diagnostic logs
CREATE TABLE public.system_diagnostic_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_type TEXT NOT NULL, -- 'manual', 'scheduled', 'global'
  module_key TEXT,
  status TEXT NOT NULL, -- 'healthy', 'warning', 'error'
  checks JSONB NOT NULL DEFAULT '[]',
  error_details TEXT,
  triggered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for AI interventions and auto-fixes
CREATE TABLE public.ai_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_log_id UUID REFERENCES public.system_diagnostic_logs(id),
  issue_description TEXT NOT NULL,
  ai_analysis TEXT NOT NULL,
  proposed_solution TEXT NOT NULL,
  solution_code JSONB, -- SQL or action to execute
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'executed', 'reverted', 'rejected'
  auto_execute_at TIMESTAMPTZ, -- When AI should auto-execute if no human response
  executed_at TIMESTAMPTZ,
  executed_by TEXT, -- 'ai_auto' or user_id
  rollback_data JSONB, -- Data needed to revert changes
  reverted_at TIMESTAMPTZ,
  reverted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for scheduled health check history
CREATE TABLE public.scheduled_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type TEXT NOT NULL, -- 'morning', 'night'
  overall_status TEXT NOT NULL,
  total_modules INTEGER NOT NULL,
  healthy_modules INTEGER NOT NULL,
  warning_modules INTEGER NOT NULL,
  error_modules INTEGER NOT NULL,
  details JSONB NOT NULL,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_diagnostic_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_health_checks ENABLE ROW LEVEL SECURITY;

-- RLS policies - only admins can view
CREATE POLICY "Admins can view diagnostic logs"
  ON public.system_diagnostic_logs FOR SELECT
  USING (public.is_admin_or_superadmin(auth.uid()) OR public.has_role(auth.uid(), 'director_comercial'));

CREATE POLICY "Admins can insert diagnostic logs"
  ON public.system_diagnostic_logs FOR INSERT
  WITH CHECK (public.is_admin_or_superadmin(auth.uid()) OR public.has_role(auth.uid(), 'director_comercial'));

CREATE POLICY "Admins can view AI interventions"
  ON public.ai_interventions FOR SELECT
  USING (public.is_admin_or_superadmin(auth.uid()) OR public.has_role(auth.uid(), 'director_comercial'));

CREATE POLICY "Admins can manage AI interventions"
  ON public.ai_interventions FOR ALL
  USING (public.is_admin_or_superadmin(auth.uid()) OR public.has_role(auth.uid(), 'director_comercial'));

CREATE POLICY "Admins can view scheduled checks"
  ON public.scheduled_health_checks FOR SELECT
  USING (public.is_admin_or_superadmin(auth.uid()) OR public.has_role(auth.uid(), 'director_comercial'));

CREATE POLICY "Service can insert scheduled checks"
  ON public.scheduled_health_checks FOR INSERT
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_ai_interventions_updated_at
  BEFORE UPDATE ON public.ai_interventions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_diagnostic_logs_created_at ON public.system_diagnostic_logs(created_at DESC);
CREATE INDEX idx_ai_interventions_status ON public.ai_interventions(status);
CREATE INDEX idx_scheduled_checks_type ON public.scheduled_health_checks(check_type, created_at DESC);