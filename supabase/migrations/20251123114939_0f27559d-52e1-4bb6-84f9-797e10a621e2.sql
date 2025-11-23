-- Create table for best practices
CREATE TABLE public.best_practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gestor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for tracking likes
CREATE TABLE public.best_practice_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES public.best_practices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(practice_id, user_id)
);

-- Enable RLS
ALTER TABLE public.best_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.best_practice_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for best_practices
CREATE POLICY "Anyone can view best practices"
  ON public.best_practices
  FOR SELECT
  USING (true);

CREATE POLICY "Gestors can create their own practices"
  ON public.best_practices
  FOR INSERT
  WITH CHECK (auth.uid() = gestor_id);

CREATE POLICY "Gestors can update their own practices"
  ON public.best_practices
  FOR UPDATE
  USING (auth.uid() = gestor_id);

CREATE POLICY "Gestors can delete their own practices"
  ON public.best_practices
  FOR DELETE
  USING (auth.uid() = gestor_id);

-- RLS Policies for likes
CREATE POLICY "Anyone can view likes"
  ON public.best_practice_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can like practices"
  ON public.best_practice_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike practices"
  ON public.best_practice_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update likes count
CREATE OR REPLACE FUNCTION public.update_best_practice_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.best_practices
    SET likes_count = likes_count + 1
    WHERE id = NEW.practice_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.best_practices
    SET likes_count = likes_count - 1
    WHERE id = OLD.practice_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for likes count
CREATE TRIGGER update_best_practice_likes_count_trigger
AFTER INSERT OR DELETE ON public.best_practice_likes
FOR EACH ROW EXECUTE FUNCTION public.update_best_practice_likes_count();

-- Create indexes for performance
CREATE INDEX idx_best_practices_gestor_id ON public.best_practices(gestor_id);
CREATE INDEX idx_best_practices_category ON public.best_practices(category);
CREATE INDEX idx_best_practices_likes_count ON public.best_practices(likes_count DESC);
CREATE INDEX idx_best_practice_likes_practice_id ON public.best_practice_likes(practice_id);
CREATE INDEX idx_best_practice_likes_user_id ON public.best_practice_likes(user_id);