
-- ============================================
-- FASE 1: TRIGGERS CONTABLES ERP
-- ============================================

-- 1. Función para obtener siguiente número de asiento (bloqueo transaccional)
CREATE OR REPLACE FUNCTION erp_next_entry_number(
  p_company_id UUID,
  p_journal_id UUID,
  p_period_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_number INTEGER;
BEGIN
  -- Bloqueo advisory para evitar duplicados
  PERFORM pg_advisory_xact_lock(
    hashtext(p_company_id::text || p_journal_id::text || p_period_id::text)
  );
  
  -- Obtener siguiente número
  SELECT COALESCE(MAX(entry_number), 0) + 1
  INTO v_next_number
  FROM erp_journal_entries
  WHERE company_id = p_company_id
    AND journal_id = p_journal_id
    AND period_id = p_period_id;
  
  RETURN v_next_number;
END;
$$;

-- 2. Función para verificar si un periodo está cerrado
CREATE OR REPLACE FUNCTION erp_check_period_closed(p_period_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_closed BOOLEAN;
BEGIN
  SELECT is_closed INTO v_is_closed
  FROM erp_periods
  WHERE id = p_period_id;
  
  RETURN COALESCE(v_is_closed, FALSE);
END;
$$;

-- 3. Trigger para bloquear posting en periodos cerrados
CREATE OR REPLACE FUNCTION erp_block_closed_period_posting()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_posted = TRUE AND NEW.period_id IS NOT NULL AND erp_check_period_closed(NEW.period_id) THEN
    RAISE EXCEPTION 'No se puede contabilizar en un periodo cerrado';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_closed_period ON erp_journal_entries;
CREATE TRIGGER trg_block_closed_period
  BEFORE INSERT OR UPDATE ON erp_journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION erp_block_closed_period_posting();

-- 4. Función principal para generar asiento desde factura de VENTA
CREATE OR REPLACE FUNCTION erp_generate_sales_invoice_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_journal_id UUID;
  v_period_id UUID;
  v_entry_id UUID;
  v_entry_number INTEGER;
  v_customer_account UUID;
  v_sales_account UUID;
  v_vat_output_account UUID;
  v_base_amount NUMERIC;
  v_tax_amount NUMERIC;
  v_total_amount NUMERIC;
BEGIN
  -- Solo generar asiento cuando se marca como posted
  IF NEW.status != 'posted' OR (OLD IS NOT NULL AND OLD.status = 'posted') THEN
    RETURN NEW;
  END IF;

  -- Obtener periodo correspondiente a la fecha
  SELECT id INTO v_period_id
  FROM erp_periods
  WHERE company_id = NEW.company_id
    AND NEW.invoice_date BETWEEN start_date AND end_date
    AND is_closed = FALSE
  LIMIT 1;

  IF v_period_id IS NULL THEN
    RAISE EXCEPTION 'No hay periodo abierto para la fecha %', NEW.invoice_date;
  END IF;

  -- Calcular importes
  v_base_amount := COALESCE(NEW.subtotal, NEW.total_amount);
  v_tax_amount := COALESCE(NEW.tax_amount, 0);
  v_total_amount := COALESCE(NEW.total_amount, v_base_amount + v_tax_amount);

  -- Obtener diario de ventas
  SELECT id INTO v_journal_id
  FROM erp_journals
  WHERE company_id = NEW.company_id
    AND (code = 'VEN' OR name ILIKE '%venta%')
    AND is_active = TRUE
  LIMIT 1;

  IF v_journal_id IS NULL THEN
    SELECT id INTO v_journal_id FROM erp_journals 
    WHERE company_id = NEW.company_id AND is_default = TRUE LIMIT 1;
  END IF;

  IF v_journal_id IS NULL THEN
    RAISE EXCEPTION 'No hay diario configurado para ventas';
  END IF;

  -- Obtener cuentas contables (430x Clientes, 700x Ventas, 477x IVA Repercutido)
  SELECT id INTO v_customer_account FROM erp_chart_accounts 
  WHERE company_id = NEW.company_id AND code LIKE '430%' AND is_active = TRUE LIMIT 1;
  
  SELECT id INTO v_sales_account FROM erp_chart_accounts 
  WHERE company_id = NEW.company_id AND code LIKE '700%' AND is_active = TRUE LIMIT 1;
  
  SELECT id INTO v_vat_output_account FROM erp_chart_accounts 
  WHERE company_id = NEW.company_id AND code LIKE '477%' AND is_active = TRUE LIMIT 1;

  -- Obtener número de asiento
  v_entry_number := erp_next_entry_number(NEW.company_id, v_journal_id, v_period_id);

  -- Crear asiento
  INSERT INTO erp_journal_entries (
    company_id, journal_id, entry_number, entry_date, period_id,
    description, source_type, source_id, is_posted, created_by
  ) VALUES (
    NEW.company_id, v_journal_id, v_entry_number, NEW.invoice_date, v_period_id,
    'Factura venta ' || COALESCE(NEW.invoice_number, NEW.id::text),
    'sales_invoice', NEW.id, TRUE, NEW.created_by
  ) RETURNING id INTO v_entry_id;

  -- Línea 1: Deudor cliente (Debe)
  IF v_customer_account IS NOT NULL THEN
    INSERT INTO erp_journal_entry_lines (
      entry_id, account_id, debit, credit, partner_type, partner_id, description
    ) VALUES (
      v_entry_id, v_customer_account, v_total_amount, 0, 
      'customer', NEW.customer_id, 'Cliente por factura'
    );
  END IF;

  -- Línea 2: Ventas (Haber)
  IF v_sales_account IS NOT NULL THEN
    INSERT INTO erp_journal_entry_lines (
      entry_id, account_id, debit, credit, description
    ) VALUES (
      v_entry_id, v_sales_account, 0, v_base_amount, 'Ventas'
    );
  END IF;

  -- Línea 3: IVA Repercutido (Haber)
  IF v_vat_output_account IS NOT NULL AND v_tax_amount > 0 THEN
    INSERT INTO erp_journal_entry_lines (
      entry_id, account_id, debit, credit, description
    ) VALUES (
      v_entry_id, v_vat_output_account, 0, v_tax_amount, 'IVA Repercutido'
    );
  END IF;

  -- Registrar en libro de IVA
  INSERT INTO erp_vat_register (
    company_id, period_id, direction, base_amount, tax_amount,
    source_type, source_id
  ) VALUES (
    NEW.company_id, v_period_id, 'sales', v_base_amount, v_tax_amount,
    'sales_invoice', NEW.id
  );

  -- Log en system_events
  INSERT INTO system_events (
    event_type, severity, title, description, metadata
  ) VALUES (
    'erp_journal_entry_created', 'info',
    'Asiento contable generado automáticamente',
    'Asiento ' || v_entry_number || ' creado desde factura de venta',
    jsonb_build_object(
      'entry_id', v_entry_id,
      'source_table', 'erp_sales_invoices',
      'source_id', NEW.id,
      'amount', v_total_amount
    )
  );

  RETURN NEW;
END;
$$;

-- 5. Función principal para generar asiento desde factura de COMPRA
CREATE OR REPLACE FUNCTION erp_generate_supplier_invoice_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_journal_id UUID;
  v_period_id UUID;
  v_entry_id UUID;
  v_entry_number INTEGER;
  v_supplier_account UUID;
  v_purchase_account UUID;
  v_vat_input_account UUID;
  v_base_amount NUMERIC;
  v_tax_amount NUMERIC;
  v_total_amount NUMERIC;
BEGIN
  -- Solo generar asiento cuando se marca como posted
  IF NEW.status != 'posted' OR (OLD IS NOT NULL AND OLD.status = 'posted') THEN
    RETURN NEW;
  END IF;

  -- Obtener periodo correspondiente a la fecha
  SELECT id INTO v_period_id
  FROM erp_periods
  WHERE company_id = NEW.company_id
    AND NEW.invoice_date BETWEEN start_date AND end_date
    AND is_closed = FALSE
  LIMIT 1;

  IF v_period_id IS NULL THEN
    RAISE EXCEPTION 'No hay periodo abierto para la fecha %', NEW.invoice_date;
  END IF;

  -- Calcular importes
  v_base_amount := COALESCE(NEW.subtotal, NEW.total_amount);
  v_tax_amount := COALESCE(NEW.tax_amount, 0);
  v_total_amount := COALESCE(NEW.total_amount, v_base_amount + v_tax_amount);

  -- Obtener diario de compras
  SELECT id INTO v_journal_id
  FROM erp_journals
  WHERE company_id = NEW.company_id
    AND (code = 'COM' OR name ILIKE '%compra%')
    AND is_active = TRUE
  LIMIT 1;

  IF v_journal_id IS NULL THEN
    SELECT id INTO v_journal_id FROM erp_journals 
    WHERE company_id = NEW.company_id AND is_default = TRUE LIMIT 1;
  END IF;

  IF v_journal_id IS NULL THEN
    RAISE EXCEPTION 'No hay diario configurado para compras';
  END IF;

  -- Obtener cuentas contables (400x Proveedores, 600x Compras, 472x IVA Soportado)
  SELECT id INTO v_supplier_account FROM erp_chart_accounts 
  WHERE company_id = NEW.company_id AND code LIKE '400%' AND is_active = TRUE LIMIT 1;
  
  SELECT id INTO v_purchase_account FROM erp_chart_accounts 
  WHERE company_id = NEW.company_id AND code LIKE '600%' AND is_active = TRUE LIMIT 1;
  
  SELECT id INTO v_vat_input_account FROM erp_chart_accounts 
  WHERE company_id = NEW.company_id AND code LIKE '472%' AND is_active = TRUE LIMIT 1;

  -- Obtener número de asiento
  v_entry_number := erp_next_entry_number(NEW.company_id, v_journal_id, v_period_id);

  -- Crear asiento
  INSERT INTO erp_journal_entries (
    company_id, journal_id, entry_number, entry_date, period_id,
    description, source_type, source_id, is_posted, created_by
  ) VALUES (
    NEW.company_id, v_journal_id, v_entry_number, NEW.invoice_date, v_period_id,
    'Factura compra ' || COALESCE(NEW.invoice_number, NEW.id::text),
    'supplier_invoice', NEW.id, TRUE, NEW.created_by
  ) RETURNING id INTO v_entry_id;

  -- Línea 1: Compras/Gastos (Debe)
  IF v_purchase_account IS NOT NULL THEN
    INSERT INTO erp_journal_entry_lines (
      entry_id, account_id, debit, credit, description
    ) VALUES (
      v_entry_id, v_purchase_account, v_base_amount, 0, 'Compras/Gastos'
    );
  END IF;

  -- Línea 2: IVA Soportado (Debe)
  IF v_vat_input_account IS NOT NULL AND v_tax_amount > 0 THEN
    INSERT INTO erp_journal_entry_lines (
      entry_id, account_id, debit, credit, description
    ) VALUES (
      v_entry_id, v_vat_input_account, v_tax_amount, 0, 'IVA Soportado'
    );
  END IF;

  -- Línea 3: Acreedor proveedor (Haber)
  IF v_supplier_account IS NOT NULL THEN
    INSERT INTO erp_journal_entry_lines (
      entry_id, account_id, debit, credit, partner_type, partner_id, description
    ) VALUES (
      v_entry_id, v_supplier_account, 0, v_total_amount,
      'supplier', NEW.supplier_id, 'Proveedor por factura'
    );
  END IF;

  -- Registrar en libro de IVA
  INSERT INTO erp_vat_register (
    company_id, period_id, direction, base_amount, tax_amount,
    source_type, source_id
  ) VALUES (
    NEW.company_id, v_period_id, 'purchases', v_base_amount, v_tax_amount,
    'supplier_invoice', NEW.id
  );

  -- Log en system_events
  INSERT INTO system_events (
    event_type, severity, title, description, metadata
  ) VALUES (
    'erp_journal_entry_created', 'info',
    'Asiento contable generado automáticamente',
    'Asiento ' || v_entry_number || ' creado desde factura de compra',
    jsonb_build_object(
      'entry_id', v_entry_id,
      'source_table', 'erp_supplier_invoices',
      'source_id', NEW.id,
      'amount', v_total_amount
    )
  );

  RETURN NEW;
END;
$$;

-- 6. Crear triggers en tablas de facturas
DROP TRIGGER IF EXISTS trg_sales_invoice_journal_entry ON erp_sales_invoices;
CREATE TRIGGER trg_sales_invoice_journal_entry
  AFTER INSERT OR UPDATE ON erp_sales_invoices
  FOR EACH ROW
  EXECUTE FUNCTION erp_generate_sales_invoice_entry();

DROP TRIGGER IF EXISTS trg_supplier_invoice_journal_entry ON erp_supplier_invoices;
CREATE TRIGGER trg_supplier_invoice_journal_entry
  AFTER INSERT OR UPDATE ON erp_supplier_invoices
  FOR EACH ROW
  EXECUTE FUNCTION erp_generate_supplier_invoice_entry();
