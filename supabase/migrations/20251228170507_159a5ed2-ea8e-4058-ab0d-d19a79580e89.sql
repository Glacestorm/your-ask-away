-- =====================================================
-- OBELIXIA ACCOUNTING MODULE - Database Schema
-- Plan Contable Interno para ObelixIA
-- =====================================================

-- Tabla de configuración fiscal (España/Andorra)
CREATE TABLE public.obelixia_fiscal_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    jurisdiction TEXT NOT NULL DEFAULT 'spain' CHECK (jurisdiction IN ('spain', 'andorra')),
    fiscal_year INTEGER NOT NULL,
    company_name TEXT NOT NULL DEFAULT 'ObelixIA',
    company_tax_id TEXT,
    company_address TEXT,
    vat_rate_standard NUMERIC(5,2) DEFAULT 21.00,
    vat_rate_reduced NUMERIC(5,2) DEFAULT 10.00,
    vat_rate_superreduced NUMERIC(5,2) DEFAULT 4.00,
    corporate_tax_rate NUMERIC(5,2) DEFAULT 25.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Plan Contable ObelixIA (PGC España adaptado)
CREATE TABLE public.obelixia_chart_of_accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    account_code TEXT NOT NULL UNIQUE,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'income', 'expense')),
    account_group INTEGER NOT NULL CHECK (account_group BETWEEN 1 AND 9),
    parent_account_code TEXT,
    description TEXT,
    is_detail BOOLEAN DEFAULT true,
    accepts_entries BOOLEAN DEFAULT true,
    normal_balance TEXT DEFAULT 'debit' CHECK (normal_balance IN ('debit', 'credit')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ejercicios Fiscales
CREATE TABLE public.obelixia_fiscal_periods (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    fiscal_year INTEGER NOT NULL,
    period_number INTEGER NOT NULL CHECK (period_number BETWEEN 0 AND 13),
    period_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'locked')),
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(fiscal_year, period_number)
);

-- Libro Diario (Asientos Contables)
CREATE TABLE public.obelixia_journal_entries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    entry_number TEXT NOT NULL UNIQUE,
    entry_date DATE NOT NULL,
    fiscal_period_id UUID REFERENCES public.obelixia_fiscal_periods(id),
    description TEXT NOT NULL,
    reference_type TEXT CHECK (reference_type IN ('invoice', 'payment', 'expense', 'payroll', 'adjustment', 'opening', 'closing', 'manual')),
    reference_id UUID,
    source_document TEXT,
    is_automatic BOOLEAN DEFAULT false,
    is_reversing BOOLEAN DEFAULT false,
    reversed_entry_id UUID REFERENCES public.obelixia_journal_entries(id),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'reversed')),
    posted_at TIMESTAMP WITH TIME ZONE,
    posted_by UUID,
    total_debit NUMERIC(15,2) DEFAULT 0,
    total_credit NUMERIC(15,2) DEFAULT 0,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Líneas del Asiento (Debe/Haber)
CREATE TABLE public.obelixia_journal_entry_lines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    journal_entry_id UUID NOT NULL REFERENCES public.obelixia_journal_entries(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    account_id UUID NOT NULL REFERENCES public.obelixia_chart_of_accounts(id),
    debit_amount NUMERIC(15,2) DEFAULT 0,
    credit_amount NUMERIC(15,2) DEFAULT 0,
    description TEXT,
    tax_code TEXT,
    tax_amount NUMERIC(15,2),
    cost_center TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT check_debit_or_credit CHECK (
        (debit_amount > 0 AND credit_amount = 0) OR 
        (credit_amount > 0 AND debit_amount = 0) OR
        (debit_amount = 0 AND credit_amount = 0)
    )
);

-- Libro Mayor (Saldos por Cuenta)
CREATE TABLE public.obelixia_ledger_balances (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES public.obelixia_chart_of_accounts(id),
    fiscal_period_id UUID NOT NULL REFERENCES public.obelixia_fiscal_periods(id),
    opening_debit NUMERIC(15,2) DEFAULT 0,
    opening_credit NUMERIC(15,2) DEFAULT 0,
    period_debit NUMERIC(15,2) DEFAULT 0,
    period_credit NUMERIC(15,2) DEFAULT 0,
    closing_debit NUMERIC(15,2) DEFAULT 0,
    closing_credit NUMERIC(15,2) DEFAULT 0,
    balance NUMERIC(15,2) DEFAULT 0,
    last_entry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(account_id, fiscal_period_id)
);

