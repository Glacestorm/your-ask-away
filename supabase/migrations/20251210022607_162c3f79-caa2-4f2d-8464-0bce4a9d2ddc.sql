
-- Create audit table for assistant conversations (permanent, cannot be deleted by users)
CREATE TABLE public.assistant_conversation_audit (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    context TEXT,
    input_method TEXT DEFAULT 'text' CHECK (input_method IN ('text', 'voice')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    user_deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create index for auditor queries
CREATE INDEX idx_assistant_audit_user_id ON public.assistant_conversation_audit(user_id);
CREATE INDEX idx_assistant_audit_conversation_id ON public.assistant_conversation_audit(conversation_id);
CREATE INDEX idx_assistant_audit_created_at ON public.assistant_conversation_audit(created_at DESC);

-- Enable RLS
ALTER TABLE public.assistant_conversation_audit ENABLE ROW LEVEL SECURITY;

-- Only auditors and admins can view audit logs
CREATE POLICY "Auditors can view all conversation audits"
ON public.assistant_conversation_audit
FOR SELECT
USING (
    is_admin_or_superadmin(auth.uid()) 
    OR has_role(auth.uid(), 'auditor')
    OR has_role(auth.uid(), 'director_comercial')
);

-- Only system can insert (via service role or authenticated users for their own messages)
CREATE POLICY "Users can insert their own conversation audits"
ON public.assistant_conversation_audit
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- No delete policy - audit logs are permanent
