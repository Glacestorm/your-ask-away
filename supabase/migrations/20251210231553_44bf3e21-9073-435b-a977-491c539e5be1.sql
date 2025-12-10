-- Tabla de canales de notificación (pub/sub topics)
CREATE TABLE IF NOT EXISTS public.notification_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_name TEXT NOT NULL UNIQUE,
    description TEXT,
    channel_type TEXT NOT NULL DEFAULT 'internal',
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Suscripciones de usuarios a canales
CREATE TABLE IF NOT EXISTS public.notification_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    channel_id UUID REFERENCES public.notification_channels(id) ON DELETE CASCADE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    delivery_methods TEXT[] DEFAULT ARRAY['in_app', 'browser'],
    filters JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, channel_id)
);

-- Webhooks para integraciones externas
CREATE TABLE IF NOT EXISTS public.notification_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    secret_key TEXT,
    is_active BOOLEAN DEFAULT true,
    channel_id UUID REFERENCES public.notification_channels(id) ON DELETE CASCADE,
    events TEXT[] DEFAULT ARRAY['*'],
    headers JSONB DEFAULT '{}',
    retry_config JSONB DEFAULT '{"max_retries": 3, "retry_delay_ms": 1000}',
    last_triggered_at TIMESTAMPTZ,
    failure_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Log de entregas de webhooks
CREATE TABLE IF NOT EXISTS public.webhook_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID REFERENCES public.notification_webhooks(id) ON DELETE CASCADE NOT NULL,
    notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    duration_ms INTEGER,
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Añadir referencia al canal en notificaciones
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES public.notification_channels(id);

-- Insertar canales predefinidos
INSERT INTO public.notification_channels (channel_name, description, channel_type) VALUES
('dora_nis2_compliance', 'Alertas de cumplimiento DORA/NIS2', 'internal'),
('fraud_detection', 'Alertas de detección de fraude AML', 'internal'),
('risk_profile_changes', 'Cambios en perfil de riesgo de clientes', 'internal'),
('goal_deadlines', 'Vencimientos de objetivos comerciales', 'internal'),
('visit_reminders', 'Recordatorios de visitas programadas', 'internal'),
('security_incidents', 'Incidentes de seguridad', 'internal'),
('system_health', 'Estado del sistema y diagnósticos', 'internal'),
('high_value_opportunities', 'Oportunidades de alto valor', 'internal')
ON CONFLICT (channel_name) DO NOTHING;