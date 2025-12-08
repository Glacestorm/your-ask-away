-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table for financial document embeddings
CREATE TABLE public.financial_document_embeddings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    statement_id UUID REFERENCES public.company_financial_statements(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- 'balance_sheet', 'income_statement', 'cash_flow', 'notes', 'pdf_import'
    fiscal_year INTEGER NOT NULL,
    chunk_index INTEGER NOT NULL DEFAULT 0,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for vector similarity search
CREATE INDEX ON public.financial_document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create indexes for common queries
CREATE INDEX idx_fin_embeddings_company ON public.financial_document_embeddings(company_id);
CREATE INDEX idx_fin_embeddings_year ON public.financial_document_embeddings(fiscal_year);
CREATE INDEX idx_fin_embeddings_type ON public.financial_document_embeddings(document_type);

-- Create table for RAG chat history
CREATE TABLE public.financial_rag_conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.financial_rag_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.financial_rag_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_rag_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_rag_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for embeddings (same as financial statements)
CREATE POLICY "Users can view embeddings" ON public.financial_document_embeddings
    FOR SELECT USING (
        is_admin_or_superadmin(auth.uid()) OR
        has_role(auth.uid(), 'director_comercial') OR
        has_role(auth.uid(), 'responsable_comercial') OR
        has_role(auth.uid(), 'director_oficina')
    );

CREATE POLICY "Admins can manage embeddings" ON public.financial_document_embeddings
    FOR ALL USING (is_admin_or_superadmin(auth.uid()));

-- RLS policies for conversations
CREATE POLICY "Users can view own conversations" ON public.financial_rag_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversations" ON public.financial_rag_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.financial_rag_conversations
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for messages
CREATE POLICY "Users can view messages in own conversations" ON public.financial_rag_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.financial_rag_conversations c
            WHERE c.id = conversation_id AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in own conversations" ON public.financial_rag_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.financial_rag_conversations c
            WHERE c.id = conversation_id AND c.user_id = auth.uid()
        )
    );

-- Function to search similar embeddings
CREATE OR REPLACE FUNCTION public.search_financial_embeddings(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5,
    filter_company_id UUID DEFAULT NULL,
    filter_fiscal_year INT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    company_id UUID,
    statement_id UUID,
    document_type TEXT,
    fiscal_year INT,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.company_id,
        e.statement_id,
        e.document_type,
        e.fiscal_year,
        e.content,
        e.metadata,
        1 - (e.embedding <=> query_embedding) AS similarity
    FROM public.financial_document_embeddings e
    WHERE 
        1 - (e.embedding <=> query_embedding) > match_threshold
        AND (filter_company_id IS NULL OR e.company_id = filter_company_id)
        AND (filter_fiscal_year IS NULL OR e.fiscal_year = filter_fiscal_year)
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;