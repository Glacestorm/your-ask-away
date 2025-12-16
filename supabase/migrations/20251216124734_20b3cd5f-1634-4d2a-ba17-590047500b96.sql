
-- =====================================================
-- FASE 1: INFRAESTRUCTURA APP STORE MODULAR
-- =====================================================

-- 1. CREAR ENUMs
-- =====================================================

-- Categorías de módulos
CREATE TYPE public.module_category AS ENUM (
  'core', 'horizontal', 'vertical', 'addon'
);

-- Tipos de licencia
CREATE TYPE public.license_type AS ENUM (
  'perpetual', 'subscription', 'trial', 'free'
);

-- Sectores verticales
CREATE TYPE public.sector_type AS ENUM (
  'banking', 'health', 'industry', 'retail', 'realestate', 
  'technology', 'education', 'hospitality', 'logistics', 
  'energy', 'agriculture', 'professional', 'government'
);

-- Nivel de impacto de normativas
CREATE TYPE public.impact_level AS ENUM (
  'critical', 'high', 'medium', 'low', 'informative'
);

-- Estado de normativas
CREATE TYPE public.regulation_status AS ENUM (
  'active', 'pending', 'superseded', 'expired', 'draft'
);

-- 2. TABLA app_modules - Catálogo de Módulos
-- =====================================================

CREATE TABLE public.app_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text UNIQUE NOT NULL,
  module_name text NOT NULL,
  module_icon text DEFAULT 'Package',
  category public.module_category NOT NULL DEFAULT 'horizontal',
  sector public.sector_type,
  description text,
  features jsonb DEFAULT '[]'::jsonb,
  screenshots jsonb DEFAULT '[]'::jsonb,
  base_price numeric DEFAULT 0,
  is_core boolean DEFAULT false,
  is_required boolean DEFAULT false,
  dependencies text[] DEFAULT '{}',
  version text DEFAULT '1.0.0',
  changelog jsonb DEFAULT '[]'::jsonb,
  min_core_version text DEFAULT '1.0.0',
  documentation_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view app modules"
  ON public.app_modules FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage app modules"
  ON public.app_modules FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

-- 3. TABLA installed_modules - Módulos Instalados
-- =====================================================

CREATE TABLE public.installed_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  module_id uuid REFERENCES public.app_modules(id) ON DELETE CASCADE NOT NULL,
  installed_at timestamptz DEFAULT now(),
  installed_by uuid,
  license_type public.license_type NOT NULL DEFAULT 'trial',
  license_key text,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  last_used_at timestamptz,
  usage_stats jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, module_id)
);

ALTER TABLE public.installed_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view installed modules"
  ON public.installed_modules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage installed modules"
  ON public.installed_modules FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

-- 4. TABLA sector_regulations - Normativas por Sector
-- =====================================================

CREATE TABLE public.sector_regulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_key text NOT NULL,
  regulation_code text NOT NULL,
  regulation_name text NOT NULL,
  authority text NOT NULL,
  publication_date date,
  effective_date date,
  expiration_date date,
  summary text,
  full_text_url text,
  impact_level public.impact_level DEFAULT 'medium',
  status public.regulation_status DEFAULT 'active',
  requirements jsonb DEFAULT '[]'::jsonb,
  tags text[] DEFAULT '{}',
  iso_codes text[] DEFAULT '{}',
  is_mandatory boolean DEFAULT true,
  superseded_by uuid REFERENCES public.sector_regulations(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sector_key, regulation_code)
);

ALTER TABLE public.sector_regulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sector regulations"
  ON public.sector_regulations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage sector regulations"
  ON public.sector_regulations FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

CREATE INDEX idx_sector_regulations_sector ON public.sector_regulations(sector_key);
CREATE INDEX idx_sector_regulations_status ON public.sector_regulations(status);

-- 5. TABLA regulation_updates - Actualizaciones de Normativas
-- =====================================================

