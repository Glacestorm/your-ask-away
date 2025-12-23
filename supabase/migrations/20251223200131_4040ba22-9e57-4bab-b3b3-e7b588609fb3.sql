-- =====================================================
-- FASE 1: Auditoría Granular de Sesiones
-- =====================================================

-- Tabla para registro detallado de acciones durante sesiones remotas
CREATE TABLE public.session_action_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.remote_access_sessions(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'config_change', 'module_update', 'data_access', 'data_modification',
        'system_repair', 'diagnostic_run', 'file_transfer', 'permission_change',
        'session_start', 'session_end', 'screenshot_capture', 'command_execution',
        'error_occurred', 'warning_raised', 'user_interaction', 'system_check'
    )),
    action_description TEXT NOT NULL,
    component_affected TEXT,
    before_state JSONB,
    after_state JSONB,
    duration_ms INTEGER,
    screenshot_url TEXT,
    risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para búsquedas eficientes
CREATE INDEX idx_session_action_logs_session ON public.session_action_logs(session_id);
CREATE INDEX idx_session_action_logs_type ON public.session_action_logs(action_type);
CREATE INDEX idx_session_action_logs_risk ON public.session_action_logs(risk_level);
CREATE INDEX idx_session_action_logs_created ON public.session_action_logs(created_at DESC);

-- RLS para session_action_logs
ALTER TABLE public.session_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage session action logs"
ON public.session_action_logs FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'superadmin')
    )
);

CREATE POLICY "Installation owners can view their session logs"
ON public.session_action_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.remote_access_sessions ras
        JOIN public.client_installations ci ON ras.installation_id = ci.id
        JOIN public.companies c ON ci.company_id = c.id
        WHERE ras.id = session_action_logs.session_id
        AND c.gestor_id = auth.uid()
    )
);

-- =====================================================
-- FASE 2: Sistema de Presupuestos de Servicio
-- =====================================================

-- Secuencia para números de presupuesto
CREATE SEQUENCE IF NOT EXISTS quote_number_seq START 1;

-- Tabla para presupuestos de servicio previos
CREATE TABLE public.service_quotes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_number TEXT NOT NULL UNIQUE,
    installation_id UUID NOT NULL REFERENCES public.client_installations(id) ON DELETE CASCADE,
    
    -- Detalles del servicio
    service_type TEXT NOT NULL CHECK (service_type IN (
        'remote_support', 'installation', 'configuration', 'training',
        'maintenance', 'upgrade', 'migration', 'custom'
    )),
    service_title TEXT NOT NULL,
    service_description TEXT,
    
    -- Estimaciones
    estimated_duration_minutes INTEGER NOT NULL,
    estimated_actions JSONB DEFAULT '[]',
    
    -- Precios
    hourly_rate DECIMAL(10,2),
    fixed_price DECIMAL(10,2),
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 21.00,
    tax_amount DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    
    -- Términos
    terms_and_conditions TEXT,
    valid_until TIMESTAMPTZ NOT NULL,
    payment_terms TEXT,
    
    -- Estado y aprobación
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'cancelled'
    )),
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    client_decision_at TIMESTAMPTZ,
    client_notes TEXT,
    
    -- Firma del cliente
    client_signature_data TEXT,
    client_signature_ip INET,
    client_signature_user_agent TEXT,
    client_accepted_terms BOOLEAN DEFAULT false,
    
    -- Metadatos
    created_by UUID NOT NULL REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para service_quotes
CREATE INDEX idx_service_quotes_installation ON public.service_quotes(installation_id);
CREATE INDEX idx_service_quotes_status ON public.service_quotes(status);
CREATE INDEX idx_service_quotes_valid_until ON public.service_quotes(valid_until);
CREATE INDEX idx_service_quotes_created ON public.service_quotes(created_at DESC);

-- Función para generar número de presupuesto
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.quote_number := 'QT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                        LPAD(NEXTVAL('quote_number_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para generar número automáticamente
CREATE TRIGGER set_quote_number
    BEFORE INSERT ON public.service_quotes
    FOR EACH ROW
    EXECUTE FUNCTION generate_quote_number();

-- Trigger para actualizar updated_at
CREATE TRIGGER update_service_quotes_timestamp
    BEFORE UPDATE ON public.service_quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_phase6_timestamp();

