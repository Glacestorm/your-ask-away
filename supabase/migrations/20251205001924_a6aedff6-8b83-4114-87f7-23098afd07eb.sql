-- Create table to store triggered alert history
CREATE TABLE public.alert_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid REFERENCES public.alerts(id) ON DELETE CASCADE NOT NULL,
  alert_name text NOT NULL,
  metric_type text NOT NULL,
  metric_value numeric NOT NULL,
  threshold_value numeric NOT NULL,
  condition_type text NOT NULL,
  target_type text DEFAULT 'global',
  target_office text,
  target_gestor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  triggered_at timestamp with time zone DEFAULT now() NOT NULL,
  resolved_at timestamp with time zone,
  resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes text
);

-- Enable RLS
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_alert_history_alert_id ON public.alert_history(alert_id);
CREATE INDEX idx_alert_history_triggered_at ON public.alert_history(triggered_at);
CREATE INDEX idx_alert_history_metric_type ON public.alert_history(metric_type);
CREATE INDEX idx_alert_history_target_office ON public.alert_history(target_office);

-- RLS Policies
CREATE POLICY "Admins can manage all alert history"
ON public.alert_history
FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view alert history"
ON public.alert_history
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow system to insert alert history (for edge functions)
CREATE POLICY "System can insert alert history"
ON public.alert_history
FOR INSERT
WITH CHECK (true);