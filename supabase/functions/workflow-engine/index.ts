import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkflowRequest {
  action: 'get_workflows' | 'create_workflow' | 'execute_workflow' | 'pause_workflow' | 'resume_workflow' | 'generate_workflow' | 'create_rule';
  context?: Record<string, unknown>;
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

    const { action, context, params } = await req.json() as WorkflowRequest;
    console.log(`[workflow-engine] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_workflows':
        systemPrompt = `Eres un motor de automatización de workflows empresariales.

CONTEXTO DEL ROL:
- Gestión de workflows automatizados
- Reglas de negocio dinámicas
- Ejecución y monitoreo de procesos

FORMATO DE RESPUESTA (JSON estricto):
{
  "workflows": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "status": "draft" | "active" | "paused" | "archived",
      "trigger": {"type": "event" | "schedule" | "manual" | "condition", "config": {}, "description": "string"},
      "steps": [{"id": "string", "name": "string", "type": "string", "config": {}, "order": number}],
      "createdAt": "ISO timestamp",
      "updatedAt": "ISO timestamp",
      "executionCount": number,
      "successRate": number
    }
  ],
  "rules": [
    {
      "id": "uuid",
      "name": "string",
      "condition": "string",
      "actions": ["string"],
      "priority": number,
      "enabled": boolean,
      "triggerCount": number
    }
  ],
  "executions": []
}`;
        userPrompt = `Lista los workflows disponibles con contexto: ${JSON.stringify(context)}`;
        break;

      case 'create_workflow':
        systemPrompt = `Eres un diseñador de workflows empresariales.

FORMATO DE RESPUESTA (JSON estricto):
{
  "workflow": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "status": "draft",
    "trigger": {"type": "string", "config": {}, "description": "string"},
    "steps": [],
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp",
    "executionCount": 0,
    "successRate": 0
  }
}`;
        userPrompt = `Crea un workflow con: ${JSON.stringify(params)}`;
        break;

      case 'execute_workflow':
        systemPrompt = `Eres un ejecutor de workflows empresariales.

FORMATO DE RESPUESTA (JSON estricto):
{
  "execution": {
    "id": "uuid",
    "workflowId": "string",
    "workflowName": "string",
    "status": "running",
    "currentStep": "string",
    "startedAt": "ISO timestamp",
    "logs": [{"timestamp": "ISO timestamp", "stepId": "string", "stepName": "string", "status": "started", "message": "string"}]
  }
}`;
        userPrompt = `Ejecuta el workflow ${params?.workflowId} con datos: ${JSON.stringify(params?.inputData)}`;
        break;

      case 'pause_workflow':
      case 'resume_workflow':
        systemPrompt = `Eres un controlador de estados de workflows.

FORMATO DE RESPUESTA (JSON estricto):
{
  "success": boolean,
  "workflowId": "string",
  "newStatus": "paused" | "active",
  "message": "string"
}`;
        userPrompt = `${action === 'pause_workflow' ? 'Pausa' : 'Reanuda'} el workflow: ${params?.workflowId}`;
        break;

      case 'generate_workflow':
        systemPrompt = `Eres un generador de workflows con IA avanzada.

CAPACIDADES:
- Interpretar descripciones en lenguaje natural
- Generar workflows optimizados automáticamente
- Sugerir mejoras y optimizaciones
- Crear reglas de automatización inteligentes

FORMATO DE RESPUESTA (JSON estricto):
{
  "workflow": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "status": "draft",
    "trigger": {"type": "string", "config": {}, "description": "string"},
    "steps": [
      {
        "id": "uuid",
        "name": "string",
        "type": "action" | "condition" | "delay" | "approval" | "notification" | "integration",
        "config": {},
        "order": number
      }
    ],
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp",
    "executionCount": 0,
    "successRate": 0,
    "aiSuggestions": ["string"]
  }
}`;
        userPrompt = `Genera un workflow basado en: "${params?.description}". Contexto adicional: ${JSON.stringify(params?.context)}`;
        break;

      case 'create_rule':
        systemPrompt = `Eres un creador de reglas de automatización empresarial.

FORMATO DE RESPUESTA (JSON estricto):
{
  "rule": {
    "id": "uuid",
    "name": "string",
    "condition": "string",
    "actions": ["string"],
    "priority": number,
    "enabled": true,
    "triggerCount": 0
  }
}`;
        userPrompt = `Crea una regla de automatización: ${JSON.stringify(params)}`;
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
      console.error('[workflow-engine] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[workflow-engine] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[workflow-engine] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
