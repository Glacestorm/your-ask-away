-- FASE 7: Workflow & Editorial Calendar Tables

-- Table for content workflow management
CREATE TABLE IF NOT EXISTS public.cms_content_workflow (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'page',
  content_title TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  assignee UUID REFERENCES auth.users(id),
  reviewer UUID REFERENCES auth.users(id),
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived'))
);

-- Table for workflow history/audit trail
CREATE TABLE IF NOT EXISTS public.cms_workflow_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES public.cms_content_workflow(id) ON DELETE CASCADE,
  content_id UUID NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for editorial calendar
CREATE TABLE IF NOT EXISTS public.cms_editorial_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID,
  workflow_id UUID REFERENCES public.cms_content_workflow(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  channel TEXT DEFAULT 'web',
  status TEXT NOT NULL DEFAULT 'scheduled',
  color TEXT DEFAULT '#3b82f6',
  assignee UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_calendar_status CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.cms_content_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_workflow_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_editorial_calendar ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cms_content_workflow
CREATE POLICY "Admins can manage workflows" ON public.cms_content_workflow
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view assigned workflows" ON public.cms_content_workflow
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      assignee = auth.uid() OR 
      reviewer = auth.uid() OR 
      is_admin_or_superadmin(auth.uid())
    )
  );

CREATE POLICY "Users can update assigned workflows" ON public.cms_content_workflow
  FOR UPDATE USING (
    assignee = auth.uid() OR 
    reviewer = auth.uid() OR 
    is_admin_or_superadmin(auth.uid())
  );

-- RLS Policies for cms_workflow_history
CREATE POLICY "Admins can manage workflow history" ON public.cms_workflow_history
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view workflow history" ON public.cms_workflow_history
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert workflow history" ON public.cms_workflow_history
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for cms_editorial_calendar
CREATE POLICY "Admins can manage editorial calendar" ON public.cms_editorial_calendar
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view editorial calendar" ON public.cms_editorial_calendar
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own calendar items" ON public.cms_editorial_calendar
  FOR ALL USING (
    assignee = auth.uid() OR 
    created_by = auth.uid() OR 
    is_admin_or_superadmin(auth.uid())
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cms_workflow_status ON public.cms_content_workflow(status);
CREATE INDEX IF NOT EXISTS idx_cms_workflow_assignee ON public.cms_content_workflow(assignee);
CREATE INDEX IF NOT EXISTS idx_cms_workflow_due_date ON public.cms_content_workflow(due_date);
CREATE INDEX IF NOT EXISTS idx_cms_calendar_date ON public.cms_editorial_calendar(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_cms_calendar_status ON public.cms_editorial_calendar(status);

-- Insert sample workflow data
INSERT INTO public.cms_content_workflow (content_id, content_type, content_title, status, priority, due_date) VALUES
  (gen_random_uuid(), 'page', 'Página de Inicio Actualizada', 'draft', 'high', now() + interval '3 days'),
  (gen_random_uuid(), 'post', 'Artículo: Nuevas Funcionalidades', 'review', 'medium', now() + interval '5 days'),
  (gen_random_uuid(), 'page', 'Política de Privacidad v2', 'approved', 'low', now() + interval '7 days'),
  (gen_random_uuid(), 'post', 'Comunicado de Prensa Q4', 'published', 'high', now() - interval '2 days'),
  (gen_random_uuid(), 'page', 'FAQ Actualizado', 'draft', 'medium', now() + interval '10 days');

-- Insert sample calendar data
INSERT INTO public.cms_editorial_calendar (title, description, scheduled_date, channel, status, color) VALUES
  ('Lanzamiento Blog Navidad', 'Publicar artículo especial de navidad', CURRENT_DATE + 2, 'blog', 'scheduled', '#ef4444'),
  ('Newsletter Semanal', 'Envío de newsletter con novedades', CURRENT_DATE + 4, 'email', 'scheduled', '#3b82f6'),
  ('Post Redes Sociales', 'Campaña de fin de año', CURRENT_DATE + 5, 'social', 'scheduled', '#8b5cf6'),
  ('Actualización Landing', 'Nuevos testimonios de clientes', CURRENT_DATE + 7, 'web', 'in_progress', '#10b981'),
  ('Webinar Producto', 'Demo de nuevas características', CURRENT_DATE + 10, 'webinar', 'scheduled', '#f59e0b');