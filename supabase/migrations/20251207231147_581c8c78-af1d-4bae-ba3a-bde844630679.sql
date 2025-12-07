-- Drop any existing policies on geocode_rate_limits (in case of partial creation)
DROP POLICY IF EXISTS "Users can insert their own rate limit records" ON public.geocode_rate_limits;
DROP POLICY IF EXISTS "Users can view their own rate limit records" ON public.geocode_rate_limits;
DROP POLICY IF EXISTS "Users can update their own rate limit records" ON public.geocode_rate_limits;
DROP POLICY IF EXISTS "Admins can view all rate limit records" ON public.geocode_rate_limits;

-- Enable RLS if not already enabled
ALTER TABLE public.geocode_rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to manage rate limit records (based on IP address)
-- Since this is a rate limiting table for geocoding, we allow authenticated users to insert/update
CREATE POLICY "Authenticated users can insert rate limit records"
ON public.geocode_rate_limits
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can view rate limit records"
ON public.geocode_rate_limits
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update rate limit records"
ON public.geocode_rate_limits
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Admins can delete old rate limit records
CREATE POLICY "Admins can delete rate limit records"
ON public.geocode_rate_limits
FOR DELETE
TO authenticated
USING (is_admin_or_superadmin(auth.uid()));