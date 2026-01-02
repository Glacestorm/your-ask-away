
-- ============================================================
-- FASE 3: FUNCIONES DE REPORTING (Con nombres correctos)
-- ============================================================

-- 1. Función: Balance de Sumas y Saldos
CREATE OR REPLACE FUNCTION public.erp_trial_balance(
  p_company_id UUID,
  p_date_from DATE,
  p_date_to DATE,
  p_level INTEGER DEFAULT NULL
)
RETURNS TABLE (
  account_id UUID,
  account_code TEXT,
  account_name TEXT,
  account_type TEXT,
  account_level INTEGER,
  debit_sum NUMERIC,
  credit_sum NUMERIC,
  debit_balance NUMERIC,
  credit_balance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH account_movements AS (
    SELECT 
      jel.account_id AS acc_id,
      COALESCE(SUM(jel.debit), 0) AS total_debit,
      COALESCE(SUM(jel.credit), 0) AS total_credit
    FROM erp_journal_entry_lines jel
    JOIN erp_journal_entries je ON je.id = jel.entry_id
    WHERE je.company_id = p_company_id
      AND je.entry_date BETWEEN p_date_from AND p_date_to
      AND je.is_posted = true
    GROUP BY jel.account_id
  )
  SELECT 
    a.id,
    a.code,
    a.name,
    a.account_type,
    a.level,
    COALESCE(am.total_debit, 0),
    COALESCE(am.total_credit, 0),
    CASE 
      WHEN COALESCE(am.total_debit, 0) > COALESCE(am.total_credit, 0) 
      THEN COALESCE(am.total_debit, 0) - COALESCE(am.total_credit, 0)
      ELSE 0::NUMERIC 
    END,
    CASE 
      WHEN COALESCE(am.total_credit, 0) > COALESCE(am.total_debit, 0) 
      THEN COALESCE(am.total_credit, 0) - COALESCE(am.total_debit, 0)
      ELSE 0::NUMERIC 
    END
  FROM erp_chart_accounts a
  LEFT JOIN account_movements am ON am.acc_id = a.id
  WHERE a.company_id = p_company_id
    AND a.is_active = true
    AND (p_level IS NULL OR a.level <= p_level)
    AND (COALESCE(am.total_debit, 0) > 0 OR COALESCE(am.total_credit, 0) > 0)
  ORDER BY a.code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Función: Libro Mayor
CREATE OR REPLACE FUNCTION public.erp_account_ledger(
  p_company_id UUID,
  p_account_id UUID,
  p_date_from DATE,
  p_date_to DATE
)
RETURNS TABLE (
  entry_date DATE,
  entry_number TEXT,
  journal_name TEXT,
  description TEXT,
  debit NUMERIC,
  credit NUMERIC,
  running_balance NUMERIC
) AS $$
DECLARE
  v_opening_balance NUMERIC := 0;
  v_account_type TEXT;
BEGIN
  SELECT a.account_type INTO v_account_type
  FROM erp_chart_accounts a WHERE a.id = p_account_id;

  SELECT 
    CASE 
      WHEN v_account_type IN ('asset', 'expense') 
      THEN COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0)
      ELSE COALESCE(SUM(jel.credit), 0) - COALESCE(SUM(jel.debit), 0)
    END INTO v_opening_balance
  FROM erp_journal_entry_lines jel
  JOIN erp_journal_entries je ON je.id = jel.entry_id
  WHERE je.company_id = p_company_id
    AND jel.account_id = p_account_id
    AND je.entry_date < p_date_from
    AND je.is_posted = true;

  RETURN QUERY
  WITH movements AS (
    SELECT 
      je.entry_date AS e_date,
      je.entry_number AS e_num,
      j.name AS j_name,
      COALESCE(jel.description, je.description) AS descr,
      COALESCE(jel.debit, 0) AS deb,
      COALESCE(jel.credit, 0) AS cred,
      je.created_at AS e_created
    FROM erp_journal_entry_lines jel
    JOIN erp_journal_entries je ON je.id = jel.entry_id
    JOIN erp_journals j ON j.id = je.journal_id
    WHERE je.company_id = p_company_id
      AND jel.account_id = p_account_id
      AND je.entry_date BETWEEN p_date_from AND p_date_to
      AND je.is_posted = true
  )
  SELECT 
    m.e_date,
    m.e_num,
    m.j_name,
    m.descr,
    m.deb,
    m.cred,
    v_opening_balance + SUM(
      CASE WHEN v_account_type IN ('asset', 'expense') THEN m.deb - m.cred ELSE m.cred - m.deb END
    ) OVER (ORDER BY m.e_date, m.e_created)
  FROM movements m;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Función: Estado de Resultados
