-- Tabla de cotizaciones para clientes
CREATE TABLE public.customer_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_company TEXT,
  customer_tax_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  notes TEXT,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Items de cotización con precios personalizados
CREATE TABLE public.customer_quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.customer_quotes(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  module_name TEXT NOT NULL,
  custom_price NUMERIC NOT NULL,
  license_type TEXT NOT NULL DEFAULT 'annual' CHECK (license_type IN ('annual', 'perpetual', 'monthly')),
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.customer_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_quote_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - Solo admins pueden gestionar cotizaciones
CREATE POLICY "Admins can manage quotes" ON public.customer_quotes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('superadmin', 'admin', 'director_comercial')
    )
  );

CREATE POLICY "Admins can manage quote items" ON public.customer_quote_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.customer_quotes cq
      JOIN public.user_roles ur ON ur.user_id = auth.uid()
      WHERE cq.id = customer_quote_items.quote_id
      AND ur.role IN ('superadmin', 'admin', 'director_comercial')
    )
  );

-- Clientes pueden ver sus propias cotizaciones por email (via función)
CREATE OR REPLACE FUNCTION public.get_customer_quote_by_token(p_quote_id UUID, p_email TEXT)
RETURNS TABLE (
  quote_id UUID,
  customer_email TEXT,
  customer_name TEXT,
  customer_company TEXT,
  status TEXT,
  valid_until TIMESTAMP WITH TIME ZONE,
  items JSONB
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id as quote_id,
    q.customer_email,
    q.customer_name,
    q.customer_company,
    q.status,
    q.valid_until,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'module_key', qi.module_key,
        'module_name', qi.module_name,
        'custom_price', qi.custom_price,
        'license_type', qi.license_type,
        'quantity', qi.quantity
      ))
      FROM public.customer_quote_items qi
      WHERE qi.quote_id = q.id
    ) as items
  FROM public.customer_quotes q
  WHERE q.id = p_quote_id 
    AND q.customer_email = p_email
    AND q.status IN ('sent', 'pending')
    AND (q.valid_until IS NULL OR q.valid_until > now());
END;
$$;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_customer_quotes_timestamp
  BEFORE UPDATE ON public.customer_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_auditor_tables_timestamp();