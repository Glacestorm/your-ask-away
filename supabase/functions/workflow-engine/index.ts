import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  SECURITY_HEADERS, 
  handleOptionsRequest, 
  createSecureResponse,
  checkRateLimit,
  validatePayloadSize
} from '../_shared/owasp-security.ts';
import { secureAICall, getClientIP, generateRequestId } from '../_shared/edge-function-template.ts';

interface WorkflowRequest {
  action: 'get_workflows' | 'create_workflow' | 'execute_workflow' | 'pause_workflow' | 'resume_workflow' | 'generate_workflow' | 'create_rule';
  context?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

serve(async (req) => {
  const requestId = generateRequestId();
  const clientIp = getClientIP(req);
  const startTime = Date.now();

  console.log(`[workflow-engine] Request ${requestId} from ${clientIp}`);

  // === CORS ===
  if (req.method === 'OPTIONS') {
    return handleOptionsRequest();
  }

  try {
    // === Rate Limiting ===
    const rateCheck = checkRateLimit({
      maxRequests: 100,
      windowMs: 60000,
      identifier: `workflow-engine:${clientIp}`,
    });

    if (!rateCheck.allowed) {
      console.warn(`[workflow-engine] Rate limit exceeded: ${clientIp}`);
      return createSecureResponse({ 
        success: false,
        error: 'rate_limit_exceeded', 
        message: 'Demasiadas solicitudes. Intenta más tarde.',
        retryAfter: Math.ceil(rateCheck.resetIn / 1000)
      }, 429);
    }

    // === Parse & Validate Body ===
    let body: WorkflowRequest;
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
      case 'get_workflows':
        systemPrompt = `Eres un motor de automatización de workflows empresariales.

CONTEXTO DEL ROL:
- Gestión de workflows automatizados
- Reglas de negocio dinámicas
- Ejecución y monitoreo de procesos

FORMATO DE RESPUESTA (JSON estricto):
{
  "workflows": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "status": "draft" | "active" | "paused" | "archived",
      "trigger": {"type": "event" | "schedule" | "manual" | "condition", "config": {}, "description": "string"},
      "steps": [{"id": "string", "name": "string", "type": "string", "config": {}, "order": number}],
      "createdAt": "ISO timestamp",
      "updatedAt": "ISO timestamp",
      "executionCount": number,
      "successRate": number
    }
  ],
  "rules": [
    {
      "id": "uuid",
      "name": "string",
      "condition": "string",
      "actions": ["string"],
      "priority": number,
      "enabled": boolean,
      "triggerCount": number
    }
  ],
  "executions": []
}`;
        userPrompt = `Lista los workflows disponibles con contexto: ${JSON.stringify(context)}`;
        break;

      case 'create_workflow':
        systemPrompt = `Eres un diseñador de workflows empresariales.

FORMATO DE RESPUESTA (JSON estricto):
{
  "workflow": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "status": "draft",
    "trigger": {"type": "string", "config": {}, "description": "string"},
    "steps": [],
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp",
    "executionCount": 0,
    "successRate": 0
  }
}`;
        userPrompt = `Crea un workflow con: ${JSON.stringify(params)}`;
        break;

      case 'execute_workflow':
        systemPrompt = `Eres un ejecutor de workflows empresariales.

FORMATO DE RESPUESTA (JSON estricto):
{
  "execution": {
    "id": "uuid",
    "workflowId": "string",
    "workflowName": "string",
    "status": "running",
    "currentStep": "string",
    "startedAt": "ISO timestamp",
    "logs": [{"timestamp": "ISO timestamp", "stepId": "string", "stepName": "string", "status": "started", "message": "string"}]
  }
}`;
        userPrompt = `Ejecuta el workflow ${params?.workflowId} con datos: ${JSON.stringify(params?.inputData)}`;
        break;

      case 'pause_workflow':
      case 'resume_workflow':
        systemPrompt = `Eres un controlador de estados de workflows.

FORMATO DE RESPUESTA (JSON estricto):
{
  "success": boolean,
  "workflowId": "string",
  "newStatus": "paused" | "active",
  "message": "string"
}`;
        userPrompt = `${action === 'pause_workflow' ? 'Pausa' : 'Reanuda'} el workflow: ${params?.workflowId}`;
        break;

      case 'generate_workflow':
        systemPrompt = `Eres un generador de workflows con IA avanzada.

CAPACIDADES:
- Interpretar descripciones en lenguaje natural
- Generar workflows optimizados automáticamente
- Sugerir mejoras y optimizaciones
- Crear reglas de automatización inteligentes

FORMATO DE RESPUESTA (JSON estricto):
{
  "workflow": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "status": "draft",
    "trigger": {"type": "string", "config": {}, "description": "string"},
    "steps": [
      {
        "id": "uuid",
        "name": "string",
        "type": "action" | "condition" | "delay" | "approval" | "notification" | "integration",
        "config": {},
        "order": number
      }
    ],
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp",
    "executionCount": 0,
    "successRate": 0,
    "aiSuggestions": ["string"]
  }
}`;
        userPrompt = `Genera un workflow basado en: "${params?.description}". Contexto adicional: ${JSON.stringify(params?.context)}`;
        break;

      case 'create_rule':
        systemPrompt = `Eres un creador de reglas de automatización empresarial.

FORMATO DE RESPUESTA (JSON estricto):
{
  "rule": {
    "id": "uuid",
    "name": "string",
    "condition": "string",
    "actions": ["string"],
    "priority": number,
    "enabled": true,
    "triggerCount": 0
  }
}`;
        userPrompt = `Crea una regla de automatización: ${JSON.stringify(params)}`;
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
      console.error(`[workflow-engine] AI error: ${aiResult.error}`);
      
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
    console.log(`[workflow-engine] Success: ${action} in ${duration}ms`);

    return createSecureResponse({
      success: true,
      action,
      data: aiResult.parsed || { rawContent: aiResult.content },
      requestId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[workflow-engine] Error after ${duration}ms:`, error);
    
    return createSecureResponse({
      success: false,
      error: 'internal_error',
      message: error instanceof Error ? error.message : 'Error interno',
      requestId
    }, 500);
  }
});
