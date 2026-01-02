-- =============================================
-- FASE 2: CIERRE FISCAL COMPLETO
-- Funciones SQL para cierre de períodos y ejercicios
-- =============================================

-- ============================================
-- 2.1 FUNCIÓN: Cerrar Período Contable
-- ============================================
CREATE OR REPLACE FUNCTION erp_close_period(
  p_period_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period RECORD;
  v_pending_entries INTEGER;
  v_result JSONB;
BEGIN
  -- Obtener período
  SELECT * INTO v_period 
  FROM erp_periods 
  WHERE id = p_period_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Período no encontrado'
    );
  END IF;
  
  -- Verificar si ya está cerrado
  IF v_period.is_closed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'El período ya está cerrado'
    );
  END IF;
  
  -- Verificar asientos pendientes (borrador)
  SELECT COUNT(*) INTO v_pending_entries
  FROM erp_journal_entries
  WHERE company_id = v_period.company_id
    AND entry_date BETWEEN v_period.start_date AND v_period.end_date
    AND status = 'draft';
  
  IF v_pending_entries > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Existen %s asientos en borrador en este período', v_pending_entries)
    );
  END IF;
  
  -- Cerrar período
  UPDATE erp_periods
  SET is_closed = true,
      closed_at = NOW(),
      closed_by = p_user_id,
      updated_at = NOW()
  WHERE id = p_period_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', format('Período %s cerrado correctamente', v_period.name),
    'period_id', p_period_id,
    'closed_at', NOW()
  );
END;
$$;

-- ============================================
-- 2.2 FUNCIÓN: Reabrir Período (con permisos)
-- ============================================
CREATE OR REPLACE FUNCTION erp_reopen_period(
  p_period_id UUID,
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period RECORD;
  v_fiscal_year RECORD;
BEGIN
  -- Obtener período
  SELECT * INTO v_period 
  FROM erp_periods 
  WHERE id = p_period_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Período no encontrado'
    );
  END IF;
  
  -- Verificar ejercicio fiscal
  SELECT * INTO v_fiscal_year
  FROM erp_fiscal_years
  WHERE id = v_period.fiscal_year_id;
  
  IF v_fiscal_year.is_closed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No se puede reabrir un período de un ejercicio cerrado'
    );
  END IF;
  
  -- Reabrir período
  UPDATE erp_periods
  SET is_closed = false,
      closed_at = NULL,
      closed_by = NULL,
      updated_at = NOW()
  WHERE id = p_period_id;
  
  -- Registrar en auditoría
  INSERT INTO erp_audit_events (
    company_id,
    actor_user_id,
    entity_type,
    entity_id,
    action,
    before_json,
    after_json,
    metadata
  ) VALUES (
    v_period.company_id,
    p_user_id,
    'erp_periods',
    p_period_id,
    'reopen',
    jsonb_build_object('is_closed', true),
    jsonb_build_object('is_closed', false),
    jsonb_build_object('reason', COALESCE(p_reason, 'Sin especificar'))
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', format('Período %s reabierto correctamente', v_period.name),
    'period_id', p_period_id
  );
END;
$$;

-- ============================================
-- 2.3 FUNCIÓN: Calcular Balance de Cuenta
-- ============================================
CREATE OR REPLACE FUNCTION erp_account_balance(
  p_account_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  debit_total NUMERIC,
  credit_total NUMERIC,
  balance NUMERIC,
  movement_count INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account RECORD;
BEGIN
  SELECT * INTO v_account FROM erp_chart_of_accounts WHERE id = p_account_id;
  
  RETURN QUERY
  SELECT 
    COALESCE(SUM(jel.debit), 0)::NUMERIC as debit_total,
    COALESCE(SUM(jel.credit), 0)::NUMERIC as credit_total,
    CASE 
      WHEN v_account.account_type IN ('asset', 'expense') THEN
        COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0)
      ELSE
        COALESCE(SUM(jel.credit), 0) - COALESCE(SUM(jel.debit), 0)
    END::NUMERIC as balance,
    COUNT(*)::INTEGER as movement_count
  FROM erp_journal_entry_lines jel
  JOIN erp_journal_entries je ON je.id = jel.journal_entry_id
  WHERE jel.account_id = p_account_id
    AND je.status = 'posted'
    AND (p_start_date IS NULL OR je.entry_date >= p_start_date)
    AND (p_end_date IS NULL OR je.entry_date <= p_end_date);
END;
$$;