CREATE OR REPLACE FUNCTION public.erp_income_statement(
  p_company_id UUID,
  p_date_from DATE,
  p_date_to DATE
)
RETURNS TABLE (
  section TEXT,
  account_id UUID,
  account_code TEXT,
  account_name TEXT,
  amount NUMERIC,
  section_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE WHEN a.account_type = 'income' THEN 'Ingresos' ELSE 'Gastos' END,
    a.id,
    a.code,
    a.name,
    CASE 
      WHEN a.account_type = 'income' 
      THEN COALESCE(SUM(jel.credit), 0) - COALESCE(SUM(jel.debit), 0)
      ELSE COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0)
    END,
    CASE WHEN a.account_type = 'income' THEN 1 ELSE 2 END
  FROM erp_chart_accounts a
  LEFT JOIN erp_journal_entry_lines jel ON jel.account_id = a.id
  LEFT JOIN erp_journal_entries je ON je.id = jel.entry_id
    AND je.company_id = p_company_id
    AND je.entry_date BETWEEN p_date_from AND p_date_to
    AND je.is_posted = true
  WHERE a.company_id = p_company_id
    AND a.is_active = true
    AND a.account_type IN ('income', 'expense')
    AND a.is_header = false
  GROUP BY a.id, a.code, a.name, a.account_type
  HAVING COALESCE(SUM(jel.debit), 0) + COALESCE(SUM(jel.credit), 0) > 0
  ORDER BY CASE WHEN a.account_type = 'income' THEN 1 ELSE 2 END, a.code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Función: Balance General
CREATE OR REPLACE FUNCTION public.erp_balance_sheet(
  p_company_id UUID,
  p_as_of_date DATE
)
RETURNS TABLE (
  section TEXT,
  account_id UUID,
  account_code TEXT,
  account_name TEXT,
  amount NUMERIC,
  section_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN a.account_type = 'asset' THEN 'Activo'
      WHEN a.account_type = 'liability' THEN 'Pasivo'
      ELSE 'Patrimonio'
    END,
    a.id,
    a.code,
    a.name,
    CASE 
      WHEN a.account_type = 'asset' 
      THEN COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0)
      ELSE COALESCE(SUM(jel.credit), 0) - COALESCE(SUM(jel.debit), 0)
    END,
    CASE 
      WHEN a.account_type = 'asset' THEN 1
      WHEN a.account_type = 'liability' THEN 2
      ELSE 3
    END
  FROM erp_chart_accounts a
  LEFT JOIN erp_journal_entry_lines jel ON jel.account_id = a.id
  LEFT JOIN erp_journal_entries je ON je.id = jel.entry_id
    AND je.company_id = p_company_id
    AND je.entry_date <= p_as_of_date
    AND je.is_posted = true
  WHERE a.company_id = p_company_id
    AND a.is_active = true
    AND a.account_type IN ('asset', 'liability', 'equity')
    AND a.is_header = false
  GROUP BY a.id, a.code, a.name, a.account_type
  HAVING COALESCE(SUM(jel.debit), 0) + COALESCE(SUM(jel.credit), 0) > 0
  ORDER BY CASE WHEN a.account_type = 'asset' THEN 1 WHEN a.account_type = 'liability' THEN 2 ELSE 3 END, a.code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Función: Aging Report
