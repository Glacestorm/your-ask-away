-- Create table for action plans
CREATE TABLE IF NOT EXISTS public.action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  target_metric TEXT NOT NULL,
  current_value NUMERIC,
  target_value NUMERIC,
  gap_percentage NUMERIC,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  target_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for action plan steps
CREATE TABLE IF NOT EXISTS public.action_plan_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plan_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for action_plans
CREATE POLICY "Users can view their own action plans"
  ON public.action_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own action plans"
  ON public.action_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own action plans"
  ON public.action_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own action plans"
  ON public.action_plans FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for action_plan_steps
CREATE POLICY "Users can view their own action plan steps"
  ON public.action_plan_steps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.action_plans
    WHERE action_plans.id = action_plan_steps.plan_id
    AND action_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can create steps for their own action plans"
  ON public.action_plan_steps FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.action_plans
    WHERE action_plans.id = action_plan_steps.plan_id
    AND action_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can update steps in their own action plans"
  ON public.action_plan_steps FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.action_plans
    WHERE action_plans.id = action_plan_steps.plan_id
    AND action_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete steps from their own action plans"
  ON public.action_plan_steps FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.action_plans
    WHERE action_plans.id = action_plan_steps.plan_id
    AND action_plans.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX idx_action_plans_user_id ON public.action_plans(user_id);
CREATE INDEX idx_action_plans_status ON public.action_plans(status);
CREATE INDEX idx_action_plan_steps_plan_id ON public.action_plan_steps(plan_id);

-- Create trigger for updated_at
CREATE TRIGGER update_action_plans_updated_at
  BEFORE UPDATE ON public.action_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_action_plan_steps_updated_at
  BEFORE UPDATE ON public.action_plan_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();