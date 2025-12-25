import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  action: 'generate_personalized' | 'prioritize' | 'batch_create' | 'smart_schedule' | 'analyze_engagement';
  userId?: string;
  notificationType?: string;
  context?: {
    courseId?: string;
    lessonId?: string;
    achievementId?: string;
    progress?: number;
    lastActivity?: string;
    preferences?: Record<string, unknown>;
  };
  notifications?: Array<{ type: string; data: Record<string, unknown> }>;
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

    const { action, userId, notificationType, context, notifications } = await req.json() as NotificationRequest;

    console.log(`[academia-notifications] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'generate_personalized':
        systemPrompt = `Eres un sistema de notificaciones personalizadas para una plataforma educativa.

TIPOS DE NOTIFICACIÓN:
- achievement: Logros desbloqueados
- reminder: Recordatorios de estudio
- progress: Actualizaciones de progreso
- community: Actividad en la comunidad
- course: Novedades del curso
- streak: Rachas de estudio
- deadline: Fechas límite

FORMATO DE RESPUESTA (JSON estricto):
{
  "notification": {
    "title": "Título atractivo y personalizado",
    "message": "Mensaje motivacional personalizado",
    "type": "tipo",
    "priority": "low" | "medium" | "high",
    "icon": "emoji relevante",
    "actionText": "Texto del botón de acción",
    "actionLink": "/ruta/relevante"
  },
  "personalization": {
    "tone": "motivational" | "informative" | "urgent",
    "relevanceScore": 0-100
  }
}`;

        userPrompt = `Genera una notificación personalizada:
- Usuario ID: ${userId}
- Tipo: ${notificationType}
- Contexto: ${JSON.stringify(context)}`;
        break;

      case 'prioritize':
        systemPrompt = `Eres un sistema de priorización de notificaciones.

CRITERIOS DE PRIORIZACIÓN:
- Urgencia temporal (fechas límite)
- Importancia para el aprendizaje
- Engagement esperado
- Preferencias del usuario
- Frecuencia de notificaciones previas

FORMATO DE RESPUESTA (JSON estricto):
{
  "prioritizedNotifications": [
    {
      "notificationId": "id",
      "priority": 1,
      "score": 0-100,
      "reason": "razón de prioridad",
      "suggestedDeliveryTime": "timestamp",
      "channel": "push" | "email" | "in-app"
    }
  ],
  "suppressedNotifications": ["id de notificaciones a suprimir"],
  "batchRecommendation": {
    "shouldBatch": false,
    "batchSize": 0,
    "batchInterval": "intervalo sugerido"
  }
}`;

        userPrompt = `Prioriza estas notificaciones para el usuario ${userId}:
${JSON.stringify(notifications)}

Contexto del usuario: ${JSON.stringify(context)}`;
        break;

      case 'batch_create':
        systemPrompt = `Eres un sistema de creación masiva de notificaciones educativas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "createdNotifications": [
    {
      "id": "uuid",
      "userId": "usuario",
      "title": "Título",
      "message": "Mensaje",
      "type": "tipo",
      "priority": "prioridad",
      "scheduledFor": "timestamp"
    }
  ],
  "summary": {
    "total": 0,
    "byType": {},
    "byPriority": {}
  }
}`;

        userPrompt = `Crea notificaciones en lote:
${JSON.stringify(notifications)}`;
        break;

      case 'smart_schedule':
        systemPrompt = `Eres un sistema de programación inteligente de notificaciones.

FACTORES A CONSIDERAR:
- Zona horaria del usuario
- Patrones de actividad históricos
- Horarios óptimos de engagement
- Saturación de notificaciones
- Tipo de dispositivo preferido

FORMATO DE RESPUESTA (JSON estricto):
{
  "schedule": {
    "optimalTime": "timestamp",
    "alternativeTimes": ["timestamp1", "timestamp2"],
    "timezone": "zona horaria",
    "channel": "push" | "email" | "in-app",
    "confidence": 0-100
  },
  "reasoning": {
    "factors": ["factor1", "factor2"],
    "userPatterns": {
      "peakActivityHours": [9, 14, 20],
      "preferredDays": ["lunes", "miércoles"],
      "responseRate": 0-100
    }
  },
  "recommendations": ["recomendación1"]
}`;

        userPrompt = `Programa inteligentemente notificación para usuario ${userId}:
Tipo: ${notificationType}
Contexto: ${JSON.stringify(context)}`;
        break;

      case 'analyze_engagement':
        systemPrompt = `Eres un sistema de análisis de engagement de notificaciones.

MÉTRICAS A ANALIZAR:
- Tasa de apertura
- Tasa de clics
- Tiempo de respuesta
- Conversiones
- Desuscripciones

FORMATO DE RESPUESTA (JSON estricto):
{
  "metrics": {
    "openRate": 0-100,
    "clickRate": 0-100,
    "responseTime": "tiempo promedio",
    "conversionRate": 0-100,
    "unsubscribeRate": 0-100
  },
  "trends": {
    "direction": "improving" | "declining" | "stable",
    "changePercentage": 0,
    "comparedTo": "período de comparación"
  },
  "insights": [
    {
      "finding": "hallazgo",
      "impact": "high" | "medium" | "low",
      "recommendation": "recomendación"
    }
  ],
  "bestPerforming": {
    "type": "tipo más efectivo",
    "time": "horario más efectivo",
    "channel": "canal más efectivo"
  }
}`;

        userPrompt = `Analiza el engagement de notificaciones para usuario ${userId}:
Contexto: ${JSON.stringify(context)}`;
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
      console.error('[academia-notifications] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[academia-notifications] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[academia-notifications] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
