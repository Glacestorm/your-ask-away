import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PerformanceRequest {
  action: 'analyze_metrics' | 'optimize_cache' | 'suggest_improvements' | 'benchmark' | 'generate_optimization_plan';
  context?: {
    moduleKey?: string;
    currentMetrics?: Record<string, unknown>;
    targetMetrics?: Record<string, unknown>;
    constraints?: string[];
  };
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

    const { action, context, params } = await req.json() as PerformanceRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'analyze_metrics':
        systemPrompt = `Eres un experto en análisis de rendimiento para aplicaciones enterprise modulares.

CONTEXTO DEL ROL:
- Analizas métricas de rendimiento en profundidad
- Identificas cuellos de botella y áreas de mejora
- Comparas con benchmarks de la industria
- Priorizas optimizaciones por impacto

FORMATO DE RESPUESTA (JSON estricto):
{
  "analysis": {
    "overallScore": number,
    "grade": "A"|"B"|"C"|"D"|"F",
    "metrics": {
      "responseTime": {"value": number, "status": "excellent"|"good"|"fair"|"poor", "trend": string},
      "throughput": {"value": number, "status": string, "trend": string},
      "errorRate": {"value": number, "status": string, "trend": string},
      "cpuUsage": {"value": number, "status": string, "trend": string},
      "memoryUsage": {"value": number, "status": string, "trend": string}
    },
    "bottlenecks": [{"component": string, "issue": string, "impact": "high"|"medium"|"low"}],
    "comparisons": {"industryAvg": number, "topPerformers": number}
  },
  "insights": string[],
  "recommendations": [{"priority": number, "action": string, "expectedImprovement": string}]
}`;
        userPrompt = context?.currentMetrics 
          ? `Analiza estas métricas de rendimiento: ${JSON.stringify(context.currentMetrics)}`
          : 'Proporciona un análisis general de rendimiento';
        break;

      case 'optimize_cache':
        systemPrompt = `Eres un experto en estrategias de caché para aplicaciones web enterprise.

CONTEXTO DEL ROL:
- Diseñas estrategias de caché multicapa
- Optimizas TTLs y políticas de invalidación
- Balanceas memoria vs velocidad
- Implementas caché predictivo

FORMATO DE RESPUESTA (JSON estricto):
{
  "cacheStrategy": {
    "layers": [
      {
        "name": string,
        "type": "browser"|"cdn"|"application"|"database",
        "ttl": number,
        "policy": "lru"|"lfu"|"fifo"|"ttl",
        "size": string,
        "hitRate": number
      }
    ],
    "invalidationRules": [{"trigger": string, "pattern": string, "scope": string}],
    "warmingStrategy": {"enabled": boolean, "patterns": string[], "schedule": string}
  },
  "expectedImprovements": {
    "responseTimeReduction": string,
    "bandwidthSavings": string,
    "serverLoadReduction": string
  },
  "implementation": [{"step": number, "action": string, "complexity": string}],
  "monitoring": {"metrics": string[], "alerts": string[]}
}`;
        userPrompt = context 
          ? `Optimiza la estrategia de caché para: ${context.moduleKey || 'toda la aplicación'}
Métricas actuales: ${JSON.stringify(context.currentMetrics || {})}`
          : 'Sugiere una estrategia de caché óptima';
        break;

      case 'suggest_improvements':
        systemPrompt = `Eres un consultor de optimización de rendimiento para sistemas enterprise.

CONTEXTO DEL ROL:
- Identificas mejoras de alto impacto
- Priorizas por ROI y facilidad de implementación
- Consideras trade-offs y riesgos
- Proporcionas estimaciones realistas

FORMATO DE RESPUESTA (JSON estricto):
{
  "improvements": [
    {
      "id": string,
      "title": string,
      "category": "frontend"|"backend"|"database"|"infrastructure"|"code",
      "priority": "critical"|"high"|"medium"|"low",
      "effort": "low"|"medium"|"high",
      "impact": "low"|"medium"|"high",
      "roi": number,
      "description": string,
      "steps": string[],
      "risks": string[],
      "estimatedTimeToImplement": string,
      "expectedImprovement": string
    }
  ],
  "quickWins": string[],
  "longTermInitiatives": string[],
  "resourceRequirements": {"developers": number, "time": string, "tools": string[]}
}`;
        userPrompt = context 
          ? `Sugiere mejoras de rendimiento considerando:
Módulo: ${context.moduleKey || 'sistema completo'}
Métricas actuales: ${JSON.stringify(context.currentMetrics || {})}
Objetivos: ${JSON.stringify(context.targetMetrics || {})}
Restricciones: ${context.constraints?.join(', ') || 'ninguna'}`
          : 'Proporciona sugerencias generales de optimización';
        break;

      case 'benchmark':
        systemPrompt = `Eres un experto en benchmarking de aplicaciones enterprise.

CONTEXTO DEL ROL:
- Diseñas pruebas de rendimiento comprehensivas
- Comparas con estándares de la industria
- Identificas áreas de mejora competitiva
- Proporcionas contexto y significado a los números

FORMATO DE RESPUESTA (JSON estricto):
{
  "benchmark": {
    "testDate": string,
    "environment": string,
    "results": {
      "loadTest": {"rps": number, "avgLatency": number, "p99Latency": number, "errorRate": number},
      "stressTest": {"maxRps": number, "breakingPoint": number, "recoveryTime": number},
      "endurance": {"duration": string, "memoryLeak": boolean, "performanceDegradation": number}
    },
    "comparison": {
      "industryPercentile": number,
      "vsLastBenchmark": {"improvement": number, "areas": string[]},
      "vsBestInClass": {"gap": number, "keyDifferences": string[]}
    }
  },
  "scores": {
    "overall": number,
    "scalability": number,
    "reliability": number,
    "efficiency": number
  },
  "recommendations": string[]
}`;
        userPrompt = `Genera un benchmark para: ${context?.moduleKey || 'el sistema completo'}
Métricas base: ${JSON.stringify(context?.currentMetrics || {})}`;
        break;

      case 'generate_optimization_plan':
        systemPrompt = `Eres un arquitecto de soluciones especializado en planes de optimización enterprise.

CONTEXTO DEL ROL:
- Creas roadmaps de optimización detallados
- Secuencias mejoras por dependencias e impacto
- Defines métricas de éxito claras
- Planificas recursos y timelines realistas

FORMATO DE RESPUESTA (JSON estricto):
{
  "plan": {
    "title": string,
    "objective": string,
    "duration": string,
    "phases": [
      {
        "name": string,
        "duration": string,
        "objectives": string[],
        "tasks": [{"task": string, "owner": string, "effort": string, "dependencies": string[]}],
        "milestones": [{"name": string, "criteria": string, "date": string}],
        "risks": string[]
      }
    ],
    "resources": {
      "team": [{"role": string, "allocation": string}],
      "tools": string[],
      "budget": string
    },
    "successMetrics": [{"metric": string, "baseline": number, "target": number}],
    "rollbackPlan": string
  },
  "expectedOutcomes": {
    "performanceGain": string,
    "costSavings": string,
    "userExperienceImprovement": string
  }
}`;
        userPrompt = context 
          ? `Genera un plan de optimización para:
Módulo: ${context.moduleKey || 'sistema completo'}
Estado actual: ${JSON.stringify(context.currentMetrics || {})}
Objetivos: ${JSON.stringify(context.targetMetrics || {})}
Restricciones: ${context.constraints?.join(', ') || 'ninguna'}`
          : 'Genera un plan de optimización general';
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[module-performance-ai] Processing action: ${action}`);

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
      console.error('[module-performance-ai] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[module-performance-ai] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[module-performance-ai] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
