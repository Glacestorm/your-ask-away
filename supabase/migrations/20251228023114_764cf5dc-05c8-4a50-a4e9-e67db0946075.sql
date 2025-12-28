-- =============================================
-- FASE 1: Sistema de Licencias Enterprise
-- =============================================

-- Tabla de planes de licencia disponibles
CREATE TABLE public.license_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- 'starter', 'professional', 'enterprise'
  description TEXT,
  features JSONB NOT NULL DEFAULT '{}', -- Feature flags embebidos
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  max_users_default INTEGER DEFAULT 5,
  max_devices_default INTEGER DEFAULT 3,
  max_api_calls_month INTEGER,
  trial_days INTEGER DEFAULT 14,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla principal de licencias
CREATE TABLE public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT UNIQUE NOT NULL,
  license_key_hash TEXT NOT NULL, -- Hash para búsquedas seguras
  license_type TEXT NOT NULL CHECK (license_type IN ('trial', 'freemium', 'subscription', 'perpetual', 'usage_based', 'floating', 'node_locked', 'enterprise')),
  plan_id UUID REFERENCES public.license_plans(id),
  organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
  
  -- Datos del licenciatario
  licensee_email TEXT NOT NULL,
  licensee_name TEXT,
  licensee_company TEXT,
  
  -- Datos firmados embebidos
  signed_data JSONB NOT NULL,
  signature TEXT NOT NULL,
  public_key TEXT NOT NULL, -- Clave pública para verificación offline
  
  -- Límites
  max_users INTEGER DEFAULT 5,
  max_devices INTEGER DEFAULT 3,
  max_api_calls_month INTEGER,
  max_concurrent_sessions INTEGER DEFAULT 1,
  
  -- Fechas
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  last_validated_at TIMESTAMPTZ,
  last_heartbeat_at TIMESTAMPTZ,
  
  -- Estado
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'expired', 'revoked', 'cancelled')),
  revocation_reason TEXT,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  
  -- Restricciones geográficas
  allowed_countries TEXT[],
  blocked_ips INET[],
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activaciones de dispositivos
CREATE TABLE public.device_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_fingerprint_hash TEXT NOT NULL, -- Hash para búsquedas
  device_name TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'web', 'mobile', 'server', 'vm')),
  
  -- Hardware info (hashed para privacidad)
  hardware_info JSONB DEFAULT '{}',
  cpu_hash TEXT,
  gpu_hash TEXT,
  screen_hash TEXT,
  timezone TEXT,
  locale TEXT,
  
  -- Información de red
  ip_address INET,
  last_ip_address INET,
  user_agent TEXT,
  
  -- Estado
  first_activated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  deactivated_at TIMESTAMPTZ,
  deactivation_reason TEXT,
  
  -- Contador de sesiones
  session_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(license_id, device_fingerprint_hash)
);

-- Historial de validaciones
CREATE TABLE public.license_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES public.licenses(id) ON DELETE SET NULL,
  license_key_hash TEXT, -- Para auditoría incluso si licencia borrada
  device_fingerprint_hash TEXT,
  
  -- Información de la solicitud
  ip_address INET,
  user_agent TEXT,
  geo_country TEXT,
  geo_city TEXT,
  
  -- Resultado
  validation_result TEXT NOT NULL CHECK (validation_result IN (
    'success', 'expired', 'revoked', 'suspended', 'invalid_signature', 
    'device_limit_exceeded', 'concurrent_limit_exceeded', 'geo_blocked',
    'ip_blocked', 'invalid_key', 'suspicious', 'offline_grace'
  )),
  validation_details JSONB DEFAULT '{}',
  
  -- Tiempo
  validation_duration_ms INTEGER,
  validated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entitlements (Feature flags) por licencia
