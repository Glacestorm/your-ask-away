-- License Webhooks table
CREATE TABLE public.license_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret_key TEXT,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  last_status INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Webhook delivery logs
CREATE TABLE public.license_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES public.license_webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempt_number INTEGER DEFAULT 1,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- License Audit Trail table
CREATE TABLE public.license_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID,
  action TEXT NOT NULL,
  actor_id UUID,
  actor_type TEXT DEFAULT 'user',
  actor_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  old_values JSONB,
  new_values JSONB,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- License Grace Periods table
CREATE TABLE public.license_grace_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL,
  original_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
  grace_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  grace_days INTEGER NOT NULL,
  reason TEXT,
  features_restricted TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active',
  activated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- License Transfers table
CREATE TABLE public.license_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL,
  from_organization_id UUID NOT NULL,
  to_organization_id UUID NOT NULL,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  transfer_reason TEXT,
  status TEXT DEFAULT 'pending',
  initiated_by UUID,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Scheduled Reports table
CREATE TABLE public.license_scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  schedule TEXT NOT NULL,
  recipients TEXT[] NOT NULL DEFAULT '{}',
  filters JSONB DEFAULT '{}',
  format TEXT DEFAULT 'pdf',
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  next_send_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Report History table
CREATE TABLE public.license_report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_report_id UUID REFERENCES public.license_scheduled_reports(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL,
  generated_by UUID,
  recipients TEXT[],
  file_url TEXT,
  file_size_bytes INTEGER,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.license_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_grace_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_report_history ENABLE ROW LEVEL SECURITY;

-- Create basic policies (authenticated users can read/write for now)
CREATE POLICY "Authenticated users can manage webhooks"
ON public.license_webhooks FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view webhook logs"
ON public.license_webhook_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view audit logs"
ON public.license_audit_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert audit logs"
ON public.license_audit_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can manage grace periods"
ON public.license_grace_periods FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage transfers"
ON public.license_transfers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage scheduled reports"
ON public.license_scheduled_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view report history"
ON public.license_report_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_license_audit_logs_license_id ON public.license_audit_logs(license_id);
CREATE INDEX idx_license_audit_logs_created_at ON public.license_audit_logs(created_at DESC);
CREATE INDEX idx_license_webhook_logs_webhook_id ON public.license_webhook_logs(webhook_id);
CREATE INDEX idx_license_grace_periods_license_id ON public.license_grace_periods(license_id);
CREATE INDEX idx_license_transfers_license_id ON public.license_transfers(license_id);

-- Enable realtime for audit logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.license_audit_logs;