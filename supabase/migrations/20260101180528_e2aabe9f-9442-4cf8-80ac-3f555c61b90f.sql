
-- =====================================================
-- LÓGICA DE NEGOCIO CONTABILIDAD: TRIGGERS Y FUNCIONES
-- =====================================================

-- 1. FUNCIÓN: Obtener siguiente número de asiento (bloqueo transaccional)
CREATE OR REPLACE FUNCTION public.erp_get_next_entry_number(
  p_company_id UUID,
  p_journal_id UUID,
  p_fiscal_year_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix TEXT;
  v_next_num INTEGER;
  v_result TEXT;
BEGIN
  -- Obtener prefijo del diario
  SELECT COALESCE(code, 'AST') INTO v_prefix
  FROM erp_journals
  WHERE id = p_journal_id;
  
  -- Bloqueo advisory para evitar duplicados (transaccional)
  PERFORM pg_advisory_xact_lock(
    ('x' || substr(md5(p_company_id::text || p_journal_id::text || p_fiscal_year_id::text), 1, 15))::bit(60)::bigint
  );
  
  -- Obtener siguiente número
  SELECT COALESCE(MAX(
    CASE 
      WHEN entry_number ~ '^\d+$' THEN entry_number::integer
      WHEN entry_number ~ '/(\d+)$' THEN (regexp_match(entry_number, '/(\d+)$'))[1]::integer
      ELSE 0
    END
  ), 0) + 1
  INTO v_next_num
  FROM erp_journal_entries
  WHERE company_id = p_company_id
    AND journal_id = p_journal_id
    AND fiscal_year_id = p_fiscal_year_id;
  
  -- Formatear número
  v_result := v_prefix || '/' || TO_CHAR(CURRENT_DATE, 'YYYY') || '/' || LPAD(v_next_num::text, 6, '0');
  
  RETURN v_result;
END;
$$;

-- 2. FUNCIÓN: Validar período no cerrado
CREATE OR REPLACE FUNCTION public.erp_validate_period_open(
  p_period_id UUID,
  p_entry_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_closed BOOLEAN;
  v_period_name TEXT;
BEGIN
  SELECT is_closed, name INTO v_is_closed, v_period_name
  FROM erp_periods
  WHERE id = p_period_id;
  
  IF v_is_closed THEN
    RAISE EXCEPTION 'El período "%" está cerrado. No se pueden registrar asientos.', v_period_name
      USING ERRCODE = 'check_violation';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 3. TRIGGER: Bloquear posting en períodos cerrados
CREATE OR REPLACE FUNCTION public.erp_check_period_before_posting()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_closed BOOLEAN;
BEGIN
  -- Solo validar si se está intentando postear
  IF NEW.is_posted = TRUE AND (OLD IS NULL OR OLD.is_posted = FALSE) THEN
    SELECT is_closed INTO v_is_closed
    FROM erp_periods
    WHERE id = NEW.period_id;
    
    IF v_is_closed THEN
      RAISE EXCEPTION 'No se puede contabilizar en un período cerrado'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_erp_check_period_before_posting ON erp_journal_entries;
CREATE TRIGGER trg_erp_check_period_before_posting
  BEFORE INSERT OR UPDATE ON erp_journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION erp_check_period_before_posting();

-- 4. FUNCIÓN: Crear asiento desde factura de venta
CREATE OR REPLACE FUNCTION public.erp_create_journal_entry_from_sales_invoice(
  p_invoice_id UUID,
  p_sales_journal_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice RECORD;
  v_journal_id UUID;
  v_entry_id UUID;
  v_entry_number TEXT;
  v_customer_account_id UUID;
  v_sales_account_id UUID;
  v_vat_account_id UUID;
  v_line_num INTEGER := 1;
BEGIN
  -- Obtener datos de la factura
  SELECT si.*, c.country_code
  INTO v_invoice
  FROM sales_invoices si
  LEFT JOIN erp_companies c ON c.id = si.company_id
  WHERE si.id = p_invoice_id;
  
  IF v_invoice IS NULL THEN
    RAISE EXCEPTION 'Factura no encontrada: %', p_invoice_id;
  END IF;
  
  -- Obtener diario de ventas
  IF p_sales_journal_id IS NULL THEN
    SELECT id INTO v_journal_id
    FROM erp_journals
    WHERE company_id = v_invoice.company_id
      AND code IN ('VENTAS', 'SALES', 'VEN')
      AND is_active = TRUE
    LIMIT 1;
  ELSE
    v_journal_id := p_sales_journal_id;
  END IF;
  
  IF v_journal_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró diario de ventas para la empresa';
  END IF;
  
  -- Buscar cuentas contables según país (España por defecto)
  -- Cuenta de clientes (430)
  SELECT id INTO v_customer_account_id
  FROM erp_chart_accounts
  WHERE company_id = v_invoice.company_id
    AND code LIKE '430%'
    AND accepts_entries = TRUE
    AND is_active = TRUE
  LIMIT 1;
  
  -- Cuenta de ventas (700)
  SELECT id INTO v_sales_account_id
  FROM erp_chart_accounts
  WHERE company_id = v_invoice.company_id
    AND code LIKE '700%'
    AND accepts_entries = TRUE
    AND is_active = TRUE
  LIMIT 1;
  
  -- Cuenta de IVA repercutido (477)
  SELECT id INTO v_vat_account_id
  FROM erp_chart_accounts
  WHERE company_id = v_invoice.company_id
    AND code LIKE '477%'
    AND accepts_entries = TRUE
    AND is_active = TRUE
  LIMIT 1;
  
  -- Generar número de asiento
  v_entry_number := erp_get_next_entry_number(
    v_invoice.company_id,
    v_journal_id,
    v_invoice.fiscal_year_id
  );
  
  -- Crear cabecera del asiento
  INSERT INTO erp_journal_entries (
    company_id, journal_id, period_id, fiscal_year_id,
    entry_number, entry_date, reference, description,
    source_type, source_id, total_debit, total_credit,
    is_balanced, is_posted, created_by
  ) VALUES (
    v_invoice.company_id, v_journal_id, v_invoice.period_id, v_invoice.fiscal_year_id,
    v_entry_number, v_invoice.invoice_date, v_invoice.number,
    'Factura venta ' || v_invoice.number || ' - ' || COALESCE(v_invoice.customer_name, ''),
    'sales_invoice', p_invoice_id, v_invoice.total, v_invoice.total,
    TRUE, FALSE, auth.uid()
  )
  RETURNING id INTO v_entry_id;
  
  -- Línea 1: Debe - Clientes (total factura)
  IF v_customer_account_id IS NOT NULL THEN
    INSERT INTO erp_journal_entry_lines (
      entry_id, line_number, account_id, debit, credit,
      partner_type, partner_id, description
    ) VALUES (
      v_entry_id, v_line_num, v_customer_account_id, v_invoice.total, 0,
      'customer', v_invoice.customer_id, 'Cliente: ' || COALESCE(v_invoice.customer_name, '')
    );
    v_line_num := v_line_num + 1;
  END IF;
  
  -- Línea 2: Haber - Ventas (base imponible)
  IF v_sales_account_id IS NOT NULL THEN
    INSERT INTO erp_journal_entry_lines (
      entry_id, line_number, account_id, debit, credit,
      description
    ) VALUES (
      v_entry_id, v_line_num, v_sales_account_id, 0, v_invoice.subtotal,
      'Ventas factura ' || v_invoice.number
    );
    v_line_num := v_line_num + 1;
  END IF;
  
  -- Línea 3: Haber - IVA repercutido
  IF v_vat_account_id IS NOT NULL AND v_invoice.tax_total > 0 THEN
    INSERT INTO erp_journal_entry_lines (
      entry_id, line_number, account_id, debit, credit,
      tax_amount, description
    ) VALUES (
      v_entry_id, v_line_num, v_vat_account_id, 0, v_invoice.tax_total,
      v_invoice.tax_total, 'IVA repercutido ' || v_invoice.number
    );
  END IF;
  
  -- Registrar en libro de IVA
  INSERT INTO erp_vat_register (
    company_id, period_id, fiscal_year_id, direction,
    document_type, document_number, document_date,
    partner_id, partner_name, partner_vat,
    base_amount, tax_amount, total_amount,
    source_type, source_id, journal_entry_id
  ) VALUES (
    v_invoice.company_id, v_invoice.period_id, v_invoice.fiscal_year_id, 'sales',
    'invoice', v_invoice.number, v_invoice.invoice_date,
    v_invoice.customer_id, v_invoice.customer_name, v_invoice.customer_tax_id,
    v_invoice.subtotal, v_invoice.tax_total, v_invoice.total,
    'sales_invoice', p_invoice_id, v_entry_id
  );
  
  RETURN v_entry_id;
END;
$$;

-- 5. FUNCIÓN: Crear asiento desde factura de proveedor
CREATE OR REPLACE FUNCTION public.erp_create_journal_entry_from_supplier_invoice(
  p_invoice_id UUID,
  p_purchase_journal_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice RECORD;
  v_supplier RECORD;
  v_journal_id UUID;
  v_entry_id UUID;
  v_entry_number TEXT;
  v_supplier_account_id UUID;
  v_purchase_account_id UUID;
  v_vat_account_id UUID;
  v_line_num INTEGER := 1;
BEGIN
  -- Obtener datos de la factura
  SELECT * INTO v_invoice
  FROM erp_supplier_invoices
  WHERE id = p_invoice_id;
  
  IF v_invoice IS NULL THEN
    RAISE EXCEPTION 'Factura de proveedor no encontrada: %', p_invoice_id;
  END IF;
  
  -- Obtener datos del proveedor
  SELECT name, tax_id INTO v_supplier
  FROM erp_suppliers
  WHERE id = v_invoice.supplier_id;
  
  -- Obtener diario de compras
  IF p_purchase_journal_id IS NULL THEN
    SELECT id INTO v_journal_id
    FROM erp_journals
    WHERE company_id = v_invoice.company_id
      AND code IN ('COMPRAS', 'PURCHASES', 'COM')
      AND is_active = TRUE
    LIMIT 1;
  ELSE
    v_journal_id := p_purchase_journal_id;
  END IF;
  
  IF v_journal_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró diario de compras para la empresa';
  END IF;
  
  -- Buscar cuentas contables
  -- Cuenta de proveedores (400)
  SELECT id INTO v_supplier_account_id
  FROM erp_chart_accounts
  WHERE company_id = v_invoice.company_id
    AND code LIKE '400%'
    AND accepts_entries = TRUE
    AND is_active = TRUE
  LIMIT 1;
  
  -- Cuenta de compras/gastos (600)
  SELECT id INTO v_purchase_account_id
  FROM erp_chart_accounts
  WHERE company_id = v_invoice.company_id
    AND code LIKE '600%'
    AND accepts_entries = TRUE
    AND is_active = TRUE
  LIMIT 1;
  
  -- Cuenta de IVA soportado (472)
  SELECT id INTO v_vat_account_id
  FROM erp_chart_accounts
  WHERE company_id = v_invoice.company_id
    AND code LIKE '472%'
    AND accepts_entries = TRUE
    AND is_active = TRUE
  LIMIT 1;
  
  -- Generar número de asiento
  v_entry_number := erp_get_next_entry_number(
    v_invoice.company_id,
    v_journal_id,
    v_invoice.fiscal_year_id
  );
  
  -- Crear cabecera del asiento
  INSERT INTO erp_journal_entries (
    company_id, journal_id, period_id, fiscal_year_id,
    entry_number, entry_date, reference, description,
    source_type, source_id, total_debit, total_credit,
    is_balanced, is_posted, created_by
  ) VALUES (
    v_invoice.company_id, v_journal_id, v_invoice.period_id, v_invoice.fiscal_year_id,
    v_entry_number, v_invoice.invoice_date, v_invoice.supplier_invoice_number,
    'Factura proveedor ' || COALESCE(v_invoice.supplier_invoice_number, v_invoice.document_number) || ' - ' || COALESCE(v_supplier.name, ''),
    'supplier_invoice', p_invoice_id, v_invoice.total, v_invoice.total,
    TRUE, FALSE, auth.uid()
  )
  RETURNING id INTO v_entry_id;
  
  -- Línea 1: Debe - Compras/Gastos (base imponible)
  IF v_purchase_account_id IS NOT NULL THEN
    INSERT INTO erp_journal_entry_lines (
      entry_id, line_number, account_id, debit, credit,
      description
    ) VALUES (
      v_entry_id, v_line_num, v_purchase_account_id, v_invoice.subtotal, 0,
      'Compras factura ' || COALESCE(v_invoice.supplier_invoice_number, v_invoice.document_number)
    );
    v_line_num := v_line_num + 1;
  END IF;
  
  -- Línea 2: Debe - IVA soportado
  IF v_vat_account_id IS NOT NULL AND v_invoice.tax_total > 0 THEN
    INSERT INTO erp_journal_entry_lines (
      entry_id, line_number, account_id, debit, credit,
      tax_amount, description
    ) VALUES (
      v_entry_id, v_line_num, v_vat_account_id, v_invoice.tax_total, 0,
      v_invoice.tax_total, 'IVA soportado ' || COALESCE(v_invoice.supplier_invoice_number, '')
    );
    v_line_num := v_line_num + 1;
  END IF;
  
  -- Línea 3: Haber - Proveedores (total factura)
  IF v_supplier_account_id IS NOT NULL THEN
    INSERT INTO erp_journal_entry_lines (
      entry_id, line_number, account_id, debit, credit,
      partner_type, partner_id, description
    ) VALUES (
      v_entry_id, v_line_num, v_supplier_account_id, 0, v_invoice.total,
      'supplier', v_invoice.supplier_id, 'Proveedor: ' || COALESCE(v_supplier.name, '')
    );
  END IF;
  
  -- Registrar en libro de IVA
  INSERT INTO erp_vat_register (
    company_id, period_id, fiscal_year_id, direction,
    document_type, document_number, document_date,
    partner_id, partner_name, partner_vat,
    base_amount, tax_amount, total_amount,
    source_type, source_id, journal_entry_id
  ) VALUES (
    v_invoice.company_id, v_invoice.period_id, v_invoice.fiscal_year_id, 'purchases',
    'invoice', COALESCE(v_invoice.supplier_invoice_number, v_invoice.document_number), v_invoice.invoice_date,
    v_invoice.supplier_id, v_supplier.name, v_supplier.tax_id,
    v_invoice.subtotal, v_invoice.tax_total, v_invoice.total,
    'supplier_invoice', p_invoice_id, v_entry_id
  );
  
  RETURN v_entry_id;
END;
$$;

-- 6. TRIGGER: Auto-crear asiento al validar factura de venta
CREATE OR REPLACE FUNCTION public.erp_auto_journal_entry_sales_invoice()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo cuando cambia a 'validated' o 'posted'
  IF NEW.status IN ('validated', 'posted') AND 
     (OLD IS NULL OR OLD.status NOT IN ('validated', 'posted')) THEN
    -- Verificar que tenga datos necesarios
    IF NEW.fiscal_year_id IS NOT NULL AND NEW.period_id IS NOT NULL THEN
      PERFORM erp_create_journal_entry_from_sales_invoice(NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_erp_auto_journal_sales_invoice ON sales_invoices;
CREATE TRIGGER trg_erp_auto_journal_sales_invoice
  AFTER INSERT OR UPDATE ON sales_invoices
  FOR EACH ROW
  EXECUTE FUNCTION erp_auto_journal_entry_sales_invoice();

-- 7. TRIGGER: Auto-crear asiento al registrar factura de proveedor
CREATE OR REPLACE FUNCTION public.erp_auto_journal_entry_supplier_invoice()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo cuando cambia a 'validated' o 'posted'
  IF NEW.status IN ('validated', 'posted') AND 
     (OLD IS NULL OR OLD.status NOT IN ('validated', 'posted')) THEN
    -- Verificar que tenga datos necesarios
    IF NEW.fiscal_year_id IS NOT NULL AND NEW.period_id IS NOT NULL THEN
      PERFORM erp_create_journal_entry_from_supplier_invoice(NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_erp_auto_journal_supplier_invoice ON erp_supplier_invoices;
CREATE TRIGGER trg_erp_auto_journal_supplier_invoice
  AFTER INSERT OR UPDATE ON erp_supplier_invoices
  FOR EACH ROW
  EXECUTE FUNCTION erp_auto_journal_entry_supplier_invoice();

-- 8. FUNCIÓN: Generar XML SEPA (estructura base)
CREATE OR REPLACE FUNCTION public.erp_generate_sepa_xml(
  p_remittance_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remittance RECORD;
  v_company RECORD;
  v_lines RECORD;
  v_xml TEXT;
  v_payments_xml TEXT := '';
  v_msg_id TEXT;
  v_payment_count INTEGER := 0;
  v_total_amount NUMERIC := 0;
BEGIN
  -- Obtener datos de la remesa
  SELECT r.*, s.prefix
  INTO v_remittance
  FROM erp_sepa_remittances r
  LEFT JOIN erp_series s ON s.id = r.series_id
  WHERE r.id = p_remittance_id;
  
  IF v_remittance IS NULL THEN
    RAISE EXCEPTION 'Remesa no encontrada: %', p_remittance_id;
  END IF;
  
  -- Obtener datos de la empresa
  SELECT c.*, ba.iban AS company_iban, ba.bic AS company_bic
  INTO v_company
  FROM erp_companies c
  LEFT JOIN erp_bank_accounts ba ON ba.company_id = c.id AND ba.is_default = TRUE
  WHERE c.id = v_remittance.company_id;
  
  -- Generar Message ID único
  v_msg_id := 'MSG-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '-' || SUBSTRING(gen_random_uuid()::text, 1, 8);
  
  -- Construir líneas de pago
  FOR v_lines IN
    SELECT 
      rl.*,
      COALESCE(cu.name, su.name) AS partner_name,
      COALESCE(cu.tax_id, su.tax_id) AS partner_tax_id
    FROM erp_sepa_remittance_lines rl
    LEFT JOIN erp_customers cu ON cu.id = rl.customer_id
    LEFT JOIN erp_suppliers su ON su.id = rl.supplier_id
    WHERE rl.remittance_id = p_remittance_id
      AND rl.status != 'rejected'
  LOOP
    v_payment_count := v_payment_count + 1;
    v_total_amount := v_total_amount + v_lines.amount;
    
    -- Según tipo de remesa
    IF v_remittance.remittance_type IN ('SDD_CORE', 'SDD_B2B') THEN
      -- Adeudo directo SEPA
      v_payments_xml := v_payments_xml || '
        <DrctDbtTxInf>
          <PmtId>
            <EndToEndId>' || v_msg_id || '-' || v_payment_count || '</EndToEndId>
          </PmtId>
          <InstdAmt Ccy="EUR">' || TO_CHAR(v_lines.amount, 'FM999999990.00') || '</InstdAmt>
          <DrctDbtTx>
            <MndtRltdInf>
              <MndtId>' || COALESCE(v_lines.mandate_id::text, 'MANDATE-' || v_payment_count) || '</MndtId>
              <DtOfSgntr>' || TO_CHAR(COALESCE(v_lines.due_date, CURRENT_DATE), 'YYYY-MM-DD') || '</DtOfSgntr>
            </MndtRltdInf>
          </DrctDbtTx>
          <DbtrAgt>
            <FinInstnId>
              <BIC>' || COALESCE(v_lines.bic, 'NOTPROVIDED') || '</BIC>
            </FinInstnId>
          </DbtrAgt>
          <Dbtr>
            <Nm>' || COALESCE(v_lines.partner_name, 'Deudor') || '</Nm>
          </Dbtr>
          <DbtrAcct>
            <Id>
              <IBAN>' || COALESCE(v_lines.iban, '') || '</IBAN>
            </Id>
          </DbtrAcct>
          <RmtInf>
            <Ustrd>Remesa ' || COALESCE(v_remittance.remittance_number, v_remittance.id::text) || '</Ustrd>
          </RmtInf>
        </DrctDbtTxInf>';
    ELSE
      -- Transferencia SEPA
      v_payments_xml := v_payments_xml || '
        <CdtTrfTxInf>
          <PmtId>
            <EndToEndId>' || v_msg_id || '-' || v_payment_count || '</EndToEndId>
          </PmtId>
          <Amt>
            <InstdAmt Ccy="EUR">' || TO_CHAR(v_lines.amount, 'FM999999990.00') || '</InstdAmt>
          </Amt>
          <CdtrAgt>
            <FinInstnId>
              <BIC>' || COALESCE(v_lines.bic, 'NOTPROVIDED') || '</BIC>
            </FinInstnId>
          </CdtrAgt>
          <Cdtr>
            <Nm>' || COALESCE(v_lines.partner_name, 'Acreedor') || '</Nm>
          </Cdtr>
          <CdtrAcct>
            <Id>
              <IBAN>' || COALESCE(v_lines.iban, '') || '</IBAN>
            </Id>
          </CdtrAcct>
          <RmtInf>
            <Ustrd>Pago remesa ' || COALESCE(v_remittance.remittance_number, v_remittance.id::text) || '</Ustrd>
          </RmtInf>
        </CdtTrfTxInf>';
    END IF;
  END LOOP;
  
  -- Construir XML completo según tipo
  IF v_remittance.remittance_type IN ('SDD_CORE', 'SDD_B2B') THEN
    -- pain.008.001.02 para adeudos
    v_xml := '<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.02">
  <CstmrDrctDbtInitn>
    <GrpHdr>
      <MsgId>' || v_msg_id || '</MsgId>
      <CreDtTm>' || TO_CHAR(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS') || '</CreDtTm>
      <NbOfTxs>' || v_payment_count || '</NbOfTxs>
      <CtrlSum>' || TO_CHAR(v_total_amount, 'FM999999990.00') || '</CtrlSum>
      <InitgPty>
        <Nm>' || COALESCE(v_company.legal_name, v_company.name) || '</Nm>
        <Id>
          <OrgId>
            <Othr>
              <Id>' || COALESCE(v_company.tax_id, 'NOTPROVIDED') || '</Id>
            </Othr>
          </OrgId>
        </Id>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>' || v_msg_id || '-PMT</PmtInfId>
      <PmtMtd>DD</PmtMtd>
      <NbOfTxs>' || v_payment_count || '</NbOfTxs>
      <CtrlSum>' || TO_CHAR(v_total_amount, 'FM999999990.00') || '</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
        <LclInstrm>
          <Cd>' || CASE WHEN v_remittance.remittance_type = 'SDD_B2B' THEN 'B2B' ELSE 'CORE' END || '</Cd>
        </LclInstrm>
        <SeqTp>RCUR</SeqTp>
      </PmtTpInf>
      <ReqdColltnDt>' || TO_CHAR(COALESCE(v_remittance.charge_date, CURRENT_DATE), 'YYYY-MM-DD') || '</ReqdColltnDt>
      <Cdtr>
        <Nm>' || COALESCE(v_company.legal_name, v_company.name) || '</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>' || COALESCE(v_company.company_iban, '') || '</IBAN>
        </Id>
      </CdtrAcct>
      <CdtrAgt>
        <FinInstnId>
          <BIC>' || COALESCE(v_company.company_bic, 'NOTPROVIDED') || '</BIC>
        </FinInstnId>
      </CdtrAgt>
      <CdtrSchmeId>
        <Id>
          <PrvtId>
            <Othr>
              <Id>' || COALESCE(v_company.tax_id, 'NOTPROVIDED') || '</Id>
              <SchmeNm>
                <Prtry>SEPA</Prtry>
              </SchmeNm>
            </Othr>
          </PrvtId>
        </Id>
      </CdtrSchmeId>
      ' || v_payments_xml || '
    </PmtInf>
  </CstmrDrctDbtInitn>
</Document>';
  ELSE
    -- pain.001.001.03 para transferencias
    v_xml := '<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>' || v_msg_id || '</MsgId>
      <CreDtTm>' || TO_CHAR(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS') || '</CreDtTm>
      <NbOfTxs>' || v_payment_count || '</NbOfTxs>
      <CtrlSum>' || TO_CHAR(v_total_amount, 'FM999999990.00') || '</CtrlSum>
      <InitgPty>
        <Nm>' || COALESCE(v_company.legal_name, v_company.name) || '</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>' || v_msg_id || '-PMT</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>' || v_payment_count || '</NbOfTxs>
      <CtrlSum>' || TO_CHAR(v_total_amount, 'FM999999990.00') || '</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
      </PmtTpInf>
      <ReqdExctnDt>' || TO_CHAR(COALESCE(v_remittance.presentation_date, CURRENT_DATE), 'YYYY-MM-DD') || '</ReqdExctnDt>
      <Dbtr>
        <Nm>' || COALESCE(v_company.legal_name, v_company.name) || '</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>' || COALESCE(v_company.company_iban, '') || '</IBAN>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BIC>' || COALESCE(v_company.company_bic, 'NOTPROVIDED') || '</BIC>
        </FinInstnId>
      </DbtrAgt>
      ' || v_payments_xml || '
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>';
  END IF;
  
  -- Actualizar remesa con el XML generado
  UPDATE erp_sepa_remittances
  SET 
    status = 'generated',
    xml_content = v_xml,
    total_amount = v_total_amount,
    updated_at = NOW()
  WHERE id = p_remittance_id;
  
  RETURN v_xml;
END;
$$;

-- 9. Añadir columna xml_content si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'erp_sepa_remittances' AND column_name = 'xml_content'
  ) THEN
    ALTER TABLE erp_sepa_remittances ADD COLUMN xml_content TEXT;
  END IF;
END $$;

-- 10. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_erp_journal_entries_company_journal_fiscal 
  ON erp_journal_entries(company_id, journal_id, fiscal_year_id);

CREATE INDEX IF NOT EXISTS idx_erp_journal_entries_source 
  ON erp_journal_entries(source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_erp_vat_register_period 
  ON erp_vat_register(company_id, period_id, direction);
