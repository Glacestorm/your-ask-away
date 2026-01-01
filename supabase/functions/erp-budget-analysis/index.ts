/**
 * erp-budget-analysis - Edge Function para análisis de presupuestos
 * Fase 4: Budget Management
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BudgetRequest {
  action: 'get_budget_data' | 'analyze_variances' | 'ai_insights' | 'generate_forecast';
  context?: {
    companyId: string;
    fiscalYear: number;
    versionId?: string;
    periodStart?: string;
    periodEnd?: string;
  };
  budgetLines?: unknown[];
  summary?: unknown;
  months?: number;
  historicalData?: unknown[];
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

    const { action, context, budgetLines, summary, months, historicalData } = await req.json() as BudgetRequest;

    console.log(`[erp-budget-analysis] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_budget_data':
        systemPrompt = `Eres un experto en gestión presupuestaria empresarial.
        
CONTEXTO:
- Análisis de presupuestos corporativos
- Seguimiento de ejecución presupuestaria
- Comparación real vs presupuestado

FORMATO DE RESPUESTA (JSON estricto):
{
  "budgetLines": [
    {
      "id": "string",
      "accountCode": "string",
      "accountName": "string",
      "category": "revenue|expense",
      "budgetedAmount": number,
      "actualAmount": number,
      "varianceAmount": number,
      "variancePercentage": number,
      "status": "on_track|warning|critical|exceeded"
    }
  ],
  "summary": {
    "totalBudgetedRevenue": number,
    "totalActualRevenue": number,
    "revenueVariance": number,
    "totalBudgetedExpenses": number,
    "totalActualExpenses": number,
    "expenseVariance": number,
    "budgetUtilization": number,
    "overallHealth": "excellent|good|warning|critical"
  }
}`;

        userPrompt = `Genera datos de presupuesto para el año fiscal ${context?.fiscalYear || new Date().getFullYear()}.`;
        break;

      case 'analyze_variances':
        systemPrompt = `Eres un analista financiero especializado en análisis de variaciones presupuestarias.

CONTEXTO:
- Identificar causas raíz de desviaciones
- Evaluar impacto financiero
- Proponer acciones correctivas

FORMATO DE RESPUESTA (JSON estricto):
{
  "analysis": [
    {
      "accountCode": "string",
      "accountName": "string",
      "varianceType": "favorable|unfavorable",
      "varianceAmount": number,
      "variancePercentage": number,
      "trend": "improving|stable|worsening",
      "rootCauses": ["string"],
      "recommendations": ["string"],
      "impactLevel": "low|medium|high"
    }
  ]
}`;

        userPrompt = `Analiza las variaciones presupuestarias:
${JSON.stringify(budgetLines, null, 2)}`;
        break;

      case 'ai_insights':
        systemPrompt = `Eres un consultor financiero senior con IA especializado en optimización presupuestaria.

CONTEXTO:
- Identificar oportunidades de ahorro
- Detectar riesgos financieros
- Proponer mejoras estratégicas

FORMATO DE RESPUESTA (JSON estricto):
{
  "insights": [
    {
      "id": "string",
      "type": "optimization|risk|opportunity|trend",
      "title": "string",
      "description": "string",
      "impact": "low|medium|high",
      "actionable": boolean,
      "suggestedActions": ["string"],
      "affectedAccounts": ["string"],
      "potentialSavings": number,
      "confidence": number
    }
  ]
}`;

        userPrompt = `Analiza y genera insights para:
Líneas de presupuesto: ${JSON.stringify(budgetLines)}
Resumen: ${JSON.stringify(summary)}`;
        break;

      case 'generate_forecast':
        systemPrompt = `Eres un experto en pronósticos financieros y modelado predictivo.

CONTEXTO:
- Proyecciones basadas en datos históricos
- Análisis de tendencias
- Escenarios con intervalos de confianza

FORMATO DE RESPUESTA (JSON estricto):
{
  "forecasts": [
    {
      "period": "YYYY-MM",
      "forecastedRevenue": number,
      "forecastedExpenses": number,
      "forecastedNetIncome": number,
      "confidenceLevel": number,
      "assumptions": ["string"]
    }
  ]
}`;

        userPrompt = `Genera pronóstico para los próximos ${months || 6} meses basado en:
${JSON.stringify(historicalData)}`;
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
    } catch (parseError) {
      console.error('[erp-budget-analysis] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[erp-budget-analysis] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-budget-analysis] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
