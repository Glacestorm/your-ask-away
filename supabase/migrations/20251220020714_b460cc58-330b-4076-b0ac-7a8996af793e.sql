-- =============================================
-- FASE 8: MARKETPLACE + PARTNER PROGRAM
-- =============================================

-- 1. Partner Companies (Empresas partner)
CREATE TABLE public.partner_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  legal_name TEXT,
  tax_id TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  website TEXT,
  logo_url TEXT,
  description TEXT,
  partner_tier TEXT DEFAULT 'bronze' CHECK (partner_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'suspended', 'rejected')),
  joined_at TIMESTAMPTZ,
  approved_by UUID,
  revenue_share_percent NUMERIC(5,2) DEFAULT 15.00,
  contract_signed_at TIMESTAMPTZ,
  contract_expires_at TIMESTAMPTZ,
  total_revenue NUMERIC(12,2) DEFAULT 0,
  total_installations INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Partner Users (Usuarios de partners)
CREATE TABLE public.partner_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_company_id UUID REFERENCES public.partner_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'developer')),
  is_primary_contact BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_company_id, user_id)
);

-- 3. Partner Applications (Apps del marketplace)
CREATE TABLE public.partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_company_id UUID REFERENCES public.partner_companies(id) ON DELETE CASCADE,
  app_name TEXT NOT NULL,
  app_key TEXT UNIQUE NOT NULL,
  short_description TEXT,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('erp', 'crm', 'fiscal', 'banking', 'logistics', 'analytics', 'productivity', 'communication', 'security', 'other')),
  subcategory TEXT,
  icon_url TEXT,
  banner_url TEXT,
  screenshots JSONB DEFAULT '[]',
  video_url TEXT,
  version TEXT DEFAULT '1.0.0',
  changelog JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'published', 'rejected', 'deprecated')),
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  rejection_reason TEXT,
  price_type TEXT DEFAULT 'free' CHECK (price_type IN ('free', 'one_time', 'subscription')),
  price_amount NUMERIC(10,2) DEFAULT 0,
  price_currency TEXT DEFAULT 'EUR',
  billing_period TEXT CHECK (billing_period IN ('monthly', 'yearly')),
  trial_days INT DEFAULT 0,
  install_count INT DEFAULT 0,
  rating_average NUMERIC(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  is_certified BOOLEAN DEFAULT false,
  documentation_url TEXT,
  support_url TEXT,
  privacy_policy_url TEXT,
  terms_url TEXT,
  webhook_url TEXT,
  api_scopes TEXT[] DEFAULT '{}',
  min_plan TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Marketplace Reviews (Reseñas)
CREATE TABLE public.marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.partner_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT,
  pros TEXT,
  cons TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  helpful_count INT DEFAULT 0,
  response_text TEXT,
  response_by UUID,
  response_at TIMESTAMPTZ,
  status TEXT DEFAULT 'published' CHECK (status IN ('pending', 'published', 'hidden', 'flagged')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Marketplace Installations (Instalaciones)
CREATE TABLE public.marketplace_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.partner_applications(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL,
  installed_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  license_key TEXT,
  license_type TEXT,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  usage_count INT DEFAULT 0,
  config JSONB DEFAULT '{}',
  uninstalled_at TIMESTAMPTZ,
  uninstall_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Partner Revenue Transactions (Transacciones)
CREATE TABLE public.partner_revenue_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_company_id UUID REFERENCES public.partner_companies(id) ON DELETE SET NULL,
  application_id UUID REFERENCES public.partner_applications(id) ON DELETE SET NULL,
  installation_id UUID REFERENCES public.marketplace_installations(id) ON DELETE SET NULL,
  organization_id UUID,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'subscription', 'renewal', 'refund', 'chargeback')),
  gross_amount NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL,
  partner_amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid', 'failed', 'cancelled')),
  payment_method TEXT,
  external_transaction_id TEXT,
  invoice_url TEXT,
  paid_at TIMESTAMPTZ,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Developer API Keys (Claves API)
CREATE TABLE public.developer_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_company_id UUID REFERENCES public.partner_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  key_name TEXT NOT NULL,
  api_key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  environment TEXT DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  scopes TEXT[] DEFAULT ARRAY['read:basic'],
  rate_limit_per_minute INT DEFAULT 60,
  rate_limit_per_day INT DEFAULT 10000,
  allowed_origins TEXT[] DEFAULT '{}',
  allowed_ips TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  total_requests INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Plugin Permissions (Permisos de plugins)
CREATE TABLE public.plugin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.partner_applications(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  permission_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_required BOOLEAN DEFAULT false,
  is_sensitive BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(application_id, permission_key)
);

-- 9. Partner Webhooks (Webhooks de partners)
CREATE TABLE public.partner_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_company_id UUID REFERENCES public.partner_companies(id) ON DELETE CASCADE,
  webhook_name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  last_response_code INT,
  last_response_body TEXT,
  success_count INT DEFAULT 0,
  failure_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Premium Integrations (Integraciones premium certificadas)
CREATE TABLE public.premium_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name TEXT NOT NULL,
  integration_key TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('erp', 'crm', 'fiscal', 'banking', 'payments', 'logistics', 'communication', 'analytics')),
  description TEXT,
  features JSONB DEFAULT '[]',
  logo_url TEXT,
  documentation_url TEXT,
  setup_guide_url TEXT,
  partner_company_id UUID REFERENCES public.partner_companies(id) ON DELETE SET NULL,
  certification_level TEXT DEFAULT 'basic' CHECK (certification_level IN ('basic', 'certified', 'premium', 'enterprise')),
  certified_at TIMESTAMPTZ,
  certified_by UUID,
  certification_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  install_count INT DEFAULT 0,
  config_schema JSONB DEFAULT '{}',
  required_secrets TEXT[] DEFAULT '{}',
  supported_regions TEXT[] DEFAULT ARRAY['ES', 'EU'],
  pricing_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.partner_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_revenue_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Partner Companies: Public read for active, admin write