-- ============================================
-- 2.4 FUNCIÓN: Generar Asiento de Regularización
-- ============================================
CREATE OR REPLACE FUNCTION erp_generate_regularization_entry(
  p_fiscal_year_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fiscal_year RECORD;
  v_journal_id UUID;
  v_entry_id UUID;
  v_entry_number TEXT;
  v_income_accounts RECORD;
  v_expense_accounts RECORD;
  v_total_income NUMERIC := 0;
  v_total_expense NUMERIC := 0;
  v_result_account_id UUID;
  v_result NUMERIC;
  v_line_number INTEGER := 1;
BEGIN
  -- Obtener ejercicio fiscal
  SELECT fy.*, c.id as company_id 
  INTO v_fiscal_year 
  FROM erp_fiscal_years fy
  JOIN erp_companies c ON c.id = fy.company_id
  WHERE fy.id = p_fiscal_year_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ejercicio no encontrado');
  END IF;
  
  IF v_fiscal_year.is_closed THEN
    RETURN jsonb_build_object('success', false, 'error', 'El ejercicio ya está cerrado');
  END IF;
  
  -- Obtener diario de cierre o crear uno
  SELECT id INTO v_journal_id
  FROM erp_journals
  WHERE company_id = v_fiscal_year.company_id
    AND journal_type = 'closing'
  LIMIT 1;
  
  IF v_journal_id IS NULL THEN
    INSERT INTO erp_journals (company_id, code, name, journal_type, is_active)
    VALUES (v_fiscal_year.company_id, 'CIERRE', 'Diario de Cierre', 'closing', true)
    RETURNING id INTO v_journal_id;
  END IF;
  
  -- Obtener cuenta de resultado del ejercicio (129 en PGC español)
  SELECT id INTO v_result_account_id
  FROM erp_chart_of_accounts
  WHERE company_id = v_fiscal_year.company_id
    AND account_code LIKE '129%'
  LIMIT 1;
  
  IF v_result_account_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'No se encontró la cuenta 129 (Resultado del ejercicio)'
    );
  END IF;
  
  -- Generar número de asiento
  v_entry_number := erp_next_entry_number(v_fiscal_year.company_id, v_journal_id);
  
  -- Crear asiento de regularización
  INSERT INTO erp_journal_entries (
    company_id, journal_id, fiscal_year_id, entry_number,
    entry_date, description, status, created_by
  ) VALUES (
    v_fiscal_year.company_id, v_journal_id, p_fiscal_year_id, v_entry_number,
    v_fiscal_year.end_date, 'Asiento de regularización - Cierre ejercicio ' || v_fiscal_year.name,
    'draft', p_user_id
  ) RETURNING id INTO v_entry_id;
  
  -- Regularizar cuentas de ingresos (grupo 7)
  FOR v_income_accounts IN
    SELECT 
      coa.id as account_id,
      coa.account_code,
      coa.account_name,
      COALESCE(SUM(jel.credit), 0) - COALESCE(SUM(jel.debit), 0) as balance
    FROM erp_chart_of_accounts coa
    LEFT JOIN erp_journal_entry_lines jel ON jel.account_id = coa.id
    LEFT JOIN erp_journal_entries je ON je.id = jel.journal_entry_id AND je.status = 'posted'
    WHERE coa.company_id = v_fiscal_year.company_id
      AND coa.account_code LIKE '7%'
      AND coa.account_type = 'income'
    GROUP BY coa.id, coa.account_code, coa.account_name
    HAVING COALESCE(SUM(jel.credit), 0) - COALESCE(SUM(jel.debit), 0) <> 0
    ORDER BY coa.account_code
  LOOP
    v_total_income := v_total_income + v_income_accounts.balance;
    
    INSERT INTO erp_journal_entry_lines (
      journal_entry_id, line_number, account_id, description, debit, credit
    ) VALUES (
      v_entry_id, v_line_number, v_income_accounts.account_id,
      'Regularización ' || v_income_accounts.account_code,
      v_income_accounts.balance, 0
    );
    v_line_number := v_line_number + 1;
  END LOOP;
  
  -- Regularizar cuentas de gastos (grupo 6)
  FOR v_expense_accounts IN
    SELECT 
      coa.id as account_id,
      coa.account_code,
      coa.account_name,
      COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0) as balance
    FROM erp_chart_of_accounts coa
    LEFT JOIN erp_journal_entry_lines jel ON jel.account_id = coa.id
    LEFT JOIN erp_journal_entries je ON je.id = jel.journal_entry_id AND je.status = 'posted'
    WHERE coa.company_id = v_fiscal_year.company_id
      AND coa.account_code LIKE '6%'
      AND coa.account_type = 'expense'
    GROUP BY coa.id, coa.account_code, coa.account_name
    HAVING COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0) <> 0
    ORDER BY coa.account_code
  LOOP
    v_total_expense := v_total_expense + v_expense_accounts.balance;
    
    INSERT INTO erp_journal_entry_lines (
      journal_entry_id, line_number, account_id, description, debit, credit
    ) VALUES (
      v_entry_id, v_line_number, v_expense_accounts.account_id,
      'Regularización ' || v_expense_accounts.account_code,
      0, v_expense_accounts.balance
    );
    v_line_number := v_line_number + 1;
  END LOOP;
  
  -- Calcular resultado y añadir línea de resultado
  v_result := v_total_income - v_total_expense;
  
  IF v_result >= 0 THEN
    -- Beneficio: abono a cuenta 129
    INSERT INTO erp_journal_entry_lines (
      journal_entry_id, line_number, account_id, description, debit, credit
    ) VALUES (
      v_entry_id, v_line_number, v_result_account_id,
      'Resultado del ejercicio (Beneficio)',
      0, v_result
    );
  ELSE
    -- Pérdida: cargo a cuenta 129
    INSERT INTO erp_journal_entry_lines (
      journal_entry_id, line_number, account_id, description, debit, credit
    ) VALUES (
      v_entry_id, v_line_number, v_result_account_id,
      'Resultado del ejercicio (Pérdida)',
      ABS(v_result), 0
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Asiento de regularización generado correctamente',
    'entry_id', v_entry_id,
    'entry_number', v_entry_number,
    'total_income', v_total_income,
    'total_expense', v_total_expense,
    'result', v_result,
    'result_type', CASE WHEN v_result >= 0 THEN 'benefit' ELSE 'loss' END
  );
