-- =====================================================
-- SISTEMA DE GESTIÓN DE MÓDULOS ENTERPRISE
-- Tablas para dependencias, historial y compatibilidad
-- =====================================================

-- Tabla de dependencias entre módulos
CREATE TABLE public.module_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key TEXT NOT NULL,
  depends_on TEXT NOT NULL,
  dependency_type TEXT NOT NULL DEFAULT 'required' CHECK (dependency_type IN ('required', 'optional', 'peer', 'dev')),
  min_version TEXT,
  max_version TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(module_key, depends_on)
);

-- Historial de cambios para rollback y auditoría
CREATE TABLE public.module_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'delete', 'feature_add', 'feature_remove', 'breaking', 'patch', 'minor', 'major')),
  previous_state JSONB,
  new_state JSONB,
  impact_analysis JSONB,
  affected_modules TEXT[],
  risk_level TEXT CHECK (risk_level IN ('safe', 'warning', 'breaking')),
  version_before TEXT,
  version_after TEXT,
  changelog TEXT,
  rollback_available BOOLEAN DEFAULT true,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Matriz de compatibilidad entre módulos
CREATE TABLE public.module_compatibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_a TEXT NOT NULL,
  module_b TEXT NOT NULL,
  compatibility_status TEXT NOT NULL DEFAULT 'unknown' CHECK (compatibility_status IN ('compatible', 'partial', 'incompatible', 'unknown', 'testing')),
  compatibility_score INTEGER CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  notes TEXT,
  known_issues JSONB,
  workarounds JSONB,
  tested_by UUID REFERENCES auth.users(id),
  tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(module_a, module_b)
);

-- Sandbox de pruebas para módulos
CREATE TABLE public.module_sandbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key TEXT NOT NULL,
  sandbox_name TEXT NOT NULL,
  original_state JSONB NOT NULL,
  modified_state JSONB NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'testing', 'validated', 'failed', 'deployed', 'discarded')),
  test_results JSONB,
  validation_errors JSONB,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Versiones de módulos para versionado semántico
CREATE TABLE public.module_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key TEXT NOT NULL,
  version TEXT NOT NULL,
  version_major INTEGER NOT NULL,
  version_minor INTEGER NOT NULL,
  version_patch INTEGER NOT NULL,
  release_notes TEXT,
  breaking_changes TEXT[],
  new_features TEXT[],
  bug_fixes TEXT[],
  state_snapshot JSONB,
  is_stable BOOLEAN DEFAULT true,
  is_latest BOOLEAN DEFAULT false,
  published_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(module_key, version)
);

-- Índices para rendimiento
CREATE INDEX idx_module_dependencies_module ON public.module_dependencies(module_key);
CREATE INDEX idx_module_dependencies_depends_on ON public.module_dependencies(depends_on);
CREATE INDEX idx_module_change_history_module ON public.module_change_history(module_key);
CREATE INDEX idx_module_change_history_date ON public.module_change_history(created_at DESC);
CREATE INDEX idx_module_compatibility_modules ON public.module_compatibility(module_a, module_b);
CREATE INDEX idx_module_sandbox_module ON public.module_sandbox(module_key);
CREATE INDEX idx_module_sandbox_status ON public.module_sandbox(status);
CREATE INDEX idx_module_versions_module ON public.module_versions(module_key);
CREATE INDEX idx_module_versions_latest ON public.module_versions(module_key, is_latest) WHERE is_latest = true;

-- Trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION update_module_tables_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_module_dependencies_timestamp
  BEFORE UPDATE ON public.module_dependencies
  FOR EACH ROW EXECUTE FUNCTION update_module_tables_timestamp();

CREATE TRIGGER update_module_compatibility_timestamp
  BEFORE UPDATE ON public.module_compatibility
  FOR EACH ROW EXECUTE FUNCTION update_module_tables_timestamp();

CREATE TRIGGER update_module_sandbox_timestamp
  BEFORE UPDATE ON public.module_sandbox
  FOR EACH ROW EXECUTE FUNCTION update_module_tables_timestamp();

-- RLS Policies
ALTER TABLE public.module_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_sandbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_versions ENABLE ROW LEVEL SECURITY;

-- Policies para admins (lectura y escritura completa)
CREATE POLICY "Admins can manage module_dependencies"
  ON public.module_dependencies FOR ALL
  USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can manage module_change_history"
  ON public.module_change_history FOR ALL
  USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can manage module_compatibility"
  ON public.module_compatibility FOR ALL
  USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can manage module_sandbox"
  ON public.module_sandbox FOR ALL
  USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can manage module_versions"
  ON public.module_versions FOR ALL
  USING (public.is_admin_or_superadmin(auth.uid()));

-- Policies de lectura para usuarios autenticados
CREATE POLICY "Authenticated users can view module_dependencies"
  ON public.module_dependencies FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view module_compatibility"
  ON public.module_compatibility FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view module_versions"
  ON public.module_versions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Insertar dependencias iniciales del Core
INSERT INTO public.module_dependencies (module_key, depends_on, dependency_type, description) VALUES
  ('empresas', 'core', 'required', 'Módulo empresas requiere Core'),
  ('visitas', 'core', 'required', 'Módulo visitas requiere Core'),
  ('visitas', 'empresas', 'required', 'Visitas requiere empresas'),
  ('mapas_pro', 'empresas', 'required', 'Mapas PRO requiere empresas'),
  ('analytics', 'core', 'required', 'Analytics requiere Core'),
  ('alertas', 'analytics', 'optional', 'Alertas puede usar Analytics'),
  ('gamification', 'core', 'required', 'Gamificación requiere Core'),
  ('academia', 'core', 'required', 'Academia requiere Core'),
  ('ai_copilot', 'core', 'required', 'AI Copilot requiere Core'),
  ('ai_nba', 'analytics', 'required', 'AI NBA requiere Analytics'),
  ('bpmn_designer', 'core', 'required', 'BPMN Designer requiere Core'),
  ('process_mining', 'analytics', 'required', 'Process Mining requiere Analytics')
ON CONFLICT (module_key, depends_on) DO NOTHING;

-- Insertar compatibilidades conocidas
INSERT INTO public.module_compatibility (module_a, module_b, compatibility_status, compatibility_score, notes) VALUES
  ('empresas', 'visitas', 'compatible', 100, 'Integración completa'),
  ('mapas_pro', 'empresas', 'compatible', 100, 'Visualización geográfica de empresas'),
  ('analytics', 'alertas', 'compatible', 95, 'Alertas basadas en métricas de Analytics'),
  ('ai_copilot', 'ai_nba', 'compatible', 90, 'Ambos usan el mismo motor de IA'),
  ('academia', 'gamification', 'compatible', 85, 'Sistema de puntos compartido')
ON CONFLICT (module_a, module_b) DO NOTHING;