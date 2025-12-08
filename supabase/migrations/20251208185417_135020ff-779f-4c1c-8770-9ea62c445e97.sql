-- TPP (Third Party Provider) Registration Table for PSD3
CREATE TABLE public.registered_tpps (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tpp_id TEXT NOT NULL UNIQUE,
    tpp_name TEXT NOT NULL,
    organization_id TEXT,
    registration_number TEXT,
    authorization_status TEXT NOT NULL DEFAULT 'pending' CHECK (authorization_status IN ('pending', 'authorized', 'suspended', 'revoked')),
    services TEXT[] NOT NULL DEFAULT '{}',
    qwac_certificate TEXT,
    qsealc_certificate TEXT,
    redirect_uris TEXT[] NOT NULL DEFAULT '{}',
    contact_email TEXT,
    country_code TEXT,
    regulatory_authority TEXT,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    rate_limit_per_day INTEGER DEFAULT 10000,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    authorized_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Open Banking Consents Table
CREATE TABLE public.open_banking_consents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    consent_id TEXT NOT NULL UNIQUE,
    tpp_id TEXT NOT NULL REFERENCES public.registered_tpps(tpp_id),
    user_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'rejected', 'revoked', 'expired')),
    permissions TEXT[] NOT NULL DEFAULT '{}',
    transaction_from_date DATE,
    transaction_to_date DATE,
    expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
    frequency_per_day INTEGER DEFAULT 4,
    recurring_indicator BOOLEAN DEFAULT false,
    valid_until DATE,
    last_action_date TIMESTAMP WITH TIME ZONE,
    sca_status TEXT DEFAULT 'required' CHECK (sca_status IN ('required', 'exempted', 'started', 'finalised', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    authorized_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- TPP API Rate Limiting Table
CREATE TABLE public.tpp_rate_limits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tpp_id TEXT NOT NULL REFERENCES public.registered_tpps(tpp_id),
    window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    request_count INTEGER NOT NULL DEFAULT 1,
    endpoint TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Open Banking Audit Log
CREATE TABLE public.open_banking_audit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tpp_id TEXT NOT NULL,
    user_id UUID,
    consent_id TEXT,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    request_headers JSONB,
    request_body JSONB,
    response_status INTEGER,
    response_body JSONB,
    ip_address TEXT,
    interaction_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_tpps_status ON public.registered_tpps(authorization_status);
CREATE INDEX idx_consents_tpp ON public.open_banking_consents(tpp_id);
CREATE INDEX idx_consents_user ON public.open_banking_consents(user_id);
CREATE INDEX idx_consents_status ON public.open_banking_consents(status);
CREATE INDEX idx_rate_limits_tpp ON public.tpp_rate_limits(tpp_id, window_start);
CREATE INDEX idx_audit_tpp ON public.open_banking_audit_log(tpp_id);
CREATE INDEX idx_audit_created ON public.open_banking_audit_log(created_at);

-- Enable RLS
ALTER TABLE public.registered_tpps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_banking_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tpp_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_banking_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for TPPs (admin only)
CREATE POLICY "Admins can manage TPPs" ON public.registered_tpps
    FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

-- RLS Policies for Consents (users see own, admins see all)
CREATE POLICY "Users can view own consents" ON public.open_banking_consents
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can manage consents" ON public.open_banking_consents
    FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

-- RLS Policies for Rate Limits (admins only)
CREATE POLICY "Admins can view rate limits" ON public.tpp_rate_limits
    FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

-- RLS Policies for Audit Log (admins only)
CREATE POLICY "Admins can view audit log" ON public.open_banking_audit_log
    FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

-- Function to check TPP rate limit
CREATE OR REPLACE FUNCTION public.check_tpp_rate_limit(
    p_tpp_id TEXT,
    p_endpoint TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_rate_limit INTEGER;
    v_current_count INTEGER;
BEGIN
    -- Get TPP rate limit
    SELECT rate_limit_per_hour INTO v_rate_limit
    FROM public.registered_tpps
    WHERE tpp_id = p_tpp_id AND authorization_status = 'authorized';
    
    IF v_rate_limit IS NULL THEN
        RETURN FALSE; -- TPP not found or not authorized
    END IF;
    
    -- Count requests in current hour
    SELECT COALESCE(SUM(request_count), 0) INTO v_current_count
    FROM public.tpp_rate_limits
    WHERE tpp_id = p_tpp_id
    AND window_start > now() - interval '1 hour';
    
    -- Check if under limit
    IF v_current_count >= v_rate_limit THEN
        RETURN FALSE;
    END IF;
    
    -- Insert/update rate limit record
    INSERT INTO public.tpp_rate_limits (tpp_id, endpoint, request_count)
    VALUES (p_tpp_id, p_endpoint, 1)
    ON CONFLICT DO NOTHING;
    
    RETURN TRUE;
END;
$$;

-- Function to cleanup old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_tpp_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    DELETE FROM public.tpp_rate_limits
    WHERE window_start < now() - interval '24 hours';
END;
$$;

-- Function to expire old consents
CREATE OR REPLACE FUNCTION public.expire_open_banking_consents()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    UPDATE public.open_banking_consents
    SET status = 'expired', updated_at = now()
    WHERE status = 'authorized'
    AND expiration_date < now();
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_registered_tpps_updated_at
    BEFORE UPDATE ON public.registered_tpps
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_open_banking_consents_updated_at
    BEFORE UPDATE ON public.open_banking_consents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();