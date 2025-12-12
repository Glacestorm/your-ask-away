-- ==================== FASE 5: ANALYTICS AVANZADO (Parte 1) ====================

-- 5.1 Dynamic KPIs table for automatic feature engineering
CREATE TABLE public.dynamic_kpis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('company', 'gestor', 'office', 'bank')),
    entity_id UUID NOT NULL,
    kpi_category TEXT NOT NULL CHECK (kpi_category IN (
        'commercial', 'financial', 'operational', 'customer', 'risk', 'growth', 'efficiency', 'engagement'
    )),
    kpi_name TEXT NOT NULL,
    kpi_code TEXT NOT NULL,
    current_value NUMERIC,
    previous_value NUMERIC,
    change_percentage NUMERIC,
    trend TEXT CHECK (trend IN ('up', 'down', 'stable', 'volatile')),
    trend_strength NUMERIC CHECK (trend_strength >= 0 AND trend_strength <= 1),
    benchmark_value NUMERIC,
    benchmark_percentile INTEGER CHECK (benchmark_percentile >= 0 AND benchmark_percentile <= 100),
    sector_average NUMERIC,
    alert_threshold_low NUMERIC,
    alert_threshold_high NUMERIC,
    alert_status TEXT CHECK (alert_status IN ('normal', 'warning', 'critical', 'opportunity')),
    calculation_formula JSONB,
    data_sources TEXT[],
    confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_dynamic_kpis_entity ON public.dynamic_kpis(entity_type, entity_id);
CREATE INDEX idx_dynamic_kpis_category ON public.dynamic_kpis(kpi_category);
CREATE INDEX idx_dynamic_kpis_code ON public.dynamic_kpis(kpi_code);
CREATE INDEX idx_dynamic_kpis_period ON public.dynamic_kpis(period_start, period_end);
CREATE INDEX idx_dynamic_kpis_alert ON public.dynamic_kpis(alert_status);

-- Enable RLS
ALTER TABLE public.dynamic_kpis ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage dynamic_kpis"
ON public.dynamic_kpis FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Directors can view all dynamic_kpis"
ON public.dynamic_kpis FOR SELECT
USING (
    has_role(auth.uid(), 'director_comercial') OR
    has_role(auth.uid(), 'responsable_comercial') OR
    has_role(auth.uid(), 'director_oficina')
);

CREATE POLICY "Gestors can view their own kpis"
ON public.dynamic_kpis FOR SELECT
USING (
    entity_type = 'gestor' AND entity_id = auth.uid()
);

-- Trigger for updated_at
CREATE TRIGGER update_dynamic_kpis_updated_at
    BEFORE UPDATE ON public.dynamic_kpis
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();