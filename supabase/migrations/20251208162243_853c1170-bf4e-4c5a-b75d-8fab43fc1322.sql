-- Table for storing user login locations for geolocation analysis
CREATE TABLE IF NOT EXISTS public.user_login_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address TEXT,
    country TEXT,
    country_code TEXT,
    city TEXT,
    region TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    is_vpn BOOLEAN DEFAULT false,
    is_proxy BOOLEAN DEFAULT false,
    isp TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_login_locations_user_id ON public.user_login_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_locations_created_at ON public.user_login_locations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_login_locations_country ON public.user_login_locations(country_code);

-- Enable RLS
ALTER TABLE public.user_login_locations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own login locations
CREATE POLICY "Users can view own login locations"
ON public.user_login_locations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR is_admin_or_superadmin(auth.uid()));

-- Policy: Service role can insert
CREATE POLICY "Service role can insert login locations"
ON public.user_login_locations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add columns to user_device_fingerprints for enhanced tracking
ALTER TABLE public.user_device_fingerprints 
ADD COLUMN IF NOT EXISTS last_ip TEXT,
ADD COLUMN IF NOT EXISTS last_location TEXT;

-- Add columns to session_risk_assessments for location data
ALTER TABLE public.session_risk_assessments
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS location_data JSONB;

-- Add columns to user_behavior_patterns for location tracking
ALTER TABLE public.user_behavior_patterns
ADD COLUMN IF NOT EXISTS typical_locations TEXT[];

-- Add column to auth_challenges for email tracking
ALTER TABLE public.auth_challenges
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- Create table for trusted devices management
CREATE TABLE IF NOT EXISTS public.trusted_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_fingerprint_id UUID REFERENCES public.user_device_fingerprints(id) ON DELETE CASCADE,
    device_name TEXT,
    trusted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    trusted_until TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
    trusted_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on trusted_devices
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own trusted devices
CREATE POLICY "Users can view own trusted devices"
ON public.trusted_devices
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR is_admin_or_superadmin(auth.uid()));

-- Policy: Users can manage their own trusted devices
CREATE POLICY "Users can manage own trusted devices"
ON public.trusted_devices
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add index
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON public.trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_active ON public.trusted_devices(is_active) WHERE is_active = true;