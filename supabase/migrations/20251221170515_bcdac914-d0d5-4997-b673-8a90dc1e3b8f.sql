-- Tabla de categorías FAQ
CREATE TABLE public.faq_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT 'HelpCircle',
  color TEXT DEFAULT 'blue',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de preguntas frecuentes
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category_id UUID REFERENCES public.faq_categories(id) ON DELETE SET NULL,
  priority INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de preguntas de visitantes (aprendizaje)
CREATE TABLE public.visitor_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  response TEXT,
  session_id TEXT,
  source TEXT DEFAULT 'chatbot',
  matched_faq_id UUID REFERENCES public.faqs(id) ON DELETE SET NULL,
  confidence_score NUMERIC,
  resolved BOOLEAN DEFAULT false,
  converted_to_faq BOOLEAN DEFAULT false,
  ip_country TEXT,
  user_agent TEXT,
  sentiment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsquedas
CREATE INDEX idx_faqs_category ON public.faqs(category_id);
CREATE INDEX idx_faqs_published ON public.faqs(is_published) WHERE is_published = true;
CREATE INDEX idx_visitor_questions_created ON public.visitor_questions(created_at DESC);
CREATE INDEX idx_visitor_questions_resolved ON public.visitor_questions(resolved);

-- Enable RLS
ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_questions ENABLE ROW LEVEL SECURITY;

-- Políticas públicas de lectura para FAQs y categorías
CREATE POLICY "FAQs are publicly readable" ON public.faqs
  FOR SELECT USING (is_published = true);

CREATE POLICY "FAQ categories are publicly readable" ON public.faq_categories
  FOR SELECT USING (is_active = true);

-- Políticas para insertar preguntas de visitantes (anónimo)
CREATE POLICY "Anyone can insert visitor questions" ON public.visitor_questions
  FOR INSERT WITH CHECK (true);

-- Políticas de administración (usuarios autenticados)
CREATE POLICY "Authenticated users can manage FAQs" ON public.faqs
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage FAQ categories" ON public.faq_categories
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage visitor questions" ON public.visitor_questions
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Insertar categorías iniciales
INSERT INTO public.faq_categories (name, slug, icon, color, order_index) VALUES
  ('Precios', 'precios', 'Euro', 'emerald', 1),
  ('Implementación', 'implementacion', 'Rocket', 'blue', 2),
  ('Migración', 'migracion', 'ArrowRightLeft', 'purple', 3),
  ('Módulos', 'modulos', 'Blocks', 'orange', 4),
  ('Soporte', 'soporte', 'Headphones', 'pink', 5),
  ('Seguridad', 'seguridad', 'Shield', 'red', 6);

-- Insertar FAQs iniciales
INSERT INTO public.faqs (question, answer, category_id, priority, is_published) VALUES
  (
    '¿Qué coste tiene implementar Odoo?',
    'El coste de implementación de Odoo varía según el tamaño de tu empresa y los módulos necesarios. Ofrecemos desde implementaciones básicas a partir de 3.000€ hasta proyectos enterprise personalizados. Incluimos análisis inicial gratuito para darte un presupuesto exacto sin compromiso.',
    (SELECT id FROM public.faq_categories WHERE slug = 'precios'),
    100,
    true
  ),
  (
    '¿Cuánto tarda una implementación?',
    'Una implementación típica tarda entre 4-12 semanas dependiendo de la complejidad. Implementaciones básicas (CRM + Ventas) pueden estar listas en 4 semanas. Proyectos con fabricación, contabilidad avanzada y personalizaciones pueden extenderse a 3-6 meses. Usamos metodología ágil con entregables semanales.',
    (SELECT id FROM public.faq_categories WHERE slug = 'implementacion'),
    95,
    true
  ),
  (
    '¿Puedo migrar desde mi ERP actual?',
    'Sí, tenemos amplia experiencia migrando desde SAP, Sage, Navision, A3 y otros ERPs. Nuestro proceso incluye: análisis de datos actuales, mapeo de campos, migración de históricos, y validación completa. Garantizamos la integridad de tus datos con pruebas exhaustivas antes del go-live.',
    (SELECT id FROM public.faq_categories WHERE slug = 'migracion'),
    90,
    true
  ),
  (
    '¿Qué módulos son obligatorios?',
    'Solo el módulo base es obligatorio. Después puedes elegir libremente: CRM, Ventas, Compras, Inventario, Facturación, Contabilidad, Fabricación, Proyectos, RRHH, etc. Te asesoramos sobre qué módulos necesitas según tu sector y tamaño de empresa.',
    (SELECT id FROM public.faq_categories WHERE slug = 'modulos'),
    85,
    true
  ),
  (
    '¿Ofrecéis soporte post-implementación?',
    'Sí, todos nuestros proyectos incluyen 3 meses de soporte incluido. Después ofrecemos planes de mantenimiento desde 200€/mes que incluyen: soporte técnico prioritario, actualizaciones, formación continua y mejoras funcionales.',
    (SELECT id FROM public.faq_categories WHERE slug = 'soporte'),
    80,
    true
  ),
  (
    '¿Es seguro Odoo para datos sensibles?',
    'Absolutamente. Odoo cumple con RGPD y ofrece: cifrado de datos en reposo y tránsito, autenticación de dos factores, control de acceso por roles, auditoría de acciones, y copias de seguridad automáticas. Podemos alojar en servidores europeos certificados ISO 27001.',
    (SELECT id FROM public.faq_categories WHERE slug = 'seguridad'),
    75,
    true
  ),
  (
    '¿Puedo probar Odoo antes de comprar?',
    'Sí, ofrecemos demos personalizadas gratuitas donde te mostramos cómo funcionaría Odoo con tus procesos específicos. También puedes acceder a un entorno de prueba durante 14 días para que tu equipo lo evalúe.',
    (SELECT id FROM public.faq_categories WHERE slug = 'precios'),
    70,
    true
  ),
  (
    '¿Odoo funciona en la nube o instalado?',
    'Ambas opciones. Odoo.sh es la nube oficial con actualizaciones automáticas y alta disponibilidad. También ofrecemos instalación on-premise para empresas que requieren control total de sus datos. Te ayudamos a elegir la mejor opción según tus necesidades de seguridad y presupuesto.',
    (SELECT id FROM public.faq_categories WHERE slug = 'implementacion'),
    65,
    true
  );

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_faq_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION update_faq_updated_at();

CREATE TRIGGER update_faq_categories_updated_at
  BEFORE UPDATE ON public.faq_categories
  FOR EACH ROW EXECUTE FUNCTION update_faq_updated_at();