-- Create sectors table for managing industry sectors
CREATE TABLE public.sectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  icon_name TEXT DEFAULT 'Building2',
  gradient_from TEXT DEFAULT '#3B82F6',
  gradient_to TEXT DEFAULT '#8B5CF6',
  features JSONB DEFAULT '[]'::jsonb,
  stats JSONB DEFAULT '[]'::jsonb,
  ai_capabilities JSONB DEFAULT '[]'::jsonb,
  regulations JSONB DEFAULT '[]'::jsonb,
  case_studies JSONB DEFAULT '[]'::jsonb,
  modules_recommended TEXT[] DEFAULT '{}',
  cnae_codes TEXT[] DEFAULT '{}',
  landing_page_url TEXT,
  demo_video_url TEXT,
  image_url TEXT,
  availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'coming_soon', 'new', 'beta')),
  target_company_sizes TEXT[] DEFAULT '{pyme,gran_empresa,startup}',
  order_position INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

-- Public read access for sectors
CREATE POLICY "Sectors are publicly readable"
  ON public.sectors FOR SELECT
  USING (is_active = true);

-- Admin write access
CREATE POLICY "Admins can manage sectors"
  ON public.sectors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('superadmin', 'admin')
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_sectors_updated_at
  BEFORE UPDATE ON public.sectors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial 8 sectors with comprehensive data
