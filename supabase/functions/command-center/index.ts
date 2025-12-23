import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  SECURITY_HEADERS, 
  handleOptionsRequest, 
  createSecureResponse,
  checkRateLimit,
  validatePayloadSize
} from '../_shared/owasp-security.ts';
import { secureAICall, getClientIP, generateRequestId } from '../_shared/edge-function-template.ts';

interface CommandCenterRequest {
  action: 'get_dashboard' | 'acknowledge_alert' | 'escalate_alert' | 'get_metric_details' | 'execute_command';
  context?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

serve(async (req) => {
  const requestId = generateRequestId();
  const clientIp = getClientIP(req);
  const startTime = Date.now();

  console.log(`[command-center] Request ${requestId} from ${clientIp}`);

  // === CORS ===
  if (req.method === 'OPTIONS') {
    return handleOptionsRequest();
  }

  try {
    // === Rate Limiting ===
    const rateCheck = checkRateLimit({
      maxRequests: 100,
      windowMs: 60000,
      identifier: `command-center:${clientIp}`,
    });

    if (!rateCheck.allowed) {
      console.warn(`[command-center] Rate limit exceeded: ${clientIp}`);
      return createSecureResponse({ 
        success: false,
        error: 'rate_limit_exceeded', 
        message: 'Demasiadas solicitudes. Intenta más tarde.',
        retryAfter: Math.ceil(rateCheck.resetIn / 1000)
      }, 429);
    }

    // === Parse & Validate Body ===
    let body: CommandCenterRequest;
    try {
      body = await req.json();
    } catch {
      return createSecureResponse({ 
        success: false, 
        error: 'invalid_json', 
        message: 'El cuerpo no es JSON válido' 
      }, 400);
    }

    const payloadCheck = validatePayloadSize(body);
    if (!payloadCheck.valid) {
      return createSecureResponse({ 
        success: false, 
        error: 'payload_too_large', 
        message: payloadCheck.error 
      }, 413);
    }

    const { action, context, params } = body;

    // === Build Prompts ===
    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_dashboard':
        systemPrompt = `Eres el Centro de Comando Unificado para operaciones empresariales.

CONTEXTO DEL ROL:
- Dashboard ejecutivo en tiempo real
- Monitoreo de métricas críticas de negocio
- Gestión de alertas inteligentes
- Visibilidad de actividad del sistema

FORMATO DE RESPUESTA (JSON estricto):
{
  "metrics": [
    {
      "id": "uuid",
      "name": "string",
      "value": number,
      "unit": "string",
      "trend": "up" | "down" | "stable",
      "trendPercentage": number,
      "status": "healthy" | "warning" | "critical",
      "category": "string",
      "lastUpdated": "ISO timestamp"
    }
  ],
  "alerts": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "severity": "info" | "warning" | "error" | "critical",
      "source": "string",
      "timestamp": "ISO timestamp",
      "acknowledged": boolean,
      "actions": [{"id": "string", "label": "string", "type": "string", "automated": boolean}]
    }
  ],
  "systemHealth": {
    "overall": 0-100,
    "components": [{"name": "string", "status": "operational" | "degraded" | "outage", "latency": number, "errorRate": number}],
    "incidents": number,
    "uptime": number
  },
  "activity": [
    {
      "id": "uuid",
      "type": "string",
      "user": "string",
      "action": "string",
      "target": "string",
      "timestamp": "ISO timestamp"
    }
  ]
}`;
        userPrompt = `Genera el dashboard del centro de comando con rango de tiempo: ${context?.timeRange || '24h'}`;
        break;

      case 'acknowledge_alert':
        systemPrompt = `Eres un sistema de gestión de alertas empresariales.

FORMATO DE RESPUESTA (JSON estricto):
{
  "acknowledged": boolean,
  "alertId": "string",
  "acknowledgedAt": "ISO timestamp",
  "nextAction": "string"
}`;
        userPrompt = `Reconoce la alerta: ${params?.alertId}`;
        break;

      case 'escalate_alert':
        systemPrompt = `Eres un sistema de escalamiento de alertas empresariales.

CAPACIDADES:
- Determinar nivel de escalamiento apropiado
- Notificar a stakeholders relevantes
- Documentar razón del escalamiento

FORMATO DE RESPUESTA (JSON estricto):
{
  "escalated": boolean,
  "escalationLevel": number,
  "notifiedParties": ["string"],
  "urgency": "low" | "medium" | "high" | "critical",
  "estimatedResponseTime": "string"
}`;
        userPrompt = `Escala la alerta ${params?.alertId} con razón: ${params?.reason || 'No especificada'}`;
        break;

      case 'get_metric_details':
        systemPrompt = `Eres un analista de métricas empresariales.

FORMATO DE RESPUESTA (JSON estricto):
{
  "metric": {
    "id": "string",
    "name": "string",
    "currentValue": number,
    "historicalData": [{"timestamp": "ISO timestamp", "value": number}],
    "insights": ["string"],
    "recommendations": ["string"]
  }
}`;
        userPrompt = `Analiza la métrica ${params?.metricId} para el rango: ${params?.timeRange || '24h'}`;
        break;

      case 'execute_command':
        systemPrompt = `Eres un ejecutor de comandos del centro de operaciones.

COMANDOS DISPONIBLES:
- refresh_metrics: Actualizar todas las métricas
- clear_alerts: Limpiar alertas resueltas
- generate_report: Generar reporte ejecutivo
- system_check: Verificar estado del sistema

FORMATO DE RESPUESTA (JSON estricto):
{
  "executed": boolean,
  "command": "string",
  "result": "string",
  "affectedItems": number,
  "executionTime": "string"
}`;
        userPrompt = `Ejecuta el comando: ${params?.command}`;
        break;

      default:
        return createSecureResponse({ 
          success: false, 
          error: 'invalid_action', 
          message: `Acción no soportada: ${action}` 
        }, 400);
    }

    // === AI Call ===
    const aiResult = await secureAICall({
      systemPrompt,
      userPrompt,
      maxTokens: 4000,
    });

    if (!aiResult.success) {
      console.error(`[command-center] AI error: ${aiResult.error}`);
      
      if (aiResult.error?.includes('Rate limit')) {
        return createSecureResponse({ 
          success: false,
          error: 'rate_limit_exceeded', 
          message: 'Demasiadas solicitudes a IA. Intenta más tarde.' 
        }, 429);
      }
      if (aiResult.error?.includes('Payment required')) {
        return createSecureResponse({ 
          success: false,
          error: 'payment_required', 
          message: 'Créditos de IA insuficientes.' 
        }, 402);
      }
      
      throw new Error(aiResult.error);
    }

    const duration = Date.now() - startTime;
    console.log(`[command-center] Success: ${action} in ${duration}ms`);

    return createSecureResponse({
      success: true,
      action,
      data: aiResult.parsed || { rawContent: aiResult.content },
      requestId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[command-center] Error after ${duration}ms:`, error);
    
    return createSecureResponse({
      success: false,
      error: 'internal_error',
      message: error instanceof Error ? error.message : 'Error interno',
      requestId
    }, 500);
  }
});
