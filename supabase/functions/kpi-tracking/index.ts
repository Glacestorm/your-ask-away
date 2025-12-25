import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KPIRequest {
  action: 'get_kpis' | 'create_kpi' | 'update_value' | 'set_goal' | 'create_alert' | 'get_history';
  context?: Record<string, unknown>;
  kpi?: Record<string, unknown>;
  kpiId?: string;
  value?: number;
  goal?: Record<string, unknown>;
  alert?: Record<string, unknown>;
  timeRange?: string;
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

    const { action, context, kpi, kpiId, value, goal, alert, timeRange } = await req.json() as KPIRequest;

    console.log(`[kpi-tracking] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_kpis':
        systemPrompt = `Eres un sistema de tracking de KPIs empresariales.

FORMATO DE RESPUESTA (JSON estricto):
{
  "kpis": [
    {
      "id": "uuid",
      "name": "nombre",
      "description": "descripción",
      "category": "categoría",
      "current_value": número,
      "target_value": número,
      "previous_value": número,
      "unit": "unidad",
      "trend": "up|down|stable",
      "trend_percentage": número,
      "status": "on_track|at_risk|off_track|exceeded",
      "last_updated": "ISO timestamp",
      "sparkline_data": [números]
    }
  ],
  "goals": [
    {
      "id": "uuid",
      "kpi_id": "uuid",
      "target_value": número,
      "target_date": "fecha",
      "status": "active|achieved|missed|cancelled"
    }
  ],
  "alerts": [
    {
      "id": "uuid",
      "kpi_id": "uuid",
      "alert_type": "threshold|trend|anomaly",
      "is_active": boolean
    }
  ]
}`;
        userPrompt = `Obtener KPIs para contexto: ${JSON.stringify(context || {})}`;
        break;

      case 'create_kpi':
        systemPrompt = `Eres un gestor de KPIs.

FORMATO DE RESPUESTA (JSON estricto):
{
  "kpi": {
    "id": "uuid",
    "name": "nombre",
    "description": "descripción",
    "category": "categoría",
    "current_value": 0,
    "target_value": número,
    "unit": "unidad",
    "trend": "stable",
    "status": "on_track",
    "created_at": "ISO timestamp"
  }
}`;
        userPrompt = `Crear KPI: ${JSON.stringify(kpi)}`;
        break;

      case 'update_value':
        systemPrompt = `Eres un actualizador de valores KPI.

FORMATO DE RESPUESTA (JSON estricto):
{
  "updated": true,
  "kpi_id": "${kpiId}",
  "new_value": ${value},
  "previous_value": número,
  "change_percentage": número,
  "new_status": "status",
  "updated_at": "ISO timestamp"
}`;
        userPrompt = `Actualizar KPI ${kpiId} con valor ${value}`;
        break;

      case 'set_goal':
        systemPrompt = `Eres un gestor de metas KPI.

FORMATO DE RESPUESTA (JSON estricto):
{
  "goal": {
    "id": "uuid",
    "kpi_id": "uuid",
    "target_value": número,
    "target_date": "fecha",
    "milestone_values": [{"date": "fecha", "value": número}],
    "status": "active",
    "created_at": "ISO timestamp"
  }
}`;
        userPrompt = `Establecer meta: ${JSON.stringify(goal)}`;
        break;

      case 'create_alert':
        systemPrompt = `Eres un gestor de alertas KPI.

FORMATO DE RESPUESTA (JSON estricto):
{
  "alert": {
    "id": "uuid",
    "kpi_id": "uuid",
    "alert_type": "threshold|trend|anomaly",
    "condition": "condición",
    "threshold_value": número,
    "is_active": true,
    "created_at": "ISO timestamp"
  }
}`;
        userPrompt = `Crear alerta: ${JSON.stringify(alert)}`;
        break;

      case 'get_history':
        systemPrompt = `Eres un analizador de histórico KPI.

FORMATO DE RESPUESTA (JSON estricto):
{
  "history": {
    "kpi_id": "${kpiId}",
    "time_range": "${timeRange}",
    "data_points": [
      {"timestamp": "ISO timestamp", "value": número}
    ],
    "statistics": {
      "min": número,
      "max": número,
      "avg": número,
      "std_dev": número
    },
    "trends": []
  }
}`;
        userPrompt = `Obtener histórico de KPI ${kpiId} para rango ${timeRange}`;
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

    console.log(`[kpi-tracking] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[kpi-tracking] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
