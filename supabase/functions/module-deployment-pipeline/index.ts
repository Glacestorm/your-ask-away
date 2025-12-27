import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const body = await req.json();
    const { action, moduleKey, pipelineId } = body;
    console.log(`[module-deployment-pipeline] Action: ${action}, Module: ${moduleKey}`);

    const generatePipelineData = async (prompt: string) => {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'Genera datos de CI/CD pipeline realistas para módulos enterprise en JSON.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return { error: 'Rate limit exceeded', status: 429 };
        }
        throw new Error(`AI error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      } catch {
        return {};
      }
    };

    switch (action) {
      case 'list_pipelines': {
        const result = await generatePipelineData(`Genera lista de 4 pipelines para módulo ${moduleKey}:
{
  "pipelines": [{
    "id": "uuid",
    "name": "Pipeline #number",
    "moduleKey": "${moduleKey}",
    "status": "idle|running|success|failed|cancelled|pending_approval",
    "currentStage": "string",
    "environment": "development|staging|production",
    "version": "semver",
    "stages": [{
      "id": "uuid",
      "name": "Build|Test|Security|Review|Staging|Production",
      "type": "build|test|security|review|staging|canary|production",
      "status": "pending|running|success|failed|skipped",
      "order": number,
      "requiresApproval": boolean
    }],
    "duration": number (ms),
    "triggeredBy": "string",
    "createdAt": "ISO date"
  }]
}`);

        return new Response(JSON.stringify({
          success: true,
          pipelines: result.pipelines || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create_pipeline': {
        const stages = [
          { id: '1', name: 'Build', type: 'build', status: 'pending', order: 1 },
          { id: '2', name: 'Unit Tests', type: 'test', status: 'pending', order: 2 },
          { id: '3', name: 'Security Scan', type: 'security', status: 'pending', order: 3 },
          { id: '4', name: 'Staging Deploy', type: 'staging', status: 'pending', order: 4, requiresApproval: true },
          { id: '5', name: 'Production Deploy', type: 'production', status: 'pending', order: 5, requiresApproval: true }
        ];

        const pipeline = {
          id: crypto.randomUUID(),
          name: `Pipeline #${Date.now().toString().slice(-4)}`,
          moduleKey: body.moduleKey,
          status: 'idle',
          currentStage: 'Build',
          environment: body.environment || 'development',
          version: body.version || '1.0.0',
          stages,
          trigger: { type: 'manual' },
          triggeredBy: 'Current User',
          triggeredById: body.triggeredById,
          logs: [],
          artifacts: [],
          createdAt: new Date().toISOString()
        };

        return new Response(JSON.stringify({
          success: true,
          pipeline
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'start_pipeline': {
        const result = await generatePipelineData(`Genera pipeline en ejecución con stages progresando:
{
  "pipeline": {
    "id": "${pipelineId}",
    "status": "running",
    "currentStage": "Build",
    "stages": [
      { "id": "1", "name": "Build", "type": "build", "status": "running", "order": 1 },
      { "id": "2", "name": "Tests", "type": "test", "status": "pending", "order": 2 },
      { "id": "3", "name": "Security", "type": "security", "status": "pending", "order": 3 },
      { "id": "4", "name": "Staging", "type": "staging", "status": "pending", "order": 4 },
      { "id": "5", "name": "Production", "type": "production", "status": "pending", "order": 5 }
    ],
    "logs": [{ "timestamp": "now", "level": "info", "stage": "Build", "message": "Starting build..." }],
    "startedAt": "ISO date"
  }
}`);

        return new Response(JSON.stringify({
          success: true,
          pipeline: result.pipeline || { id: pipelineId, status: 'running' }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'cancel_pipeline': {
        return new Response(JSON.stringify({
          success: true,
          message: 'Pipeline cancelled'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'approve_stage': {
        return new Response(JSON.stringify({
          success: true,
          message: 'Stage approved'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'rollback': {
        return new Response(JSON.stringify({
          success: true,
          message: `Rollback to ${body.targetVersion} initiated`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'promote': {
        return new Response(JSON.stringify({
          success: true,
          message: `Promotion to ${body.toEnvironment} initiated`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_pipeline': {
        const result = await generatePipelineData(`Genera detalles de pipeline ${pipelineId}:
{
  "pipeline": {
    "id": "${pipelineId}",
    "status": "success",
    "stages": [
      { "id": "1", "name": "Build", "status": "success", "duration": 45000 },
      { "id": "2", "name": "Tests", "status": "success", "duration": 120000 },
      { "id": "3", "name": "Security", "status": "success", "duration": 30000 },
      { "id": "4", "name": "Staging", "status": "success", "duration": 60000 },
      { "id": "5", "name": "Production", "status": "success", "duration": 90000 }
    ],
    "logs": [
      { "timestamp": "now", "level": "info", "stage": "Build", "message": "Build completed" },
      { "timestamp": "now", "level": "info", "stage": "Tests", "message": "All tests passed" }
    ],
    "artifacts": [
      { "id": "1", "name": "build.zip", "type": "build", "size": 1024000 },
      { "id": "2", "name": "coverage.html", "type": "coverage", "size": 50000 }
    ]
  }
}`);

        return new Response(JSON.stringify({
          success: true,
          pipeline: result.pipeline || { id: pipelineId }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_test_results': {
        const result = await generatePipelineData(`Genera resultados de tests para pipeline ${pipelineId}:
{
  "results": [
    { "suite": "Unit Tests", "name": "should render correctly", "status": "passed", "duration": 45 },
    { "suite": "Unit Tests", "name": "should handle errors", "status": "passed", "duration": 32 },
    { "suite": "Integration", "name": "API connection", "status": "passed", "duration": 150 },
    { "suite": "E2E", "name": "user flow", "status": "passed", "duration": 2500 }
  ]
}`);

        return new Response(JSON.stringify({
          success: true,
          results: result.results || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_deployment_status': {
        return new Response(JSON.stringify({
          success: true,
          status: {
            pipelineId,
            environment: 'staging',
            status: 'deployed',
            version: '1.0.0',
            instances: { total: 3, healthy: 3, unhealthy: 0, deploying: 0 },
            metrics: { errorRate: 0.01, latency: 45, successRate: 99.5 },
            startedAt: new Date().toISOString()
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_pipeline_status': {
        const result = await generatePipelineData(`Genera estado actual del pipeline para módulo ${moduleKey}:
{
  "status": "idle|running|success|failed",
  "currentStage": "string",
  "progress": number (0-100),
  "lastRun": "ISO date",
  "nextScheduled": "ISO date or null",
  "health": "healthy|degraded|critical",
  "stages": [{
    "name": "string",
    "status": "pending|running|success|failed",
    "duration": number
  }]
}`);

        return new Response(JSON.stringify({
          success: true,
          ...result,
          moduleKey
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown action: ${action}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('[module-deployment-pipeline] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