END;
$$;

-- ============================================
-- 2.5 FUNCIÓN: Generar Asiento de Cierre
-- ============================================
CREATE OR REPLACE FUNCTION erp_generate_closing_entry(
  p_fiscal_year_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fiscal_year RECORD;
  v_journal_id UUID;
  v_entry_id UUID;
  v_entry_number TEXT;
  v_account RECORD;
  v_line_number INTEGER := 1;
  v_total_debit NUMERIC := 0;
  v_total_credit NUMERIC := 0;
BEGIN
  -- Obtener ejercicio fiscal
  SELECT fy.*, c.id as company_id 
  INTO v_fiscal_year 
  FROM erp_fiscal_years fy
  JOIN erp_companies c ON c.id = fy.company_id
  WHERE fy.id = p_fiscal_year_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ejercicio no encontrado');
  END IF;
  
  -- Obtener diario de cierre
  SELECT id INTO v_journal_id
  FROM erp_journals
  WHERE company_id = v_fiscal_year.company_id
    AND journal_type = 'closing'
  LIMIT 1;
  
  IF v_journal_id IS NULL THEN
    INSERT INTO erp_journals (company_id, code, name, journal_type, is_active)
    VALUES (v_fiscal_year.company_id, 'CIERRE', 'Diario de Cierre', 'closing', true)
    RETURNING id INTO v_journal_id;
  END IF;
  
  -- Generar número de asiento
  v_entry_number := erp_next_entry_number(v_fiscal_year.company_id, v_journal_id);
  
  -- Crear asiento de cierre
  INSERT INTO erp_journal_entries (
    company_id, journal_id, fiscal_year_id, entry_number,
    entry_date, description, status, created_by
  ) VALUES (
    v_fiscal_year.company_id, v_journal_id, p_fiscal_year_id, v_entry_number,
    v_fiscal_year.end_date, 'Asiento de cierre - Ejercicio ' || v_fiscal_year.name,
    'draft', p_user_id
  ) RETURNING id INTO v_entry_id;
  
  -- Cerrar cuentas de balance (grupos 1-5)
  FOR v_account IN
    SELECT 
      coa.id as account_id,
      coa.account_code,
      coa.account_name,
      coa.account_type,
      CASE 
        WHEN coa.account_type IN ('asset', 'expense') THEN
          COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0)
        ELSE
          COALESCE(SUM(jel.credit), 0) - COALESCE(SUM(jel.debit), 0)
      END as balance
    FROM erp_chart_of_accounts coa
    LEFT JOIN erp_journal_entry_lines jel ON jel.account_id = coa.id
    LEFT JOIN erp_journal_entries je ON je.id = jel.journal_entry_id AND je.status = 'posted'
    WHERE coa.company_id = v_fiscal_year.company_id
      AND coa.account_code ~ '^[1-5]'
      AND coa.account_type IN ('asset', 'liability', 'equity')
    GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type
    HAVING CASE 
        WHEN coa.account_type IN ('asset', 'expense') THEN
          COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0)
        ELSE
          COALESCE(SUM(jel.credit), 0) - COALESCE(SUM(jel.debit), 0)
      END <> 0
    ORDER BY coa.account_code
  LOOP
    IF v_account.account_type IN ('asset') THEN
      -- Activos: abonar para saldar
      INSERT INTO erp_journal_entry_lines (
        journal_entry_id, line_number, account_id, description, debit, credit
      ) VALUES (
        v_entry_id, v_line_number, v_account.account_id,
        'Cierre ' || v_account.account_code,
        0, v_account.balance
      );
      v_total_credit := v_total_credit + v_account.balance;
    ELSE
      -- Pasivos y patrimonio: cargar para saldar
      INSERT INTO erp_journal_entry_lines (
        journal_entry_id, line_number, account_id, description, debit, credit
      ) VALUES (
        v_entry_id, v_line_number, v_account.account_id,
        'Cierre ' || v_account.account_code,
        v_account.balance, 0
      );
      v_total_debit := v_total_debit + v_account.balance;
    END IF;
    
    v_line_number := v_line_number + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Asiento de cierre generado correctamente',
    'entry_id', v_entry_id,
    'entry_number', v_entry_number,
    'total_debit', v_total_debit,
    'total_credit', v_total_credit,
    'lines_count', v_line_number - 1
  );
