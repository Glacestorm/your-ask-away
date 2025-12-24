// OWASP API Security Top 10 (2023) Implementation
// Comprehensive security controls for all Edge Functions

// ==========================================
// CORS Headers with Security Hardening
// ==========================================
export const SECURITY_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id, x-fapi-interaction-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
  // Security headers
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  'Pragma': 'no-cache',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// ==========================================
// API1:2023 - Broken Object Level Authorization (BOLA)
// ==========================================
export interface BOLAConfig {
  resourceType: string;
  ownerField: string;
  allowedRoles?: string[];
}

export function validateObjectAccess(
  userId: string,
  resourceOwnerId: string,
  userRoles: string[],
  config: BOLAConfig
): { allowed: boolean; reason: string } {
  // Direct ownership check
  if (userId === resourceOwnerId) {
    return { allowed: true, reason: 'owner_access' };
  }
  
  // Role-based access for admin roles
  const adminRoles = ['superadmin', 'admin', 'director_comercial', 'responsable_comercial'];
  if (userRoles.some(role => adminRoles.includes(role))) {
    return { allowed: true, reason: 'admin_role_access' };
  }
  
  // Specific allowed roles
  if (config.allowedRoles && userRoles.some(role => config.allowedRoles!.includes(role))) {
    return { allowed: true, reason: 'role_based_access' };
  }
  
  return { allowed: false, reason: 'unauthorized_object_access' };
}

// ==========================================
// API2:2023 - Broken Authentication
// ==========================================
export interface AuthValidationResult {
  valid: boolean;
  userId?: string;
  email?: string;
  error?: string;
  authLevel: 'none' | 'basic' | 'elevated';
}

export async function validateAuthentication(
  authHeader: string | null,
  supabase: any
): Promise<AuthValidationResult> {
  if (!authHeader) {
    return { valid: false, error: 'Missing authorization header', authLevel: 'none' };
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Invalid authorization format', authLevel: 'none' };
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  // Validate token format (basic check)
  if (token.length < 20 || token.split('.').length !== 3) {
    return { valid: false, error: 'Malformed token', authLevel: 'none' };
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { valid: false, error: 'Invalid or expired token', authLevel: 'none' };
    }
    
    // Check for MFA/elevated authentication
    const authLevel = user.factors?.length > 0 ? 'elevated' : 'basic';
    
    return {
      valid: true,
      userId: user.id,
      email: user.email,
      authLevel
    };
  } catch (error) {
    return { valid: false, error: 'Authentication validation failed', authLevel: 'none' };
  }
}

// ==========================================
// API3:2023 - Broken Object Property Level Authorization
// ==========================================
export interface PropertyFilter {
  allowedFields: string[];
  sensitiveFields: string[];
  roleBasedFields: Record<string, string[]>;
}

export function filterResponseProperties<T extends Record<string, any>>(
  data: T,
  userRoles: string[],
  filter: PropertyFilter
): Partial<T> {
  const result: Partial<T> = {};
  
  // Get fields allowed for user's roles
  const roleAllowedFields = new Set<string>(filter.allowedFields);
  
  for (const role of userRoles) {
    if (filter.roleBasedFields[role]) {
      filter.roleBasedFields[role].forEach(field => roleAllowedFields.add(field));
    }
  }
  
  // Filter out sensitive fields unless explicitly allowed
  for (const [key, value] of Object.entries(data)) {
    if (roleAllowedFields.has(key) && !filter.sensitiveFields.includes(key)) {
      (result as any)[key] = value;
    } else if (filter.sensitiveFields.includes(key)) {
      // Only include sensitive fields for admin roles
      const adminRoles = ['superadmin', 'admin'];
      if (userRoles.some(role => adminRoles.includes(role))) {
        (result as any)[key] = value;
      }
    }
  }
  
  return result;
}

// ==========================================
// API4:2023 - Unrestricted Resource Consumption
// ==========================================
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier: string;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(config: RateLimitConfig): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const key = config.identifier;
  
  let record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + config.windowMs };
    rateLimitStore.set(key, record);
  }
  
  record.count++;
  
  const remaining = Math.max(0, config.maxRequests - record.count);
  const resetIn = Math.max(0, record.resetTime - now);
  
  return {
    allowed: record.count <= config.maxRequests,
    remaining,
    resetIn
  };
}

export interface PayloadLimits {
  maxBodySize: number;
  maxArrayLength: number;
  maxStringLength: number;
  maxNestedDepth: number;
}

export const DEFAULT_PAYLOAD_LIMITS: PayloadLimits = {
  maxBodySize: 1024 * 1024, // 1MB
  maxArrayLength: 100,
  maxStringLength: 10000,
  maxNestedDepth: 10
};

