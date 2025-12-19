-- =====================================================
-- FASE 0: Tabla business_telemetry para métricas de negocio
-- =====================================================

-- Crear tabla business_telemetry
CREATE TABLE public.business_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type TEXT NOT NULL,
    value DECIMAL(20, 4) NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    segment TEXT,
    channel TEXT,
    metadata JSONB DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_business_telemetry_metric_type ON public.business_telemetry(metric_type);
CREATE INDEX idx_business_telemetry_period ON public.business_telemetry(period_start, period_end);
CREATE INDEX idx_business_telemetry_segment ON public.business_telemetry(segment) WHERE segment IS NOT NULL;
CREATE INDEX idx_business_telemetry_channel ON public.business_telemetry(channel) WHERE channel IS NOT NULL;
CREATE INDEX idx_business_telemetry_user ON public.business_telemetry(user_id) WHERE user_id IS NOT NULL;

-- Habilitar RLS
ALTER TABLE public.business_telemetry ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - Solo admins pueden gestionar telemetría
CREATE POLICY "Admins can view telemetry"
ON public.business_telemetry
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert telemetry"
ON public.business_telemetry
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update telemetry"
ON public.business_telemetry
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete telemetry"
ON public.business_telemetry
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_business_telemetry_updated_at
    BEFORE UPDATE ON public.business_telemetry
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_telemetry;

-- Comentarios
COMMENT ON TABLE public.business_telemetry IS 'Métricas de telemetría de negocio para análisis y reportes';
COMMENT ON COLUMN public.business_telemetry.metric_type IS 'Tipo de métrica: revenue, conversion_rate, churn_rate, etc.';
COMMENT ON COLUMN public.business_telemetry.segment IS 'Segmento de cliente o producto';
COMMENT ON COLUMN public.business_telemetry.channel IS 'Canal de origen: web, mobile, api, etc.';