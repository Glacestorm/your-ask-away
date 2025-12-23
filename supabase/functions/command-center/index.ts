import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CommandCenterRequest {
  action: 'get_dashboard' | 'acknowledge_alert' | 'escalate_alert' | 'get_metric_details' | 'execute_command';
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

    const { action, context, params } = await req.json() as CommandCenterRequest;
    console.log(`[command-center] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_dashboard':
        systemPrompt = `Eres el Centro de Comando Unificado para operaciones empresariales.

CONTEXTO DEL ROL:
- Dashboard ejecutivo en tiempo real
- Monitoreo de métricas críticas de negocio
- Gestión de alertas inteligentes
- Visibilidad de actividad del sistema

FORMATO DE RESPUESTA (JSON estricto):
{
  "metrics": [
    {
      "id": "uuid",
      "name": "string",
      "value": number,
      "unit": "string",
      "trend": "up" | "down" | "stable",
      "trendPercentage": number,
      "status": "healthy" | "warning" | "critical",
      "category": "string",
      "lastUpdated": "ISO timestamp"
    }
  ],
  "alerts": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "severity": "info" | "warning" | "error" | "critical",
      "source": "string",
      "timestamp": "ISO timestamp",
      "acknowledged": boolean,
      "actions": [{"id": "string", "label": "string", "type": "string", "automated": boolean}]
    }
  ],
  "systemHealth": {
    "overall": 0-100,
    "components": [{"name": "string", "status": "operational" | "degraded" | "outage", "latency": number, "errorRate": number}],
    "incidents": number,
    "uptime": number
  },
  "activity": [
    {
      "id": "uuid",
      "type": "string",
      "user": "string",
      "action": "string",
      "target": "string",
      "timestamp": "ISO timestamp"
    }
  ]
}`;
        userPrompt = `Genera el dashboard del centro de comando con rango de tiempo: ${context?.timeRange || '24h'}`;
        break;

      case 'acknowledge_alert':
        systemPrompt = `Eres un sistema de gestión de alertas empresariales.

FORMATO DE RESPUESTA (JSON estricto):
{
  "acknowledged": boolean,
  "alertId": "string",
  "acknowledgedAt": "ISO timestamp",
  "nextAction": "string"
}`;
        userPrompt = `Reconoce la alerta: ${params?.alertId}`;
        break;

      case 'escalate_alert':
        systemPrompt = `Eres un sistema de escalamiento de alertas empresariales.

CAPACIDADES:
- Determinar nivel de escalamiento apropiado
- Notificar a stakeholders relevantes
- Documentar razón del escalamiento

FORMATO DE RESPUESTA (JSON estricto):
{
  "escalated": boolean,
  "escalationLevel": number,
  "notifiedParties": ["string"],
  "urgency": "low" | "medium" | "high" | "critical",
  "estimatedResponseTime": "string"
}`;
        userPrompt = `Escala la alerta ${params?.alertId} con razón: ${params?.reason || 'No especificada'}`;
        break;

      case 'get_metric_details':
        systemPrompt = `Eres un analista de métricas empresariales.

FORMATO DE RESPUESTA (JSON estricto):
{
  "metric": {
    "id": "string",
    "name": "string",
    "currentValue": number,
    "historicalData": [{"timestamp": "ISO timestamp", "value": number}],
    "insights": ["string"],
    "recommendations": ["string"]
  }
}`;
        userPrompt = `Analiza la métrica ${params?.metricId} para el rango: ${params?.timeRange || '24h'}`;
        break;

      case 'execute_command':
        systemPrompt = `Eres un ejecutor de comandos del centro de operaciones.

COMANDOS DISPONIBLES:
- refresh_metrics: Actualizar todas las métricas
- clear_alerts: Limpiar alertas resueltas
- generate_report: Generar reporte ejecutivo
- system_check: Verificar estado del sistema

FORMATO DE RESPUESTA (JSON estricto):
{
  "executed": boolean,
  "command": "string",
  "result": "string",
  "affectedItems": number,
  "executionTime": "string"
}`;
        userPrompt = `Ejecuta el comando: ${params?.command}`;
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
      console.error('[command-center] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[command-center] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[command-center] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
