-- Crear bucket para fotos de empresas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-photos',
  'company-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Tabla para almacenar fotos de empresas
CREATE TABLE public.company_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para búsquedas rápidas por empresa
CREATE INDEX idx_company_photos_company_id ON public.company_photos(company_id);
CREATE INDEX idx_company_photos_uploaded_at ON public.company_photos(uploaded_at);

-- Enable RLS
ALTER TABLE public.company_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies para company_photos
CREATE POLICY "Usuarios autenticados pueden ver fotos"
  ON public.company_photos
  FOR SELECT
  USING (true);

CREATE POLICY "Admins pueden gestionar fotos"
  ON public.company_photos
  FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Usuarios pueden subir fotos"
  ON public.company_photos
  FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

-- Storage policies para company-photos bucket
CREATE POLICY "Fotos son públicamente accesibles"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'company-photos');

CREATE POLICY "Usuarios autenticados pueden subir fotos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'company-photos' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Usuarios pueden actualizar sus propias fotos"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'company-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuarios pueden eliminar sus propias fotos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'company-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Función para limpiar fotos antiguas cuando se excede el límite
CREATE OR REPLACE FUNCTION public.cleanup_old_company_photos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  photo_count INTEGER;
  oldest_photo RECORD;
BEGIN
  -- Contar fotos para esta empresa
  SELECT COUNT(*) INTO photo_count
  FROM public.company_photos
  WHERE company_id = NEW.company_id;
  
  -- Si hay más de 5 fotos, eliminar las más antiguas
  WHILE photo_count > 5 LOOP
    -- Obtener la foto más antigua
    SELECT * INTO oldest_photo
    FROM public.company_photos
    WHERE company_id = NEW.company_id
    ORDER BY uploaded_at ASC
    LIMIT 1;
    
    -- Eliminar del storage
    PERFORM storage.delete_object('company-photos', oldest_photo.photo_url);
    
    -- Eliminar de la tabla
    DELETE FROM public.company_photos WHERE id = oldest_photo.id;
    
    photo_count := photo_count - 1;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger para ejecutar la limpieza después de insertar
CREATE TRIGGER cleanup_company_photos_trigger
AFTER INSERT ON public.company_photos
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_company_photos();