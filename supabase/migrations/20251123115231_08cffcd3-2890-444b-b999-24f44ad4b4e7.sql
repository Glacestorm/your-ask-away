-- Create table for practice comments
CREATE TABLE public.best_practice_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES public.best_practices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.best_practice_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.best_practice_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
CREATE POLICY "Anyone can view comments"
  ON public.best_practice_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.best_practice_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.best_practice_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.best_practice_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_best_practice_comments_practice_id ON public.best_practice_comments(practice_id);
CREATE INDEX idx_best_practice_comments_user_id ON public.best_practice_comments(user_id);
CREATE INDEX idx_best_practice_comments_parent_id ON public.best_practice_comments(parent_id);
CREATE INDEX idx_best_practice_comments_created_at ON public.best_practice_comments(created_at DESC);

-- Enable realtime for comments
ALTER TABLE public.best_practice_comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.best_practice_comments;

-- Trigger for updating updated_at
CREATE TRIGGER update_best_practice_comments_updated_at
BEFORE UPDATE ON public.best_practice_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();