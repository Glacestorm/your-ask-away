import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MonitoringRequest {
  action: 'analyze_logs' | 'health_check' | 'diagnose' | 'predict_issues' | 'generate_report';
  context?: {
    moduleKey?: string;
    timeRange?: string;
    logLevel?: string;
    metrics?: Record<string, unknown>;
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

    const { action, context, params } = await req.json() as MonitoringRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'analyze_logs':
        systemPrompt = `Eres un experto en análisis de logs y monitoreo de sistemas enterprise.

CONTEXTO DEL ROL:
- Analizas patrones en logs de aplicaciones modulares
- Detectas anomalías y problemas potenciales
- Clasificas la severidad de los eventos
- Identificas correlaciones entre eventos

FORMATO DE RESPUESTA (JSON estricto):
{
  "analysis": {
    "totalEvents": number,
    "errorCount": number,
    "warningCount": number,
    "patterns": [{"pattern": string, "frequency": number, "severity": string}],
    "anomalies": [{"type": string, "description": string, "timestamp": string}],
    "rootCauses": [{"issue": string, "probability": number, "evidence": string[]}]
  },
  "recommendations": [{"priority": "high"|"medium"|"low", "action": string, "impact": string}],
  "healthScore": number,
  "trend": "improving"|"stable"|"degrading"
}`;
        userPrompt = context 
          ? `Analiza los siguientes logs del módulo ${context.moduleKey || 'sistema'}:
Rango de tiempo: ${context.timeRange || 'última hora'}
Nivel de log: ${context.logLevel || 'todos'}
Métricas actuales: ${JSON.stringify(context.metrics || {})}`
          : 'Proporciona un análisis general del estado del sistema';
        break;

      case 'health_check':
        systemPrompt = `Eres un sistema de verificación de salud para arquitecturas modulares enterprise.

CONTEXTO DEL ROL:
- Evalúas el estado de salud de cada componente
- Verificas conectividad y disponibilidad
- Mides tiempos de respuesta y throughput
- Detectas degradaciones de servicio

FORMATO DE RESPUESTA (JSON estricto):
{
  "overallHealth": "healthy"|"degraded"|"critical"|"unknown",
  "score": number,
  "components": [
    {
      "name": string,
      "status": "healthy"|"degraded"|"critical"|"unknown",
      "responseTime": number,
      "lastCheck": string,
      "issues": string[]
    }
  ],
  "alerts": [{"severity": string, "component": string, "message": string}],
  "uptime": {"percentage": number, "lastDowntime": string|null}
}`;
        userPrompt = `Realiza un health check del módulo: ${context?.moduleKey || 'todos los módulos'}`;
        break;

      case 'diagnose':
        systemPrompt = `Eres un sistema de diagnóstico automático con IA para problemas en sistemas enterprise.

CONTEXTO DEL ROL:
- Identificas la causa raíz de problemas
- Correlacionas síntomas con posibles causas
- Sugieres acciones correctivas específicas
- Evalúas el impacto y urgencia

FORMATO DE RESPUESTA (JSON estricto):
{
  "diagnosis": {
    "problemSummary": string,
    "severity": "critical"|"high"|"medium"|"low",
    "affectedComponents": string[],
    "rootCause": {
      "description": string,
      "confidence": number,
      "evidence": string[]
    },
    "relatedIssues": string[]
  },
  "solutions": [
    {
      "action": string,
      "complexity": "simple"|"moderate"|"complex",
      "estimatedTime": string,
      "automatable": boolean,
      "steps": string[]
    }
  ],
  "preventionRecommendations": string[]
}`;
        userPrompt = `Diagnostica el siguiente problema: ${JSON.stringify(params)}`;
        break;

      case 'predict_issues':
        systemPrompt = `Eres un sistema predictivo de IA para anticipar problemas en sistemas enterprise.

CONTEXTO DEL ROL:
- Analizas tendencias históricas
- Predices posibles fallos futuros
- Identificas patrones de degradación
- Calculas probabilidades de incidentes

FORMATO DE RESPUESTA (JSON estricto):
{
  "predictions": [
    {
      "issue": string,
      "probability": number,
      "estimatedTimeframe": string,
      "affectedModules": string[],
      "indicators": string[],
      "preventiveActions": string[]
    }
  ],
  "riskScore": number,
  "trendAnalysis": {
    "cpu": "stable"|"increasing"|"decreasing",
    "memory": "stable"|"increasing"|"decreasing",
    "errors": "stable"|"increasing"|"decreasing",
    "latency": "stable"|"increasing"|"decreasing"
  },
  "recommendedMaintenanceWindow": string
}`;
        userPrompt = context 
          ? `Predice posibles problemas basándote en: ${JSON.stringify(context.metrics)}`
          : 'Proporciona predicciones generales del sistema';
        break;

      case 'generate_report':
        systemPrompt = `Eres un generador de reportes de monitoreo para sistemas enterprise.

CONTEXTO DEL ROL:
- Generas reportes ejecutivos concisos
- Resumes métricas clave
- Destacas incidentes y resoluciones
- Proporcionas tendencias y comparativas

FORMATO DE RESPUESTA (JSON estricto):
{
  "report": {
    "title": string,
    "period": string,
    "generatedAt": string,
    "executiveSummary": string,
    "keyMetrics": {
      "uptime": number,
      "avgResponseTime": number,
      "totalRequests": number,
      "errorRate": number
    },
    "highlights": string[],
    "incidents": [{"date": string, "description": string, "resolution": string, "duration": string}],
    "trends": {
      "performance": "improved"|"stable"|"degraded",
      "reliability": "improved"|"stable"|"degraded",
      "usage": "increased"|"stable"|"decreased"
    }
  },
  "recommendations": string[],
  "nextSteps": string[]
}`;
        userPrompt = `Genera un reporte de monitoreo para: ${context?.moduleKey || 'todo el sistema'}
Período: ${context?.timeRange || 'última semana'}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[module-monitoring-ai] Processing action: ${action}`);

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
        max_tokens: 2500,
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
      console.error('[module-monitoring-ai] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[module-monitoring-ai] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[module-monitoring-ai] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