export function validatePayloadSize(
  body: any,
  limits: PayloadLimits = DEFAULT_PAYLOAD_LIMITS,
  depth: number = 0
): { valid: boolean; error?: string } {
  if (depth > limits.maxNestedDepth) {
    return { valid: false, error: `Maximum nesting depth (${limits.maxNestedDepth}) exceeded` };
  }
  
  if (typeof body === 'string' && body.length > limits.maxStringLength) {
    return { valid: false, error: `String length exceeds maximum (${limits.maxStringLength})` };
  }
  
  if (Array.isArray(body)) {
    if (body.length > limits.maxArrayLength) {
      return { valid: false, error: `Array length exceeds maximum (${limits.maxArrayLength})` };
    }
    for (const item of body) {
      const result = validatePayloadSize(item, limits, depth + 1);
      if (!result.valid) return result;
    }
  }
  
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    for (const value of Object.values(body)) {
      const result = validatePayloadSize(value, limits, depth + 1);
      if (!result.valid) return result;
    }
  }
  
  return { valid: true };
}

// ==========================================
// API5:2023 - Broken Function Level Authorization
// ==========================================
export type FunctionPermission = 
  | 'read' | 'write' | 'delete' | 'admin'
  | 'manage_users' | 'manage_companies' | 'manage_goals'
  | 'view_reports' | 'export_data' | 'import_data';

export const ROLE_PERMISSIONS: Record<string, FunctionPermission[]> = {
  superadmin: ['read', 'write', 'delete', 'admin', 'manage_users', 'manage_companies', 'manage_goals', 'view_reports', 'export_data', 'import_data'],
  admin: ['read', 'write', 'delete', 'admin', 'manage_companies', 'manage_goals', 'view_reports', 'export_data', 'import_data'],
  director_comercial: ['read', 'write', 'manage_companies', 'manage_goals', 'view_reports', 'export_data'],
  responsable_comercial: ['read', 'write', 'manage_companies', 'manage_goals', 'view_reports', 'export_data'],
  director_oficina: ['read', 'write', 'manage_goals', 'view_reports'],
  gestor: ['read', 'write', 'view_reports'],
  auditor: ['read', 'view_reports'],
  user: ['read']
};

export function checkFunctionAuthorization(
  userRoles: string[],
  requiredPermissions: FunctionPermission[]
): { authorized: boolean; missingPermissions: FunctionPermission[] } {
  const userPermissions = new Set<FunctionPermission>();
  
  for (const role of userRoles) {
    const rolePerms = ROLE_PERMISSIONS[role] || [];
    rolePerms.forEach(perm => userPermissions.add(perm));
  }
  
  const missingPermissions = requiredPermissions.filter(perm => !userPermissions.has(perm));
  
  return {
    authorized: missingPermissions.length === 0,
    missingPermissions
  };
}

// ==========================================
// API6:2023 - Unrestricted Access to Sensitive Business Flows
// ==========================================
export interface BusinessFlowProtection {
  flowName: string;
  maxAttempts: number;
  cooldownMs: number;
  requiresCaptcha?: boolean;
  requiresMFA?: boolean;
}

const businessFlowAttempts = new Map<string, { attempts: number; lastAttempt: number }>();

export function protectBusinessFlow(
  userId: string,
  protection: BusinessFlowProtection
): { allowed: boolean; reason?: string; waitTimeMs?: number } {
  const key = `${userId}:${protection.flowName}`;
  const now = Date.now();
  
  let record = businessFlowAttempts.get(key);
  
  if (!record) {
    record = { attempts: 0, lastAttempt: now };
    businessFlowAttempts.set(key, record);
  }
  
  // Reset if cooldown has passed
  if (now - record.lastAttempt > protection.cooldownMs) {
    record.attempts = 0;
  }
  
  record.attempts++;
  record.lastAttempt = now;
  
  if (record.attempts > protection.maxAttempts) {
    const waitTimeMs = protection.cooldownMs - (now - record.lastAttempt);
    return {
      allowed: false,
      reason: 'Rate limit exceeded for this business flow',
      waitTimeMs: Math.max(0, waitTimeMs)
    };
  }
  
  return { allowed: true };
}

// ==========================================
// API7:2023 - Server Side Request Forgery (SSRF)
// ==========================================
const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '169.254.169.254', // AWS metadata
  'metadata.google.internal',
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16'
];

const ALLOWED_PROTOCOLS = ['https:', 'http:'];
const ALLOWED_DOMAINS = [
  'nominatim.openstreetmap.org',
  'api.resend.com',
  'api.openai.com',
  'generativelanguage.googleapis.com',
  'api.bing.microsoft.com'
];

