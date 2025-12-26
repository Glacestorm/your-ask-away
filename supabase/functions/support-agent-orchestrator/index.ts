import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrchestratorRequest {
  action: 'analyze_issue' | 'select_agents' | 'plan_resolution' | 'coordinate_agents' | 'evaluate_outcome';
  sessionId?: string;
  ticketId?: string;
  issueContext?: {
    title: string;
    description: string;
    category: string;
    priority: string;
    customerHistory?: unknown[];
  };
  agentResults?: Record<string, unknown>;
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, sessionId, ticketId, issueContext, agentResults } = await req.json() as OrchestratorRequest;

    console.log(`[support-agent-orchestrator] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'analyze_issue':
        systemPrompt = `Eres un coordinador experto de agentes de soporte técnico. Tu rol es analizar problemas reportados y determinar la mejor estrategia de resolución.

CONTEXTO DEL ROL:
- Coordinas múltiples agentes especializados: DiagnosticAgent, ResolutionAgent, DocumentationAgent, EscalationAgent, TriageAgent
- Debes determinar qué agentes activar y en qué orden
- Priorizas resolución automática cuando la confianza es alta (>85%)

FORMATO DE RESPUESTA (JSON estricto):
{
  "issueAnalysis": {
    "category": "string",
    "severity": "low" | "medium" | "high" | "critical",
    "complexity": 1-5,
    "estimatedResolutionTime": "minutes",
    "keySymptoms": ["string"],
    "possibleCauses": ["string"]
  },
  "recommendedAgents": [
    {
      "agentKey": "string",
      "priority": 1-5,
      "taskDescription": "string",
      "expectedOutput": "string"
    }
  ],
  "autoResolutionPossible": boolean,
  "confidenceScore": 0-100,
  "escalationRequired": boolean,
  "reasoning": "string"
}`;

        userPrompt = `Analiza este problema de soporte y determina la estrategia de resolución:

TICKET:
${JSON.stringify(issueContext, null, 2)}

Proporciona un análisis detallado y los agentes recomendados para resolver este problema.`;
        break;

      case 'select_agents':
        systemPrompt = `Eres un orquestador de agentes de soporte. Selecciona los agentes óptimos para resolver un problema.

AGENTES DISPONIBLES:
- diagnostic_agent: Analiza logs, métricas, estados del sistema
- resolution_agent: Ejecuta scripts y acciones de resolución
- documentation_agent: Documenta soluciones y actualiza KB
- escalation_agent: Evalúa necesidad de escalación humana
- triage_agent: Prioriza y categoriza tickets

FORMATO DE RESPUESTA (JSON estricto):
{
  "selectedAgents": [
    {
      "agentKey": "string",
      "executionOrder": 1-5,
      "parallelizable": boolean,
      "dependencies": ["agentKey"],
      "parameters": {},
      "timeoutSeconds": number
    }
  ],
  "executionPlan": {
    "phases": [
      {
        "phaseNumber": 1,
        "agents": ["agentKey"],
        "objective": "string",
        "successCriteria": "string"
      }
    ]
  },
  "fallbackStrategy": {
    "onDiagnosticFailure": "string",
    "onResolutionFailure": "string",
    "maxRetries": number
  }
}`;

        userPrompt = `Basándote en este análisis del problema, selecciona los agentes óptimos:

${JSON.stringify(issueContext, null, 2)}

Crea un plan de ejecución detallado.`;
        break;

      case 'plan_resolution':
        systemPrompt = `Eres un planificador de resolución de problemas técnicos. Crea planes de acción detallados.

FORMATO DE RESPUESTA (JSON estricto):
{
  "resolutionPlan": {
    "summary": "string",
    "steps": [
      {
        "stepNumber": 1,
        "action": "string",
        "agent": "agentKey",
        "parameters": {},
        "expectedDuration": "seconds",
        "rollbackAction": "string",
        "verificationMethod": "string"
      }
    ],
    "estimatedTotalTime": "minutes",
    "riskAssessment": {
      "level": "low" | "medium" | "high",
      "factors": ["string"],
      "mitigations": ["string"]
    }
  },
  "preConditions": ["string"],
  "postConditions": ["string"],
  "successMetrics": ["string"]
}`;

        userPrompt = `Crea un plan de resolución detallado para este problema:

${JSON.stringify(issueContext, null, 2)}

Resultados de agentes previos:
${JSON.stringify(agentResults, null, 2)}`;
        break;

      case 'coordinate_agents':
        systemPrompt = `Eres un coordinador en tiempo real de agentes de soporte. Evalúas resultados y ajustas la estrategia.

FORMATO DE RESPUESTA (JSON estricto):
{
  "coordinationDecision": {
    "continueExecution": boolean,
    "nextAgent": "agentKey" | null,
    "adjustedParameters": {},
    "escalate": boolean,
    "reason": "string"
  },
  "progressUpdate": {
    "completedSteps": number,
    "totalSteps": number,
    "currentPhase": "string",
    "estimatedRemaining": "minutes"
  },
  "intermediateResults": {
    "findings": ["string"],
    "actionsExecuted": ["string"],
    "issuesDetected": ["string"]
  },
  "confidence": {
    "current": 0-100,
    "trend": "increasing" | "stable" | "decreasing",
    "factors": ["string"]
  }
}`;

        userPrompt = `Evalúa el progreso actual y decide los próximos pasos:

Sesión: ${sessionId}
Resultados actuales:
${JSON.stringify(agentResults, null, 2)}

Contexto original:
${JSON.stringify(issueContext, null, 2)}`;
        break;

      case 'evaluate_outcome':
        systemPrompt = `Eres un evaluador de resultados de soporte técnico. Analiza el éxito de la resolución.

FORMATO DE RESPUESTA (JSON estricto):
{
  "outcomeEvaluation": {
    "resolved": boolean,
    "resolutionQuality": 1-5,
    "customerSatisfactionPrediction": 1-5,
    "timeToResolution": "minutes",
    "automationLevel": "full" | "partial" | "manual"
  },
  "learnings": {
    "successFactors": ["string"],
    "improvementAreas": ["string"],
    "patternIdentified": boolean,
    "patternDescription": "string",
    "knowledgeBaseUpdate": {
      "required": boolean,
      "suggestedArticle": "string"
    }
  },
  "feedbackForAgents": [
    {
      "agentKey": "string",
      "performanceScore": 0-100,
      "feedback": "string",
      "adjustmentRecommended": boolean
    }
  ],
  "nextBestActions": ["string"]
}`;

        userPrompt = `Evalúa el resultado de esta sesión de soporte:

Sesión: ${sessionId}
Contexto original:
${JSON.stringify(issueContext, null, 2)}

Resultados finales:
${JSON.stringify(agentResults, null, 2)}`;
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
      console.error('[support-agent-orchestrator] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    // Log orchestration action
    if (sessionId) {
      await supabase.from('support_agent_tasks').insert([{
        orchestration_session_id: sessionId,
        agent_id: null,
        task_description: `Orchestrator action: ${action}`,
        status: 'completed',
        result_data: result
      }]);
    }

    console.log(`[support-agent-orchestrator] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[support-agent-orchestrator] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
