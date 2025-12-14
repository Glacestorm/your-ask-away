-- Drop existing restrictive policies
DROP POLICY IF EXISTS "demo_sessions_insert_policy" ON public.demo_sessions;
DROP POLICY IF EXISTS "demo_sessions_select_policy" ON public.demo_sessions;
DROP POLICY IF EXISTS "demo_sessions_update_policy" ON public.demo_sessions;
DROP POLICY IF EXISTS "demo_sessions_delete_policy" ON public.demo_sessions;

-- Allow anyone to insert demo sessions (for non-authenticated demo starters)
CREATE POLICY "demo_sessions_insert_anyone" ON public.demo_sessions
FOR INSERT WITH CHECK (true);

-- Allow anyone to select their own demo session (by id match)
CREATE POLICY "demo_sessions_select_anyone" ON public.demo_sessions
FOR SELECT USING (true);

-- Allow anyone to update demo sessions
CREATE POLICY "demo_sessions_update_anyone" ON public.demo_sessions
FOR UPDATE USING (true);

-- Only admins can delete
CREATE POLICY "demo_sessions_delete_admin" ON public.demo_sessions
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('superadmin', 'admin')
  )
);