END;
$$;

-- ============================================
-- 2.6 FUNCIÓN: Cerrar Ejercicio Fiscal Completo
-- ============================================
CREATE OR REPLACE FUNCTION erp_close_fiscal_year(
  p_fiscal_year_id UUID,
  p_user_id UUID,
  p_generate_regularization BOOLEAN DEFAULT true,
  p_generate_closing BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fiscal_year RECORD;
  v_open_periods INTEGER;
  v_draft_entries INTEGER;
  v_regularization_result JSONB;
  v_closing_result JSONB;
BEGIN
  -- Obtener ejercicio
  SELECT * INTO v_fiscal_year 
  FROM erp_fiscal_years 
  WHERE id = p_fiscal_year_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ejercicio no encontrado');
  END IF;
  
  IF v_fiscal_year.is_closed THEN
    RETURN jsonb_build_object('success', false, 'error', 'El ejercicio ya está cerrado');
  END IF;
  
  -- Verificar períodos abiertos
  SELECT COUNT(*) INTO v_open_periods
  FROM erp_periods
  WHERE fiscal_year_id = p_fiscal_year_id AND is_closed = false;
  
  IF v_open_periods > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Existen %s períodos abiertos. Ciérrelos antes de cerrar el ejercicio.', v_open_periods)
    );
  END IF;
  
  -- Verificar asientos en borrador
  SELECT COUNT(*) INTO v_draft_entries
  FROM erp_journal_entries
  WHERE fiscal_year_id = p_fiscal_year_id AND status = 'draft';
  
  IF v_draft_entries > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Existen %s asientos en borrador. Contabilícelos o elimínelos.', v_draft_entries)
    );
  END IF;
  
  -- Generar asiento de regularización si se solicita
  IF p_generate_regularization THEN
    v_regularization_result := erp_generate_regularization_entry(p_fiscal_year_id, p_user_id);
    IF NOT (v_regularization_result->>'success')::boolean THEN
      RETURN v_regularization_result;
    END IF;
  END IF;
  
  -- Generar asiento de cierre si se solicita
  IF p_generate_closing THEN
    v_closing_result := erp_generate_closing_entry(p_fiscal_year_id, p_user_id);
    IF NOT (v_closing_result->>'success')::boolean THEN
      RETURN v_closing_result;
    END IF;
  END IF;
  
  -- Cerrar ejercicio
  UPDATE erp_fiscal_years
  SET is_closed = true,
      closed_at = NOW(),
      closed_by = p_user_id,
      updated_at = NOW()
  WHERE id = p_fiscal_year_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', format('Ejercicio %s cerrado correctamente', v_fiscal_year.name),
    'fiscal_year_id', p_fiscal_year_id,
    'closed_at', NOW(),
    'regularization', v_regularization_result,
    'closing', v_closing_result
  );
END;
$$;

