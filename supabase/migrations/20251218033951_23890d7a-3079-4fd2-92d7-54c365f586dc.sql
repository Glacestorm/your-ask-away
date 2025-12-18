-- Añadir columnas faltantes y storage

-- Añadir columnas faltantes a cms_media_folders
ALTER TABLE public.cms_media_folders ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.cms_media_folders ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6366f1';
ALTER TABLE public.cms_media_folders ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'folder';
ALTER TABLE public.cms_media_folders ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.cms_media_folders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Añadir columnas faltantes a cms_media_library  
ALTER TABLE public.cms_media_library ADD COLUMN IF NOT EXISTS alt_text TEXT;
ALTER TABLE public.cms_media_library ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.cms_media_library ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.cms_media_library ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE public.cms_media_library ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE public.cms_media_library ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE public.cms_media_library ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.cms_media_library ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.cms_media_library ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);
ALTER TABLE public.cms_media_library ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cms-media',
  'cms-media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
) ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
DROP POLICY IF EXISTS "Public read access for cms-media" ON storage.objects;
CREATE POLICY "Public read access for cms-media" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'cms-media');

DROP POLICY IF EXISTS "Authenticated upload to cms-media" ON storage.objects;
CREATE POLICY "Authenticated upload to cms-media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cms-media');

DROP POLICY IF EXISTS "Authenticated delete from cms-media" ON storage.objects;
CREATE POLICY "Authenticated delete from cms-media" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'cms-media');