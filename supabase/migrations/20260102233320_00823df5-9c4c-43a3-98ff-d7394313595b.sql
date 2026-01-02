-- ============================================
-- PHASE 1: NIIF/NIIC Compliance Engine Tables
-- ============================================

-- Accounting Frameworks (PGC, NIIF, US GAAP, etc.)
CREATE TABLE public.accounting_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_code TEXT NOT NULL UNIQUE,
  framework_name TEXT NOT NULL,
  description TEXT,
  version TEXT,
  effective_date DATE,
  country_codes TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Account Mappings between frameworks (e.g., PGC 2007 ↔ NIIF)
CREATE TABLE public.account_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_framework_id UUID REFERENCES public.accounting_frameworks(id),
  target_framework_id UUID REFERENCES public.accounting_frameworks(id),
  source_account_code TEXT NOT NULL,
  source_account_name TEXT,
  target_account_code TEXT NOT NULL,
  target_account_name TEXT,
  mapping_type TEXT DEFAULT 'direct',
  mapping_rules JSONB DEFAULT '{}',
  conversion_formula TEXT,
  notes TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Compliance Rules based on NIIF/NIC standards
CREATE TABLE public.compliance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID REFERENCES public.accounting_frameworks(id),
  rule_code TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  standard_reference TEXT,
  description TEXT,
  rule_type TEXT DEFAULT 'validation',
  severity TEXT DEFAULT 'warning',
  validation_logic JSONB,
  error_message TEXT,
  remediation_guidance TEXT,
  applies_to TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  effective_from DATE,
  effective_until DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Framework Reports (dual reporting, conversions)
