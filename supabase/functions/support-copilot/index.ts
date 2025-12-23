import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SupportCopilotRequest {
  action: 'get_suggestions' | 'analyze_action' | 'generate_summary' | 'predict_issues';
  sessionContext?: {
    sessionId: string;
    sessionCode: string;
    clientName?: string;
    startedAt: string;
    actionsCount: number;
    highRiskCount: number;
    currentDuration: number;
    recentActions?: Array<{
      action_type: string;
      description: string;
      risk_level: string;
      created_at: string;
    }>;
  };
  actionContext?: {
    actionType: string;
    description: string;
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

    const { action, sessionContext, actionContext } = await req.json() as SupportCopilotRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_suggestions':
        systemPrompt = `Eres un asistente de IA especializado en soporte técnico remoto. Tu rol es proporcionar sugerencias inteligentes y proactivas durante las sesiones de soporte.

CONTEXTO DEL ROL:
- Ayudas a técnicos de soporte durante sesiones remotas
- Analizas patrones de acciones para sugerir próximos pasos
- Identificas posibles problemas antes de que ocurran
- Recomiendas buenas prácticas de seguridad y documentación

FORMATO DE RESPUESTA (JSON estricto):
{
  "suggestions": [
    {
      "id": "unique_id",
      "type": "action" | "warning" | "tip" | "checklist",
      "priority": "high" | "medium" | "low",
      "title": "Título breve",
      "description": "Descripción detallada de la sugerencia",
      "icon": "Shield" | "AlertTriangle" | "Lightbulb" | "CheckSquare" | "Clock" | "FileText"
    }
  ],
  "riskAssessment": {
    "level": "low" | "medium" | "high",
    "factors": ["factor1", "factor2"],
    "recommendation": "Recomendación general"
  },
  "nextBestActions": ["acción1", "acción2", "acción3"]
}`;

        userPrompt = sessionContext ? `Analiza esta sesión de soporte remoto y proporciona sugerencias inteligentes:

SESIÓN ACTIVA:
- Código: ${sessionContext.sessionCode}
- Cliente: ${sessionContext.clientName || 'No especificado'}
- Duración: ${Math.round(sessionContext.currentDuration / 60000)} minutos
- Acciones realizadas: ${sessionContext.actionsCount}
- Acciones de alto riesgo: ${sessionContext.highRiskCount}

ÚLTIMAS ACCIONES:
${sessionContext.recentActions?.map(a => `- [${a.risk_level}] ${a.action_type}: ${a.description}`).join('\n') || 'Sin acciones registradas aún'}

Genera 3-5 sugerencias contextuales y relevantes para este momento de la sesión.` : 'Proporciona sugerencias generales para iniciar una sesión de soporte.';
        break;

      case 'analyze_action':
        systemPrompt = `Eres un analista de seguridad y compliance para sesiones de soporte remoto. Evalúas acciones individuales y determinas su nivel de riesgo y necesidad de aprobación.

FORMATO DE RESPUESTA (JSON estricto):
{
  "riskScore": 0-100,
  "riskLevel": "low" | "medium" | "high" | "critical",
  "requiresApproval": boolean,
  "complianceFlags": ["flag1", "flag2"],
  "recommendations": ["rec1", "rec2"],
  "betterDescription": "Descripción mejorada para auditoría"
}`;

        userPrompt = actionContext ? `Analiza esta acción de soporte remoto:

TIPO DE ACCIÓN: ${actionContext.actionType}
DESCRIPCIÓN: ${actionContext.description}

Evalúa el riesgo, compliance y proporciona recomendaciones.` : 'Error: No se proporcionó contexto de acción';
        break;

      case 'generate_summary':
        systemPrompt = `Eres un especialista en documentación técnica. Generas resúmenes ejecutivos de sesiones de soporte para auditoría y seguimiento.

FORMATO DE RESPUESTA (JSON estricto):
{
  "executiveSummary": "Resumen ejecutivo de 2-3 oraciones",
  "keyActions": ["acción clave 1", "acción clave 2"],
  "risksIdentified": ["riesgo 1", "riesgo 2"],
  "recommendations": ["recomendación 1", "recomendación 2"],
  "followUpRequired": boolean,
  "followUpNotes": "Notas de seguimiento si aplica",
  "qualityScore": 0-100
}`;

        userPrompt = sessionContext ? `Genera un resumen ejecutivo para esta sesión de soporte:

SESIÓN: ${sessionContext.sessionCode}
CLIENTE: ${sessionContext.clientName || 'No especificado'}
DURACIÓN: ${Math.round(sessionContext.currentDuration / 60000)} minutos
ACCIONES TOTALES: ${sessionContext.actionsCount}
ACCIONES DE ALTO RIESGO: ${sessionContext.highRiskCount}

HISTORIAL DE ACCIONES:
${sessionContext.recentActions?.map(a => `- [${a.created_at}] ${a.action_type}: ${a.description}`).join('\n') || 'Sin acciones'}` : 'Error: No se proporcionó contexto de sesión';
        break;

      case 'predict_issues':
        systemPrompt = `Eres un sistema de análisis predictivo para soporte técnico. Identificas patrones que podrían indicar problemas futuros basándote en el comportamiento de la sesión.

FORMATO DE RESPUESTA (JSON estricto):
{
  "predictions": [
    {
      "issue": "Descripción del posible problema",
      "probability": 0-100,
      "preventiveAction": "Acción preventiva recomendada",
      "severity": "low" | "medium" | "high"
    }
  ],
  "sessionHealthScore": 0-100,
  "alerts": ["alerta 1", "alerta 2"]
}`;

        userPrompt = sessionContext ? `Analiza patrones y predice posibles problemas:

DATOS DE LA SESIÓN:
- Duración actual: ${Math.round(sessionContext.currentDuration / 60000)} minutos
- Frecuencia de acciones: ${sessionContext.actionsCount} acciones
- Ratio de alto riesgo: ${sessionContext.highRiskCount}/${sessionContext.actionsCount}

PATRÓN DE ACCIONES:
${sessionContext.recentActions?.map(a => a.action_type).join(' -> ') || 'Sin patrón'}` : 'Error: No se proporcionó contexto';
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[support-copilot] Processing action: ${action}`);

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
          message: 'Demasiadas solicitudes. Por favor, espera un momento.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required', 
          message: 'Créditos insuficientes para IA.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error(`[support-copilot] API error: ${response.status}`, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from response
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[support-copilot] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[support-copilot] Successfully processed: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[support-copilot] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
