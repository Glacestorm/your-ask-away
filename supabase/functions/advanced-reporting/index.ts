import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportingRequest {
  action: 'generate' | 'generate_insights' | 'list_templates' | 'list_schedules' | 'create_schedule' | 
          'export' | 'ask' | 'compare' |
          'generate_report' | 'analyze_trends' | 'create_dashboard' | 'executive_summary' | 'forecast';
  templateId?: string;
  reportId?: string;
  period?: { start: string; end: string };
  period1?: { start: string; end: string };
  period2?: { start: string; end: string };
  options?: { includeAIInsights?: boolean; format?: string };
  format?: 'pdf' | 'excel' | 'html';
  question?: string;
  schedule?: Record<string, unknown>;
  context?: {
    reportType?: string;
    metrics?: string[];
    timeRange?: { start: string; end: string };
    dimensions?: string[];
    filters?: Record<string, unknown>;
  };
  data?: unknown;
}

// Mock data generators
function generateMockTemplates() {
  return [
    { id: 'tpl-exec', name: 'Resumen Ejecutivo', type: 'executive', sections: ['KPIs', 'Tendencias', 'Alertas'], default_period: 'monthly', ai_enhancements: true },
    { id: 'tpl-ops', name: 'Operaciones Diarias', type: 'operational', sections: ['Métricas', 'Incidencias', 'Tareas'], default_period: 'daily', ai_enhancements: true },
    { id: 'tpl-fin', name: 'Informe Financiero', type: 'financial', sections: ['Ingresos', 'Gastos', 'P&L'], default_period: 'monthly', ai_enhancements: true },
    { id: 'tpl-perf', name: 'Rendimiento de Equipo', type: 'performance', sections: ['KPIs', 'Objetivos', 'Ranking'], default_period: 'weekly', ai_enhancements: false }
  ];
}

function generateMockSchedules() {
  return [
    { id: 'sch-1', template_id: 'tpl-exec', frequency: 'monthly', recipients: ['ceo@company.com', 'cfo@company.com'], next_run: '2025-02-01T08:00:00Z', enabled: true },
    { id: 'sch-2', template_id: 'tpl-ops', frequency: 'daily', recipients: ['ops@company.com'], next_run: '2025-01-28T07:00:00Z', enabled: true },
    { id: 'sch-3', template_id: 'tpl-fin', frequency: 'weekly', recipients: ['finance@company.com'], next_run: '2025-01-31T09:00:00Z', enabled: false }
  ];
}

