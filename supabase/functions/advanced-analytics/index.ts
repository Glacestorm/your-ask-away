import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsRequest {
  action: 'get_analytics' | 'run_query' | 'create_dashboard' | 'export_data';
  context?: Record<string, unknown>;
  query?: string;
  params?: Record<string, unknown>;
  dashboard?: Record<string, unknown>;
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

    const { action, context, query, params, dashboard, format } = await req.json() as AnalyticsRequest;

    console.log(`[advanced-analytics] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_analytics':
        systemPrompt = `Eres un sistema de analytics empresarial avanzado.

FORMATO DE RESPUESTA (JSON estricto):
{
  "metrics": [
    {
      "id": "uuid",
      "metric_name": "nombre",
      "metric_type": "counter|gauge|histogram|summary",
      "value": número,
      "dimensions": {},
      "timestamp": "ISO timestamp",
      "aggregation_period": "periodo"
    }
  ],
  "dashboards": [
    {
      "id": "uuid",
      "name": "nombre",
      "description": "descripción",
      "widgets": [],
      "filters": {},
      "refresh_interval": número,
      "created_at": "ISO timestamp"
    }
  ],
  "insights": [
    {
      "type": "trend|anomaly|correlation|prediction",
      "title": "título",
      "description": "descripción",
      "confidence": 0-100,
      "actionable": boolean
    }
  ]
}`;
        userPrompt = `Generar analytics para contexto: ${JSON.stringify(context || {})}`;
        break;

      case 'run_query':
        systemPrompt = `Eres un motor de consultas analytics.

FORMATO DE RESPUESTA (JSON estricto):
{
  "results": {
    "columns": ["columnas"],
    "rows": [["valores"]],
    "total_rows": número,
    "execution_time_ms": número
  },
  "summary": {
    "aggregations": {},
    "trends": []
  }
}`;
        userPrompt = `Ejecutar consulta: ${query} con parámetros: ${JSON.stringify(params || {})}`;
        break;

      case 'create_dashboard':
        systemPrompt = `Eres un diseñador de dashboards BI.

FORMATO DE RESPUESTA (JSON estricto):
{
  "dashboard": {
    "id": "uuid",
    "name": "nombre",
    "description": "descripción",
    "widgets": [
      {
        "id": "uuid",
        "type": "chart|table|metric|heatmap|funnel|cohort",
        "title": "título",
        "query": "consulta",
        "visualization_config": {},
        "position": {"x": 0, "y": 0, "w": 4, "h": 3}
      }
    ],
    "filters": {},
    "refresh_interval": 60,
    "created_at": "ISO timestamp"
  }
}`;
        userPrompt = `Crear dashboard: ${JSON.stringify(dashboard)}`;
        break;

      case 'export_data':
        systemPrompt = `Eres un exportador de datos analytics.

FORMATO DE RESPUESTA (JSON estricto):
{
  "downloadUrl": "url",
  "format": "${format}",
  "records_exported": número,
  "file_size_bytes": número,
  "expires_at": "ISO timestamp"
}`;
        userPrompt = `Exportar datos en formato ${format} para consulta: ${query}`;
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
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Rate limit exceeded' 
        }), {
          status: 429,
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
    } catch {
      result = { rawContent: content, parseError: true };
    }

    console.log(`[advanced-analytics] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[advanced-analytics] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
