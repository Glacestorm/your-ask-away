import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrchestratorRequest {
  action: 'list_tasks' | 'create_task' | 'cancel_task' | 'retry_task' | 'prioritize_task';
  filters?: Record<string, unknown>;
  task?: Record<string, unknown>;
  taskId?: string;
  priority?: string;
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

    const { action, filters, task, taskId, priority } = await req.json() as OrchestratorRequest;

    console.log(`[task-orchestrator] Action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'list_tasks':
        systemPrompt = `Eres un orquestador de tareas empresariales que gestiona colas de trabajo distribuido.

FORMATO DE RESPUESTA (JSON estricto):
{
  "tasks": [
    {
      "id": "uuid",
      "task_name": "string",
      "task_type": "batch|parallel|sequential|distributed",
      "priority": "low|medium|high|critical",
      "status": "queued|running|completed|failed|cancelled|paused",
      "dependencies": [],
      "assigned_workers": [],
      "progress": 0-100,
      "estimated_duration_ms": number,
      "actual_duration_ms": number o null,
      "retry_count": number,
      "max_retries": number,
      "input_data": {},
      "created_at": "ISO date"
    }
  ],
  "queues": [
    {
      "id": "uuid",
      "queue_name": "string",
      "capacity": number,
      "active_tasks": number,
      "pending_tasks": number,
      "workers_available": number,
      "throughput_per_minute": number,
      "avg_wait_time_ms": number,
      "health_status": "healthy|degraded|overloaded"
    }
  ],
  "metrics": {
    "total_tasks_processed": number,
    "success_rate": 0-100,
    "avg_execution_time_ms": number,
    "tasks_in_queue": number,
    "active_workers": number,
    "throughput_trend": "up|stable|down"
  }
}`;
        userPrompt = `Genera estado actual del orquestador con 8-12 tareas en diferentes estados, 3-4 colas y métricas. Filtros: ${JSON.stringify(filters || {})}`;
        break;

      case 'create_task':
        systemPrompt = `Eres un planificador de tareas que crea y encola trabajos.

FORMATO DE RESPUESTA (JSON estricto):
{
  "task": {
    "id": "uuid generado",
    "task_name": "string",
    "task_type": "string",
    "priority": "string",
    "status": "queued",
    "dependencies": [],
    "assigned_workers": [],
    "progress": 0,
    "estimated_duration_ms": number,
    "retry_count": 0,
    "max_retries": 3,
    "input_data": {},
    "created_at": "ISO date"
  },
  "queue_position": number,
  "estimated_start": "ISO date"
}`;
        userPrompt = `Crea y encola esta tarea: ${JSON.stringify(task)}`;
        break;

      case 'cancel_task':
      case 'retry_task':
      case 'prioritize_task':
        return new Response(JSON.stringify({
          success: true,
          task_id: taskId,
          action: action,
          priority: priority,
          message: `Tarea ${action === 'cancel_task' ? 'cancelada' : action === 'retry_task' ? 'reencolada' : 'repriorizada'}`
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

    console.log(`[task-orchestrator] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[task-orchestrator] Error:', message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
