-- =====================================================
-- MÓDULO DE VENTAS ERP - Fase 2
-- Flujo: Presupuesto → Pedido → Albarán → Factura → Abono
-- =====================================================

-- 1) TABLAS DE CABECERA DE DOCUMENTOS

-- Presupuestos de venta
CREATE TABLE IF NOT EXISTS public.sales_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  series_id UUID REFERENCES public.erp_series(id),
  number TEXT,
  customer_id UUID NOT NULL,
  customer_name TEXT,
  customer_tax_id TEXT,
  customer_address TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted')),
  currency TEXT NOT NULL DEFAULT 'EUR',
  exchange_rate NUMERIC(10,6) DEFAULT 1,
  notes TEXT,
  internal_notes TEXT,
  subtotal NUMERIC(15,2) DEFAULT 0,
  discount_total NUMERIC(15,2) DEFAULT 0,
  tax_total NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos de venta
CREATE TABLE IF NOT EXISTS public.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  series_id UUID REFERENCES public.erp_series(id),
  number TEXT,
  quote_id UUID REFERENCES public.sales_quotes(id),
  customer_id UUID NOT NULL,
  customer_name TEXT,
  customer_tax_id TEXT,
  customer_address TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'partial', 'completed', 'cancelled')),
  currency TEXT NOT NULL DEFAULT 'EUR',
  exchange_rate NUMERIC(10,6) DEFAULT 1,
  notes TEXT,
  internal_notes TEXT,
  subtotal NUMERIC(15,2) DEFAULT 0,
  discount_total NUMERIC(15,2) DEFAULT 0,
  tax_total NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) DEFAULT 0,
  credit_check_passed BOOLEAN DEFAULT TRUE,
  credit_override_by UUID REFERENCES auth.users(id),
  credit_override_reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Albaranes (notas de entrega)
CREATE TABLE IF NOT EXISTS public.delivery_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  series_id UUID REFERENCES public.erp_series(id),
  number TEXT,
  order_id UUID REFERENCES public.sales_orders(id),
  customer_id UUID NOT NULL,
  customer_name TEXT,
  customer_tax_id TEXT,
  delivery_address TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  shipped_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'shipped', 'delivered', 'invoiced', 'cancelled')),
  carrier TEXT,
  tracking_number TEXT,
  notes TEXT,
  internal_notes TEXT,
  subtotal NUMERIC(15,2) DEFAULT 0,
  tax_total NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Facturas de venta
CREATE TABLE IF NOT EXISTS public.sales_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  series_id UUID REFERENCES public.erp_series(id),
  number TEXT,
  customer_id UUID NOT NULL,
  customer_name TEXT,
  customer_tax_id TEXT,
  customer_address TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  due_dates_json JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'sent', 'paid', 'partial', 'overdue', 'cancelled')),
  currency TEXT NOT NULL DEFAULT 'EUR',
  exchange_rate NUMERIC(10,6) DEFAULT 1,
  payment_method TEXT,
  payment_terms TEXT,
  notes TEXT,
  internal_notes TEXT,
  subtotal NUMERIC(15,2) DEFAULT 0,
  discount_total NUMERIC(15,2) DEFAULT 0,
  tax_total NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) DEFAULT 0,
  paid_amount NUMERIC(15,2) DEFAULT 0,
  credit_check_passed BOOLEAN DEFAULT TRUE,
  credit_override_by UUID REFERENCES auth.users(id),
  credit_override_reason TEXT,
  pdf_url TEXT,
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notas de crédito (abonos)
CREATE TABLE IF NOT EXISTS public.sales_credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  series_id UUID REFERENCES public.erp_series(id),
  number TEXT,
  invoice_id UUID REFERENCES public.sales_invoices(id),
  customer_id UUID NOT NULL,
  customer_name TEXT,
  customer_tax_id TEXT,
  customer_address TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'applied', 'cancelled')),
  currency TEXT NOT NULL DEFAULT 'EUR',
  exchange_rate NUMERIC(10,6) DEFAULT 1,
  notes TEXT,
  subtotal NUMERIC(15,2) DEFAULT 0,
  tax_total NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) TABLAS DE LÍNEAS

