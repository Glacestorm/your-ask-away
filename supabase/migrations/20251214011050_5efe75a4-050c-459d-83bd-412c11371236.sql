-- Create demo_sessions table for tracking demo usage
CREATE TABLE public.demo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  demo_user_id UUID,
  selected_role TEXT NOT NULL,
  tour_completed BOOLEAN DEFAULT false,
  tour_step INTEGER DEFAULT 0,
  sections_visited TEXT[] DEFAULT '{}',
  cleanup_status TEXT DEFAULT 'pending',
  ip_address TEXT,
  user_agent TEXT,
  created_companies INTEGER DEFAULT 0,
  created_visits INTEGER DEFAULT 0,
  created_goals INTEGER DEFAULT 0,
  data_ids JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demo_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for demo sessions - public can create, only admins can view all
CREATE POLICY "Anyone can create demo sessions"
ON public.demo_sessions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view own demo session"
ON public.demo_sessions
FOR SELECT
USING (demo_user_id = auth.uid() OR is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can update own demo session"
ON public.demo_sessions
FOR UPDATE
USING (demo_user_id = auth.uid() OR is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can delete demo sessions"
ON public.demo_sessions
FOR DELETE
USING (is_admin_or_superadmin(auth.uid()));

-- Create index for cleanup queries
CREATE INDEX idx_demo_sessions_cleanup ON public.demo_sessions(cleanup_status, started_at);
CREATE INDEX idx_demo_sessions_user ON public.demo_sessions(demo_user_id);

-- Trigger for updated_at
CREATE TRIGGER update_demo_sessions_updated_at
BEFORE UPDATE ON public.demo_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();