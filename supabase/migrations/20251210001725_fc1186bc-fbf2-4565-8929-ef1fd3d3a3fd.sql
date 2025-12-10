-- ==============================================
-- FASE 1: Pipeline de Oportunidades + Campo VIP
-- ==============================================

-- 1. Añadir campo VIP a companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vip_notes TEXT;

-- 2. Crear tabla de Oportunidades/Pipeline
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  stage TEXT NOT NULL DEFAULT 'discovery' CHECK (stage IN ('discovery', 'proposal', 'negotiation', 'won', 'lost')),
  probability INTEGER DEFAULT 25 CHECK (probability >= 0 AND probability <= 100),
  estimated_value NUMERIC,
  estimated_close_date DATE,
  actual_close_date DATE,
  lost_reason TEXT,
  owner_id UUID REFERENCES auth.users(id),
  contact_id UUID REFERENCES public.company_contacts(id),
  products JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Índices para rendimiento
CREATE INDEX idx_opportunities_company ON public.opportunities(company_id);
CREATE INDEX idx_opportunities_stage ON public.opportunities(stage);
CREATE INDEX idx_opportunities_owner ON public.opportunities(owner_id);

-- 4. Trigger para updated_at
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Habilitar RLS
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para oportunidades
CREATE POLICY "Admins pueden gestionar todas las oportunidades"
  ON public.opportunities FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Usuarios autenticados pueden ver oportunidades"
  ON public.opportunities FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Gestores pueden crear oportunidades"
  ON public.opportunities FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Gestores pueden actualizar sus oportunidades"
  ON public.opportunities FOR UPDATE
  USING (owner_id = auth.uid() OR is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Gestores pueden eliminar sus oportunidades"
  ON public.opportunities FOR DELETE
  USING (owner_id = auth.uid() OR is_admin_or_superadmin(auth.uid()));

-- 7. Añadir campo para resumen IA en visit_sheets
ALTER TABLE public.visit_sheets 
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS ai_next_steps TEXT[],
ADD COLUMN IF NOT EXISTS ai_risks TEXT[],
ADD COLUMN IF NOT EXISTS ai_generated_at TIMESTAMPTZ;

-- 8. Habilitar realtime para oportunidades
ALTER PUBLICATION supabase_realtime ADD TABLE public.opportunities;