export function validateExternalUrl(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString);
    
    // Check protocol
    if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
      return { valid: false, error: `Protocol ${url.protocol} not allowed` };
    }
    
    // Check for blocked hosts
    for (const blocked of BLOCKED_HOSTS) {
      if (url.hostname === blocked || url.hostname.startsWith(blocked.split('/')[0])) {
        return { valid: false, error: 'Access to internal resources not allowed' };
      }
    }
    
    // Check against allowlist for production
    const isAllowed = ALLOWED_DOMAINS.some(domain => 
      url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    );
    
    if (!isAllowed) {
      return { valid: false, error: `Domain ${url.hostname} not in allowlist` };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// ==========================================
// API8:2023 - Security Misconfiguration
// ==========================================
export function createSecureResponse(
  data: any,
  status: number = 200,
  additionalHeaders: Record<string, string> = {}
): Response {
  // Remove sensitive information from error responses
  if (status >= 400 && data.error) {
    // Don't expose stack traces or internal details
    delete data.stack;
    delete data.internalCode;
    delete data.query;
  }
  
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...SECURITY_HEADERS,
      ...additionalHeaders
    }
  });
}

export function handleOptionsRequest(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...SECURITY_HEADERS,
      'Access-Control-Max-Age': '86400'
    }
  });
}

// ==========================================
// API9:2023 - Improper Inventory Management
// ==========================================
export interface APIEndpointInfo {
  path: string;
  method: string;
  version: string;
  deprecated: boolean;
  deprecationDate?: string;
  replacementEndpoint?: string;
  requiredAuth: boolean;
  requiredPermissions: FunctionPermission[];
}

export const API_INVENTORY: APIEndpointInfo[] = [
  {
    path: '/geocode-address',
    method: 'POST',
    version: '1.0',
    deprecated: false,
    requiredAuth: true,
    requiredPermissions: ['read']
  },
  {
    path: '/generate-action-plan',
    method: 'POST',
    version: '1.0',
    deprecated: false,
    requiredAuth: true,
    requiredPermissions: ['write']
  },
  {
    path: '/parse-financial-pdf',
    method: 'POST',
    version: '1.0',
    deprecated: false,
    requiredAuth: true,
    requiredPermissions: ['write', 'import_data']
  },
  {
    path: '/open-banking-api',
    method: 'ALL',
    version: '1.0',
    deprecated: false,
    requiredAuth: true,
    requiredPermissions: ['read', 'write']
  }
];

export function checkEndpointDeprecation(path: string): { 
  deprecated: boolean; 
  message?: string;
  replacement?: string;
} {
  const endpoint = API_INVENTORY.find(e => e.path === path);
  
  if (!endpoint) {
    return { deprecated: false };
  }
  
  if (endpoint.deprecated) {
    return {
      deprecated: true,
      message: `This endpoint is deprecated${endpoint.deprecationDate ? ` since ${endpoint.deprecationDate}` : ''}`,
      replacement: endpoint.replacementEndpoint
    };
  }
  
  return { deprecated: false };
}

// ==========================================
// API10:2023 - Unsafe Consumption of APIs
// ==========================================
export interface ExternalAPIResponse {
  success: boolean;
  data?: any;
  error?: string;
  sanitized: boolean;
}

export async function safeExternalAPICall(
  url: string,
  options: RequestInit,
  timeoutMs: number = 30000
): Promise<ExternalAPIResponse> {
  // Validate URL first
  const urlValidation = validateExternalUrl(url);
  if (!urlValidation.valid) {
    return { success: false, error: urlValidation.error, sanitized: true };
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        'User-Agent': 'ObelixIAApp/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return {
        success: false,
        error: `External API returned status ${response.status}`,
        sanitized: true
      };
    }
    
    const data = await response.json();
    
    // Sanitize response - remove potentially dangerous content
    const sanitizedData = sanitizeExternalData(data);
    
    return {
      success: true,
      data: sanitizedData,
      sanitized: true
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Request timeout', sanitized: true };
    }
    
    return {
      success: false,
      error: 'External API call failed',
      sanitized: true
    };
  }
}

function sanitizeExternalData(data: any, depth: number = 0): any {
  if (depth > 10) return null; // Prevent deep recursion
  
  if (typeof data === 'string') {
    // Remove script tags and other potentially dangerous content
    return data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .substring(0, 10000); // Limit string length
  }
  
  if (Array.isArray(data)) {
    return data.slice(0, 100).map(item => sanitizeExternalData(item, depth + 1));
  }
  
  if (data && typeof data === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip potentially dangerous keys
      if (key.startsWith('__') || key === 'constructor' || key === 'prototype') {
        continue;
      }
      result[key] = sanitizeExternalData(value, depth + 1);
    }
    return result;
  }
  
  return data;
}

