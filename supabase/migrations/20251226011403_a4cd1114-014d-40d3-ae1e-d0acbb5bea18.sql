-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge Base Articles Table
CREATE TABLE public.knowledge_articles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    author_id UUID REFERENCES auth.users(id),
    version INTEGER NOT NULL DEFAULT 1,
    view_count INTEGER NOT NULL DEFAULT 0,
    helpful_count INTEGER NOT NULL DEFAULT 0,
    not_helpful_count INTEGER NOT NULL DEFAULT 0,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}'::JSONB,
    source_type TEXT DEFAULT 'manual' CHECK (source_type IN ('manual', 'imported', 'ai_generated')),
    source_url TEXT,
    language TEXT DEFAULT 'es',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Knowledge Article Versions Table (for version history)
CREATE TABLE public.knowledge_article_versions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    changed_by UUID REFERENCES auth.users(id),
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Knowledge Search Logs Table (for analytics)
CREATE TABLE public.knowledge_search_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    query TEXT NOT NULL,
    query_type TEXT NOT NULL DEFAULT 'search' CHECK (query_type IN ('search', 'ask')),
    user_id UUID REFERENCES auth.users(id),
    results_count INTEGER NOT NULL DEFAULT 0,
    top_result_id UUID REFERENCES public.knowledge_articles(id) ON DELETE SET NULL,
    was_helpful BOOLEAN,
    response_time_ms INTEGER,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Knowledge User Feedback Table
CREATE TABLE public.knowledge_user_feedback (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    is_helpful BOOLEAN NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_article_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_user_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_articles
CREATE POLICY "Published articles are viewable by everyone" 
ON public.knowledge_articles 
FOR SELECT 
USING (status = 'published');

CREATE POLICY "Authors can view their own articles" 
ON public.knowledge_articles 
FOR SELECT 
USING (auth.uid() = author_id);

CREATE POLICY "Admins can view all articles" 
ON public.knowledge_articles 
FOR SELECT 
USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can insert articles" 
ON public.knowledge_articles 
FOR INSERT 
WITH CHECK (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can update articles" 
ON public.knowledge_articles 
FOR UPDATE 
USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can delete articles" 
ON public.knowledge_articles 
FOR DELETE 
USING (public.is_admin_or_superadmin(auth.uid()));

-- RLS Policies for knowledge_article_versions
CREATE POLICY "Versions are viewable by admins" 
ON public.knowledge_article_versions 
FOR SELECT 
USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can insert versions" 
ON public.knowledge_article_versions 
FOR INSERT 
WITH CHECK (public.is_admin_or_superadmin(auth.uid()));

-- RLS Policies for knowledge_search_logs
CREATE POLICY "Users can insert their own search logs" 
ON public.knowledge_search_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all search logs" 
ON public.knowledge_search_logs 
FOR SELECT 
USING (public.is_admin_or_superadmin(auth.uid()));

-- RLS Policies for knowledge_user_feedback
CREATE POLICY "Users can submit feedback" 
ON public.knowledge_user_feedback 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all feedback" 
ON public.knowledge_user_feedback 
FOR SELECT 
USING (public.is_admin_or_superadmin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_knowledge_articles_category ON public.knowledge_articles(category);
CREATE INDEX idx_knowledge_articles_status ON public.knowledge_articles(status);
CREATE INDEX idx_knowledge_articles_tags ON public.knowledge_articles USING GIN(tags);
CREATE INDEX idx_knowledge_articles_embedding ON public.knowledge_articles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_knowledge_search_logs_created_at ON public.knowledge_search_logs(created_at);
CREATE INDEX idx_knowledge_article_versions_article_id ON public.knowledge_article_versions(article_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_knowledge_article_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to auto-update timestamp
CREATE TRIGGER update_knowledge_articles_updated_at
    BEFORE UPDATE ON public.knowledge_articles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_knowledge_article_timestamp();

-- Function to create version on update
CREATE OR REPLACE FUNCTION public.create_knowledge_article_version()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.content IS DISTINCT FROM NEW.content OR OLD.title IS DISTINCT FROM NEW.title THEN
        INSERT INTO public.knowledge_article_versions (
            article_id, version, title, content, summary, category, tags, changed_by
        ) VALUES (
            OLD.id, OLD.version, OLD.title, OLD.content, OLD.summary, OLD.category, OLD.tags, auth.uid()
        );
        NEW.version = OLD.version + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create version on content/title change
CREATE TRIGGER create_knowledge_article_version_trigger
    BEFORE UPDATE ON public.knowledge_articles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_knowledge_article_version();

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_knowledge_article_view(article_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.knowledge_articles
    SET view_count = view_count + 1
    WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to search articles by vector similarity
CREATE OR REPLACE FUNCTION public.search_knowledge_articles(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    filter_category TEXT DEFAULT NULL,
    filter_status TEXT DEFAULT 'published'
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    summary TEXT,
    category TEXT,
    tags TEXT[],
    similarity FLOAT,
    view_count INT,
    helpful_count INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ka.id,
        ka.title,
        ka.content,
        ka.summary,
        ka.category,
        ka.tags,
        1 - (ka.embedding <=> query_embedding) AS similarity,
        ka.view_count,
        ka.helpful_count
    FROM public.knowledge_articles ka
    WHERE 
        ka.status = filter_status
        AND (filter_category IS NULL OR ka.category = filter_category)
        AND ka.embedding IS NOT NULL
        AND 1 - (ka.embedding <=> query_embedding) > match_threshold
    ORDER BY ka.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;