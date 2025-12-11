-- Create suggestions table
CREATE TABLE public.user_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  suggestion_text TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  context TEXT,
  ai_response TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'medium',
  category TEXT,
  votes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create votes table
CREATE TABLE public.suggestion_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_id UUID NOT NULL REFERENCES public.user_suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(suggestion_id, user_id)
);

-- Enable RLS
ALTER TABLE public.user_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestion_votes ENABLE ROW LEVEL SECURITY;

-- Policies for suggestions
CREATE POLICY "Users can view all suggestions" ON public.user_suggestions
  FOR SELECT USING (true);

CREATE POLICY "Users can create suggestions" ON public.user_suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own suggestions" ON public.user_suggestions
  FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'director_comercial'::app_role));

CREATE POLICY "Admins can delete suggestions" ON public.user_suggestions
  FOR DELETE USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'director_comercial'::app_role));

-- Policies for votes
CREATE POLICY "Users can view votes" ON public.suggestion_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can vote" ON public.suggestion_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own vote" ON public.suggestion_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update vote count
CREATE OR REPLACE FUNCTION public.update_suggestion_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.user_suggestions SET votes_count = votes_count + 1 WHERE id = NEW.suggestion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_suggestions SET votes_count = votes_count - 1 WHERE id = OLD.suggestion_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for vote counting
CREATE TRIGGER update_votes_count
  AFTER INSERT OR DELETE ON public.suggestion_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_suggestion_votes();

-- Function to notify admins
CREATE OR REPLACE FUNCTION public.notify_admin_new_suggestion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, data)
  SELECT p.id, 'Nueva sugerencia recibida', 
    CASE 
      WHEN NEW.source = 'ai_detected' THEN 'La IA ha detectado una posible mejora: ' || LEFT(NEW.suggestion_text, 100)
      ELSE 'Un usuario ha enviado una sugerencia: ' || LEFT(NEW.suggestion_text, 100)
    END,
    'suggestion',
    jsonb_build_object('suggestion_id', NEW.id, 'source', NEW.source)
  FROM public.profiles p
  WHERE p.role IN ('superadmin', 'director_comercial', 'responsable_comercial');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for admin notifications
CREATE TRIGGER notify_on_new_suggestion
  AFTER INSERT ON public.user_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_suggestion();