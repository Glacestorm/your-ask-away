
-- ============================================
-- ERP Trade Finance Module - Phase 1: Base Infrastructure
-- ============================================

-- 1. Financial Entities (Banks and Financial Institutions)
CREATE TABLE public.erp_financial_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL DEFAULT 'bank', -- 'bank', 'factoring', 'confirming', 'trade_finance'
  name TEXT NOT NULL,
  legal_name TEXT,
  swift_bic TEXT,
  country TEXT NOT NULL DEFAULT 'ES',
  address TEXT,
  city TEXT,
  postal_code TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  api_endpoint TEXT,
  api_type TEXT, -- 'psd2', 'swift_gpi', 'proprietary', 'iso20022'
  api_documentation_url TEXT,
  credentials_encrypted JSONB DEFAULT '{}',
  supported_operations TEXT[] DEFAULT '{}', -- ['discount', 'lc_import', 'lc_export', 'factoring', 'confirming', 'guarantees']
  is_active BOOLEAN DEFAULT true,
  logo_url TEXT,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending', -- 'pending', 'connected', 'error', 'disconnected'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. API Connections configured per company
CREATE TABLE public.erp_trade_api_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES public.erp_financial_entities(id) ON DELETE CASCADE,
  connection_name TEXT NOT NULL,
  api_type TEXT NOT NULL, -- 'psd2', 'swift', 'rest', 'soap', 'sftp'
  environment TEXT NOT NULL DEFAULT 'sandbox', -- 'sandbox', 'production'
  api_key_encrypted TEXT,
  client_id_encrypted TEXT,
  client_secret_encrypted TEXT,
  certificate_data JSONB, -- { cert_pem, key_pem, passphrase }
  oauth_tokens JSONB, -- { access_token, refresh_token, expires_at }
  webhook_url TEXT,
  webhook_secret TEXT,
  connection_params JSONB DEFAULT '{}', -- Additional connection parameters
  status TEXT DEFAULT 'pending', -- 'pending', 'testing', 'active', 'error', 'suspended'
  last_test_at TIMESTAMPTZ,
  last_test_result JSONB,
  last_error TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Document Templates from Financial Entities