CREATE TABLE public.regulation_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_key text NOT NULL,
  source text NOT NULL,
  source_url text,
  title text NOT NULL,
  summary text,
  publication_date date,
  ai_analysis text,
  relevance_score numeric DEFAULT 0 CHECK (relevance_score >= 0 AND relevance_score <= 100),
  action_required boolean DEFAULT false,
  priority public.impact_level DEFAULT 'medium',
  affected_regulations uuid[] DEFAULT '{}',
  keywords text[] DEFAULT '{}',
  processed boolean DEFAULT false,
  notified_at timestamptz,
  notified_users uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.regulation_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view regulation updates"
  ON public.regulation_updates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage regulation updates"
  ON public.regulation_updates FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

CREATE INDEX idx_regulation_updates_sector ON public.regulation_updates(sector_key);
CREATE INDEX idx_regulation_updates_date ON public.regulation_updates(publication_date DESC);

-- 6. TABLA module_components - Mapeo Módulo → Componentes
-- =====================================================

CREATE TABLE public.module_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text NOT NULL,
  component_path text NOT NULL,
  component_name text NOT NULL,
  component_type text DEFAULT 'page',
  admin_section_key text,
  menu_order integer DEFAULT 0,
  menu_icon text,
  menu_label text,
  permissions_required text[] DEFAULT '{}',
  is_visible boolean DEFAULT true,
  route_path text,
  props_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(module_key, component_path)
);

ALTER TABLE public.module_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view module components"
  ON public.module_components FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage module components"
  ON public.module_components FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

CREATE INDEX idx_module_components_key ON public.module_components(module_key);
CREATE INDEX idx_module_components_section ON public.module_components(admin_section_key);

