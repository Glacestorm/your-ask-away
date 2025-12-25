import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportingRequest {
  action: 'generate_report' | 'analyze_trends' | 'create_dashboard' | 'executive_summary' | 'forecast';
  context?: {
    reportType?: string;
    metrics?: string[];
    timeRange?: { start: string; end: string };
    dimensions?: string[];
    filters?: Record<string, unknown>;
  };
  data?: unknown;
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

    const { action, context, data } = await req.json() as ReportingRequest;
    console.log(`[advanced-reporting-ia] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'generate_report':
        systemPrompt = `Eres un generador de informes empresariales avanzados.

GENERA un informe completo con datos simulados realistas.

RESPONDE EN JSON ESTRICTO:
{
  "report": {
    "title": string,
    "generatedAt": string,
    "period": string,
    "sections": [
      {
        "title": string,
        "content": string,
        "data": object,
        "visualizationType": string,
        "insights": string[]
      }
    ],
    "kpis": [
      { "name": string, "value": number, "change": number, "trend": string }
    ],
    "recommendations": string[],
    "nextSteps": string[]
  }
}`;
        userPrompt = `Genera informe de tipo: ${context?.reportType}
Métricas: ${context?.metrics?.join(', ')}
Período: ${context?.timeRange?.start} a ${context?.timeRange?.end}
Dimensiones: ${context?.dimensions?.join(', ')}`;
        break;

      case 'analyze_trends':
        systemPrompt = `Eres un analista de tendencias empresariales.

ANALIZA tendencias en los datos proporcionados.

RESPONDE EN JSON ESTRICTO:
{
  "trendAnalysis": {
    "overallTrend": "upward" | "downward" | "stable" | "volatile",
    "metrics": [
      {
        "name": string,
        "trend": string,
        "changeRate": number,
        "forecast": number,
        "confidence": number
      }
    ],
    "seasonality": string[],
    "anomalies": [{ "date": string, "metric": string, "description": string }],
    "correlations": [{ "metrics": string[], "strength": number }]
  },
  "insights": string[],
  "actionRecommendations": string[]
}`;
        userPrompt = `Analiza tendencias para métricas: ${context?.metrics?.join(', ')}
Período: ${context?.timeRange?.start} a ${context?.timeRange?.end}`;
        break;

      case 'create_dashboard':
        systemPrompt = `Eres un diseñador de dashboards empresariales.

DISEÑA un dashboard óptimo.

RESPONDE EN JSON ESTRICTO:
{
  "dashboard": {
    "title": string,
    "layout": "grid" | "rows" | "mixed",
    "widgets": [
      {
        "id": string,
        "type": "metric" | "chart" | "table" | "map" | "progress",
        "title": string,
        "position": { "row": number, "col": number, "width": number, "height": number },
        "config": object,
        "dataSource": string
      }
    ],
    "filters": [{ "name": string, "type": string, "options": string[] }],
    "refreshInterval": number
  },
  "bestPractices": string[]
}`;
        userPrompt = `Diseña dashboard para: ${context?.reportType}
Métricas clave: ${context?.metrics?.join(', ')}
Dimensiones: ${context?.dimensions?.join(', ')}`;
        break;

      case 'executive_summary':
        systemPrompt = `Eres un generador de resúmenes ejecutivos.

GENERA un resumen ejecutivo conciso pero completo.

RESPONDE EN JSON ESTRICTO:
{
  "executiveSummary": {
    "headline": string,
    "keyHighlights": string[],
    "performanceSnapshot": {
      "overallScore": number,
      "status": "exceeding" | "on_track" | "at_risk" | "behind"
    },
    "topWins": string[],
    "concerns": string[],
    "strategicRecommendations": string[],
    "outlook": string
  }
}`;
        userPrompt = `Genera resumen ejecutivo para período: ${context?.timeRange?.start} a ${context?.timeRange?.end}
Datos: ${JSON.stringify(data || {})}`;
        break;

      case 'forecast':
        systemPrompt = `Eres un sistema de forecasting empresarial.

GENERA pronósticos basados en datos históricos.

RESPONDE EN JSON ESTRICTO:
{
  "forecasts": [
    {
      "metric": string,
      "currentValue": number,
      "forecast30Days": number,
      "forecast90Days": number,
      "forecast365Days": number,
      "confidence": number,
      "drivers": string[]
    }
  ],
  "scenarios": [
    { "name": string, "probability": number, "outcome": object }
  ],
  "assumptions": string[],
  "risks": string[]
}`;
        userPrompt = `Genera forecast para métricas: ${context?.metrics?.join(', ')}`;
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
        temperature: 0.6,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch {
      result = { rawContent: content, parseError: true };
    }

    console.log(`[advanced-reporting-ia] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[advanced-reporting-ia] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
