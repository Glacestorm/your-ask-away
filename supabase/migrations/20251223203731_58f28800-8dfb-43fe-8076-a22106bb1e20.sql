-- Create remote_support_sessions table
CREATE TABLE public.remote_support_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  support_type TEXT DEFAULT 'remote',
  client_name TEXT,
  client_email TEXT,
  installation_id UUID,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_ms INTEGER,
  resolution TEXT,
  resolution_notes TEXT,
  actions_count INTEGER DEFAULT 0,
  high_risk_actions_count INTEGER DEFAULT 0,
  performed_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'cancelled', 'paused'))
);

-- Create indexes
CREATE INDEX idx_remote_support_sessions_status ON public.remote_support_sessions(status);
CREATE INDEX idx_remote_support_sessions_session_code ON public.remote_support_sessions(session_code);
CREATE INDEX idx_remote_support_sessions_performed_by ON public.remote_support_sessions(performed_by);
CREATE INDEX idx_remote_support_sessions_started_at ON public.remote_support_sessions(started_at DESC);

-- Enable RLS
ALTER TABLE public.remote_support_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all sessions"
ON public.remote_support_sessions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own sessions"
ON public.remote_support_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = performed_by);

CREATE POLICY "Users can update their own sessions"
ON public.remote_support_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = performed_by);

-- Trigger for updated_at
CREATE TRIGGER update_remote_support_sessions_updated_at
BEFORE UPDATE ON public.remote_support_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.remote_support_sessions;

-- Add session_id FK to session_actions
ALTER TABLE public.session_actions 
ADD COLUMN remote_session_id UUID REFERENCES public.remote_support_sessions(id);

CREATE INDEX idx_session_actions_remote_session_id ON public.session_actions(remote_session_id);

COMMENT ON TABLE public.remote_support_sessions IS 'Tracks remote support sessions for audit and reporting';