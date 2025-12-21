-- Add image_credit column to news_articles for legal attribution
ALTER TABLE public.news_articles 
ADD COLUMN IF NOT EXISTS image_credit TEXT;