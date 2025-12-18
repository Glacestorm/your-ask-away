-- =============================================
-- FASE 6: Analytics & Métricas del Contenido
-- =============================================

-- Tabla 1: cms_page_analytics - Métricas por página
CREATE TABLE public.cms_page_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES cms_pages(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL,
  page_title TEXT,
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_time_on_page NUMERIC DEFAULT 0,
  bounce_rate NUMERIC DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_cms_page_analytics_date ON cms_page_analytics(page_path, date);
CREATE INDEX idx_cms_page_analytics_views ON cms_page_analytics(views DESC);

-- Tabla 2: cms_content_engagement - Engagement por contenido
CREATE TABLE public.cms_content_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'page',
  content_title TEXT,
  clicks INTEGER DEFAULT 0,
  scroll_depth NUMERIC DEFAULT 0,
  shares INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  avg_read_time NUMERIC DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_cms_content_engagement_date ON cms_content_engagement(content_id, date);
CREATE INDEX idx_cms_content_engagement_clicks ON cms_content_engagement(clicks DESC);

-- Tabla 3: cms_realtime_visitors - Visitantes en tiempo real
CREATE TABLE public.cms_realtime_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT DEFAULT 'desktop',
  country TEXT,
  city TEXT,
  is_active BOOLEAN DEFAULT true,
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_activity TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cms_realtime_visitors_active ON cms_realtime_visitors(is_active, last_activity DESC);
CREATE INDEX idx_cms_realtime_visitors_session ON cms_realtime_visitors(session_id);

-- Enable RLS
ALTER TABLE cms_page_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_content_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_realtime_visitors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cms_page_analytics
CREATE POLICY "Admins can manage page analytics"
ON cms_page_analytics FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view page analytics"
ON cms_page_analytics FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert page analytics"
ON cms_page_analytics FOR INSERT
WITH CHECK (true);

-- RLS Policies for cms_content_engagement
CREATE POLICY "Admins can manage content engagement"
ON cms_content_engagement FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view content engagement"
ON cms_content_engagement FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert content engagement"
ON cms_content_engagement FOR INSERT
WITH CHECK (true);

-- RLS Policies for cms_realtime_visitors
CREATE POLICY "Admins can manage realtime visitors"
ON cms_realtime_visitors FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view realtime visitors"
ON cms_realtime_visitors FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage realtime visitors"
ON cms_realtime_visitors FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update realtime visitors"
ON cms_realtime_visitors FOR UPDATE
USING (true);

-- =============================================
-- SEED DATA - Datos de demo para los últimos 30 días
-- =============================================

-- Insertar datos de analytics para páginas principales
INSERT INTO cms_page_analytics (page_path, page_title, views, unique_visitors, avg_time_on_page, bounce_rate, conversions, conversion_rate, date)
SELECT 
  path,
  title,
  (RANDOM() * 500 + 100)::INTEGER as views,
  (RANDOM() * 200 + 50)::INTEGER as unique_visitors,
  (RANDOM() * 180 + 60)::NUMERIC as avg_time_on_page,
  (RANDOM() * 40 + 20)::NUMERIC as bounce_rate,
  (RANDOM() * 20 + 5)::INTEGER as conversions,
  (RANDOM() * 8 + 2)::NUMERIC as conversion_rate,
  (CURRENT_DATE - (day || ' days')::INTERVAL)::DATE as date
FROM (
  VALUES 
    ('/store', 'Tienda'),
    ('/store/modules', 'Módulos'),
    ('/store/deployment', 'Deployment'),
    ('/login', 'Login'),
    ('/register', 'Registro'),
    ('/about', 'Sobre Nosotros'),
    ('/contact', 'Contacto'),
    ('/pricing', 'Precios'),
    ('/features', 'Características'),
    ('/demo', 'Demo')
) AS pages(path, title)
CROSS JOIN generate_series(0, 29) AS day;

-- Insertar datos de engagement
INSERT INTO cms_content_engagement (content_id, content_type, content_title, clicks, scroll_depth, shares, likes, comments_count, avg_read_time, date)
SELECT 
  gen_random_uuid() as content_id,
  'page' as content_type,
  title,
  (RANDOM() * 300 + 50)::INTEGER as clicks,
  (RANDOM() * 60 + 30)::NUMERIC as scroll_depth,
  (RANDOM() * 50 + 5)::INTEGER as shares,
  (RANDOM() * 100 + 20)::INTEGER as likes,
  (RANDOM() * 30 + 2)::INTEGER as comments_count,
  (RANDOM() * 120 + 30)::NUMERIC as avg_read_time,
  (CURRENT_DATE - (day || ' days')::INTERVAL)::DATE as date
FROM (
  VALUES 
    ('Tienda Principal'),
    ('Catálogo de Módulos'),
    ('Guía de Instalación'),
    ('Blog: Novedades'),
    ('Documentación API'),
    ('Centro de Ayuda'),
    ('Casos de Éxito'),
    ('Política de Privacidad')
) AS content(title)
CROSS JOIN generate_series(0, 29) AS day;

-- Insertar visitantes activos simulados
INSERT INTO cms_realtime_visitors (session_id, page_path, page_title, device_type, country, city, is_active, last_activity)
VALUES 
  ('sess_001', '/store', 'Tienda', 'desktop', 'España', 'Madrid', true, NOW() - INTERVAL '1 minute'),
  ('sess_002', '/store/modules', 'Módulos', 'mobile', 'España', 'Barcelona', true, NOW() - INTERVAL '2 minutes'),
  ('sess_003', '/pricing', 'Precios', 'desktop', 'Francia', 'París', true, NOW() - INTERVAL '30 seconds'),
  ('sess_004', '/about', 'Sobre Nosotros', 'tablet', 'Andorra', 'Andorra la Vella', true, NOW() - INTERVAL '3 minutes'),
  ('sess_005', '/contact', 'Contacto', 'desktop', 'Portugal', 'Lisboa', true, NOW() - INTERVAL '1 minute'),
  ('sess_006', '/store/deployment', 'Deployment', 'mobile', 'España', 'Valencia', true, NOW() - INTERVAL '45 seconds'),
  ('sess_007', '/demo', 'Demo', 'desktop', 'México', 'Ciudad de México', true, NOW() - INTERVAL '2 minutes'),
  ('sess_008', '/features', 'Características', 'desktop', 'Argentina', 'Buenos Aires', true, NOW() - INTERVAL '4 minutes'),
  ('sess_009', '/store', 'Tienda', 'mobile', 'Chile', 'Santiago', true, NOW() - INTERVAL '1 minute'),
  ('sess_010', '/login', 'Login', 'desktop', 'Colombia', 'Bogotá', true, NOW() - INTERVAL '30 seconds'),
  ('sess_011', '/store/modules', 'Módulos', 'desktop', 'Perú', 'Lima', true, NOW() - INTERVAL '5 minutes'),
  ('sess_012', '/pricing', 'Precios', 'tablet', 'España', 'Sevilla', true, NOW() - INTERVAL '2 minutes');