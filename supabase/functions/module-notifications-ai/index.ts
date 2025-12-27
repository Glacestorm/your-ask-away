import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  action: 'analyze_patterns' | 'prioritize' | 'summarize' | 'suggest_actions' | 'generate_digest';
  context?: {
    notifications?: Array<{
      id: string;
      type: string;
      severity: string;
      title: string;
      message: string;
      timestamp: string;
    }>;
    userPreferences?: Record<string, unknown>;
    timeRange?: string;
  };
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

    const { action, context, params } = await req.json() as NotificationRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'analyze_patterns':
        systemPrompt = `Eres un experto en análisis de patrones de notificaciones para sistemas enterprise.

CONTEXTO DEL ROL:
- Identificas patrones recurrentes en notificaciones
- Detectas tendencias de alertas y problemas
- Correlacionas eventos relacionados
- Sugieres optimizaciones de alertas

FORMATO DE RESPUESTA (JSON estricto):
{
  "patterns": [
    {
      "patternId": string,
      "description": string,
      "frequency": string,
      "affectedModules": string[],
      "severity": "high"|"medium"|"low",
      "trend": "increasing"|"stable"|"decreasing",
      "recommendation": string
    }
  ],
  "correlations": [
    {"event1": string, "event2": string, "correlation": number, "insight": string}
  ],
  "anomalies": [
    {"description": string, "timestamp": string, "significance": string}
  ],
  "summary": {
    "totalPatterns": number,
    "criticalTrends": number,
    "actionRequired": boolean
  }
}`;
        userPrompt = context?.notifications 
          ? `Analiza patrones en estas notificaciones: ${JSON.stringify(context.notifications)}`
          : 'Proporciona un análisis general de patrones de notificación';
        break;

      case 'prioritize':
        systemPrompt = `Eres un sistema de priorización inteligente de notificaciones enterprise.

CONTEXTO DEL ROL:
- Priorizas notificaciones por impacto y urgencia
- Consideras contexto del usuario y preferencias
- Agrupas notificaciones relacionadas
- Filtras ruido y duplicados

FORMATO DE RESPUESTA (JSON estricto):
{
  "prioritized": [
    {
      "id": string,
      "originalPriority": string,
      "newPriority": "critical"|"high"|"medium"|"low",
      "score": number,
      "reasoning": string,
      "groupId": string|null,
      "actionRequired": boolean,
      "suggestedAction": string|null
    }
  ],
  "groups": [
    {"groupId": string, "title": string, "count": number, "combinedPriority": string}
  ],
  "suppressed": [
    {"id": string, "reason": string}
  ],
  "stats": {
    "totalProcessed": number,
    "criticalCount": number,
    "groupsCreated": number,
    "suppressed": number
  }
}`;
        userPrompt = context 
          ? `Prioriza estas notificaciones considerando preferencias del usuario:
Notificaciones: ${JSON.stringify(context.notifications || [])}
Preferencias: ${JSON.stringify(context.userPreferences || {})}`
          : 'Proporciona estrategias generales de priorización';
        break;

      case 'summarize':
        systemPrompt = `Eres un asistente de resumen ejecutivo para notificaciones de sistemas.

CONTEXTO DEL ROL:
- Creas resúmenes concisos y accionables
- Destacas información crítica
- Eliminas redundancias
- Proporcionas contexto relevante

FORMATO DE RESPUESTA (JSON estricto):
{
  "summary": {
    "headline": string,
    "period": string,
    "keyPoints": string[],
    "criticalAlerts": [{"title": string, "action": string}],
    "trendSummary": string,
    "recommendedActions": string[]
  },
  "metrics": {
    "totalNotifications": number,
    "bySeverity": {"critical": number, "warning": number, "info": number},
    "byModule": [{"module": string, "count": number}],
    "resolutionRate": number
  },
  "nextSteps": string[]
}`;
        userPrompt = context 
          ? `Resume estas notificaciones del período ${context.timeRange || 'reciente'}:
${JSON.stringify(context.notifications || [])}`
          : 'Proporciona un template de resumen de notificaciones';
        break;

      case 'suggest_actions':
        systemPrompt = `Eres un asistente de acciones correctivas para alertas de sistemas enterprise.

CONTEXTO DEL ROL:
- Sugieres acciones específicas para cada alerta
- Priorizas por impacto y facilidad
- Proporcionas pasos detallados
- Estimas tiempo y recursos necesarios

FORMATO DE RESPUESTA (JSON estricto):
{
  "actions": [
    {
      "notificationId": string,
      "suggestedAction": {
        "title": string,
        "type": "immediate"|"scheduled"|"monitoring"|"dismiss",
        "priority": "critical"|"high"|"medium"|"low",
        "steps": string[],
        "estimatedTime": string,
        "automatable": boolean,
        "assignTo": string|null
      },
      "alternatives": string[],
      "risks": string[]
    }
  ],
  "batchActions": [
    {"action": string, "affectedCount": number, "benefit": string}
  ],
  "automation": {
    "candidates": [{"action": string, "frequency": number, "automationBenefit": string}],
    "estimatedTimeSavings": string
  }
}`;
        userPrompt = context?.notifications 
          ? `Sugiere acciones para estas notificaciones: ${JSON.stringify(context.notifications)}`
          : 'Proporciona estrategias generales de acción para notificaciones';
        break;

      case 'generate_digest':
        systemPrompt = `Eres un generador de digest diario/semanal de notificaciones para ejecutivos.

CONTEXTO DEL ROL:
- Creas digestos ejecutivos concisos
- Destacas lo más importante
- Proporcionas métricas clave
- Incluyes tendencias y comparativas

FORMATO DE RESPUESTA (JSON estricto):
{
  "digest": {
    "title": string,
    "period": string,
    "generatedAt": string,
    "executiveSummary": string,
    "highlights": [
      {"icon": string, "title": string, "description": string, "severity": string}
    ],
    "metrics": {
      "total": number,
      "resolved": number,
      "pending": number,
      "avgResolutionTime": string
    },
    "moduleBreakdown": [
      {"module": string, "status": string, "alerts": number, "trend": string}
    ],
    "actionItems": [
      {"priority": string, "action": string, "dueBy": string}
    ],
    "trends": {
      "vsLastPeriod": {"change": number, "direction": "up"|"down"|"stable"},
      "topIssues": string[],
      "improvements": string[]
    }
  },
  "recommendations": string[]
}`;
        userPrompt = context 
          ? `Genera un digest para el período ${context.timeRange || 'última semana'}:
Notificaciones: ${JSON.stringify(context.notifications || [])}`
          : 'Genera un template de digest de notificaciones';
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[module-notifications-ai] Processing action: ${action}`);

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
        max_tokens: 2500,
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
      console.error('[module-notifications-ai] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[module-notifications-ai] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[module-notifications-ai] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
