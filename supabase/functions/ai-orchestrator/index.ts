import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrchestratorRequest {
  action: 'initialize' | 'register_agent' | 'assign_task' | 'execute_workflow' | 'pause_workflow' | 'resume_workflow' | 'get_agent_status' | 'get_workflow_status' | 'coordinate';
  context?: Record<string, unknown>;
  agentConfig?: Record<string, unknown>;
  agentId?: string;
  taskType?: string;
  input?: Record<string, unknown>;
  priority?: number;
  workflowId?: string;
  objective?: string;
  requiredCapabilities?: string[];
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

    const { action, context, agentConfig, agentId, taskType, input, priority, workflowId, objective, requiredCapabilities } = await req.json() as OrchestratorRequest;

    console.log(`[ai-orchestrator] Processing action: ${action}`);

    switch (action) {
      case 'initialize':
        return new Response(JSON.stringify({
          success: true,
          agents: [
            { id: 'agent-analyzer', name: 'Analizador de Datos', type: 'analyzer', status: 'idle', capabilities: ['data_analysis', 'pattern_detection', 'anomaly_detection'], metrics: { tasksCompleted: 45, successRate: 0.94, avgExecutionTime: 2500, lastActive: new Date().toISOString() }, configuration: {} },
            { id: 'agent-executor', name: 'Ejecutor de Tareas', type: 'executor', status: 'idle', capabilities: ['task_execution', 'workflow_automation', 'api_integration'], metrics: { tasksCompleted: 120, successRate: 0.98, avgExecutionTime: 1500, lastActive: new Date().toISOString() }, configuration: {} },
            { id: 'agent-monitor', name: 'Monitor de Sistema', type: 'monitor', status: 'running', capabilities: ['system_monitoring', 'alert_generation', 'health_check'], metrics: { tasksCompleted: 500, successRate: 0.99, avgExecutionTime: 500, lastActive: new Date().toISOString() }, configuration: {} },
            { id: 'agent-coordinator', name: 'Coordinador', type: 'coordinator', status: 'idle', capabilities: ['agent_coordination', 'task_distribution', 'load_balancing'], metrics: { tasksCompleted: 80, successRate: 0.96, avgExecutionTime: 1000, lastActive: new Date().toISOString() }, configuration: {} }
          ],
          workflows: [
            { id: 'wf-daily-analysis', name: 'Análisis Diario', description: 'Análisis automático diario de métricas', steps: [], status: 'active', currentStep: 0, metrics: { totalRuns: 30, successfulRuns: 29, avgDuration: 300000 } },
            { id: 'wf-incident-response', name: 'Respuesta a Incidentes', description: 'Workflow de respuesta automática a incidentes', steps: [], status: 'active', currentStep: 0, metrics: { totalRuns: 5, successfulRuns: 5, avgDuration: 60000 } }
          ]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'register_agent':
        return new Response(JSON.stringify({
          success: true,
          agent: {
            id: `agent-${Date.now()}`,
            ...agentConfig,
            status: 'idle',
            metrics: { tasksCompleted: 0, successRate: 0, avgExecutionTime: 0, lastActive: new Date().toISOString() }
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'assign_task':
        return new Response(JSON.stringify({
          success: true,
          task: {
            id: `task-${Date.now()}`,
            agentId,
            type: taskType,
            description: `Tarea ${taskType}`,
            status: 'assigned',
            priority: priority || 5,
            input,
            startedAt: new Date().toISOString()
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'coordinate':
        const systemPrompt = `Eres un coordinador de agentes IA.

OBJETIVO: ${objective}
CAPACIDADES REQUERIDAS: ${requiredCapabilities?.join(', ')}
CONTEXTO: ${JSON.stringify(context || {})}

Genera un plan de coordinación para lograr el objetivo.

FORMATO DE RESPUESTA (JSON):
{
  "coordination": {
    "plan": [
      {"step": 1, "agentType": "analyzer|executor|monitor", "action": "string", "parameters": {}}
    ],
    "estimatedDuration": "string",
    "requiredResources": ["string"],
    "riskAssessment": "low|medium|high"
  }
}`;

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
              { role: 'user', content: `Coordina agentes para: ${objective}` }
            ],
            temperature: 0.7,
            max_tokens: 1500,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        let result;
        try {
          const jsonMatch = content?.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            result = JSON.parse(jsonMatch[0]);
          } else {
            result = { coordination: { plan: [], estimatedDuration: '5 min', requiredResources: [], riskAssessment: 'low' } };
          }
        } catch {
          result = { coordination: { plan: [], estimatedDuration: '5 min', requiredResources: [], riskAssessment: 'low' } };
        }

        return new Response(JSON.stringify({
          success: true,
          ...result
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'execute_workflow':
      case 'pause_workflow':
      case 'resume_workflow':
        return new Response(JSON.stringify({
          success: true,
          workflowId,
          status: action === 'pause_workflow' ? 'paused' : 'active'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'get_agent_status':
        return new Response(JSON.stringify({
          success: true,
          agents: [
            { id: 'agent-analyzer', status: 'idle', currentTask: null },
            { id: 'agent-executor', status: 'running', currentTask: 'task-123' },
            { id: 'agent-monitor', status: 'running', currentTask: 'monitoring' }
          ]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'get_workflow_status':
        return new Response(JSON.stringify({
          success: true,
          workflow: {
            id: workflowId,
            status: 'active',
            currentStep: 2,
            progress: 0.6
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        return new Response(JSON.stringify({
          success: true,
          message: 'Action processed'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('[ai-orchestrator] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