-- Socios/Propietarios de ObelixIA
CREATE TABLE public.obelixia_partners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    partner_name TEXT NOT NULL,
    partner_tax_id TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    ownership_percentage NUMERIC(5,2) NOT NULL CHECK (ownership_percentage > 0 AND ownership_percentage <= 100),
    capital_contributed NUMERIC(15,2) DEFAULT 0,
    current_account_balance NUMERIC(15,2) DEFAULT 0,
    is_administrator BOOLEAN DEFAULT false,
    administrator_remuneration NUMERIC(15,2) DEFAULT 0,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    exit_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Transacciones de Socios
CREATE TABLE public.obelixia_partner_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES public.obelixia_partners(id),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('capital_contribution', 'capital_withdrawal', 'loan_to_company', 'loan_repayment', 'dividend', 'expense_reimbursement', 'admin_remuneration', 'other')),
    transaction_date DATE NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    description TEXT,
    journal_entry_id UUID REFERENCES public.obelixia_journal_entries(id),
    tax_withholding NUMERIC(15,2) DEFAULT 0,
    net_amount NUMERIC(15,2),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Cuentas Bancarias de ObelixIA
CREATE TABLE public.obelixia_bank_accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    account_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    iban TEXT,
    swift_bic TEXT,
    account_number TEXT,
    currency TEXT DEFAULT 'EUR',
    chart_account_id UUID REFERENCES public.obelixia_chart_of_accounts(id),
    current_balance NUMERIC(15,2) DEFAULT 0,
    last_reconciled_date DATE,
    last_reconciled_balance NUMERIC(15,2),
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Movimientos Bancarios (para conciliación)
CREATE TABLE public.obelixia_bank_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bank_account_id UUID NOT NULL REFERENCES public.obelixia_bank_accounts(id),
    transaction_date DATE NOT NULL,
    value_date DATE,
    amount NUMERIC(15,2) NOT NULL,
    balance_after NUMERIC(15,2),
    description TEXT,
    reference TEXT,
    counterparty_name TEXT,
    counterparty_iban TEXT,
    transaction_type TEXT CHECK (transaction_type IN ('credit', 'debit')),
    category TEXT,
    is_reconciled BOOLEAN DEFAULT false,
    reconciled_entry_id UUID REFERENCES public.obelixia_journal_entries(id),
    reconciled_at TIMESTAMP WITH TIME ZONE,
    reconciled_by UUID,
    import_batch_id UUID,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Reglas de Conciliación Automática
CREATE TABLE public.obelixia_reconciliation_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_name TEXT NOT NULL,
    priority INTEGER DEFAULT 100,
    match_field TEXT NOT NULL CHECK (match_field IN ('description', 'amount', 'reference', 'counterparty')),
    match_type TEXT NOT NULL CHECK (match_type IN ('exact', 'contains', 'regex', 'range')),
    match_value TEXT NOT NULL,
    target_account_id UUID REFERENCES public.obelixia_chart_of_accounts(id),
    target_category TEXT,
    auto_create_entry BOOLEAN DEFAULT false,
    entry_template JSONB,
    is_active BOOLEAN DEFAULT true,
    matches_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Declaraciones Fiscales
CREATE TABLE public.obelixia_fiscal_declarations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    declaration_type TEXT NOT NULL,
    fiscal_period_id UUID REFERENCES public.obelixia_fiscal_periods(id),
    declaration_period TEXT NOT NULL,
    due_date DATE NOT NULL,
    submission_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'calculated', 'submitted', 'accepted', 'rejected')),
    calculated_data JSONB,
    submitted_data JSONB,
    total_amount NUMERIC(15,2),
    reference_number TEXT,
    notes TEXT,
    submitted_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Automatizaciones del Ciclo Comercial
