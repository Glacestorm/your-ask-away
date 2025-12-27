import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModuleContext {
  moduleKey: string;
  moduleName: string;
  currentState: Record<string, unknown>;
  dependencies: string[];
  dependents: string[];
}

interface HealthIssue {
  id: string;
  type: string;
  severity: string;
  description: string;
  autoFixable: boolean;
  suggestedFix?: string;
}

interface AgentRequest {
  action: 'check_health' | 'analyze_propagation' | 'execute_propagation' | 'auto_fix' | 'apply_healing' | 'smart_rollback' | 'resolve_conflicts';
  context?: ModuleContext;
  proposedChanges?: Record<string, unknown>;
  planId?: string;
  issue?: HealthIssue;
  actionId?: string;
  targetVersion?: string;
  conflictingModules?: string[];
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

    const { action, context, proposedChanges, planId, issue, actionId, targetVersion, conflictingModules } = await req.json() as AgentRequest;

    console.log(`[module-autonomous-agent] Action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'check_health':
        systemPrompt = `Eres un agente autónomo especializado en salud de módulos de software enterprise.
        
ANÁLISIS DE SALUD:
- Evalúa dependencias, compatibilidad, rendimiento, seguridad y configuración
- Detecta problemas potenciales antes de que ocurran
- Clasifica severidad: low, medium, high, critical
- Identifica qué problemas son auto-reparables

FORMATO DE RESPUESTA (JSON estricto):
{
  "moduleKey": "string",
  "moduleName": "string",
  "healthScore": 0-100,
  "status": "healthy" | "warning" | "critical" | "unknown",
  "issues": [
    {
      "id": "uuid",
      "type": "dependency" | "compatibility" | "performance" | "security" | "config",
      "severity": "low" | "medium" | "high" | "critical",
      "description": "string",
      "autoFixable": boolean,
      "suggestedFix": "string opcional"
    }
  ],
  "lastChecked": "ISO timestamp",
  "recommendations": ["string"]
}`;

        userPrompt = `Analiza la salud de este módulo:

Módulo: ${context?.moduleName} (${context?.moduleKey})
Estado actual: ${JSON.stringify(context?.currentState, null, 2)}
Dependencias: ${context?.dependencies?.join(', ') || 'ninguna'}
Dependientes: ${context?.dependents?.join(', ') || 'ninguno'}

Genera un informe completo de salud con problemas detectados y recomendaciones.`;
        break;

      case 'analyze_propagation':
        systemPrompt = `Eres un agente autónomo que analiza cómo propagar cambios a través de módulos dependientes.

ANÁLISIS DE PROPAGACIÓN:
- Identifica todos los módulos afectados
- Calcula el riesgo de cada cambio
- Genera un plan detallado de propagación
- Determina qué cambios requieren aprobación

FORMATO DE RESPUESTA (JSON estricto):
{
  "id": "uuid",
  "sourceModule": "string",
  "changeDescription": "string",
  "affectedModules": [
    {
      "moduleKey": "string",
      "moduleName": "string",
      "changeType": "update" | "patch" | "reconfigure" | "notify",
      "risk": "low" | "medium" | "high",
      "changes": [
        {
          "field": "string",
          "oldValue": any,
          "newValue": any,
          "reason": "string"
        }
      ],
      "requiresApproval": boolean
    }
  ],
  "totalRisk": "low" | "medium" | "high",
  "estimatedImpact": "string",
  "status": "pending",
  "createdAt": "ISO timestamp"
}`;

        userPrompt = `Analiza la propagación de estos cambios:

Módulo origen: ${context?.moduleName} (${context?.moduleKey})
Estado actual: ${JSON.stringify(context?.currentState, null, 2)}
Cambios propuestos: ${JSON.stringify(proposedChanges, null, 2)}
Dependientes que podrían verse afectados: ${context?.dependents?.join(', ') || 'ninguno'}

Genera un plan detallado de propagación.`;
        break;

      case 'execute_propagation':
        systemPrompt = `Eres un agente autónomo que ejecuta planes de propagación de cambios.

EJECUCIÓN DE PROPAGACIÓN:
- Aplica cambios en el orden correcto
- Verifica integridad después de cada cambio
- Genera log detallado de acciones
- Prepara datos para rollback si es necesario

FORMATO DE RESPUESTA (JSON estricto):
{
  "success": true,
  "planId": "string",
  "executedChanges": [
    {
      "moduleKey": "string",
      "action": "string",
      "result": "success" | "warning" | "skipped",
      "details": "string"
    }
  ],
  "rollbackData": {...},
  "summary": "string"
}`;

        userPrompt = `Simula la ejecución del plan de propagación: ${planId}

Genera un resultado de ejecución exitosa con los cambios aplicados.`;
        break;

      case 'auto_fix':
        systemPrompt = `Eres un agente autónomo especializado en auto-reparación de módulos.

AUTO-REPARACIÓN:
- Genera soluciones específicas y seguras
- Minimiza el impacto en otros módulos
- Prepara rollback automático
- Documenta cada acción

FORMATO DE RESPUESTA (JSON estricto):
{
  "id": "uuid",
  "moduleKey": "string",
  "issue": {...},
  "proposedFix": "descripción detallada de la reparación",
  "fixActions": [
    {
      "action": "string",
      "target": "string",
      "value": any
    }
  ],
  "estimatedRisk": "low" | "medium" | "high",
  "rollbackPlan": "string",
  "status": "pending"
}`;

        userPrompt = `Genera una auto-reparación para este problema:

Módulo: ${context?.moduleName} (${context?.moduleKey})
Problema: ${JSON.stringify(issue, null, 2)}
Estado actual: ${JSON.stringify(context?.currentState, null, 2)}

Genera una solución detallada y segura.`;
        break;

      case 'apply_healing':
        systemPrompt = `Eres un agente que aplica acciones de auto-reparación.

FORMATO DE RESPUESTA (JSON estricto):
{
  "success": true,
  "actionId": "string",
  "appliedAt": "ISO timestamp",
  "result": "descripción del resultado",
  "verification": {
    "passed": boolean,
    "details": "string"
  }
}`;

        userPrompt = `Simula la aplicación de la acción de auto-reparación: ${actionId}`;
        break;

      case 'smart_rollback':
        systemPrompt = `Eres un agente autónomo que realiza rollbacks inteligentes.

ROLLBACK INTELIGENTE:
- Analiza el estado actual vs deseado
- Determina la ruta óptima de rollback
- Minimiza pérdida de datos/cambios válidos
- Propaga rollback a dependientes si es necesario

FORMATO DE RESPUESTA (JSON estricto):
{
  "success": true,
  "moduleKey": "string",
  "rolledBackTo": "string (versión)",
  "affectedModules": ["string"],
  "preservedChanges": ["string"],
  "actions": [
    {
      "action": "string",
      "target": "string",
      "result": "string"
    }
  ],
  "summary": "string"
}`;

        userPrompt = `Realiza un rollback inteligente:

Módulo: ${context?.moduleName} (${context?.moduleKey})
Estado actual: ${JSON.stringify(context?.currentState, null, 2)}
Versión objetivo: ${targetVersion || 'anterior estable'}

Genera un plan de rollback inteligente.`;
        break;

      case 'resolve_conflicts':
        systemPrompt = `Eres un agente autónomo que resuelve conflictos entre módulos.

RESOLUCIÓN DE CONFLICTOS:
- Identifica la causa raíz del conflicto
- Genera soluciones que satisfacen a todos los módulos
- Prioriza estabilidad del sistema
- Propone cambios mínimos necesarios

FORMATO DE RESPUESTA (JSON estricto):
{
  "id": "uuid",
  "sourceModule": "string",
  "changeDescription": "Resolución de conflictos",
  "conflictAnalysis": {
    "rootCause": "string",
    "involvedModules": ["string"],
    "conflictType": "string"
  },
  "affectedModules": [...],
  "totalRisk": "low" | "medium" | "high",
  "estimatedImpact": "string",
  "status": "pending",
  "createdAt": "ISO timestamp"
}`;

        userPrompt = `Resuelve conflictos entre módulos:

Módulo origen: ${context?.moduleName} (${context?.moduleKey})
Módulos en conflicto: ${conflictingModules?.join(', ')}
Estado actual: ${JSON.stringify(context?.currentState, null, 2)}

Genera un plan de resolución de conflictos.`;
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
          error: 'Rate limit exceeded. Intenta más tarde.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Créditos de IA insuficientes.' 
        }), {
          status: 402,
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
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[module-autonomous-agent] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[module-autonomous-agent] Success: ${action}`);

    // Build response based on action
    const responseData: Record<string, unknown> = {
      success: true,
      action,
      timestamp: new Date().toISOString()
    };

    switch (action) {
      case 'check_health':
        responseData.health = result;
        break;
      case 'analyze_propagation':
        responseData.plan = result;
        break;
      case 'execute_propagation':
        responseData.result = result;
        break;
      case 'auto_fix':
        responseData.healingAction = result;
        break;
      case 'apply_healing':
        responseData.result = result;
        break;
      case 'smart_rollback':
        responseData.result = result;
        break;
      case 'resolve_conflicts':
        responseData.resolutionPlan = result;
        break;
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[module-autonomous-agent] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
