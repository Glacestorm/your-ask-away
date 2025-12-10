-- RLS Policies para nuevas tablas
ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para canales
CREATE POLICY "Authenticated users can view channels"
ON public.notification_channels FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage channels"
ON public.notification_channels FOR ALL
TO authenticated
USING (is_admin_or_superadmin(auth.uid()));

-- Políticas para suscripciones
CREATE POLICY "Users can view own subscriptions"
ON public.notification_subscriptions FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can manage own subscriptions"
ON public.notification_subscriptions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions"
ON public.notification_subscriptions FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own subscriptions"
ON public.notification_subscriptions FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Políticas para webhooks (solo admins)
CREATE POLICY "Admins can manage webhooks"
ON public.notification_webhooks FOR ALL
TO authenticated
USING (is_admin_or_superadmin(auth.uid()));

-- Políticas para logs de webhooks
CREATE POLICY "Admins can view webhook logs"
ON public.webhook_delivery_logs FOR SELECT
TO authenticated
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "System can insert webhook logs"
ON public.webhook_delivery_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Función para publicar notificación en canal
CREATE OR REPLACE FUNCTION public.publish_notification(
    p_channel_name TEXT,
    p_title TEXT,
    p_message TEXT,
    p_severity TEXT DEFAULT 'info',
    p_event_type TEXT DEFAULT 'general',
    p_metadata JSONB DEFAULT '{}',
    p_target_roles TEXT[] DEFAULT NULL,
    p_target_user_ids UUID[] DEFAULT NULL,
    p_action_url TEXT DEFAULT NULL,
    p_action_label TEXT DEFAULT NULL,
    p_priority INTEGER DEFAULT 0
) RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_channel_id UUID;
    v_subscriber RECORD;
    v_notification_id UUID;
BEGIN
    SELECT id INTO v_channel_id 
    FROM notification_channels 
    WHERE channel_name = p_channel_name AND is_active = true;
    
    IF v_channel_id IS NULL THEN
        RAISE EXCEPTION 'Canal de notificación no encontrado: %', p_channel_name;
    END IF;
    
    IF p_target_user_ids IS NOT NULL THEN
        FOR v_subscriber IN 
            SELECT DISTINCT u AS user_id FROM unnest(p_target_user_ids) AS u
        LOOP
            INSERT INTO notifications (
                user_id, title, message, severity, event_type,
                channel_id, metadata, action_url, action_label, priority
            ) VALUES (
                v_subscriber.user_id, p_title, p_message, p_severity, p_event_type,
                v_channel_id, p_metadata, p_action_url, p_action_label, p_priority
            ) RETURNING id INTO v_notification_id;
            RETURN NEXT v_notification_id;
        END LOOP;
    ELSIF p_target_roles IS NOT NULL THEN
        FOR v_subscriber IN 
            SELECT DISTINCT ur.user_id FROM user_roles ur WHERE ur.role::text = ANY(p_target_roles)
        LOOP
            INSERT INTO notifications (
                user_id, title, message, severity, event_type,
                channel_id, metadata, action_url, action_label, priority
            ) VALUES (
                v_subscriber.user_id, p_title, p_message, p_severity, p_event_type,
                v_channel_id, p_metadata, p_action_url, p_action_label, p_priority
            ) RETURNING id INTO v_notification_id;
            RETURN NEXT v_notification_id;
        END LOOP;
    ELSE
        FOR v_subscriber IN 
            SELECT ns.user_id FROM notification_subscriptions ns 
            WHERE ns.channel_id = v_channel_id AND ns.is_active = true
        LOOP
            INSERT INTO notifications (
                user_id, title, message, severity, event_type,
                channel_id, metadata, action_url, action_label, priority
            ) VALUES (
                v_subscriber.user_id, p_title, p_message, p_severity, p_event_type,
                v_channel_id, p_metadata, p_action_url, p_action_label, p_priority
            ) RETURNING id INTO v_notification_id;
            RETURN NEXT v_notification_id;
        END LOOP;
    END IF;
    RETURN;
END;
$$;

-- Función para suscribir usuario a canal
CREATE OR REPLACE FUNCTION public.subscribe_to_channel(
    p_user_id UUID,
    p_channel_name TEXT,
    p_delivery_methods TEXT[] DEFAULT ARRAY['in_app', 'browser']
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_channel_id UUID;
    v_subscription_id UUID;
BEGIN
    SELECT id INTO v_channel_id FROM notification_channels WHERE channel_name = p_channel_name AND is_active = true;
    IF v_channel_id IS NULL THEN RETURN NULL; END IF;
    
    INSERT INTO notification_subscriptions (user_id, channel_id, delivery_methods)
    VALUES (p_user_id, v_channel_id, p_delivery_methods)
    ON CONFLICT (user_id, channel_id) DO UPDATE SET is_active = true, delivery_methods = p_delivery_methods, updated_at = now()
    RETURNING id INTO v_subscription_id;
    
    RETURN v_subscription_id;
END;
$$;

-- Auto-suscribir usuarios según rol
CREATE OR REPLACE FUNCTION public.auto_subscribe_by_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NEW.role IN ('superadmin', 'admin', 'director_comercial') THEN
        PERFORM subscribe_to_channel(NEW.user_id, 'dora_nis2_compliance');
        PERFORM subscribe_to_channel(NEW.user_id, 'fraud_detection');
        PERFORM subscribe_to_channel(NEW.user_id, 'security_incidents');
        PERFORM subscribe_to_channel(NEW.user_id, 'system_health');
    END IF;
    IF NEW.role IN ('superadmin', 'admin', 'director_comercial', 'responsable_comercial', 'director_oficina') THEN
        PERFORM subscribe_to_channel(NEW.user_id, 'risk_profile_changes');
        PERFORM subscribe_to_channel(NEW.user_id, 'goal_deadlines');
        PERFORM subscribe_to_channel(NEW.user_id, 'high_value_opportunities');
    END IF;
    PERFORM subscribe_to_channel(NEW.user_id, 'visit_reminders');
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_subscribe_by_role ON public.user_roles;
CREATE TRIGGER trigger_auto_subscribe_by_role
    AFTER INSERT ON public.user_roles FOR EACH ROW EXECUTE FUNCTION auto_subscribe_by_role();

-- Índices
CREATE INDEX IF NOT EXISTS idx_notifications_event_type ON public.notifications(event_type);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON public.notifications(channel_id);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_channel ON public.notification_subscriptions(channel_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook ON public.webhook_delivery_logs(webhook_id);