-- Create table for email reminder preferences
CREATE TABLE IF NOT EXISTS public.email_reminder_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  urgency_level TEXT NOT NULL DEFAULT 'all' CHECK (urgency_level IN ('disabled', 'urgent', 'all')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.email_reminder_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own preferences
CREATE POLICY "Users can view own email preferences"
ON public.email_reminder_preferences
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own email preferences"
ON public.email_reminder_preferences
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own email preferences"
ON public.email_reminder_preferences
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_email_reminder_preferences_updated_at
BEFORE UPDATE ON public.email_reminder_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_email_reminder_preferences_user_id ON public.email_reminder_preferences(user_id);