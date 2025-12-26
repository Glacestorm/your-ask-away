import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExecutionRequest {
  action: 'execute' | 'validate' | 'rollback' | 'simulate';
  executionId?: string;
  actionId: string;
  sessionId: string;
  parameters?: Record<string, unknown>;
  dryRun?: boolean;
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

    const { action, executionId, actionId, sessionId, parameters, dryRun } = await req.json() as ExecutionRequest;

    console.log(`[execute-support-action] Processing: ${action} for action ${actionId}`);

    // Fetch action definition
    const { data: actionDef, error: actionError } = await supabase
      .from('support_executable_actions')
      .select('*')
      .eq('id', actionId)
      .single();

    if (actionError || !actionDef) {
      throw new Error(`Action not found: ${actionId}`);
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'validate':
        systemPrompt = `Eres un validador de acciones de soporte técnico. Evalúas si una acción es segura para ejecutar.

FORMATO DE RESPUESTA (JSON estricto):
{
  "validation": {
    "isValid": boolean,
    "riskLevel": "low" | "medium" | "high" | "critical",
    "issues": ["string"],
    "warnings": ["string"],
    "recommendations": ["string"]
  },
  "preflightChecks": {
    "systemState": "ready" | "busy" | "unstable",
    "prerequisites": [
      {
        "check": "string",
        "passed": boolean,
        "message": "string"
      }
    ]
  },
  "estimatedImpact": {
    "affectedSystems": ["string"],
    "downtime": "none" | "minimal" | "significant",
    "dataChanges": boolean,
    "reversibility": "full" | "partial" | "none"
  },
  "approvalRequired": boolean,
  "approvalReason": "string"
}`;

        userPrompt = `Valida esta acción antes de ejecutar:

ACCIÓN: ${actionDef.action_name}
DESCRIPCIÓN: ${actionDef.description}
CATEGORÍA: ${actionDef.action_category}
NIVEL DE RIESGO: ${actionDef.risk_level}
SCRIPT: ${JSON.stringify(actionDef.script_template)}
PARÁMETROS: ${JSON.stringify(parameters)}

Evalúa si es seguro ejecutar esta acción.`;
        break;

      case 'execute':
        systemPrompt = `Eres un motor de ejecución de acciones de soporte técnico. Simulas la ejecución de scripts y acciones.

IMPORTANTE: No ejecutas código real, solo simulas y describes qué haría la acción.

FORMATO DE RESPUESTA (JSON estricto):
{
  "execution": {
    "status": "success" | "partial" | "failed",
    "startTime": "ISO timestamp",
    "endTime": "ISO timestamp",
    "durationMs": number
  },
  "steps": [
    {
      "stepNumber": 1,
      "action": "string",
      "status": "completed" | "failed" | "skipped",
      "output": "string",
      "error": "string" | null
    }
  ],
  "result": {
    "summary": "string",
    "changesApplied": ["string"],
    "outputData": {},
    "metricsCollected": {}
  },
  "rollbackData": {
    "available": boolean,
    "snapshotId": "string",
    "restoreSteps": ["string"]
  },
  "verification": {
    "passed": boolean,
    "checks": [
      {
        "name": "string",
        "result": "pass" | "fail" | "warning",
        "message": "string"
      }
    ]
  }
}`;

        userPrompt = `${dryRun ? 'SIMULA (dry-run)' : 'Ejecuta'} esta acción de soporte:

ACCIÓN: ${actionDef.action_name}
DESCRIPCIÓN: ${actionDef.description}
SCRIPT TEMPLATE:
${JSON.stringify(actionDef.script_template, null, 2)}

PARÁMETROS PROPORCIONADOS:
${JSON.stringify(parameters, null, 2)}

${dryRun ? 'Describe qué haría esta acción sin ejecutarla realmente.' : 'Simula la ejecución y describe los resultados esperados.'}`;
        break;

      case 'rollback':
        systemPrompt = `Eres un sistema de rollback para acciones de soporte. Reviertes acciones ejecutadas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "rollback": {
    "status": "success" | "partial" | "failed",
    "executionId": "string",
    "originalAction": "string"
  },
  "revertedChanges": [
    {
      "change": "string",
      "reverted": boolean,
      "method": "string",
      "verification": "string"
    }
  ],
  "systemState": {
    "beforeRollback": "string",
    "afterRollback": "string",
    "verified": boolean
  },
  "warnings": ["string"],
  "nextSteps": ["string"]
}`;

        userPrompt = `Revierte la ejecución ${executionId} de la acción:

ACCIÓN: ${actionDef.action_name}
PARÁMETROS ORIGINALES: ${JSON.stringify(parameters)}

Describe el proceso de rollback y verifica el estado del sistema.`;
        break;

      case 'simulate':
        systemPrompt = `Eres un simulador de acciones de soporte. Predices el resultado de una acción sin ejecutarla.

FORMATO DE RESPUESTA (JSON estricto):
{
  "simulation": {
    "predictedOutcome": "success" | "partial_success" | "failure",
    "confidenceLevel": 0-100,
    "estimatedDuration": "seconds"
  },
  "expectedChanges": [
    {
      "target": "string",
      "change": "string",
      "impact": "low" | "medium" | "high"
    }
  ],
  "potentialIssues": [
    {
      "issue": "string",
      "probability": 0-100,
      "mitigation": "string"
    }
  ],
  "alternativeActions": [
    {
      "action": "string",
      "reason": "string",
      "expectedBenefit": "string"
    }
  ],
  "recommendation": {
    "proceed": boolean,
    "reason": "string",
    "conditions": ["string"]
  }
}`;

        userPrompt = `Simula el resultado de esta acción:

ACCIÓN: ${actionDef.action_name}
DESCRIPCIÓN: ${actionDef.description}
SCRIPT: ${JSON.stringify(actionDef.script_template)}
PARÁMETROS: ${JSON.stringify(parameters)}

Predice el resultado sin ejecutar la acción.`;
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
        temperature: 0.5,
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
      console.error('[execute-support-action] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    // Log execution if not dry run
    if (!dryRun && action === 'execute') {
      const execStatus = result.execution?.status === 'success' ? 'completed' : 'failed';
      
      await supabase.from('support_action_executions').insert([{
        action_id: actionId,
        orchestration_session_id: sessionId,
        status: execStatus,
        input_parameters: parameters,
        output_result: result.result || null,
        execution_time_ms: result.execution?.durationMs || 0,
        rollback_data: result.rollbackData || null,
        error_message: result.steps?.find((s: { status: string }) => s.status === 'failed')?.error || null
      }]);
    }

    console.log(`[execute-support-action] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      actionDefinition: {
        name: actionDef.action_name,
        category: actionDef.action_category,
        riskLevel: actionDef.risk_level
      },
      data: result,
      dryRun: dryRun || false,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[execute-support-action] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