CREATE TABLE public.license_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  feature_name TEXT,
  
  -- Estado
  is_enabled BOOLEAN DEFAULT true,
  
  -- Límites de uso
  usage_limit INTEGER, -- NULL = unlimited
  usage_current INTEGER DEFAULT 0,
  reset_period TEXT CHECK (reset_period IN ('hourly', 'daily', 'weekly', 'monthly', 'yearly', NULL)),
  last_reset_at TIMESTAMPTZ,
  
  -- Fechas específicas del feature
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(license_id, feature_key)
);

-- Historial de uso de features
CREATE TABLE public.license_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES public.licenses(id) ON DELETE SET NULL,
  entitlement_id UUID REFERENCES public.license_entitlements(id) ON DELETE SET NULL,
  feature_key TEXT NOT NULL,
  
  -- Detalles del uso
  action TEXT NOT NULL, -- 'api_call', 'feature_access', 'export', etc.
  quantity INTEGER DEFAULT 1,
  
  -- Contexto
  device_fingerprint_hash TEXT,
  ip_address INET,
  user_id UUID,
  
  metadata JSONB DEFAULT '{}',
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alertas de anomalías
CREATE TABLE public.license_anomaly_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES public.licenses(id) ON DELETE CASCADE,
  
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'multiple_ips', 'device_limit_attempts', 'geographic_anomaly',
    'usage_spike', 'suspicious_pattern', 'concurrent_abuse', 'offline_extended'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  description TEXT,
  details JSONB DEFAULT '{}',
  
  -- Estado
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX idx_licenses_key_hash ON public.licenses(license_key_hash);
CREATE INDEX idx_licenses_status ON public.licenses(status);
CREATE INDEX idx_licenses_org ON public.licenses(organization_id);
CREATE INDEX idx_licenses_email ON public.licenses(licensee_email);
CREATE INDEX idx_licenses_expires ON public.licenses(expires_at) WHERE status = 'active';

CREATE INDEX idx_device_activations_license ON public.device_activations(license_id);
CREATE INDEX idx_device_activations_fingerprint ON public.device_activations(device_fingerprint_hash);
CREATE INDEX idx_device_activations_active ON public.device_activations(license_id) WHERE is_active = true;

CREATE INDEX idx_validations_license ON public.license_validations(license_id);
CREATE INDEX idx_validations_result ON public.license_validations(validation_result);
CREATE INDEX idx_validations_time ON public.license_validations(validated_at DESC);

CREATE INDEX idx_entitlements_license ON public.license_entitlements(license_id);
CREATE INDEX idx_entitlements_feature ON public.license_entitlements(feature_key);

CREATE INDEX idx_usage_logs_license ON public.license_usage_logs(license_id);
CREATE INDEX idx_usage_logs_feature ON public.license_usage_logs(feature_key);
CREATE INDEX idx_usage_logs_time ON public.license_usage_logs(logged_at DESC);

CREATE INDEX idx_anomaly_alerts_license ON public.license_anomaly_alerts(license_id);
CREATE INDEX idx_anomaly_alerts_status ON public.license_anomaly_alerts(status) WHERE status = 'open';

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_license_tables_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_license_plans_timestamp
  BEFORE UPDATE ON public.license_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_license_tables_timestamp();

CREATE TRIGGER update_licenses_timestamp
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW EXECUTE FUNCTION public.update_license_tables_timestamp();

CREATE TRIGGER update_device_activations_timestamp
  BEFORE UPDATE ON public.device_activations
  FOR EACH ROW EXECUTE FUNCTION public.update_license_tables_timestamp();

CREATE TRIGGER update_entitlements_timestamp
  BEFORE UPDATE ON public.license_entitlements
  FOR EACH ROW EXECUTE FUNCTION public.update_license_tables_timestamp();

CREATE TRIGGER update_anomaly_alerts_timestamp
  BEFORE UPDATE ON public.license_anomaly_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_license_tables_timestamp();

-- Función para verificar expiración automática
CREATE OR REPLACE FUNCTION public.check_license_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW() AND NEW.status = 'active' THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER check_license_expiration_trigger
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW EXECUTE FUNCTION public.check_license_expiration();