function generateMockReport(templateId: string, period: { start: string; end: string }) {
  return {
    id: `rpt-${Date.now()}`,
    title: 'Informe Ejecutivo Q1 2025',
    type: 'executive',
    period,
    sections: [
      {
        id: 'sec-1',
        title: 'Resumen de KPIs',
        content: 'Rendimiento general positivo con crecimiento del 15% en ingresos.',
        charts: [
          { type: 'line', title: 'Ingresos Mensuales', data: [{ month: 'Ene', value: 150000 }, { month: 'Feb', value: 165000 }], config: {} }
        ],
        insights: ['Crecimiento sostenido del 15% MoM', 'Retención de clientes en 94%'],
        recommendations: ['Expandir equipo de ventas', 'Optimizar proceso de onboarding']
      },
      {
        id: 'sec-2',
        title: 'Análisis de Tendencias',
        content: 'Las tendencias muestran un patrón de crecimiento consistente.',
        insights: ['Demanda creciente en segmento enterprise', 'Reducción del churn en 2 puntos']
      }
    ],
    executive_summary: 'El período muestra resultados sólidos con crecimiento en todas las áreas clave. Se recomienda mantener el enfoque en retención y expandir capacidad comercial.',
    key_metrics: [
      { label: 'Ingresos', value: 315000, change: 15.2 },
      { label: 'Clientes Activos', value: 1250, change: 8.5 },
      { label: 'NPS', value: 72, change: 5 },
      { label: 'Churn Rate', value: '2.1%', change: -0.5 }
    ],
    generated_at: new Date().toISOString(),
    format: 'html'
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json() as ReportingRequest;
    const { action } = requestBody;
    console.log(`[advanced-reporting] Processing action: ${action}`);

    // Handle mock data actions (no AI needed)
    switch (action) {
      case 'list_templates':
        return new Response(JSON.stringify({
          success: true,
          templates: generateMockTemplates(),
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'list_schedules':
        return new Response(JSON.stringify({
          success: true,
          schedules: generateMockSchedules(),
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'generate':
        const report = generateMockReport(
          requestBody.templateId || 'tpl-exec', 
          requestBody.period || { start: '2025-01-01', end: '2025-01-31' }
        );
        return new Response(JSON.stringify({
          success: true,
          report,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'create_schedule':
        const newSchedule = {
          id: `sch-${Date.now()}`,
          ...requestBody.schedule,
          next_run: new Date(Date.now() + 86400000).toISOString(),
          enabled: true
        };
        return new Response(JSON.stringify({
          success: true,
          schedule: newSchedule,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'export':
        return new Response(JSON.stringify({
          success: true,
          downloadUrl: `https://storage.example.com/reports/${requestBody.reportId}.${requestBody.format}`,
          format: requestBody.format,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // For AI-powered actions
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';
    const { context, reportId, question, period1, period2, templateId } = requestBody;

    switch (action) {
      case 'generate_insights':
        systemPrompt = `Eres un analista de datos empresariales experto.

GENERA insights accionables basados en el reporte.

RESPONDE EN JSON ESTRICTO:
{
  "insights": [string, string, string, string, string]
}`;
        userPrompt = `Genera 5 insights para el reporte: ${reportId}`;
        break;

      case 'ask':
        systemPrompt = `Eres un asistente de análisis de reportes.

RESPONDE preguntas sobre los datos del reporte de forma clara y concisa.

RESPONDE EN JSON ESTRICTO:
{
  "answer": string
}`;
        userPrompt = `Pregunta sobre reporte ${reportId}: ${question}`;
        break;

      case 'compare':
        systemPrompt = `Eres un analista comparativo de datos empresariales.

COMPARA dos períodos y proporciona análisis detallado.

RESPONDE EN JSON ESTRICTO:
{
  "comparison": [
    { "metric": string, "period1": number, "period2": number, "change": number }
  ],
  "insights": [string]
}`;
        userPrompt = `Compara períodos:
Período 1: ${period1?.start} a ${period1?.end}
Período 2: ${period2?.start} a ${period2?.end}
Template: ${templateId}`;
        break;

      case 'generate_report':
        systemPrompt = `Eres un generador de informes empresariales avanzados.

GENERA un informe completo con datos simulados realistas.

RESPONDE EN JSON ESTRICTO:
{
  "report": {
    "title": string,
    "generatedAt": string,
    "period": string,
    "sections": [
      {
        "title": string,
        "content": string,
        "data": object,
        "visualizationType": string,
        "insights": string[]
      }
    ],
    "kpis": [
      { "name": string, "value": number, "change": number, "trend": string }
    ],
    "recommendations": string[],
    "nextSteps": string[]
  }
}`;
        userPrompt = `Genera informe de tipo: ${context?.reportType}
Métricas: ${context?.metrics?.join(', ')}
Período: ${context?.timeRange?.start} a ${context?.timeRange?.end}
Dimensiones: ${context?.dimensions?.join(', ')}`;
        break;

      case 'analyze_trends':
        systemPrompt = `Eres un analista de tendencias empresariales.

ANALIZA tendencias en los datos proporcionados.

RESPONDE EN JSON ESTRICTO:
{
  "trendAnalysis": {
    "overallTrend": "upward" | "downward" | "stable" | "volatile",
    "metrics": [
      {
        "name": string,
        "trend": string,
        "changeRate": number,
        "forecast": number,
        "confidence": number
      }
    ],
    "seasonality": string[],
    "anomalies": [{ "date": string, "metric": string, "description": string }],
    "correlations": [{ "metrics": string[], "strength": number }]
  },
  "insights": string[],
  "actionRecommendations": string[]
}`;
        userPrompt = `Analiza tendencias para métricas: ${context?.metrics?.join(', ')}
Período: ${context?.timeRange?.start} a ${context?.timeRange?.end}`;
        break;

      case 'executive_summary':
        systemPrompt = `Eres un generador de resúmenes ejecutivos.

GENERA un resumen ejecutivo conciso pero completo.

RESPONDE EN JSON ESTRICTO:
{
  "executiveSummary": {
    "headline": string,
    "keyHighlights": string[],
    "performanceSnapshot": {
      "overallScore": number,
      "status": "exceeding" | "on_track" | "at_risk" | "behind"
    },
    "topWins": string[],
    "concerns": string[],
    "strategicRecommendations": string[],
    "outlook": string
  }
}`;
        userPrompt = `Genera resumen ejecutivo para período: ${context?.timeRange?.start} a ${context?.timeRange?.end}`;
        break;

      case 'forecast':
        systemPrompt = `Eres un sistema de forecasting empresarial.

GENERA pronósticos basados en datos históricos.

RESPONDE EN JSON ESTRICTO:
{
  "forecasts": [
    {
      "metric": string,
      "currentValue": number,
      "forecast30Days": number,
      "forecast90Days": number,
      "forecast365Days": number,
      "confidence": number,
      "drivers": string[]
    }
  ],
  "scenarios": [
    { "name": string, "probability": number, "outcome": object }
  ],
  "assumptions": string[],
  "risks": string[]
}`;
        userPrompt = `Genera forecast para métricas: ${context?.metrics?.join(', ')}`;
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
        temperature: 0.6,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch {
      result = { rawContent: content, parseError: true };
    }

    console.log(`[advanced-reporting] Success: ${action}`);

    // Format response based on action
    const responseData: Record<string, unknown> = { success: true, action, timestamp: new Date().toISOString() };
    
    if (action === 'generate_insights') {
      responseData.insights = result?.insights || [];
    } else if (action === 'ask') {
      responseData.answer = result?.answer || '';
    } else if (action === 'compare') {
      responseData.comparison = result;
    } else {
      responseData.data = result;
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[advanced-reporting] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
