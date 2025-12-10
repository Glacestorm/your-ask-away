-- Table for storing assistant knowledge documents (PDFs, URLs)
CREATE TABLE public.assistant_knowledge_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    document_type TEXT NOT NULL CHECK (document_type IN ('normativas', 'productos', 'procedimientos', 'formularios_internos', 'formularios_clientes')),
    content_type TEXT NOT NULL CHECK (content_type IN ('pdf', 'url', 'text')),
    content TEXT, -- For text content or extracted PDF text
    file_url TEXT, -- For uploaded PDFs
    external_url TEXT, -- For external URLs
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assistant_knowledge_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admins can manage, all authenticated can view
CREATE POLICY "Admins can manage assistant documents"
ON public.assistant_knowledge_documents
FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Authenticated users can view active documents"
ON public.assistant_knowledge_documents
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- Create storage bucket for assistant documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('assistant-documents', 'assistant-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Admins can upload assistant documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'assistant-documents' AND is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can update assistant documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'assistant-documents' AND is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can delete assistant documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'assistant-documents' AND is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Authenticated can view assistant documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'assistant-documents' AND auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_assistant_knowledge_documents_updated_at
BEFORE UPDATE ON public.assistant_knowledge_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_assistant_knowledge_type ON public.assistant_knowledge_documents(document_type, is_active);