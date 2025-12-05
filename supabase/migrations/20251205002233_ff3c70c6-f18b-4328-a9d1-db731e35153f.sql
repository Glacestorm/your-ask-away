-- Add escalation fields to alerts table
ALTER TABLE public.alerts 
ADD COLUMN IF NOT EXISTS escalation_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS escalation_hours integer DEFAULT 24,
ADD COLUMN IF NOT EXISTS max_escalation_level integer DEFAULT 3;

-- Add escalation tracking to alert_history
ALTER TABLE public.alert_history
ADD COLUMN IF NOT EXISTS escalation_level integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS escalated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS escalation_notified_to jsonb DEFAULT '[]'::jsonb;

-- Create index for escalation queries
CREATE INDEX IF NOT EXISTS idx_alert_history_escalation ON public.alert_history(escalation_level, resolved_at) WHERE resolved_at IS NULL;