-- Líneas de presupuesto
CREATE TABLE IF NOT EXISTS public.sales_quote_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.sales_quotes(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL DEFAULT 1,
  item_id UUID,
  item_code TEXT,
  description TEXT NOT NULL,
  qty NUMERIC(15,4) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'UND',
  unit_price NUMERIC(15,4) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  discount_total NUMERIC(15,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 21,
  tax_total NUMERIC(15,2) DEFAULT 0,
  line_total NUMERIC(15,2) DEFAULT 0,
  pricing_breakdown_json JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Líneas de pedido
CREATE TABLE IF NOT EXISTS public.sales_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  quote_line_id UUID REFERENCES public.sales_quote_lines(id),
  line_number INTEGER NOT NULL DEFAULT 1,
  item_id UUID,
  item_code TEXT,
  description TEXT NOT NULL,
  qty NUMERIC(15,4) NOT NULL DEFAULT 1,
  qty_delivered NUMERIC(15,4) DEFAULT 0,
  qty_invoiced NUMERIC(15,4) DEFAULT 0,
  unit TEXT DEFAULT 'UND',
  unit_price NUMERIC(15,4) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  discount_total NUMERIC(15,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 21,
  tax_total NUMERIC(15,2) DEFAULT 0,
  line_total NUMERIC(15,2) DEFAULT 0,
  pricing_breakdown_json JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Líneas de albarán
CREATE TABLE IF NOT EXISTS public.delivery_note_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_note_id UUID NOT NULL REFERENCES public.delivery_notes(id) ON DELETE CASCADE,
  order_line_id UUID REFERENCES public.sales_order_lines(id),
  line_number INTEGER NOT NULL DEFAULT 1,
  item_id UUID,
  item_code TEXT,
  description TEXT NOT NULL,
  qty NUMERIC(15,4) NOT NULL DEFAULT 1,
  qty_invoiced NUMERIC(15,4) DEFAULT 0,
  unit TEXT DEFAULT 'UND',
  unit_price NUMERIC(15,4) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 21,
  tax_total NUMERIC(15,2) DEFAULT 0,
  line_total NUMERIC(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Líneas de factura
CREATE TABLE IF NOT EXISTS public.sales_invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.sales_invoices(id) ON DELETE CASCADE,
  delivery_note_line_id UUID REFERENCES public.delivery_note_lines(id),
  order_line_id UUID REFERENCES public.sales_order_lines(id),
  line_number INTEGER NOT NULL DEFAULT 1,
  item_id UUID,
  item_code TEXT,
  description TEXT NOT NULL,
  qty NUMERIC(15,4) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'UND',
  unit_price NUMERIC(15,4) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  discount_total NUMERIC(15,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 21,
  tax_total NUMERIC(15,2) DEFAULT 0,
  line_total NUMERIC(15,2) DEFAULT 0,
  pricing_breakdown_json JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Líneas de abono
CREATE TABLE IF NOT EXISTS public.sales_credit_note_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_id UUID NOT NULL REFERENCES public.sales_credit_notes(id) ON DELETE CASCADE,
  invoice_line_id UUID REFERENCES public.sales_invoice_lines(id),
  line_number INTEGER NOT NULL DEFAULT 1,
  item_id UUID,
  item_code TEXT,
  description TEXT NOT NULL,
  qty NUMERIC(15,4) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'UND',
  unit_price NUMERIC(15,4) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 21,
  tax_total NUMERIC(15,2) DEFAULT 0,
  line_total NUMERIC(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) VENCIMIENTOS (RECEIVABLES)

CREATE TABLE IF NOT EXISTS public.receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.sales_invoices(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  customer_name TEXT,
  due_date DATE NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  paid_amount NUMERIC(15,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid', 'cancelled')),
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4) COLA DE EMAILS

CREATE TABLE IF NOT EXISTS public.email_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  document_type TEXT,
  document_id UUID,
  to_email TEXT NOT NULL,
  cc_email TEXT,
  bcc_email TEXT,
  subject TEXT NOT NULL,
  body TEXT,
  body_html TEXT,
  attachments_json JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5) EVENTOS DE AUDITORÍA DE VENTAS

CREATE TABLE IF NOT EXISTS public.sales_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.erp_companies(id),
  document_type TEXT NOT NULL,
  document_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  ip_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6) RELACIONES DOCUMENTO-DOCUMENTO (trazabilidad)

CREATE TABLE IF NOT EXISTS public.sales_document_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_type, source_id, target_type, target_id)
);

-- 7) ÍNDICES

CREATE INDEX IF NOT EXISTS idx_sales_quotes_company ON public.sales_quotes(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_customer ON public.sales_quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_status ON public.sales_quotes(status);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_date ON public.sales_quotes(date);

CREATE INDEX IF NOT EXISTS idx_sales_orders_company ON public.sales_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON public.sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON public.sales_orders(status);

CREATE INDEX IF NOT EXISTS idx_delivery_notes_company ON public.delivery_notes(company_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_customer ON public.delivery_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_status ON public.delivery_notes(status);

CREATE INDEX IF NOT EXISTS idx_sales_invoices_company ON public.sales_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON public.sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON public.sales_invoices(status);

CREATE INDEX IF NOT EXISTS idx_sales_credit_notes_company ON public.sales_credit_notes(company_id);
CREATE INDEX IF NOT EXISTS idx_receivables_company ON public.receivables(company_id);
CREATE INDEX IF NOT EXISTS idx_receivables_customer ON public.receivables(customer_id);
CREATE INDEX IF NOT EXISTS idx_receivables_status ON public.receivables(status);
CREATE INDEX IF NOT EXISTS idx_receivables_due_date ON public.receivables(due_date);

CREATE INDEX IF NOT EXISTS idx_email_outbox_status ON public.email_outbox(status);

-- 8) RLS POLICIES

ALTER TABLE public.sales_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_quote_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_note_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_credit_note_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_document_links ENABLE ROW LEVEL SECURITY;

-- Policies para usuarios autenticados
CREATE POLICY "sales_quotes_policy" ON public.sales_quotes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "sales_orders_policy" ON public.sales_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delivery_notes_policy" ON public.delivery_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "sales_invoices_policy" ON public.sales_invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "sales_credit_notes_policy" ON public.sales_credit_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "sales_quote_lines_policy" ON public.sales_quote_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "sales_order_lines_policy" ON public.sales_order_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delivery_note_lines_policy" ON public.delivery_note_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "sales_invoice_lines_policy" ON public.sales_invoice_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "sales_credit_note_lines_policy" ON public.sales_credit_note_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "receivables_policy" ON public.receivables FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "email_outbox_policy" ON public.email_outbox FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "sales_audit_events_policy" ON public.sales_audit_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "sales_document_links_policy" ON public.sales_document_links FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9) TRIGGERS DE UPDATED_AT

CREATE OR REPLACE FUNCTION public.update_sales_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_sales_quotes_timestamp BEFORE UPDATE ON public.sales_quotes FOR EACH ROW EXECUTE FUNCTION update_sales_timestamp();
CREATE TRIGGER update_sales_orders_timestamp BEFORE UPDATE ON public.sales_orders FOR EACH ROW EXECUTE FUNCTION update_sales_timestamp();
CREATE TRIGGER update_delivery_notes_timestamp BEFORE UPDATE ON public.delivery_notes FOR EACH ROW EXECUTE FUNCTION update_sales_timestamp();
CREATE TRIGGER update_sales_invoices_timestamp BEFORE UPDATE ON public.sales_invoices FOR EACH ROW EXECUTE FUNCTION update_sales_timestamp();
CREATE TRIGGER update_sales_credit_notes_timestamp BEFORE UPDATE ON public.sales_credit_notes FOR EACH ROW EXECUTE FUNCTION update_sales_timestamp();
CREATE TRIGGER update_receivables_timestamp BEFORE UPDATE ON public.receivables FOR EACH ROW EXECUTE FUNCTION update_sales_timestamp();

-- 10) FUNCIÓN PARA GENERAR NÚMERO DE DOCUMENTO

