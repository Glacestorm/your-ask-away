import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetricsRequest {
  action: 'get_metrics' | 'get_agent_performance' | 'get_trends' | 'get_predictions' | 'get_alerts';
  timeRange?: string;
  agentId?: string;
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

    const { action, timeRange = '24h', agentId } = await req.json() as MetricsRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_metrics':
        systemPrompt = `Eres un sistema de métricas de soporte técnico enterprise.
        
GENERA MÉTRICAS REALISTAS para un dashboard de soporte con estos KPIs:
- activeSessions: sesiones activas ahora (0-20)
- avgResponseTime: tiempo promedio respuesta en segundos (0.5-5)
- satisfactionScore: puntuación satisfacción 0-100
- resolutionRate: tasa resolución 0-100%
- totalTicketsToday: tickets del día (10-200)
- pendingEscalations: escalaciones pendientes (0-10)
- aiAutomationRate: tasa automatización IA 0-100%
- healthScore: salud general sistema 0-100

FORMATO JSON ESTRICTO:
{
  "activeSessions": number,
  "avgResponseTime": number,
  "satisfactionScore": number,
  "resolutionRate": number,
  "totalTicketsToday": number,
  "pendingEscalations": number,
  "aiAutomationRate": number,
  "healthScore": number,
  "trends": {
    "sessions": "up" | "down" | "stable",
    "satisfaction": "up" | "down" | "stable",
    "resolution": "up" | "down" | "stable"
  }
}`;
        userPrompt = `Genera métricas de soporte para el período: ${timeRange}`;
        break;

      case 'get_agent_performance':
        systemPrompt = `Eres un sistema de análisis de rendimiento de agentes de soporte.

GENERA datos de rendimiento para agentes (humanos e IA):
- id: identificador único
- name: nombre del agente
- type: "human" o "ai"
- ticketsResolved: tickets resueltos hoy
- avgHandleTime: tiempo promedio manejo (segundos)
- satisfactionScore: puntuación satisfacción 0-100
- status: "online" | "busy" | "offline"

FORMATO JSON ESTRICTO:
{
  "agents": [
    {
      "id": "string",
      "name": "string",
      "type": "human" | "ai",
      "ticketsResolved": number,
      "avgHandleTime": number,
      "satisfactionScore": number,
      "status": "online" | "busy" | "offline"
    }
  ],
  "summary": {
    "totalAgents": number,
    "onlineAgents": number,
    "avgTeamSatisfaction": number
  }
}`;
        userPrompt = agentId 
          ? `Genera rendimiento para agente: ${agentId}`
          : 'Genera rendimiento para todos los agentes del equipo de soporte';
        break;

      case 'get_trends':
        systemPrompt = `Eres un sistema de análisis de tendencias de soporte.

GENERA datos de tendencias para gráficos:
- hourlyData: datos por hora (últimas 24h)
- dailyData: datos por día (últimos 7 días)
- weeklyData: datos por semana (últimas 4 semanas)

FORMATO JSON ESTRICTO:
{
  "hourlyData": [
    {"hour": "HH:00", "tickets": number, "resolved": number, "satisfaction": number}
  ],
  "dailyData": [
    {"date": "YYYY-MM-DD", "tickets": number, "resolved": number, "avgResponseTime": number}
  ],
  "insights": [
    {"type": "peak" | "low" | "trend", "message": "string", "value": number}
  ]
}`;
        userPrompt = `Genera tendencias para período: ${timeRange}`;
        break;

      case 'get_predictions':
        systemPrompt = `Eres un sistema predictivo de carga de soporte.

GENERA predicciones de carga futura:
- nextHourLoad: carga estimada próxima hora
- peakTime: hora pico esperada
- staffingRecommendation: recomendación de personal

FORMATO JSON ESTRICTO:
{
  "predictions": {
    "nextHour": {"load": number, "confidence": number},
    "next4Hours": {"load": number, "confidence": number},
    "peakTime": "HH:00",
    "expectedPeakLoad": number
  },
  "staffing": {
    "current": number,
    "recommended": number,
    "reason": "string"
  },
  "alerts": [
    {"severity": "low" | "medium" | "high", "message": "string"}
  ]
}`;
        userPrompt = 'Genera predicciones de carga para las próximas 8 horas';
        break;

      case 'get_alerts':
        systemPrompt = `Eres un sistema de alertas de soporte.

GENERA alertas activas del sistema:
- id: identificador único
- severity: nivel de severidad
- message: mensaje de alerta
- timestamp: momento de la alerta
- acknowledged: si fue reconocida

FORMATO JSON ESTRICTO:
{
  "alerts": [
    {
      "id": "string",
      "severity": "info" | "warning" | "critical",
      "message": "string",
      "source": "string",
      "timestamp": "ISO8601",
      "acknowledged": boolean
    }
  ],
  "summary": {
    "total": number,
    "critical": number,
    "unacknowledged": number
  }
}`;
        userPrompt = 'Genera alertas activas del sistema de soporte';
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[support-metrics-dashboard] Processing: ${action}`);

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
        max_tokens: 2000,
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
      console.error('[support-metrics-dashboard] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[support-metrics-dashboard] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[support-metrics-dashboard] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
