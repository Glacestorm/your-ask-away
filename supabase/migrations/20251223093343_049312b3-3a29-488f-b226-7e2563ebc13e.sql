-- Create function to increment read count
CREATE OR REPLACE FUNCTION public.increment_read_count(article_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.news_articles
  SET read_count = COALESCE(read_count, 0) + 1
  WHERE id = article_id;
END;
$$;