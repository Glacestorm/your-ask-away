import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ETLRequest {
  action: 'list_pipelines' | 'create_pipeline' | 'update_pipeline' | 'run_pipeline' | 'cancel_execution' | 'list_executions' | 'get_logs';
  pipeline?: Record<string, unknown>;
  id?: string;
  pipelineId?: string;
  executionId?: string;
  limit?: number;
  updates?: Record<string, unknown>;
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

    const { action, pipeline, id, pipelineId, executionId, limit, updates } = await req.json() as ETLRequest;

    console.log(`[etl-pipelines] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'list_pipelines':
        systemPrompt = `Eres un gestor de pipelines ETL enterprise.
        
Genera una lista de pipelines ETL configurados.

FORMATO DE RESPUESTA (JSON estricto):
{
  "pipelines": [
    {
      "id": "uuid",
      "name": "nombre del pipeline",
      "description": "descripción",
      "stages": [
        {
          "id": "uuid",
          "name": "Extract from Source",
          "type": "extract|transform|load|validate",
          "config": {},
          "order": 1
        }
      ],
      "schedule": "0 2 * * *",
      "is_active": true,
      "last_run_at": "ISO timestamp",
      "avg_duration_ms": número,
      "created_at": "ISO timestamp",
      "updated_at": "ISO timestamp"
    }
  ]
}`;
        userPrompt = 'Genera 4-6 pipelines ETL enterprise típicos';
        break;

      case 'create_pipeline':
        systemPrompt = `Eres un gestor de pipelines ETL.
        
Crea un nuevo pipeline ETL.

FORMATO DE RESPUESTA (JSON estricto):
{
  "pipeline": {
    "id": "uuid",
    "name": "nombre",
    "description": "descripción",
    "stages": [],
    "is_active": true,
    "created_at": "ISO timestamp",
    "updated_at": "ISO timestamp"
  }
}`;
        userPrompt = `Crea pipeline: ${JSON.stringify(pipeline)}`;
        break;

      case 'update_pipeline':
        systemPrompt = `Eres un gestor de pipelines ETL.

FORMATO DE RESPUESTA (JSON estricto):
{
  "updated": true,
  "pipeline_id": "uuid"
}`;
        userPrompt = `Actualiza pipeline ${id}: ${JSON.stringify(updates)}`;
        break;

      case 'run_pipeline':
        systemPrompt = `Eres un orquestador de pipelines ETL.
        
Inicia una ejecución de pipeline.

FORMATO DE RESPUESTA (JSON estricto):
{
  "execution": {
    "id": "uuid",
    "pipeline_id": "uuid",
    "status": "running",
    "current_stage": "Extract",
    "stages_completed": 0,
    "stages_total": número,
    "records_processed": 0,
    "started_at": "ISO timestamp",
    "logs": []
  }
}`;
        userPrompt = `Ejecutar pipeline: ${pipelineId}`;
        break;

      case 'cancel_execution':
        systemPrompt = `Eres un orquestador de pipelines ETL.

FORMATO DE RESPUESTA (JSON estricto):
{
  "cancelled": true,
  "execution_id": "uuid",
  "cancelled_at": "ISO timestamp"
}`;
        userPrompt = `Cancelar ejecución: ${executionId}`;
        break;

      case 'list_executions':
        systemPrompt = `Eres un monitor de pipelines ETL.
        
Genera historial de ejecuciones.

FORMATO DE RESPUESTA (JSON estricto):
{
  "executions": [
    {
      "id": "uuid",
      "pipeline_id": "uuid",
      "status": "completed|running|failed|cancelled|queued",
      "current_stage": "stage name",
      "stages_completed": número,
      "stages_total": número,
      "records_processed": número,
      "started_at": "ISO timestamp",
      "completed_at": "ISO timestamp",
      "logs": []
    }
  ]
}`;
        userPrompt = `Lista ejecuciones para pipeline ${pipelineId || 'todos'}, limit: ${limit || 20}`;
        break;

      case 'get_logs':
        systemPrompt = `Eres un sistema de logging de ETL.
        
Genera logs detallados de una ejecución.

FORMATO DE RESPUESTA (JSON estricto):
{
  "logs": [
    {
      "timestamp": "ISO timestamp",
      "level": "info|warn|error",
      "stage": "nombre del stage",
      "message": "mensaje del log",
      "details": {}
    }
  ]
}`;
        userPrompt = `Obtener logs de ejecución: ${executionId}`;
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

    console.log(`[etl-pipelines] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[etl-pipelines] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
