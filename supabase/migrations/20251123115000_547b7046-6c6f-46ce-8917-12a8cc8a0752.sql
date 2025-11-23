-- Fix function search path for security
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;