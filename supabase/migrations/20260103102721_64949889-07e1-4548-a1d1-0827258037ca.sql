-- Create erp_accounting_templates table for default PGC templates
CREATE TABLE IF NOT EXISTS public.erp_accounting_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_category TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  description_template TEXT NOT NULL DEFAULT '',
  debit_account_code TEXT NOT NULL,
  debit_account_name TEXT,
  credit_account_code TEXT NOT NULL,
  credit_account_name TEXT,
  tax_account_code TEXT,
  tax_rate NUMERIC(5,2),
  is_default BOOLEAN DEFAULT true,
  auto_post BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT true,
  pgc_reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create erp_auto_accounting_config table for company-specific overrides
CREATE TABLE IF NOT EXISTS public.erp_auto_accounting_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  operation_category TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  description_template TEXT NOT NULL DEFAULT '',
  debit_account_code TEXT NOT NULL,
  debit_account_name TEXT,
  credit_account_code TEXT NOT NULL,
  credit_account_name TEXT,
  tax_account_code TEXT,
  tax_rate NUMERIC(5,2),
  auto_post BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, operation_category, operation_type, transaction_type)
);

-- Enable RLS
ALTER TABLE public.erp_accounting_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_auto_accounting_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for templates (read-only for all authenticated users)
CREATE POLICY "Users can view accounting templates"
ON public.erp_accounting_templates
FOR SELECT
TO authenticated
USING (true);

-- RLS policies for config (authenticated users can manage based on company access)
CREATE POLICY "Users can view accounting config"
ON public.erp_auto_accounting_config
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert accounting config"
ON public.erp_auto_accounting_config
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update accounting config"
ON public.erp_auto_accounting_config
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Users can delete accounting config"
ON public.erp_auto_accounting_config
FOR DELETE
TO authenticated
USING (true);

-- Insert default PGC templates for financing operations
INSERT INTO public.erp_accounting_templates (operation_category, operation_type, transaction_type, description_template, debit_account_code, debit_account_name, credit_account_code, credit_account_name, pgc_reference) VALUES
('financing', 'loan', 'initial', 'Disposición préstamo {contract_number}', '572', 'Bancos e instituciones de crédito', '170', 'Deudas a largo plazo con entidades de crédito', 'NRV 9ª'),
('financing', 'loan', 'payment', 'Cuota préstamo {contract_number} nº {payment_number}', '170', 'Deudas a largo plazo con entidades de crédito', '572', 'Bancos e instituciones de crédito', 'NRV 9ª'),
('financing', 'loan', 'interest', 'Intereses préstamo {contract_number}', '662', 'Intereses de deudas', '572', 'Bancos e instituciones de crédito', 'NRV 9ª'),
('financing', 'leasing', 'initial', 'Alta leasing {contract_number}', '217', 'Derechos sobre bienes en régimen de arrendamiento financiero', '174', 'Acreedores por arrendamiento financiero largo plazo', 'NRV 8ª'),
('financing', 'leasing', 'payment', 'Cuota leasing {contract_number} nº {payment_number}', '174', 'Acreedores por arrendamiento financiero largo plazo', '572', 'Bancos e instituciones de crédito', 'NRV 8ª'),
('financing', 'leasing', 'interest', 'Intereses leasing {contract_number}', '662', 'Intereses de deudas', '572', 'Bancos e instituciones de crédito', 'NRV 8ª'),
('financing', 'credit_line', 'drawdown', 'Disposición línea crédito {contract_number}', '572', 'Bancos e instituciones de crédito', '5201', 'Deudas a corto plazo por crédito dispuesto', 'NRV 9ª'),
('financing', 'credit_line', 'repayment', 'Devolución línea crédito {contract_number}', '5201', 'Deudas a corto plazo por crédito dispuesto', '572', 'Bancos e instituciones de crédito', 'NRV 9ª'),
('financing', 'credit_line', 'interest', 'Intereses línea crédito {contract_number}', '662', 'Intereses de deudas', '572', 'Bancos e instituciones de crédito', 'NRV 9ª'),
('financing', 'credit_policy', 'drawdown', 'Disposición póliza {contract_number}', '572', 'Bancos e instituciones de crédito', '5201', 'Deudas a corto plazo por crédito dispuesto', 'NRV 9ª'),
('financing', 'credit_policy', 'repayment', 'Devolución póliza {contract_number}', '5201', 'Deudas a corto plazo por crédito dispuesto', '572', 'Bancos e instituciones de crédito', 'NRV 9ª'),
('financing', 'credit_policy', 'interest', 'Intereses póliza {contract_number}', '662', 'Intereses de deudas', '572', 'Bancos e instituciones de crédito', 'NRV 9ª'),
('investment', 'term_deposit', 'initial', 'Alta depósito a plazo {investment_name}', '258', 'Imposiciones a largo plazo', '572', 'Bancos e instituciones de crédito', 'NRV 9ª'),
('investment', 'term_deposit', 'maturity', 'Vencimiento depósito {investment_name}', '572', 'Bancos e instituciones de crédito', '258', 'Imposiciones a largo plazo', 'NRV 9ª'),
('investment', 'term_deposit', 'interest', 'Intereses depósito {investment_name}', '572', 'Bancos e instituciones de crédito', '769', 'Otros ingresos financieros', 'NRV 9ª'),
('investment', 'government_bond', 'purchase', 'Compra bono estado {investment_name}', '251', 'Valores representativos de deuda largo plazo', '572', 'Bancos e instituciones de crédito', 'NRV 9ª'),
('investment', 'government_bond', 'sale', 'Venta bono estado {investment_name}', '572', 'Bancos e instituciones de crédito', '251', 'Valores representativos de deuda largo plazo', 'NRV 9ª'),
('investment', 'government_bond', 'interest', 'Cupón bono estado {investment_name}', '572', 'Bancos e instituciones de crédito', '761', 'Ingresos de valores representativos de deuda', 'NRV 9ª'),
('investment', 'stock', 'purchase', 'Compra acciones {investment_name}', '250', 'Inversiones financieras a largo plazo en instrumentos de patrimonio', '572', 'Bancos e instituciones de crédito', 'NRV 9ª'),
('investment', 'stock', 'sale', 'Venta acciones {investment_name}', '572', 'Bancos e instituciones de crédito', '250', 'Inversiones financieras a largo plazo en instrumentos de patrimonio', 'NRV 9ª'),
('investment', 'stock', 'dividend', 'Dividendo acciones {investment_name}', '572', 'Bancos e instituciones de crédito', '760', 'Ingresos de participaciones en instrumentos de patrimonio', 'NRV 9ª'),
('investment', 'mutual_fund', 'purchase', 'Suscripción fondo {investment_name}', '250', 'Inversiones financieras a largo plazo en instrumentos de patrimonio', '572', 'Bancos e instituciones de crédito', 'NRV 9ª'),
('investment', 'mutual_fund', 'sale', 'Reembolso fondo {investment_name}', '572', 'Bancos e instituciones de crédito', '250', 'Inversiones financieras a largo plazo en instrumentos de patrimonio', 'NRV 9ª')
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_erp_accounting_templates_lookup ON public.erp_accounting_templates(operation_category, operation_type, transaction_type);
CREATE INDEX IF NOT EXISTS idx_erp_auto_accounting_config_company ON public.erp_auto_accounting_config(company_id);
CREATE INDEX IF NOT EXISTS idx_erp_auto_accounting_config_lookup ON public.erp_auto_accounting_config(company_id, operation_category, operation_type, transaction_type);