CREATE TABLE public.framework_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  source_framework_id UUID REFERENCES public.accounting_frameworks(id),
  target_framework_id UUID REFERENCES public.accounting_frameworks(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  report_data JSONB NOT NULL DEFAULT '{}',
  adjustments JSONB DEFAULT '[]',
  reconciliation_notes TEXT,
  compliance_status TEXT DEFAULT 'pending',
  compliance_issues JSONB DEFAULT '[]',
  generated_by UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Compliance Audit Trail
CREATE TABLE public.compliance_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  framework_id UUID REFERENCES public.accounting_frameworks(id),
  rule_id UUID REFERENCES public.compliance_rules(id),
  old_values JSONB,
  new_values JSONB,
  compliance_result TEXT,
  issues_found JSONB DEFAULT '[]',
  performed_by UUID,
  performed_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PHASE 2: Voice Intelligence Hub Tables
-- ============================================

-- Voice Sessions for ERP interactions
CREATE TABLE public.erp_voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_type TEXT DEFAULT 'general',
  language TEXT DEFAULT 'es',
  voice_id TEXT,
  status TEXT DEFAULT 'active',
  context_data JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  total_duration_seconds INTEGER,
  messages_count INTEGER DEFAULT 0,
  actions_taken JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Voice Transcripts
CREATE TABLE public.erp_voice_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.erp_voice_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT,
  confidence_score DECIMAL(5,4),
  audio_duration_ms INTEGER,
  intent_detected TEXT,
  entities_extracted JSONB DEFAULT '{}',
  action_triggered TEXT,
  action_result JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Voice Preferences
CREATE TABLE public.user_voice_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  preferred_language TEXT DEFAULT 'es',
  voice_id_es TEXT DEFAULT 'JBFqnCBsd6RMkjVDRZzb',
  voice_id_ca TEXT DEFAULT 'JBFqnCBsd6RMkjVDRZzb',
  voice_id_en TEXT DEFAULT 'onwK4e9ZLuTAKqWW03F9',
  voice_id_fr TEXT DEFAULT 'TX3LPaxmHKxFdv7VOQHJ',
  speech_rate DECIMAL(3,2) DEFAULT 1.0,
  auto_detect_language BOOLEAN DEFAULT true,
  enable_voice_feedback BOOLEAN DEFAULT true,
  enable_voice_commands BOOLEAN DEFAULT true,
  wake_word_enabled BOOLEAN DEFAULT false,
  transcription_display TEXT DEFAULT 'realtime',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Voice Command Templates
CREATE TABLE public.voice_command_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  command_key TEXT NOT NULL UNIQUE,
  command_patterns JSONB NOT NULL,
  intent TEXT NOT NULL,
  required_entities TEXT[] DEFAULT '{}',
  optional_entities TEXT[] DEFAULT '{}',
  action_type TEXT NOT NULL,
  action_config JSONB DEFAULT '{}',
  confirmation_required BOOLEAN DEFAULT true,
  examples JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.accounting_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.framework_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_voice_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_voice_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_command_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accounting_frameworks (read-only for authenticated)
CREATE POLICY "Frameworks viewable by authenticated users"
  ON public.accounting_frameworks FOR SELECT
  TO authenticated USING (true);

-- RLS Policies for account_mappings
CREATE POLICY "Mappings viewable by authenticated users"
  ON public.account_mappings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage mappings"
  ON public.account_mappings FOR ALL
  TO authenticated USING (is_admin_or_superadmin(auth.uid()));

-- RLS Policies for compliance_rules
CREATE POLICY "Rules viewable by authenticated users"
  ON public.compliance_rules FOR SELECT
  TO authenticated USING (true);

-- RLS Policies for framework_reports
CREATE POLICY "Users can view their reports"
  ON public.framework_reports FOR SELECT
  TO authenticated USING (generated_by = auth.uid() OR approved_by = auth.uid() OR is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can create reports"
  ON public.framework_reports FOR INSERT
  TO authenticated WITH CHECK (generated_by = auth.uid());

CREATE POLICY "Users can update their reports"
  ON public.framework_reports FOR UPDATE
  TO authenticated USING (generated_by = auth.uid() OR is_admin_or_superadmin(auth.uid()));

-- RLS Policies for compliance_audit_log
CREATE POLICY "Users can view audit logs"
  ON public.compliance_audit_log FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "System can insert audit logs"
  ON public.compliance_audit_log FOR INSERT
  TO authenticated WITH CHECK (true);

-- RLS Policies for erp_voice_sessions
CREATE POLICY "Users manage own voice sessions"
  ON public.erp_voice_sessions FOR ALL
  TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for erp_voice_transcripts
CREATE POLICY "Users manage own transcripts"
  ON public.erp_voice_transcripts FOR ALL
  TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for user_voice_preferences
CREATE POLICY "Users manage own voice preferences"
  ON public.user_voice_preferences FOR ALL
  TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for voice_command_templates (read-only)
CREATE POLICY "Command templates viewable by authenticated"
  ON public.voice_command_templates FOR SELECT
  TO authenticated USING (is_active = true);

-- Insert default accounting frameworks
INSERT INTO public.accounting_frameworks (framework_code, framework_name, description, version, country_codes) VALUES
  ('PGC_2007', 'Plan General de Contabilidad 2007', 'Plan General de Contabilidad español adaptado a las NIIF', '2007', ARRAY['ES']),
  ('PGC_PYMES', 'PGC para PYMES', 'Plan General de Contabilidad para Pequeñas y Medianas Empresas', '2007', ARRAY['ES']),
  ('NIIF_FULL', 'NIIF Completas', 'Normas Internacionales de Información Financiera (IFRS Full)', '2024', ARRAY['INTL']),
  ('NIIF_PYMES', 'NIIF para PYMES', 'Normas Internacionales de Información Financiera para PYMES', '2024', ARRAY['INTL']),
  ('US_GAAP', 'US GAAP', 'Generally Accepted Accounting Principles (USA)', '2024', ARRAY['US']);

-- Insert default voice command templates
INSERT INTO public.voice_command_templates (command_key, command_patterns, intent, required_entities, action_type, examples) VALUES
  ('create_journal_entry', '{"es": ["crear asiento", "nuevo asiento", "registrar asiento"], "ca": ["crear assentament", "nou assentament"], "en": ["create journal entry", "new entry", "record entry"]}', 'create_journal', ARRAY['amount'], 'create_journal', '{"es": "Crear asiento de venta por 1500 euros", "en": "Create sales entry for 1500 euros"}'),
  ('query_balance', '{"es": ["saldo de", "balance de", "cuánto tiene"], "ca": ["saldo de", "balanç de"], "en": ["balance of", "what is the balance"]}', 'query_balance', ARRAY['account_or_entity'], 'query_balance', '{"es": "¿Cuál es el saldo del cliente Acme?", "en": "What is the balance of customer Acme?"}'),
  ('generate_report', '{"es": ["generar informe", "crear reporte", "mostrar balance"], "ca": ["generar informe", "crear report"], "en": ["generate report", "create report", "show balance"]}', 'generate_report', ARRAY['report_type'], 'generate_report', '{"es": "Generar balance de situación", "en": "Generate balance sheet"}'),
  ('query_vat', '{"es": ["IVA del", "impuestos del"], "ca": ["IVA del", "impostos del"], "en": ["VAT for", "taxes for"]}', 'query_vat', ARRAY['period'], 'query_vat', '{"es": "¿Cuánto IVA tenemos del trimestre?", "en": "How much VAT do we have for the quarter?"}');

-- Apply triggers for updated_at
CREATE TRIGGER update_accounting_frameworks_updated_at BEFORE UPDATE ON public.accounting_frameworks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_account_mappings_updated_at BEFORE UPDATE ON public.account_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_rules_updated_at BEFORE UPDATE ON public.compliance_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_framework_reports_updated_at BEFORE UPDATE ON public.framework_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_erp_voice_sessions_updated_at BEFORE UPDATE ON public.erp_voice_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_voice_preferences_updated_at BEFORE UPDATE ON public.user_voice_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();