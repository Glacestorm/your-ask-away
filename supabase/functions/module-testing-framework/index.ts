import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FunctionRequest {
  action: 'get_test_suites' | 'run_tests' | 'get_coverage' | 'validate_module' | 'get_test_history' | 'cancel_test_run';
  moduleKey?: string;
  testType?: string;
  runId?: string;
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

    const { action, moduleKey, testType, runId } = await req.json() as FunctionRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_test_suites':
        systemPrompt = `Eres un sistema de testing de módulos enterprise.
        
Genera una lista de suites de tests para el módulo.

FORMATO DE RESPUESTA (JSON estricto):
{
  "suites": [
    {
      "id": "uuid",
      "name": "nombre del suite",
      "module_key": "module_key",
      "test_cases": [
        {
          "id": "uuid",
          "name": "nombre del test",
          "description": "descripción",
          "type": "unit|integration|e2e|performance|security",
          "status": "pending|running|passed|failed|skipped",
          "duration_ms": 0,
          "assertions": 10,
          "assertions_passed": 10,
          "created_at": "ISO date"
        }
      ],
      "total_tests": 0,
      "passed_tests": 0,
      "failed_tests": 0,
      "skipped_tests": 0,
      "coverage_percentage": 0,
      "status": "idle|running|completed|failed"
    }
  ]
}`;
        userPrompt = `Genera suites de tests para el módulo: ${moduleKey || 'general'}`;
        break;

      case 'run_tests':
        systemPrompt = `Eres un ejecutor de tests de módulos.

Simula la ejecución de tests y genera resultados.

FORMATO DE RESPUESTA (JSON estricto):
{
  "testRun": {
    "id": "uuid",
    "name": "Test Run",
    "module_key": "module_key",
    "test_cases": [...],
    "total_tests": 20,
    "passed_tests": 18,
    "failed_tests": 2,
    "skipped_tests": 0,
    "coverage_percentage": 85,
    "last_run_at": "ISO date",
    "status": "completed"
  }
}`;
        userPrompt = `Ejecuta tests ${testType || 'all'} para módulo: ${moduleKey}`;
        break;

      case 'get_coverage':
        systemPrompt = `Eres un analizador de cobertura de código.

Genera un reporte de cobertura detallado.

FORMATO DE RESPUESTA (JSON estricto):
{
  "coverage": {
    "module_key": "module_key",
    "lines_total": 1000,
    "lines_covered": 850,
    "lines_percentage": 85,
    "branches_total": 200,
    "branches_covered": 160,
    "branches_percentage": 80,
    "functions_total": 50,
    "functions_covered": 45,
    "functions_percentage": 90,
    "uncovered_lines": [12, 45, 89],
    "files": [
      { "path": "src/...", "coverage": 90, "lines": 100, "covered": 90 }
    ]
  }
}`;
        userPrompt = `Genera reporte de cobertura para: ${moduleKey}`;
        break;

      case 'validate_module':
        systemPrompt = `Eres un validador de módulos enterprise.

Valida el módulo contra esquemas, dependencias y compatibilidad.

FORMATO DE RESPUESTA (JSON estricto):
{
  "validations": [
    {
      "id": "uuid",
      "module_key": "module_key",
      "validation_type": "schema|dependency|compatibility|performance",
      "status": "valid|warning|invalid",
      "message": "mensaje descriptivo",
      "validated_at": "ISO date"
    }
  ]
}`;
        userPrompt = `Valida el módulo: ${moduleKey}`;
        break;

      case 'get_test_history':
        systemPrompt = `Genera historial de ejecuciones de tests.

FORMATO DE RESPUESTA (JSON estricto):
{
  "history": [
    {
      "id": "uuid",
      "suite_id": "uuid",
      "started_at": "ISO date",
      "completed_at": "ISO date",
      "status": "completed|failed",
      "total_tests": 20,
      "passed": 18,
      "failed": 2,
      "duration_ms": 5000,
      "triggered_by": "user@example.com"
    }
  ]
}`;
        userPrompt = `Historial de tests para: ${moduleKey}`;
        break;

      case 'cancel_test_run':
        return new Response(JSON.stringify({
          success: true,
          message: 'Test run cancelled'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[module-testing-framework] Processing action: ${action}`);

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
          error: 'Rate limit exceeded',
          success: false
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
    } catch (parseError) {
      console.error('[module-testing-framework] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[module-testing-framework] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
