import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutomationRequest {
  action: 'create_workflow' | 'execute_workflow' | 'schedule_automation' | 
          'trigger_analysis' | 'optimize_process' | 'generate_integration' |
          'monitor_automations' | 'handle_exception' | 'batch_operations' |
          'intelligent_routing';
  context?: Record<string, unknown>;
  params?: Record<string, unknown>;
  workflowId?: string;
  triggers?: Array<Record<string, unknown>>;
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

    const { action, context, params, workflowId, triggers } = await req.json() as AutomationRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'create_workflow':
        systemPrompt = `Eres un diseñador de workflows inteligentes que crea automatizaciones empresariales.

CAPACIDADES:
- Diseño de flujos de trabajo visuales
- Definición de pasos, condiciones y acciones
- Configuración de triggers y eventos
- Manejo de errores y excepciones

RESPUESTA JSON:
{
  "workflow": {
    "id": "string",
    "name": "string",
    "description": "string",
    "version": "string",
    "status": "draft" | "active" | "paused",
    "category": "string"
  },
  "steps": [
    {
      "id": "string",
      "name": "string",
      "type": "action" | "condition" | "loop" | "parallel" | "wait" | "subprocess",
      "config": {
        "action": "string",
        "params": {},
        "timeout": number,
        "retries": number
      },
      "connections": {
        "onSuccess": "string",
        "onFailure": "string",
        "conditions": [{ "when": "string", "goto": "string" }]
      },
      "position": { "x": number, "y": number }
    }
  ],
  "triggers": [
    {
      "id": "string",
      "type": "schedule" | "event" | "webhook" | "condition" | "manual",
      "config": {},
      "enabled": true
    }
  ],
  "variables": [
    { "name": "string", "type": "string", "defaultValue": unknown }
  ],
  "errorHandling": {
    "strategy": "retry" | "skip" | "abort" | "fallback",
    "maxRetries": number,
    "notifyOnError": true
  },
  "metadata": {
    "createdBy": "AI",
    "estimatedDuration": "string",
    "complexity": "low" | "medium" | "high"
  }
}`;
        userPrompt = `Crea un workflow para: ${JSON.stringify(context)}
Requisitos específicos: ${JSON.stringify(params)}`;
        break;

      case 'execute_workflow':
        systemPrompt = `Eres un motor de ejecución de workflows que procesa automatizaciones paso a paso.

CAPACIDADES:
- Ejecución secuencial y paralela de pasos
- Evaluación de condiciones dinámicas
- Gestión de estado y variables
- Logging detallado de ejecución

RESPUESTA JSON:
{
  "execution": {
    "id": "string",
    "workflowId": "string",
    "status": "running" | "completed" | "failed" | "paused" | "cancelled",
    "startedAt": "timestamp",
    "completedAt": "timestamp",
    "duration": number
  },
  "currentStep": {
    "id": "string",
    "name": "string",
    "status": "pending" | "running" | "completed" | "failed" | "skipped"
  },
  "stepResults": [
    {
      "stepId": "string",
      "stepName": "string",
      "status": "completed" | "failed" | "skipped",
      "output": {},
      "duration": number,
      "logs": ["string"]
    }
  ],
  "variables": {},
  "progress": {
    "completedSteps": number,
    "totalSteps": number,
    "percentage": number
  },
  "errors": [
    {
      "stepId": "string",
      "error": "string",
      "recoverable": boolean,
      "suggestion": "string"
    }
  ],
  "nextActions": ["string"]
}`;
        userPrompt = `Ejecuta workflow: ${workflowId}
Contexto de ejecución: ${JSON.stringify(context)}
Parámetros de entrada: ${JSON.stringify(params)}`;
        break;

      case 'schedule_automation':
        systemPrompt = `Eres un planificador de automatizaciones que programa ejecuciones futuras.

CAPACIDADES:
- Programación basada en cron
- Triggers basados en eventos
- Gestión de dependencias temporales
- Optimización de horarios

RESPUESTA JSON:
{
  "schedule": {
    "id": "string",
    "name": "string",
    "workflowId": "string",
    "status": "active" | "paused" | "completed"
  },
  "timing": {
    "type": "once" | "recurring" | "event-driven",
    "cronExpression": "string",
    "timezone": "string",
    "nextRun": "timestamp",
    "lastRun": "timestamp"
  },
  "recurrence": {
    "frequency": "hourly" | "daily" | "weekly" | "monthly" | "custom",
    "interval": number,
    "daysOfWeek": number[],
    "endDate": "timestamp",
    "maxExecutions": number
  },
  "conditions": [
    {
      "type": "time_window" | "resource_availability" | "dependency",
      "config": {}
    }
  ],
  "executionHistory": [
    {
      "runId": "string",
      "startedAt": "timestamp",
      "status": "success" | "failed",
      "duration": number
    }
  ],
  "optimization": {
    "suggestedTime": "timestamp",
    "reason": "string",
    "resourceUsage": "low" | "medium" | "high"
  }
}`;
        userPrompt = `Programa automatización: ${JSON.stringify(context)}
Configuración de schedule: ${JSON.stringify(params)}`;
        break;

      case 'trigger_analysis':
        systemPrompt = `Eres un analizador de triggers que evalúa condiciones y eventos para activar automatizaciones.

CAPACIDADES:
- Análisis de patrones de eventos
- Evaluación de condiciones complejas
- Detección de anomalías que requieren acción
- Priorización de triggers

RESPUESTA JSON:
{
  "analysis": {
    "triggerId": "string",
    "shouldFire": boolean,
    "confidence": 0-100,
    "reason": "string"
  },
  "conditions": [
    {
      "name": "string",
      "expression": "string",
      "currentValue": unknown,
      "threshold": unknown,
      "met": boolean
    }
  ],
  "events": [
    {
      "type": "string",
      "source": "string",
      "timestamp": "timestamp",
      "relevance": 0-100,
      "data": {}
    }
  ],
  "patterns": [
    {
      "name": "string",
      "detected": boolean,
      "frequency": "string",
      "lastOccurrence": "timestamp"
    }
  ],
  "recommendations": [
    {
      "action": "fire" | "wait" | "modify" | "disable",
      "reason": "string",
      "priority": "high" | "medium" | "low"
    }
  ],
  "relatedTriggers": [
    {
      "triggerId": "string",
      "relationship": "dependent" | "conflicting" | "complementary"
    }
  ]
}`;
        userPrompt = `Analiza triggers: ${JSON.stringify(triggers)}
Contexto actual: ${JSON.stringify(context)}
Eventos recientes: ${JSON.stringify(params?.events)}`;
        break;

      case 'optimize_process':
        systemPrompt = `Eres un optimizador de procesos que mejora la eficiencia de automatizaciones.

CAPACIDADES:
- Análisis de cuellos de botella
- Recomendaciones de paralelización
- Optimización de recursos
- Reducción de latencia

RESPUESTA JSON:
{
  "currentState": {
    "avgDuration": number,
    "successRate": number,
    "resourceUsage": number,
    "bottlenecks": ["string"]
  },
  "optimizations": [
    {
      "id": "string",
      "type": "parallelization" | "caching" | "batching" | "elimination" | "reordering",
      "target": "string",
      "description": "string",
      "expectedImprovement": {
        "duration": number,
        "resources": number,
        "reliability": number
      },
      "effort": "low" | "medium" | "high",
      "priority": number
    }
  ],
  "projectedState": {
    "avgDuration": number,
    "successRate": number,
    "resourceUsage": number,
    "improvement": number
  },
  "implementationPlan": [
    {
      "step": number,
      "optimization": "string",
      "action": "string",
      "dependencies": ["string"]
    }
  ],
  "risks": [
    {
      "description": "string",
      "probability": 0-100,
      "mitigation": "string"
    }
  ]
}`;
        userPrompt = `Optimiza proceso: ${workflowId}
Métricas actuales: ${JSON.stringify(context)}
Objetivos: ${JSON.stringify(params?.objectives)}`;
        break;

      case 'generate_integration':
        systemPrompt = `Eres un generador de integraciones que conecta sistemas y APIs.

CAPACIDADES:
- Generación de conectores API
- Mapeo de datos entre sistemas
- Transformación de formatos
- Autenticación y seguridad

RESPUESTA JSON:
{
  "integration": {
    "id": "string",
    "name": "string",
    "sourceSystem": "string",
    "targetSystem": "string",
    "type": "sync" | "async" | "streaming" | "batch"
  },
  "connection": {
    "source": {
      "type": "rest" | "graphql" | "database" | "file" | "queue",
      "endpoint": "string",
      "authentication": {
        "type": "oauth2" | "apiKey" | "basic" | "jwt",
        "config": {}
      }
    },
    "target": {
      "type": "rest" | "graphql" | "database" | "file" | "queue",
      "endpoint": "string",
      "authentication": {}
    }
  },
  "dataMapping": [
    {
      "sourceField": "string",
      "targetField": "string",
      "transformation": "string",
      "required": boolean
    }
  ],
  "syncConfig": {
    "frequency": "string",
    "mode": "full" | "incremental" | "realtime",
    "conflictResolution": "source_wins" | "target_wins" | "manual"
  },
  "errorHandling": {
    "retryPolicy": {},
    "deadLetterQueue": "string",
    "alerting": {}
  },
  "codeSnippets": {
    "source": "string",
    "transform": "string",
    "target": "string"
  }
}`;
        userPrompt = `Genera integración entre: ${JSON.stringify(context)}
Sistemas involucrados: ${JSON.stringify(params?.systems)}
Requisitos: ${JSON.stringify(params?.requirements)}`;
        break;

      case 'monitor_automations':
        systemPrompt = `Eres un monitor de automatizaciones que supervisa el estado y rendimiento.

CAPACIDADES:
- Monitoreo en tiempo real
- Alertas proactivas
- Análisis de tendencias
- Health checks

RESPUESTA JSON:
{
  "overview": {
    "totalAutomations": number,
    "activeExecutions": number,
    "successRate24h": number,
    "avgDuration": number,
    "healthScore": 0-100
  },
  "automations": [
    {
      "id": "string",
      "name": "string",
      "status": "healthy" | "warning" | "critical" | "inactive",
      "lastRun": "timestamp",
      "nextRun": "timestamp",
      "successRate": number,
      "avgDuration": number,
      "trend": "improving" | "stable" | "degrading"
    }
  ],
  "alerts": [
    {
      "id": "string",
      "automationId": "string",
      "severity": "info" | "warning" | "error" | "critical",
      "message": "string",
      "timestamp": "timestamp",
      "acknowledged": boolean
    }
  ],
  "metrics": {
    "executionsPerHour": number[],
    "errorRate": number[],
    "latency": number[]
  },
  "recommendations": [
    {
      "type": "optimization" | "maintenance" | "scaling",
      "target": "string",
      "action": "string",
      "priority": "high" | "medium" | "low"
    }
  ]
}`;
        userPrompt = `Monitorea automatizaciones: ${JSON.stringify(context)}
Período: ${JSON.stringify(params?.period)}
Filtros: ${JSON.stringify(params?.filters)}`;
        break;

      case 'handle_exception':
        systemPrompt = `Eres un manejador de excepciones inteligente que resuelve errores en automatizaciones.

CAPACIDADES:
- Diagnóstico de errores
- Sugerencias de corrección
- Recuperación automática
- Escalamiento inteligente

RESPUESTA JSON:
{
  "exception": {
    "id": "string",
    "type": "string",
    "message": "string",
    "source": "string",
    "timestamp": "timestamp",
    "severity": "low" | "medium" | "high" | "critical"
  },
  "diagnosis": {
    "rootCause": "string",
    "affectedComponents": ["string"],
    "impact": "string",
    "frequency": "isolated" | "recurring" | "pattern"
  },
  "resolution": {
    "automatic": boolean,
    "action": "retry" | "skip" | "rollback" | "manual" | "escalate",
    "steps": ["string"],
    "estimatedTime": "string"
  },
  "recovery": {
    "status": "pending" | "in_progress" | "completed" | "failed",
    "result": {},
    "rollbackAvailable": boolean
  },
  "prevention": {
    "suggestions": ["string"],
    "configChanges": {},
    "monitoring": ["string"]
  },
  "escalation": {
    "required": boolean,
    "level": number,
    "notifyUsers": ["string"],
    "deadline": "timestamp"
  }
}`;
        userPrompt = `Maneja excepción: ${JSON.stringify(context)}
Detalles del error: ${JSON.stringify(params?.error)}
Historial de ejecución: ${JSON.stringify(params?.history)}`;
        break;

      case 'batch_operations':
        systemPrompt = `Eres un procesador de operaciones batch que ejecuta acciones masivas eficientemente.

CAPACIDADES:
- Procesamiento paralelo
- Gestión de cola de trabajos
- Checkpointing y recuperación
- Throttling y rate limiting

RESPUESTA JSON:
{
  "batch": {
    "id": "string",
    "name": "string",
    "status": "queued" | "processing" | "completed" | "failed" | "partial",
    "priority": number
  },
  "operations": [
    {
      "id": "string",
      "type": "string",
      "status": "pending" | "processing" | "completed" | "failed",
      "input": {},
      "output": {},
      "duration": number
    }
  ],
  "progress": {
    "total": number,
    "completed": number,
    "failed": number,
    "remaining": number,
    "percentage": number,
    "eta": "timestamp"
  },
  "performance": {
    "throughput": number,
    "avgOperationTime": number,
    "parallelism": number,
    "memoryUsage": number
  },
  "errors": [
    {
      "operationId": "string",
      "error": "string",
      "retryable": boolean
    }
  ],
  "checkpoints": [
    {
      "position": number,
      "timestamp": "timestamp",
      "state": {}
    }
  ]
}`;
        userPrompt = `Procesa batch: ${JSON.stringify(context)}
Operaciones: ${JSON.stringify(params?.operations)}
Configuración: ${JSON.stringify(params?.config)}`;
        break;

      case 'intelligent_routing':
        systemPrompt = `Eres un sistema de routing inteligente que dirige tareas al recurso óptimo.

CAPACIDADES:
- Evaluación de capacidad y carga
- Matching de habilidades
- Balanceo de carga
- Optimización de SLAs

RESPUESTA JSON:
{
  "routing": {
    "taskId": "string",
    "taskType": "string",
    "assignedTo": "string",
    "confidence": 0-100,
    "reason": "string"
  },
  "candidates": [
    {
      "id": "string",
      "name": "string",
      "type": "user" | "team" | "system" | "queue",
      "score": 0-100,
      "availability": 0-100,
      "skills": ["string"],
      "currentLoad": number,
      "avgResponseTime": number
    }
  ],
  "factors": [
    {
      "name": "string",
      "weight": number,
      "value": number,
      "impact": "positive" | "negative" | "neutral"
    }
  ],
  "sla": {
    "target": "timestamp",
    "probability": 0-100,
    "risk": "low" | "medium" | "high"
  },
  "alternatives": [
    {
      "assignee": "string",
      "tradeoffs": "string"
    }
  ],
  "loadBalancing": {
    "currentDistribution": {},
    "recommendedDistribution": {},
    "rebalanceNeeded": boolean
  }
}`;
        userPrompt = `Rutea tarea: ${JSON.stringify(context)}
Recursos disponibles: ${JSON.stringify(params?.resources)}
Criterios de routing: ${JSON.stringify(params?.criteria)}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[automation-orchestrator] Processing: ${action}`);

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
          error: 'Rate limit exceeded',
          message: 'Demasiadas solicitudes. Intenta más tarde.'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
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
      console.error('[automation-orchestrator] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[automation-orchestrator] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[automation-orchestrator] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
