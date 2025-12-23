-- Allow admins to manage supported languages (activate/deactivate, update progress)

-- Ensure RLS is enabled
ALTER TABLE public.supported_languages ENABLE ROW LEVEL SECURITY;

-- Admins can manage supported languages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'supported_languages'
      AND policyname = 'Admins can manage supported languages'
  ) THEN
    CREATE POLICY "Admins can manage supported languages"
    ON public.supported_languages
    FOR ALL
    TO authenticated
    USING (is_admin_or_superadmin(auth.uid()))
    WITH CHECK (is_admin_or_superadmin(auth.uid()));
  END IF;
END $$;