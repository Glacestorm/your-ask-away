-- =====================================================
-- PHASE 1: Client Installations Infrastructure (Fixed)
-- =====================================================

-- Table: client_installations
-- Tracks each client's installation with language preferences and remote access settings
CREATE TABLE public.client_installations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    installation_name TEXT NOT NULL,
    installation_key TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    preferred_locale TEXT NOT NULL DEFAULT 'es',
    secondary_locales TEXT[] DEFAULT ARRAY[]::TEXT[],
    remote_access_allowed BOOLEAN NOT NULL DEFAULT false,
    remote_access_pin TEXT,
    remote_access_pin_expires_at TIMESTAMPTZ,
    installation_config JSONB DEFAULT '{}'::jsonb,
    version TEXT DEFAULT '1.0.0',
    last_sync_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: remote_access_sessions
-- Full audit trail of all remote support sessions
CREATE TABLE public.remote_access_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    installation_id UUID NOT NULL REFERENCES public.client_installations(id) ON DELETE CASCADE,
    support_user_id UUID NOT NULL REFERENCES public.profiles(id),
    session_type TEXT NOT NULL DEFAULT 'support',
    session_status TEXT NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    actions_performed JSONB[] DEFAULT ARRAY[]::JSONB[],
    notes TEXT,
    client_notified_at TIMESTAMPTZ,
    client_acknowledged_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: installation_downloads
-- Tracks ALL downloads with full metadata
CREATE TABLE public.installation_downloads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    installation_id UUID NOT NULL REFERENCES public.client_installations(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.app_modules(id) ON DELETE CASCADE,
    module_version TEXT NOT NULL,
    locale_downloaded TEXT NOT NULL,
    download_type TEXT NOT NULL DEFAULT 'install',
    download_size_bytes BIGINT,
    download_duration_ms INTEGER,
    download_status TEXT NOT NULL DEFAULT 'completed',
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: module_translations
-- Contextual translations per module
CREATE TABLE public.module_translations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    module_id UUID NOT NULL REFERENCES public.app_modules(id) ON DELETE CASCADE,
    locale TEXT NOT NULL,
    namespace TEXT NOT NULL DEFAULT 'default',
    translation_key TEXT NOT NULL,
    translation_value TEXT NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    ai_generated BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(module_id, locale, namespace, translation_key)
);

-- Add locale_installed to installed_modules
ALTER TABLE public.installed_modules 
ADD COLUMN IF NOT EXISTS locale_installed TEXT DEFAULT 'es',
ADD COLUMN IF NOT EXISTS auto_update_translations BOOLEAN DEFAULT true;

-- Create indexes for performance
CREATE INDEX idx_client_installations_company ON public.client_installations(company_id);
CREATE INDEX idx_client_installations_user ON public.client_installations(user_id);
CREATE INDEX idx_client_installations_locale ON public.client_installations(preferred_locale);
CREATE INDEX idx_client_installations_active ON public.client_installations(is_active) WHERE is_active = true;

CREATE INDEX idx_remote_access_sessions_installation ON public.remote_access_sessions(installation_id);
CREATE INDEX idx_remote_access_sessions_support_user ON public.remote_access_sessions(support_user_id);
CREATE INDEX idx_remote_access_sessions_status ON public.remote_access_sessions(session_status);

CREATE INDEX idx_installation_downloads_installation ON public.installation_downloads(installation_id);
CREATE INDEX idx_installation_downloads_module ON public.installation_downloads(module_id);
CREATE INDEX idx_installation_downloads_date ON public.installation_downloads(downloaded_at);

CREATE INDEX idx_module_translations_module ON public.module_translations(module_id);
CREATE INDEX idx_module_translations_locale ON public.module_translations(locale);
CREATE INDEX idx_module_translations_lookup ON public.module_translations(module_id, locale, namespace);

