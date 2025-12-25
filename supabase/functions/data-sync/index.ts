import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DataSyncRequest {
  action: 'list_jobs' | 'create_job' | 'run_job' | 'cancel_run' | 'list_runs' | 'get_metrics';
  job?: Record<string, unknown>;
  jobId?: string;
  runId?: string;
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

    const { action, job, jobId, runId, limit } = await req.json() as DataSyncRequest;

    console.log(`[data-sync] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'list_jobs':
        systemPrompt = `Eres un gestor de sincronización de datos enterprise.
        
Genera una lista de jobs de sincronización configurados.

FORMATO DE RESPUESTA (JSON estricto):
{
  "jobs": [
    {
      "id": "uuid",
      "name": "nombre del job",
      "source_type": "database|api|file|stream",
      "destination_type": "database|api|file|warehouse",
      "source_config": {},
      "destination_config": {},
      "sync_mode": "full|incremental|cdc",
      "schedule": "0 */6 * * *",
      "is_active": true,
      "last_run_at": "ISO timestamp",
      "next_run_at": "ISO timestamp",
      "created_at": "ISO timestamp",
      "updated_at": "ISO timestamp"
    }
  ]
}`;
        userPrompt = 'Genera 4-6 jobs de sincronización enterprise típicos';
        break;

      case 'create_job':
        systemPrompt = `Eres un gestor de sincronización de datos.
        
Crea un nuevo job de sincronización.

FORMATO DE RESPUESTA (JSON estricto):
{
  "job": {
    "id": "uuid",
    "name": "nombre",
    "source_type": "tipo",
    "destination_type": "tipo",
    "source_config": {},
    "destination_config": {},
    "sync_mode": "incremental",
    "is_active": true,
    "created_at": "ISO timestamp",
    "updated_at": "ISO timestamp"
  }
}`;
        userPrompt = `Crea job: ${JSON.stringify(job)}`;
        break;

      case 'run_job':
        systemPrompt = `Eres un orquestador de sincronización.
        
Inicia una ejecución de sincronización.

FORMATO DE RESPUESTA (JSON estricto):
{
  "run": {
    "id": "uuid",
    "job_id": "uuid",
    "status": "running",
    "records_processed": 0,
    "records_synced": 0,
    "records_failed": 0,
    "started_at": "ISO timestamp"
  }
}`;
        userPrompt = `Ejecutar job: ${jobId}`;
        break;

      case 'cancel_run':
        systemPrompt = `Eres un orquestador de sincronización.

FORMATO DE RESPUESTA (JSON estricto):
{
  "cancelled": true,
  "run_id": "uuid",
  "cancelled_at": "ISO timestamp"
}`;
        userPrompt = `Cancelar ejecución: ${runId}`;
        break;

      case 'list_runs':
        systemPrompt = `Eres un monitor de sincronización de datos.
        
Genera historial de ejecuciones.

FORMATO DE RESPUESTA (JSON estricto):
{
  "runs": [
    {
      "id": "uuid",
      "job_id": "uuid",
      "status": "completed|running|failed|cancelled",
      "records_processed": número,
      "records_synced": número,
      "records_failed": número,
      "started_at": "ISO timestamp",
      "completed_at": "ISO timestamp",
      "duration_ms": número
    }
  ]
}`;
        userPrompt = `Lista ejecuciones para job ${jobId || 'todos'}, limit: ${limit || 20}`;
        break;

      case 'get_metrics':
        systemPrompt = `Eres un analista de métricas de sincronización.

FORMATO DE RESPUESTA (JSON estricto):
{
  "metrics": {
    "total_jobs": número,
    "active_jobs": número,
    "total_runs_today": número,
    "success_rate": 0-100,
    "records_synced_today": número,
    "avg_duration_ms": número
  }
}`;
        userPrompt = 'Genera métricas de sincronización del día';
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
        max_tokens: 2000,
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

    console.log(`[data-sync] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[data-sync] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
