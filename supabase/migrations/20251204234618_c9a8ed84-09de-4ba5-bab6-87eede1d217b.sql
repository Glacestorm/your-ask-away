-- Create security definer function to check visit participation without triggering RLS
CREATE OR REPLACE FUNCTION public.is_visit_participant(_user_id uuid, _visit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.visit_participants
    WHERE user_id = _user_id
      AND visit_id = _visit_id
  )
$$;

-- Create security definer function to check if user is gestor of a visit
CREATE OR REPLACE FUNCTION public.is_visit_gestor(_user_id uuid, _visit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.visits
    WHERE id = _visit_id
      AND gestor_id = _user_id
  )
$$;

-- Drop existing problematic policies on visits
DROP POLICY IF EXISTS "Users can view their visits and participated visits" ON public.visits;

-- Create new SELECT policy for visits using security definer function
CREATE POLICY "Users can view their visits and participated visits"
ON public.visits
FOR SELECT
USING (
  gestor_id = auth.uid() 
  OR public.is_visit_participant(auth.uid(), id)
  OR is_admin_or_superadmin(auth.uid())
);

-- Drop and recreate visit_participants SELECT policy to avoid recursion
DROP POLICY IF EXISTS "Users can view participants of their visits" ON public.visit_participants;

CREATE POLICY "Users can view participants of their visits"
ON public.visit_participants
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_visit_gestor(auth.uid(), visit_id)
  OR is_admin_or_superadmin(auth.uid())
);