-- Create session_actions table for remote support audit logging
CREATE TABLE public.session_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  component_affected TEXT,
  before_state JSONB,
  after_state JSONB,
  risk_level TEXT NOT NULL DEFAULT 'low',
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  duration_ms INTEGER,
  metadata JSONB,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_session_actions_session_id ON public.session_actions(session_id);
CREATE INDEX idx_session_actions_action_type ON public.session_actions(action_type);
CREATE INDEX idx_session_actions_risk_level ON public.session_actions(risk_level);
CREATE INDEX idx_session_actions_created_at ON public.session_actions(created_at DESC);
CREATE INDEX idx_session_actions_performed_by ON public.session_actions(performed_by);

-- Enable Row Level Security
ALTER TABLE public.session_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only authenticated users can view actions
CREATE POLICY "Users can view session actions"
ON public.session_actions
FOR SELECT
TO authenticated
USING (true);

-- RLS Policies: Only authenticated users can insert their own actions
CREATE POLICY "Users can insert their own session actions"
ON public.session_actions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = performed_by);

-- RLS Policies: Only the performer or admins can update actions
CREATE POLICY "Users can update their own session actions"
ON public.session_actions
FOR UPDATE
TO authenticated
USING (auth.uid() = performed_by);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_session_actions_updated_at
BEFORE UPDATE ON public.session_actions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for session_actions
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_actions;

-- Add comment for documentation
COMMENT ON TABLE public.session_actions IS 'Audit log for remote support session actions';