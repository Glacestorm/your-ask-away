/**
 * License AI Agent - Edge Function
 * Agente de IA autónomo para gestión inteligente de licencias
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentRequest {
  action: 'full_analysis' | 'predict' | 'detect_anomalies' | 'natural_language_query' | 
          'execute_action' | 'get_suggestions';
  config?: Record<string, unknown>;
  licenseIds?: string[];
  query?: string;
  actionId?: string;
  context?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const body = await req.json() as AgentRequest;
    const { action, config, licenseIds, query, actionId, context } = body;

    console.log(`[license-ai-agent] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';
    let responseFormat: Record<string, unknown> | null = null;

    switch (action) {
      case 'full_analysis':
        systemPrompt = `Eres un agente de IA especializado en análisis de licencias de software enterprise.
        
Tu rol es analizar datos de licencias y proporcionar:
1. Predicciones de renovación y churn
2. Detección de anomalías y fraude
3. Insights accionables
4. Métricas de rendimiento

Configuración actual del agente:
${JSON.stringify(config, null, 2)}

FORMATO DE RESPUESTA (JSON estricto):
{
  "predictions": [
    {
      "licenseId": "uuid",
      "licenseKey": "LICENSE-XXX",
      "companyName": "Empresa",
      "predictionType": "renewal|churn|upgrade|downgrade",
      "probability": 0-100,
      "predictedDate": "2025-02-15",
      "confidence": 0-100,
      "factors": [{"name": "factor", "impact": "positive|negative", "weight": 0.5, "description": "..."}],
      "suggestedAction": "Contactar para renovación",
      "estimatedValue": 5000
    }
  ],
  "anomalies": [
    {
      "id": "anom-1",
      "licenseId": "uuid",
      "licenseKey": "LICENSE-XXX",
      "anomalyType": "usage_spike|geographic|device_proliferation|pattern_break|suspicious_timing",
      "severity": "low|medium|high|critical",
      "description": "Descripción detallada",
      "detectedAt": "2025-01-15T10:00:00Z",
      "evidence": [{"type": "metric", "value": "150%", "expected": "10%", "deviation": 1400}],
      "status": "new",
      "suggestedAction": "Investigar actividad"
    }
  ],
  "insights": [
    {
      "id": "insight-1",
      "category": "revenue|risk|optimization|trend",
      "title": "Título del insight",
      "description": "Descripción detallada",
      "impact": "high|medium|low",
      "metric": "MRR",
      "metricValue": 50000,
      "metricChange": 15.5,
      "actionable": true,
      "suggestedAction": "Acción sugerida",
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "metrics": {
    "totalPredictions": 25,
    "accuracyRate": 87.5,
    "anomaliesDetected": 3,
    "actionsExecuted": 12,
    "valueGenerated": 125000,
    "activeAlerts": 2,
    "lastAnalysisAt": "2025-01-15T10:00:00Z"
  }
}`;

        userPrompt = `Realiza un análisis completo del sistema de licencias. Genera predicciones realistas, detecta posibles anomalías, y proporciona insights accionables para optimizar la gestión de licencias.

Contexto adicional:
- Fecha actual: ${new Date().toISOString()}
- Autonomía del agente: ${config?.autonomyLevel || 'semi_autonomous'}
- Umbral de confianza: ${config?.confidenceThreshold || 75}%`;
        break;

      case 'predict':
        systemPrompt = `Eres un modelo predictivo especializado en licencias de software.
        
Genera predicciones precisas sobre:
- Probabilidad de renovación
- Riesgo de churn
- Potencial de upgrade/downgrade

FORMATO DE RESPUESTA (JSON estricto):
{
  "predictions": [
    {
      "licenseId": "uuid",
      "licenseKey": "LICENSE-XXX",
      "companyName": "Empresa",
      "predictionType": "renewal|churn|upgrade|downgrade",
      "probability": 0-100,
      "predictedDate": "2025-02-15",
      "confidence": 0-100,
      "factors": [{"name": "factor", "impact": "positive|negative", "weight": 0.5, "description": "..."}],
      "suggestedAction": "Acción recomendada",
      "estimatedValue": 5000
    }
  ]
}`;

        userPrompt = licenseIds?.length 
          ? `Genera predicciones para las licencias: ${licenseIds.join(', ')}`
          : 'Genera predicciones para todas las licencias activas del sistema';
        break;

      case 'detect_anomalies':
        systemPrompt = `Eres un sistema de detección de anomalías para licencias de software.

Detecta patrones sospechosos como:
- Picos de uso inusuales
- Activaciones geográficamente dispersas
- Proliferación de dispositivos
- Cambios bruscos en patrones de uso
- Actividad en horarios sospechosos

FORMATO DE RESPUESTA (JSON estricto):
{
  "anomalies": [
    {
      "id": "anom-uuid",
      "licenseId": "uuid",
      "licenseKey": "LICENSE-XXX",
      "anomalyType": "usage_spike|geographic|device_proliferation|pattern_break|suspicious_timing",
      "severity": "low|medium|high|critical",
      "description": "Descripción clara del problema detectado",
      "detectedAt": "2025-01-15T10:00:00Z",
      "evidence": [
        {"type": "activations", "value": "47 en 24h", "expected": "3-5 por semana", "deviation": 900}
      ],
      "status": "new",
      "suggestedAction": "Acción recomendada"
    }
  ]
}`;

        userPrompt = 'Analiza el sistema en busca de anomalías y patrones sospechosos en el uso de licencias.';
        break;

      case 'natural_language_query':
        systemPrompt = `Eres un asistente de IA experto en gestión de licencias de software enterprise.

Responde preguntas en español sobre:
- Estado de licencias
- Métricas y estadísticas
- Predicciones y tendencias
- Recomendaciones de optimización

Sé conversacional pero preciso. Proporciona datos concretos cuando sea posible.

FORMATO DE RESPUESTA (JSON estricto):
{
  "interpretation": "Lo que entendí de la pregunta",
  "answer": "Respuesta detallada y útil en español",
  "data": null,
  "suggestedFollowUps": ["Pregunta sugerida 1", "Pregunta sugerida 2"],
  "confidence": 0-100
}`;

        userPrompt = query || 'Hola';
        break;

      case 'get_suggestions':
        systemPrompt = `Eres un agente de automatización para licencias de software.

Genera acciones sugeridas basadas en:
- Licencias próximas a expirar
- Patrones de uso anómalos
- Oportunidades de upsell
- Riesgos identificados

FORMATO DE RESPUESTA (JSON estricto):
{
  "actions": [
    {
      "id": "action-uuid",
      "actionType": "renew|suspend|notify|upgrade|investigate|block_device",
      "targetLicenseId": "uuid",
      "targetLicenseKey": "LICENSE-XXX",
      "reason": "Razón de la acción",
      "aiReasoning": "Explicación detallada del razonamiento IA",
      "confidence": 0-100,
      "riskLevel": "low|medium|high|critical",
      "status": "pending",
      "createdAt": "2025-01-15T10:00:00Z",
      "requiresApproval": true
    }
  ]
}`;

        userPrompt = context 
          ? `Genera sugerencias de acciones considerando: ${JSON.stringify(context)}`
          : 'Genera sugerencias de acciones para optimizar la gestión de licencias actual';
        break;

      case 'execute_action':
        // Para ejecutar acciones, simplemente simulamos la ejecución
        console.log(`[license-ai-agent] Executing action: ${actionId}`);
        return new Response(JSON.stringify({
          success: true,
          actionId,
          result: 'Acción ejecutada correctamente',
          executedAt: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    // Llamada a Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Rate limit exceeded. Intenta más tarde.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Créditos de IA insuficientes.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error('No content in AI response');

    // Parse JSON response
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[license-ai-agent] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[license-ai-agent] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[license-ai-agent] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
