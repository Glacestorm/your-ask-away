-- Habilitar RLS en erp_permissions (solo lectura pública)
ALTER TABLE public.erp_permissions ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública para permisos
CREATE POLICY "erp_permissions_select_all" ON public.erp_permissions
  FOR SELECT USING (true);