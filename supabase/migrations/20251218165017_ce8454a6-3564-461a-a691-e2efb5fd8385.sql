-- Fix SECURITY DEFINER functions without fixed search_path

-- Fix update_suggestion_votes
CREATE OR REPLACE FUNCTION public.update_suggestion_votes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.user_suggestions SET votes_count = votes_count + 1 WHERE id = NEW.suggestion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_suggestions SET votes_count = votes_count - 1 WHERE id = OLD.suggestion_id;
  END IF;
  RETURN NULL;
END;
$function$;

-- Fix archive_old_financial_statement
CREATE OR REPLACE FUNCTION public.archive_old_financial_statement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    statement_count integer;
    oldest_statement record;
BEGIN
    -- Count active statements for this company
    SELECT COUNT(*) INTO statement_count
    FROM public.company_financial_statements
    WHERE company_id = NEW.company_id AND is_archived = false;
    
    -- If there are already 5 active statements, archive the oldest
    IF statement_count >= 5 THEN
        SELECT cfs.* INTO oldest_statement
        FROM public.company_financial_statements cfs
        WHERE cfs.company_id = NEW.company_id AND cfs.is_archived = false
        ORDER BY cfs.fiscal_year ASC
        LIMIT 1;
        
        -- Insert into archive with all data
        INSERT INTO public.financial_statements_archive (
            original_statement_id, company_id, fiscal_year, statement_type,
            balance_sheet_data, income_statement_data, cash_flow_data,
            equity_changes_data, notes_data, archived_by
        )
        SELECT 
            oldest_statement.id,
            oldest_statement.company_id,
            oldest_statement.fiscal_year,
            oldest_statement.statement_type,
            to_jsonb(bs.*),
            to_jsonb(ist.*),
            to_jsonb(cfs.*),
            to_jsonb(ecs.*),
            (SELECT jsonb_agg(to_jsonb(fn.*)) FROM public.financial_notes fn WHERE fn.statement_id = oldest_statement.id),
            auth.uid()
        FROM public.balance_sheets bs
        LEFT JOIN public.income_statements ist ON ist.statement_id = oldest_statement.id
        LEFT JOIN public.cash_flow_statements cfs ON cfs.statement_id = oldest_statement.id
        LEFT JOIN public.equity_changes_statements ecs ON ecs.statement_id = oldest_statement.id
        WHERE bs.statement_id = oldest_statement.id;
        
        -- Mark as archived
        UPDATE public.company_financial_statements
        SET is_archived = true
        WHERE id = oldest_statement.id;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Fix notify_admin_new_suggestion
CREATE OR REPLACE FUNCTION public.notify_admin_new_suggestion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix update_best_practice_likes_count
CREATE OR REPLACE FUNCTION public.update_best_practice_likes_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;