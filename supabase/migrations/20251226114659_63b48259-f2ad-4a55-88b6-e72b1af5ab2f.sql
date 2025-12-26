-- =====================================================
-- FASE 2: Base de Conocimiento para Agentes de Soporte
-- =====================================================

-- Tabla de documentos de conocimiento
CREATE TABLE IF NOT EXISTS public.support_knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'article' CHECK (document_type IN ('article', 'faq', 'procedure', 'troubleshooting', 'template', 'script')),
  category TEXT NOT NULL,
  subcategory TEXT,
  tags TEXT[] DEFAULT '{}',
  embedding_status TEXT DEFAULT 'pending' CHECK (embedding_status IN ('pending', 'processing', 'completed', 'failed')),
  embedding_vector DOUBLE PRECISION[],
  source_url TEXT,
  author_id UUID REFERENCES auth.users(id),
  is_published BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_category ON public.support_knowledge_documents(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_type ON public.support_knowledge_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_published ON public.support_knowledge_documents(is_published, is_archived);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_tags ON public.support_knowledge_documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_content_search ON public.support_knowledge_documents USING GIN(to_tsvector('spanish', title || ' ' || content));

-- Tabla de relaciones entre documentos (para recomendaciones)
CREATE TABLE IF NOT EXISTS public.support_knowledge_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id UUID NOT NULL REFERENCES public.support_knowledge_documents(id) ON DELETE CASCADE,
  related_document_id UUID NOT NULL REFERENCES public.support_knowledge_documents(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL DEFAULT 'related' CHECK (relation_type IN ('related', 'parent', 'child', 'alternative', 'supersedes', 'deprecated_by')),
  similarity_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_document_id, related_document_id)
);

-- Tabla de uso de documentos por agentes
CREATE TABLE IF NOT EXISTS public.support_knowledge_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.support_knowledge_documents(id) ON DELETE CASCADE,
  agent_key TEXT NOT NULL,
  session_id UUID REFERENCES public.support_orchestration_sessions(id),
  task_id UUID REFERENCES public.support_agent_tasks(id),
  usage_type TEXT NOT NULL DEFAULT 'reference' CHECK (usage_type IN ('reference', 'suggested', 'applied', 'rejected')),
  relevance_score DECIMAL(3,2),
  feedback_outcome DECIMAL(3,2),
  context_snippet TEXT,
  used_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_usage_doc ON public.support_knowledge_usage(document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_usage_agent ON public.support_knowledge_usage(agent_key);

-- Enable RLS
ALTER TABLE public.support_knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_knowledge_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_knowledge_usage ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para documentos
CREATE POLICY "Authenticated users can view published documents"
  ON public.support_knowledge_documents FOR SELECT
  TO authenticated
  USING (is_published = true OR author_id = auth.uid());

CREATE POLICY "Authenticated users can create documents"
  ON public.support_knowledge_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authors and admins can update documents"
  ON public.support_knowledge_documents FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_role IN ('admin', 'super_admin', 'ceo')
  ));

CREATE POLICY "Admins can delete documents"
  ON public.support_knowledge_documents FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_role IN ('admin', 'super_admin', 'ceo')
  ));

-- Políticas RLS para relaciones
CREATE POLICY "Authenticated users can view knowledge relations"
  ON public.support_knowledge_relations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage knowledge relations"
  ON public.support_knowledge_relations FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Políticas RLS para uso
CREATE POLICY "Authenticated users can view knowledge usage"
  ON public.support_knowledge_usage FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can record knowledge usage"
  ON public.support_knowledge_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER set_knowledge_docs_updated_at
  BEFORE UPDATE ON public.support_knowledge_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_knowledge_documents;