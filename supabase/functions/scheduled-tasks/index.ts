import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduledTasksRequest {
  action: 'list_tasks' | 'create_task' | 'execute_now' | 'toggle_task' | 'get_executions' | 'delete_task';
  context?: Record<string, unknown>;
  task?: Record<string, unknown>;
  taskId?: string;
  isActive?: boolean;
  limit?: number;
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

    const { action, context, task, taskId, isActive, limit } = await req.json() as ScheduledTasksRequest;

    console.log(`[scheduled-tasks] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'list_tasks':
        systemPrompt = `Eres un gestor de tareas programadas empresariales.

FORMATO DE RESPUESTA (JSON estricto):
{
  "tasks": [
    {
      "id": "uuid",
      "name": "nombre de la tarea",
      "description": "descripción",
      "task_type": "cron|interval|one_time|delayed",
      "schedule": "expresión cron o intervalo",
      "action_type": "tipo de acción",
      "action_config": {},
      "is_active": true,
      "next_run_at": "ISO timestamp",
      "last_run_at": "ISO timestamp o null",
      "last_run_status": "success|failed|running",
      "retry_count": 0,
      "max_retries": 3,
      "timeout_ms": 30000,
      "created_at": "ISO timestamp",
      "updated_at": "ISO timestamp"
    }
  ],
  "stats": {
    "total_tasks": número,
    "active_tasks": número,
    "executions_today": número,
    "success_rate": porcentaje,
    "average_duration_ms": número,
    "failed_last_24h": número
  }
}`;
        userPrompt = `Listar tareas programadas. Contexto: ${JSON.stringify(context || {})}`;
        break;

      case 'create_task':
        systemPrompt = `Eres un creador de tareas programadas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "task": {
    "id": "nuevo-uuid",
    "name": "nombre",
    "description": "descripción",
    "task_type": "tipo",
    "schedule": "expresión",
    "action_type": "tipo de acción",
    "action_config": {},
    "is_active": false,
    "next_run_at": "ISO timestamp",
    "retry_count": 0,
    "max_retries": 3,
    "timeout_ms": 30000,
    "created_at": "ISO timestamp",
    "updated_at": "ISO timestamp"
  }
}`;
        userPrompt = `Crear tarea programada: ${JSON.stringify(task)}`;
        break;

      case 'execute_now':
        systemPrompt = `Eres un ejecutor de tareas programadas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "execution": {
    "id": "execution-uuid",
    "task_id": "${taskId}",
    "status": "running",
    "started_at": "ISO timestamp",
    "attempt_number": 1
  },
  "message": "Tarea iniciada exitosamente"
}`;
        userPrompt = `Ejecutar inmediatamente la tarea ${taskId}`;
        break;

      case 'toggle_task':
        systemPrompt = `Eres un gestor de estado de tareas programadas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "task_id": "${taskId}",
  "is_active": ${isActive},
  "next_run_at": "ISO timestamp o null",
  "updated_at": "ISO timestamp",
  "message": "Estado actualizado"
}`;
        userPrompt = `${isActive ? 'Activar' : 'Pausar'} tarea ${taskId}`;
        break;

      case 'get_executions':
        systemPrompt = `Eres un monitor de ejecuciones de tareas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "executions": [
    {
      "id": "execution-uuid",
      "task_id": "task-uuid",
      "status": "pending|running|completed|failed|cancelled|timeout",
      "started_at": "ISO timestamp",
      "completed_at": "ISO timestamp o null",
      "duration_ms": número,
      "result": {},
      "error_message": "mensaje de error o null",
      "attempt_number": número
    }
  ],
  "pagination": {
    "total": número,
    "limit": ${limit || 50}
  }
}`;
        userPrompt = taskId 
          ? `Obtener ejecuciones de la tarea ${taskId} (límite: ${limit || 50})`
          : `Obtener todas las ejecuciones recientes (límite: ${limit || 50})`;
        break;

      case 'delete_task':
        systemPrompt = `Eres un gestor de tareas programadas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "deleted_task_id": "${taskId}",
  "deleted_at": "ISO timestamp",
  "message": "Tarea eliminada exitosamente"
}`;
        userPrompt = `Eliminar tarea ${taskId}`;
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

    console.log(`[scheduled-tasks] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[scheduled-tasks] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
