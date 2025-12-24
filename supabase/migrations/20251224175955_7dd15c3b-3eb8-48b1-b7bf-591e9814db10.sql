-- Organizations table for multi-tenant management
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  billing_email TEXT,
  billing_address JSONB,
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'trial',
  subscription_plan TEXT DEFAULT 'basic',
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  max_users INTEGER DEFAULT 5,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Module trials table
CREATE TABLE IF NOT EXISTS public.module_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  module_key TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active',
  converted_to_purchase BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, module_key)
);

-- Auditor access tokens for external portal
CREATE TABLE IF NOT EXISTS public.auditor_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  auditor_email TEXT NOT NULL,
  auditor_name TEXT,
  token_hash TEXT UNIQUE NOT NULL,
  permissions JSONB DEFAULT '{"view_reports": true, "view_evidence": true, "download": true}',
  expires_at TIMESTAMPTZ NOT NULL,
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Digital signatures table for eIDAS compliance
CREATE TABLE IF NOT EXISTS public.digital_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  document_hash TEXT NOT NULL,
  signer_id UUID,
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signature_type TEXT DEFAULT 'qualified',
  signature_data JSONB,
  certificate_issuer TEXT,
  certificate_serial TEXT,
  timestamp_authority TEXT,
  signed_at TIMESTAMPTZ DEFAULT now(),
  verification_status TEXT DEFAULT 'valid',
  verified_at TIMESTAMPTZ,
  eidas_level TEXT DEFAULT 'QES',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit alerts table
CREATE TABLE IF NOT EXISTS public.audit_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  related_entity_type TEXT,
  related_entity_id UUID,
  due_date TIMESTAMPTZ,
  days_until_due INTEGER,
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  auto_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Blockchain audit trail table
CREATE TABLE IF NOT EXISTS public.blockchain_audit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  entry_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  data_hash TEXT NOT NULL,
  previous_hash TEXT,
  merkle_root TEXT,
  block_number BIGINT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  actor_id UUID,
  actor_email TEXT,
  metadata JSONB,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add organization_id to existing tables that need it
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'user';

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditor_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_audit_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view their organization" ON public.organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage organizations" ON public.organizations
  FOR ALL USING (
    id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid() AND user_role IN ('admin', 'superadmin'))
  );

-- RLS Policies for module_trials
CREATE POLICY "Users can view their trials" ON public.module_trials
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create trials" ON public.module_trials
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their trials" ON public.module_trials
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for auditor_access_tokens
CREATE POLICY "Org admins can manage tokens" ON public.auditor_access_tokens
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid() AND user_role IN ('admin', 'superadmin'))
  );

-- RLS Policies for digital_signatures
CREATE POLICY "Users can view signatures" ON public.digital_signatures
  FOR SELECT USING (signer_id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can create signatures" ON public.digital_signatures
  FOR INSERT WITH CHECK (signer_id = auth.uid());

-- RLS Policies for audit_alerts
CREATE POLICY "Users can view org alerts" ON public.audit_alerts
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "System can manage alerts" ON public.audit_alerts
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid() AND user_role IN ('admin', 'superadmin'))
  );

-- RLS Policies for blockchain_audit_entries
CREATE POLICY "Users can view audit entries" ON public.blockchain_audit_entries
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "System can create entries" ON public.blockchain_audit_entries
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_module_trials_user ON public.module_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_module_trials_expires ON public.module_trials(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_org ON public.audit_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_due ON public.audit_alerts(due_date);
CREATE INDEX IF NOT EXISTS idx_blockchain_entries_entity ON public.blockchain_audit_entries(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_entries_hash ON public.blockchain_audit_entries(data_hash);