// ==========================================
// Security Logging
// ==========================================
export interface SecurityEvent {
  type: 'auth_failure' | 'rate_limit' | 'bola_violation' | 'ssrf_attempt' | 'input_validation' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ip?: string;
  endpoint: string;
  details: string;
  timestamp: string;
}

export function logSecurityEvent(event: SecurityEvent): void {
  console.log(`[SECURITY] [${event.severity.toUpperCase()}] ${event.type}: ${event.details}`, {
    userId: event.userId,
    endpoint: event.endpoint,
    timestamp: event.timestamp
  });
}

// ==========================================
// Input Validation Utilities
// ==========================================
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .substring(0, 10000);
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

// ==========================================
// Main Security Middleware
// ==========================================
export interface SecurityMiddlewareConfig {
  requireAuth: boolean;
  requiredPermissions: FunctionPermission[];
  rateLimitRequests: number;
  rateLimitWindowMs: number;
  checkPayloadSize: boolean;
  logAllRequests: boolean;
}

export const DEFAULT_SECURITY_CONFIG: SecurityMiddlewareConfig = {
  requireAuth: true,
  requiredPermissions: ['read'],
  rateLimitRequests: 100,
  rateLimitWindowMs: 3600000, // 1 hour
  checkPayloadSize: true,
  logAllRequests: true
};

export async function applySecurityMiddleware(
  req: Request,
  supabase: any,
  config: Partial<SecurityMiddlewareConfig> = {}
): Promise<{ passed: boolean; response?: Response; userId?: string; userRoles?: string[] }> {
  const fullConfig = { ...DEFAULT_SECURITY_CONFIG, ...config };
  const endpoint = new URL(req.url).pathname;
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return { passed: true, response: handleOptionsRequest() };
  }
  
  // Rate limiting
  const clientId = req.headers.get('x-forwarded-for') || 'unknown';
  const rateLimit = checkRateLimit({
    identifier: `${clientId}:${endpoint}`,
    maxRequests: fullConfig.rateLimitRequests,
    windowMs: fullConfig.rateLimitWindowMs
  });
  
  if (!rateLimit.allowed) {
    logSecurityEvent({
      type: 'rate_limit',
      severity: 'medium',
      ip: clientId,
      endpoint,
      details: 'Rate limit exceeded',
      timestamp: new Date().toISOString()
    });
    
    return {
      passed: false,
      response: createSecureResponse(
        { error: 'Rate limit exceeded', retryAfter: Math.ceil(rateLimit.resetIn / 1000) },
        429,
        { 'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString() }
      )
    };
  }
  
  // Authentication
  let userId: string | undefined;
  let userRoles: string[] = [];
  
  if (fullConfig.requireAuth) {
    const authResult = await validateAuthentication(
      req.headers.get('authorization'),
      supabase
    );
    
    if (!authResult.valid) {
      logSecurityEvent({
        type: 'auth_failure',
        severity: 'high',
        ip: clientId,
        endpoint,
        details: authResult.error || 'Authentication failed',
        timestamp: new Date().toISOString()
      });
      
      return {
        passed: false,
        response: createSecureResponse({ error: 'Unauthorized' }, 401)
      };
    }
    
    userId = authResult.userId;
    
    // Get user roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    userRoles = roles?.map((r: any) => r.role) || [];
  }
  
  // Function level authorization
  if (fullConfig.requiredPermissions.length > 0) {
    const authz = checkFunctionAuthorization(userRoles, fullConfig.requiredPermissions);
    
    if (!authz.authorized) {
      logSecurityEvent({
        type: 'bola_violation',
        severity: 'high',
        userId,
        ip: clientId,
        endpoint,
        details: `Missing permissions: ${authz.missingPermissions.join(', ')}`,
        timestamp: new Date().toISOString()
      });
      
      return {
        passed: false,
        response: createSecureResponse({ error: 'Forbidden' }, 403)
      };
    }
  }
  
  // Payload size validation
  if (fullConfig.checkPayloadSize && req.body) {
    try {
      const body = await req.clone().json();
      const payloadValidation = validatePayloadSize(body);
      
      if (!payloadValidation.valid) {
        logSecurityEvent({
          type: 'input_validation',
          severity: 'medium',
          userId,
          ip: clientId,
          endpoint,
          details: payloadValidation.error || 'Payload validation failed',
          timestamp: new Date().toISOString()
        });
        
        return {
          passed: false,
          response: createSecureResponse({ error: payloadValidation.error }, 400)
        };
      }
    } catch {
      // Body might not be JSON or already consumed
    }
  }
  
  // Log request if configured
  if (fullConfig.logAllRequests) {
    console.log(`[REQUEST] ${req.method} ${endpoint}`, {
      userId,
      roles: userRoles,
      ip: clientId,
      timestamp: new Date().toISOString()
    });
  }
  
  return { passed: true, userId, userRoles };
}
