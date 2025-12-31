-- Fix audit trigger function to not assume company_id column exists
CREATE OR REPLACE FUNCTION public.erp_audit_trigger_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company_id UUID;
  v_action TEXT;
  v_before JSONB;
  v_after JSONB;
  v_new_company_id_text TEXT;
  v_old_company_id_text TEXT;
BEGIN
  v_action := TG_OP;

  -- Extract company_id dynamically (works even if the column doesn't exist)
  v_new_company_id_text := CASE WHEN TG_OP <> 'DELETE' THEN (to_jsonb(NEW)->>'company_id') ELSE NULL END;
  v_old_company_id_text := CASE WHEN TG_OP <> 'INSERT' THEN (to_jsonb(OLD)->>'company_id') ELSE NULL END;

  IF TG_TABLE_NAME = 'erp_companies' THEN
    -- For the companies table, the company_id should be the company's own id
    IF TG_OP = 'DELETE' THEN
      v_company_id := OLD.id;
    ELSE
      v_company_id := NEW.id;
    END IF;
  ELSE
    -- For other tables, use company_id if present
    v_company_id := COALESCE(NULLIF(v_new_company_id_text, '')::uuid, NULLIF(v_old_company_id_text, '')::uuid, NULL);
  END IF;

  IF TG_OP = 'DELETE' THEN
    v_before := to_jsonb(OLD);
    v_after := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_before := NULL;
    v_after := to_jsonb(NEW);
  ELSE
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
  END IF;

  INSERT INTO public.erp_audit_events (
    company_id,
    actor_user_id,
    entity_type,
    entity_id,
    action,
    before_json,
    after_json
  ) VALUES (
    v_company_id,
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    v_action,
    v_before,
    v_after
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

-- Remove duplicate audit trigger on erp_companies (it caused double inserts into audit table)
DROP TRIGGER IF EXISTS erp_companies_audit_trigger ON public.erp_companies;