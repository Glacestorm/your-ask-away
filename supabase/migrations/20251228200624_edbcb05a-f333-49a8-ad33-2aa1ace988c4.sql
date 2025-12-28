-- ===========================================
-- OBELIXIA ACCOUNTING - FASE 2-7 MIGRATIONS (INCREMENTAL)
-- Solo añadir columnas/tablas faltantes
-- ===========================================

-- 1. CONFIGURACIÓN FISCAL EXTENDIDA
ALTER TABLE obelixia_fiscal_config 
ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'OBX',
ADD COLUMN IF NOT EXISTS invoice_current_number INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_send_invoices BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_days INTEGER[] DEFAULT ARRAY[7, 15, 30],
ADD COLUMN IF NOT EXISTS late_fee_percentage NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS early_payment_discount NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS default_payment_terms INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS igi_rate NUMERIC(5,2) DEFAULT 4.5,
ADD COLUMN IF NOT EXISTS corporate_tax_rate NUMERIC(5,2) DEFAULT 10,
ADD COLUMN IF NOT EXISTS modelo_347_threshold NUMERIC(12,2) DEFAULT 3005.06;

-- 2. SOCIOS - EXTENSIÓN (campos adicionales)
ALTER TABLE obelixia_partners
ADD COLUMN IF NOT EXISTS partner_type TEXT DEFAULT 'shareholder',
ADD COLUMN IF NOT EXISTS irpf_retention_rate NUMERIC(5,2) DEFAULT 19,
ADD COLUMN IF NOT EXISTS social_security_number TEXT,
ADD COLUMN IF NOT EXISTS bank_account TEXT,
ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';

-- 3. FACTURAS - Añadir columnas faltantes
ALTER TABLE obelixia_invoices
ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
ADD COLUMN IF NOT EXISTS invoice_type TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS partner_id UUID,
ADD COLUMN IF NOT EXISTS retention_amount NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS retention_rate NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS journal_entry_id UUID,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 4. TRANSACCIONES DE SOCIOS - Añadir columnas faltantes
ALTER TABLE obelixia_partner_transactions
ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS withholding_amount NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS withholding_rate NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS reference TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Actualizar gross_amount con amount existente donde sea null
UPDATE obelixia_partner_transactions SET gross_amount = amount WHERE gross_amount IS NULL;

-- 5. REGLAS DE CONCILIACIÓN - Añadir columnas faltantes
ALTER TABLE obelixia_reconciliation_rules
ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
ADD COLUMN IF NOT EXISTS amount_min NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS amount_max NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS target_account_code TEXT,
ADD COLUMN IF NOT EXISTS target_partner_id UUID,
ADD COLUMN IF NOT EXISTS auto_approve BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_matched_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_by UUID;

-- 6. LÍNEAS DE FACTURA
CREATE TABLE IF NOT EXISTS obelixia_invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES obelixia_invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(12,4) NOT NULL DEFAULT 1,
    unit_price NUMERIC(15,2) NOT NULL,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    tax_rate NUMERIC(5,2) DEFAULT 21,
    account_code TEXT,
    line_total NUMERIC(15,2) NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. HISTORIAL DE WORKFLOW DE FACTURA
CREATE TABLE IF NOT EXISTS obelixia_invoice_workflow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES obelixia_invoices(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    action TEXT NOT NULL,
    notes TEXT,
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMPTZ DEFAULT now()
);

-- 8. DECLARACIONES FISCALES EXTENDIDAS
CREATE TABLE IF NOT EXISTS obelixia_tax_declarations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
    declaration_type TEXT NOT NULL,
    jurisdiction TEXT NOT NULL DEFAULT 'ES',
    fiscal_year INTEGER NOT NULL,
    period TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    tax_base NUMERIC(15,2) DEFAULT 0,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    deductible_amount NUMERIC(15,2) DEFAULT 0,
    net_amount NUMERIC(15,2) DEFAULT 0,
    calculation_details JSONB DEFAULT '{}',
    submission_date DATE,
    submission_reference TEXT,
    payment_date DATE,
    payment_reference TEXT,
    xml_file_url TEXT,
    pdf_file_url TEXT,
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- 9. IMPORTACIONES BANCARIAS
CREATE TABLE IF NOT EXISTS obelixia_bank_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
    bank_account_id UUID REFERENCES obelixia_bank_accounts(id),
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_url TEXT,
    status TEXT DEFAULT 'pending',
    total_transactions INTEGER DEFAULT 0,
    matched_transactions INTEGER DEFAULT 0,
    pending_transactions INTEGER DEFAULT 0,
    import_date TIMESTAMPTZ DEFAULT now(),
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_by UUID REFERENCES auth.users(id)
);

