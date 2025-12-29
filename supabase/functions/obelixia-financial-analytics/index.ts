import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FunctionRequest {
  action: 'get_executive_kpis' | 'analyze_benchmarks' | 'get_strategic_insights' | 
          'assess_financial_health' | 'get_predictive_metrics' | 'generate_executive_report' | 
          'ask_ai_analyst';
  context?: Record<string, unknown>;
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

    const { action, context, params } = await req.json() as FunctionRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_executive_kpis':
        systemPrompt = `Eres un CFO virtual experto en análisis financiero ejecutivo.

CONTEXTO DEL ROL:
- Generar KPIs ejecutivos de alto nivel para C-suite
- Análisis de tendencias y comparativas
- Identificación de desviaciones significativas

FORMATO DE RESPUESTA (JSON estricto):
{
  "kpis": [
    {
      "id": "kpi_001",
      "name": "Margen EBITDA",
      "value": 18.5,
      "previousValue": 16.2,
      "change": 2.3,
      "changePercent": 14.2,
      "trend": "up",
      "target": 20,
      "targetProgress": 92.5,
      "unit": "%",
      "category": "profitability",
      "sparklineData": [15.2, 15.8, 16.2, 17.1, 17.8, 18.5],
      "benchmark": 15.0,
      "benchmarkDiff": 3.5
    }
  ]
}

Genera 8-10 KPIs ejecutivos cubriendo: profitability, liquidity, efficiency, growth, risk.`;

        userPrompt = context 
          ? `Genera KPIs ejecutivos para: ${JSON.stringify(context)}`
          : 'Genera KPIs ejecutivos estándar para una empresa mediana';
        break;

      case 'analyze_benchmarks':
        systemPrompt = `Eres un analista de benchmarking financiero sectorial.

CONTEXTO DEL ROL:
- Comparar métricas contra promedios de la industria
- Identificar gaps de rendimiento
- Recomendar mejoras prioritarias

FORMATO DE RESPUESTA (JSON estricto):
{
  "benchmarks": [
    {
      "id": "bench_001",
      "metric": "ROE",
      "companyValue": 12.5,
      "industryAverage": 10.2,
      "industryTop25": 18.5,
      "industryMedian": 9.8,
      "percentile": 68,
      "gap": 6.0,
      "recommendation": "Optimizar estructura de capital para alcanzar top quartile",
      "priority": "medium"
    }
  ]
}

Genera 6-8 análisis de benchmark para métricas clave financieras.`;

        userPrompt = context 
          ? `Analiza benchmarks para industria: ${JSON.stringify(context)}`
          : 'Analiza benchmarks para sector servicios profesionales';
        break;

      case 'get_strategic_insights':
        systemPrompt = `Eres un consultor estratégico financiero de McKinsey.

CONTEXTO DEL ROL:
- Identificar oportunidades estratégicas
- Alertar sobre riesgos financieros
- Detectar tendencias de mercado
- Proponer acciones concretas

FORMATO DE RESPUESTA (JSON estricto):
{
  "insights": [
    {
      "id": "insight_001",
      "title": "Oportunidad de optimización de capital de trabajo",
      "description": "Los días de cobro han aumentado 15% sugiriendo oportunidad de mejora en gestión de cuentas por cobrar",
      "impact": "high",
      "category": "opportunity",
      "confidence": 0.85,
      "potentialValue": 250000,
      "timeframe": "3-6 meses",
      "actions": [
        "Implementar descuentos por pronto pago",
        "Revisar políticas de crédito",
        "Automatizar seguimiento de cobranza"
      ],
      "dataPoints": [
        {"metric": "DSO", "value": 45, "context": "vs 38 días año anterior"},
        {"metric": "Cuentas por cobrar", "value": 1250000, "context": "+18% YoY"}
      ]
    }
  ]
}

Genera 4-6 insights estratégicos con categorías: opportunity, risk, trend, action.`;

        userPrompt = context 
          ? `Genera insights estratégicos para: ${JSON.stringify(context)}`
          : 'Genera insights estratégicos para una empresa en crecimiento';
        break;

      case 'assess_financial_health':
        systemPrompt = `Eres un auditor financiero senior especializado en evaluación de salud empresarial.

CONTEXTO DEL ROL:
- Evaluar salud financiera integral
- Identificar fortalezas y debilidades
- Detectar factores de riesgo
- Scoring multidimensional

FORMATO DE RESPUESTA (JSON estricto):
{
  "health": {
    "overallScore": 78,
    "previousScore": 74,
    "trend": "improving",
    "dimensions": [
      {
        "name": "Liquidez",
        "score": 85,
        "weight": 0.2,
        "status": "excellent",
        "factors": ["Ratio corriente 2.1x", "Quick ratio 1.5x"]
      },
      {
        "name": "Solvencia",
        "score": 72,
        "weight": 0.25,
        "status": "good",
        "factors": ["Deuda/EBITDA 2.8x", "Cobertura intereses 4.2x"]
      },
      {
        "name": "Rentabilidad",
        "score": 80,
        "weight": 0.25,
        "status": "good",
        "factors": ["ROE 14%", "Margen neto 8.5%"]
      },
      {
        "name": "Eficiencia",
        "score": 75,
        "weight": 0.15,
        "status": "good",
        "factors": ["Rotación activos 1.2x", "Productividad +5%"]
      },
      {
        "name": "Crecimiento",
        "score": 70,
        "weight": 0.15,
        "status": "fair",
        "factors": ["Crecimiento ingresos 8%", "Expansión mercado limitada"]
      }
    ],
    "riskFactors": [
      {
        "factor": "Concentración de clientes",
        "severity": "medium",
        "mitigation": "Diversificar cartera de clientes top 10"
      }
    ],
    "strengths": ["Sólida posición de liquidez", "Márgenes por encima del sector"],
    "weaknesses": ["Alto apalancamiento operativo", "Ciclo de conversión de efectivo largo"]
  }
}`;

        userPrompt = context 
          ? `Evalúa salud financiera para: ${JSON.stringify(context)}`
          : 'Evalúa salud financiera de una empresa tipo';
        break;

      case 'get_predictive_metrics':
        systemPrompt = `Eres un científico de datos especializado en forecasting financiero.

CONTEXTO DEL ROL:
- Proyecciones basadas en modelos predictivos
- Análisis de drivers de valor
- Escenarios probabilísticos

FORMATO DE RESPUESTA (JSON estricto):
{
  "predictions": [
    {
      "id": "pred_001",
      "metric": "Ingresos",
      "currentValue": 5000000,
      "predictions": [
        {"period": "Q1 2025", "value": 5250000, "confidence": 0.85, "lowerBound": 4900000, "upperBound": 5600000},
        {"period": "Q2 2025", "value": 5500000, "confidence": 0.78, "lowerBound": 5000000, "upperBound": 6000000}
      ],
      "drivers": [
        {"factor": "Expansión comercial", "impact": 0.35, "direction": "positive"},
        {"factor": "Presión competitiva", "impact": 0.15, "direction": "negative"}
      ],
      "scenarios": [
        {"name": "Optimista", "probability": 0.25, "outcome": 6200000},
        {"name": "Base", "probability": 0.50, "outcome": 5500000},
        {"name": "Pesimista", "probability": 0.25, "outcome": 4800000}
      ]
    }
  ]
}`;

        const metrics = params?.metrics || ['revenue', 'ebitda', 'cashflow'];
        userPrompt = `Genera predicciones para métricas: ${JSON.stringify(metrics)}. Contexto: ${JSON.stringify(context || {})}`;
        break;

      case 'generate_executive_report':
        systemPrompt = `Eres un redactor ejecutivo de informes financieros para Consejos de Administración.

CONTEXTO DEL ROL:
- Redacción clara y ejecutiva
- Destacar puntos clave
- Recomendaciones accionables

FORMATO DE RESPUESTA (JSON estricto):
{
  "report": {
    "id": "report_001",
    "title": "Informe Ejecutivo Financiero",
    "period": "Q4 2024",
    "generatedAt": "${new Date().toISOString()}",
    "sections": [
      {
        "title": "Resumen Ejecutivo",
        "content": "El período cierra con resultados sólidos...",
        "highlights": ["EBITDA +15% vs año anterior", "Flujo de caja positivo €2.3M"]
      },
      {
        "title": "Análisis de Resultados",
        "content": "Los ingresos crecieron un 12%...",
        "highlights": ["Margen bruto estable 42%", "Gastos operativos controlados"]
      }
    ],
    "keyTakeaways": [
      "Performance por encima de presupuesto",
      "Posición de liquidez reforzada"
    ],
    "recommendations": [
      "Acelerar inversión en digitalización",
      "Considerar refinanciación de deuda"
    ],
    "format": "${params?.format || 'pdf'}"
  }
}`;

        userPrompt = `Genera informe ${params?.reportType || 'quarterly'} en formato ${params?.format || 'pdf'}. Contexto: ${JSON.stringify(context || {})}`;
        break;

      case 'ask_ai_analyst':
        systemPrompt = `Eres un analista financiero senior con 20 años de experiencia.

CONTEXTO DEL ROL:
- Responder preguntas financieras complejas
- Proporcionar análisis fundamentado
- Sugerir acciones concretas

FORMATO DE RESPUESTA (JSON estricto):
{
  "response": {
    "answer": "Respuesta detallada y profesional...",
    "confidence": 0.85,
    "sources": ["Análisis de estados financieros", "Ratios de industria"],
    "relatedMetrics": ["ROE", "ROIC", "Margen EBITDA"],
    "suggestedActions": ["Revisar estructura de costos", "Optimizar capital de trabajo"]
  }
}`;

        userPrompt = `Pregunta del ejecutivo: ${params?.question || 'Sin pregunta'}. Contexto empresa: ${JSON.stringify(context || {})}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[obelixia-financial-analytics] Processing action: ${action}`);

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
        max_tokens: 4000,
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
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required', 
          message: 'Créditos de IA insuficientes.' 
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
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('[obelixia-financial-analytics] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[obelixia-financial-analytics] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[obelixia-financial-analytics] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
