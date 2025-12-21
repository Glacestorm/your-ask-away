-- Add new fields to news_articles for product connection and insights
ALTER TABLE public.news_articles 
ADD COLUMN IF NOT EXISTS product_connection TEXT,
ADD COLUMN IF NOT EXISTS product_relevance_reason TEXT,
ADD COLUMN IF NOT EXISTS importance_level TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archive_reason TEXT,
ADD COLUMN IF NOT EXISTS detected_trends TEXT[],
ADD COLUMN IF NOT EXISTS improvement_suggestions TEXT,
ADD COLUMN IF NOT EXISTS improvement_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS read_count INTEGER DEFAULT 0;

-- Create news_admin_config table for system settings
CREATE TABLE IF NOT EXISTS public.news_admin_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default configuration
INSERT INTO public.news_admin_config (setting_key, setting_value, description) VALUES
  ('fetch_periodicity', '{"hours": 4}', 'Periodicidad de actualización de noticias en horas'),
  ('retention_days', '{"days": 90}', 'Días de retención del histórico de noticias'),
  ('min_relevance_score', '{"score": 50}', 'Puntuación mínima de relevancia para guardar noticia'),
  ('auto_archive_important', '{"enabled": true}', 'Archivar automáticamente noticias críticas'),
  ('keywords', '{"included": ["RGPD", "protección de datos", "ciberseguridad", "compliance", "LOPD", "normativa", "auditoría", "digitalización", "IA", "inteligencia artificial", "automatización", "empresas", "pymes", "subvenciones", "ayudas"], "excluded": []}', 'Keywords para filtrar noticias'),
  ('notification_email', '{"emails": [], "enabled": false}', 'Configuración de notificaciones por email')
ON CONFLICT (setting_key) DO NOTHING;

-- Create news_fetch_logs table for execution logs
CREATE TABLE IF NOT EXISTS public.news_fetch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  duration_ms INTEGER,
  articles_fetched INTEGER DEFAULT 0,
  articles_processed INTEGER DEFAULT 0,
  articles_saved INTEGER DEFAULT 0,
  errors TEXT[],
  warnings TEXT[],
  sources_status JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create news_improvement_insights table
CREATE TABLE IF NOT EXISTS public.news_improvement_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_article_id UUID REFERENCES public.news_articles(id) ON DELETE SET NULL,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  ai_recommendation TEXT,
  detected_from_trends TEXT[],
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create news_weekly_reports table
CREATE TABLE IF NOT EXISTS public.news_weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  report_data JSONB NOT NULL DEFAULT '{}',
  summary TEXT,
  top_news JSONB,
  detected_trends JSONB,
  improvement_proposals JSONB,
  statistics JSONB,
  sent_to_emails TEXT[],
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create news_sources table for managing RSS sources
CREATE TABLE IF NOT EXISTS public.news_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  articles_fetched INTEGER DEFAULT 0,
  articles_relevant INTEGER DEFAULT 0,
  last_fetch_at TIMESTAMP WITH TIME ZONE,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default news sources
INSERT INTO public.news_sources (name, url, category) VALUES
  ('El Economista - Legal', 'https://www.eleconomista.es/rss/rss-legal.php', 'Legal'),
  ('El Economista - Tecnología', 'https://www.eleconomista.es/rss/rss-tecnologia.php', 'Tecnología'),
  ('Cinco Días - Economía', 'https://cincodias.elpais.com/rss/cincodias/economia.xml', 'Economía'),
  ('Expansión - Jurídico', 'https://e00-expansion.uecdn.es/rss/juridico.xml', 'Legal'),
  ('Computing - Seguridad', 'https://www.computing.es/rss/seguridad/', 'Ciberseguridad'),
  ('INCIBE - Avisos', 'https://www.incibe.es/rss/avisos-seguridad-empresas.xml', 'Ciberseguridad'),
  ('BOE - Disposiciones', 'https://www.boe.es/rss/boe.php?s=1', 'Normativa'),
  ('La Moncloa - Economía', 'https://www.lamoncloa.gob.es/serviciosdeprensa/rss/paginas/economiaempresa.aspx', 'Economía'),
  ('Europa Press - Economía', 'https://www.europapress.es/rss/rss.aspx?ch=136', 'Economía'),
  ('AEPD - Noticias', 'https://www.aepd.es/es/prensa-y-comunicacion/notas-de-prensa/rss.xml', 'Protección Datos')
ON CONFLICT (url) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.news_admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_fetch_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_improvement_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for news_admin_config (admin only)
CREATE POLICY "Admin can manage news config" ON public.news_admin_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

CREATE POLICY "Anyone can read news config" ON public.news_admin_config
  FOR SELECT USING (true);

-- Create RLS policies for news_fetch_logs (admin only)
CREATE POLICY "Admin can manage fetch logs" ON public.news_fetch_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

-- Create RLS policies for news_improvement_insights
CREATE POLICY "Admin can manage insights" ON public.news_improvement_insights
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

CREATE POLICY "Authenticated users can read insights" ON public.news_improvement_insights
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create RLS policies for news_weekly_reports
CREATE POLICY "Admin can manage weekly reports" ON public.news_weekly_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

CREATE POLICY "Authenticated users can read reports" ON public.news_weekly_reports
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create RLS policies for news_sources
CREATE POLICY "Admin can manage news sources" ON public.news_sources
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

CREATE POLICY "Anyone can read news sources" ON public.news_sources
  FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_news_articles_importance ON public.news_articles(importance_level);
CREATE INDEX IF NOT EXISTS idx_news_articles_archived ON public.news_articles(is_archived);
CREATE INDEX IF NOT EXISTS idx_news_articles_improvement_status ON public.news_articles(improvement_status);
CREATE INDEX IF NOT EXISTS idx_news_insights_status ON public.news_improvement_insights(status);
CREATE INDEX IF NOT EXISTS idx_news_fetch_logs_time ON public.news_fetch_logs(execution_time DESC);
CREATE INDEX IF NOT EXISTS idx_news_weekly_reports_week ON public.news_weekly_reports(week_start DESC);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_news_tables_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_news_sources_timestamp
  BEFORE UPDATE ON public.news_sources
  FOR EACH ROW EXECUTE FUNCTION update_news_tables_timestamp();

CREATE TRIGGER update_news_insights_timestamp
  BEFORE UPDATE ON public.news_improvement_insights
  FOR EACH ROW EXECUTE FUNCTION update_news_tables_timestamp();

CREATE TRIGGER update_news_config_timestamp
  BEFORE UPDATE ON public.news_admin_config
  FOR EACH ROW EXECUTE FUNCTION update_news_tables_timestamp();