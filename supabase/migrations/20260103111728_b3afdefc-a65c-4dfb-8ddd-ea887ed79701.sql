-- Fase 1: Añadir campo customer_id obligatorio a operaciones de comercio

-- 1. Añadir columna customer_id a erp_commercial_discounts
ALTER TABLE public.erp_commercial_discounts 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.erp_trade_partners(id);

-- 2. Añadir columna customer_id a erp_factoring_contracts  
ALTER TABLE public.erp_factoring_contracts 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.erp_trade_partners(id);

-- 3. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_commercial_discounts_customer 
ON public.erp_commercial_discounts(customer_id);

CREATE INDEX IF NOT EXISTS idx_factoring_contracts_customer 
ON public.erp_factoring_contracts(customer_id);

-- 4. Comentarios descriptivos
COMMENT ON COLUMN public.erp_commercial_discounts.customer_id IS 'Cliente asociado a la operación de descuento';
COMMENT ON COLUMN public.erp_factoring_contracts.customer_id IS 'Cliente asociado al contrato de factoring';