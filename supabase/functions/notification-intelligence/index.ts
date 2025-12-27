import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationIntelligenceRequest {
  action: 
    | 'smart_prioritize' 
    | 'reduce_noise' 
    | 'suggest_action' 
    | 'group_related'
    | 'predict_alerts'
    | 'execute_auto_action'
    | 'get_intelligence_stats'
    | 'configure_intelligence';
  notifications?: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    severity?: string;
    source?: string;
    timestamp?: string;
    metadata?: Record<string, unknown>;
  }>;
  context?: {
    userId?: string;
    moduleKey?: string;
    timeWindow?: string;
    historicalData?: Record<string, unknown>;
  };
  actionParams?: {
    actionType?: string;
    notificationId?: string;
    autoExecute?: boolean;
  };
  config?: {
    noiseTolerance?: 'low' | 'medium' | 'high';
    autoActionEnabled?: boolean;
    priorityWeights?: Record<string, number>;
    groupingWindow?: number;
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

    const { action, notifications, context, actionParams, config } = await req.json() as NotificationIntelligenceRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'smart_prioritize':
        systemPrompt = `Eres un sistema experto de priorización inteligente de notificaciones para plataformas enterprise.

CONTEXTO DEL ROL:
- Analizas notificaciones y las priorizas según impacto, urgencia y contexto del usuario
- Consideras fatiga de alertas y tiempo óptimo de entrega
- Aprendes de patrones históricos de interacción

CRITERIOS DE PRIORIZACIÓN:
1. Impacto en negocio (crítico > alto > medio > bajo)
2. Urgencia temporal (inmediato > horas > días)
3. Contexto del usuario (horario, carga actual, preferencias)
4. Relevancia histórica (alertas similares previas)
5. Dependencias (alertas que bloquean otras)

FORMATO DE RESPUESTA (JSON estricto):
{
  "prioritizedNotifications": [
    {
      "id": "string",
      "originalPriority": "string",
      "newPriority": "critical" | "high" | "medium" | "low" | "deferred",
      "priorityScore": 0-100,
      "reasoning": "string",
      "optimalDeliveryTime": "now" | "1h" | "4h" | "tomorrow" | "weekly_digest",
      "suggestedChannel": "push" | "email" | "in_app" | "sms",
      "fatigueRisk": "low" | "medium" | "high"
    }
  ],
  "summary": {
    "criticalCount": 0,
    "deferredCount": 0,
    "avgPriorityChange": 0,
    "fatigueWarning": boolean,
    "recommendations": ["string"]
  }
}`;

        userPrompt = `Prioriza estas notificaciones de forma inteligente:

NOTIFICACIONES:
${JSON.stringify(notifications, null, 2)}

CONTEXTO:
${JSON.stringify(context, null, 2)}

Analiza cada notificación considerando todos los criterios y proporciona priorización optimizada.`;
        break;

      case 'reduce_noise':
        systemPrompt = `Eres un sistema de reducción de ruido para notificaciones enterprise.

CONTEXTO DEL ROL:
- Identificas y filtras notificaciones redundantes, duplicadas o de bajo valor
- Detectas patrones de spam o alertas repetitivas
- Consolidas múltiples alertas similares en una sola
- Evalúas la fatiga del usuario

CRITERIOS DE FILTRADO:
1. Duplicados exactos o casi-exactos
2. Variaciones del mismo problema
3. Alertas que se auto-resuelven
4. Notificaciones informativas sin acción requerida
5. Patrones de flapping (oscilación rápida)

FORMATO DE RESPUESTA (JSON estricto):
{
  "filteredNotifications": [
    {
      "id": "string",
      "action": "keep" | "suppress" | "consolidate" | "delay",
      "reason": "string",
      "confidenceScore": 0-100
    }
  ],
  "consolidatedGroups": [
    {
      "groupId": "string",
      "representativeId": "string",
      "memberIds": ["string"],
      "consolidatedMessage": "string",
      "totalCount": 0
    }
  ],
  "noiseMetrics": {
    "originalCount": 0,
    "reducedCount": 0,
    "reductionPercentage": 0,
    "falsePositiveRisk": "low" | "medium" | "high",
    "suppressedCategories": ["string"]
  }
}`;

        userPrompt = `Reduce el ruido de estas notificaciones:

NOTIFICACIONES:
${JSON.stringify(notifications, null, 2)}

CONTEXTO Y CONFIGURACIÓN:
${JSON.stringify({ context, config }, null, 2)}

Identifica duplicados, consolida relacionadas y filtra ruido manteniendo las críticas.`;
        break;

      case 'suggest_action':
        systemPrompt = `Eres un sistema de sugerencia de acciones para notificaciones.

CONTEXTO DEL ROL:
- Analizas notificaciones y sugieres acciones específicas
- Identificas acciones que pueden auto-ejecutarse de forma segura
- Priorizas acciones por impacto y riesgo
- Proporcionas scripts o comandos cuando es posible

TIPOS DE ACCIONES:
1. Acciones inmediatas (restart, clear cache, scale)
2. Acciones de investigación (ver logs, analizar métricas)
3. Acciones de comunicación (notificar equipo, crear ticket)
4. Acciones preventivas (backup, snapshots)
5. Acciones de escalación (alertar manager, activar on-call)

FORMATO DE RESPUESTA (JSON estricto):
{
  "actionSuggestions": [
    {
      "notificationId": "string",
      "suggestedActions": [
        {
          "actionId": "string",
          "actionType": "immediate" | "investigate" | "communicate" | "prevent" | "escalate",
          "title": "string",
          "description": "string",
          "command": "string | null",
          "autoExecutable": boolean,
          "riskLevel": "none" | "low" | "medium" | "high",
          "estimatedImpact": "string",
          "requiredPermissions": ["string"],
          "rollbackAvailable": boolean
        }
      ],
      "recommendedAction": "string",
      "urgency": "immediate" | "soon" | "scheduled"
    }
  ],
  "batchActions": [
    {
      "actionName": "string",
      "affectsNotifications": ["string"],
      "description": "string",
      "efficiency": "string"
    }
  ]
}`;

        userPrompt = `Sugiere acciones para estas notificaciones:

NOTIFICACIONES:
${JSON.stringify(notifications, null, 2)}

CONTEXTO:
${JSON.stringify(context, null, 2)}

Proporciona acciones específicas, ejecutables y con evaluación de riesgo.`;
        break;

      case 'group_related':
        systemPrompt = `Eres un sistema de agrupación inteligente de notificaciones.

CONTEXTO DEL ROL:
- Identificas notificaciones relacionadas por causa raíz común
- Creas grupos lógicos basados en módulo, tiempo, tipo de problema
- Detectas cadenas de causa-efecto entre alertas
- Identificas el evento originador del grupo

CRITERIOS DE AGRUPACIÓN:
1. Mismo módulo/componente
2. Ventana temporal cercana
3. Patrón de error similar
4. Relación causa-efecto
5. Impacto en mismos usuarios/recursos

FORMATO DE RESPUESTA (JSON estricto):
{
  "groups": [
    {
      "groupId": "string",
      "groupName": "string",
      "rootCause": {
        "notificationId": "string",
        "description": "string",
        "confidence": 0-100
      },
      "members": [
        {
          "notificationId": "string",
          "relationship": "root" | "effect" | "related" | "symptom",
          "order": 0
        }
      ],
      "affectedModules": ["string"],
      "timeline": {
        "start": "string",
        "end": "string",
        "durationMinutes": 0
      },
      "severity": "critical" | "high" | "medium" | "low",
      "status": "active" | "resolving" | "resolved"
    }
  ],
  "ungrouped": ["string"],
  "crossGroupRelations": [
    {
      "fromGroup": "string",
      "toGroup": "string",
      "relationType": "string"
    }
  ]
}`;

        userPrompt = `Agrupa estas notificaciones relacionadas:

NOTIFICACIONES:
${JSON.stringify(notifications, null, 2)}

CONTEXTO:
${JSON.stringify(context, null, 2)}

Identifica grupos por causa raíz y relaciones entre eventos.`;
        break;

      case 'predict_alerts':
        systemPrompt = `Eres un sistema predictivo de alertas para plataformas enterprise.

CONTEXTO DEL ROL:
- Analizas patrones históricos para predecir alertas futuras
- Identificas tendencias que preceden a problemas
- Sugieres acciones preventivas antes de que ocurra el problema
- Calculas probabilidades y ventanas de tiempo

INDICADORES PREDICTIVOS:
1. Degradación gradual de métricas
2. Patrones cíclicos (hora del día, día de la semana)
3. Correlaciones con eventos externos
4. Acumulación de warnings menores
5. Cambios recientes en configuración

FORMATO DE RESPUESTA (JSON estricto):
{
  "predictions": [
    {
      "predictionId": "string",
      "predictedAlert": {
        "type": "string",
        "title": "string",
        "severity": "critical" | "high" | "medium" | "low"
      },
      "probability": 0-100,
      "timeframe": {
        "earliest": "string",
        "mostLikely": "string",
        "latest": "string"
      },
      "triggerIndicators": [
        {
          "indicator": "string",
          "currentValue": "string",
          "thresholdValue": "string",
          "trend": "increasing" | "stable" | "decreasing"
        }
      ],
      "preventiveActions": [
        {
          "action": "string",
          "effectiveness": 0-100,
          "effort": "low" | "medium" | "high"
        }
      ],
      "affectedModules": ["string"],
      "confidence": 0-100
    }
  ],
  "overallRiskLevel": "low" | "moderate" | "elevated" | "high" | "critical",
  "trendAnalysis": {
    "improving": ["string"],
    "stable": ["string"],
    "degrading": ["string"]
  }
}`;

        userPrompt = `Predice alertas futuras basándote en estos datos:

NOTIFICACIONES RECIENTES:
${JSON.stringify(notifications, null, 2)}

CONTEXTO E HISTORIAL:
${JSON.stringify(context, null, 2)}

Analiza patrones y predice problemas con ventanas de tiempo y acciones preventivas.`;
        break;

      case 'execute_auto_action':
        systemPrompt = `Eres un sistema de ejecución automática de acciones.

CONTEXTO DEL ROL:
- Evalúas si una acción puede ejecutarse automáticamente de forma segura
- Preparas los parámetros necesarios para la ejecución
- Defines pasos de rollback en caso de fallo
- Documentas la acción para auditoría

CRITERIOS DE AUTO-EJECUCIÓN:
1. Riesgo bajo o nulo
2. Acción reversible
3. No afecta datos de usuario
4. Permisos suficientes
5. No hay conflictos con otras acciones

FORMATO DE RESPUESTA (JSON estricto):
{
  "execution": {
    "approved": boolean,
    "actionId": "string",
    "actionType": "string",
    "parameters": {},
    "preChecks": [
      {
        "check": "string",
        "status": "passed" | "failed" | "warning",
        "message": "string"
      }
    ],
    "estimatedDuration": "string",
    "rollbackPlan": {
      "available": boolean,
      "steps": ["string"],
      "autoRollbackTriggers": ["string"]
    }
  },
  "result": {
    "status": "ready" | "blocked" | "needs_approval",
    "blockers": ["string"],
    "warnings": ["string"],
    "auditLog": {
      "timestamp": "string",
      "action": "string",
      "initiatedBy": "auto_system",
      "reason": "string"
    }
  }
}`;

        userPrompt = `Evalúa y prepara esta acción automática:

PARÁMETROS DE ACCIÓN:
${JSON.stringify(actionParams, null, 2)}

NOTIFICACIÓN ORIGEN:
${JSON.stringify(notifications?.[0], null, 2)}

CONTEXTO:
${JSON.stringify(context, null, 2)}

Determina si es seguro ejecutar automáticamente y prepara los parámetros.`;
        break;

      case 'get_intelligence_stats':
        systemPrompt = `Eres un sistema de análisis de estadísticas de inteligencia de notificaciones.

FORMATO DE RESPUESTA (JSON estricto):
{
  "stats": {
    "period": "string",
    "totalProcessed": 0,
    "priorityDistribution": {
      "critical": 0,
      "high": 0,
      "medium": 0,
      "low": 0,
      "deferred": 0
    },
    "noiseReduction": {
      "suppressed": 0,
      "consolidated": 0,
      "reductionRate": 0
    },
    "autoActions": {
      "executed": 0,
      "successful": 0,
      "failed": 0,
      "successRate": 0
    },
    "predictions": {
      "made": 0,
      "accurate": 0,
      "accuracyRate": 0
    },
    "userSatisfaction": {
      "alertFatigue": "low" | "medium" | "high",
      "responseTime": "string",
      "actionRate": 0
    }
  },
  "trends": {
    "volumeTrend": "increasing" | "stable" | "decreasing",
    "qualityTrend": "improving" | "stable" | "degrading",
    "recommendations": ["string"]
  }
}`;

        userPrompt = `Genera estadísticas de inteligencia de notificaciones:

CONTEXTO:
${JSON.stringify(context, null, 2)}

NOTIFICACIONES RECIENTES:
${JSON.stringify(notifications?.slice(0, 20), null, 2)}

Proporciona métricas detalladas y tendencias.`;
        break;

      case 'configure_intelligence':
        systemPrompt = `Eres un sistema de configuración de inteligencia de notificaciones.

FORMATO DE RESPUESTA (JSON estricto):
{
  "configuration": {
    "validated": boolean,
    "appliedSettings": {
      "noiseTolerance": "low" | "medium" | "high",
      "autoActionEnabled": boolean,
      "priorityWeights": {},
      "groupingWindow": 0,
      "channels": {}
    },
    "recommendations": [
      {
        "setting": "string",
        "currentValue": "string",
        "suggestedValue": "string",
        "reason": "string"
      }
    ],
    "warnings": ["string"]
  }
}`;

        userPrompt = `Valida y aplica esta configuración:

CONFIGURACIÓN:
${JSON.stringify(config, null, 2)}

CONTEXTO:
${JSON.stringify(context, null, 2)}

Valida la configuración y sugiere mejoras.`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[notification-intelligence] Processing action: ${action}`);

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
      console.error('[notification-intelligence] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[notification-intelligence] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[notification-intelligence] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
