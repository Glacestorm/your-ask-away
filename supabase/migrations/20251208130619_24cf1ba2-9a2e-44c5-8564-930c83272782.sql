-- Create table for storing user passkeys (WebAuthn credentials)
CREATE TABLE IF NOT EXISTS public.user_passkeys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  device_name TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_passkeys ENABLE ROW LEVEL SECURITY;

-- Users can only view their own passkeys
CREATE POLICY "Users can view their own passkeys"
ON public.user_passkeys
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own passkeys
CREATE POLICY "Users can insert their own passkeys"
ON public.user_passkeys
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own passkeys
CREATE POLICY "Users can update their own passkeys"
ON public.user_passkeys
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own passkeys
CREATE POLICY "Users can delete their own passkeys"
ON public.user_passkeys
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_passkeys_user_id ON public.user_passkeys(user_id);
CREATE INDEX idx_user_passkeys_credential_id ON public.user_passkeys(credential_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_passkeys_updated_at
BEFORE UPDATE ON public.user_passkeys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();