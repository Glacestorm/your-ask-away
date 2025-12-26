import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmartAnalyticsRequest {
  action: 'initialize' | 'natural_language_query' | 'detect_anomalies' | 'generate_predictions' | 'discover_patterns' | 'find_correlations' | 'generate_insights' | 'export';
  context?: Record<string, unknown>;
  query?: string;
  metricIds?: string[];
  metricId?: string;
  horizon?: string;
  metrics?: unknown[];
  patterns?: unknown[];
  format?: string;
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

    const { action, context, query, metricIds, horizon, metrics } = await req.json() as SmartAnalyticsRequest;

    console.log(`[smart-analytics] Processing action: ${action}`);

    switch (action) {
      case 'initialize':
        return new Response(JSON.stringify({
          success: true,
          metrics: [
            { id: 'revenue', name: 'Ingresos', category: 'financial', value: 125000, previousValue: 118000, change: 7000, changePercent: 5.9, trend: 'up' },
            { id: 'customers', name: 'Clientes Activos', category: 'customer', value: 1250, previousValue: 1180, change: 70, changePercent: 5.9, trend: 'up' },
            { id: 'churn', name: 'Tasa de Abandono', category: 'customer', value: 2.3, previousValue: 2.8, change: -0.5, changePercent: -17.8, trend: 'down' },
            { id: 'nps', name: 'NPS', category: 'satisfaction', value: 72, previousValue: 68, change: 4, changePercent: 5.9, trend: 'up' },
            { id: 'conversion', name: 'Conversión', category: 'sales', value: 18.5, previousValue: 16.2, change: 2.3, changePercent: 14.2, trend: 'up' }
          ],
          insights: [
            { id: 'insight-1', type: 'trend', title: 'Crecimiento sostenido', description: 'Los ingresos muestran tendencia positiva los últimos 3 meses', severity: 'success', confidence: 0.92, relatedMetrics: ['revenue'], generatedAt: new Date().toISOString() },
            { id: 'insight-2', type: 'anomaly', title: 'Pico de conversiones', description: 'Conversión 14% superior al promedio histórico', severity: 'info', confidence: 0.88, relatedMetrics: ['conversion'], generatedAt: new Date().toISOString() }
          ],
          patterns: [
            { id: 'pattern-1', patternType: 'seasonal', description: 'Incremento de ventas en Q4', startDate: '2024-10-01', affectedMetrics: ['revenue', 'conversion'], magnitude: 0.15 }
          ]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'natural_language_query':
        const nlqSystemPrompt = `Eres un analista de datos que traduce consultas en lenguaje natural a análisis.

CONSULTA: ${query}
CONTEXTO: ${JSON.stringify(context || {})}

Genera una respuesta analítica.

FORMATO DE RESPUESTA (JSON):
{
  "translatedQuery": "SELECT...",
  "results": [{"label": "string", "value": number}],
  "visualizationType": "table|chart|kpi|map",
  "explanation": "string"
}`;

        const nlqResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: nlqSystemPrompt },
              { role: 'user', content: query || '' }
            ],
            temperature: 0.5,
            max_tokens: 1500,
          }),
        });

        if (!nlqResponse.ok) {
          throw new Error(`AI API error: ${nlqResponse.status}`);
        }

        const nlqData = await nlqResponse.json();
        const nlqContent = nlqData.choices?.[0]?.message?.content;

        let nlqResult;
        try {
          const jsonMatch = nlqContent?.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            nlqResult = JSON.parse(jsonMatch[0]);
          } else {
            nlqResult = { results: [], visualizationType: 'table', explanation: nlqContent };
          }
        } catch {
          nlqResult = { results: [], visualizationType: 'table', explanation: nlqContent };
        }

        return new Response(JSON.stringify({
          success: true,
          ...nlqResult
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'detect_anomalies':
        return new Response(JSON.stringify({
          success: true,
          anomalies: (metricIds || []).map(id => ({
            id,
            anomalyScore: Math.random() * 0.3,
            isAnomaly: Math.random() > 0.7
          }))
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'generate_predictions':
        return new Response(JSON.stringify({
          success: true,
          predictions: (metricIds || []).map(id => ({
            metricId: id,
            prediction: {
              nextValue: Math.random() * 100000,
              confidence: 0.75 + Math.random() * 0.2,
              horizon: horizon || 'month'
            }
          }))
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'discover_patterns':
        return new Response(JSON.stringify({
          success: true,
          patterns: [
            { id: 'p1', patternType: 'seasonal', description: 'Patrón estacional trimestral', startDate: '2024-01-01', affectedMetrics: ['revenue'], magnitude: 0.12 },
            { id: 'p2', patternType: 'trend', description: 'Tendencia alcista sostenida', startDate: '2024-06-01', affectedMetrics: ['customers', 'nps'], magnitude: 0.08 }
          ]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'generate_insights':
        const insightsPrompt = `Eres un analista de negocio experto.

MÉTRICAS: ${JSON.stringify(metrics || [])}
CONTEXTO: ${JSON.stringify(context || {})}

Genera 3-5 insights de negocio basados en las métricas.

FORMATO DE RESPUESTA (JSON):
{
  "insights": [
    {
      "id": "uuid",
      "type": "trend|anomaly|correlation|forecast|recommendation",
      "title": "string",
      "description": "string",
      "severity": "info|warning|critical|success",
      "confidence": 0.85,
      "relatedMetrics": ["string"],
      "suggestedActions": ["string"]
    }
  ]
}`;

        const insightsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: insightsPrompt },
              { role: 'user', content: 'Genera insights' }
            ],
            temperature: 0.7,
            max_tokens: 1500,
          }),
        });

        if (!insightsResponse.ok) {
          throw new Error(`AI API error: ${insightsResponse.status}`);
        }

        const insightsData = await insightsResponse.json();
        const insightsContent = insightsData.choices?.[0]?.message?.content;

        let insightsResult;
        try {
          const jsonMatch = insightsContent?.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            insightsResult = JSON.parse(jsonMatch[0]);
          } else {
            insightsResult = { insights: [] };
          }
        } catch {
          insightsResult = { insights: [] };
        }

        return new Response(JSON.stringify({
          success: true,
          ...insightsResult
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        return new Response(JSON.stringify({
          success: true,
          message: 'Action processed'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('[smart-analytics] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
