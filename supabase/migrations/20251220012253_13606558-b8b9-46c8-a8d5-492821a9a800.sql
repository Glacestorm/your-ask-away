-- =====================================================
-- FASE 7: VERTICALES CNAE - INFRAESTRUCTURA BASE
-- =====================================================

-- Tabla principal de packs verticales
CREATE TABLE public.vertical_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical_key TEXT UNIQUE NOT NULL,
  vertical_name TEXT NOT NULL,
  description TEXT,
  cnae_codes TEXT[] NOT NULL DEFAULT '{}',
  included_modules TEXT[] NOT NULL DEFAULT '{}',
  included_integrations TEXT[] DEFAULT '{}',
  bpmn_templates JSONB DEFAULT '[]',
  dashboard_templates JSONB DEFAULT '[]',
  demo_config JSONB DEFAULT '{}',
  pricing_config JSONB DEFAULT '{}',
  icon_name TEXT,
  color_scheme JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Módulos específicos por vertical
CREATE TABLE public.vertical_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical_pack_id UUID REFERENCES vertical_packs(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  module_name TEXT NOT NULL,
  description TEXT,
  features JSONB DEFAULT '[]',
  component_path TEXT,
  is_core BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integraciones por vertical
CREATE TABLE public.vertical_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical_pack_id UUID REFERENCES vertical_packs(id) ON DELETE CASCADE,
  integration_key TEXT NOT NULL,
  integration_name TEXT NOT NULL,
  provider TEXT,
  api_type TEXT DEFAULT 'rest',
  config_schema JSONB DEFAULT '{}',
  documentation_url TEXT,
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plantillas BPMN por vertical
CREATE TABLE public.vertical_bpmn_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical_pack_id UUID REFERENCES vertical_packs(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL,
  template_name TEXT NOT NULL,
  description TEXT,
  process_definition JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboards por vertical
CREATE TABLE public.vertical_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical_pack_id UUID REFERENCES vertical_packs(id) ON DELETE CASCADE,
  dashboard_key TEXT NOT NULL,
  dashboard_name TEXT NOT NULL,
  layout JSONB DEFAULT '{}',
  widgets JSONB DEFAULT '[]',
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.vertical_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vertical_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vertical_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vertical_bpmn_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vertical_dashboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vertical_packs
CREATE POLICY "Anyone can view active vertical packs" ON public.vertical_packs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage vertical packs" ON public.vertical_packs
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

-- RLS Policies for vertical_modules
CREATE POLICY "Anyone can view vertical modules" ON public.vertical_modules
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage vertical modules" ON public.vertical_modules
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

-- RLS Policies for vertical_integrations
CREATE POLICY "Anyone can view active integrations" ON public.vertical_integrations
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage integrations" ON public.vertical_integrations
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

-- RLS Policies for vertical_bpmn_templates
CREATE POLICY "Anyone can view bpmn templates" ON public.vertical_bpmn_templates
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage bpmn templates" ON public.vertical_bpmn_templates
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

-- RLS Policies for vertical_dashboards
CREATE POLICY "Anyone can view dashboards" ON public.vertical_dashboards
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage dashboards" ON public.vertical_dashboards
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

-- Insert initial vertical packs data
INSERT INTO public.vertical_packs (vertical_key, vertical_name, description, cnae_codes, included_modules, included_integrations, pricing_config, icon_name, color_scheme, display_order) VALUES
('retail', 'Retail / Hostelería', 'Solución completa para comercio minorista y hostelería con POS, inventario, compras y adaptación fiscal TicketBAI/VeriFactu', 
  ARRAY['4711', '4719', '4721', '4722', '4723', '4724', '4725', '4726', '4729', '4730', '4741', '4742', '4751', '4752', '4753', '4754', '4759', '4761', '4762', '4763', '4764', '4765', '4771', '4772', '4773', '4774', '4775', '4776', '4777', '4778', '4779', '4781', '4782', '4789', '4791', '4799', '5610', '5621', '5629', '5630'],
  ARRAY['pos', 'inventory', 'purchases', 'fiscal'],
  ARRAY['ticketbai', 'verifactu', 'tpv'],
  '{"setup_fee": 2500, "monthly_fee": 299, "addons": [{"key": "multi_store", "name": "Multi-Tienda", "price": 99}, {"key": "ecommerce", "name": "E-commerce", "price": 149}]}',
  'ShoppingCart', '{"primary": "#f59e0b", "secondary": "#d97706"}', 1),

('construction', 'Construcción', 'Gestión integral de obras, subcontratas, certificaciones, planificación y control de costes',
  ARRAY['4110', '4121', '4122', '4211', '4212', '4213', '4221', '4222', '4291', '4299', '4311', '4312', '4313', '4321', '4322', '4329', '4331', '4332', '4333', '4334', '4339', '4391', '4399'],
  ARRAY['projects', 'subcontractors', 'certifications', 'planning', 'costs', 'purchases'],
  ARRAY['cad', 'presto', 'bim'],
  '{"setup_fee": 3500, "monthly_fee": 449, "addons": [{"key": "bim_integration", "name": "Integración BIM", "price": 199}, {"key": "safety", "name": "PRL/Seguridad", "price": 99}]}',
  'HardHat', '{"primary": "#ea580c", "secondary": "#c2410c"}', 2),

('healthcare', 'Salud', 'Gestión de citas, expedientes médicos, facturación, consentimientos y trazabilidad RGPD',
  ARRAY['8610', '8621', '8622', '8623', '8690'],
  ARRAY['appointments', 'records', 'billing', 'consent', 'traceability'],
  ARRAY['hl7', 'fhir', 'insurers'],
  '{"setup_fee": 4000, "monthly_fee": 549, "addons": [{"key": "telemedicine", "name": "Telemedicina", "price": 199}, {"key": "lab_integration", "name": "Laboratorio", "price": 149}]}',
  'Heart', '{"primary": "#dc2626", "secondary": "#b91c1c"}', 3),

('logistics', 'Logística / Transporte', 'Gestión de flotas, rutas optimizadas, SLAs, almacén y última milla',
  ARRAY['4910', '4920', '4931', '4932', '4939', '4941', '4942', '5010', '5020', '5110', '5121', '5122', '5210', '5221', '5222', '5223', '5224', '5229'],
  ARRAY['fleet', 'routes', 'sla', 'warehouse', 'lastmile'],
  ARRAY['gps', 'tms', 'wms'],
  '{"setup_fee": 3000, "monthly_fee": 399, "addons": [{"key": "realtime_tracking", "name": "Tracking Tiempo Real", "price": 149}, {"key": "route_optimization", "name": "Optimización IA", "price": 199}]}',
  'Truck', '{"primary": "#2563eb", "secondary": "#1d4ed8"}', 4),

('legal', 'Servicios Profesionales / Legal', 'Gestión de expedientes, control de tiempos, facturación por horas, documentos y renovaciones',
  ARRAY['6910', '6920', '7010', '7021', '7022', '7111', '7112', '7120', '7311', '7312', '7320', '7410', '7420', '7430', '7490'],
  ARRAY['cases', 'timesheet', 'billing', 'documents', 'renewals'],
  ARRAY['lexnet', 'digital_signature', 'docusign'],
  '{"setup_fee": 2000, "monthly_fee": 349, "addons": [{"key": "court_calendar", "name": "Calendario Procesal", "price": 99}, {"key": "ai_docs", "name": "Documentos IA", "price": 149}]}',
  'Scale', '{"primary": "#7c3aed", "secondary": "#6d28d9"}', 5);

-- Insert modules for each vertical
-- RETAIL MODULES
INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'pos', 'Punto de Venta', 'Sistema TPV completo con gestión de tickets, cobros múltiples y cierre de caja',
  '[{"name": "Tickets de venta", "icon": "Receipt"}, {"name": "Cobros múltiples", "icon": "CreditCard"}, {"name": "Cierre de caja", "icon": "Calculator"}, {"name": "Modo offline", "icon": "WifiOff"}]'::jsonb,
  true, 1
FROM vertical_packs WHERE vertical_key = 'retail';

INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'inventory', 'Inventario', 'Control de stock en tiempo real con predicción de demanda IA',
  '[{"name": "Stock tiempo real", "icon": "Package"}, {"name": "Predicción demanda", "icon": "TrendingUp"}, {"name": "Alertas stock", "icon": "Bell"}, {"name": "Multi-almacén", "icon": "Warehouse"}]'::jsonb,
  true, 2
FROM vertical_packs WHERE vertical_key = 'retail';

INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'purchases', 'Compras', 'Gestión de proveedores, pedidos y recepción de mercancías',
  '[{"name": "Proveedores", "icon": "Users"}, {"name": "Pedidos automáticos", "icon": "ShoppingCart"}, {"name": "Recepción mercancía", "icon": "PackageCheck"}, {"name": "Comparador precios", "icon": "Scale"}]'::jsonb,
  true, 3
FROM vertical_packs WHERE vertical_key = 'retail';

INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'fiscal', 'Fiscal TicketBAI/VeriFactu', 'Adaptación fiscal completa para País Vasco y España',
  '[{"name": "TicketBAI", "icon": "FileCheck"}, {"name": "VeriFactu", "icon": "FileText"}, {"name": "Códigos QR", "icon": "QrCode"}, {"name": "Validación AEAT", "icon": "Shield"}]'::jsonb,
  true, 4
FROM vertical_packs WHERE vertical_key = 'retail';

-- CONSTRUCTION MODULES
INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'projects', 'Gestión de Obras', 'Control integral de proyectos de construcción',
  '[{"name": "Fases y hitos", "icon": "Flag"}, {"name": "Documentación", "icon": "FileText"}, {"name": "Partes de obra", "icon": "ClipboardList"}, {"name": "Incidencias", "icon": "AlertTriangle"}]'::jsonb,
  true, 1
FROM vertical_packs WHERE vertical_key = 'construction';

INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'subcontractors', 'Subcontratas', 'Gestión de subcontratistas y sus documentaciones',
  '[{"name": "Registro subcontratas", "icon": "Users"}, {"name": "Documentación legal", "icon": "FileCheck"}, {"name": "Coordinación", "icon": "Link"}, {"name": "Evaluación", "icon": "Star"}]'::jsonb,
  true, 2
FROM vertical_packs WHERE vertical_key = 'construction';

INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'certifications', 'Certificaciones', 'Certificaciones mensuales de obra ejecutada',
  '[{"name": "Certificaciones mensuales", "icon": "FileCheck"}, {"name": "Mediciones", "icon": "Ruler"}, {"name": "Aprobación cliente", "icon": "CheckCircle"}, {"name": "Histórico", "icon": "History"}]'::jsonb,
  true, 3
FROM vertical_packs WHERE vertical_key = 'construction';

INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'planning', 'Planificación', 'Diagrama Gantt interactivo y gestión de recursos',
  '[{"name": "Gantt interactivo", "icon": "Calendar"}, {"name": "Recursos", "icon": "Users"}, {"name": "Dependencias", "icon": "GitBranch"}, {"name": "Ruta crítica", "icon": "Route"}]'::jsonb,
  true, 4
FROM vertical_packs WHERE vertical_key = 'construction';

INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'costs', 'Control de Costes', 'Presupuesto vs. real con desviaciones',
  '[{"name": "Presupuesto", "icon": "Calculator"}, {"name": "Costes reales", "icon": "Receipt"}, {"name": "Desviaciones", "icon": "TrendingDown"}, {"name": "Previsiones", "icon": "TrendingUp"}]'::jsonb,
  true, 5
FROM vertical_packs WHERE vertical_key = 'construction';

INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'purchases', 'Compras Obra', 'Gestión de compras específica para construcción',
  '[{"name": "Pedidos material", "icon": "Package"}, {"name": "Comparativas", "icon": "Scale"}, {"name": "Albaranes", "icon": "FileText"}, {"name": "Control entregas", "icon": "Truck"}]'::jsonb,
  true, 6
FROM vertical_packs WHERE vertical_key = 'construction';

-- HEALTHCARE MODULES
INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'appointments', 'Citas', 'Gestión de agenda y citas médicas con recordatorios',
  '[{"name": "Agenda inteligente", "icon": "Calendar"}, {"name": "Recordatorios SMS/Email", "icon": "Bell"}, {"name": "Lista espera", "icon": "Clock"}, {"name": "Citas online", "icon": "Globe"}]'::jsonb,
  true, 1
FROM vertical_packs WHERE vertical_key = 'healthcare';

INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'records', 'Expedientes', 'Historial clínico digital seguro y encriptado',
  '[{"name": "Historia clínica", "icon": "FileText"}, {"name": "Encriptación", "icon": "Lock"}, {"name": "Adjuntos médicos", "icon": "Paperclip"}, {"name": "Búsqueda avanzada", "icon": "Search"}]'::jsonb,
  true, 2
FROM vertical_packs WHERE vertical_key = 'healthcare';

INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'billing', 'Facturación', 'Facturación a pacientes y aseguradoras',
  '[{"name": "Facturación pacientes", "icon": "Receipt"}, {"name": "Aseguradoras", "icon": "Building"}, {"name": "Tarifas", "icon": "Tag"}, {"name": "Cobros", "icon": "CreditCard"}]'::jsonb,
  true, 3
FROM vertical_packs WHERE vertical_key = 'healthcare';

INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'consent', 'Consentimientos', 'Gestión de consentimientos informados con firma digital',
  '[{"name": "Plantillas", "icon": "FileText"}, {"name": "Firma digital", "icon": "PenTool"}, {"name": "Registro legal", "icon": "Shield"}, {"name": "Versiones", "icon": "GitBranch"}]'::jsonb,
  true, 4
FROM vertical_packs WHERE vertical_key = 'healthcare';

INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'traceability', 'Trazabilidad', 'Trazabilidad de accesos y cumplimiento RGPD',
  '[{"name": "Log accesos", "icon": "Eye"}, {"name": "RGPD", "icon": "Shield"}, {"name": "Auditoría", "icon": "Search"}, {"name": "Alertas", "icon": "Bell"}]'::jsonb,
  true, 5
FROM vertical_packs WHERE vertical_key = 'healthcare';

-- LOGISTICS MODULES
INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'fleet', 'Flotas', 'Gestión completa de vehículos y conductores',
  '[{"name": "Registro vehículos", "icon": "Truck"}, {"name": "Conductores", "icon": "User"}, {"name": "Mantenimiento", "icon": "Wrench"}, {"name": "Documentación", "icon": "FileText"}]'::jsonb,
  true, 1
FROM vertical_packs WHERE vertical_key = 'logistics';

INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'routes', 'Rutas', 'Planificación y optimización de rutas con IA',
  '[{"name": "Planificador rutas", "icon": "Route"}, {"name": "Optimización IA", "icon": "Zap"}, {"name": "Tráfico real", "icon": "AlertCircle"}, {"name": "Multi-parada", "icon": "MapPin"}]'::jsonb,
  true, 2
FROM vertical_packs WHERE vertical_key = 'logistics';

INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'sla', 'SLAs', 'Gestión de contratos y niveles de servicio',
  '[{"name": "Contratos", "icon": "FileCheck"}, {"name": "KPIs", "icon": "BarChart"}, {"name": "Penalizaciones", "icon": "AlertTriangle"}, {"name": "Informes", "icon": "FileText"}]'::jsonb,
  true, 3
FROM vertical_packs WHERE vertical_key = 'logistics';

INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'warehouse', 'Almacén', 'Gestión de almacén con ubicaciones',
  '[{"name": "Ubicaciones", "icon": "Grid"}, {"name": "Entradas/Salidas", "icon": "ArrowLeftRight"}, {"name": "Picking", "icon": "Package"}, {"name": "Inventario", "icon": "ClipboardList"}]'::jsonb,
  true, 4
FROM vertical_packs WHERE vertical_key = 'logistics';

INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'lastmile', 'Última Milla', 'Gestión de entregas al cliente final',
  '[{"name": "Tracking envíos", "icon": "MapPin"}, {"name": "Notificaciones", "icon": "Bell"}, {"name": "Proof of delivery", "icon": "Camera"}, {"name": "Reclamaciones", "icon": "MessageCircle"}]'::jsonb,
  true, 5
FROM vertical_packs WHERE vertical_key = 'logistics';

-- LEGAL MODULES
INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'cases', 'Expedientes', 'Gestión de casos y expedientes legales',
  '[{"name": "Registro casos", "icon": "Folder"}, {"name": "Estados", "icon": "Flag"}, {"name": "Equipo asignado", "icon": "Users"}, {"name": "Historial", "icon": "History"}]'::jsonb,
  true, 1
FROM vertical_packs WHERE vertical_key = 'legal';

INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'timesheet', 'Control Tiempos', 'Registro de horas por proyecto y cliente',
  '[{"name": "Timesheet", "icon": "Clock"}, {"name": "Por proyecto", "icon": "Folder"}, {"name": "Aprobación", "icon": "CheckCircle"}, {"name": "Reportes", "icon": "BarChart"}]'::jsonb,
  true, 2
FROM vertical_packs WHERE vertical_key = 'legal';

INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'billing', 'Facturación', 'Facturación por horas o proyecto con provisiones',
  '[{"name": "Por horas", "icon": "Clock"}, {"name": "Por proyecto", "icon": "Folder"}, {"name": "Provisiones", "icon": "PiggyBank"}, {"name": "WIP", "icon": "TrendingUp"}]'::jsonb,
  true, 3
FROM vertical_packs WHERE vertical_key = 'legal';

INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'documents', 'Documentos', 'Gestión documental con plantillas legales',
  '[{"name": "Plantillas", "icon": "FileText"}, {"name": "Versiones", "icon": "GitBranch"}, {"name": "Firma digital", "icon": "PenTool"}, {"name": "Búsqueda", "icon": "Search"}]'::jsonb,
  true, 4
FROM vertical_packs WHERE vertical_key = 'legal';

INSERT INTO public.vertical_modules (vertical_pack_id, module_key, module_name, description, features, is_core, display_order)
SELECT id, 'renewals', 'Renovaciones', 'Alertas de vencimientos y renovaciones automáticas',
  '[{"name": "Vencimientos", "icon": "Calendar"}, {"name": "Alertas", "icon": "Bell"}, {"name": "Renovación auto", "icon": "RefreshCw"}, {"name": "Histórico", "icon": "History"}]'::jsonb,
  true, 5
FROM vertical_packs WHERE vertical_key = 'legal';

-- Insert BPMN templates for each vertical
-- RETAIL BPMN
INSERT INTO public.vertical_bpmn_templates (vertical_pack_id, template_key, template_name, description, process_definition, is_default)
SELECT id, 'sale_process', 'Proceso de Venta', 'Flujo completo desde selección de productos hasta cobro',
  '{"nodes": [{"id": "start", "type": "start", "label": "Inicio Venta"}, {"id": "scan", "type": "task", "label": "Escanear Productos"}, {"id": "payment", "type": "task", "label": "Procesar Pago"}, {"id": "receipt", "type": "task", "label": "Generar Ticket"}, {"id": "end", "type": "end", "label": "Fin"}], "edges": [{"source": "start", "target": "scan"}, {"source": "scan", "target": "payment"}, {"source": "payment", "target": "receipt"}, {"source": "receipt", "target": "end"}]}'::jsonb,
  true
FROM vertical_packs WHERE vertical_key = 'retail';

INSERT INTO public.vertical_bpmn_templates (vertical_pack_id, template_key, template_name, description, process_definition, is_default)
SELECT id, 'return_process', 'Proceso de Devolución', 'Gestión de devoluciones y cambios',
  '{"nodes": [{"id": "start", "type": "start", "label": "Solicitud Devolución"}, {"id": "verify", "type": "task", "label": "Verificar Ticket"}, {"id": "check", "type": "gateway", "label": "¿Válido?"}, {"id": "refund", "type": "task", "label": "Procesar Reembolso"}, {"id": "reject", "type": "task", "label": "Rechazar"}, {"id": "end", "type": "end", "label": "Fin"}], "edges": [{"source": "start", "target": "verify"}, {"source": "verify", "target": "check"}, {"source": "check", "target": "refund", "label": "Sí"}, {"source": "check", "target": "reject", "label": "No"}, {"source": "refund", "target": "end"}, {"source": "reject", "target": "end"}]}'::jsonb,
  false
FROM vertical_packs WHERE vertical_key = 'retail';

INSERT INTO public.vertical_bpmn_templates (vertical_pack_id, template_key, template_name, description, process_definition, is_default)
SELECT id, 'inventory_process', 'Proceso de Inventario', 'Recuento y ajuste de inventario',
  '{"nodes": [{"id": "start", "type": "start", "label": "Iniciar Inventario"}, {"id": "count", "type": "task", "label": "Recuento Físico"}, {"id": "compare", "type": "task", "label": "Comparar Stock"}, {"id": "adjust", "type": "task", "label": "Ajustes"}, {"id": "approve", "type": "task", "label": "Aprobar"}, {"id": "end", "type": "end", "label": "Fin"}], "edges": [{"source": "start", "target": "count"}, {"source": "count", "target": "compare"}, {"source": "compare", "target": "adjust"}, {"source": "adjust", "target": "approve"}, {"source": "approve", "target": "end"}]}'::jsonb,
  false
FROM vertical_packs WHERE vertical_key = 'retail';

-- CONSTRUCTION BPMN
INSERT INTO public.vertical_bpmn_templates (vertical_pack_id, template_key, template_name, description, process_definition, is_default)
SELECT id, 'certification_process', 'Certificación de Obra', 'Proceso mensual de certificación',
  '{"nodes": [{"id": "start", "type": "start", "label": "Inicio Mes"}, {"id": "measure", "type": "task", "label": "Mediciones"}, {"id": "draft", "type": "task", "label": "Borrador Certificación"}, {"id": "review", "type": "task", "label": "Revisión DF"}, {"id": "approve", "type": "gateway", "label": "¿Aprobado?"}, {"id": "send", "type": "task", "label": "Enviar Cliente"}, {"id": "revise", "type": "task", "label": "Revisar"}, {"id": "end", "type": "end", "label": "Certificación Emitida"}], "edges": [{"source": "start", "target": "measure"}, {"source": "measure", "target": "draft"}, {"source": "draft", "target": "review"}, {"source": "review", "target": "approve"}, {"source": "approve", "target": "send", "label": "Sí"}, {"source": "approve", "target": "revise", "label": "No"}, {"source": "revise", "target": "draft"}, {"source": "send", "target": "end"}]}'::jsonb,
  true
FROM vertical_packs WHERE vertical_key = 'construction';

INSERT INTO public.vertical_bpmn_templates (vertical_pack_id, template_key, template_name, description, process_definition, is_default)
SELECT id, 'purchase_process', 'Compras y Aprovisionamiento', 'Proceso de compras para obra',
  '{"nodes": [{"id": "start", "type": "start", "label": "Necesidad Material"}, {"id": "request", "type": "task", "label": "Solicitud Compra"}, {"id": "quotes", "type": "task", "label": "Solicitar Ofertas"}, {"id": "compare", "type": "task", "label": "Comparar"}, {"id": "approve", "type": "task", "label": "Aprobar Pedido"}, {"id": "order", "type": "task", "label": "Emitir Pedido"}, {"id": "receive", "type": "task", "label": "Recibir Material"}, {"id": "end", "type": "end", "label": "Fin"}], "edges": [{"source": "start", "target": "request"}, {"source": "request", "target": "quotes"}, {"source": "quotes", "target": "compare"}, {"source": "compare", "target": "approve"}, {"source": "approve", "target": "order"}, {"source": "order", "target": "receive"}, {"source": "receive", "target": "end"}]}'::jsonb,
  false
FROM vertical_packs WHERE vertical_key = 'construction';

INSERT INTO public.vertical_bpmn_templates (vertical_pack_id, template_key, template_name, description, process_definition, is_default)
SELECT id, 'incident_process', 'Gestión de Incidencias', 'Resolución de incidencias en obra',
  '{"nodes": [{"id": "start", "type": "start", "label": "Detectar Incidencia"}, {"id": "register", "type": "task", "label": "Registrar"}, {"id": "classify", "type": "task", "label": "Clasificar"}, {"id": "assign", "type": "task", "label": "Asignar Responsable"}, {"id": "resolve", "type": "task", "label": "Resolver"}, {"id": "verify", "type": "task", "label": "Verificar"}, {"id": "close", "type": "task", "label": "Cerrar"}, {"id": "end", "type": "end", "label": "Fin"}], "edges": [{"source": "start", "target": "register"}, {"source": "register", "target": "classify"}, {"source": "classify", "target": "assign"}, {"source": "assign", "target": "resolve"}, {"source": "resolve", "target": "verify"}, {"source": "verify", "target": "close"}, {"source": "close", "target": "end"}]}'::jsonb,
  false
FROM vertical_packs WHERE vertical_key = 'construction';

-- HEALTHCARE BPMN
INSERT INTO public.vertical_bpmn_templates (vertical_pack_id, template_key, template_name, description, process_definition, is_default)
SELECT id, 'appointment_process', 'Proceso de Cita Médica', 'Desde solicitud hasta consulta',
  '{"nodes": [{"id": "start", "type": "start", "label": "Solicitud Cita"}, {"id": "check", "type": "task", "label": "Verificar Disponibilidad"}, {"id": "confirm", "type": "task", "label": "Confirmar Cita"}, {"id": "remind", "type": "task", "label": "Enviar Recordatorio"}, {"id": "arrive", "type": "task", "label": "Llegada Paciente"}, {"id": "consult", "type": "task", "label": "Consulta"}, {"id": "end", "type": "end", "label": "Fin Consulta"}], "edges": [{"source": "start", "target": "check"}, {"source": "check", "target": "confirm"}, {"source": "confirm", "target": "remind"}, {"source": "remind", "target": "arrive"}, {"source": "arrive", "target": "consult"}, {"source": "consult", "target": "end"}]}'::jsonb,
  true
FROM vertical_packs WHERE vertical_key = 'healthcare';

INSERT INTO public.vertical_bpmn_templates (vertical_pack_id, template_key, template_name, description, process_definition, is_default)
SELECT id, 'admission_process', 'Proceso Ingreso/Alta', 'Gestión de ingresos hospitalarios',
  '{"nodes": [{"id": "start", "type": "start", "label": "Orden Ingreso"}, {"id": "admin", "type": "task", "label": "Admisión"}, {"id": "assign", "type": "task", "label": "Asignar Cama"}, {"id": "treatment", "type": "task", "label": "Tratamiento"}, {"id": "discharge", "type": "gateway", "label": "¿Alta?"}, {"id": "report", "type": "task", "label": "Informe Alta"}, {"id": "end", "type": "end", "label": "Fin"}], "edges": [{"source": "start", "target": "admin"}, {"source": "admin", "target": "assign"}, {"source": "assign", "target": "treatment"}, {"source": "treatment", "target": "discharge"}, {"source": "discharge", "target": "report", "label": "Sí"}, {"source": "discharge", "target": "treatment", "label": "No"}, {"source": "report", "target": "end"}]}'::jsonb,
  false
FROM vertical_packs WHERE vertical_key = 'healthcare';

INSERT INTO public.vertical_bpmn_templates (vertical_pack_id, template_key, template_name, description, process_definition, is_default)
SELECT id, 'insurer_billing', 'Facturación Aseguradoras', 'Proceso de facturación a compañías',
  '{"nodes": [{"id": "start", "type": "start", "label": "Servicio Prestado"}, {"id": "code", "type": "task", "label": "Codificar Actos"}, {"id": "validate", "type": "task", "label": "Validar Cobertura"}, {"id": "generate", "type": "task", "label": "Generar Factura"}, {"id": "send", "type": "task", "label": "Enviar"}, {"id": "collect", "type": "task", "label": "Cobrar"}, {"id": "end", "type": "end", "label": "Fin"}], "edges": [{"source": "start", "target": "code"}, {"source": "code", "target": "validate"}, {"source": "validate", "target": "generate"}, {"source": "generate", "target": "send"}, {"source": "send", "target": "collect"}, {"source": "collect", "target": "end"}]}'::jsonb,
  false
FROM vertical_packs WHERE vertical_key = 'healthcare';

-- LOGISTICS BPMN
INSERT INTO public.vertical_bpmn_templates (vertical_pack_id, template_key, template_name, description, process_definition, is_default)
SELECT id, 'shipment_process', 'Proceso de Expedición', 'Desde pedido hasta salida',
  '{"nodes": [{"id": "start", "type": "start", "label": "Recibir Pedido"}, {"id": "pick", "type": "task", "label": "Picking"}, {"id": "pack", "type": "task", "label": "Embalaje"}, {"id": "label", "type": "task", "label": "Etiquetado"}, {"id": "load", "type": "task", "label": "Carga"}, {"id": "dispatch", "type": "task", "label": "Expedición"}, {"id": "end", "type": "end", "label": "En Ruta"}], "edges": [{"source": "start", "target": "pick"}, {"source": "pick", "target": "pack"}, {"source": "pack", "target": "label"}, {"source": "label", "target": "load"}, {"source": "load", "target": "dispatch"}, {"source": "dispatch", "target": "end"}]}'::jsonb,
  true
FROM vertical_packs WHERE vertical_key = 'logistics';

INSERT INTO public.vertical_bpmn_templates (vertical_pack_id, template_key, template_name, description, process_definition, is_default)
SELECT id, 'lastmile_process', 'Entrega Última Milla', 'Proceso de entrega al cliente final',
  '{"nodes": [{"id": "start", "type": "start", "label": "Asignar Ruta"}, {"id": "notify", "type": "task", "label": "Notificar Cliente"}, {"id": "deliver", "type": "task", "label": "Entregar"}, {"id": "check", "type": "gateway", "label": "¿Entregado?"}, {"id": "pod", "type": "task", "label": "Proof of Delivery"}, {"id": "reschedule", "type": "task", "label": "Reprogramar"}, {"id": "end", "type": "end", "label": "Fin"}], "edges": [{"source": "start", "target": "notify"}, {"source": "notify", "target": "deliver"}, {"source": "deliver", "target": "check"}, {"source": "check", "target": "pod", "label": "Sí"}, {"source": "check", "target": "reschedule", "label": "No"}, {"source": "pod", "target": "end"}, {"source": "reschedule", "target": "notify"}]}'::jsonb,
  false
FROM vertical_packs WHERE vertical_key = 'logistics';

INSERT INTO public.vertical_bpmn_templates (vertical_pack_id, template_key, template_name, description, process_definition, is_default)
SELECT id, 'claim_process', 'Proceso de Reclamación', 'Gestión de incidencias de entrega',
  '{"nodes": [{"id": "start", "type": "start", "label": "Recibir Reclamación"}, {"id": "register", "type": "task", "label": "Registrar"}, {"id": "investigate", "type": "task", "label": "Investigar"}, {"id": "decide", "type": "gateway", "label": "¿Procedente?"}, {"id": "compensate", "type": "task", "label": "Compensar"}, {"id": "reject", "type": "task", "label": "Rechazar"}, {"id": "close", "type": "task", "label": "Cerrar"}, {"id": "end", "type": "end", "label": "Fin"}], "edges": [{"source": "start", "target": "register"}, {"source": "register", "target": "investigate"}, {"source": "investigate", "target": "decide"}, {"source": "decide", "target": "compensate", "label": "Sí"}, {"source": "decide", "target": "reject", "label": "No"}, {"source": "compensate", "target": "close"}, {"source": "reject", "target": "close"}, {"source": "close", "target": "end"}]}'::jsonb,
  false
FROM vertical_packs WHERE vertical_key = 'logistics';

-- LEGAL BPMN
INSERT INTO public.vertical_bpmn_templates (vertical_pack_id, template_key, template_name, description, process_definition, is_default)
SELECT id, 'case_intake', 'Alta de Caso', 'Proceso de apertura de expediente',
  '{"nodes": [{"id": "start", "type": "start", "label": "Consulta Cliente"}, {"id": "evaluate", "type": "task", "label": "Evaluar Caso"}, {"id": "accept", "type": "gateway", "label": "¿Aceptar?"}, {"id": "proposal", "type": "task", "label": "Propuesta Honorarios"}, {"id": "reject", "type": "task", "label": "Rechazar"}, {"id": "open", "type": "task", "label": "Abrir Expediente"}, {"id": "assign", "type": "task", "label": "Asignar Equipo"}, {"id": "end", "type": "end", "label": "Caso Activo"}], "edges": [{"source": "start", "target": "evaluate"}, {"source": "evaluate", "target": "accept"}, {"source": "accept", "target": "proposal", "label": "Sí"}, {"source": "accept", "target": "reject", "label": "No"}, {"source": "proposal", "target": "open"}, {"source": "open", "target": "assign"}, {"source": "assign", "target": "end"}, {"source": "reject", "target": "end"}]}'::jsonb,
  true
FROM vertical_packs WHERE vertical_key = 'legal';

INSERT INTO public.vertical_bpmn_templates (vertical_pack_id, template_key, template_name, description, process_definition, is_default)
SELECT id, 'monthly_billing', 'Facturación Mensual', 'Proceso de facturación por horas',
  '{"nodes": [{"id": "start", "type": "start", "label": "Fin de Mes"}, {"id": "extract", "type": "task", "label": "Extraer Horas"}, {"id": "review", "type": "task", "label": "Revisar WIP"}, {"id": "generate", "type": "task", "label": "Generar Proforma"}, {"id": "approve", "type": "task", "label": "Aprobar Socio"}, {"id": "invoice", "type": "task", "label": "Emitir Factura"}, {"id": "send", "type": "task", "label": "Enviar Cliente"}, {"id": "end", "type": "end", "label": "Fin"}], "edges": [{"source": "start", "target": "extract"}, {"source": "extract", "target": "review"}, {"source": "review", "target": "generate"}, {"source": "generate", "target": "approve"}, {"source": "approve", "target": "invoice"}, {"source": "invoice", "target": "send"}, {"source": "send", "target": "end"}]}'::jsonb,
  false
FROM vertical_packs WHERE vertical_key = 'legal';

INSERT INTO public.vertical_bpmn_templates (vertical_pack_id, template_key, template_name, description, process_definition, is_default)
SELECT id, 'case_close', 'Cierre de Expediente', 'Proceso de finalización de caso',
  '{"nodes": [{"id": "start", "type": "start", "label": "Resolución Caso"}, {"id": "review", "type": "task", "label": "Revisión Final"}, {"id": "pending", "type": "task", "label": "Facturar Pendiente"}, {"id": "archive", "type": "task", "label": "Archivar Docs"}, {"id": "notify", "type": "task", "label": "Notificar Cliente"}, {"id": "close", "type": "task", "label": "Cerrar Expediente"}, {"id": "end", "type": "end", "label": "Archivado"}], "edges": [{"source": "start", "target": "review"}, {"source": "review", "target": "pending"}, {"source": "pending", "target": "archive"}, {"source": "archive", "target": "notify"}, {"source": "notify", "target": "close"}, {"source": "close", "target": "end"}]}'::jsonb,
  false
FROM vertical_packs WHERE vertical_key = 'legal';

-- Insert integrations for each vertical
-- RETAIL INTEGRATIONS
INSERT INTO public.vertical_integrations (vertical_pack_id, integration_key, integration_name, provider, api_type, is_required)
SELECT id, 'ticketbai', 'TicketBAI', 'Hacienda Foral', 'rest', true
FROM vertical_packs WHERE vertical_key = 'retail';

INSERT INTO public.vertical_integrations (vertical_pack_id, integration_key, integration_name, provider, api_type, is_required)
SELECT id, 'verifactu', 'VeriFactu', 'AEAT', 'rest', true
FROM vertical_packs WHERE vertical_key = 'retail';

INSERT INTO public.vertical_integrations (vertical_pack_id, integration_key, integration_name, provider, api_type, is_required)
SELECT id, 'tpv', 'Terminal Punto de Venta', 'Varios', 'rest', false
FROM vertical_packs WHERE vertical_key = 'retail';

-- CONSTRUCTION INTEGRATIONS
INSERT INTO public.vertical_integrations (vertical_pack_id, integration_key, integration_name, provider, api_type, is_required)
SELECT id, 'presto', 'Presto', 'RIB Software', 'rest', false
FROM vertical_packs WHERE vertical_key = 'construction';

INSERT INTO public.vertical_integrations (vertical_pack_id, integration_key, integration_name, provider, api_type, is_required)
SELECT id, 'bim', 'BIM/IFC', 'buildingSMART', 'rest', false
FROM vertical_packs WHERE vertical_key = 'construction';

INSERT INTO public.vertical_integrations (vertical_pack_id, integration_key, integration_name, provider, api_type, is_required)
SELECT id, 'cad', 'AutoCAD/DWG', 'Autodesk', 'rest', false
FROM vertical_packs WHERE vertical_key = 'construction';

-- HEALTHCARE INTEGRATIONS
INSERT INTO public.vertical_integrations (vertical_pack_id, integration_key, integration_name, provider, api_type, is_required)
SELECT id, 'hl7', 'HL7 FHIR', 'HL7 International', 'rest', false
FROM vertical_packs WHERE vertical_key = 'healthcare';

INSERT INTO public.vertical_integrations (vertical_pack_id, integration_key, integration_name, provider, api_type, is_required)
SELECT id, 'insurers', 'Aseguradoras', 'Varios', 'rest', false
FROM vertical_packs WHERE vertical_key = 'healthcare';

INSERT INTO public.vertical_integrations (vertical_pack_id, integration_key, integration_name, provider, api_type, is_required)
SELECT id, 'receta', 'Receta Electrónica', 'SNS', 'rest', false
FROM vertical_packs WHERE vertical_key = 'healthcare';

-- LOGISTICS INTEGRATIONS
INSERT INTO public.vertical_integrations (vertical_pack_id, integration_key, integration_name, provider, api_type, is_required)
SELECT id, 'gps', 'GPS Tracking', 'Varios', 'rest', true
FROM vertical_packs WHERE vertical_key = 'logistics';

INSERT INTO public.vertical_integrations (vertical_pack_id, integration_key, integration_name, provider, api_type, is_required)
SELECT id, 'tms', 'TMS', 'Varios', 'rest', false
FROM vertical_packs WHERE vertical_key = 'logistics';

INSERT INTO public.vertical_integrations (vertical_pack_id, integration_key, integration_name, provider, api_type, is_required)
SELECT id, 'wms', 'WMS', 'Varios', 'rest', false
FROM vertical_packs WHERE vertical_key = 'logistics';

-- LEGAL INTEGRATIONS
INSERT INTO public.vertical_integrations (vertical_pack_id, integration_key, integration_name, provider, api_type, is_required)
SELECT id, 'lexnet', 'LexNET', 'CGPJ', 'soap', true
FROM vertical_packs WHERE vertical_key = 'legal';

INSERT INTO public.vertical_integrations (vertical_pack_id, integration_key, integration_name, provider, api_type, is_required)
SELECT id, 'digital_signature', 'Firma Digital', 'Varios', 'rest', true
FROM vertical_packs WHERE vertical_key = 'legal';

INSERT INTO public.vertical_integrations (vertical_pack_id, integration_key, integration_name, provider, api_type, is_required)
SELECT id, 'docusign', 'DocuSign', 'DocuSign', 'rest', false
FROM vertical_packs WHERE vertical_key = 'legal';

-- Create updated_at trigger for vertical tables
CREATE OR REPLACE FUNCTION update_vertical_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vertical_packs_updated_at
  BEFORE UPDATE ON vertical_packs
  FOR EACH ROW EXECUTE FUNCTION update_vertical_updated_at();

CREATE TRIGGER update_vertical_modules_updated_at
  BEFORE UPDATE ON vertical_modules
  FOR EACH ROW EXECUTE FUNCTION update_vertical_updated_at();