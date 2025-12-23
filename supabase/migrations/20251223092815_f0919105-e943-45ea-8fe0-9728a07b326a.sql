-- Create saved news (favorites) table
CREATE TABLE public.saved_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL,
  saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, article_id)
);

-- Enable RLS
ALTER TABLE public.saved_news ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their saved news"
  ON public.saved_news FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save news"
  ON public.saved_news FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave news"
  ON public.saved_news FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_saved_news_user_id ON public.saved_news(user_id);
CREATE INDEX idx_saved_news_article_id ON public.saved_news(article_id);