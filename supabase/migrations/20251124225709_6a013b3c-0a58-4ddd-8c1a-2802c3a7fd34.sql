-- Crear tabla para afiliaciones bancarias de empresas
CREATE TABLE IF NOT EXISTS public.company_bank_affiliations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  bank_name TEXT NOT NULL,
  bank_code TEXT,
  is_primary BOOLEAN DEFAULT false,
  affiliation_type TEXT CHECK (affiliation_type IN ('cuenta_corriente', 'credito', 'inversion', 'seguros', 'otros')),
  account_number TEXT,
  priority_order INTEGER DEFAULT 0,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_company
    FOREIGN KEY (company_id)
    REFERENCES public.companies(id)
    ON DELETE CASCADE
);

-- Crear tabla para terminales TPV de empresas
CREATE TABLE IF NOT EXISTS public.company_tpv_terminals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  terminal_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  installation_date DATE,
  monthly_transactions INTEGER,
  monthly_volume NUMERIC(12, 2),
  commission_rate NUMERIC(5, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_company_tpv
    FOREIGN KEY (company_id)
    REFERENCES public.companies(id)
    ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_company_bank_affiliations_company_id ON public.company_bank_affiliations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_bank_affiliations_priority ON public.company_bank_affiliations(company_id, priority_order);
CREATE INDEX IF NOT EXISTS idx_company_tpv_terminals_company_id ON public.company_tpv_terminals(company_id);
CREATE INDEX IF NOT EXISTS idx_company_tpv_terminals_status ON public.company_tpv_terminals(status);

-- Habilitar RLS
ALTER TABLE public.company_bank_affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_tpv_terminals ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para company_bank_affiliations
CREATE POLICY "Admins pueden gestionar afiliaciones bancarias"
ON public.company_bank_affiliations
FOR ALL
TO authenticated
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Gestores pueden ver afiliaciones de sus empresas"
ON public.company_bank_affiliations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = company_bank_affiliations.company_id
    AND (companies.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
  )
);

-- Políticas RLS para company_tpv_terminals  
CREATE POLICY "Admins pueden gestionar terminales TPV"
ON public.company_tpv_terminals
FOR ALL
TO authenticated
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Gestores pueden ver TPV de sus empresas"
ON public.company_tpv_terminals
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = company_tpv_terminals.company_id
    AND (companies.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
  )
);

-- Triggers para actualizar updated_at
CREATE TRIGGER update_company_bank_affiliations_updated_at
BEFORE UPDATE ON public.company_bank_affiliations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_tpv_terminals_updated_at
BEFORE UPDATE ON public.company_tpv_terminals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();