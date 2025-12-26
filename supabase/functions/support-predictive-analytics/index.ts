import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PredictiveRequest {
  action: 'predict_load' | 'analyze_trends' | 'forecast_resolution' | 'detect_anomalies' | 'recommend_resources';
  context?: {
    daysRange?: number;
    sessionData?: any[];
    actionData?: any[];
    technicianStats?: any[];
  };
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

    const { action, context } = await req.json() as PredictiveRequest;

    console.log(`[support-predictive-analytics] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'predict_load':
        systemPrompt = `Eres un sistema de predicción de carga de trabajo para soporte técnico remoto.
        
CONTEXTO:
- Analizas patrones históricos de sesiones de soporte
- Predices volumen de sesiones para próximas horas/días
- Identificas patrones estacionales (día de semana, hora, mes)

RESPUESTA JSON ESTRICTO:
{
  "predictions": [
    {
      "period": "today",
      "expectedSessions": number,
      "confidence": 0-100,
      "peakHours": ["HH:00", ...],
      "reasoning": "string"
    }
  ],
  "weekForecast": [
    { "day": "lunes", "predicted": number, "range": [min, max] }
  ],
  "seasonalPatterns": {
    "highDemandDays": ["string"],
    "lowDemandDays": ["string"],
    "peakHours": ["HH:00"]
  },
  "staffingRecommendation": {
    "minimumTechnicians": number,
    "optimalTechnicians": number,
    "reason": "string"
  }
}`;
        userPrompt = `Analiza estos datos históricos y predice la carga de trabajo:
${JSON.stringify(context, null, 2)}`;
        break;

      case 'analyze_trends':
        systemPrompt = `Eres un analista de tendencias para sistemas de soporte técnico.

CAPACIDADES:
- Identificas tendencias ascendentes/descendentes
- Detectas cambios en patrones de uso
- Analizas correlaciones entre variables

RESPUESTA JSON ESTRICTO:
{
  "overallTrend": "ascending" | "descending" | "stable",
  "trendStrength": 0-100,
  "keyInsights": [
    {
      "metric": "string",
      "trend": "up" | "down" | "stable",
      "changePercent": number,
      "significance": "high" | "medium" | "low",
      "insight": "string"
    }
  ],
  "correlations": [
    {
      "variable1": "string",
      "variable2": "string",
      "correlation": -1 to 1,
      "interpretation": "string"
    }
  ],
  "projections": {
    "nextWeek": { "sessions": number, "avgDuration": number },
    "nextMonth": { "sessions": number, "avgDuration": number }
  },
  "recommendations": ["string"]
}`;
        userPrompt = `Analiza tendencias en estos datos de soporte:
${JSON.stringify(context, null, 2)}`;
        break;

      case 'forecast_resolution':
        systemPrompt = `Eres un predictor de tiempos de resolución para soporte técnico.

CAPACIDADES:
- Estimas tiempo de resolución basado en tipo de problema
- Consideras complejidad y recursos disponibles
- Aprendes de resoluciones históricas

RESPUESTA JSON ESTRICTO:
{
  "estimatedResolutionTime": {
    "minutes": number,
    "confidence": 0-100,
    "range": { "min": number, "max": number }
  },
  "complexityScore": 0-100,
  "factorsAffectingTime": [
    {
      "factor": "string",
      "impact": "positive" | "negative",
      "weight": 0-100
    }
  ],
  "similarCases": {
    "count": number,
    "avgResolutionTime": number,
    "successRate": number
  },
  "recommendations": [
    {
      "action": "string",
      "potentialTimeSaving": number,
      "priority": "high" | "medium" | "low"
    }
  ]
}`;
        userPrompt = `Predice tiempo de resolución para:
${JSON.stringify(context, null, 2)}`;
        break;

      case 'detect_anomalies':
        systemPrompt = `Eres un detector de anomalías en sistemas de soporte técnico.

CAPACIDADES:
- Detectas patrones inusuales en métricas
- Identificas outliers en tiempos de resolución
- Alertas sobre desviaciones significativas

RESPUESTA JSON ESTRICTO:
{
  "anomalies": [
    {
      "id": "string",
      "type": "spike" | "drop" | "pattern_break" | "outlier",
      "metric": "string",
      "severity": "critical" | "warning" | "info",
      "value": number,
      "expectedValue": number,
      "deviation": number,
      "timestamp": "ISO date",
      "description": "string",
      "possibleCauses": ["string"],
      "recommendedActions": ["string"]
    }
  ],
  "overallHealthScore": 0-100,
  "alertsCount": {
    "critical": number,
    "warning": number,
    "info": number
  },
  "trendAnalysis": {
    "isNormal": boolean,
    "deviationFromNormal": number,
    "explanation": "string"
  }
}`;
        userPrompt = `Detecta anomalías en estos datos:
${JSON.stringify(context, null, 2)}`;
        break;

      case 'recommend_resources':
        systemPrompt = `Eres un optimizador de recursos para equipos de soporte técnico.

CAPACIDADES:
- Recomiendas asignación óptima de técnicos
- Identificas necesidades de capacitación
- Optimizas distribución de carga de trabajo

RESPUESTA JSON ESTRICTO:
{
  "resourceOptimization": {
    "currentUtilization": number,
    "optimalUtilization": number,
    "gap": number
  },
  "technicianRecommendations": [
    {
      "technicianId": "string",
      "currentLoad": number,
      "recommendedLoad": number,
      "skills": ["string"],
      "trainingNeeds": ["string"],
      "efficiencyScore": number
    }
  ],
  "schedulingRecommendations": [
    {
      "timeSlot": "string",
      "currentCoverage": number,
      "recommendedCoverage": number,
      "priority": "high" | "medium" | "low"
    }
  ],
  "skillGaps": [
    {
      "skill": "string",
      "currentCoverage": number,
      "requiredCoverage": number,
      "trainingPriority": "high" | "medium" | "low"
    }
  ],
  "costOptimization": {
    "currentCost": number,
    "projectedSavings": number,
    "recommendations": ["string"]
  }
}`;
        userPrompt = `Recomienda optimización de recursos basado en:
${JSON.stringify(context, null, 2)}`;
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
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded', 
          message: 'Demasiadas solicitudes. Intenta más tarde.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
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
      console.error('[support-predictive-analytics] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[support-predictive-analytics] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[support-predictive-analytics] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
