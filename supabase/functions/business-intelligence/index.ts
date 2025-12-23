import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  SECURITY_HEADERS, 
  handleOptionsRequest, 
  createSecureResponse,
  checkRateLimit,
  validatePayloadSize
} from '../_shared/owasp-security.ts';
import { secureAICall, getClientIP, generateRequestId } from '../_shared/edge-function-template.ts';

interface BIRequest {
  action: 'get_analytics' | 'generate_insights' | 'get_predictions' | 'analyze_correlations' | 'ask_question' | 'generate_report' | 'export_data';
  context?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

serve(async (req) => {
  const requestId = generateRequestId();
  const clientIp = getClientIP(req);
  const startTime = Date.now();

  console.log(`[business-intelligence] Request ${requestId} from ${clientIp}`);

  // === CORS ===
  if (req.method === 'OPTIONS') {
    return handleOptionsRequest();
  }

  try {
    // === Rate Limiting ===
    const rateCheck = checkRateLimit({
      maxRequests: 80,
      windowMs: 60000,
      identifier: `business-intelligence:${clientIp}`,
    });

    if (!rateCheck.allowed) {
      console.warn(`[business-intelligence] Rate limit exceeded: ${clientIp}`);
      return createSecureResponse({ 
        success: false,
        error: 'rate_limit_exceeded', 
        message: 'Demasiadas solicitudes. Intenta más tarde.',
        retryAfter: Math.ceil(rateCheck.resetIn / 1000)
      }, 429);
    }

    // === Parse & Validate Body ===
    let body: BIRequest;
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
      case 'get_analytics':
        systemPrompt = `Eres un sistema de Business Intelligence avanzado con capacidades de IA.

CONTEXTO DEL ROL:
- Analytics en tiempo real con predicciones
- KPIs empresariales con tendencias
- Insights generados por IA
- Detección de anomalías y oportunidades

FORMATO DE RESPUESTA (JSON estricto):
{
  "kpis": [
    {
      "id": "uuid",
      "name": "string",
      "value": number,
      "previousValue": number,
      "change": number,
      "changePercentage": number,
      "trend": "up" | "down" | "stable",
      "target": number,
      "targetProgress": number,
      "unit": "string",
      "category": "string",
      "forecast": number
    }
  ],
  "insights": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "type": "opportunity" | "risk" | "trend" | "anomaly" | "recommendation",
      "severity": "low" | "medium" | "high" | "critical",
      "confidence": 0-100,
      "impact": "string",
      "suggestedActions": ["string"],
      "relatedKPIs": ["string"],
      "timestamp": "ISO timestamp"
    }
  ],
  "predictions": [],
  "correlations": []
}`;
        userPrompt = `Genera analytics para el período: ${context?.timeRange || '30d'}. Incluir: ${context?.includeInsights ? 'insights' : ''} ${context?.includePredictions ? 'predicciones' : ''}`;
        break;

      case 'generate_insights':
        systemPrompt = `Eres un analista de business intelligence experto en generar insights accionables.

CAPACIDADES:
- Análisis profundo de datos empresariales
- Identificación de patrones y tendencias
- Detección de oportunidades y riesgos
- Recomendaciones basadas en datos

FORMATO DE RESPUESTA (JSON estricto):
{
  "insights": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "type": "opportunity" | "risk" | "trend" | "anomaly" | "recommendation",
      "severity": "low" | "medium" | "high" | "critical",
      "confidence": 0-100,
      "impact": "string",
      "suggestedActions": ["string"],
      "relatedKPIs": ["string"],
      "timestamp": "ISO timestamp"
    }
  ],
  "summary": "string"
}`;
        userPrompt = `Genera insights de negocio para: ${JSON.stringify(context)}`;
        break;

      case 'get_predictions':
        systemPrompt = `Eres un sistema de predicción empresarial con machine learning.

FORMATO DE RESPUESTA (JSON estricto):
{
  "predictions": [
    {
      "id": "uuid",
      "metric": "string",
      "currentValue": number,
      "predictedValue": number,
      "confidence": 0-100,
      "horizon": "string",
      "factors": [{"name": "string", "impact": number, "direction": "string"}],
      "scenarios": [{"name": "string", "probability": number, "value": number, "description": "string"}]
    }
  ]
}`;
        userPrompt = `Predice las métricas: ${JSON.stringify(params?.metrics)} para horizonte: ${params?.horizon || '30d'}`;
        break;

      case 'analyze_correlations':
        systemPrompt = `Eres un analista estadístico de correlaciones empresariales.

FORMATO DE RESPUESTA (JSON estricto):
{
  "correlations": [
    {
      "metric1": "string",
      "metric2": "string",
      "correlation": number,
      "significance": number,
      "description": "string"
    }
  ],
  "strongestCorrelation": {"metrics": ["string", "string"], "value": number},
  "recommendations": ["string"]
}`;
        userPrompt = `Analiza correlaciones entre: ${JSON.stringify(params?.metrics)}`;
        break;

      case 'ask_question':
        systemPrompt = `Eres un asistente de business intelligence que responde preguntas sobre datos empresariales.

CAPACIDADES:
- Interpretar preguntas en lenguaje natural
- Analizar datos y proporcionar respuestas precisas
- Generar visualizaciones recomendadas
- Sugerir preguntas de seguimiento

FORMATO DE RESPUESTA (JSON estricto):
{
  "answer": "string",
  "data": {},
  "visualizationSuggestion": {"type": "string", "config": {}},
  "followUpQuestions": ["string"],
  "confidence": 0-100,
  "sources": ["string"]
}`;
        userPrompt = `Responde: "${params?.question}". Contexto: ${JSON.stringify(params?.context)}`;
        break;

      case 'generate_report':
        systemPrompt = `Eres un generador de reportes ejecutivos de business intelligence.

FORMATO DE RESPUESTA (JSON estricto):
{
  "report": {
    "title": "string",
    "type": "executive" | "operational" | "financial" | "custom",
    "generatedAt": "ISO timestamp",
    "sections": [
      {
        "title": "string",
        "content": "string",
        "metrics": [],
        "insights": [],
        "charts": []
      }
    ],
    "summary": "string",
    "recommendations": ["string"]
  }
}`;
        userPrompt = `Genera un reporte ${params?.type || 'executive'} con métricas: ${JSON.stringify(params?.metrics)}`;
        break;

      case 'export_data':
        systemPrompt = `Eres un exportador de datos de business intelligence.

FORMATO DE RESPUESTA (JSON estricto):
{
  "exportId": "uuid",
  "format": "csv" | "json" | "excel",
  "dataType": "string",
  "recordCount": number,
  "downloadUrl": "string",
  "expiresAt": "ISO timestamp"
}`;
        userPrompt = `Exporta ${params?.dataType} en formato ${params?.format}`;
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
      console.error(`[business-intelligence] AI error: ${aiResult.error}`);
      
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
    console.log(`[business-intelligence] Success: ${action} in ${duration}ms`);

    return createSecureResponse({
      success: true,
      action,
      data: aiResult.parsed || { rawContent: aiResult.content },
      requestId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[business-intelligence] Error after ${duration}ms:`, error);
    
    return createSecureResponse({
      success: false,
      error: 'internal_error',
      message: error instanceof Error ? error.message : 'Error interno',
      requestId
    }, 500);
  }
});
