-- Create storage bucket for company documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-documents',
  'company-documents',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
);

-- RLS policies for company documents bucket
CREATE POLICY "Authenticated users can view company documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'company-documents');

CREATE POLICY "Admins can upload company documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-documents' 
  AND is_admin_or_superadmin(auth.uid())
);

CREATE POLICY "Admins can update company documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-documents' 
  AND is_admin_or_superadmin(auth.uid())
);

CREATE POLICY "Admins can delete company documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-documents' 
  AND is_admin_or_superadmin(auth.uid())
);