CREATE POLICY "Anyone can view active partner companies" ON public.partner_companies
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage partner companies" ON public.partner_companies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

CREATE POLICY "Partners can view their own company" ON public.partner_companies
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.partner_users WHERE partner_company_id = id AND user_id = auth.uid())
  );

-- Partner Users: Partner members can see their team
CREATE POLICY "Partner users can view their team" ON public.partner_users
  FOR SELECT USING (
    partner_company_id IN (SELECT partner_company_id FROM public.partner_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage partner users" ON public.partner_users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

-- Partner Applications: Public read for published, partner write
CREATE POLICY "Anyone can view published applications" ON public.partner_applications
  FOR SELECT USING (status = 'published');

CREATE POLICY "Partners can manage their applications" ON public.partner_applications
  FOR ALL USING (
    partner_company_id IN (SELECT partner_company_id FROM public.partner_users WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'developer'))
  );

CREATE POLICY "Admins can manage all applications" ON public.partner_applications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

-- Marketplace Reviews: Public read, authenticated write
CREATE POLICY "Anyone can view published reviews" ON public.marketplace_reviews
  FOR SELECT USING (status = 'published');

CREATE POLICY "Authenticated users can create reviews" ON public.marketplace_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.marketplace_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Marketplace Installations: User can see their own
CREATE POLICY "Users can view their installations" ON public.marketplace_installations
  FOR SELECT USING (installed_by = auth.uid());

CREATE POLICY "Users can manage their installations" ON public.marketplace_installations
  FOR ALL USING (installed_by = auth.uid());

CREATE POLICY "Admins can view all installations" ON public.marketplace_installations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

-- Revenue Transactions: Partners see their own, admins see all
CREATE POLICY "Partners can view their revenue" ON public.partner_revenue_transactions
  FOR SELECT USING (
    partner_company_id IN (SELECT partner_company_id FROM public.partner_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage revenue transactions" ON public.partner_revenue_transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

-- Developer API Keys: Partners manage their own
CREATE POLICY "Partners can manage their API keys" ON public.developer_api_keys
  FOR ALL USING (
    partner_company_id IN (SELECT partner_company_id FROM public.partner_users WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'developer'))
  );

-- Plugin Permissions: Public read
CREATE POLICY "Anyone can view plugin permissions" ON public.plugin_permissions
  FOR SELECT USING (true);

CREATE POLICY "Partners can manage their app permissions" ON public.plugin_permissions
  FOR ALL USING (
    application_id IN (
      SELECT pa.id FROM public.partner_applications pa
      JOIN public.partner_users pu ON pa.partner_company_id = pu.partner_company_id
      WHERE pu.user_id = auth.uid() AND pu.role IN ('owner', 'admin', 'developer')
    )
  );

-- Partner Webhooks: Partners manage their own
CREATE POLICY "Partners can manage their webhooks" ON public.partner_webhooks
  FOR ALL USING (
    partner_company_id IN (SELECT partner_company_id FROM public.partner_users WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'developer'))
  );

-- Premium Integrations: Public read for active
CREATE POLICY "Anyone can view active integrations" ON public.premium_integrations
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage integrations" ON public.premium_integrations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

-- Indexes for performance
CREATE INDEX idx_partner_companies_status ON public.partner_companies(status);
CREATE INDEX idx_partner_companies_tier ON public.partner_companies(partner_tier);
CREATE INDEX idx_partner_users_user_id ON public.partner_users(user_id);
CREATE INDEX idx_partner_users_company ON public.partner_users(partner_company_id);
CREATE INDEX idx_partner_applications_status ON public.partner_applications(status);
CREATE INDEX idx_partner_applications_category ON public.partner_applications(category);
CREATE INDEX idx_partner_applications_company ON public.partner_applications(partner_company_id);
CREATE INDEX idx_partner_applications_featured ON public.partner_applications(is_featured) WHERE is_featured = true;
CREATE INDEX idx_marketplace_reviews_app ON public.marketplace_reviews(application_id);
CREATE INDEX idx_marketplace_reviews_user ON public.marketplace_reviews(user_id);
CREATE INDEX idx_marketplace_installations_app ON public.marketplace_installations(application_id);
CREATE INDEX idx_marketplace_installations_user ON public.marketplace_installations(installed_by);
CREATE INDEX idx_partner_revenue_company ON public.partner_revenue_transactions(partner_company_id);
CREATE INDEX idx_partner_revenue_app ON public.partner_revenue_transactions(application_id);
CREATE INDEX idx_developer_api_keys_company ON public.developer_api_keys(partner_company_id);
CREATE INDEX idx_developer_api_keys_prefix ON public.developer_api_keys(key_prefix);
CREATE INDEX idx_premium_integrations_category ON public.premium_integrations(category);
CREATE INDEX idx_premium_integrations_key ON public.premium_integrations(integration_key);

-- Triggers for updated_at
CREATE TRIGGER update_partner_companies_updated_at BEFORE UPDATE ON public.partner_companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_users_updated_at BEFORE UPDATE ON public.partner_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_applications_updated_at BEFORE UPDATE ON public.partner_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_reviews_updated_at BEFORE UPDATE ON public.marketplace_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_installations_updated_at BEFORE UPDATE ON public.marketplace_installations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_webhooks_updated_at BEFORE UPDATE ON public.partner_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_premium_integrations_updated_at BEFORE UPDATE ON public.premium_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert 10 Premium Integrations (criterio de salida)
INSERT INTO public.premium_integrations (integration_name, integration_key, provider, category, description, certification_level, is_active, is_featured, features, supported_regions) VALUES
('SAP Business One', 'sap-b1', 'SAP', 'erp', 'Integración completa con SAP Business One para sincronización de datos maestros, pedidos y facturación', 'premium', true, true, '["Sincronización bidireccional", "Gestión de inventario", "Facturación automática", "Reporting integrado"]', ARRAY['ES', 'EU', 'LATAM']),
('Sage 200', 'sage-200', 'Sage', 'erp', 'Conector oficial para Sage 200 con soporte para contabilidad, facturación y gestión comercial', 'certified', true, true, '["Contabilidad integrada", "Facturación electrónica", "Gestión de cobros", "Reporting financiero"]', ARRAY['ES', 'EU']),
('Holded', 'holded', 'Holded', 'erp', 'Integración nativa con Holded para pymes: facturación, inventario y contabilidad en la nube', 'certified', true, false, '["Facturación automática", "Control de stock", "Proyectos", "CRM básico"]', ARRAY['ES']),
('Salesforce', 'salesforce', 'Salesforce', 'crm', 'Sincronización avanzada con Salesforce CRM: leads, oportunidades y cuentas', 'premium', true, true, '["Sync bidireccional", "Mapeo de campos personalizado", "Workflows", "Einstein AI"]', ARRAY['ES', 'EU', 'US', 'LATAM']),
('HubSpot', 'hubspot', 'HubSpot', 'crm', 'Integración completa con HubSpot: marketing, ventas y servicio al cliente', 'certified', true, true, '["Contactos y empresas", "Deals y pipeline", "Marketing automation", "Tickets"]', ARRAY['ES', 'EU', 'US']),
('TicketBAI', 'ticketbai', 'Hacienda Foral', 'fiscal', 'Cumplimiento normativo TicketBAI para País Vasco: generación y envío automático de facturas', 'premium', true, true, '["Firma digital", "Envío automático", "QR obligatorio", "Histórico auditable"]', ARRAY['ES-PV']),
('VeriFactu', 'verifactu', 'AEAT', 'fiscal', 'Sistema VeriFactu de la AEAT para facturación verificable en tiempo real', 'premium', true, true, '["Facturación en tiempo real", "Código QR", "Registro inmediato", "Auditoría completa"]', ARRAY['ES']),
('Stripe', 'stripe', 'Stripe', 'payments', 'Procesamiento de pagos con Stripe: tarjetas, SEPA, y métodos locales', 'certified', true, true, '["Pagos con tarjeta", "SEPA Direct Debit", "Suscripciones", "Facturación"]', ARRAY['ES', 'EU', 'US']),
('Bizum', 'bizum', 'Bizum', 'payments', 'Integración con Bizum para cobros entre particulares y comercios', 'certified', true, false, '["Cobros instantáneos", "QR de pago", "Notificaciones", "Conciliación automática"]', ARRAY['ES']),
('Mapbox', 'mapbox', 'Mapbox', 'logistics', 'Servicios de geolocalización avanzada: rutas, geocoding y mapas interactivos', 'certified', true, false, '["Optimización de rutas", "Geocodificación", "Mapas personalizados", "Isocronas"]', ARRAY['ES', 'EU', 'US', 'GLOBAL']);