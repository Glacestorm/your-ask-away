import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VisualizationRequest {
  action: 'get_chart_data' | 'generate_chart' | 'create_report' | 'export_chart' | 'recommend_visualization';
  config?: Record<string, unknown>;
  dataSource?: string;
  chartType?: string;
  options?: Record<string, unknown>;
  template?: Record<string, unknown>;
  chartId?: string;
  format?: string;
  dataProfile?: Record<string, unknown>;
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

    const { action, config, dataSource, chartType, options, template, chartId, format, dataProfile } = await req.json() as VisualizationRequest;

    console.log(`[data-visualization] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_chart_data':
        systemPrompt = `Eres un motor de visualización de datos.

FORMATO DE RESPUESTA (JSON estricto):
{
  "visualization": {
    "labels": ["etiquetas"],
    "datasets": [
      {
        "label": "serie",
        "data": [números],
        "backgroundColor": "color",
        "borderColor": "color"
      }
    ],
    "metadata": {
      "total_records": número,
      "date_range": {"start": "fecha", "end": "fecha"}
    }
  }
}`;
        userPrompt = `Generar datos para gráfico con config: ${JSON.stringify(config)}`;
        break;

      case 'generate_chart':
        systemPrompt = `Eres un generador de gráficos inteligente.

FORMATO DE RESPUESTA (JSON estricto):
{
  "chart": {
    "id": "uuid",
    "chart_type": "${chartType}",
    "title": "título",
    "data_source": "fuente",
    "x_axis": "eje_x",
    "y_axis": ["ejes_y"],
    "color_scheme": "esquema",
    "animations": true,
    "responsive": true,
    "legend_position": "top|bottom|left|right"
  }
}`;
        userPrompt = `Generar gráfico ${chartType} para fuente: ${dataSource} con opciones: ${JSON.stringify(options || {})}`;
        break;

      case 'create_report':
        systemPrompt = `Eres un generador de reportes BI.

FORMATO DE RESPUESTA (JSON estricto):
{
  "report": {
    "id": "uuid",
    "name": "nombre",
    "description": "descripción",
    "sections": [
      {
        "id": "uuid",
        "type": "chart|table|text|metric|image",
        "title": "título",
        "content": {},
        "order": número
      }
    ],
    "schedule": "cron",
    "recipients": ["emails"],
    "created_at": "ISO timestamp"
  }
}`;
        userPrompt = `Crear reporte: ${JSON.stringify(template)}`;
        break;

      case 'export_chart':
        systemPrompt = `Eres un exportador de gráficos.

FORMATO DE RESPUESTA (JSON estricto):
{
  "downloadUrl": "url",
  "format": "${format}",
  "dimensions": {"width": número, "height": número},
  "file_size_bytes": número,
  "expires_at": "ISO timestamp"
}`;
        userPrompt = `Exportar gráfico ${chartId} en formato ${format}`;
        break;

      case 'recommend_visualization':
        systemPrompt = `Eres un experto en visualización de datos.

FORMATO DE RESPUESTA (JSON estricto):
{
  "recommendations": [
    {
      "chart_type": "tipo",
      "reason": "razón",
      "confidence": 0-100,
      "best_for": "caso de uso",
      "config_suggestion": {}
    }
  ]
}`;
        userPrompt = `Recomendar visualización para datos: ${JSON.stringify(dataProfile)}`;
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

    console.log(`[data-visualization] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[data-visualization] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