CREATE TABLE public.obelixia_automation_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_name TEXT NOT NULL,
    trigger_event TEXT NOT NULL CHECK (trigger_event IN ('quote_accepted', 'invoice_created', 'invoice_sent', 'payment_received', 'payment_due', 'payment_overdue')),
    action_type TEXT NOT NULL CHECK (action_type IN ('create_invoice', 'send_email', 'create_entry', 'create_reminder', 'update_status', 'notify')),
    action_config JSONB NOT NULL,
    delay_hours INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    executions_count INTEGER DEFAULT 0,
    last_execution_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Log de Ejecuciones de Automatización
CREATE TABLE public.obelixia_automation_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_id UUID REFERENCES public.obelixia_automation_rules(id),
    trigger_event TEXT NOT NULL,
    source_entity_type TEXT,
    source_entity_id UUID,
    action_taken TEXT,
    result_status TEXT CHECK (result_status IN ('success', 'failed', 'skipped')),
    result_data JSONB,
    error_message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.obelixia_fiscal_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_fiscal_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_ledger_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_partner_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_reconciliation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_fiscal_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_automation_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (solo superadmin/admin)
CREATE POLICY "Admins full access obelixia_fiscal_config" ON public.obelixia_fiscal_config FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));
CREATE POLICY "Admins full access obelixia_chart_of_accounts" ON public.obelixia_chart_of_accounts FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));
CREATE POLICY "Admins full access obelixia_fiscal_periods" ON public.obelixia_fiscal_periods FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));
CREATE POLICY "Admins full access obelixia_journal_entries" ON public.obelixia_journal_entries FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));
CREATE POLICY "Admins full access obelixia_journal_entry_lines" ON public.obelixia_journal_entry_lines FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));
CREATE POLICY "Admins full access obelixia_ledger_balances" ON public.obelixia_ledger_balances FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));
CREATE POLICY "Admins full access obelixia_partners" ON public.obelixia_partners FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));
CREATE POLICY "Admins full access obelixia_partner_transactions" ON public.obelixia_partner_transactions FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));
CREATE POLICY "Admins full access obelixia_bank_accounts" ON public.obelixia_bank_accounts FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));
CREATE POLICY "Admins full access obelixia_bank_transactions" ON public.obelixia_bank_transactions FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));
CREATE POLICY "Admins full access obelixia_reconciliation_rules" ON public.obelixia_reconciliation_rules FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));
CREATE POLICY "Admins full access obelixia_fiscal_declarations" ON public.obelixia_fiscal_declarations FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));
CREATE POLICY "Admins full access obelixia_automation_rules" ON public.obelixia_automation_rules FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));
CREATE POLICY "Admins full access obelixia_automation_log" ON public.obelixia_automation_log FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_obelixia_accounting_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_obelixia_fiscal_config_timestamp BEFORE UPDATE ON public.obelixia_fiscal_config FOR EACH ROW EXECUTE FUNCTION public.update_obelixia_accounting_timestamp();
CREATE TRIGGER update_obelixia_chart_of_accounts_timestamp BEFORE UPDATE ON public.obelixia_chart_of_accounts FOR EACH ROW EXECUTE FUNCTION public.update_obelixia_accounting_timestamp();
CREATE TRIGGER update_obelixia_fiscal_periods_timestamp BEFORE UPDATE ON public.obelixia_fiscal_periods FOR EACH ROW EXECUTE FUNCTION public.update_obelixia_accounting_timestamp();
CREATE TRIGGER update_obelixia_journal_entries_timestamp BEFORE UPDATE ON public.obelixia_journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_obelixia_accounting_timestamp();
CREATE TRIGGER update_obelixia_ledger_balances_timestamp BEFORE UPDATE ON public.obelixia_ledger_balances FOR EACH ROW EXECUTE FUNCTION public.update_obelixia_accounting_timestamp();
CREATE TRIGGER update_obelixia_partners_timestamp BEFORE UPDATE ON public.obelixia_partners FOR EACH ROW EXECUTE FUNCTION public.update_obelixia_accounting_timestamp();
CREATE TRIGGER update_obelixia_partner_transactions_timestamp BEFORE UPDATE ON public.obelixia_partner_transactions FOR EACH ROW EXECUTE FUNCTION public.update_obelixia_accounting_timestamp();
CREATE TRIGGER update_obelixia_bank_accounts_timestamp BEFORE UPDATE ON public.obelixia_bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_obelixia_accounting_timestamp();
CREATE TRIGGER update_obelixia_bank_transactions_timestamp BEFORE UPDATE ON public.obelixia_bank_transactions FOR EACH ROW EXECUTE FUNCTION public.update_obelixia_accounting_timestamp();
CREATE TRIGGER update_obelixia_reconciliation_rules_timestamp BEFORE UPDATE ON public.obelixia_reconciliation_rules FOR EACH ROW EXECUTE FUNCTION public.update_obelixia_accounting_timestamp();
CREATE TRIGGER update_obelixia_fiscal_declarations_timestamp BEFORE UPDATE ON public.obelixia_fiscal_declarations FOR EACH ROW EXECUTE FUNCTION public.update_obelixia_accounting_timestamp();
CREATE TRIGGER update_obelixia_automation_rules_timestamp BEFORE UPDATE ON public.obelixia_automation_rules FOR EACH ROW EXECUTE FUNCTION public.update_obelixia_accounting_timestamp();

