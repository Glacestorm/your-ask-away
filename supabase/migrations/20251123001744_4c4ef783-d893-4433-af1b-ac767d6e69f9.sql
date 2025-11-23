-- Agregar nuevos campos a la tabla companies para información completa
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS employees INTEGER,
ADD COLUMN IF NOT EXISTS turnover NUMERIC,
ADD COLUMN IF NOT EXISTS sector TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS legal_form TEXT;

-- Crear tabla para contactos empresariales
CREATE TABLE IF NOT EXISTS public.company_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  position TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla para documentos empresariales
CREATE TABLE IF NOT EXISTS public.company_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT,
  document_url TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.company_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para contactos
CREATE POLICY "Usuarios autenticados pueden ver contactos"
ON public.company_contacts
FOR SELECT
USING (true);

CREATE POLICY "Admins pueden gestionar contactos"
ON public.company_contacts
FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

-- Políticas RLS para documentos
CREATE POLICY "Usuarios autenticados pueden ver documentos"
ON public.company_documents
FOR SELECT
USING (true);

CREATE POLICY "Admins pueden gestionar documentos"
ON public.company_documents
FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

-- Triggers para updated_at
CREATE TRIGGER update_company_contacts_updated_at
BEFORE UPDATE ON public.company_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_documents_updated_at
BEFORE UPDATE ON public.company_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_company_contacts_company_id ON public.company_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_company_id ON public.company_documents(company_id);