CREATE TABLE public.erp_trade_document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID REFERENCES public.erp_financial_entities(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'lc_application', 'discount_order', 'factoring_contract', 'guarantee_request', 'swift_mt700', etc.
  document_category TEXT NOT NULL DEFAULT 'general', -- 'import', 'export', 'national', 'international'
  document_name TEXT NOT NULL,
  description TEXT,
  template_url TEXT, -- URL to original bank template
  template_file_path TEXT, -- Path in storage
  template_format TEXT DEFAULT 'pdf', -- 'pdf', 'xlsx', 'docx', 'xml'
  field_mappings JSONB DEFAULT '{}', -- { template_field: erp_field_path }
  required_fields TEXT[] DEFAULT '{}',
  optional_fields TEXT[] DEFAULT '{}',
  validation_rules JSONB DEFAULT '{}',
  version TEXT DEFAULT '1.0',
  effective_date DATE,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  is_official BOOLEAN DEFAULT false, -- true = official bank form
  language TEXT DEFAULT 'es',
  download_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Trade Operations Master Table (for all types of operations)
CREATE TABLE public.erp_trade_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  fiscal_year_id UUID REFERENCES public.erp_fiscal_years(id),
  entity_id UUID REFERENCES public.erp_financial_entities(id),
  operation_type TEXT NOT NULL, -- 'commercial_discount', 'documentary_credit', 'factoring', 'confirming', 'bank_guarantee'
  operation_subtype TEXT, -- 'import_lc', 'export_lc', 'standby_lc', etc.
  operation_number TEXT NOT NULL,
  reference_number TEXT, -- Bank reference
  scope TEXT NOT NULL DEFAULT 'national', -- 'national', 'international'
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'pending', 'in_progress', 'approved', 'executed', 'completed', 'cancelled', 'rejected'
  currency TEXT NOT NULL DEFAULT 'EUR',
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  exchange_rate NUMERIC(12,6) DEFAULT 1,
  amount_local NUMERIC(18,2),
  counterparty_type TEXT, -- 'customer', 'supplier', 'bank', 'other'
  counterparty_id UUID, -- Reference to customer/supplier
  counterparty_name TEXT,
  counterparty_country TEXT,
  issue_date DATE,
  effective_date DATE,
  expiry_date DATE,
  maturity_date DATE,
  terms_conditions TEXT,
  incoterm TEXT, -- For international operations
  port_loading TEXT,
  port_discharge TEXT,
  goods_description TEXT,
  documents_required TEXT[] DEFAULT '{}',
  documents_presented TEXT[] DEFAULT '{}',
  swift_messages JSONB DEFAULT '[]',
  fees_amount NUMERIC(18,2) DEFAULT 0,
  interest_rate NUMERIC(8,4),
  interest_amount NUMERIC(18,2) DEFAULT 0,
  commission_amount NUMERIC(18,2) DEFAULT 0,
  total_cost NUMERIC(18,2) DEFAULT 0,
  net_amount NUMERIC(18,2),
  accounting_entry_id UUID,
  is_synced_with_bank BOOLEAN DEFAULT false,
  last_bank_sync_at TIMESTAMPTZ,
  bank_status TEXT,
  bank_response JSONB,
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Trade Operation History/Audit
CREATE TABLE public.erp_trade_operation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_id UUID NOT NULL REFERENCES public.erp_trade_operations(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'updated', 'status_changed', 'approved', 'synced', 'document_added', etc.
  old_status TEXT,
  new_status TEXT,
  old_data JSONB,
  new_data JSONB,
  notes TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.erp_financial_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_trade_api_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_trade_document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_trade_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_trade_operation_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for erp_financial_entities
CREATE POLICY "Users can view financial entities for their companies"
  ON public.erp_financial_entities FOR SELECT
  USING (
    company_id IS NULL OR
    company_id IN (
      SELECT company_id FROM public.erp_user_companies 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage financial entities for their companies"
  ON public.erp_financial_entities FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.erp_user_companies 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- RLS Policies for erp_trade_api_connections
CREATE POLICY "Users can view API connections for their companies"
  ON public.erp_trade_api_connections FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.erp_user_companies 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage API connections for their companies"
  ON public.erp_trade_api_connections FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.erp_user_companies 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- RLS Policies for erp_trade_document_templates
CREATE POLICY "Users can view document templates"
  ON public.erp_trade_document_templates FOR SELECT
  USING (
    company_id IS NULL OR
    entity_id IS NOT NULL OR
    company_id IN (
      SELECT company_id FROM public.erp_user_companies 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage document templates for their companies"
  ON public.erp_trade_document_templates FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.erp_user_companies 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- RLS Policies for erp_trade_operations
CREATE POLICY "Users can view trade operations for their companies"
  ON public.erp_trade_operations FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.erp_user_companies 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage trade operations for their companies"
  ON public.erp_trade_operations FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.erp_user_companies 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- RLS Policies for erp_trade_operation_history
CREATE POLICY "Users can view operation history for their companies"
  ON public.erp_trade_operation_history FOR SELECT
  USING (
    operation_id IN (
      SELECT id FROM public.erp_trade_operations 
      WHERE company_id IN (
        SELECT company_id FROM public.erp_user_companies 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Users can insert operation history"
  ON public.erp_trade_operation_history FOR INSERT
  WITH CHECK (
    operation_id IN (
      SELECT id FROM public.erp_trade_operations 
      WHERE company_id IN (
        SELECT company_id FROM public.erp_user_companies 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Indexes for performance
CREATE INDEX idx_erp_financial_entities_company ON public.erp_financial_entities(company_id);
CREATE INDEX idx_erp_financial_entities_type ON public.erp_financial_entities(entity_type);
CREATE INDEX idx_erp_financial_entities_country ON public.erp_financial_entities(country);

CREATE INDEX idx_erp_trade_api_connections_company ON public.erp_trade_api_connections(company_id);
CREATE INDEX idx_erp_trade_api_connections_entity ON public.erp_trade_api_connections(entity_id);
CREATE INDEX idx_erp_trade_api_connections_status ON public.erp_trade_api_connections(status);

CREATE INDEX idx_erp_trade_document_templates_entity ON public.erp_trade_document_templates(entity_id);
CREATE INDEX idx_erp_trade_document_templates_type ON public.erp_trade_document_templates(document_type);
CREATE INDEX idx_erp_trade_document_templates_company ON public.erp_trade_document_templates(company_id);

CREATE INDEX idx_erp_trade_operations_company ON public.erp_trade_operations(company_id);
CREATE INDEX idx_erp_trade_operations_type ON public.erp_trade_operations(operation_type);
CREATE INDEX idx_erp_trade_operations_status ON public.erp_trade_operations(status);
CREATE INDEX idx_erp_trade_operations_entity ON public.erp_trade_operations(entity_id);
CREATE INDEX idx_erp_trade_operations_dates ON public.erp_trade_operations(issue_date, maturity_date);

CREATE INDEX idx_erp_trade_operation_history_operation ON public.erp_trade_operation_history(operation_id);

-- Trigger for updated_at
CREATE TRIGGER update_erp_financial_entities_updated_at
  BEFORE UPDATE ON public.erp_financial_entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_erp_trade_api_connections_updated_at
  BEFORE UPDATE ON public.erp_trade_api_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_erp_trade_document_templates_updated_at
  BEFORE UPDATE ON public.erp_trade_document_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_erp_trade_operations_updated_at
  BEFORE UPDATE ON public.erp_trade_operations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default financial entities (major banks)
INSERT INTO public.erp_financial_entities (name, legal_name, swift_bic, country, entity_type, supported_operations, api_type) VALUES
  ('Santander', 'Banco Santander S.A.', 'BSCHESMMXXX', 'ES', 'bank', ARRAY['discount', 'lc_import', 'lc_export', 'factoring', 'confirming', 'guarantees'], 'psd2'),
  ('BBVA', 'Banco Bilbao Vizcaya Argentaria S.A.', 'BBVAESMMXXX', 'ES', 'bank', ARRAY['discount', 'lc_import', 'lc_export', 'factoring', 'confirming', 'guarantees'], 'psd2'),
  ('CaixaBank', 'CaixaBank S.A.', 'CABORSKCOMP', 'ES', 'bank', ARRAY['discount', 'lc_import', 'lc_export', 'factoring', 'confirming', 'guarantees'], 'psd2'),
  ('Sabadell', 'Banco de Sabadell S.A.', 'BSABESBBXXX', 'ES', 'bank', ARRAY['discount', 'lc_import', 'lc_export', 'factoring', 'confirming', 'guarantees'], 'psd2'),
  ('Bankinter', 'Bankinter S.A.', 'BKBKESMMXXX', 'ES', 'bank', ARRAY['discount', 'lc_import', 'lc_export', 'factoring', 'confirming'], 'psd2'),
  ('Deutsche Bank', 'Deutsche Bank AG', 'DEUTDEFFXXX', 'DE', 'bank', ARRAY['lc_import', 'lc_export', 'guarantees'], 'swift_gpi'),
  ('HSBC', 'HSBC Holdings plc', 'MIDLGB22XXX', 'GB', 'bank', ARRAY['lc_import', 'lc_export', 'factoring', 'guarantees'], 'swift_gpi'),
  ('BNP Paribas', 'BNP Paribas S.A.', 'BNPAFRPPXXX', 'FR', 'bank', ARRAY['lc_import', 'lc_export', 'factoring', 'confirming', 'guarantees'], 'swift_gpi'),
  ('ING', 'ING Groep N.V.', 'INGBNL2AXXX', 'NL', 'bank', ARRAY['discount', 'lc_import', 'lc_export', 'factoring'], 'psd2');

-- Enable realtime for operations table
ALTER PUBLICATION supabase_realtime ADD TABLE public.erp_trade_operations;