CREATE OR REPLACE FUNCTION public.erp_aging_report(
  p_company_id UUID,
  p_report_type TEXT,
  p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  entity_id UUID,
  entity_name TEXT,
  entity_tax_id TEXT,
  total_amount NUMERIC,
  current_amount NUMERIC,
  days_1_30 NUMERIC,
  days_31_60 NUMERIC,
  days_61_90 NUMERIC,
  days_over_90 NUMERIC
) AS $$
BEGIN
  IF p_report_type = 'receivable' THEN
    RETURN QUERY
    SELECT 
      c.id, c.name, c.tax_id,
      COALESCE(SUM(si.total_amount - COALESCE(si.paid_amount, 0)), 0),
      COALESCE(SUM(CASE WHEN p_as_of_date - si.due_date <= 0 THEN si.total_amount - COALESCE(si.paid_amount, 0) ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN p_as_of_date - si.due_date BETWEEN 1 AND 30 THEN si.total_amount - COALESCE(si.paid_amount, 0) ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN p_as_of_date - si.due_date BETWEEN 31 AND 60 THEN si.total_amount - COALESCE(si.paid_amount, 0) ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN p_as_of_date - si.due_date BETWEEN 61 AND 90 THEN si.total_amount - COALESCE(si.paid_amount, 0) ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN p_as_of_date - si.due_date > 90 THEN si.total_amount - COALESCE(si.paid_amount, 0) ELSE 0 END), 0)
    FROM erp_customers c
    JOIN erp_sales_invoices si ON si.customer_id = c.id
    WHERE c.company_id = p_company_id
      AND si.status IN ('posted', 'partial')
      AND si.total_amount > COALESCE(si.paid_amount, 0)
    GROUP BY c.id, c.name, c.tax_id
    HAVING SUM(si.total_amount - COALESCE(si.paid_amount, 0)) > 0;
  ELSE
    RETURN QUERY
    SELECT 
      s.id, s.name, s.tax_id,
      COALESCE(SUM(si.total_amount - COALESCE(si.paid_amount, 0)), 0),
      COALESCE(SUM(CASE WHEN p_as_of_date - si.due_date <= 0 THEN si.total_amount - COALESCE(si.paid_amount, 0) ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN p_as_of_date - si.due_date BETWEEN 1 AND 30 THEN si.total_amount - COALESCE(si.paid_amount, 0) ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN p_as_of_date - si.due_date BETWEEN 31 AND 60 THEN si.total_amount - COALESCE(si.paid_amount, 0) ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN p_as_of_date - si.due_date BETWEEN 61 AND 90 THEN si.total_amount - COALESCE(si.paid_amount, 0) ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN p_as_of_date - si.due_date > 90 THEN si.total_amount - COALESCE(si.paid_amount, 0) ELSE 0 END), 0)
    FROM erp_suppliers s
    JOIN erp_supplier_invoices si ON si.supplier_id = s.id
    WHERE s.company_id = p_company_id
      AND si.status IN ('posted', 'partial')
      AND si.total_amount > COALESCE(si.paid_amount, 0)
    GROUP BY s.id, s.name, s.tax_id
    HAVING SUM(si.total_amount - COALESCE(si.paid_amount, 0)) > 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Función: Saldo de cuenta en fecha
CREATE OR REPLACE FUNCTION public.erp_account_balance_at_date(
  p_company_id UUID,
  p_account_id UUID,
  p_as_of_date DATE
)
RETURNS NUMERIC AS $$
DECLARE
  v_balance NUMERIC := 0;
  v_account_type TEXT;
BEGIN
  SELECT account_type INTO v_account_type
  FROM erp_chart_accounts WHERE id = p_account_id;

  SELECT 
    CASE 
      WHEN v_account_type IN ('asset', 'expense') 
      THEN COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0)
      ELSE COALESCE(SUM(jel.credit), 0) - COALESCE(SUM(jel.debit), 0)
    END INTO v_balance
  FROM erp_journal_entry_lines jel
  JOIN erp_journal_entries je ON je.id = jel.entry_id
  WHERE je.company_id = p_company_id
    AND jel.account_id = p_account_id
    AND je.entry_date <= p_as_of_date
    AND je.is_posted = true;

  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Función: Totales del Balance
CREATE OR REPLACE FUNCTION public.erp_trial_balance_totals(
  p_company_id UUID,
  p_date_from DATE,
  p_date_to DATE
)
RETURNS TABLE (
  total_debit_sum NUMERIC,
  total_credit_sum NUMERIC,
  total_debit_balance NUMERIC,
  total_credit_balance NUMERIC,
  is_balanced BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(tb.debit_sum),
    SUM(tb.credit_sum),
    SUM(tb.debit_balance),
    SUM(tb.credit_balance),
    ABS(SUM(tb.debit_balance) - SUM(tb.credit_balance)) < 0.01
  FROM erp_trial_balance(p_company_id, p_date_from, p_date_to, NULL) tb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Vista: Saldos de cuentas
CREATE OR REPLACE VIEW public.erp_account_balances_view AS
SELECT 
  a.id,
  a.company_id,
  a.code,
  a.name,
  a.account_type,
  a.level,
  a.is_header,
  COALESCE(SUM(jel.debit), 0) AS total_debit,
  COALESCE(SUM(jel.credit), 0) AS total_credit,
  CASE 
    WHEN a.account_type IN ('asset', 'expense') 
    THEN COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0)
    ELSE COALESCE(SUM(jel.credit), 0) - COALESCE(SUM(jel.debit), 0)
  END AS balance
FROM erp_chart_accounts a
LEFT JOIN erp_journal_entry_lines jel ON jel.account_id = a.id
LEFT JOIN erp_journal_entries je ON je.id = jel.entry_id AND je.is_posted = true
WHERE a.is_active = true
GROUP BY a.id, a.company_id, a.code, a.name, a.account_type, a.level, a.is_header;
