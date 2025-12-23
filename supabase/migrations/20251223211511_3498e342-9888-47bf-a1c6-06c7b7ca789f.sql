-- Create table for dual approval requests
CREATE TABLE public.support_approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.remote_support_sessions(id) ON DELETE CASCADE NOT NULL,
    action_id UUID REFERENCES public.session_actions(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN ('high_risk_action', 'session_end', 'data_export', 'config_change')),
    requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for pending approvals
CREATE INDEX idx_approval_requests_pending ON public.support_approval_requests(status, expires_at) WHERE status = 'pending';
CREATE INDEX idx_approval_requests_session ON public.support_approval_requests(session_id);

-- Enable RLS
ALTER TABLE public.support_approval_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view approval requests"
ON public.support_approval_requests
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create approval requests"
ON public.support_approval_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Authenticated users can update approval requests"
ON public.support_approval_requests
FOR UPDATE
TO authenticated
USING (true);

-- Create table for session export logs (audit trail for PDF exports)
CREATE TABLE public.session_export_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.remote_support_sessions(id) ON DELETE CASCADE NOT NULL,
    exported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    exported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    export_format TEXT NOT NULL DEFAULT 'pdf',
    verification_hash TEXT NOT NULL,
    verification_code TEXT NOT NULL,
    includes_actions BOOLEAN DEFAULT true,
    includes_screenshots BOOLEAN DEFAULT false,
    file_size_bytes INTEGER,
    metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.session_export_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view export logs"
ON public.session_export_logs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create export logs"
ON public.session_export_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = exported_by);

-- Enable realtime for approval requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_approval_requests;

-- Function to auto-expire pending requests
CREATE OR REPLACE FUNCTION public.expire_pending_approval_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.support_approval_requests
    SET status = 'expired', updated_at = now()
    WHERE status = 'pending' AND expires_at < now();
END;
$$;