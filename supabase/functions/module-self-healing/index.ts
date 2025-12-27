import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SelfHealingRequest {
  action: 'predict_failure' | 'auto_remediate' | 'correlate_events' | 'get_remediation_history' | 'configure_self_healing' | 'get_root_cause' | 'rollback_remediation';
  moduleKey?: string;
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

    const { action, moduleKey, params } = await req.json() as SelfHealingRequest;
    console.log(`[module-self-healing] Action: ${action}, Module: ${moduleKey}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'predict_failure': {
        systemPrompt = `Eres un sistema de predicción de fallos para infraestructura de software empresarial.
        
ANALIZA las métricas, patrones históricos y tendencias para PREDECIR problemas futuros.

FORMATO DE RESPUESTA (JSON estricto):
{
  "predictions": [
    {
      "id": "string",
      "issue": "descripción del problema potencial",
      "probability": 0-100,
      "estimatedTimeframe": "2h|6h|12h|24h|48h",
      "indicators": ["indicador1", "indicador2"],
      "preventiveActions": ["acción1", "acción2"],
      "affectedComponents": ["componente1"],
      "confidence": 0-100,
      "riskLevel": "low|medium|high|critical",
      "trend": "improving|stable|degrading"
    }
  ],
  "overallRiskScore": 0-100,
  "nextPredictedIncident": "ISO date or null",
  "systemHealthTrend": "improving|stable|degrading"
}`;

        const metricsContext = params?.metrics || {
          cpu: 45,
          memory: 72,
          responseTime: 250,
          errorRate: 0.5,
          requestsPerMinute: 1200
        };

        userPrompt = `Analiza las métricas del módulo "${moduleKey || 'sistema'}" y predice posibles fallos en las próximas 24-48 horas.

Métricas actuales:
${JSON.stringify(metricsContext, null, 2)}

Historial reciente:
- 3 warnings de caché en últimas 2h
- Latencia incrementando 15% en última hora
- 2 timeouts de API externa
- Memoria estable pero cercana a 75%

Genera predicciones realistas con probabilidades y acciones preventivas específicas.`;
        break;
      }

      case 'auto_remediate': {
        systemPrompt = `Eres un sistema de auto-remediación autónomo para infraestructura de software.

EJECUTA acciones correctivas automáticas basadas en el tipo de problema detectado.

Acciones disponibles:
- restart_service: Reiniciar servicio/contenedor
- clear_cache: Limpiar caché
- scale_up: Escalar horizontalmente
- rollback: Revertir a versión anterior
- circuit_breaker: Activar circuit breaker
- config_update: Actualizar configuración
- reconnect: Reconectar a servicio externo

FORMATO DE RESPUESTA (JSON estricto):
{
  "remediationId": "string",
  "actionTaken": "restart_service|clear_cache|scale_up|rollback|circuit_breaker|config_update|reconnect",
  "status": "success|failed|partial",
  "executionTimeMs": number,
  "result": {
    "description": "string",
    "metricsAfter": {},
    "improvementPercentage": number
  },
  "rollbackAvailable": boolean,
  "rollbackData": {},
  "nextSteps": ["string"],
  "automationConfidence": 0-100
}`;

        userPrompt = `Ejecuta auto-remediación para el módulo "${moduleKey}".

Problema detectado: ${params?.issueType || 'high_latency'}
Severidad: ${params?.severity || 'medium'}
Contexto: ${JSON.stringify(params?.context || {}, null, 2)}

Determina la mejor acción correctiva y simula su ejecución.`;
        break;
      }

      case 'correlate_events': {
        systemPrompt = `Eres un motor de correlación de eventos para sistemas distribuidos.

AGRUPA eventos relacionados y encuentra la CAUSA RAÍZ de los problemas.

Técnicas de correlación:
- Temporal: eventos cercanos en tiempo
- Causal: eventos que causan otros
- Topológica: eventos en componentes conectados
- Semántica: eventos con mensajes similares

FORMATO DE RESPUESTA (JSON estricto):
{
  "correlationGroups": [
    {
      "groupId": "string",
      "events": [
        {
          "id": "string",
          "moduleKey": "string",
          "level": "info|warn|error",
          "message": "string",
          "timestamp": "ISO date"
        }
      ],
      "rootCause": {
        "description": "string",
        "confidence": 0-100,
        "evidence": ["string"],
        "category": "infrastructure|application|external|configuration"
      },
      "impactedModules": ["string"],
      "suggestedAction": "string",
      "priority": "low|medium|high|critical"
    }
  ],
  "uncorrelatedEvents": [],
  "correlationScore": 0-100,
  "aiInsights": "string"
}`;

        const events = params?.events || [
          { id: '1', moduleKey: 'api-gateway', level: 'error', message: 'Connection timeout to database', timestamp: new Date(Date.now() - 60000).toISOString() },
          { id: '2', moduleKey: 'crm', level: 'error', message: 'Failed to fetch user data', timestamp: new Date(Date.now() - 55000).toISOString() },
          { id: '3', moduleKey: 'analytics', level: 'warn', message: 'Slow query detected', timestamp: new Date(Date.now() - 50000).toISOString() },
          { id: '4', moduleKey: 'database', level: 'error', message: 'Max connections reached', timestamp: new Date(Date.now() - 65000).toISOString() }
        ];

        userPrompt = `Correlaciona los siguientes eventos y encuentra la causa raíz:

Eventos:
${JSON.stringify(events, null, 2)}

Ventana temporal: ${params?.timeWindow || '5 minutos'}

Agrupa eventos relacionados e identifica la causa raíz común.`;
        break;
      }

      case 'get_root_cause': {
        systemPrompt = `Eres un analizador experto de causa raíz para sistemas empresariales.

Utiliza la técnica de los "5 porqués" y análisis de árbol de fallas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "rootCause": {
    "summary": "string",
    "category": "infrastructure|application|external|configuration|human",
    "confidence": 0-100
  },
  "analysisChain": [
    {
      "level": number,
      "question": "¿Por qué...?",
      "answer": "string",
      "evidence": ["string"]
    }
  ],
  "contributingFactors": ["string"],
  "impactAssessment": {
    "affectedUsers": "string",
    "businessImpact": "low|medium|high|critical",
    "estimatedDowntime": "string"
  },
  "recommendations": [
    {
      "action": "string",
      "priority": "immediate|short_term|long_term",
      "effort": "low|medium|high"
    }
  ],
  "preventionMeasures": ["string"]
}`;

        userPrompt = `Realiza análisis de causa raíz profundo para el grupo de correlación: ${params?.correlationGroupId}

Eventos del grupo:
${JSON.stringify(params?.events || [], null, 2)}

Utiliza los 5 porqués para llegar a la causa raíz fundamental.`;
        break;
      }

      case 'get_remediation_history': {
        systemPrompt = `Genera historial de remediaciones automáticas ejecutadas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "remediations": [
    {
      "id": "string",
      "moduleKey": "string",
      "actionType": "restart|scale|cache_clear|rollback|circuit_breaker",
      "status": "success|failed|rolled_back",
      "triggeredBy": "auto|manual|prediction",
      "triggeredAt": "ISO date",
      "completedAt": "ISO date",
      "executionTimeMs": number,
      "issue": "string",
      "result": "string",
      "metricsImprovement": number
    }
  ],
  "statistics": {
    "totalRemediations": number,
    "successRate": number,
    "avgResolutionTimeMs": number,
    "mostCommonAction": "string",
    "mostProblematicModule": "string"
  },
  "trends": {
    "weekOverWeek": number,
    "improving": boolean
  }
}`;

        userPrompt = `Genera historial de remediaciones para el módulo "${moduleKey || 'todos'}" en el período ${params?.timeRange || 'last_7_days'}.`;
        break;
      }

      case 'configure_self_healing': {
        systemPrompt = `Configura el sistema de self-healing.

