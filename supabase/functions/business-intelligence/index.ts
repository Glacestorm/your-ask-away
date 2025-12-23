import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BIRequest {
  action: 'get_analytics' | 'generate_insights' | 'get_predictions' | 'analyze_correlations' | 'ask_question' | 'generate_report' | 'export_data';
  context?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { action, context, params } = await req.json() as BIRequest;
    console.log(`[business-intelligence] Processing action: ${action}`);

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
  "predictions": [
    {
      "id": "uuid",
      "metric": "string",
      "currentValue": number,
      "predictedValue": number,
      "confidence": 0-100,
      "horizon": "string",
      "factors": [{"name": "string", "impact": number, "direction": "positive" | "negative" | "neutral"}],
      "scenarios": [{"name": "string", "probability": number, "value": number, "description": "string"}]
    }
  ],
  "correlations": [
    {
      "metric1": "string",
      "metric2": "string",
      "correlation": -1 to 1,
      "significance": 0-100,
      "description": "string"
    }
  ]
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
        throw new Error(`Acción no soportada: ${action}`);
    }

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
          error: 'Rate limit exceeded', 
          message: 'Demasiadas solicitudes. Intenta más tarde.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Payment required', 
          message: 'Créditos de IA insuficientes.' 
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

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('[business-intelligence] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[business-intelligence] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[business-intelligence] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
