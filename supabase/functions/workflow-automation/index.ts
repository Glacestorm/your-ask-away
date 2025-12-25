import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkflowRequest {
  action: 'list_workflows' | 'create_workflow' | 'execute_workflow' | 'get_executions' | 'toggle_workflow';
  context?: Record<string, unknown>;
  workflow?: Record<string, unknown>;
  workflowId?: string;
  inputData?: Record<string, unknown>;
  isActive?: boolean;
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

    const { action, context, workflow, workflowId, inputData, isActive } = await req.json() as WorkflowRequest;

    console.log(`[workflow-automation] Action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'list_workflows':
        systemPrompt = `Eres un gestor de workflows empresariales que genera datos de automatización.

FORMATO DE RESPUESTA (JSON estricto):
{
  "workflows": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "trigger_type": "manual|scheduled|event|condition",
      "trigger_config": {},
      "steps": [],
      "is_active": boolean,
      "last_run_at": "ISO date o null",
      "run_count": number,
      "success_rate": 0-100,
      "created_at": "ISO date",
      "updated_at": "ISO date"
    }
  ]
}`;
        userPrompt = `Genera 6-8 workflows empresariales típicos para automatización (onboarding, notificaciones, reportes, sincronización, alertas, etc). Contexto: ${JSON.stringify(context || {})}`;
        break;

      case 'create_workflow':
        systemPrompt = `Eres un diseñador de workflows que valida y crea flujos de trabajo.

FORMATO DE RESPUESTA (JSON estricto):
{
  "workflow": {
    "id": "uuid generado",
    "name": "string",
    "description": "string",
    "trigger_type": "string",
    "trigger_config": {},
    "steps": [],
    "is_active": false,
    "run_count": 0,
    "success_rate": 0,
    "created_at": "ISO date",
    "updated_at": "ISO date"
  },
  "validation": {
    "is_valid": boolean,
    "warnings": []
  }
}`;
        userPrompt = `Valida y crea este workflow: ${JSON.stringify(workflow)}`;
        break;

      case 'execute_workflow':
        systemPrompt = `Eres un ejecutor de workflows que simula la ejecución paso a paso.

FORMATO DE RESPUESTA (JSON estricto):
{
  "execution": {
    "id": "uuid",
    "workflow_id": "string",
    "status": "running",
    "started_at": "ISO date",
    "current_step": 1,
    "steps_completed": 0,
    "execution_log": []
  },
  "estimated_completion": "ISO date"
}`;
        userPrompt = `Inicia ejecución del workflow ${workflowId} con datos: ${JSON.stringify(inputData || {})}`;
        break;

      case 'get_executions':
        systemPrompt = `Eres un monitor de ejecuciones que genera historial de workflows.

FORMATO DE RESPUESTA (JSON estricto):
{
  "executions": [
    {
      "id": "uuid",
      "workflow_id": "string",
      "status": "pending|running|completed|failed|cancelled",
      "started_at": "ISO date",
      "completed_at": "ISO date o null",
      "current_step": number,
      "steps_completed": number,
      "error_message": "string o null",
      "execution_log": []
    }
  ]
}`;
        userPrompt = `Genera historial de 10-15 ejecuciones ${workflowId ? `para workflow ${workflowId}` : 'recientes'}`;
        break;

      case 'toggle_workflow':
        return new Response(JSON.stringify({
          success: true,
          workflow_id: workflowId,
          is_active: isActive,
          message: isActive ? 'Workflow activado' : 'Workflow desactivado'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

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
          success: false,
          error: 'Rate limit exceeded' 
        }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
    } catch {
      result = { rawContent: content, parseError: true };
    }

    console.log(`[workflow-automation] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[workflow-automation] Error:', message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