CREATE OR REPLACE FUNCTION public.generate_sales_document_number(
  p_company_id UUID,
  p_series_id UUID,
  p_document_type TEXT
) RETURNS TEXT AS $$
DECLARE
  v_series RECORD;
  v_next_number INTEGER;
  v_result TEXT;
BEGIN
  -- Obtener serie
  SELECT * INTO v_series FROM public.erp_series 
  WHERE id = p_series_id AND company_id = p_company_id;
  
  IF NOT FOUND THEN
    -- Generar número simple si no hay serie
    v_next_number := (
      SELECT COALESCE(MAX(CAST(NULLIF(regexp_replace(number, '[^0-9]', '', 'g'), '') AS INTEGER)), 0) + 1
      FROM (
        SELECT number FROM public.sales_quotes WHERE company_id = p_company_id AND number IS NOT NULL
        UNION ALL
        SELECT number FROM public.sales_orders WHERE company_id = p_company_id AND number IS NOT NULL
        UNION ALL
        SELECT number FROM public.delivery_notes WHERE company_id = p_company_id AND number IS NOT NULL
        UNION ALL
        SELECT number FROM public.sales_invoices WHERE company_id = p_company_id AND number IS NOT NULL
        UNION ALL
        SELECT number FROM public.sales_credit_notes WHERE company_id = p_company_id AND number IS NOT NULL
      ) docs
    );
    RETURN LPAD(v_next_number::TEXT, 6, '0');
  END IF;
  
  -- Incrementar contador
  UPDATE public.erp_series 
  SET current_number = current_number + 1 
  WHERE id = p_series_id
  RETURNING current_number INTO v_next_number;
  
  -- Formatear número
  v_result := v_series.prefix || LPAD(v_next_number::TEXT, 6, '0');
  IF v_series.suffix IS NOT NULL THEN
    v_result := v_result || v_series.suffix;
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 11) FUNCIÓN PARA VERIFICAR CRÉDITO

