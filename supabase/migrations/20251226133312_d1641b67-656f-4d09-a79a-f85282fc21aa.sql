-- =====================================================
-- FASE 1: INFRAESTRUCTURA BASE DE MIGRACIÓN CRM
-- =====================================================

-- Tabla principal de migraciones
CREATE TABLE public.crm_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_name TEXT NOT NULL,
  source_crm TEXT NOT NULL,
  source_version TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'mapping', 'validating', 'running', 'paused', 'completed', 'failed', 'cancelled', 'rollback')),
  total_records INTEGER DEFAULT 0,
  migrated_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  skipped_records INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_completion TIMESTAMPTZ,
  config JSONB DEFAULT '{}',
  source_file_url TEXT,
  source_file_type TEXT CHECK (source_file_type IN ('csv', 'json', 'xml', 'xlsx', 'xls')),
  source_file_size BIGINT,
  error_log JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  statistics JSONB DEFAULT '{}',
  ai_analysis JSONB,
  rollback_data JSONB,
  can_rollback BOOLEAN DEFAULT true,
  performed_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_crm_migrations_status ON public.crm_migrations(status);
CREATE INDEX idx_crm_migrations_source_crm ON public.crm_migrations(source_crm);
CREATE INDEX idx_crm_migrations_performed_by ON public.crm_migrations(performed_by);
CREATE INDEX idx_crm_migrations_created_at ON public.crm_migrations(created_at DESC);

-- Tabla de mapeo de campos por CRM
CREATE TABLE public.crm_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_id UUID REFERENCES public.crm_migrations(id) ON DELETE CASCADE,
  source_field TEXT NOT NULL,
  source_field_type TEXT,
  target_table TEXT NOT NULL,
  target_field TEXT NOT NULL,
  target_field_type TEXT,
  transform_function TEXT,
  transform_params JSONB DEFAULT '{}',
  default_value TEXT,
  is_required BOOLEAN DEFAULT false,
  is_primary_key BOOLEAN DEFAULT false,
  is_auto_mapped BOOLEAN DEFAULT false,
  ai_confidence NUMERIC(5,2),
  validation_rules JSONB DEFAULT '[]',
  sample_values JSONB DEFAULT '[]',
  mapped_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para mapeos
CREATE INDEX idx_crm_field_mappings_migration ON public.crm_field_mappings(migration_id);
CREATE INDEX idx_crm_field_mappings_target ON public.crm_field_mappings(target_table, target_field);

-- Tabla de registros migrados para auditoría
CREATE TABLE public.crm_migration_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_id UUID REFERENCES public.crm_migrations(id) ON DELETE CASCADE,
  record_index INTEGER NOT NULL,
  source_data JSONB NOT NULL,
  target_data JSONB,
  target_table TEXT,
  target_record_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'skipped', 'duplicate', 'rolled_back')),
  error_message TEXT,
  error_details JSONB,
  validation_errors JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  is_duplicate BOOLEAN DEFAULT false,
  duplicate_of UUID,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para registros
CREATE INDEX idx_crm_migration_records_migration ON public.crm_migration_records(migration_id);
CREATE INDEX idx_crm_migration_records_status ON public.crm_migration_records(status);
CREATE INDEX idx_crm_migration_records_target ON public.crm_migration_records(target_table, target_record_id);

-- Tabla de templates de mapeo reutilizables
CREATE TABLE public.crm_mapping_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  source_crm TEXT NOT NULL,
  description TEXT,
  field_mappings JSONB NOT NULL DEFAULT '[]',
  transform_rules JSONB DEFAULT '[]',
  validation_rules JSONB DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice único para templates por defecto por CRM
CREATE UNIQUE INDEX idx_crm_mapping_templates_default ON public.crm_mapping_templates(source_crm) WHERE is_default = true;
CREATE INDEX idx_crm_mapping_templates_source ON public.crm_mapping_templates(source_crm);

-- Tabla de conectores CRM soportados
CREATE TABLE public.crm_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_key TEXT UNIQUE NOT NULL,
  connector_name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  supported_formats TEXT[] DEFAULT ARRAY['csv'],
  supported_entities TEXT[] DEFAULT ARRAY['contacts', 'companies'],
  field_definitions JSONB DEFAULT '{}',
  export_guide_url TEXT,
  documentation JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  tier TEXT DEFAULT 'standard' CHECK (tier IN ('enterprise', 'popular', 'standard')),
  popularity_rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar conectores CRM soportados
