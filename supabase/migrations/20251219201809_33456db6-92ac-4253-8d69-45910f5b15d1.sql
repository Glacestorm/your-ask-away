-- =============================================
-- LOW-CODE APP BUILDER SCHEMA
-- =============================================

-- Form Definitions
CREATE TABLE public.lowcode_form_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_key TEXT UNIQUE NOT NULL,
  form_name TEXT NOT NULL,
  description TEXT,
  module_id UUID REFERENCES public.app_modules(id) ON DELETE SET NULL,
  fields JSONB NOT NULL DEFAULT '[]',
  validations JSONB DEFAULT '{}',
  permissions JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  version INTEGER DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Form Submissions
CREATE TABLE public.lowcode_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES public.lowcode_form_definitions(id) ON DELETE CASCADE,
  submitted_by UUID,
  data JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rule Definitions
CREATE TABLE public.lowcode_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_key TEXT UNIQUE NOT NULL,
  description TEXT,
  module_id UUID REFERENCES public.app_modules(id) ON DELETE SET NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('form_submitted', 'record_created', 'record_updated', 'record_deleted', 'schedule', 'manual', 'webhook')),
  trigger_config JSONB NOT NULL DEFAULT '{}',
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rule Executions Log
CREATE TABLE public.lowcode_rule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES public.lowcode_rules(id) ON DELETE CASCADE,
  triggered_by TEXT,
  trigger_data JSONB,
  input_data JSONB,
  output_data JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed', 'skipped')),
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Report Definitions
CREATE TABLE public.lowcode_report_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_key TEXT UNIQUE NOT NULL,
  report_name TEXT NOT NULL,
  description TEXT,
  module_id UUID REFERENCES public.app_modules(id) ON DELETE SET NULL,
  data_source JSONB NOT NULL,
  columns JSONB NOT NULL DEFAULT '[]',
  filters JSONB DEFAULT '[]',
  aggregations JSONB DEFAULT '[]',
  grouping JSONB DEFAULT '[]',
  sorting JSONB DEFAULT '[]',
  visualizations JSONB DEFAULT '[]',
  permissions JSONB DEFAULT '{}',
  export_formats TEXT[] DEFAULT ARRAY['pdf', 'excel', 'csv'],
  schedule JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Page Builder Enhanced
CREATE TABLE public.lowcode_page_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT UNIQUE NOT NULL,
  page_name TEXT NOT NULL,
  description TEXT,
  module_id UUID REFERENCES public.app_modules(id) ON DELETE SET NULL,
  layout JSONB NOT NULL DEFAULT '{}',
  blocks JSONB NOT NULL DEFAULT '[]',
  visibility_rules JSONB DEFAULT '{}',
  data_sources JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Low-code Modules (extends app_modules)
CREATE TABLE public.lowcode_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key TEXT UNIQUE NOT NULL,
  module_name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Box',
  category TEXT DEFAULT 'custom',
  forms UUID[] DEFAULT '{}',
  pages UUID[] DEFAULT '{}',
  rules UUID[] DEFAULT '{}',
  reports UUID[] DEFAULT '{}',
  permissions JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  version INTEGER DEFAULT 1,
  created_by UUID,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lowcode_form_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lowcode_form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lowcode_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lowcode_rule_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lowcode_report_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lowcode_page_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lowcode_modules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form definitions
CREATE POLICY "Users can view published forms" ON public.lowcode_form_definitions
  FOR SELECT USING (status = 'published' OR auth.uid() = created_by);

CREATE POLICY "Authenticated users can create forms" ON public.lowcode_form_definitions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can update their forms" ON public.lowcode_form_definitions
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their forms" ON public.lowcode_form_definitions
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for form submissions
CREATE POLICY "Users can view their submissions" ON public.lowcode_form_submissions
  FOR SELECT USING (auth.uid() = submitted_by OR auth.uid() IN (
    SELECT created_by FROM public.lowcode_form_definitions WHERE id = form_id
  ));

CREATE POLICY "Authenticated users can submit forms" ON public.lowcode_form_submissions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Form owners can update submissions" ON public.lowcode_form_submissions
  FOR UPDATE USING (auth.uid() IN (
    SELECT created_by FROM public.lowcode_form_definitions WHERE id = form_id
  ));

-- RLS Policies for rules
CREATE POLICY "Users can view active rules" ON public.lowcode_rules
  FOR SELECT USING (is_active = true OR auth.uid() = created_by);

CREATE POLICY "Authenticated users can create rules" ON public.lowcode_rules
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can update their rules" ON public.lowcode_rules
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their rules" ON public.lowcode_rules
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for rule executions
CREATE POLICY "Rule creators can view executions" ON public.lowcode_rule_executions
  FOR SELECT USING (auth.uid() IN (
    SELECT created_by FROM public.lowcode_rules WHERE id = rule_id
  ));

CREATE POLICY "System can insert executions" ON public.lowcode_rule_executions
  FOR INSERT WITH CHECK (true);

-- RLS Policies for reports
CREATE POLICY "Users can view published reports" ON public.lowcode_report_definitions
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can create reports" ON public.lowcode_report_definitions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can update their reports" ON public.lowcode_report_definitions
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their reports" ON public.lowcode_report_definitions
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for pages
CREATE POLICY "Users can view published pages" ON public.lowcode_page_definitions
  FOR SELECT USING (status = 'published' OR auth.uid() = created_by);

CREATE POLICY "Authenticated users can create pages" ON public.lowcode_page_definitions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can update their pages" ON public.lowcode_page_definitions
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their pages" ON public.lowcode_page_definitions
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for modules
CREATE POLICY "Users can view published modules" ON public.lowcode_modules
  FOR SELECT USING (status = 'published' OR auth.uid() = created_by);

CREATE POLICY "Authenticated users can create modules" ON public.lowcode_modules
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can update their modules" ON public.lowcode_modules
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their modules" ON public.lowcode_modules
  FOR DELETE USING (auth.uid() = created_by);

-- Indexes for performance
CREATE INDEX idx_lowcode_forms_module ON public.lowcode_form_definitions(module_id);
CREATE INDEX idx_lowcode_forms_status ON public.lowcode_form_definitions(status);
CREATE INDEX idx_lowcode_submissions_form ON public.lowcode_form_submissions(form_id);
CREATE INDEX idx_lowcode_submissions_status ON public.lowcode_form_submissions(status);
CREATE INDEX idx_lowcode_rules_module ON public.lowcode_rules(module_id);
CREATE INDEX idx_lowcode_rules_trigger ON public.lowcode_rules(trigger_type);
CREATE INDEX idx_lowcode_executions_rule ON public.lowcode_rule_executions(rule_id);
CREATE INDEX idx_lowcode_executions_status ON public.lowcode_rule_executions(status);
CREATE INDEX idx_lowcode_reports_module ON public.lowcode_report_definitions(module_id);
CREATE INDEX idx_lowcode_pages_module ON public.lowcode_page_definitions(module_id);
CREATE INDEX idx_lowcode_modules_status ON public.lowcode_modules(status);

-- Updated at triggers
CREATE TRIGGER update_lowcode_form_definitions_updated_at
  BEFORE UPDATE ON public.lowcode_form_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lowcode_form_submissions_updated_at
  BEFORE UPDATE ON public.lowcode_form_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lowcode_rules_updated_at
  BEFORE UPDATE ON public.lowcode_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lowcode_report_definitions_updated_at
  BEFORE UPDATE ON public.lowcode_report_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lowcode_page_definitions_updated_at
  BEFORE UPDATE ON public.lowcode_page_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lowcode_modules_updated_at
  BEFORE UPDATE ON public.lowcode_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();