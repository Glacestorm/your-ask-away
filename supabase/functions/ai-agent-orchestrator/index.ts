import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentOrchestratorRequest {
  action: 
    | 'create_agent'
    | 'execute_goal'
    | 'agent_collaboration'
    | 'get_agent_memory'
    | 'update_agent_memory'
    | 'list_agents'
    | 'get_agent_status'
    | 'pause_agent'
    | 'resume_agent'
    | 'get_execution_history';
  agentConfig?: {
    name: string;
    type: 'analyst' | 'executor' | 'monitor' | 'optimizer' | 'communicator';
    expertise: string[];
    personality?: string;
    constraints?: string[];
    maxActionsPerHour?: number;
  };
  goal?: {
    description: string;
    targetMetrics?: Record<string, unknown>;
    deadline?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    constraints?: string[];
  };
  collaborationParams?: {
    agentIds: string[];
    taskDescription: string;
    coordinationType: 'sequential' | 'parallel' | 'hierarchical';
  };
  memoryParams?: {
    agentId: string;
    key?: string;
    value?: unknown;
    context?: string;
  };
  agentId?: string;
  context?: {
    userId?: string;
    moduleKey?: string;
    currentState?: Record<string, unknown>;
    recentEvents?: Array<{ type: string; data: unknown; timestamp: string }>;
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

    const { action, agentConfig, goal, collaborationParams, memoryParams, agentId, context } = await req.json() as AgentOrchestratorRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'create_agent':
        systemPrompt = `Eres un sistema de creación de agentes IA autónomos para plataformas enterprise.

CONTEXTO DEL ROL:
- Creas agentes especializados con personalidades y capacidades definidas
- Cada agente tiene un área de expertise y restricciones claras
- Los agentes pueden aprender y adaptar su comportamiento

TIPOS DE AGENTES:
1. ANALYST: Analiza datos, genera insights, identifica patrones
2. EXECUTOR: Ejecuta acciones, automatiza tareas, implementa cambios
3. MONITOR: Vigila métricas, detecta anomalías, alerta sobre problemas
4. OPTIMIZER: Optimiza rendimiento, sugiere mejoras, ajusta configuraciones
5. COMMUNICATOR: Genera reportes, notifica usuarios, coordina equipos

FORMATO DE RESPUESTA (JSON estricto):
{
  "agent": {
    "id": "uuid",
    "name": "string",
    "type": "analyst" | "executor" | "monitor" | "optimizer" | "communicator",
    "expertise": ["string"],
    "personality": {
      "traits": ["string"],
      "communicationStyle": "formal" | "casual" | "technical" | "friendly",
      "decisionMaking": "cautious" | "balanced" | "aggressive"
    },
    "capabilities": [
      {
        "name": "string",
        "description": "string",
        "requiredPermissions": ["string"],
        "riskLevel": "low" | "medium" | "high"
      }
    ],
    "constraints": ["string"],
    "maxActionsPerHour": 0,
    "memoryCapacity": "short_term" | "long_term" | "persistent",
    "learningEnabled": boolean,
    "status": "created" | "active" | "paused" | "disabled"
  },
  "initialization": {
    "systemPrompt": "string",
    "defaultContext": {},
    "startupTasks": ["string"]
  }
}`;

        userPrompt = `Crea un nuevo agente IA con esta configuración:

CONFIGURACIÓN:
${JSON.stringify(agentConfig, null, 2)}

CONTEXTO DEL SISTEMA:
${JSON.stringify(context, null, 2)}

Genera un agente completo con personalidad, capacidades y restricciones apropiadas.`;
        break;

      case 'execute_goal':
        systemPrompt = `Eres un sistema de planificación y ejecución de objetivos para agentes IA.

CONTEXTO DEL ROL:
- Recibes un objetivo de alto nivel y lo descompones en pasos ejecutables
- Planificas la secuencia óptima de acciones
- Evalúas riesgos y preparas planes de contingencia
- Monitoreas el progreso y adaptas el plan si es necesario

PROCESO DE EJECUCIÓN:
1. Análisis del objetivo
2. Descomposición en sub-objetivos
3. Planificación de acciones
4. Evaluación de riesgos
5. Ejecución secuencial o paralela
6. Validación de resultados
7. Aprendizaje y actualización de memoria

FORMATO DE RESPUESTA (JSON estricto):
{
  "goalAnalysis": {
    "originalGoal": "string",
    "interpretation": "string",
    "feasibility": 0-100,
    "estimatedDuration": "string",
    "resourcesRequired": ["string"]
  },
  "executionPlan": {
    "phases": [
      {
        "phaseId": "string",
        "name": "string",
        "description": "string",
        "steps": [
          {
            "stepId": "string",
            "action": "string",
            "description": "string",
            "agentCapability": "string",
            "inputs": {},
            "expectedOutputs": {},
            "dependencies": ["stepId"],
            "estimatedTime": "string",
            "riskLevel": "low" | "medium" | "high",
            "rollbackAction": "string | null"
          }
        ],
        "successCriteria": ["string"],
        "failureHandling": "retry" | "skip" | "abort" | "escalate"
      }
    ],
    "criticalPath": ["stepId"],
    "parallelizableSteps": [["stepId"]],
    "checkpoints": [
      {
        "afterStep": "stepId",
        "validation": "string",
        "continueIf": "string"
      }
    ]
  },
  "riskAssessment": {
    "overallRisk": "low" | "medium" | "high",
    "risks": [
      {
        "riskId": "string",
        "description": "string",
        "probability": 0-100,
        "impact": "low" | "medium" | "high",
        "mitigation": "string"
      }
    ],
    "contingencyPlans": [
      {
        "triggeredBy": "string",
        "actions": ["string"]
      }
    ]
  },
  "metrics": {
    "targetMetrics": {},
    "measurementPoints": ["string"],
    "successThresholds": {}
  }
}`;

        userPrompt = `Planifica la ejecución de este objetivo:

OBJETIVO:
${JSON.stringify(goal, null, 2)}

CONTEXTO ACTUAL:
${JSON.stringify(context, null, 2)}

AGENTE EJECUTOR:
${agentId || 'Asignar automáticamente'}

Genera un plan de ejecución detallado con fases, pasos y evaluación de riesgos.`;
        break;

      case 'agent_collaboration':
        systemPrompt = `Eres un sistema de coordinación multi-agente para tareas complejas.

CONTEXTO DEL ROL:
- Coordinas múltiples agentes IA para completar tareas complejas
- Gestionas la comunicación y el paso de información entre agentes
- Resuelves conflictos y sincronizas resultados
- Optimizas la distribución de trabajo según capacidades

TIPOS DE COORDINACIÓN:
1. SEQUENTIAL: Agentes trabajan uno tras otro, pasando resultados
2. PARALLEL: Agentes trabajan simultáneamente en subtareas independientes
3. HIERARCHICAL: Un agente líder delega y coordina a subordinados

FORMATO DE RESPUESTA (JSON estricto):
{
  "collaboration": {
    "sessionId": "string",
    "taskDescription": "string",
    "coordinationType": "sequential" | "parallel" | "hierarchical",
    "participants": [
      {
        "agentId": "string",
        "role": "leader" | "worker" | "validator" | "observer",
        "assignedSubtasks": ["string"],
        "dependencies": ["agentId"],
        "communicatesWiths": ["agentId"]
      }
    ],
    "workflow": [
      {
        "stepId": "string",
        "agentId": "string",
        "action": "string",
        "inputsFrom": [{"agentId": "string", "outputKey": "string"}],
        "outputsTo": [{"agentId": "string", "inputKey": "string"}],
        "timeout": "string"
      }
    ],
    "synchronizationPoints": [
      {
        "name": "string",
        "waitFor": ["agentId"],
        "aggregation": "all" | "any" | "majority"
      }
    ],
    "conflictResolution": {
      "strategy": "leader_decides" | "voting" | "priority_based" | "merge",
      "fallback": "string"
    }
  },
  "expectedOutcome": {
    "deliverables": ["string"],
    "qualityCriteria": ["string"],
    "estimatedCompletion": "string"
  }
}`;

        userPrompt = `Coordina una colaboración multi-agente:

PARÁMETROS DE COLABORACIÓN:
${JSON.stringify(collaborationParams, null, 2)}

CONTEXTO:
${JSON.stringify(context, null, 2)}

Diseña un flujo de colaboración eficiente entre los agentes.`;
        break;

      case 'get_agent_memory':
        systemPrompt = `Eres un sistema de gestión de memoria persistente para agentes IA.

FORMATO DE RESPUESTA (JSON estricto):
{
  "memory": {
    "agentId": "string",
    "shortTerm": {
      "recentActions": [],
      "currentContext": {},
      "workingMemory": {}
    },
    "longTerm": {
      "learnedPatterns": [],
      "successfulStrategies": [],
      "failedAttempts": [],
      "userPreferences": {}
    },
    "episodic": {
      "significantEvents": [],
      "milestones": []
    },
    "semantic": {
      "domainKnowledge": {},
      "relationships": []
    }
  },
  "insights": {
    "frequentTasks": [],
    "performanceTrends": {},
    "recommendations": []
  }
}`;

        userPrompt = `Recupera la memoria del agente:

AGENTE ID: ${memoryParams?.agentId || agentId}
CLAVE ESPECÍFICA: ${memoryParams?.key || 'todas'}
CONTEXTO: ${memoryParams?.context || 'general'}

Proporciona la memoria relevante con insights derivados.`;
        break;

      case 'update_agent_memory':
        systemPrompt = `Eres un sistema de actualización de memoria para agentes IA.

FORMATO DE RESPUESTA (JSON estricto):
{
  "update": {
    "agentId": "string",
    "memoryType": "short_term" | "long_term" | "episodic" | "semantic",
    "key": "string",
    "previousValue": {},
    "newValue": {},
    "reason": "string",
    "timestamp": "string"
  },
  "sideEffects": {
    "updatedPatterns": [],
    "newInsights": [],
    "triggeredActions": []
  }
}`;

        userPrompt = `Actualiza la memoria del agente:

AGENTE ID: ${memoryParams?.agentId}
CLAVE: ${memoryParams?.key}
VALOR: ${JSON.stringify(memoryParams?.value, null, 2)}
CONTEXTO: ${memoryParams?.context}

Actualiza la memoria y calcula efectos secundarios.`;
        break;

      case 'list_agents':
        systemPrompt = `Eres un sistema de gestión de agentes IA.

FORMATO DE RESPUESTA (JSON estricto):
{
  "agents": [
    {
      "id": "string",
      "name": "string",
      "type": "string",
      "status": "active" | "paused" | "disabled" | "error",
      "expertise": ["string"],
      "currentTask": "string | null",
      "actionsToday": 0,
      "successRate": 0-100,
      "lastActive": "string",
      "health": {
        "memoryUsage": 0-100,
        "responseTime": "string",
        "errorRate": 0-100
      }
    }
  ],
  "summary": {
    "total": 0,
    "active": 0,
    "paused": 0,
    "byType": {}
  }
}`;

        userPrompt = `Lista todos los agentes disponibles:

CONTEXTO:
${JSON.stringify(context, null, 2)}

Proporciona el estado actual de todos los agentes.`;
        break;

      case 'get_agent_status':
        systemPrompt = `Eres un sistema de monitoreo de estado de agentes IA.

FORMATO DE RESPUESTA (JSON estricto):
{
  "status": {
    "agentId": "string",
    "name": "string",
    "state": "idle" | "working" | "waiting" | "error" | "paused",
    "currentTask": {
      "taskId": "string",
      "description": "string",
      "progress": 0-100,
      "startedAt": "string",
      "estimatedCompletion": "string"
    },
    "queue": [
      {
        "taskId": "string",
        "priority": 0,
        "description": "string"
      }
    ],
    "performance": {
      "tasksCompleted": 0,
      "tasksToday": 0,
      "avgCompletionTime": "string",
      "successRate": 0-100,
      "errorRate": 0-100
    },
    "resources": {
      "memoryUsage": 0-100,
      "actionsRemaining": 0,
      "cooldownUntil": "string | null"
    },
    "recentActions": [
      {
        "actionId": "string",
        "type": "string",
        "result": "success" | "failure",
        "timestamp": "string"
      }
    ]
  }
}`;

        userPrompt = `Obtén el estado detallado del agente:

AGENTE ID: ${agentId}

Proporciona métricas de rendimiento y estado actual.`;
        break;

      case 'pause_agent':
        systemPrompt = `Eres un sistema de control de agentes IA.

FORMATO DE RESPUESTA (JSON estricto):
{
  "result": {
    "agentId": "string",
    "previousState": "string",
    "newState": "paused",
    "pausedAt": "string",
    "currentTaskHandling": "completed" | "suspended" | "cancelled",
    "suspendedTasks": [
      {
        "taskId": "string",
        "progress": 0-100,
        "canResume": boolean
      }
    ],
    "estimatedResumeImpact": "string"
  }
}`;

        userPrompt = `Pausa el agente:

AGENTE ID: ${agentId}
CONTEXTO: ${JSON.stringify(context, null, 2)}

Pausa el agente de forma segura preservando su estado.`;
        break;

      case 'resume_agent':
        systemPrompt = `Eres un sistema de control de agentes IA.

FORMATO DE RESPUESTA (JSON estricto):
{
  "result": {
    "agentId": "string",
    "previousState": "paused",
    "newState": "active",
    "resumedAt": "string",
    "restoredTasks": [
      {
        "taskId": "string",
        "resumeFrom": "string",
        "estimatedCompletion": "string"
      }
    ],
    "memoryRestored": boolean,
    "readinessCheck": {
      "passed": boolean,
      "issues": ["string"]
    }
  }
}`;

        userPrompt = `Reanuda el agente:

AGENTE ID: ${agentId}
CONTEXTO: ${JSON.stringify(context, null, 2)}

Reanuda el agente restaurando su estado y tareas pendientes.`;
        break;

      case 'get_execution_history':
        systemPrompt = `Eres un sistema de historial de ejecución de agentes IA.

FORMATO DE RESPUESTA (JSON estricto):
{
  "history": {
    "agentId": "string",
    "period": "string",
    "executions": [
      {
        "executionId": "string",
        "goalDescription": "string",
        "startedAt": "string",
        "completedAt": "string",
        "status": "success" | "partial" | "failed" | "cancelled",
        "stepsCompleted": 0,
        "totalSteps": 0,
        "outcome": "string",
        "metrics": {},
        "lessonsLearned": ["string"]
      }
    ],
    "statistics": {
      "totalExecutions": 0,
      "successRate": 0-100,
      "avgDuration": "string",
      "mostCommonGoals": ["string"],
      "frequentFailures": ["string"]
    },
    "trends": {
      "performanceOverTime": [],
      "learningProgress": 0-100
    }
  }
}`;

        userPrompt = `Obtén el historial de ejecución del agente:

AGENTE ID: ${agentId}
CONTEXTO: ${JSON.stringify(context, null, 2)}

Proporciona historial completo con estadísticas y tendencias.`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[ai-agent-orchestrator] Processing action: ${action}`);

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
      console.error('[ai-agent-orchestrator] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[ai-agent-orchestrator] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ai-agent-orchestrator] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
