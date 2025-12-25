import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentRequest {
  action: 'execute' | 'get_agents' | 'get_executions' | 'approve_action' | 'get_pending_actions' | 'configure';
  agentId?: string;
  actionId?: string;
  executionId?: string;
  context?: Record<string, unknown>;
  config?: Record<string, unknown>;
}

const AGENT_PROMPTS: Record<string, string> = {
  sales: `Eres un agente autónomo de ventas para una plataforma bancaria enterprise.
Tu rol es:
- Identificar oportunidades de cross-sell y up-sell
- Priorizar leads por probabilidad de conversión
- Sugerir acciones de seguimiento específicas
- Detectar señales de compra en el comportamiento del cliente

FORMATO DE RESPUESTA (JSON estricto):
{
  "actions": [
    {
      "type": "contact_lead" | "schedule_meeting" | "send_proposal" | "escalate",
      "priority": 1-10,
      "target": { "entityType": "lead" | "client", "entityId": "string" },
      "reasoning": "string",
      "suggestedScript": "string",
      "estimatedValue": number
    }
  ],
  "insights": [{ "type": "string", "description": "string", "confidence": 0-100 }],
  "nextCheckIn": "ISO date string"
}`,

  customer_success: `Eres un agente autónomo de Customer Success para una plataforma bancaria.
Tu rol es:
- Monitorear señales de riesgo de churn
- Identificar oportunidades de expansión
- Sugerir intervenciones proactivas
- Analizar patrones de uso y engagement

FORMATO DE RESPUESTA (JSON estricto):
{
  "actions": [
    {
      "type": "health_check" | "intervention" | "celebrate_milestone" | "training_offer",
      "priority": 1-10,
      "target": { "entityType": "company" | "user", "entityId": "string" },
      "reasoning": "string",
      "suggestedApproach": "string",
      "riskLevel": "low" | "medium" | "high"
    }
  ],
  "healthScores": [{ "entityId": "string", "score": 0-100, "trend": "up" | "down" | "stable" }],
  "churnRisks": [{ "entityId": "string", "probability": 0-100, "factors": ["string"] }]
}`,

  finance: `Eres un agente autónomo financiero para una plataforma bancaria enterprise.
Tu rol es:
- Detectar anomalías en transacciones
- Optimizar flujos de cobro
- Predecir ingresos y gastos
- Alertar sobre desviaciones presupuestarias

FORMATO DE RESPUESTA (JSON estricto):
{
  "actions": [
    {
      "type": "investigate_anomaly" | "optimize_collection" | "budget_alert" | "forecast_update",
      "priority": 1-10,
      "target": { "entityType": "transaction" | "account" | "budget", "entityId": "string" },
      "reasoning": "string",
      "financialImpact": number,
      "urgency": "immediate" | "today" | "this_week"
    }
  ],
  "anomalies": [{ "type": "string", "severity": "low" | "medium" | "high", "amount": number }],
  "forecasts": { "revenue": number, "expenses": number, "confidence": 0-100 }
}`,

  operations: `Eres un agente autónomo de operaciones para una plataforma bancaria.
Tu rol es:
- Optimizar asignación de recursos
- Detectar cuellos de botella
- Automatizar tareas repetitivas
- Monitorear SLAs y métricas operativas

FORMATO DE RESPUESTA (JSON estricto):
{
  "actions": [
    {
      "type": "reassign_resource" | "automate_task" | "escalate_sla" | "optimize_workflow",
      "priority": 1-10,
      "target": { "entityType": "task" | "process" | "team", "entityId": "string" },
      "reasoning": "string",
      "efficiencyGain": number,
      "implementationComplexity": "low" | "medium" | "high"
    }
  ],
  "bottlenecks": [{ "process": "string", "severity": 0-100, "suggestion": "string" }],
  "slaStatus": [{ "metric": "string", "current": number, "target": number, "status": "ok" | "warning" | "critical" }]
}`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, agentId, actionId, executionId, context, config } = await req.json() as AgentRequest;

    console.log(`[autonomous-agents] Action: ${action}, AgentId: ${agentId}`);

    switch (action) {
      case 'get_agents': {
        const { data: agents, error } = await supabase
          .from('ai_autonomous_agents')
          .select('*')
          .eq('is_active', true)
          .order('agent_name');

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, data: agents }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'execute': {
        if (!agentId) throw new Error('agentId required');

        const { data: agent, error: agentError } = await supabase
          .from('ai_autonomous_agents')
          .select('*')
          .eq('id', agentId)
          .single();

        if (agentError || !agent) throw new Error('Agent not found');

        const systemPrompt = agent.system_prompt || AGENT_PROMPTS[agent.agent_type] || AGENT_PROMPTS.operations;

        const { data: execution, error: execError } = await supabase
          .from('ai_agent_executions')
          .insert({
            agent_id: agentId,
            trigger_type: 'manual',
            trigger_source: 'dashboard',
            status: 'running',
            started_at: new Date().toISOString(),
            context_data: context
          })
          .select()
          .single();

        if (execError) throw execError;

        const startTime = Date.now();

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Contexto actual:\n${JSON.stringify(context, null, 2)}\n\nAnaliza y proporciona acciones recomendadas.` }
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        const executionTime = Date.now() - startTime;

        if (!aiResponse.ok) {
          await supabase
            .from('ai_agent_executions')
            .update({ status: 'failed', error_message: `AI API error: ${aiResponse.status}`, completed_at: new Date().toISOString() })
            .eq('id', execution.id);
          throw new Error(`AI API error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;

        let result;
        try {
          const jsonMatch = content?.match(/\{[\s\S]*\}/);
          result = jsonMatch ? JSON.parse(jsonMatch[0]) : { rawContent: content };
        } catch {
          result = { rawContent: content };
        }

        if (result.actions?.length) {
          for (const actionItem of result.actions) {
            const requiresApproval = agent.execution_mode !== 'autonomous' || actionItem.priority >= 8;
            
            await supabase.from('ai_agent_actions').insert({
              agent_id: agentId,
              execution_id: execution.id,
              action_type: actionItem.type,
              action_name: `${actionItem.type} - ${actionItem.target?.entityType || 'general'}`,
              input_params: actionItem,
              confidence_score: actionItem.priority ? actionItem.priority * 10 : 70,
              status: requiresApproval ? 'pending_approval' : 'approved',
              target_entity_type: actionItem.target?.entityType,
              target_entity_id: actionItem.target?.entityId,
            });
          }
        }

        await supabase
          .from('ai_agent_executions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            execution_time_ms: executionTime,
            result_data: result,
            actions_taken: result.actions || [],
            tokens_used: aiData.usage?.total_tokens
          })
          .eq('id', execution.id);

        return new Response(JSON.stringify({ 
          success: true, 
          data: { execution, result, executionTime } 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_executions': {
        const query = supabase
          .from('ai_agent_executions')
          .select('*, ai_autonomous_agents(agent_name, agent_type)')
          .order('created_at', { ascending: false })
          .limit(50);

        if (agentId) query.eq('agent_id', agentId);

        const { data, error } = await query;
        if (error) throw error;

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_pending_actions': {
        const { data, error } = await supabase
          .from('ai_agent_actions')
          .select('*, ai_autonomous_agents(agent_name, agent_type)')
          .eq('status', 'pending_approval')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'approve_action': {
        if (!actionId) throw new Error('actionId required');

        const authHeader = req.headers.get('Authorization');
        let userId = null;
        
        if (authHeader) {
          const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
          userId = user?.id;
        }

        const { data, error } = await supabase
          .from('ai_agent_actions')
          .update({ 
            status: 'approved', 
            was_approved: true,
            approved_by: userId,
            executed_at: new Date().toISOString()
          })
          .eq('id', actionId)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'configure': {
        if (!agentId || !config) throw new Error('agentId and config required');

        const { data, error } = await supabase
          .from('ai_autonomous_agents')
          .update(config)
          .eq('id', agentId)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[autonomous-agents] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
