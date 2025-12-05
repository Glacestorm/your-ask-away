-- Create table to store KPI report history
CREATE TABLE public.kpi_report_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_date DATE NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'weekly',
  stats JSONB NOT NULL,
  html_content TEXT NOT NULL,
  recipients JSONB NOT NULL DEFAULT '[]',
  sent_count INTEGER NOT NULL DEFAULT 0,
  total_recipients INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kpi_report_history ENABLE ROW LEVEL SECURITY;

-- Only directors and admins can view reports
CREATE POLICY "Directors can view report history"
ON public.kpi_report_history
FOR SELECT
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR
  has_role(auth.uid(), 'director_comercial'::app_role) OR
  has_role(auth.uid(), 'director_oficina'::app_role) OR
  has_role(auth.uid(), 'responsable_comercial'::app_role)
);

-- Only system (via service role) can insert
CREATE POLICY "System can insert reports"
ON public.kpi_report_history
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_kpi_report_history_date ON public.kpi_report_history(report_date DESC);