import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  SECURITY_HEADERS, 
  handleOptionsRequest, 
  createSecureResponse,
  checkRateLimit,
  validatePayloadSize
} from '../_shared/owasp-security.ts';
import { secureAICall, getClientIP, generateRequestId } from '../_shared/edge-function-template.ts';

interface ComplianceRequest {
  action: 'get_status' | 'run_scan' | 'predict_risks' | 'resolve_violation';
  context?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

serve(async (req) => {
  const requestId = generateRequestId();
  const clientIp = getClientIP(req);
  const startTime = Date.now();

  console.log(`[compliance-monitor] Request ${requestId} from ${clientIp}`);

  // === CORS ===
  if (req.method === 'OPTIONS') {
    return handleOptionsRequest();
  }

  try {
    // === Rate Limiting ===
    const rateCheck = checkRateLimit({
      maxRequests: 60,
      windowMs: 60000,
      identifier: `compliance-monitor:${clientIp}`,
    });

    if (!rateCheck.allowed) {
      console.warn(`[compliance-monitor] Rate limit exceeded: ${clientIp}`);
      return createSecureResponse({ 
        success: false,
        error: 'rate_limit_exceeded', 
        message: 'Demasiadas solicitudes. Intenta más tarde.',
        retryAfter: Math.ceil(rateCheck.resetIn / 1000)
      }, 429);
    }

    // === Parse & Validate Body ===
    let body: ComplianceRequest;
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
      case 'get_status':
        systemPrompt = `Eres un sistema experto en compliance y cumplimiento normativo para empresas.
        
CONTEXTO DEL ROL:
- Monitorizas el cumplimiento de regulaciones empresariales
- Analizas riesgos de incumplimiento en tiempo real
- Proporcionas métricas de compliance actualizadas

FORMATO DE RESPUESTA (JSON estricto):
{
  "metrics": {
    "overallScore": 0-100,
    "trend": "improving" | "stable" | "declining",
    "totalRules": number,
    "compliantRules": number,
    "violations": number,
    "criticalViolations": number,
    "lastFullScan": "ISO timestamp",
    "predictedRisks": []
  },
  "rules": [
    {
      "id": "uuid",
      "code": "string",
      "name": "string",
      "category": "string",
      "severity": "low" | "medium" | "high" | "critical",
      "status": "compliant" | "non_compliant" | "warning" | "pending",
      "lastCheck": "ISO timestamp",
      "nextCheck": "ISO timestamp",
      "automatedFix": boolean
    }
  ],
  "violations": [],
  "predictedRisks": []
}`;
        userPrompt = context 
          ? `Analiza el estado de compliance para el sector: ${JSON.stringify(context)}`
          : 'Proporciona un estado general de compliance empresarial';
        break;

      case 'run_scan':
        systemPrompt = `Eres un escáner de compliance empresarial con capacidades de IA.

CAPACIDADES:
- Escaneo profundo de políticas y procedimientos
- Detección de violaciones en tiempo real
- Análisis de brechas de cumplimiento
- Recomendaciones automáticas de remediación

FORMATO DE RESPUESTA (JSON estricto):
{
  "metrics": {
    "overallScore": 0-100,
    "scanDuration": "string",
    "rulesChecked": number,
    "violationsFound": number,
    "autoRemediations": number
  },
  "violations": [
    {
      "id": "uuid",
      "ruleId": "string",
      "ruleName": "string",
      "description": "string",
      "detectedAt": "ISO timestamp",
      "severity": "low" | "medium" | "high" | "critical",
      "status": "open",
      "suggestedAction": "string",
      "autoResolvable": boolean
    }
  ]
}`;
        userPrompt = `Ejecuta un escaneo ${context?.scanDepth || 'standard'} de compliance para: ${JSON.stringify(context)}`;
        break;

      case 'predict_risks':
        systemPrompt = `Eres un sistema predictivo de riesgos de compliance con machine learning.

CAPACIDADES:
- Predicción de riesgos futuros basada en patrones históricos
- Análisis de tendencias regulatorias
- Identificación de áreas de riesgo emergente

FORMATO DE RESPUESTA (JSON estricto):
{
  "predictions": [
    {
      "id": "uuid",
      "ruleCode": "string",
      "ruleName": "string",
      "probability": 0-100,
      "expectedDate": "ISO date",
      "impact": "low" | "medium" | "high" | "critical",
      "preventiveAction": "string"
    }
  ],
  "riskScore": 0-100,
  "timeHorizon": "30 días",
  "confidence": 0-100
}`;
        userPrompt = `Predice riesgos de compliance para: ${JSON.stringify(context)}`;
        break;

      case 'resolve_violation':
        systemPrompt = `Eres un sistema de remediación de violaciones de compliance.

CAPACIDADES:
- Análisis de causa raíz
- Generación de planes de remediación
- Documentación de resoluciones
- Verificación de correcciones

FORMATO DE RESPUESTA (JSON estricto):
{
  "resolved": boolean,
  "remediationSteps": ["string"],
  "documentation": "string",
  "verificationRequired": boolean,
  "followUpDate": "ISO date"
}`;
        userPrompt = `Resuelve la violación: ${JSON.stringify(params)}`;
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
      console.error(`[compliance-monitor] AI error: ${aiResult.error}`);
      
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
    console.log(`[compliance-monitor] Success: ${action} in ${duration}ms`);

    return createSecureResponse({
      success: true,
      action,
      data: aiResult.parsed || { rawContent: aiResult.content },
      requestId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[compliance-monitor] Error after ${duration}ms:`, error);
    
    return createSecureResponse({
      success: false,
      error: 'internal_error',
      message: error instanceof Error ? error.message : 'Error interno',
      requestId
    }, 500);
  }
});