-- 7. FUNCIONES DE UTILIDAD
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_module_installed(
  _module_key text,
  _organization_id uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.installed_modules im
    JOIN public.app_modules am ON im.module_id = am.id
    WHERE am.module_key = _module_key
      AND im.is_active = true
      AND (im.valid_until IS NULL OR im.valid_until > now())
      AND im.organization_id = _organization_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_installed_modules(
  _organization_id uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid
)
RETURNS TABLE (
  module_key text,
  module_name text,
  category public.module_category,
  sector public.sector_type,
  license_type public.license_type,
  valid_until timestamptz,
  settings jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    am.module_key,
    am.module_name,
    am.category,
    am.sector,
    im.license_type,
    im.valid_until,
    im.settings
  FROM public.installed_modules im
  JOIN public.app_modules am ON im.module_id = am.id
  WHERE im.is_active = true
    AND (im.valid_until IS NULL OR im.valid_until > now())
    AND im.organization_id = _organization_id
  ORDER BY am.is_core DESC, am.category, am.module_name
$$;

CREATE OR REPLACE FUNCTION public.get_sector_regulations(
  _sector_key text
)
RETURNS TABLE (
  id uuid,
  regulation_code text,
  regulation_name text,
  authority text,
  impact_level public.impact_level,
  summary text,
  requirements jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    regulation_code,
    regulation_name,
    authority,
    impact_level,
    summary,
    requirements
  FROM public.sector_regulations
  WHERE sector_key = _sector_key
    AND status = 'active'
  ORDER BY impact_level, regulation_code
$$;

-- 8. TRIGGERS PARA updated_at
-- =====================================================

CREATE TRIGGER update_app_modules_updated_at
  BEFORE UPDATE ON public.app_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_installed_modules_updated_at
  BEFORE UPDATE ON public.installed_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sector_regulations_updated_at
  BEFORE UPDATE ON public.sector_regulations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_regulation_updates_updated_at
  BEFORE UPDATE ON public.regulation_updates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_module_components_updated_at
  BEFORE UPDATE ON public.module_components
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. SEED DATA - MÓDULOS DEL APP STORE
-- =====================================================

-- MÓDULO CORE (Obligatorio)
INSERT INTO public.app_modules (module_key, module_name, module_icon, category, description, features, base_price, is_core, is_required, version) VALUES
('core', 'Core CRM', 'Building2', 'core', 'Módulo base del CRM con gestión de empresas, contactos y usuarios. Obligatorio para el funcionamiento del sistema.', 
'["Gestión de empresas", "Gestión de contactos", "Gestión de usuarios", "Dashboard básico", "Importación Excel", "Calendario", "Alertas básicas", "Sistema de roles"]'::jsonb,
80000, true, true, '8.0.0');

-- MÓDULOS HORIZONTALES
INSERT INTO public.app_modules (module_key, module_name, module_icon, category, description, features, base_price, dependencies, version) VALUES
('accounting-base', 'Contabilidad Base', 'Calculator', 'horizontal', 'Módulo de contabilidad con balances, P&L y análisis financiero básico.',
'["Balance de situación", "Cuenta de resultados", "Estado de flujos de efectivo", "Ratios financieros básicos", "Importación de estados financieros"]'::jsonb,
60000, '{"core"}', '1.0.0'),

('maps', 'Geolocalización', 'Map', 'horizontal', 'Visualización geográfica de empresas con mapas interactivos.',
'["Mapa interactivo", "Clustering de empresas", "Filtros geográficos", "Coloreado por estado/vinculación", "Geocodificación automática"]'::jsonb,
50000, '{"core"}', '1.0.0'),

('maps-pro', 'Mapas PRO', 'MapPin', 'horizontal', 'Funcionalidades avanzadas de mapas: rutas, isocronas, 3D.',
'["Planificación de rutas", "Análisis de isocronas", "Visualización 3D", "Exportación estática", "Heatmaps", "Matriz de distancias"]'::jsonb,
30000, '{"core", "maps"}', '1.0.0'),

('communications', 'Comunicaciones', 'MessageSquare', 'horizontal', 'Sistema de notificaciones, email, SMS y chat interno.',
'["Notificaciones push", "Plantillas de email", "SMS integrado", "Chat interno", "Centro de notificaciones"]'::jsonb,
40000, '{"core"}', '1.0.0'),

('documentation', 'Documentación', 'FileText', 'horizontal', 'Gestión documental con almacenamiento y versionado.',
'["Almacenamiento de documentos", "Galería de fotos", "Exportación PDF", "Generación de informes", "Plantillas de visita"]'::jsonb,
25000, '{"core"}', '1.0.0'),

('collaboration', 'Colaboración', 'Users', 'horizontal', 'Herramientas de trabajo en equipo y presencia online.',
'["Presencia en tiempo real", "Asignación de tareas", "Comentarios colaborativos", "Historial de cambios", "Menciones"]'::jsonb,
35000, '{"core"}', '1.0.0'),

('white-label', 'White-Label', 'Palette', 'horizontal', 'Personalización de marca para revendedores.',
'["Logo personalizado", "Colores corporativos", "Dominio personalizado", "Eliminación de marca ObelixIA"]'::jsonb,
20000, '{"core"}', '1.0.0'),

('ai-assistant', 'Asistente IA', 'Bot', 'horizontal', 'Asistente inteligente con chat por voz y base de conocimiento.',
'["Chat con IA", "Entrada por voz", "Respuestas por voz", "Base de conocimiento", "Contexto de conversación"]'::jsonb,
60000, '{"core"}', '1.0.0'),

('visits', 'Gestión de Visitas', 'CalendarCheck', 'horizontal', 'Sistema completo de gestión y seguimiento de visitas comerciales.',
'["Fichas de visita", "Calendario de visitas", "Recordatorios", "Histórico de visitas", "Análisis de resultados"]'::jsonb,
45000, '{"core"}', '1.0.0'),

('goals', 'Objetivos y Métricas', 'Target', 'horizontal', 'Sistema de objetivos, KPIs y gamificación.',
'["Definición de objetivos", "Seguimiento de KPIs", "Gamificación", "Logros", "Leaderboards"]'::jsonb,
40000, '{"core"}', '1.0.0');

-- MÓDULOS VERTICALES BANCA
INSERT INTO public.app_modules (module_key, module_name, module_icon, category, sector, description, features, base_price, dependencies, version) VALUES
('accounting-banking', 'Contabilidad Bancaria', 'Landmark', 'vertical', 'banking', 'Contabilidad especializada para entidades financieras con IFRS 9 y ratios bancarios.',
'["IFRS 9 completo", "Ratios bancarios (LCR, NSFR, CET1)", "Z-Score adaptado banca", "Rating bancario", "Provisiones ECL"]'::jsonb,
120000, '{"core", "accounting-base"}', '1.0.0'),

('compliance-banking', 'Compliance Bancario', 'Shield', 'vertical', 'banking', 'Cumplimiento normativo DORA, MiFID II, PSD2/PSD3.',
'["Dashboard DORA", "Cumplimiento MiFID II", "Gestión PSD2/PSD3", "Resiliencia digital", "Gestión de incidentes", "Tests de estrés"]'::jsonb,
150000, '{"core"}', '1.0.0'),

('open-banking', 'Open Banking', 'Globe', 'vertical', 'banking', 'APIs PSD2 y Open Banking con gestión de TPPs.',
'["APIs PSD2 AISP/PISP", "Gestión de consentimientos", "Registro de TPPs", "Rate limiting", "Audit trail"]'::jsonb,
100000, '{"core", "compliance-banking"}', '1.0.0'),

('ai-banking', 'IA Bancaria', 'Brain', 'vertical', 'banking', 'Modelos de ML para scoring, churn y predicciones financieras.',
'["Scoring crediticio", "Predicción de churn", "Detección de fraude AML", "Recomendaciones de productos", "Análisis predictivo"]'::jsonb,
180000, '{"core", "ai-assistant"}', '1.0.0'),

('analytics-banking', 'Analytics Bancario', 'BarChart3', 'vertical', 'banking', 'Business Intelligence y dashboards para banca.',
'["Dashboard Director Comercial", "Métricas por oficina", "Pipeline de oportunidades", "Análisis de cartera", "Reporting avanzado"]'::jsonb,
100000, '{"core"}', '1.0.0');

-- MÓDULOS VERTICALES SALUD
INSERT INTO public.app_modules (module_key, module_name, module_icon, category, sector, description, features, base_price, dependencies, version) VALUES
('accounting-health', 'Contabilidad Sanidad', 'Stethoscope', 'vertical', 'health', 'Contabilidad adaptada al sector sanitario.',
'["Plan contable sanitario", "Ratios sector salud", "Análisis de costes por servicio"]'::jsonb,
90000, '{"core", "accounting-base"}', '1.0.0'),

('compliance-health', 'Compliance Sanitario', 'ShieldCheck', 'vertical', 'health', 'Cumplimiento HIPAA, RGPD Sanitario, ISO 27799.',
'["Cumplimiento HIPAA", "RGPD Sanitario", "ISO 27799", "Gestión de consentimientos", "Trazabilidad de datos"]'::jsonb,
120000, '{"core"}', '1.0.0'),

('patient-management', 'Gestión de Pacientes', 'UserPlus', 'vertical', 'health', 'CRM adaptado para gestión de pacientes.',
'["Fichas de paciente", "Historial clínico", "Citas médicas", "Seguimiento tratamientos"]'::jsonb,
80000, '{"core"}', '1.0.0'),

('ai-health', 'IA Sanitaria', 'Activity', 'vertical', 'health', 'Modelos de ML para diagnóstico asistido.',
'["Análisis de síntomas", "Predicción de riesgo", "Optimización de recursos", "Alertas clínicas"]'::jsonb,
150000, '{"core", "ai-assistant"}', '1.0.0');

-- MÓDULOS VERTICALES INDUSTRIA
INSERT INTO public.app_modules (module_key, module_name, module_icon, category, sector, description, features, base_price, dependencies, version) VALUES
('accounting-industry', 'Contabilidad Industrial', 'Factory', 'vertical', 'industry', 'Contabilidad de costes y producción.',
'["Contabilidad de costes", "Control de inventario", "Análisis de producción", "Ratios industriales"]'::jsonb,
80000, '{"core", "accounting-base"}', '1.0.0'),

('compliance-industry', 'Compliance Industrial', 'HardHat', 'vertical', 'industry', 'ISO 9001, 14001, 45001.',
'["ISO 9001 Calidad", "ISO 14001 Medio Ambiente", "ISO 45001 Seguridad Laboral", "Auditorías integradas"]'::jsonb,
90000, '{"core"}', '1.0.0'),

('production-management', 'Gestión de Producción', 'Cog', 'vertical', 'industry', 'Control y optimización de producción.',
'["Planificación de producción", "Control de calidad", "Gestión de lotes", "Trazabilidad"]'::jsonb,
100000, '{"core"}', '1.0.0'),

('ai-industry', 'IA Industrial', 'Cpu', 'vertical', 'industry', 'Mantenimiento predictivo y optimización.',
'["Mantenimiento predictivo", "Optimización de procesos", "Control de calidad ML", "Predicción de demanda"]'::jsonb,
130000, '{"core", "ai-assistant"}', '1.0.0');

-- MÓDULOS VERTICALES RETAIL
INSERT INTO public.app_modules (module_key, module_name, module_icon, category, sector, description, features, base_price, dependencies, version) VALUES
('accounting-retail', 'Contabilidad Retail', 'ShoppingCart', 'vertical', 'retail', 'Contabilidad para comercio minorista.',
'["Gestión de márgenes", "Análisis por producto", "Control de inventario", "Ratios retail"]'::jsonb,
70000, '{"core", "accounting-base"}', '1.0.0'),

('compliance-retail', 'Compliance Retail', 'Store', 'vertical', 'retail', 'PCI-DSS, normativa comercial.',
'["PCI-DSS", "Ley de Comercio", "Protección consumidor", "Etiquetado"]'::jsonb,
60000, '{"core"}', '1.0.0'),

('store-management', 'Gestión de Tiendas', 'Building', 'vertical', 'retail', 'Control multi-tienda.',
'["Gestión multi-tienda", "TPV integrado", "Control de stock", "Análisis de ventas"]'::jsonb,
80000, '{"core"}', '1.0.0'),

('ai-retail', 'IA Retail', 'Sparkles', 'vertical', 'retail', 'Recomendaciones y predicción de demanda.',
'["Recomendaciones de productos", "Predicción de demanda", "Optimización de precios", "Análisis de cesta"]'::jsonb,
100000, '{"core", "ai-assistant"}', '1.0.0');

-- MÓDULOS VERTICALES INMOBILIARIO
INSERT INTO public.app_modules (module_key, module_name, module_icon, category, sector, description, features, base_price, dependencies, version) VALUES
('accounting-realestate', 'Contabilidad Inmobiliaria', 'Home', 'vertical', 'realestate', 'Contabilidad para sector inmobiliario.',
'["Valoración de activos", "Amortizaciones", "Rentas y alquileres", "Ratios inmobiliarios"]'::jsonb,
80000, '{"core", "accounting-base"}', '1.0.0'),

('compliance-realestate', 'Compliance Inmobiliario', 'KeyRound', 'vertical', 'realestate', 'LAU, blanqueo de capitales.',
'["Ley Arrendamientos", "Prevención blanqueo", "Certificación energética", "Normativa urbanística"]'::jsonb,
90000, '{"core"}', '1.0.0'),

('property-management', 'Gestión de Propiedades', 'Building2', 'vertical', 'realestate', 'CRM inmobiliario completo.',
'["Cartera de propiedades", "Gestión de contratos", "Portal de inquilinos", "Mantenimiento"]'::jsonb,
70000, '{"core"}', '1.0.0'),

('ai-realestate', 'IA Inmobiliaria', 'TrendingUp', 'vertical', 'realestate', 'Valoraciones automáticas y predicciones.',
'["Valoración automática", "Predicción de precios", "Análisis de mercado", "Scoring de inquilinos"]'::jsonb,
110000, '{"core", "ai-assistant"}', '1.0.0');

-- 10. SEED DATA - COMPONENTES DE MÓDULOS
-- =====================================================

INSERT INTO public.module_components (module_key, component_path, component_name, component_type, admin_section_key, menu_order, menu_icon, menu_label, permissions_required, route_path) VALUES
-- Core
('core', 'CompaniesManager', 'Gestión de Empresas', 'page', 'companies', 1, 'Building2', 'Empresas', '{}', '/admin?section=companies'),
('core', 'UsersManager', 'Gestión de Usuarios', 'page', 'users', 2, 'Users', 'Usuarios', '{"admin", "superadmin"}', '/admin?section=users'),
('core', 'ProductsManager', 'Gestión de Productos', 'page', 'products', 3, 'Package', 'Productos', '{}', '/admin?section=products'),
('core', 'ConceptsManager', 'Gestión de Conceptos', 'page', 'concepts', 4, 'Database', 'Conceptos', '{"admin", "superadmin"}', '/admin?section=concepts'),
('core', 'StatusColorManager', 'Colores de Estado', 'page', 'colors', 5, 'Palette', 'Colores', '{"admin", "superadmin"}', '/admin?section=colors'),

-- Contabilidad Base
('accounting-base', 'AccountingManager', 'Contabilidad', 'page', 'accounting', 10, 'Calculator', 'Contabilidad', '{}', '/admin?section=accounting'),

-- Mapas
('maps', 'MapView', 'Mapa Interactivo', 'page', 'map', 6, 'Map', 'Mapa', '{}', '/admin?section=map'),

-- Mapas PRO
('maps-pro', 'RoutePlanner', 'Planificador de Rutas', 'widget', NULL, 0, 'Route', 'Rutas', '{}', NULL),
('maps-pro', 'Map3DBuildings', 'Visualización 3D', 'page', 'map-3d', 7, 'Box', '3D', '{}', '/admin?section=map-3d'),
('maps-pro', 'MapConfigDashboard', 'Configuración Mapas', 'page', 'map-config', 8, 'Settings', 'Config. Mapas', '{"admin", "superadmin"}', '/admin?section=map-config'),

-- Compliance Bancario
('compliance-banking', 'DORAComplianceDashboard', 'DORA Compliance', 'page', 'dora', 20, 'Shield', 'DORA/NIS2', '{}', '/admin?section=dora'),
('compliance-banking', 'ISO27001Dashboard', 'ISO 27001', 'page', 'iso27001', 21, 'Lock', 'ISO 27001', '{}', '/admin?section=iso27001'),

-- Visitas
('visits', 'VisitsManager', 'Gestión de Visitas', 'page', 'visits', 11, 'CalendarCheck', 'Visitas', '{}', '/admin?section=visits'),

-- Objetivos
('goals', 'GoalsManager', 'Gestión de Objetivos', 'page', 'goals', 12, 'Target', 'Objetivos', '{}', '/admin?section=goals'),
('goals', 'SalesPerformanceManager', 'Rendimiento Comercial', 'page', 'spm', 13, 'TrendingUp', 'Rendimiento', '{}', '/admin?section=spm'),

-- Comunicaciones
('communications', 'NotificationCenterManager', 'Centro de Notificaciones', 'page', 'notifications', 14, 'Bell', 'Notificaciones', '{}', '/admin?section=notifications'),

-- Asistente IA
('ai-assistant', 'InternalAssistantChat', 'Asistente IA', 'page', 'assistant', 15, 'Bot', 'Asistente IA', '{}', '/admin?section=assistant'),
('ai-assistant', 'AssistantKnowledgeManager', 'Base de Conocimiento', 'page', 'knowledge', 16, 'BookOpen', 'Conocimiento', '{"admin", "superadmin"}', '/admin?section=knowledge');

-- 11. SEED DATA - NORMATIVAS POR SECTOR
-- =====================================================

INSERT INTO public.sector_regulations (sector_key, regulation_code, regulation_name, authority, publication_date, effective_date, impact_level, status, summary, iso_codes, requirements) VALUES
-- BANCA
('banking', 'DORA', 'Digital Operational Resilience Act', 'UE', '2022-12-14', '2025-01-17', 'critical', 'active', 
'Reglamento de resiliencia operativa digital para el sector financiero.',
'{"ISO 27001", "ISO 22301"}',
'[{"code": "ICT-01", "text": "Marco de gestión de riesgos TIC"}, {"code": "ICT-02", "text": "Plan de continuidad de negocio"}, {"code": "INC-01", "text": "Gestión de incidentes TIC"}, {"code": "RES-01", "text": "Pruebas de resiliencia digital"}]'::jsonb),

('banking', 'MiFID-II', 'Markets in Financial Instruments Directive II', 'UE', '2018-01-03', '2018-01-03', 'critical', 'active',
'Directiva sobre mercados de instrumentos financieros.',
'{}',
'[{"code": "MIF-01", "text": "Registro de operaciones"}, {"code": "MIF-02", "text": "Best execution"}, {"code": "MIF-03", "text": "Conflictos de interés"}]'::jsonb),

('banking', 'PSD2', 'Payment Services Directive 2', 'UE', '2018-01-13', '2018-01-13', 'high', 'active',
'Directiva de servicios de pago.',
'{}',
'[{"code": "PSD-01", "text": "Strong Customer Authentication"}, {"code": "PSD-02", "text": "Acceso a cuentas (XS2A)"}, {"code": "PSD-03", "text": "Gestión de consentimientos"}]'::jsonb),

('banking', 'GDPR', 'General Data Protection Regulation', 'UE', '2018-05-25', '2018-05-25', 'critical', 'active',
'Reglamento general de protección de datos.',
'{"ISO 27701"}',
'[{"code": "GDPR-01", "text": "Base legal tratamiento"}, {"code": "GDPR-02", "text": "Derechos del interesado"}, {"code": "GDPR-03", "text": "Evaluación de impacto"}]'::jsonb),

('banking', 'ISO-27001', 'ISO/IEC 27001:2022', 'ISO', '2022-10-25', '2022-10-25', 'high', 'active',
'Sistema de gestión de seguridad de la información.',
'{"ISO 27001"}',
'[{"code": "A.5", "text": "Políticas de seguridad"}, {"code": "A.8", "text": "Gestión de activos"}, {"code": "A.9", "text": "Control de acceso"}]'::jsonb),

-- SALUD
('health', 'HIPAA', 'Health Insurance Portability and Accountability Act', 'USA', '1996-08-21', '1996-08-21', 'critical', 'active',
'Protección de información sanitaria.',
'{}',
'[{"code": "164.308", "text": "Salvaguardas administrativas"}, {"code": "164.312", "text": "Salvaguardas técnicas"}, {"code": "164.530", "text": "Notificación de privacidad"}]'::jsonb),

('health', 'ISO-27799', 'ISO 27799:2016', 'ISO', '2016-07-01', '2016-07-01', 'high', 'active',
'Gestión de seguridad de información en sanidad.',
'{"ISO 27001", "ISO 27799"}',
'[{"code": "27799-01", "text": "Clasificación de información sanitaria"}, {"code": "27799-02", "text": "Control de acceso a datos clínicos"}]'::jsonb),

-- INDUSTRIA
('industry', 'ISO-9001', 'ISO 9001:2015', 'ISO', '2015-09-15', '2015-09-15', 'high', 'active',
'Sistema de gestión de calidad.',
'{"ISO 9001"}',
'[{"code": "7.1", "text": "Recursos"}, {"code": "8.5", "text": "Producción y provisión del servicio"}, {"code": "9.1", "text": "Seguimiento y medición"}]'::jsonb),

('industry', 'ISO-14001', 'ISO 14001:2015', 'ISO', '2015-09-15', '2015-09-15', 'high', 'active',
'Sistema de gestión ambiental.',
'{"ISO 14001"}',
'[{"code": "6.1", "text": "Aspectos ambientales"}, {"code": "8.1", "text": "Control operacional"}]'::jsonb),

('industry', 'ISO-45001', 'ISO 45001:2018', 'ISO', '2018-03-12', '2018-03-12', 'critical', 'active',
'Sistema de gestión de seguridad y salud en el trabajo.',
'{"ISO 45001"}',
'[{"code": "6.1", "text": "Identificación de peligros"}, {"code": "8.1", "text": "Control operacional"}]'::jsonb);

-- 12. INSTALAR MÓDULO CORE POR DEFECTO
-- =====================================================

INSERT INTO public.installed_modules (
  organization_id, 
  module_id, 
  license_type, 
  valid_until, 
  is_active
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  id,
  'perpetual',
  NULL,
  true
FROM public.app_modules 
WHERE module_key = 'core'
ON CONFLICT (organization_id, module_id) DO NOTHING;
