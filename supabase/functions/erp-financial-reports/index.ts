import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  action: 'generate_balance_sheet' | 'generate_income_statement' | 'generate_cash_flow' | 'generate_trial_balance' | 'ai_analysis';
  companyId: string;
  fiscalYearId?: string;
  periodId?: string;
  dateFrom?: string;
  dateTo?: string;
  compareWithPrevious?: boolean;
  accountData?: Record<string, unknown>;
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

    const { action, companyId, fiscalYearId, periodId, dateFrom, dateTo, compareWithPrevious, accountData } = await req.json() as ReportRequest;

    console.log(`[erp-financial-reports] Processing action: ${action} for company: ${companyId}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'generate_balance_sheet':
        systemPrompt = `Eres un experto contable en generación de Estados Financieros según normativa internacional (IFRS/NIIF) y local.

CONTEXTO:
- Generas Balances de Situación profesionales
- Aplicas principios de partida doble
- Clasificas correctamente Activos, Pasivos y Patrimonio

FORMATO DE RESPUESTA (JSON estricto):
{
  "reportType": "balance_sheet",
  "title": "Balance de Situación",
  "date": "fecha del reporte",
  "sections": {
    "assets": {
      "current": [{"account": "nombre", "amount": número}],
      "nonCurrent": [{"account": "nombre", "amount": número}],
      "totalAssets": número
    },
    "liabilities": {
      "current": [{"account": "nombre", "amount": número}],
      "nonCurrent": [{"account": "nombre", "amount": número}],
      "totalLiabilities": número
    },
    "equity": {
      "items": [{"account": "nombre", "amount": número}],
      "totalEquity": número
    }
  },
  "totalLiabilitiesAndEquity": número,
  "isBalanced": boolean,
  "notes": ["notas relevantes"],
  "recommendations": ["recomendaciones"]
}`;
        userPrompt = `Genera un Balance de Situación para:
- Empresa ID: ${companyId}
- Año fiscal: ${fiscalYearId || 'actual'}
- Período: ${periodId || 'acumulado'}
- Fecha desde: ${dateFrom || 'inicio año'}
- Fecha hasta: ${dateTo || 'hoy'}
- Comparar con anterior: ${compareWithPrevious ? 'sí' : 'no'}
- Datos de cuentas: ${JSON.stringify(accountData || {})}`;
        break;

      case 'generate_income_statement':
        systemPrompt = `Eres un experto contable en Estados de Resultados según normativa internacional.

CONTEXTO:
- Generas Estados de Pérdidas y Ganancias profesionales
- Calculas márgenes y ratios clave
- Identificas tendencias de rentabilidad

FORMATO DE RESPUESTA (JSON estricto):
{
  "reportType": "income_statement",
  "title": "Estado de Resultados",
  "periodStart": "fecha inicio",
  "periodEnd": "fecha fin",
  "sections": {
    "revenue": {
      "items": [{"account": "nombre", "amount": número}],
      "totalRevenue": número
    },
    "costOfSales": {
      "items": [{"account": "nombre", "amount": número}],
      "totalCost": número
    },
    "grossProfit": número,
    "operatingExpenses": {
      "items": [{"account": "nombre", "amount": número}],
      "totalExpenses": número
    },
    "operatingIncome": número,
    "otherIncome": número,
    "otherExpenses": número,
    "incomeBeforeTax": número,
    "taxExpense": número,
    "netIncome": número
  },
  "ratios": {
    "grossMargin": número,
    "operatingMargin": número,
    "netMargin": número
  },
  "notes": ["notas relevantes"],
  "trends": ["análisis de tendencias"]
}`;
        userPrompt = `Genera un Estado de Resultados para:
- Empresa ID: ${companyId}
- Período desde: ${dateFrom}
- Período hasta: ${dateTo}
- Comparar con período anterior: ${compareWithPrevious ? 'sí' : 'no'}
- Datos de cuentas: ${JSON.stringify(accountData || {})}`;
        break;

      case 'generate_cash_flow':
        systemPrompt = `Eres un experto en Estados de Flujo de Efectivo según IAS 7.

CONTEXTO:
- Generas Estados de Flujo de Efectivo método indirecto
- Clasificas en actividades operativas, inversión y financiación
- Identificas fuentes y usos de efectivo

FORMATO DE RESPUESTA (JSON estricto):
{
  "reportType": "cash_flow",
  "title": "Estado de Flujos de Efectivo",
  "periodStart": "fecha inicio",
  "periodEnd": "fecha fin",
  "sections": {
    "operating": {
      "netIncome": número,
      "adjustments": [{"item": "nombre", "amount": número}],
      "workingCapitalChanges": [{"item": "nombre", "amount": número}],
      "netCashFromOperating": número
    },
    "investing": {
      "items": [{"item": "nombre", "amount": número}],
      "netCashFromInvesting": número
    },
    "financing": {
      "items": [{"item": "nombre", "amount": número}],
      "netCashFromFinancing": número
    }
  },
  "netChangeInCash": número,
  "beginningCash": número,
  "endingCash": número,
  "notes": ["notas relevantes"],
  "liquidity_analysis": "análisis de liquidez"
}`;
        userPrompt = `Genera un Estado de Flujos de Efectivo para:
- Empresa ID: ${companyId}
- Período desde: ${dateFrom}
- Período hasta: ${dateTo}
- Datos de cuentas: ${JSON.stringify(accountData || {})}`;
        break;

      case 'generate_trial_balance':
        systemPrompt = `Eres un experto contable en Balance de Comprobación.

FORMATO DE RESPUESTA (JSON estricto):
{
  "reportType": "trial_balance",
  "title": "Balance de Comprobación",
  "date": "fecha",
  "accounts": [
    {
      "code": "código",
      "name": "nombre cuenta",
      "debit": número,
      "credit": número,
      "balance": número,
      "nature": "deudora|acreedora"
    }
  ],
  "totals": {
    "totalDebit": número,
    "totalCredit": número,
    "isBalanced": boolean
  },
  "notes": ["notas"]
}`;
        userPrompt = `Genera un Balance de Comprobación para:
- Empresa ID: ${companyId}
- Fecha: ${dateTo}
- Datos de cuentas: ${JSON.stringify(accountData || {})}`;
        break;

      case 'ai_analysis':
        systemPrompt = `Eres un analista financiero experto que proporciona insights profundos sobre estados financieros.

FORMATO DE RESPUESTA (JSON estricto):
{
  "analysis": {
    "summary": "resumen ejecutivo",
    "strengths": ["fortalezas identificadas"],
    "weaknesses": ["debilidades detectadas"],
    "opportunities": ["oportunidades de mejora"],
    "risks": ["riesgos potenciales"]
  },
  "ratios": {
    "liquidity": {"current": número, "quick": número, "interpretation": "texto"},
    "profitability": {"roe": número, "roa": número, "interpretation": "texto"},
    "leverage": {"debtToEquity": número, "interpretation": "texto"}
  },
  "recommendations": [
    {"priority": "alta|media|baja", "action": "acción recomendada", "impact": "impacto esperado"}
  ],
  "forecast": "proyección a corto plazo"
}`;
        userPrompt = `Analiza los siguientes datos financieros y proporciona insights:
${JSON.stringify(accountData || {})}`;
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
        temperature: 0.3,
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
      console.error('[erp-financial-reports] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[erp-financial-reports] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-financial-reports] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