-- RLS para service_quotes
ALTER TABLE public.service_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all quotes"
ON public.service_quotes FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'superadmin')
    )
);

CREATE POLICY "Users can view quotes they created"
ON public.service_quotes FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "Installation owners can view their quotes"
ON public.service_quotes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.client_installations ci
        JOIN public.companies c ON ci.company_id = c.id
        WHERE ci.id = service_quotes.installation_id
        AND c.gestor_id = auth.uid()
    )
);

-- =====================================================
-- Tabla de líneas de presupuesto (para desglose detallado)
-- =====================================================

CREATE TABLE public.service_quote_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID NOT NULL REFERENCES public.service_quotes(id) ON DELETE CASCADE,
    item_order INTEGER NOT NULL DEFAULT 0,
    item_type TEXT NOT NULL CHECK (item_type IN ('service', 'product', 'license', 'discount', 'other')),
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_quote_items_quote ON public.service_quote_items(quote_id);

ALTER TABLE public.service_quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quote items follow quote permissions"
ON public.service_quote_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.service_quotes sq
        WHERE sq.id = service_quote_items.quote_id
        AND (
            sq.created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role IN ('admin', 'superadmin')
            )
        )
    )
);

-- =====================================================
-- Historial de cambios de estado de presupuestos
-- =====================================================

CREATE TABLE public.service_quote_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID NOT NULL REFERENCES public.service_quotes(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    change_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_quote_history_quote ON public.service_quote_history(quote_id);

ALTER TABLE public.service_quote_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quote history follows quote permissions"
ON public.service_quote_history FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.service_quotes sq
        WHERE sq.id = service_quote_history.quote_id
        AND (
            sq.created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role IN ('admin', 'superadmin')
            )
        )
    )
);

-- Trigger para registrar cambios de estado
CREATE OR REPLACE FUNCTION log_quote_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.service_quote_history (quote_id, previous_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER track_quote_status_changes
    AFTER UPDATE ON public.service_quotes
    FOR EACH ROW
    EXECUTE FUNCTION log_quote_status_change();

-- =====================================================
-- Función para calcular totales de presupuesto
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_quote_totals(p_quote_id UUID)
RETURNS TABLE(subtotal DECIMAL, tax_amount DECIMAL, total DECIMAL) AS $$
DECLARE
    v_subtotal DECIMAL(10,2);
    v_tax_rate DECIMAL(5,2);
    v_tax_amount DECIMAL(10,2);
    v_total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(sqi.total_price), 0)
    INTO v_subtotal
    FROM public.service_quote_items sqi
    WHERE sqi.quote_id = p_quote_id;
    
    SELECT COALESCE(sq.tax_rate, 21.00)
    INTO v_tax_rate
    FROM public.service_quotes sq
    WHERE sq.id = p_quote_id;
    
    v_tax_amount := ROUND(v_subtotal * (v_tax_rate / 100), 2);
    v_total := v_subtotal + v_tax_amount;
    
    RETURN QUERY SELECT v_subtotal, v_tax_amount, v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- Función RPC para aceptar presupuesto (uso desde cliente)
-- =====================================================

CREATE OR REPLACE FUNCTION accept_service_quote(
    p_quote_id UUID,
    p_signature_data TEXT,
    p_client_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_quote RECORD;
BEGIN
    SELECT * INTO v_quote
    FROM public.service_quotes
    WHERE id = p_quote_id
    AND status IN ('sent', 'viewed')
    AND valid_until > NOW();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Presupuesto no encontrado, expirado o en estado inválido'
        );
    END IF;
    
    UPDATE public.service_quotes
    SET 
        status = 'accepted',
        client_decision_at = NOW(),
        client_signature_data = p_signature_data,
        client_signature_ip = inet_client_addr(),
        client_accepted_terms = true,
        client_notes = p_client_notes,
        updated_at = NOW()
    WHERE id = p_quote_id;
    
    PERFORM log_audit_event(
        'quote_accepted',
        'service_quotes',
        p_quote_id,
        NULL,
        jsonb_build_object('accepted_at', NOW()),
        inet_client_addr(),
        NULL,
        'compliance',
        'info'
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'quote_id', p_quote_id,
        'accepted_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Habilitar realtime para las nuevas tablas
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_action_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_quotes;