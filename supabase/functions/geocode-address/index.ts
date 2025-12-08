import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// OWASP API Security Top 10 Implementation
import {
  SECURITY_HEADERS,
  handleOptionsRequest,
  createSecureResponse,
  checkRateLimit,
  validatePayloadSize,
  validateExternalUrl,
  safeExternalAPICall,
  logSecurityEvent,
  sanitizeInput,
  validateAuthentication
} from "../_shared/owasp-security.ts";

interface GeocodeRequest {
  address: string;
  parroquia?: string;
}

interface GeocodeResponse {
  latitude: number | null;
  longitude: number | null;
  error?: string;
}

// API4:2023 - Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRequests: 100,
  windowMs: 60 * 60 * 1000 // 1 hour
};

// API8:2023 - Input validation
function validateGeocodeInput(data: any): { valid: boolean; error?: string; sanitized?: GeocodeRequest } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  if (!data.address || typeof data.address !== 'string') {
    return { valid: false, error: 'Address is required and must be a string' };
  }
  
  // API10:2023 - Sanitize inputs
  const sanitizedAddress = sanitizeInput(data.address);
  const sanitizedParroquia = data.parroquia ? sanitizeInput(data.parroquia) : undefined;
  
  // Validate length limits
  if (sanitizedAddress.length > 500) {
    return { valid: false, error: 'Address too long (max 500 characters)' };
  }
  
  if (sanitizedParroquia && sanitizedParroquia.length > 100) {
    return { valid: false, error: 'Parroquia too long (max 100 characters)' };
  }
  
  return { 
    valid: true, 
    sanitized: { 
      address: sanitizedAddress, 
      parroquia: sanitizedParroquia 
    } 
  };
}

serve(async (req) => {
  // API8:2023 - Handle CORS preflight with secure headers
  if (req.method === 'OPTIONS') {
    return handleOptionsRequest();
  }

  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // API2:2023 - Authentication validation
    const authResult = await validateAuthentication(
      req.headers.get('Authorization'),
      supabase
    );
    
    if (!authResult.valid) {
      logSecurityEvent({
        type: 'auth_failure',
        severity: 'high',
        ip: clientIp,
        endpoint: '/geocode-address',
        details: authResult.error || 'Authentication failed',
        timestamp: new Date().toISOString()
      });
      
      return createSecureResponse({ 
        latitude: null, 
        longitude: null, 
        error: 'Unauthorized' 
      }, 401);
    }

    const userId = authResult.userId!;
    
    // API4:2023 - Rate limiting
    const rateLimit = checkRateLimit({
      identifier: `${userId}:geocode`,
      maxRequests: RATE_LIMIT_CONFIG.maxRequests,
      windowMs: RATE_LIMIT_CONFIG.windowMs
    });
    
    if (!rateLimit.allowed) {
      logSecurityEvent({
        type: 'rate_limit',
        severity: 'medium',
        userId,
        ip: clientIp,
        endpoint: '/geocode-address',
        details: 'Rate limit exceeded',
        timestamp: new Date().toISOString()
      });
      
      return createSecureResponse(
        { latitude: null, longitude: null, error: 'Rate limit exceeded. Please try again later.' },
        429,
        { 'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString() }
      );
    }
    
    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return createSecureResponse(
        { latitude: null, longitude: null, error: 'Invalid JSON body' },
        400
      );
    }
    
    // API4:2023 - Payload size validation
    const payloadValidation = validatePayloadSize(requestBody);
    if (!payloadValidation.valid) {
      return createSecureResponse(
        { latitude: null, longitude: null, error: payloadValidation.error },
        400
      );
    }
    
    // API8:2023 - Input validation
    const inputValidation = validateGeocodeInput(requestBody);
    if (!inputValidation.valid) {
      return createSecureResponse(
        { latitude: null, longitude: null, error: inputValidation.error },
        400
      );
    }
    
    const { address, parroquia } = inputValidation.sanitized!;

    // Build search query
    const searchQuery = parroquia 
      ? `${address}, ${parroquia}, Andorra`
      : `${address}, Andorra`;

    // API7:2023 - SSRF Protection - Validate external URL
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`;
    
    const urlValidation = validateExternalUrl(nominatimUrl);
    if (!urlValidation.valid) {
      logSecurityEvent({
        type: 'ssrf_attempt',
        severity: 'critical',
        userId,
        ip: clientIp,
        endpoint: '/geocode-address',
        details: `SSRF attempt blocked: ${urlValidation.error}`,
        timestamp: new Date().toISOString()
      });
      
      return createSecureResponse(
        { latitude: null, longitude: null, error: 'Invalid external service request' },
        400
      );
    }
    
    // API10:2023 - Safe external API call
    const result = await safeExternalAPICall(nominatimUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'CreandBankingApp/1.0'
      }
    }, 15000);

    if (!result.success) {
      console.error('Geocoding API error:', result.error);
      return createSecureResponse(
        { latitude: null, longitude: null, error: 'Geocoding service unavailable' },
        503
      );
    }

    const data = result.data;

    if (data && Array.isArray(data) && data.length > 0) {
      const response: GeocodeResponse = {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };

      // Log successful geocoding
      console.log(`[GEOCODE] Success for user ${userId}: ${address}`);

      return createSecureResponse(response, 200);
    } else {
      // Fallback to default Andorra coordinates
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=Andorra&limit=1`;
      const fallbackResult = await safeExternalAPICall(fallbackUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'CreandBankingApp/1.0' }
      }, 10000);

      if (fallbackResult.success && Array.isArray(fallbackResult.data) && fallbackResult.data.length > 0) {
        return createSecureResponse({
          latitude: parseFloat(fallbackResult.data[0].lat),
          longitude: parseFloat(fallbackResult.data[0].lon),
          error: 'Address not found, using default Andorra coordinates'
        }, 200);
      }

      return createSecureResponse(
        { latitude: null, longitude: null, error: 'Address not found' },
        404
      );
    }

  } catch (error) {
    console.error('Geocoding error:', error);
    
    // API8:2023 - Don't expose internal error details
    return createSecureResponse(
      { latitude: null, longitude: null, error: 'Internal server error' },
      500
    );
  }
});