CREATE OR REPLACE FUNCTION public.check_customer_credit(
  p_company_id UUID,
  p_customer_id UUID,
  p_amount NUMERIC
) RETURNS JSONB AS $$
DECLARE
  v_policy RECORD;
  v_current_debt NUMERIC;
  v_overdue_debt NUMERIC;
  v_result JSONB;
BEGIN
  -- Obtener política de crédito
  SELECT * INTO v_policy FROM public.customer_credit_policy
  WHERE company_id = p_company_id AND customer_id = p_customer_id AND is_active = true
  LIMIT 1;
  
  -- Calcular deuda actual
  SELECT COALESCE(SUM(amount - paid_amount), 0) INTO v_current_debt
  FROM public.receivables
  WHERE company_id = p_company_id AND customer_id = p_customer_id AND status IN ('unpaid', 'partial');
  
  -- Calcular deuda vencida
  SELECT COALESCE(SUM(amount - paid_amount), 0) INTO v_overdue_debt
  FROM public.receivables
  WHERE company_id = p_company_id AND customer_id = p_customer_id 
    AND status IN ('unpaid', 'partial') AND due_date < CURRENT_DATE;
  
  -- Construir resultado
  v_result := jsonb_build_object(
    'current_debt', v_current_debt,
    'overdue_debt', v_overdue_debt,
    'new_amount', p_amount,
    'total_exposure', v_current_debt + p_amount,
    'credit_limit', COALESCE(v_policy.credit_limit, 0),
    'has_policy', v_policy IS NOT NULL,
    'passed', true,
    'blocked', false,
    'reason', null
  );
  
  IF v_policy IS NOT NULL THEN
    -- Verificar límite de crédito
    IF v_policy.credit_limit > 0 AND (v_current_debt + p_amount) > v_policy.credit_limit THEN
      v_result := jsonb_set(v_result, '{passed}', 'false');
      v_result := jsonb_set(v_result, '{blocked}', to_jsonb(NOT v_policy.allow_override));
      v_result := jsonb_set(v_result, '{reason}', '"CREDIT_LIMIT_EXCEEDED"');
    END IF;
    
    -- Verificar vencidos
    IF v_policy.block_on_overdue AND v_overdue_debt > 0 THEN
      v_result := jsonb_set(v_result, '{passed}', 'false');
      v_result := jsonb_set(v_result, '{blocked}', to_jsonb(NOT v_policy.allow_override));
      IF (v_result->>'reason') IS NULL THEN
        v_result := jsonb_set(v_result, '{reason}', '"OVERDUE_DEBT"');
      ELSE
        v_result := jsonb_set(v_result, '{reason}', '"CREDIT_LIMIT_AND_OVERDUE"');
      END IF;
    END IF;
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 12) FUNCIÓN PARA CREAR VENCIMIENTOS AL CONFIRMAR FACTURA

CREATE OR REPLACE FUNCTION public.create_invoice_receivables()
RETURNS TRIGGER AS $$
DECLARE
  v_due_dates JSONB;
  v_due_date DATE;
  v_amount NUMERIC;
  v_i INTEGER;
BEGIN
  -- Solo al cambiar a confirmed o sent
  IF NEW.status IN ('confirmed', 'sent') AND OLD.status = 'draft' THEN
    -- Verificar si ya existen vencimientos
    IF EXISTS (SELECT 1 FROM public.receivables WHERE invoice_id = NEW.id) THEN
      RETURN NEW;
    END IF;
    
    -- Crear vencimientos
    v_due_dates := COALESCE(NEW.due_dates_json, '[]'::jsonb);
    
    IF jsonb_array_length(v_due_dates) > 0 THEN
      -- Múltiples vencimientos
      FOR v_i IN 0..jsonb_array_length(v_due_dates)-1 LOOP
        INSERT INTO public.receivables (company_id, invoice_id, customer_id, customer_name, due_date, amount, status)
        VALUES (
          NEW.company_id,
          NEW.id,
          NEW.customer_id,
          NEW.customer_name,
          (v_due_dates->v_i->>'date')::DATE,
          (v_due_dates->v_i->>'amount')::NUMERIC,
          'unpaid'
        );
      END LOOP;
    ELSE
      -- Un solo vencimiento
      INSERT INTO public.receivables (company_id, invoice_id, customer_id, customer_name, due_date, amount, status)
      VALUES (
        NEW.company_id,
        NEW.id,
        NEW.customer_id,
        NEW.customer_name,
        COALESCE(NEW.due_date, NEW.invoice_date + INTERVAL '30 days'),
        NEW.total,
        'unpaid'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER create_receivables_on_invoice_confirm
  AFTER UPDATE ON public.sales_invoices
  FOR EACH ROW
  EXECUTE FUNCTION create_invoice_receivables();