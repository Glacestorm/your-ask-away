-- Function to update translation progress for a locale
CREATE OR REPLACE FUNCTION public.update_translation_progress_for_locale(p_locale text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_keys integer;
  v_translated_keys integer;
  v_progress integer;
BEGIN
  -- Count total keys from Spanish source (baseline)
  SELECT COUNT(*) INTO v_total_keys
  FROM cms_translations
  WHERE locale = 'es';
  
  -- If no Spanish keys, use a fallback count
  IF v_total_keys = 0 THEN
    v_total_keys := 500; -- Approximate baseline
  END IF;
  
  -- Count translated keys for this locale
  SELECT COUNT(*) INTO v_translated_keys
  FROM cms_translations
  WHERE locale = p_locale
    AND value IS NOT NULL
    AND value != '';
  
  -- Calculate progress percentage
  v_progress := LEAST(100, ROUND((v_translated_keys::numeric / v_total_keys::numeric) * 100));
  
  -- Update the supported_languages table
  UPDATE supported_languages
  SET translation_progress = v_progress,
      updated_at = now()
  WHERE locale = p_locale;
END;
$$;

-- Trigger function to update progress after insert/update on cms_translations
CREATE OR REPLACE FUNCTION public.trigger_update_translation_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update progress for the affected locale
  PERFORM update_translation_progress_for_locale(NEW.locale);
  RETURN NEW;
END;
$$;

-- Create trigger on cms_translations
DROP TRIGGER IF EXISTS trg_update_translation_progress ON cms_translations;
CREATE TRIGGER trg_update_translation_progress
  AFTER INSERT OR UPDATE ON cms_translations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_translation_progress();