-- Función para generar número de asiento
CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
RETURNS TRIGGER AS $$
DECLARE
    current_year INTEGER;
    next_number INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM NEW.entry_date);
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(entry_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.obelixia_journal_entries
    WHERE entry_number LIKE 'OBX-' || current_year || '-%';
    
    NEW.entry_number := 'OBX-' || current_year || '-' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_entry_number
    BEFORE INSERT ON public.obelixia_journal_entries
    FOR EACH ROW
    WHEN (NEW.entry_number IS NULL OR NEW.entry_number = '')
    EXECUTE FUNCTION public.generate_journal_entry_number();

-- Función para actualizar saldos del libro mayor
CREATE OR REPLACE FUNCTION public.update_ledger_balance_on_entry()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update or insert ledger balance
        INSERT INTO public.obelixia_ledger_balances (account_id, fiscal_period_id, period_debit, period_credit, last_entry_date)
        SELECT 
            jel.account_id,
            je.fiscal_period_id,
            SUM(jel.debit_amount),
            SUM(jel.credit_amount),
            MAX(je.entry_date)
        FROM public.obelixia_journal_entry_lines jel
        JOIN public.obelixia_journal_entries je ON jel.journal_entry_id = je.id
        WHERE je.id = NEW.journal_entry_id AND je.status = 'posted'
        GROUP BY jel.account_id, je.fiscal_period_id
        ON CONFLICT (account_id, fiscal_period_id) 
        DO UPDATE SET
            period_debit = EXCLUDED.period_debit,
            period_credit = EXCLUDED.period_credit,
            last_entry_date = EXCLUDED.last_entry_date,
            balance = EXCLUDED.period_debit - EXCLUDED.period_credit,
            updated_at = now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Insertar Plan Contable inicial (PGC España adaptado para empresa de servicios tecnológicos)
INSERT INTO public.obelixia_chart_of_accounts (account_code, account_name, account_type, account_group, is_detail, normal_balance, description) VALUES
-- GRUPO 1: FINANCIACIÓN BÁSICA
('10', 'CAPITAL', 'equity', 1, false, 'credit', 'Capital social'),
('100', 'Capital social', 'equity', 1, true, 'credit', 'Capital social de ObelixIA'),
('11', 'RESERVAS', 'equity', 1, false, 'credit', 'Reservas'),
('112', 'Reserva legal', 'equity', 1, true, 'credit', 'Reserva legal obligatoria'),
('113', 'Reservas voluntarias', 'equity', 1, true, 'credit', 'Reservas voluntarias'),
('12', 'RESULTADOS PENDIENTES', 'equity', 1, false, 'credit', 'Resultados pendientes'),
('120', 'Remanente', 'equity', 1, true, 'credit', 'Resultados de ejercicios anteriores'),
('121', 'Resultados negativos ejercicios anteriores', 'equity', 1, true, 'debit', 'Pérdidas acumuladas'),
('129', 'Resultado del ejercicio', 'equity', 1, true, 'credit', 'Pérdida o beneficio'),

-- GRUPO 2: INMOVILIZADO
('20', 'INMOVILIZADO INTANGIBLE', 'asset', 2, false, 'debit', 'Activos intangibles'),
('206', 'Aplicaciones informáticas', 'asset', 2, true, 'debit', 'Software y licencias'),
('21', 'INMOVILIZADO MATERIAL', 'asset', 2, false, 'debit', 'Activos materiales'),
('217', 'Equipos informáticos', 'asset', 2, true, 'debit', 'Hardware'),
('218', 'Elementos de transporte', 'asset', 2, true, 'debit', 'Vehículos'),
('219', 'Otro inmovilizado material', 'asset', 2, true, 'debit', 'Mobiliario y enseres'),
('28', 'AMORTIZACIÓN ACUMULADA', 'asset', 2, false, 'credit', 'Amortizaciones'),
('280', 'Amortización acumulada inmovilizado intangible', 'asset', 2, true, 'credit', 'Amortización software'),
('281', 'Amortización acumulada inmovilizado material', 'asset', 2, true, 'credit', 'Amortización hardware'),

-- GRUPO 4: ACREEDORES Y DEUDORES
('40', 'PROVEEDORES', 'liability', 4, false, 'credit', 'Proveedores'),
('400', 'Proveedores', 'liability', 4, true, 'credit', 'Proveedores comerciales'),
('410', 'Acreedores prestación servicios', 'liability', 4, true, 'credit', 'Freelancers y servicios'),
('43', 'CLIENTES', 'asset', 4, false, 'debit', 'Clientes'),
('430', 'Clientes', 'asset', 4, true, 'debit', 'Clientes por ventas'),
('435', 'Clientes efectos a cobrar', 'asset', 4, true, 'debit', 'Efectos comerciales'),
('436', 'Clientes de dudoso cobro', 'asset', 4, true, 'debit', 'Provisión insolvencias'),
('46', 'PERSONAL', 'liability', 4, false, 'credit', 'Personal y socios'),
('460', 'Anticipos de remuneraciones', 'asset', 4, true, 'debit', 'Anticipos empleados'),
('465', 'Remuneraciones pendientes de pago', 'liability', 4, true, 'credit', 'Nóminas pendientes'),
('47', 'ADMINISTRACIONES PÚBLICAS', 'liability', 4, false, 'credit', 'Hacienda y SS'),
('470', 'Hacienda Pública deudora por IVA', 'asset', 4, true, 'debit', 'IVA a compensar'),
('471', 'Organismos Seguridad Social deudores', 'asset', 4, true, 'debit', 'SS a favor'),
('472', 'Hacienda Pública IVA soportado', 'asset', 4, true, 'debit', 'IVA soportado'),
('4750', 'Hacienda Pública acreedora retenciones practicadas', 'liability', 4, true, 'credit', 'IRPF retenido'),
('4751', 'Hacienda Pública acreedora por IRPF', 'liability', 4, true, 'credit', 'IRPF a pagar'),
('476', 'Organismos Seguridad Social acreedores', 'liability', 4, true, 'credit', 'SS a pagar'),
('477', 'Hacienda Pública IVA repercutido', 'liability', 4, true, 'credit', 'IVA repercutido'),
('4700', 'Hacienda Pública deudora por IS', 'asset', 4, true, 'debit', 'IS a devolver'),
('4752', 'Hacienda Pública acreedora por IS', 'liability', 4, true, 'credit', 'IS a pagar'),

-- GRUPO 5: CUENTAS FINANCIERAS
('55', 'OTRAS CUENTAS NO BANCARIAS', 'asset', 5, false, 'debit', 'Cuentas financieras varias'),
('551', 'Cuenta corriente con socios y administradores', 'asset', 5, true, 'debit', 'C/C socios'),
('555', 'Partidas pendientes de aplicación', 'asset', 5, true, 'debit', 'Movimientos sin identificar'),
('57', 'TESORERÍA', 'asset', 5, false, 'debit', 'Caja y bancos'),
('570', 'Caja', 'asset', 5, true, 'debit', 'Efectivo'),
('572', 'Bancos c/c', 'asset', 5, true, 'debit', 'Cuenta corriente bancaria'),
('5720', 'Banco principal EUR', 'asset', 5, true, 'debit', 'Cuenta bancaria principal'),
('5721', 'Banco secundario EUR', 'asset', 5, true, 'debit', 'Cuenta bancaria secundaria'),

-- GRUPO 6: COMPRAS Y GASTOS
('60', 'COMPRAS', 'expense', 6, false, 'debit', 'Compras de existencias'),
('600', 'Compras de mercaderías', 'expense', 6, true, 'debit', 'Compras para reventa'),
('607', 'Trabajos realizados por otras empresas', 'expense', 6, true, 'debit', 'Subcontratación'),
('62', 'SERVICIOS EXTERIORES', 'expense', 6, false, 'debit', 'Gastos externos'),
('621', 'Arrendamientos y cánones', 'expense', 6, true, 'debit', 'Alquileres, licencias SaaS'),
('622', 'Reparaciones y conservación', 'expense', 6, true, 'debit', 'Mantenimiento'),
('623', 'Servicios profesionales independientes', 'expense', 6, true, 'debit', 'Asesoría, abogados'),
('624', 'Transportes', 'expense', 6, true, 'debit', 'Mensajería, envíos'),
('625', 'Primas de seguros', 'expense', 6, true, 'debit', 'Seguros'),
('626', 'Servicios bancarios', 'expense', 6, true, 'debit', 'Comisiones bancarias'),
('627', 'Publicidad y propaganda', 'expense', 6, true, 'debit', 'Marketing'),
('628', 'Suministros', 'expense', 6, true, 'debit', 'Electricidad, agua, internet'),
('629', 'Otros servicios', 'expense', 6, true, 'debit', 'Otros gastos externos'),
('63', 'TRIBUTOS', 'expense', 6, false, 'debit', 'Impuestos'),
('631', 'Otros tributos', 'expense', 6, true, 'debit', 'Tasas, IAE'),
('64', 'GASTOS DE PERSONAL', 'expense', 6, false, 'debit', 'Nóminas y SS'),
('640', 'Sueldos y salarios', 'expense', 6, true, 'debit', 'Salarios brutos'),
('641', 'Indemnizaciones', 'expense', 6, true, 'debit', 'Indemnizaciones'),
('642', 'Seguridad Social a cargo empresa', 'expense', 6, true, 'debit', 'SS empresa'),
('649', 'Otros gastos sociales', 'expense', 6, true, 'debit', 'Formación, tickets'),
('65', 'OTROS GASTOS DE GESTIÓN', 'expense', 6, false, 'debit', 'Gastos varios'),
('659', 'Otras pérdidas gestión corriente', 'expense', 6, true, 'debit', 'Diferencias, redondeos'),
('66', 'GASTOS FINANCIEROS', 'expense', 6, false, 'debit', 'Intereses y gastos financieros'),
('662', 'Intereses de deudas', 'expense', 6, true, 'debit', 'Intereses préstamos'),
('669', 'Otros gastos financieros', 'expense', 6, true, 'debit', 'Gastos financieros varios'),
('68', 'DOTACIONES AMORTIZACIÓN', 'expense', 6, false, 'debit', 'Amortizaciones'),
('680', 'Amortización inmovilizado intangible', 'expense', 6, true, 'debit', 'Amortización software'),
('681', 'Amortización inmovilizado material', 'expense', 6, true, 'debit', 'Amortización hardware'),

-- GRUPO 7: VENTAS E INGRESOS
('70', 'VENTAS DE SERVICIOS', 'income', 7, false, 'credit', 'Ingresos por servicios'),
('705', 'Prestaciones de servicios', 'income', 7, true, 'credit', 'Servicios facturados'),
('7050', 'Servicios SaaS - Suscripciones', 'income', 7, true, 'credit', 'Licencias mensuales'),
('7051', 'Servicios consultoría', 'income', 7, true, 'credit', 'Proyectos consultoría'),
('7052', 'Servicios implementación', 'income', 7, true, 'credit', 'Implementaciones'),
('7053', 'Servicios formación', 'income', 7, true, 'credit', 'Cursos y formación'),
('7054', 'Servicios soporte', 'income', 7, true, 'credit', 'Soporte técnico'),
('708', 'Devoluciones ventas', 'income', 7, true, 'debit', 'Anulaciones'),
('709', 'Descuentos sobre ventas', 'income', 7, true, 'debit', 'Rappels, dto pronto pago'),
('74', 'SUBVENCIONES', 'income', 7, false, 'credit', 'Ayudas públicas'),
('740', 'Subvenciones explotación', 'income', 7, true, 'credit', 'Subvenciones'),
('75', 'OTROS INGRESOS GESTIÓN', 'income', 7, false, 'credit', 'Ingresos varios'),
('752', 'Ingresos por arrendamientos', 'income', 7, true, 'credit', 'Subarriendos'),
('759', 'Ingresos por servicios diversos', 'income', 7, true, 'credit', 'Otros ingresos'),
('76', 'INGRESOS FINANCIEROS', 'income', 7, false, 'credit', 'Intereses e ingresos financieros'),
('769', 'Otros ingresos financieros', 'income', 7, true, 'credit', 'Intereses bancarios'),
('77', 'BENEFICIOS EXTRAORDINARIOS', 'income', 7, false, 'credit', 'Ganancias atípicas'),
('778', 'Ingresos extraordinarios', 'income', 7, true, 'credit', 'Ingresos extraordinarios');

-- Insertar ejercicio fiscal 2025
INSERT INTO public.obelixia_fiscal_periods (fiscal_year, period_number, period_name, start_date, end_date) VALUES
(2025, 0, 'Apertura 2025', '2025-01-01', '2025-01-01'),
(2025, 1, 'Enero 2025', '2025-01-01', '2025-01-31'),
(2025, 2, 'Febrero 2025', '2025-02-01', '2025-02-28'),
(2025, 3, 'Marzo 2025', '2025-03-01', '2025-03-31'),
(2025, 4, 'Abril 2025', '2025-04-01', '2025-04-30'),
(2025, 5, 'Mayo 2025', '2025-05-01', '2025-05-31'),
(2025, 6, 'Junio 2025', '2025-06-01', '2025-06-30'),
(2025, 7, 'Julio 2025', '2025-07-01', '2025-07-31'),
(2025, 8, 'Agosto 2025', '2025-08-01', '2025-08-31'),
(2025, 9, 'Septiembre 2025', '2025-09-01', '2025-09-30'),
(2025, 10, 'Octubre 2025', '2025-10-01', '2025-10-31'),
(2025, 11, 'Noviembre 2025', '2025-11-01', '2025-11-30'),
(2025, 12, 'Diciembre 2025', '2025-12-01', '2025-12-31'),
(2025, 13, 'Cierre 2025', '2025-12-31', '2025-12-31');

-- Insertar configuración fiscal inicial
INSERT INTO public.obelixia_fiscal_config (jurisdiction, fiscal_year, company_name, vat_rate_standard, corporate_tax_rate) VALUES
('spain', 2025, 'ObelixIA S.L.', 21.00, 25.00);

-- Insertar reglas de automatización por defecto
INSERT INTO public.obelixia_automation_rules (rule_name, trigger_event, action_type, action_config) VALUES
('Auto-generar factura al aceptar presupuesto', 'quote_accepted', 'create_invoice', '{"copy_lines": true, "auto_send": false}'),
('Recordatorio pago 7 días', 'payment_due', 'send_email', '{"template": "payment_reminder_7", "delay_days": 7}'),
('Recordatorio pago 15 días', 'payment_due', 'send_email', '{"template": "payment_reminder_15", "delay_days": 15}'),
('Recordatorio pago 30 días', 'payment_overdue', 'send_email', '{"template": "payment_overdue_30", "delay_days": 30}'),
('Asiento automático cobro', 'payment_received', 'create_entry', '{"debit": "572", "credit": "430", "auto_post": true}');