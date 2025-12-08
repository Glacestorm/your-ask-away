-- Create storage bucket for visit sheet photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'visit-sheet-photos',
  'visit-sheet-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for visit sheet photos
CREATE POLICY "Authenticated users can upload visit sheet photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'visit-sheet-photos');

CREATE POLICY "Authenticated users can view visit sheet photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'visit-sheet-photos');

CREATE POLICY "Users can delete their own visit sheet photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'visit-sheet-photos' AND auth.uid()::text = (storage.foldername(name))[1]);