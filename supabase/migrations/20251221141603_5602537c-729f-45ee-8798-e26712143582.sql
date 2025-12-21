-- Add unique constraint on source_url for news_articles to support upsert
ALTER TABLE public.news_articles 
ADD CONSTRAINT news_articles_source_url_unique UNIQUE (source_url);