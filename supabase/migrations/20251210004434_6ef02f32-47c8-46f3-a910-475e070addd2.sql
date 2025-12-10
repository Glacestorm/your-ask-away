-- =============================================
-- FASE 2 Continuation: Tables that don't exist yet
-- =============================================

-- Backup verification log (DORA compliance)
CREATE TABLE IF NOT EXISTS public.backup_verifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type text NOT NULL,
    backup_date timestamp with time zone NOT NULL,
    verification_date timestamp with time zone DEFAULT now(),
    verified_by uuid REFERENCES auth.users(id),
    verification_result text NOT NULL,
    restored_successfully boolean DEFAULT false,
    restoration_time_seconds integer,
    data_integrity_verified boolean DEFAULT false,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.backup_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage backup verifications" ON public.backup_verifications;
CREATE POLICY "Admins can manage backup verifications"
ON public.backup_verifications FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

-- Access control policy log
CREATE TABLE IF NOT EXISTS public.access_control_policies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_name text NOT NULL,
    policy_type text NOT NULL,
    description text,
    roles_affected text[],
    access_level text NOT NULL,
    conditions jsonb,
    effective_from timestamp with time zone DEFAULT now(),
    effective_until timestamp with time zone,
    approved_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true
);

ALTER TABLE public.access_control_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage access policies" ON public.access_control_policies;
CREATE POLICY "Admins can manage access policies"
ON public.access_control_policies FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

DROP POLICY IF EXISTS "All users can view active policies" ON public.access_control_policies;
CREATE POLICY "All users can view active policies"
ON public.access_control_policies FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);

-- Asset inventory (ISO 27001)
CREATE TABLE IF NOT EXISTS public.asset_inventory (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_name text NOT NULL,
    asset_type text NOT NULL,
    description text,
    owner uuid REFERENCES auth.users(id),
    location text,
    classification text NOT NULL,
    data_types text[],
    criticality text NOT NULL,
    dependencies text[],
    backup_policy text,
    recovery_time_objective integer,
    recovery_point_objective integer,
    last_review_date timestamp with time zone,
    next_review_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true
);

ALTER TABLE public.asset_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage asset inventory" ON public.asset_inventory;
CREATE POLICY "Admins can manage asset inventory"
ON public.asset_inventory FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

DROP POLICY IF EXISTS "All users can view assets" ON public.asset_inventory;
CREATE POLICY "All users can view assets"
ON public.asset_inventory FOR SELECT
USING (auth.uid() IS NOT NULL);

-- MFA Requirements table
CREATE TABLE IF NOT EXISTS public.mfa_requirements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    mfa_required boolean DEFAULT false,
    mfa_enabled boolean DEFAULT false,
    mfa_method text,
    last_mfa_challenge timestamp with time zone,
    mfa_bypass_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.mfa_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own MFA status" ON public.mfa_requirements;
CREATE POLICY "Users can view own MFA status"
ON public.mfa_requirements FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own MFA" ON public.mfa_requirements;
CREATE POLICY "Users can update own MFA"
ON public.mfa_requirements FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all MFA" ON public.mfa_requirements;
CREATE POLICY "Admins can manage all MFA"
ON public.mfa_requirements FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

-- Encrypted fields table
CREATE TABLE IF NOT EXISTS public.encrypted_fields (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    field_name text NOT NULL,
    encrypted_value text NOT NULL,
    iv text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    UNIQUE(entity_type, entity_id, field_name)
);

ALTER TABLE public.encrypted_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view encrypted fields" ON public.encrypted_fields;
CREATE POLICY "Authenticated users can view encrypted fields"
ON public.encrypted_fields FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert encrypted fields" ON public.encrypted_fields;
CREATE POLICY "Authenticated users can insert encrypted fields"
ON public.encrypted_fields FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update encrypted fields" ON public.encrypted_fields;
CREATE POLICY "Authenticated users can update encrypted fields"
ON public.encrypted_fields FOR UPDATE
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can delete encrypted fields" ON public.encrypted_fields;
CREATE POLICY "Admins can delete encrypted fields"
ON public.encrypted_fields FOR DELETE
USING (is_admin_or_superadmin(auth.uid()));

-- Enhanced audit logs columns
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS ip_address inet,
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS session_id text,
ADD COLUMN IF NOT EXISTS request_id uuid DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS severity text DEFAULT 'info',
ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON public.audit_logs(category, created_at DESC);

-- Functions
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action text,
    p_table_name text,
    p_record_id uuid DEFAULT NULL,
    p_old_data jsonb DEFAULT NULL,
    p_new_data jsonb DEFAULT NULL,
    p_ip_address inet DEFAULT NULL,
    p_user_agent text DEFAULT NULL,
    p_category text DEFAULT 'general',
    p_severity text DEFAULT 'info'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_audit_id uuid;
BEGIN
    INSERT INTO public.audit_logs (
        user_id, action, table_name, record_id, old_data, new_data,
        ip_address, user_agent, category, severity
    ) VALUES (
        auth.uid(), p_action, p_table_name, p_record_id, p_old_data, p_new_data,
        p_ip_address, p_user_agent, p_category, p_severity
    )
    RETURNING id INTO v_audit_id;
    RETURN v_audit_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_mfa_required_for_role(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_roles text[];
    v_admin_roles text[] := ARRAY['superadmin', 'admin', 'director_comercial', 'responsable_comercial'];
BEGIN
    SELECT array_agg(role) INTO v_roles FROM public.user_roles WHERE user_id = p_user_id;
    RETURN v_roles && v_admin_roles;
END;
$$;

-- Triggers
DROP TRIGGER IF EXISTS update_mfa_requirements_updated_at ON public.mfa_requirements;
CREATE TRIGGER update_mfa_requirements_updated_at
    BEFORE UPDATE ON public.mfa_requirements
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_encrypted_fields_updated_at ON public.encrypted_fields;
CREATE TRIGGER update_encrypted_fields_updated_at
    BEFORE UPDATE ON public.encrypted_fields
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_access_control_policies_updated_at ON public.access_control_policies;
CREATE TRIGGER update_access_control_policies_updated_at
    BEFORE UPDATE ON public.access_control_policies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_asset_inventory_updated_at ON public.asset_inventory;
CREATE TRIGGER update_asset_inventory_updated_at
    BEFORE UPDATE ON public.asset_inventory
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();