-- Fix the search_path for the trigger function
CREATE OR REPLACE FUNCTION public.update_strategic_planning_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;