INSERT INTO public.sectors (name, slug, description, short_description, icon_name, gradient_from, gradient_to, features, stats, ai_capabilities, regulations, case_studies, modules_recommended, cnae_codes, availability_status, target_company_sizes, order_position, is_featured) VALUES
(
  'Retail y eCommerce',
  'retail-ecommerce',
  'Gestión integral de tiendas físicas y online, sincronización de stock en tiempo real, punto de venta avanzado e integración con los principales marketplaces.',
  'Gestión de tiendas físicas y online, sincronización de stock, punto de venta y marketplaces.',
  'ShoppingCart',
  '#F97316',
  '#FB923C',
  '[{"title": "POS Avanzado", "description": "Terminal punto de venta táctil con modo offline"}, {"title": "Multi-almacén", "description": "Gestión de stock en múltiples ubicaciones"}, {"title": "Marketplace Connect", "description": "Integración con Amazon, eBay, Shopify"}, {"title": "Fidelización", "description": "Programas de puntos y cupones automáticos"}]'::jsonb,
  '[{"value": 40, "suffix": "%", "label": "Reducción tiempo inventario"}, {"value": 99.9, "suffix": "%", "label": "Uptime sincronización"}, {"value": 15, "prefix": "+", "suffix": "K", "label": "Productos gestionados"}]'::jsonb,
  '[{"name": "Predicción de demanda", "description": "IA que predice ventas y optimiza stock"}, {"name": "Pricing dinámico", "description": "Ajuste automático de precios según mercado"}]'::jsonb,
  '[{"code": "RGPD", "name": "Protección de Datos"}, {"code": "PCI-DSS", "name": "Seguridad en Pagos"}]'::jsonb,
  '[{"company": "RetailMax", "result": "40% reducción de roturas de stock", "logo_url": null}]'::jsonb,
  ARRAY['pos', 'inventory', 'ecommerce', 'crm'],
  ARRAY['47', '4711', '4719', '4791'],
  'available',
  ARRAY['pyme', 'gran_empresa', 'startup'],
  1,
  true
),
(
  'Construcción e Ingeniería',
  'construccion-ingenieria',
  'Gestión integral de proyectos de construcción, control de certificaciones, análisis de costes en tiempo real y planificación avanzada con diagramas Gantt.',
  'Gestión de proyectos, certificaciones, control de costes y planificación.',
  'HardHat',
  '#0EA5E9',
  '#38BDF8',
  '[{"title": "Gestión de Obras", "description": "Control total de proyectos y subcontratas"}, {"title": "Certificaciones", "description": "Generación automática de certificaciones de obra"}, {"title": "Control de Costes", "description": "Análisis en tiempo real de desviaciones"}, {"title": "Planificación Gantt", "description": "Diagramas interactivos con dependencias"}]'::jsonb,
  '[{"value": 95, "suffix": "%", "label": "Precisión en presupuestos"}, {"value": 30, "suffix": "%", "label": "Ahorro en desviaciones"}, {"value": 500, "prefix": "+", "label": "Obras gestionadas"}]'::jsonb,
  '[{"name": "Estimación de costes", "description": "IA que calcula presupuestos basados en históricos"}, {"name": "Detección de riesgos", "description": "Alertas predictivas de posibles retrasos"}]'::jsonb,
  '[{"code": "LOE", "name": "Ley de Ordenación de la Edificación"}, {"code": "CTE", "name": "Código Técnico de la Edificación"}]'::jsonb,
  '[{"company": "Constructora Mediterráneo", "result": "25% reducción tiempos de entrega", "logo_url": null}]'::jsonb,
  ARRAY['project', 'accounting', 'hr', 'documents'],
  ARRAY['41', '42', '43', '71'],
  'available',
  ARRAY['pyme', 'gran_empresa'],
  2,
  true
),
(
  'Salud y Clínicas',
  'salud-clinicas',
  'Solución completa para centros sanitarios con agenda médica inteligente, gestión de historia clínica electrónica, facturación sanitaria y cumplimiento normativo LOPD/RGPD.',
  'Agenda médica, historia clínica, facturación sanitaria y cumplimiento normativo.',
  'Stethoscope',
  '#10B981',
  '#34D399',
  '[{"title": "Agenda Inteligente", "description": "Citas con confirmación automática y recordatorios"}, {"title": "Historia Clínica", "description": "HCE completa con firma digital"}, {"title": "Facturación Sanitaria", "description": "Integración con mutuas y seguros"}, {"title": "Telemedicina", "description": "Videoconsultas integradas"}]'::jsonb,
  '[{"value": 60, "suffix": "%", "label": "Reducción no-shows"}, {"value": 100, "suffix": "%", "label": "Cumplimiento RGPD"}, {"value": 50, "prefix": "+", "label": "Clínicas activas"}]'::jsonb,
  '[{"name": "Triaje automático", "description": "IA que prioriza citas según síntomas"}, {"name": "Recordatorios inteligentes", "description": "Comunicación personalizada por canal preferido"}]'::jsonb,
  '[{"code": "RGPD", "name": "Protección de Datos"}, {"code": "ENS", "name": "Esquema Nacional de Seguridad"}, {"code": "LOPD-GDD", "name": "Ley Orgánica de Protección de Datos"}]'::jsonb,
  '[{"company": "Clínica Salud Integral", "result": "50% más pacientes atendidos", "logo_url": null}]'::jsonb,
  ARRAY['appointments', 'medical', 'billing', 'crm'],
  ARRAY['86', '8610', '8621', '8622'],
  'available',
  ARRAY['pyme', 'gran_empresa'],
  3,
  true
),
(
  'Fabricación e Industria',
  'fabricacion-industria',
  'Sistema MRP completo con gestión de listas de materiales, órdenes de producción automatizadas, control de calidad y mantenimiento preventivo integrado.',
  'MRP, listas de materiales, órdenes de producción, mantenimiento preventivo.',
  'Factory',
  '#8B5CF6',
  '#A78BFA',
  '[{"title": "MRP Avanzado", "description": "Planificación de necesidades de materiales"}, {"title": "Listas de Materiales", "description": "BOM multinivel con costes automáticos"}, {"title": "Órdenes de Producción", "description": "Workflow completo con trazabilidad"}, {"title": "Mantenimiento", "description": "Preventivo, correctivo y predictivo"}]'::jsonb,
  '[{"value": 35, "suffix": "%", "label": "Mejora eficiencia"}, {"value": 99, "suffix": "%", "label": "Trazabilidad"}, {"value": 200, "prefix": "+", "label": "Plantas industriales"}]'::jsonb,
  '[{"name": "Planificación predictiva", "description": "IA que optimiza secuencias de producción"}, {"name": "Mantenimiento predictivo", "description": "Predicción de fallos antes de que ocurran"}]'::jsonb,
  '[{"code": "ISO-9001", "name": "Gestión de Calidad"}, {"code": "ISO-14001", "name": "Gestión Ambiental"}]'::jsonb,
  '[{"company": "Industrial Norte", "result": "35% reducción tiempos de parada", "logo_url": null}]'::jsonb,
  ARRAY['mrp', 'inventory', 'maintenance', 'quality'],
  ARRAY['10', '20', '21', '22', '23', '24', '25'],
  'available',
  ARRAY['pyme', 'gran_empresa'],
  4,
  true
),
(
  'Logística y Distribución',
  'logistica-distribucion',
  'Gestión multi-almacén con optimización de rutas, picking inteligente, control de lotes y trazabilidad completa desde origen hasta destino.',
  'Multi-almacén, rutas, picking, lotes, trazabilidad.',
  'Truck',
  '#EF4444',
  '#F87171',
  '[{"title": "Multi-almacén", "description": "Gestión centralizada de múltiples ubicaciones"}, {"title": "Optimización de Rutas", "description": "Algoritmos de ruta óptima en tiempo real"}, {"title": "Picking Inteligente", "description": "Estrategias FIFO, LIFO, wave picking"}, {"title": "Trazabilidad", "description": "Control de lotes y fechas de caducidad"}]'::jsonb,
  '[{"value": 25, "suffix": "%", "label": "Reducción costes envío"}, {"value": 98, "suffix": "%", "label": "Precisión inventario"}, {"value": 1, "suffix": "M", "prefix": "+", "label": "Envíos procesados"}]'::jsonb,
  '[{"name": "Optimización de carga", "description": "IA que maximiza aprovechamiento de vehículos"}, {"name": "Predicción de demanda", "description": "Anticipación de necesidades de stock"}]'::jsonb,
  '[{"code": "ADR", "name": "Transporte Mercancías Peligrosas"}, {"code": "GDP", "name": "Buenas Prácticas de Distribución"}]'::jsonb,
  '[{"company": "LogiExpress", "result": "25% ahorro en costes logísticos", "logo_url": null}]'::jsonb,
  ARRAY['inventory', 'logistics', 'fleet', 'barcode'],
  ARRAY['49', '50', '52', '53'],
  'available',
  ARRAY['pyme', 'gran_empresa'],
  5,
  true
),
(
  'Educación y ONGs',
  'educacion-ongs',
  'Plataforma integral para gestionar estudiantes, voluntarios, donaciones y proyectos sociales, facilitando el cumplimiento de objetivos educativos y solidarios.',
  'Gestionar estudiantes, voluntarios, donaciones y cumplimiento de objetivos sociales.',
  'GraduationCap',
  '#06B6D4',
  '#22D3EE',
  '[{"title": "Gestión Académica", "description": "Matrículas, notas, asistencia y expedientes"}, {"title": "Voluntariado", "description": "Control de voluntarios y horas dedicadas"}, {"title": "Donaciones", "description": "Gestión de donantes y campañas"}, {"title": "Proyectos Sociales", "description": "Seguimiento de impacto y resultados"}]'::jsonb,
  '[{"value": 100, "suffix": "%", "label": "Transparencia fondos"}, {"value": 45, "suffix": "%", "label": "Más voluntarios activos"}, {"value": 300, "prefix": "+", "label": "Organizaciones"}]'::jsonb,
  '[{"name": "Matching donantes", "description": "IA que conecta donantes con proyectos afines"}, {"name": "Predicción abandono", "description": "Identificación temprana de deserción estudiantil"}]'::jsonb,
  '[{"code": "Ley 49/2002", "name": "Régimen Fiscal Entidades Sin Fines Lucrativos"}, {"code": "LOPJ", "name": "Ley de Protección Jurídica del Menor"}]'::jsonb,
  '[{"company": "Fundación Esperanza", "result": "200% aumento donaciones recurrentes", "logo_url": null}]'::jsonb,
  ARRAY['education', 'crm', 'accounting', 'volunteers'],
  ARRAY['85', '88', '94'],
  'available',
  ARRAY['pyme', 'startup'],
  6,
  true
),
(
  'Servicios Financieros',
  'servicios-financieros',
  'Solución especializada para entidades financieras con gestión de cartera de clientes, análisis de riesgos, cumplimiento normativo y reporting regulatorio automatizado.',
  'Gestión de cartera, análisis de riesgos, cumplimiento normativo y reporting.',
  'Landmark',
  '#F59E0B',
  '#FBBF24',
  '[{"title": "Gestión de Cartera", "description": "360º de clientes con scoring integrado"}, {"title": "Análisis de Riesgos", "description": "Modelos predictivos y stress testing"}, {"title": "Cumplimiento", "description": "AML, KYC y PBC automatizado"}, {"title": "Reporting", "description": "Informes CNMV, BdE automáticos"}]'::jsonb,
  '[{"value": 99, "suffix": "%", "label": "Cumplimiento regulatorio"}, {"value": 60, "suffix": "%", "label": "Reducción tiempo KYC"}, {"value": 50, "prefix": "+", "label": "Entidades financieras"}]'::jsonb,
  '[{"name": "Scoring crediticio", "description": "IA que evalúa riesgo de crédito en segundos"}, {"name": "Detección fraude", "description": "Algoritmos de detección de operaciones sospechosas"}]'::jsonb,
  '[{"code": "MiFID II", "name": "Directiva de Mercados"}, {"code": "PBC", "name": "Prevención Blanqueo de Capitales"}, {"code": "DORA", "name": "Resiliencia Operativa Digital"}]'::jsonb,
  '[{"company": "Banca Regional", "result": "99% cumplimiento en auditorías", "logo_url": null}]'::jsonb,
  ARRAY['finance', 'risk', 'compliance', 'reporting'],
  ARRAY['64', '65', '66'],
  'new',
  ARRAY['gran_empresa'],
  7,
  true
),
(
  'Hostelería y Turismo',
  'hosteleria-turismo',
  'Sistema integral para hoteles, restaurantes y empresas turísticas con gestión de reservas, channel manager, punto de venta y experiencia del huésped.',
  'Gestión de reservas, channel manager, POS y experiencia del cliente.',
  'Utensils',
  '#EC4899',
  '#F472B6',
  '[{"title": "Reservas Central", "description": "Motor de reservas con channel manager"}, {"title": "POS Restauración", "description": "Terminal adaptado a hostelería"}, {"title": "Housekeeping", "description": "Gestión de limpieza y mantenimiento"}, {"title": "Guest Experience", "description": "Check-in digital y comunicación automatizada"}]'::jsonb,
  '[{"value": 35, "suffix": "%", "label": "Aumento ocupación"}, {"value": 4.8, "suffix": "/5", "label": "Satisfacción cliente"}, {"value": 100, "prefix": "+", "label": "Establecimientos"}]'::jsonb,
  '[{"name": "Revenue management", "description": "IA que optimiza precios según demanda"}, {"name": "Recomendaciones", "description": "Upselling personalizado por perfil de huésped"}]'::jsonb,
  '[{"code": "RGPD", "name": "Protección de Datos"}, {"code": "Ley Turismo", "name": "Normativa Autonómica de Turismo"}]'::jsonb,
  '[{"company": "Hotel Mediterráneo", "result": "35% más reservas directas", "logo_url": null}]'::jsonb,
  ARRAY['hotel', 'pos', 'crm', 'booking'],
  ARRAY['55', '56', '79'],
  'available',
  ARRAY['pyme', 'gran_empresa', 'startup'],
  8,
  true
);

-- Create index for performance
CREATE INDEX idx_sectors_active_order ON public.sectors(is_active, order_position);
CREATE INDEX idx_sectors_slug ON public.sectors(slug);
CREATE INDEX idx_sectors_cnae ON public.sectors USING GIN(cnae_codes);