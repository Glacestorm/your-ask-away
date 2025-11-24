-- Tabla para trackear lotes de importación
CREATE TABLE IF NOT EXISTS public.import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  total_records INTEGER NOT NULL DEFAULT 0,
  successful_records INTEGER NOT NULL DEFAULT 0,
  failed_records INTEGER NOT NULL DEFAULT 0,
  filename TEXT,
  notes TEXT
);

-- Añadir columna para trackear a qué lote pertenece cada empresa importada
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS import_batch_id UUID REFERENCES public.import_batches(id) ON DELETE SET NULL;

-- Índice para búsquedas rápidas por lote
CREATE INDEX IF NOT EXISTS idx_companies_import_batch ON public.companies(import_batch_id);

-- RLS para import_batches
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins pueden gestionar lotes de importación"
  ON public.import_batches
  FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Usuarios pueden ver sus propios lotes"
  ON public.import_batches
  FOR SELECT
  USING (created_by = auth.uid() OR is_admin_or_superadmin(auth.uid()));