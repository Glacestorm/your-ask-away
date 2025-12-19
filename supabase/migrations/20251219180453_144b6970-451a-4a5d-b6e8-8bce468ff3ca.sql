-- Create performance_metrics table for storing Web Vitals and frontend metrics
CREATE TABLE public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  rating TEXT CHECK (rating IN ('good', 'needs-improvement', 'poor')),
  delta NUMERIC,
  url TEXT,
  user_agent TEXT,
  session_id TEXT,
  page_path TEXT,
  device_type TEXT,
  connection_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_performance_metrics_metric_name ON public.performance_metrics(metric_name);
CREATE INDEX idx_performance_metrics_created_at ON public.performance_metrics(created_at DESC);
CREATE INDEX idx_performance_metrics_rating ON public.performance_metrics(rating);

-- Enable RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for collecting metrics from all visitors)
CREATE POLICY "Allow anonymous inserts for metrics collection"
ON public.performance_metrics
FOR INSERT
WITH CHECK (true);

-- Allow authenticated users to read all metrics (for admin dashboard)
CREATE POLICY "Authenticated users can read all metrics"
ON public.performance_metrics
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create error_logs table for centralized error tracking
CREATE TABLE public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_code TEXT,
  severity TEXT DEFAULT 'error' CHECK (severity IN ('info', 'warn', 'error', 'critical')),
  component_name TEXT,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  url TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for error_logs
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX idx_error_logs_component ON public.error_logs(component_name);
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for error logging
CREATE POLICY "Allow anonymous inserts for error logging"
ON public.error_logs
FOR INSERT
WITH CHECK (true);

-- Authenticated users can read all logs
CREATE POLICY "Authenticated users can read error logs"
ON public.error_logs
FOR SELECT
USING (auth.role() = 'authenticated');

-- Authenticated users can update (resolve) errors
CREATE POLICY "Authenticated users can update error logs"
ON public.error_logs
FOR UPDATE
USING (auth.role() = 'authenticated');

-- Create performance_alerts table for threshold-based alerting
CREATE TABLE public.performance_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  threshold_value NUMERIC NOT NULL,
  actual_value NUMERIC NOT NULL,
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_performance_alerts_type ON public.performance_alerts(alert_type);
CREATE INDEX idx_performance_alerts_severity ON public.performance_alerts(severity);
CREATE INDEX idx_performance_alerts_created_at ON public.performance_alerts(created_at DESC);

-- Enable RLS
ALTER TABLE public.performance_alerts ENABLE ROW LEVEL SECURITY;

-- Allow inserts from edge functions
CREATE POLICY "Allow inserts for alerting"
ON public.performance_alerts
FOR INSERT
WITH CHECK (true);

-- Authenticated users can read alerts
CREATE POLICY "Authenticated users can read alerts"
ON public.performance_alerts
FOR SELECT
USING (auth.role() = 'authenticated');

-- Authenticated users can acknowledge alerts
CREATE POLICY "Authenticated users can update alerts"
ON public.performance_alerts
FOR UPDATE
USING (auth.role() = 'authenticated');