-- 10. EXPORTACIONES CONTABLES
CREATE TABLE IF NOT EXISTS obelixia_accounting_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
    export_type TEXT NOT NULL,
    export_format TEXT NOT NULL,
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    status TEXT DEFAULT 'pending',
    file_url TEXT,
    file_size INTEGER,
    records_count INTEGER DEFAULT 0,
    generated_at TIMESTAMPTZ,
    downloaded_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- 11. CALENDARIO FISCAL
CREATE TABLE IF NOT EXISTS obelixia_tax_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
    declaration_type TEXT NOT NULL,
    jurisdiction TEXT NOT NULL DEFAULT 'ES',
    fiscal_year INTEGER NOT NULL,
    period TEXT NOT NULL,
    due_date DATE NOT NULL,
    reminder_date DATE,
    status TEXT DEFAULT 'pending',
    declaration_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. ÍNDICES (solo si no existen)
CREATE INDEX IF NOT EXISTS idx_obelixia_invoices_status ON obelixia_invoices(status);
CREATE INDEX IF NOT EXISTS idx_obelixia_invoices_due_date ON obelixia_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_obelixia_tax_declarations_type ON obelixia_tax_declarations(declaration_type, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_obelixia_partner_transactions_partner ON obelixia_partner_transactions(partner_id);

-- 13. RLS para nuevas tablas
ALTER TABLE obelixia_invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE obelixia_invoice_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE obelixia_tax_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE obelixia_bank_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE obelixia_accounting_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE obelixia_tax_calendar ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users can view invoice lines" ON obelixia_invoice_lines;
CREATE POLICY "Users can view invoice lines" ON obelixia_invoice_lines FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can manage invoice lines" ON obelixia_invoice_lines;
CREATE POLICY "Users can manage invoice lines" ON obelixia_invoice_lines FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view invoice workflow" ON obelixia_invoice_workflow;
CREATE POLICY "Users can view invoice workflow" ON obelixia_invoice_workflow FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can manage invoice workflow" ON obelixia_invoice_workflow;
CREATE POLICY "Users can manage invoice workflow" ON obelixia_invoice_workflow FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view tax declarations" ON obelixia_tax_declarations;
CREATE POLICY "Users can view tax declarations" ON obelixia_tax_declarations FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can manage tax declarations" ON obelixia_tax_declarations;
CREATE POLICY "Users can manage tax declarations" ON obelixia_tax_declarations FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view bank imports" ON obelixia_bank_imports;
CREATE POLICY "Users can view bank imports" ON obelixia_bank_imports FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can manage bank imports" ON obelixia_bank_imports;
CREATE POLICY "Users can manage bank imports" ON obelixia_bank_imports FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view accounting exports" ON obelixia_accounting_exports;
CREATE POLICY "Users can view accounting exports" ON obelixia_accounting_exports FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can manage accounting exports" ON obelixia_accounting_exports;
CREATE POLICY "Users can manage accounting exports" ON obelixia_accounting_exports FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view tax calendar" ON obelixia_tax_calendar;
CREATE POLICY "Users can view tax calendar" ON obelixia_tax_calendar FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can manage tax calendar" ON obelixia_tax_calendar;
CREATE POLICY "Users can manage tax calendar" ON obelixia_tax_calendar FOR ALL TO authenticated USING (true);

-- 14. FUNCIÓN PARA GENERAR NÚMERO DE FACTURA
CREATE OR REPLACE FUNCTION generate_invoice_number(p_organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_prefix TEXT;
    v_year TEXT;
    v_next_number INTEGER;
    v_invoice_number TEXT;
BEGIN
    SELECT 
        COALESCE(invoice_prefix, 'OBX'),
        COALESCE(invoice_current_number, 0) + 1
    INTO v_prefix, v_next_number
    FROM obelixia_fiscal_config
    WHERE organization_id = p_organization_id
    LIMIT 1;
    
    IF v_prefix IS NULL THEN
        v_prefix := 'OBX';
        v_next_number := 1;
    END IF;
    
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    UPDATE obelixia_fiscal_config
    SET invoice_current_number = v_next_number,
        updated_at = now()
    WHERE organization_id = p_organization_id;
    
    v_invoice_number := v_prefix || '-' || v_year || '-' || LPAD(v_next_number::TEXT, 5, '0');
    
    RETURN v_invoice_number;
END;
$$;

-- 15. TRIGGER PARA TIMESTAMPS
CREATE OR REPLACE FUNCTION update_obelixia_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_obelixia_tax_declarations_timestamp ON obelixia_tax_declarations;
CREATE TRIGGER update_obelixia_tax_declarations_timestamp
    BEFORE UPDATE ON obelixia_tax_declarations
    FOR EACH ROW EXECUTE FUNCTION update_obelixia_timestamp();