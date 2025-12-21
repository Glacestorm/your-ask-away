-- Create news_articles table for auto-fetched news
CREATE TABLE public.news_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  image_url TEXT,
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  tags TEXT[] DEFAULT '{}',
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_featured BOOLEAN DEFAULT false,
  ai_summary TEXT,
  relevance_score INTEGER DEFAULT 50,
  read_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_news_articles_category ON public.news_articles(category);
CREATE INDEX idx_news_articles_published_at ON public.news_articles(published_at DESC);
CREATE INDEX idx_news_articles_is_featured ON public.news_articles(is_featured);
CREATE INDEX idx_news_articles_relevance ON public.news_articles(relevance_score DESC);

-- Enable Row Level Security
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

-- Public read access for news (no auth required to read news)
CREATE POLICY "News articles are publicly readable"
ON public.news_articles
FOR SELECT
USING (true);

-- Only service role can insert/update/delete (for edge functions)
CREATE POLICY "Service role can manage news"
ON public.news_articles
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Enable realtime for news updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.news_articles;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_news_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_news_articles_updated_at
BEFORE UPDATE ON public.news_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_news_updated_at();