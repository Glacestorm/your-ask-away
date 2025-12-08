// Shared authentication for cron-triggered edge functions
// This module provides secure authentication for scheduled/cron functions

/**
 * Validates that a request is from a legitimate source:
 * 1. Internal cron jobs (pg_cron with shared secret)
 * 2. Service role key (for internal API calls)
 * 3. Valid JWT token (for authenticated user calls)
 */
export function validateCronOrServiceAuth(req: Request): { 
  valid: boolean; 
  source: 'cron' | 'service_role' | 'user' | 'none';
  error?: string;
} {
  const cronSecret = req.headers.get('x-cron-secret');
  const authHeader = req.headers.get('authorization');
  
  // Check for cron secret (set by pg_cron jobs)
  const expectedCronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && expectedCronSecret && cronSecret === expectedCronSecret) {
    return { valid: true, source: 'cron' };
  }
  
  // Check for service role key
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (authHeader && serviceRoleKey) {
    const token = authHeader.replace('Bearer ', '');
    if (token === serviceRoleKey) {
      return { valid: true, source: 'service_role' };
    }
  }
  
  // Check for valid JWT - need to validate through Supabase auth
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    // Basic JWT format check (3 parts separated by dots)
    if (token.split('.').length === 3 && token.length > 50) {
      // This is a potential JWT, caller should validate it through Supabase auth
      return { valid: true, source: 'user' };
    }
  }
  
  return { 
    valid: false, 
    source: 'none',
    error: 'Unauthorized: Valid authentication required. Provide x-cron-secret header, service role key, or valid JWT.'
  };
}

/**
 * Simple validation for functions that should ONLY be called by cron jobs
 * This is more restrictive than validateCronOrServiceAuth
 */
export function validateCronOnly(req: Request): { valid: boolean; error?: string } {
  const cronSecret = req.headers.get('x-cron-secret');
  const expectedCronSecret = Deno.env.get('CRON_SECRET');
  
  // Also allow service role for internal calls
  const authHeader = req.headers.get('authorization');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (cronSecret && expectedCronSecret && cronSecret === expectedCronSecret) {
    return { valid: true };
  }
  
  if (authHeader && serviceRoleKey) {
    const token = authHeader.replace('Bearer ', '');
    if (token === serviceRoleKey) {
      return { valid: true };
    }
  }
  
  return { 
    valid: false, 
    error: 'Unauthorized: This endpoint is restricted to scheduled jobs only.'
  };
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};