-- ============================================
-- 2.7 FUNCIÓN: Generar Asiento de Apertura
-- ============================================
CREATE OR REPLACE FUNCTION erp_generate_opening_entry(
  p_new_fiscal_year_id UUID,
  p_previous_fiscal_year_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_fy RECORD;
  v_prev_fy RECORD;
  v_journal_id UUID;
  v_entry_id UUID;
  v_entry_number TEXT;
  v_account RECORD;
  v_line_number INTEGER := 1;
  v_total_debit NUMERIC := 0;
  v_total_credit NUMERIC := 0;
BEGIN
  -- Obtener ejercicios
  SELECT * INTO v_new_fy FROM erp_fiscal_years WHERE id = p_new_fiscal_year_id;
  SELECT * INTO v_prev_fy FROM erp_fiscal_years WHERE id = p_previous_fiscal_year_id;
  
  IF v_new_fy IS NULL OR v_prev_fy IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ejercicio no encontrado');
  END IF;
  
  IF NOT v_prev_fy.is_closed THEN
    RETURN jsonb_build_object('success', false, 'error', 'El ejercicio anterior debe estar cerrado');
  END IF;
  
  -- Obtener o crear diario de apertura
  SELECT id INTO v_journal_id
  FROM erp_journals
  WHERE company_id = v_new_fy.company_id
    AND journal_type = 'opening'
  LIMIT 1;
  
  IF v_journal_id IS NULL THEN
    INSERT INTO erp_journals (company_id, code, name, journal_type, is_active)
    VALUES (v_new_fy.company_id, 'APERTURA', 'Diario de Apertura', 'opening', true)
    RETURNING id INTO v_journal_id;
  END IF;
  
  -- Generar número de asiento
  v_entry_number := erp_next_entry_number(v_new_fy.company_id, v_journal_id);
  
  -- Crear asiento de apertura
  INSERT INTO erp_journal_entries (
    company_id, journal_id, fiscal_year_id, entry_number,
    entry_date, description, status, created_by
  ) VALUES (
    v_new_fy.company_id, v_journal_id, p_new_fiscal_year_id, v_entry_number,
    v_new_fy.start_date, 'Asiento de apertura - Ejercicio ' || v_new_fy.name,
    'draft', p_user_id
  ) RETURNING id INTO v_entry_id;
  
  -- Trasladar saldos de cuentas de balance del ejercicio anterior
  FOR v_account IN
    SELECT 
      coa.id as account_id,
      coa.account_code,
      coa.account_name,
      coa.account_type,
      CASE 
        WHEN coa.account_type = 'asset' THEN
          COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0)
        ELSE
          COALESCE(SUM(jel.credit), 0) - COALESCE(SUM(jel.debit), 0)
      END as balance
    FROM erp_chart_of_accounts coa
    LEFT JOIN erp_journal_entry_lines jel ON jel.account_id = coa.id
    LEFT JOIN erp_journal_entries je ON je.id = jel.journal_entry_id 
      AND je.status = 'posted'
      AND je.fiscal_year_id = p_previous_fiscal_year_id
    WHERE coa.company_id = v_new_fy.company_id
      AND coa.account_code ~ '^[1-5]'
      AND coa.account_type IN ('asset', 'liability', 'equity')
    GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type
    HAVING CASE 
        WHEN coa.account_type = 'asset' THEN
          COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0)
        ELSE
          COALESCE(SUM(jel.credit), 0) - COALESCE(SUM(jel.debit), 0)
      END <> 0
    ORDER BY coa.account_code
  LOOP
    IF v_account.account_type = 'asset' THEN
      INSERT INTO erp_journal_entry_lines (
        journal_entry_id, line_number, account_id, description, debit, credit
      ) VALUES (
        v_entry_id, v_line_number, v_account.account_id,
        'Apertura ' || v_account.account_code,
        v_account.balance, 0
      );
      v_total_debit := v_total_debit + v_account.balance;
    ELSE
      INSERT INTO erp_journal_entry_lines (
        journal_entry_id, line_number, account_id, description, debit, credit
      ) VALUES (
        v_entry_id, v_line_number, v_account.account_id,
        'Apertura ' || v_account.account_code,
        0, v_account.balance
      );
      v_total_credit := v_total_credit + v_account.balance;
    END IF;
    
    v_line_number := v_line_number + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Asiento de apertura generado correctamente',
    'entry_id', v_entry_id,
    'entry_number', v_entry_number,
    'total_debit', v_total_debit,
    'total_credit', v_total_credit,
    'lines_count', v_line_number - 1
  );
END;
$$;