-- Función para hash de license key
CREATE OR REPLACE FUNCTION public.hash_license_key(p_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(sha256(p_key::bytea), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Función helper para verificar si licencia está activa
CREATE OR REPLACE FUNCTION public.is_license_valid(p_license_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_license RECORD;
BEGIN
  SELECT status, expires_at INTO v_license
  FROM public.licenses
  WHERE id = p_license_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  IF v_license.status != 'active' THEN
    RETURN FALSE;
  END IF;
  
  IF v_license.expires_at IS NOT NULL AND v_license.expires_at < NOW() THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- RLS Policies
ALTER TABLE public.license_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_anomaly_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas para license_plans (públicos para lectura)
CREATE POLICY "License plans are viewable by everyone"
  ON public.license_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage license plans"
  ON public.license_plans FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

-- Políticas para licenses
CREATE POLICY "Users can view their organization licenses"
  ON public.licenses FOR SELECT
  USING (
    is_admin_or_superadmin(auth.uid()) OR
    licensee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage all licenses"
  ON public.licenses FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

-- Políticas para device_activations
CREATE POLICY "Users can view their device activations"
  ON public.device_activations FOR SELECT
  USING (
    is_admin_or_superadmin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.licenses l
      WHERE l.id = device_activations.license_id
      AND l.licensee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage device activations"
  ON public.device_activations FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

-- Políticas para license_validations (solo admins)
CREATE POLICY "Admins can view validations"
  ON public.license_validations FOR SELECT
  USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "System can insert validations"
  ON public.license_validations FOR INSERT
  WITH CHECK (true);

-- Políticas para entitlements
CREATE POLICY "Users can view their entitlements"
  ON public.license_entitlements FOR SELECT
  USING (
    is_admin_or_superadmin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.licenses l
      WHERE l.id = license_entitlements.license_id
      AND l.licensee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage entitlements"
  ON public.license_entitlements FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

-- Políticas para usage logs
CREATE POLICY "Admins can view usage logs"
  ON public.license_usage_logs FOR SELECT
  USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "System can insert usage logs"
  ON public.license_usage_logs FOR INSERT
  WITH CHECK (true);

-- Políticas para anomaly alerts
CREATE POLICY "Admins can manage anomaly alerts"
  ON public.license_anomaly_alerts FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

-- Insertar planes de licencia por defecto
INSERT INTO public.license_plans (code, name, description, features, price_monthly, price_yearly, max_users_default, max_devices_default, max_api_calls_month, trial_days, display_order)
VALUES 
  ('starter', 'Starter', 'Ideal para pequeños equipos', 
   '{"core.dashboard": true, "core.reports": true, "core.basic_analytics": true, "limits.max_users": 5, "limits.max_storage_gb": 5}'::jsonb,
   29.00, 290.00, 5, 3, 1000, 14, 1),
  
  ('professional', 'Professional', 'Para equipos en crecimiento',
   '{"core.dashboard": true, "core.reports": true, "core.basic_analytics": true, "premium.advanced_analytics": true, "premium.api_access": true, "premium.integrations": true, "limits.max_users": 25, "limits.max_storage_gb": 50}'::jsonb,
   79.00, 790.00, 25, 10, 10000, 14, 2),
  
  ('enterprise', 'Enterprise', 'Para grandes organizaciones',
   '{"core.dashboard": true, "core.reports": true, "core.basic_analytics": true, "premium.advanced_analytics": true, "premium.api_access": true, "premium.integrations": true, "premium.ai_assistant": true, "enterprise.sso": true, "enterprise.audit_logs": true, "enterprise.custom_branding": true, "enterprise.priority_support": true, "enterprise.dedicated_support": true, "limits.max_users": -1, "limits.max_storage_gb": -1}'::jsonb,
   NULL, NULL, -1, -1, -1, 30, 3)
ON CONFLICT (code) DO NOTHING;