-- Enable RLS
ALTER TABLE public.client_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_access_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installation_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_installations
CREATE POLICY "Admins can manage all installations"
ON public.client_installations
FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view own installations"
ON public.client_installations
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can manage own installations"
ON public.client_installations
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS Policies for remote_access_sessions
CREATE POLICY "Admins can manage remote sessions"
ON public.remote_access_sessions
FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Support users can view their sessions"
ON public.remote_access_sessions
FOR SELECT
USING (support_user_id = auth.uid());

CREATE POLICY "Users can view sessions for their installations"
ON public.remote_access_sessions
FOR SELECT
USING (
    installation_id IN (
        SELECT id FROM public.client_installations WHERE user_id = auth.uid()
    )
);

-- RLS Policies for installation_downloads
CREATE POLICY "Admins can view all downloads"
ON public.installation_downloads
FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view their installation downloads"
ON public.installation_downloads
FOR SELECT
USING (
    installation_id IN (
        SELECT id FROM public.client_installations WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create downloads for their installations"
ON public.installation_downloads
FOR INSERT
WITH CHECK (
    installation_id IN (
        SELECT id FROM public.client_installations WHERE user_id = auth.uid()
    )
);

-- RLS Policies for module_translations
CREATE POLICY "Anyone can read module translations"
ON public.module_translations
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage module translations"
ON public.module_translations
FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_client_installations_updated_at
    BEFORE UPDATE ON public.client_installations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER update_remote_access_sessions_updated_at
    BEFORE UPDATE ON public.remote_access_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER update_module_translations_updated_at
    BEFORE UPDATE ON public.module_translations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_phase6_timestamp();

-- Function to generate temporary remote access PIN
CREATE OR REPLACE FUNCTION public.generate_remote_access_pin(p_installation_id UUID, p_valid_hours INTEGER DEFAULT 24)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_pin TEXT;
BEGIN
    v_pin := LPAD(floor(random() * 1000000)::TEXT, 6, '0');
    
    UPDATE public.client_installations
    SET 
        remote_access_pin = v_pin,
        remote_access_pin_expires_at = now() + (p_valid_hours || ' hours')::INTERVAL,
        updated_at = now()
    WHERE id = p_installation_id;
    
    RETURN v_pin;
END;
$$;

-- Function to validate remote access PIN
CREATE OR REPLACE FUNCTION public.validate_remote_access_pin(p_installation_id UUID, p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_valid BOOLEAN;
BEGIN
    SELECT 
        remote_access_pin = p_pin 
        AND remote_access_pin_expires_at > now()
        AND remote_access_allowed = true
    INTO v_valid
    FROM public.client_installations
    WHERE id = p_installation_id;
    
    RETURN COALESCE(v_valid, FALSE);
END;
$$;

-- Insert language-pack module into app_modules
INSERT INTO public.app_modules (
    module_key,
    module_name,
    description,
    category,
    is_core,
    is_required,
    base_price,
    features,
    module_icon,
    version
) VALUES (
    'language-pack',
    'Paquete de Idiomas',
    'Sistema completo de gestión de idiomas. Permite seleccionar el idioma preferido y descargar todos los módulos traducidos automáticamente. Incluye 65+ idiomas con traducciones verificadas por IA.',
    'core',
    true,
    false,
    0,
    '["Selector de idioma inteligente", "Traducciones automáticas con IA", "65+ idiomas soportados", "Preview en tiempo real", "Sincronización automática"]'::jsonb,
    'Languages',
    '1.0.0'
) ON CONFLICT (module_key) DO UPDATE SET
    module_name = EXCLUDED.module_name,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    updated_at = now();

-- Add comments for documentation
COMMENT ON TABLE public.client_installations IS 'Tracks all client installations with language preferences and remote access settings';
COMMENT ON TABLE public.remote_access_sessions IS 'Full audit trail of all remote support sessions for GDPR compliance';
COMMENT ON TABLE public.installation_downloads IS 'Complete tracking of all module downloads by installation';
COMMENT ON TABLE public.module_translations IS 'Contextual translations per module and locale';