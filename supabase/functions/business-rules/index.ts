import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BusinessRulesRequest {
  action: 'list_rules' | 'create_rule' | 'evaluate_rules' | 'update_rule' | 'delete_rule';
  context?: Record<string, unknown>;
  rule?: Record<string, unknown>;
  ruleId?: string;
  updates?: Record<string, unknown>;
  entityType?: string;
  entityData?: Record<string, unknown>;
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

    const { action, context, rule, ruleId, updates, entityType, entityData } = await req.json() as BusinessRulesRequest;

    console.log(`[business-rules] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'list_rules':
        systemPrompt = `Eres un gestor de reglas de negocio empresariales.

FORMATO DE RESPUESTA (JSON estricto):
{
  "rules": [
    {
      "id": "uuid",
      "name": "nombre de la regla",
      "description": "descripción",
      "category": "validation|calculation|automation|notification|access",
      "priority": número,
      "conditions": [
        {
          "id": "condition-uuid",
          "field": "campo",
          "operator": "equals|not_equals|greater_than|less_than|contains|in|between",
          "value": "valor",
          "logical_operator": "AND|OR"
        }
      ],
      "actions": [
        {
          "id": "action-uuid",
          "action_type": "set_value|send_notification|trigger_workflow|block|approve|escalate",
          "config": {},
          "order": número
        }
      ],
      "is_active": true,
      "effective_from": "ISO timestamp",
      "effective_until": "ISO timestamp o null",
      "created_at": "ISO timestamp",
      "updated_at": "ISO timestamp"
    }
  ]
}`;
        userPrompt = `Listar reglas de negocio. Contexto: ${JSON.stringify(context || {})}`;
        break;

      case 'create_rule':
        systemPrompt = `Eres un creador de reglas de negocio.

FORMATO DE RESPUESTA (JSON estricto):
{
  "rule": {
    "id": "nuevo-uuid",
    "name": "nombre",
    "description": "descripción",
    "category": "categoría",
    "priority": 1,
    "conditions": [],
    "actions": [],
    "is_active": false,
    "created_at": "ISO timestamp",
    "updated_at": "ISO timestamp"
  }
}`;
        userPrompt = `Crear regla de negocio: ${JSON.stringify(rule)}`;
        break;

      case 'evaluate_rules':
        systemPrompt = `Eres un evaluador de reglas de negocio.

FORMATO DE RESPUESTA (JSON estricto):
{
  "evaluations": [
    {
      "rule_id": "uuid",
      "rule_name": "nombre",
      "matched": true,
      "conditions_evaluated": [
        {
          "condition_id": "uuid",
          "result": true,
          "actual_value": "valor actual"
        }
      ],
      "actions_executed": ["acción1", "acción2"],
      "execution_time_ms": número
    }
  ],
  "summary": {
    "total_rules_evaluated": número,
    "rules_matched": número,
    "actions_executed": número
  }
}`;
        userPrompt = `Evaluar reglas para entidad tipo ${entityType} con datos: ${JSON.stringify(entityData)}`;
        break;

      case 'update_rule':
        systemPrompt = `Eres un actualizador de reglas de negocio.

FORMATO DE RESPUESTA (JSON estricto):
{
  "rule": {
    "id": "${ruleId}",
    "updated_fields": ["campo1", "campo2"],
    "updated_at": "ISO timestamp"
  }
}`;
        userPrompt = `Actualizar regla ${ruleId} con: ${JSON.stringify(updates)}`;
        break;

      case 'delete_rule':
        systemPrompt = `Eres un gestor de reglas de negocio.

FORMATO DE RESPUESTA (JSON estricto):
{
  "deleted_rule_id": "${ruleId}",
  "deleted_at": "ISO timestamp",
  "message": "Regla eliminada exitosamente"
}`;
        userPrompt = `Eliminar regla ${ruleId}`;
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
          success: false,
          error: 'Rate limit exceeded' 
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
    } catch {
      result = { rawContent: content, parseError: true };
    }

    console.log(`[business-rules] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[business-rules] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
