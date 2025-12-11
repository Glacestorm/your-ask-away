-- Fix search_path for the new functions
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;