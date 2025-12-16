-- Table for organization compliance documents (official + internal)
CREATE TABLE IF NOT EXISTS public.organization_compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('official_regulation', 'internal_policy', 'procedure', 'training_material', 'audit_report')),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  file_url TEXT,
  sector TEXT,
  sector_key TEXT,
  regulation_source TEXT,
  effective_date DATE,
  expiry_date DATE,
  version TEXT DEFAULT '1.0',
  is_mandatory BOOLEAN DEFAULT false,
  requires_acknowledgment BOOLEAN DEFAULT false,
  acknowledgment_deadline DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived', 'superseded')),
  parent_document_id UUID REFERENCES public.organization_compliance_documents(id),
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for employee acknowledgments
CREATE TABLE IF NOT EXISTS public.compliance_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.organization_compliance_documents(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  signature_hash TEXT,
  notes TEXT,
  UNIQUE(document_id, employee_id)
);

-- Table for compliance requirements
CREATE TABLE IF NOT EXISTS public.compliance_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.organization_compliance_documents(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  requirement_key TEXT NOT NULL,
  requirement_title TEXT NOT NULL,
  requirement_description TEXT,
  category TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'compliant', 'non_compliant', 'not_applicable')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  evidence_urls TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for compliance review tasks
CREATE TABLE IF NOT EXISTS public.compliance_review_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.organization_compliance_documents(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES public.compliance_requirements(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id),
  task_type TEXT NOT NULL CHECK (task_type IN ('review', 'update', 'acknowledge', 'audit', 'training')),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  result TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for regulation update notifications
CREATE TABLE IF NOT EXISTS public.regulation_update_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regulation_id UUID REFERENCES public.organization_compliance_documents(id) ON DELETE CASCADE,
  sector TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('new_regulation', 'update', 'deadline', 'expiry')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  affected_organizations UUID[],
  notified_users UUID[],
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_review_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulation_update_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies using existing functions
CREATE POLICY "Admins can manage compliance documents"
ON public.organization_compliance_documents FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view active compliance documents"
ON public.organization_compliance_documents FOR SELECT
USING (status = 'active' OR created_by = auth.uid());

CREATE POLICY "Users can manage their own acknowledgments"
ON public.compliance_acknowledgments FOR ALL
USING (employee_id = auth.uid());

CREATE POLICY "Admins can view all acknowledgments"
ON public.compliance_acknowledgments FOR SELECT
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can manage compliance requirements"
ON public.compliance_requirements FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view compliance requirements"
ON public.compliance_requirements FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view assigned tasks"
ON public.compliance_review_tasks FOR SELECT
USING (assigned_to = auth.uid() OR is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can update assigned tasks"
ON public.compliance_review_tasks FOR UPDATE
USING (assigned_to = auth.uid());

CREATE POLICY "Admins can manage all tasks"
ON public.compliance_review_tasks FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view notifications"
ON public.regulation_update_notifications FOR SELECT
USING (auth.uid() = ANY(notified_users) OR is_admin_or_superadmin(auth.uid()));

-- Triggers
CREATE TRIGGER update_organization_compliance_documents_updated_at
  BEFORE UPDATE ON public.organization_compliance_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_requirements_updated_at
  BEFORE UPDATE ON public.compliance_requirements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_review_tasks_updated_at
  BEFORE UPDATE ON public.compliance_review_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_org_compliance_docs_sector ON public.organization_compliance_documents(sector);
CREATE INDEX idx_org_compliance_docs_type ON public.organization_compliance_documents(document_type);
CREATE INDEX idx_org_compliance_docs_org ON public.organization_compliance_documents(organization_id);
CREATE INDEX idx_compliance_acks_employee ON public.compliance_acknowledgments(employee_id);
CREATE INDEX idx_compliance_acks_document ON public.compliance_acknowledgments(document_id);
CREATE INDEX idx_compliance_reqs_org ON public.compliance_requirements(organization_id);
CREATE INDEX idx_compliance_tasks_assigned ON public.compliance_review_tasks(assigned_to);
CREATE INDEX idx_compliance_tasks_status ON public.compliance_review_tasks(status);