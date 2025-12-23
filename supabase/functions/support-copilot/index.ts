import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  SECURITY_HEADERS, 
  handleOptionsRequest, 
  createSecureResponse,
  checkRateLimit,
  validatePayloadSize
} from '../_shared/owasp-security.ts';
import { secureAICall, getClientIP, generateRequestId } from '../_shared/edge-function-template.ts';

interface SupportCopilotRequest {
  action: 'get_suggestions' | 'analyze_action' | 'generate_summary' | 'predict_issues';
  sessionContext?: {
    sessionId: string;
    sessionCode: string;
    clientName?: string;
    startedAt: string;
    actionsCount: number;
    highRiskCount: number;
    currentDuration: number;
    recentActions?: Array<{
      action_type: string;
      description: string;
      risk_level: string;
      created_at: string;
    }>;
  };
  actionContext?: {
    actionType: string;
    description: string;
  };
}

serve(async (req) => {
  const requestId = generateRequestId();
  const clientIp = getClientIP(req);
  const startTime = Date.now();

  console.log(`[support-copilot] Request ${requestId} from ${clientIp}`);

  // === CORS ===
  if (req.method === 'OPTIONS') {
    return handleOptionsRequest();
  }

  try {
    // === Rate Limiting ===
    const rateCheck = checkRateLimit({
      maxRequests: 60,
      windowMs: 60000,
      identifier: `support-copilot:${clientIp}`,
    });

    if (!rateCheck.allowed) {
      console.warn(`[support-copilot] Rate limit exceeded: ${clientIp}`);
      return createSecureResponse({ 
        success: false,
        error: 'rate_limit_exceeded', 
        message: 'Demasiadas solicitudes. Intenta más tarde.',
        retryAfter: Math.ceil(rateCheck.resetIn / 1000)
      }, 429);
    }

    // === Parse & Validate Body ===
    let body: SupportCopilotRequest;
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

    const { action, sessionContext, actionContext } = body;

    // === Build Prompts ===
    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_suggestions':
        systemPrompt = `Eres un asistente de IA especializado en soporte técnico remoto. Tu rol es proporcionar sugerencias inteligentes y proactivas durante las sesiones de soporte.

CONTEXTO DEL ROL:
- Ayudas a técnicos de soporte durante sesiones remotas
- Analizas patrones de acciones para sugerir próximos pasos
- Identificas posibles problemas antes de que ocurran
- Recomiendas buenas prácticas de seguridad y documentación

FORMATO DE RESPUESTA (JSON estricto):
{
  "suggestions": [
    {
      "id": "unique_id",
      "type": "action" | "warning" | "tip" | "checklist",
      "priority": "high" | "medium" | "low",
      "title": "Título breve",
      "description": "Descripción detallada de la sugerencia",
      "icon": "Shield" | "AlertTriangle" | "Lightbulb" | "CheckSquare" | "Clock" | "FileText"
    }
  ],
  "riskAssessment": {
    "level": "low" | "medium" | "high",
    "factors": ["factor1", "factor2"],
    "recommendation": "Recomendación general"
  },
  "nextBestActions": ["acción1", "acción2", "acción3"]
}`;

        userPrompt = sessionContext ? `Analiza esta sesión de soporte remoto y proporciona sugerencias inteligentes:

SESIÓN ACTIVA:
- Código: ${sessionContext.sessionCode}
- Cliente: ${sessionContext.clientName || 'No especificado'}
- Duración: ${Math.round(sessionContext.currentDuration / 60000)} minutos
- Acciones realizadas: ${sessionContext.actionsCount}
- Acciones de alto riesgo: ${sessionContext.highRiskCount}

ÚLTIMAS ACCIONES:
${sessionContext.recentActions?.map(a => `- [${a.risk_level}] ${a.action_type}: ${a.description}`).join('\n') || 'Sin acciones registradas aún'}

Genera 3-5 sugerencias contextuales y relevantes para este momento de la sesión.` : 'Proporciona sugerencias generales para iniciar una sesión de soporte.';
        break;

      case 'analyze_action':
        systemPrompt = `Eres un analista de seguridad y compliance para sesiones de soporte remoto. Evalúas acciones individuales y determinas su nivel de riesgo y necesidad de aprobación.

FORMATO DE RESPUESTA (JSON estricto):
{
  "riskScore": 0-100,
  "riskLevel": "low" | "medium" | "high" | "critical",
  "requiresApproval": boolean,
  "complianceFlags": ["flag1", "flag2"],
  "recommendations": ["rec1", "rec2"],
  "betterDescription": "Descripción mejorada para auditoría"
}`;

        userPrompt = actionContext ? `Analiza esta acción de soporte remoto:

TIPO DE ACCIÓN: ${actionContext.actionType}
DESCRIPCIÓN: ${actionContext.description}

Evalúa el riesgo, compliance y proporciona recomendaciones.` : 'Error: No se proporcionó contexto de acción';
        break;

      case 'generate_summary':
        systemPrompt = `Eres un especialista en documentación técnica. Generas resúmenes ejecutivos de sesiones de soporte para auditoría y seguimiento.

FORMATO DE RESPUESTA (JSON estricto):
{
  "executiveSummary": "Resumen ejecutivo de 2-3 oraciones",
  "keyActions": ["acción clave 1", "acción clave 2"],
  "risksIdentified": ["riesgo 1", "riesgo 2"],
  "recommendations": ["recomendación 1", "recomendación 2"],
  "followUpRequired": boolean,
  "followUpNotes": "Notas de seguimiento si aplica",
  "qualityScore": 0-100
}`;

        userPrompt = sessionContext ? `Genera un resumen ejecutivo para esta sesión de soporte:

SESIÓN: ${sessionContext.sessionCode}
CLIENTE: ${sessionContext.clientName || 'No especificado'}
DURACIÓN: ${Math.round(sessionContext.currentDuration / 60000)} minutos
ACCIONES TOTALES: ${sessionContext.actionsCount}
ACCIONES DE ALTO RIESGO: ${sessionContext.highRiskCount}

HISTORIAL DE ACCIONES:
${sessionContext.recentActions?.map(a => `- [${a.created_at}] ${a.action_type}: ${a.description}`).join('\n') || 'Sin acciones'}` : 'Error: No se proporcionó contexto de sesión';
        break;

      case 'predict_issues':
        systemPrompt = `Eres un sistema de análisis predictivo para soporte técnico. Identificas patrones que podrían indicar problemas futuros basándote en el comportamiento de la sesión.

FORMATO DE RESPUESTA (JSON estricto):
{
  "predictions": [
    {
      "issue": "Descripción del posible problema",
      "probability": 0-100,
      "preventiveAction": "Acción preventiva recomendada",
      "severity": "low" | "medium" | "high"
    }
  ],
  "sessionHealthScore": 0-100,
  "alerts": ["alerta 1", "alerta 2"]
}`;

        userPrompt = sessionContext ? `Analiza patrones y predice posibles problemas:

DATOS DE LA SESIÓN:
- Duración actual: ${Math.round(sessionContext.currentDuration / 60000)} minutos
- Frecuencia de acciones: ${sessionContext.actionsCount} acciones
- Ratio de alto riesgo: ${sessionContext.highRiskCount}/${sessionContext.actionsCount}

PATRÓN DE ACCIONES:
${sessionContext.recentActions?.map(a => a.action_type).join(' -> ') || 'Sin patrón'}` : 'Error: No se proporcionó contexto';
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
      maxTokens: 2000,
    });

    if (!aiResult.success) {
      console.error(`[support-copilot] AI error: ${aiResult.error}`);
      
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
    console.log(`[support-copilot] Success: ${action} in ${duration}ms`);

    return createSecureResponse({
      success: true,
      action,
      data: aiResult.parsed || { rawContent: aiResult.content },
      requestId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[support-copilot] Error after ${duration}ms:`, error);
    
    return createSecureResponse({
      success: false,
      error: 'internal_error',
      message: error instanceof Error ? error.message : 'Error interno',
      requestId
    }, 500);
  }
});
