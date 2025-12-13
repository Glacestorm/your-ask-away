-- Fix calculate_customer_360 function to set search_path (security best practice)
CREATE OR REPLACE FUNCTION public.calculate_customer_360(p_company_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_total_visits INTEGER;
  v_successful_visits INTEGER;
  v_last_visit DATE;
  v_total_products INTEGER;
  v_active_products INTEGER;
  v_segment TEXT;
  v_churn_prob NUMERIC;
BEGIN
  -- Calculate visit metrics
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE result = 'positive'),
    MAX(visit_date)::DATE
  INTO v_total_visits, v_successful_visits, v_last_visit
  FROM visits
  WHERE company_id = p_company_id;

  -- Calculate product metrics
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE active = true)
  INTO v_total_products, v_active_products
  FROM company_products
  WHERE company_id = p_company_id;

  -- Determine segment based on metrics
  v_segment := CASE
    WHEN v_total_products >= 5 AND v_successful_visits >= 10 THEN 'Premium'
    WHEN v_total_products >= 3 OR v_successful_visits >= 5 THEN 'Growth'
    WHEN v_total_products >= 1 THEN 'Standard'
    ELSE 'New'
  END;

  -- Calculate churn probability (simplified)
  v_churn_prob := CASE
    WHEN v_last_visit IS NULL THEN 0.8
    WHEN v_last_visit < CURRENT_DATE - INTERVAL '180 days' THEN 0.7
    WHEN v_last_visit < CURRENT_DATE - INTERVAL '90 days' THEN 0.5
    WHEN v_last_visit < CURRENT_DATE - INTERVAL '30 days' THEN 0.3
    ELSE 0.1
  END;

  -- Upsert the 360 profile
  INSERT INTO customer_360_profiles (
    company_id,
    total_visits,
    successful_visits,
    last_visit_date,
    total_products,
    active_products,
    segment,
    churn_probability,
    health_score,
    last_calculated_at
  ) VALUES (
    p_company_id,
    v_total_visits,
    v_successful_visits,
    v_last_visit,
    v_total_products,
    v_active_products,
    v_segment,
    v_churn_prob,
    (1 - v_churn_prob) * 100,
    now()
  )
  ON CONFLICT (company_id) DO UPDATE SET
    total_visits = EXCLUDED.total_visits,
    successful_visits = EXCLUDED.successful_visits,
    last_visit_date = EXCLUDED.last_visit_date,
    total_products = EXCLUDED.total_products,
    active_products = EXCLUDED.active_products,
    segment = EXCLUDED.segment,
    churn_probability = EXCLUDED.churn_probability,
    health_score = EXCLUDED.health_score,
    last_calculated_at = now(),
    updated_at = now();
END;
$function$;