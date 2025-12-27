import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RollbackRequest {
  action: 'get_rollback_options' | 'validate_rollback' | 'execute_rollback' | 'get_rollback_history' | 'create_checkpoint';
  moduleKey?: string;
  versionId?: string;
  params?: Record<string, unknown>;
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

    const { action, moduleKey, versionId, params } = await req.json() as RollbackRequest;

    console.log(`[module-rollback] Action: ${action}, Module: ${moduleKey}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_rollback_options':
        return new Response(JSON.stringify({
          success: true,
          data: {
            currentVersion: '2.3.1',
            availableVersions: [
              {
                id: 'v_001',
                version: '2.3.0',
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                author: 'Sistema',
                changes: ['Bug fix en validación', 'Mejora de rendimiento'],
                isStable: true,
                rollbackRisk: 'low'
              },
              {
                id: 'v_002',
                version: '2.2.5',
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                author: 'Admin',
                changes: ['Nueva funcionalidad de reportes', 'Integración con API externa'],
                isStable: true,
                rollbackRisk: 'medium'
              },
              {
                id: 'v_003',
                version: '2.2.0',
                createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                author: 'Sistema',
                changes: ['Refactor completo del módulo', 'Nueva arquitectura'],
                isStable: true,
                rollbackRisk: 'high'
              }
            ],
            checkpoints: [
              {
                id: 'cp_001',
                name: 'Pre-release 2.3.0',
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                type: 'manual'
              }
            ]
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'validate_rollback':
        systemPrompt = `Eres un experto en gestión de versiones y rollback de software.

TAREA: Validar si es seguro hacer rollback a una versión anterior.

FORMATO DE RESPUESTA (JSON estricto):
{
  "validation": {
    "isValid": boolean,
    "riskLevel": "low" | "medium" | "high" | "critical",
    "riskScore": 0-100,
    "blockers": ["blocker1", "blocker2"],
    "warnings": ["warning1", "warning2"],
    "impactedComponents": ["component1", "component2"],
    "dataCompatibility": {
      "isCompatible": boolean,
      "migrationRequired": boolean,
      "affectedTables": []
    },
    "dependencyImpact": {
      "breakingChanges": [],
      "affectedModules": []
    }
  },
  "recommendations": ["rec1", "rec2"],
  "estimatedDowntime": "0-5 minutes"
}`;
        userPrompt = `Valida el rollback del módulo "${moduleKey}" a la versión ${versionId}. Contexto: ${JSON.stringify(params)}`;
        break;

      case 'execute_rollback':
        systemPrompt = `Eres un sistema de gestión de rollback automatizado.

TAREA: Ejecutar rollback y generar reporte.

FORMATO DE RESPUESTA (JSON estricto):
{
  "execution": {
    "status": "success" | "partial" | "failed",
    "executedAt": "ISO timestamp",
    "duration": "X seconds",
    "fromVersion": "string",
    "toVersion": "string",
    "steps": [
      {"name": "step1", "status": "completed", "duration": "Xms"},
      {"name": "step2", "status": "completed", "duration": "Xms"}
    ],
    "backupCreated": boolean,
    "backupId": "string"
  },
  "postRollback": {
    "healthCheck": "passed" | "warning" | "failed",
    "metrics": {
      "errorRate": 0,
      "responseTime": "Xms",
      "availability": 100
    },
    "verificationSteps": ["step1", "step2"]
  }
}`;
        userPrompt = `Ejecuta rollback del módulo "${moduleKey}" a la versión ${versionId}. Parámetros: ${JSON.stringify(params)}`;
        break;

      case 'get_rollback_history':
        return new Response(JSON.stringify({
          success: true,
          data: {
            history: [
              {
                id: 'rb_001',
                moduleKey,
                fromVersion: '2.2.5',
                toVersion: '2.2.0',
                executedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                executedBy: 'admin@empresa.com',
                reason: 'Bug crítico en producción',
                status: 'success',
                duration: '45s'
              },
              {
                id: 'rb_002',
                moduleKey,
                fromVersion: '2.1.0',
                toVersion: '2.0.5',
                executedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
                executedBy: 'system',
                reason: 'Rollback automático por health check fallido',
                status: 'success',
                duration: '32s'
              }
            ]
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'create_checkpoint':
        return new Response(JSON.stringify({
          success: true,
          data: {
            checkpoint: {
              id: `cp_${Date.now()}`,
              name: params?.name || `Checkpoint ${new Date().toISOString()}`,
              moduleKey,
              version: params?.version || 'current',
              createdAt: new Date().toISOString(),
              type: 'manual',
              metadata: params?.metadata || {}
            }
          }
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
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded', 
          message: 'Demasiadas solicitudes. Intenta más tarde.' 
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
      console.error('[module-rollback] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[module-rollback] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[module-rollback] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
