// Edge Function Security Template
// Proporciona wrapper seguro para todas las edge functions
// Implementa OWASP API Security Top 10 (2023)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  SECURITY_HEADERS, 
  validateAuthentication,
  checkRateLimit,
  validatePayloadSize,
  createSecureResponse,
  handleOptionsRequest,
  DEFAULT_PAYLOAD_LIMITS,
  type AuthValidationResult
} from './owasp-security.ts';

// ==========================================
// TYPES
// ==========================================
export interface SecurityContext {
  user: AuthValidationResult;
  body: Record<string, unknown>;
  requestId: string;
  clientIp: string;
}

export interface SecureHandlerOptions {
  /** Nombre de la función para logging */
  functionName: string;
  /** Requiere autenticación JWT (default: true) */
  requireAuth?: boolean;
  /** Configuración de rate limiting */
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  /** Límites de payload personalizados */
  payloadLimits?: typeof DEFAULT_PAYLOAD_LIMITS;
  /** Roles permitidos (si está vacío, cualquier usuario autenticado) */
  allowedRoles?: string[];
}

const DEFAULT_OPTIONS: SecureHandlerOptions = {
  functionName: 'edge-function',
  requireAuth: true,
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000, // 1 minuto
  },
};

// ==========================================
// UTILITIES
// ==========================================

/**
 * Extrae la IP del cliente del request
 */
export function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || req.headers.get('x-real-ip') 
    || 'unknown';
}

/**
 * Genera un request ID único para trazabilidad
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Obtiene roles del usuario desde el perfil
 */
async function getUserRoles(supabase: any, userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (error || !data) return [];
    return data.role ? [data.role] : [];
  } catch {
    return [];
  }
}

// ==========================================
// MAIN WRAPPER
// ==========================================

/**
 * Wrapper de seguridad para Edge Functions
 * Implementa todos los controles OWASP automáticamente
 * 
 * @example
 * ```typescript
 * import { createSecureEdgeFunction, type SecurityContext } from '../_shared/edge-function-template.ts';
 * 
 * const handler = await createSecureEdgeFunction(
 *   async (req: Request, ctx: SecurityContext) => {
 *     // Tu lógica aquí - ya autenticado y validado
 *     return { success: true, data: {} };
 *   },
 *   { functionName: 'my-function' }
 * );
 * 
 * serve(handler);
 * ```
 */
export async function createSecureEdgeFunction(
  handler: (req: Request, ctx: SecurityContext) => Promise<Record<string, unknown>>,
  options: SecureHandlerOptions = DEFAULT_OPTIONS
): Promise<(req: Request) => Promise<Response>> {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return async (req: Request): Promise<Response> => {
    const requestId = generateRequestId();
    const clientIp = getClientIP(req);
    const startTime = Date.now();

    console.log(`[${config.functionName}] Request started: ${requestId} from ${clientIp}`);

    // === CORS Preflight ===
    if (req.method === 'OPTIONS') {
      return handleOptionsRequest();
    }

    try {
      // === Rate Limiting ===
      if (config.rateLimit) {
        const rateCheck = checkRateLimit({
          maxRequests: config.rateLimit.maxRequests,
          windowMs: config.rateLimit.windowMs,
          identifier: `${config.functionName}:${clientIp}`,
        });

        if (!rateCheck.allowed) {
          console.warn(`[${config.functionName}] Rate limit exceeded: ${clientIp}`);
          return createSecureResponse(
            { 
              success: false,
              error: 'rate_limit_exceeded', 
              message: 'Demasiadas solicitudes. Intenta más tarde.',
              retryAfter: Math.ceil(rateCheck.resetIn / 1000)
            }, 
            429,
            { 'Retry-After': String(Math.ceil(rateCheck.resetIn / 1000)) }
          );
        }
      }

      // === Parse Body ===
      let body: Record<string, unknown> = {};
      try {
        const text = await req.text();
        if (text) {
          body = JSON.parse(text);
        }
      } catch (parseError) {
        console.error(`[${config.functionName}] Invalid JSON body`);
        return createSecureResponse(
          { success: false, error: 'invalid_json', message: 'El cuerpo de la solicitud no es JSON válido' },
          400
        );
      }

      // === Payload Validation ===
      const payloadCheck = validatePayloadSize(body, config.payloadLimits);
      if (!payloadCheck.valid) {
        console.warn(`[${config.functionName}] Payload validation failed: ${payloadCheck.error}`);
        return createSecureResponse(
          { success: false, error: 'payload_too_large', message: payloadCheck.error },
          413
        );
      }

      // === Authentication ===
      let authResult: AuthValidationResult = { valid: false, authLevel: 'none' };
      
      if (config.requireAuth) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        authResult = await validateAuthentication(
          req.headers.get('Authorization'),
          supabase
        );

        if (!authResult.valid) {
          console.warn(`[${config.functionName}] Auth failed: ${authResult.error}`);
          return createSecureResponse(
            { success: false, error: 'unauthorized', message: authResult.error || 'No autorizado' },
            401
          );
        }

        // === Role Validation ===
        if (config.allowedRoles && config.allowedRoles.length > 0 && authResult.userId) {
          const userRoles = await getUserRoles(supabase, authResult.userId);
          const hasRole = config.allowedRoles.some(role => userRoles.includes(role));
          
          if (!hasRole) {
            console.warn(`[${config.functionName}] Forbidden - user lacks required role`);
            return createSecureResponse(
              { success: false, error: 'forbidden', message: 'No tienes permisos para esta operación' },
              403
            );
          }
        }
      }

      // === Execute Handler ===
      const ctx: SecurityContext = {
        user: authResult,
        body,
        requestId,
        clientIp,
      };

      const result = await handler(req, ctx);

      const duration = Date.now() - startTime;
      console.log(`[${config.functionName}] Request completed: ${requestId} in ${duration}ms`);

      return createSecureResponse({
        ...result,
        requestId,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${config.functionName}] Error after ${duration}ms:`, error);

      // No exponer detalles internos del error
      return createSecureResponse(
        {
          success: false,
          error: 'internal_error',
          message: 'Error interno del servidor',
          requestId,
        },
        500
      );
    }
  };
}

// ==========================================
// AI HELPER
// ==========================================

export interface AICallOptions {
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Llamada segura a Lovable AI con manejo de errores
 */
export async function secureAICall(options: AICallOptions): Promise<{
  success: boolean;
  content?: string;
  parsed?: Record<string, unknown>;
  error?: string;
}> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return { success: false, error: 'LOVABLE_API_KEY not configured' };
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: options.userPrompt }
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return { success: false, error: 'Rate limit exceeded' };
      }
      if (response.status === 402) {
        return { success: false, error: 'Payment required - insufficient AI credits' };
      }
      return { success: false, error: `AI API error: ${response.status}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { success: false, error: 'No content in AI response' };
    }

    // Try to parse JSON from response
    let parsed: Record<string, unknown> | undefined;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Keep raw content if JSON parsing fails
    }

    return { success: true, content, parsed };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown AI error' 
    };
  }
}
