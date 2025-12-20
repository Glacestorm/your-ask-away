-- 1) Helper: check whether a user belongs to a partner company (security definer avoids privilege/RLS issues in policies)
CREATE OR REPLACE FUNCTION public.is_partner_member(_user_id uuid, _partner_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.partner_users pu
    WHERE pu.user_id = _user_id
      AND pu.partner_company_id = _partner_company_id
      AND COALESCE(pu.role, '') IN ('owner','admin','developer','member')
  )
$$;

-- 2) partner_applications: keep public read of published apps; move privileged checks to definer-based policies
DROP POLICY IF EXISTS "Admins can manage all applications" ON public.partner_applications;
DROP POLICY IF EXISTS "Partners can manage their applications" ON public.partner_applications;

-- Public marketplace read
DROP POLICY IF EXISTS "Anyone can view published applications" ON public.partner_applications;
CREATE POLICY "Anyone can view published applications"
ON public.partner_applications
FOR SELECT
TO public
USING (status = 'published');

-- Partners can view ALL their own apps (including drafts)
CREATE POLICY "Partners can view their own applications"
ON public.partner_applications
FOR SELECT
TO authenticated
USING (public.is_partner_member(auth.uid(), partner_company_id));

-- Partners can write their own apps
CREATE POLICY "Partners can manage their applications"
ON public.partner_applications
FOR INSERT
TO authenticated
WITH CHECK (public.is_partner_member(auth.uid(), partner_company_id));

CREATE POLICY "Partners can update their applications"
ON public.partner_applications
FOR UPDATE
TO authenticated
USING (public.is_partner_member(auth.uid(), partner_company_id))
WITH CHECK (public.is_partner_member(auth.uid(), partner_company_id));

CREATE POLICY "Partners can delete their applications"
ON public.partner_applications
FOR DELETE
TO authenticated
USING (public.is_partner_member(auth.uid(), partner_company_id));

-- Admins can manage all apps
CREATE POLICY "Admins can manage all applications"
ON public.partner_applications
FOR ALL
TO authenticated
USING (public.is_admin_or_superadmin(auth.uid()))
WITH CHECK (public.is_admin_or_superadmin(auth.uid()));


-- 3) partner_companies: public read of active partners + partner self access + admin access
DROP POLICY IF EXISTS "Admins can manage partner companies" ON public.partner_companies;
DROP POLICY IF EXISTS "Partners can view their own company" ON public.partner_companies;
DROP POLICY IF EXISTS "Anyone can view active partner companies" ON public.partner_companies;

CREATE POLICY "Anyone can view active partner companies"
ON public.partner_companies
FOR SELECT
TO public
USING (status = 'active');

CREATE POLICY "Partners can view their own company"
ON public.partner_companies
FOR SELECT
TO authenticated
USING (public.is_partner_member(auth.uid(), id));

CREATE POLICY "Admins can manage partner companies"
ON public.partner_companies
FOR ALL
TO authenticated
USING (public.is_admin_or_superadmin(auth.uid()))
WITH CHECK (public.is_admin_or_superadmin(auth.uid()));


-- 4) premium_integrations: keep public read + admin manage via definer function
DROP POLICY IF EXISTS "Admins can manage integrations" ON public.premium_integrations;
DROP POLICY IF EXISTS "Anyone can view active integrations" ON public.premium_integrations;

CREATE POLICY "Anyone can view active integrations"
ON public.premium_integrations
FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage integrations"
ON public.premium_integrations
FOR ALL
TO authenticated
USING (public.is_admin_or_superadmin(auth.uid()))
WITH CHECK (public.is_admin_or_superadmin(auth.uid()));
