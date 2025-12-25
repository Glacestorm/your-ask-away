import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RealtimeRequest {
  action: 'connect' | 'get_metrics' | 'create_stream' | 'set_alert' | 'get_historical';
  streamIds?: string[];
  stream?: Record<string, unknown>;
  alert?: Record<string, unknown>;
  metricId?: string;
  startTime?: string;
  endTime?: string;
  granularity?: string;
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

    const { action, streamIds, stream, alert, metricId, startTime, endTime, granularity } = await req.json() as RealtimeRequest;

    console.log(`[realtime-metrics] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'connect':
        systemPrompt = `Eres un gestor de streams de métricas en tiempo real.

FORMATO DE RESPUESTA (JSON estricto):
{
  "streams": [
    {
      "id": "uuid",
      "name": "nombre",
      "metrics": ["métricas"],
      "aggregation": "sum|avg|min|max|count",
      "window_seconds": número,
      "is_active": true
    }
  ],
  "connection_id": "uuid",
  "websocket_url": "url"
}`;
        userPrompt = `Conectar a streams: ${JSON.stringify(streamIds || [])}`;
        break;

      case 'get_metrics':
        systemPrompt = `Eres un proveedor de métricas en tiempo real.

FORMATO DE RESPUESTA (JSON estricto):
{
  "metrics": [
    {
      "id": "uuid",
      "metric_name": "nombre",
      "current_value": número,
      "previous_value": número,
      "change_rate": número,
      "unit": "unidad",
      "updated_at": "ISO timestamp",
      "source": "fuente"
    }
  ],
  "alerts": [
    {
      "id": "uuid",
      "metric_id": "uuid",
      "condition": "above|below|equals|change_rate",
      "threshold": número,
      "severity": "info|warning|critical",
      "triggered": boolean,
      "triggered_at": "ISO timestamp o null"
    }
  ]
}`;
        userPrompt = 'Obtener métricas actuales en tiempo real';
        break;

      case 'create_stream':
        systemPrompt = `Eres un creador de streams de métricas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "stream": {
    "id": "uuid",
    "name": "nombre",
    "metrics": ["métricas"],
    "aggregation": "sum|avg|min|max|count",
    "window_seconds": número,
    "is_active": true,
    "created_at": "ISO timestamp"
  }
}`;
        userPrompt = `Crear stream: ${JSON.stringify(stream)}`;
        break;

      case 'set_alert':
        systemPrompt = `Eres un gestor de alertas de métricas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "alert": {
    "id": "uuid",
    "metric_id": "uuid",
    "condition": "above|below|equals|change_rate",
    "threshold": número,
    "severity": "info|warning|critical",
    "is_active": true,
    "notification_channels": ["canales"],
    "created_at": "ISO timestamp"
  }
}`;
        userPrompt = `Configurar alerta: ${JSON.stringify(alert)}`;
        break;

      case 'get_historical':
        systemPrompt = `Eres un analizador de histórico de métricas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "history": {
    "metric_id": "${metricId}",
    "start_time": "${startTime}",
    "end_time": "${endTime}",
    "granularity": "${granularity}",
    "data_points": [
      {"timestamp": "ISO timestamp", "value": número}
    ],
    "statistics": {
      "min": número,
      "max": número,
      "avg": número,
      "percentile_95": número,
      "percentile_99": número
    }
  }
}`;
        userPrompt = `Obtener histórico de métrica ${metricId} desde ${startTime} hasta ${endTime} con granularidad ${granularity}`;
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

    console.log(`[realtime-metrics] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[realtime-metrics] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
