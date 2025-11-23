-- Create goals table for tracking performance targets
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL CHECK (metric_type IN ('visits', 'success_rate', 'engagement', 'vinculacion', 'products')),
  target_value NUMERIC NOT NULL CHECK (target_value > 0),
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_period CHECK (period_end > period_start)
);

-- Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Admins can manage all goals
CREATE POLICY "Admins pueden gestionar objetivos"
  ON public.goals
  FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

-- Users can view all goals
CREATE POLICY "Usuarios pueden ver objetivos"
  ON public.goals
  FOR SELECT
  USING (true);

-- Create index for performance
CREATE INDEX idx_goals_period ON public.goals(period_start, period_end);
CREATE INDEX idx_goals_type ON public.goals(metric_type);

-- Create updated_at trigger
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();