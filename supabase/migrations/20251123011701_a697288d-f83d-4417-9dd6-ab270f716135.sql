-- Create alerts table for alert configurations
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_name TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- visits, success_rate, vinculacion, engagement, etc.
  condition_type TEXT NOT NULL, -- below, above, equals
  threshold_value NUMERIC NOT NULL,
  period_type TEXT NOT NULL, -- daily, weekly, monthly
  active BOOLEAN DEFAULT true,
  last_checked TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notifications table for triggered alerts
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL, -- info, warning, critical
  metric_value NUMERIC,
  threshold_value NUMERIC,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alerts
CREATE POLICY "Admins can manage all alerts"
  ON public.alerts
  FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view all alerts"
  ON public.alerts
  FOR SELECT
  USING (true);

-- RLS Policies for notifications
CREATE POLICY "Admins can manage all notifications"
  ON public.notifications
  FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid() OR is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_alerts_active ON public.alerts(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_alerts_metric_type ON public.alerts(metric_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.alerts IS 'Stores alert configurations for monitoring metrics';
COMMENT ON TABLE public.notifications IS 'Stores triggered alerts and notifications for users';