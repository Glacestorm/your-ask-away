-- Create table for visit reminder preferences
CREATE TABLE IF NOT EXISTS public.visit_reminder_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  minutes_before INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.visit_reminder_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own reminder preferences"
ON public.visit_reminder_preferences FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own reminder preferences"
ON public.visit_reminder_preferences FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reminder preferences"
ON public.visit_reminder_preferences FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own reminder preferences"
ON public.visit_reminder_preferences FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_visit_reminder_preferences_user_id 
ON public.visit_reminder_preferences(user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_visit_reminder_preferences_updated_at
BEFORE UPDATE ON public.visit_reminder_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();