FORMATO DE RESPUESTA (JSON estricto):
{
  "configuration": {
    "enabled": boolean,
    "autoRemediateThreshold": "low|medium|high|critical",
    "enabledActions": ["restart", "scale", "cache_clear", "rollback", "circuit_breaker"],
    "cooldownMinutes": number,
    "notifyOnAction": boolean,
    "requireApprovalFor": ["rollback", "scale"],
    "maxAutoRemediationsPerHour": number,
    "escalationRules": [
      {
        "condition": "string",
        "action": "notify|escalate|pause"
      }
    ]
  },
  "validationResult": {
    "isValid": boolean,
    "warnings": ["string"],
    "recommendations": ["string"]
  }
}`;

        userPrompt = `Valida y procesa la siguiente configuración de self-healing:
${JSON.stringify(params?.config || {
  enabled: true,
  autoRemediateThreshold: 'medium',
  enabledActions: ['restart', 'cache_clear'],
  cooldownMinutes: 15,
  notifyOnAction: true
}, null, 2)}`;
        break;
      }

      case 'rollback_remediation': {
        systemPrompt = `Ejecuta rollback de una remediación anterior.

FORMATO DE RESPUESTA (JSON estricto):
{
  "rollbackId": "string",
  "originalRemediationId": "string",
  "status": "success|failed|partial",
  "executionTimeMs": number,
  "stateRestored": {
    "description": "string",
    "componentsAffected": ["string"]
  },
  "warnings": ["string"],
  "postRollbackHealth": {
    "status": "healthy|degraded|unhealthy",
    "metrics": {}
  }
}`;

        userPrompt = `Ejecuta rollback de la remediación ${params?.remediationId} para restaurar el estado anterior.`;
        break;
      }

      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Acción no soportada: ${action}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
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

    if (!content) {
      throw new Error('No content in AI response');
    }

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[module-self-healing] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[module-self-healing] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      moduleKey,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[module-self-healing] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