INSERT INTO public.crm_connectors (connector_key, connector_name, vendor, tier, popularity_rank, supported_formats, supported_entities, description) VALUES
-- Tier 1: Enterprise
('salesforce', 'Salesforce', 'Salesforce Inc.', 'enterprise', 1, ARRAY['csv', 'json', 'xlsx'], ARRAY['contacts', 'leads', 'accounts', 'opportunities', 'cases'], 'CRM líder mundial con funcionalidades completas'),
('dynamics365', 'Microsoft Dynamics 365', 'Microsoft', 'enterprise', 2, ARRAY['csv', 'xlsx', 'json'], ARRAY['contacts', 'accounts', 'leads', 'opportunities'], 'Suite empresarial integrada con Microsoft'),
('hubspot', 'HubSpot CRM', 'HubSpot Inc.', 'enterprise', 3, ARRAY['csv', 'xlsx'], ARRAY['contacts', 'companies', 'deals', 'tickets'], 'CRM gratuito con marketing automation'),
('zoho', 'Zoho CRM', 'Zoho Corp.', 'enterprise', 4, ARRAY['csv', 'xlsx', 'json'], ARRAY['leads', 'contacts', 'accounts', 'deals'], 'Suite completa y accesible'),
('pipedrive', 'Pipedrive', 'Pipedrive Inc.', 'enterprise', 5, ARRAY['csv', 'xlsx'], ARRAY['persons', 'organizations', 'deals', 'activities'], 'CRM enfocado en ventas'),

-- Tier 2: Popular
('oracle', 'Oracle CRM', 'Oracle', 'popular', 6, ARRAY['csv', 'xlsx'], ARRAY['contacts', 'accounts', 'opportunities'], 'Solución enterprise robusta'),
('sap', 'SAP CRM', 'SAP SE', 'popular', 7, ARRAY['csv', 'xlsx', 'xml'], ARRAY['contacts', 'accounts', 'opportunities', 'activities'], 'Integración con ERP SAP'),
('freshsales', 'Freshsales', 'Freshworks', 'popular', 8, ARRAY['csv', 'xlsx'], ARRAY['contacts', 'accounts', 'deals'], 'CRM moderno y ágil'),
('monday', 'Monday.com CRM', 'Monday.com', 'popular', 9, ARRAY['csv', 'xlsx'], ARRAY['contacts', 'deals', 'activities'], 'CRM visual basado en boards'),
('zendesk', 'Zendesk Sell', 'Zendesk', 'popular', 10, ARRAY['csv', 'xlsx'], ARRAY['contacts', 'leads', 'deals'], 'CRM con soporte integrado'),

-- Tier 3: Standard
('insightly', 'Insightly', 'Insightly Inc.', 'standard', 11, ARRAY['csv'], ARRAY['contacts', 'organizations', 'opportunities'], 'CRM para pequeñas empresas'),
('copper', 'Copper CRM', 'Copper Inc.', 'standard', 12, ARRAY['csv'], ARRAY['people', 'companies', 'opportunities'], 'CRM nativo de Google Workspace'),
('agilecrm', 'Agile CRM', 'Agile CRM', 'standard', 13, ARRAY['csv'], ARRAY['contacts', 'companies', 'deals'], 'CRM todo en uno asequible'),
('sugarcrm', 'SugarCRM', 'SugarCRM Inc.', 'standard', 14, ARRAY['csv', 'json'], ARRAY['contacts', 'accounts', 'opportunities'], 'CRM open-source empresarial'),
('vtiger', 'Vtiger CRM', 'Vtiger', 'standard', 15, ARRAY['csv', 'xlsx'], ARRAY['contacts', 'organizations', 'opportunities'], 'CRM open-source completo'),

-- Universal
('universal', 'Importación Universal', 'Generic', 'standard', 99, ARRAY['csv', 'json', 'xml', 'xlsx', 'xls'], ARRAY['contacts', 'companies', 'deals', 'custom'], 'Conector genérico para cualquier fuente');

-- Enable RLS
ALTER TABLE public.crm_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_migration_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_mapping_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_connectors ENABLE ROW LEVEL SECURITY;

-- Policies para crm_migrations
CREATE POLICY "Admins can manage all migrations" ON public.crm_migrations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "Users can view their migrations" ON public.crm_migrations
  FOR SELECT USING (performed_by = auth.uid());

-- Policies para crm_field_mappings
CREATE POLICY "Users can manage field mappings for their migrations" ON public.crm_field_mappings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.crm_migrations m 
      WHERE m.id = migration_id 
      AND (m.performed_by = auth.uid() OR EXISTS (
        SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
      ))
    )
  );

-- Policies para crm_migration_records
CREATE POLICY "Users can view records for their migrations" ON public.crm_migration_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.crm_migrations m 
      WHERE m.id = migration_id 
      AND (m.performed_by = auth.uid() OR EXISTS (
        SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
      ))
    )
  );

-- Policies para crm_mapping_templates
CREATE POLICY "Anyone can view public templates" ON public.crm_mapping_templates
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage their templates" ON public.crm_mapping_templates
  FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Admins can manage all templates" ON public.crm_mapping_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Policies para crm_connectors (solo lectura para todos)
CREATE POLICY "Anyone can view connectors" ON public.crm_connectors
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage connectors" ON public.crm_connectors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Trigger para updated_at
CREATE TRIGGER update_crm_migrations_updated_at
  BEFORE UPDATE ON public.crm_migrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_field_mappings_updated_at
  BEFORE UPDATE ON public.crm_field_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_mapping_templates_updated_at
  BEFORE UPDATE ON public.crm_mapping_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_migrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_migration_records;