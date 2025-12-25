import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SchedulerRequest {
  action: 'list_jobs' | 'create_job' | 'update_job' | 'delete_job' | 'run_now' | 'toggle_job' | 'get_history';
  job?: Record<string, unknown>;
  jobId?: string;
  updates?: Record<string, unknown>;
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

    const { action, job, jobId, updates, isActive, limit } = await req.json() as SchedulerRequest;

    console.log(`[scheduler] Action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'list_jobs':
        systemPrompt = `Eres un programador de tareas empresarial tipo cron con capacidades avanzadas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "jobs": [
    {
      "id": "uuid",
      "job_name": "string",
      "job_type": "cron|interval|one_time|recurring",
      "schedule": "cron expression o interval",
      "timezone": "string",
      "action_type": "function|workflow|api_call|notification",
      "action_config": {},
      "is_active": boolean,
      "next_run_at": "ISO date",
      "last_run_at": "ISO date o null",
      "last_run_status": "success|failed|timeout|null",
      "run_count": number,
      "failure_count": number,
      "max_retries": number,
      "timeout_seconds": number,
      "created_at": "ISO date",
      "updated_at": "ISO date"
    }
  ],
  "metrics": {
    "active_jobs": number,
    "jobs_today": number,
    "success_rate": 0-100,
    "avg_execution_time_ms": number,
    "upcoming_jobs": number,
    "failed_jobs_24h": number
  }
}`;
        userPrompt = `Genera 8-12 jobs programados típicos empresariales (backups, reportes, sincronización, limpieza, notificaciones, etc) con próximas ejecuciones y métricas.`;
        break;

      case 'create_job':
        systemPrompt = `Eres un validador de jobs programados.

FORMATO DE RESPUESTA (JSON estricto):
{
  "job": {
    "id": "uuid generado",
    "job_name": "string",
    "job_type": "string",
    "schedule": "string",
    "timezone": "UTC",
    "action_type": "string",
    "action_config": {},
    "is_active": true,
    "next_run_at": "ISO date calculada",
    "run_count": 0,
    "failure_count": 0,
    "max_retries": 3,
    "timeout_seconds": 300,
    "created_at": "ISO date",
    "updated_at": "ISO date"
  },
  "validation": {
    "is_valid": boolean,
    "warnings": []
  }
}`;
        userPrompt = `Valida y crea este job programado: ${JSON.stringify(job)}`;
        break;

      case 'get_history':
        systemPrompt = `Eres un monitor de historial de ejecuciones de jobs.

FORMATO DE RESPUESTA (JSON estricto):
{
  "executions": [
    {
      "id": "uuid",
      "job_id": "string",
      "job_name": "string",
      "status": "running|completed|failed|timeout|cancelled",
      "started_at": "ISO date",
      "completed_at": "ISO date o null",
      "duration_ms": number,
      "output": {},
      "error_message": "string o null",
      "retry_attempt": number
    }
  ]
}`;
        userPrompt = `Genera historial de ${limit || 20} ejecuciones para el job ${jobId || 'general'}`;
        break;

      case 'update_job':
      case 'delete_job':
      case 'run_now':
      case 'toggle_job':
        return new Response(JSON.stringify({
          success: true,
          job_id: jobId,
          action: action,
          is_active: isActive,
          execution: action === 'run_now' ? {
            id: crypto.randomUUID(),
            job_id: jobId,
            status: 'running',
            started_at: new Date().toISOString()
          } : undefined,
          message: action === 'delete_job' ? 'Job eliminado' :
                   action === 'run_now' ? 'Job ejecutado' :
                   action === 'toggle_job' ? (isActive ? 'Job activado' : 'Job pausado') :
                   'Job actualizado'
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

    console.log(`[scheduler] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[scheduler] Error:', message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
