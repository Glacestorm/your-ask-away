-- Create enum for risk levels
CREATE TYPE public.auth_risk_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Create enum for authentication factor types
CREATE TYPE public.auth_factor_type AS ENUM ('password', 'otp_email', 'otp_sms', 'device_trust', 'biometric', 'security_question');

-- User device fingerprints table
CREATE TABLE public.user_device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_hash TEXT NOT NULL,
  browser_info JSONB,
  os_info JSONB,
  screen_resolution TEXT,
  timezone TEXT,
  language TEXT,
  is_trusted BOOLEAN DEFAULT false,
  trust_expires_at TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  login_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, device_hash)
);

-- User location history for pattern analysis
CREATE TABLE public.user_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  country_code TEXT,
  city TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_vpn BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Session risk assessments
CREATE TABLE public.session_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  risk_level auth_risk_level NOT NULL DEFAULT 'low',
  risk_score INTEGER NOT NULL DEFAULT 0,
  risk_factors JSONB DEFAULT '[]'::jsonb,
  device_fingerprint_id UUID REFERENCES public.user_device_fingerprints(id),
  location_id UUID REFERENCES public.user_location_history(id),
  requires_step_up BOOLEAN DEFAULT false,
  step_up_completed BOOLEAN DEFAULT false,
  step_up_factor auth_factor_type,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Authentication challenges for step-up auth
CREATE TABLE public.auth_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  challenge_type auth_factor_type NOT NULL,
  challenge_code TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User behavior patterns (for anomaly detection)
CREATE TABLE public.user_behavior_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  typical_login_hours JSONB DEFAULT '[]'::jsonb,
  typical_locations JSONB DEFAULT '[]'::jsonb,
  typical_devices JSONB DEFAULT '[]'::jsonb,
  avg_session_duration INTEGER,
  typical_actions_per_session INTEGER,
  last_analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can only see their own data
CREATE POLICY "Users can view own device fingerprints"
  ON public.user_device_fingerprints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own device fingerprints"
  ON public.user_device_fingerprints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own device fingerprints"
  ON public.user_device_fingerprints FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own location history"
  ON public.user_location_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own location history"
  ON public.user_location_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own risk assessments"
  ON public.session_risk_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own risk assessments"
  ON public.session_risk_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own risk assessments"
  ON public.session_risk_assessments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own auth challenges"
  ON public.auth_challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own auth challenges"
  ON public.auth_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own auth challenges"
  ON public.auth_challenges FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own behavior patterns"
  ON public.user_behavior_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own behavior patterns"
  ON public.user_behavior_patterns FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_device_fingerprints_user ON public.user_device_fingerprints(user_id);
CREATE INDEX idx_location_history_user ON public.user_location_history(user_id);
CREATE INDEX idx_risk_assessments_session ON public.session_risk_assessments(session_id);
CREATE INDEX idx_auth_challenges_session ON public.auth_challenges(session_id);
CREATE INDEX idx_auth_challenges_expires ON public.auth_challenges(expires_at);