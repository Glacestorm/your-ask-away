import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FunctionRequest {
  action: 'get_data' | 'match_transactions' | 'generate_eliminations' | 'consolidate' | 'transfer_pricing_analysis' | 'generate_group_report';
  context?: Record<string, unknown>;
  transactionId?: string;
  reportType?: string;
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

    const { action, context, transactionId, reportType } = await req.json() as FunctionRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_data':
        systemPrompt = `Eres un experto en consolidación financiera y operaciones intercompañía.

FORMATO DE RESPUESTA (JSON estricto):
{
  "entities": [
    {
      "id": "string",
      "name": "string",
      "code": "string",
      "type": "parent|subsidiary|affiliate|branch",
      "country": "string",
      "currency": "string",
      "ownershipPercent": number,
      "consolidationMethod": "full|equity|proportional",
      "isActive": true
    }
  ],
  "transactions": [
    {
      "id": "string",
      "fromEntityId": "string",
      "fromEntityName": "string",
      "toEntityId": "string",
      "toEntityName": "string",
      "transactionType": "sale|purchase|loan|dividend|service|royalty",
      "amount": number,
      "currency": "string",
      "date": "ISO date",
      "status": "pending|matched|eliminated|reconciled"
    }
  ],
  "reports": [
    {
      "id": "string",
      "period": "string",
      "status": "draft|in_progress|completed|approved",
      "createdAt": "ISO date"
    }
  ],
  "stats": {
    "totalEntities": number,
    "pendingEliminations": number,
    "consolidatedAssets": number
  }
}`;
        userPrompt = `Obtener datos intercompañía para: ${JSON.stringify(context || {})}`;
        break;

      case 'match_transactions':
        systemPrompt = `Eres un sistema de matching de transacciones intercompañía.

FORMATO DE RESPUESTA (JSON estricto):
{
  "matchedCount": number,
  "unmatchedCount": number,
  "matches": [
    {
      "transactionId1": "string",
      "transactionId2": "string",
      "matchConfidence": number,
      "difference": number
    }
  ],
  "discrepancies": [
    {
      "transactionId": "string",
      "issue": "string",
      "suggestedAction": "string"
    }
  ]
}`;
        userPrompt = `Emparejar transacciones intercompañía para: ${JSON.stringify(context || {})}`;
        break;

      case 'generate_eliminations':
        systemPrompt = `Eres un generador de asientos de eliminación para consolidación.

FORMATO DE RESPUESTA (JSON estricto):
{
  "eliminations": [
    {
      "id": "string",
      "type": "intercompany_receivable|intercompany_payable|intercompany_revenue|intercompany_expense|investment",
      "debitAccount": "string",
      "creditAccount": "string",
      "amount": number,
      "description": "string"
    }
  ],
  "totalEliminationAmount": number,
  "warnings": ["string"]
}`;
        userPrompt = `Generar eliminaciones para: ${JSON.stringify(context || {})}`;
        break;

      case 'consolidate':
        systemPrompt = `Eres un motor de consolidación financiera.

FORMATO DE RESPUESTA (JSON estricto):
{
  "consolidationId": "string",
  "status": "completed",
  "consolidatedBalanceSheet": {
    "totalAssets": number,
    "totalLiabilities": number,
    "totalEquity": number
  },
  "consolidatedIncomeStatement": {
    "totalRevenue": number,
    "totalExpenses": number,
    "netIncome": number
  },
  "minorityInterest": number,
  "goodwill": number,
  "currencyTranslationAdjustment": number
}`;
        userPrompt = `Ejecutar consolidación para: ${JSON.stringify(context || {})}`;
        break;

      case 'transfer_pricing_analysis':
        systemPrompt = `Eres un analista de precios de transferencia.

FORMATO DE RESPUESTA (JSON estricto):
{
  "transactionId": "string",
  "analysis": {
    "method": "CUP|RPM|CPM|TNMM|PSM",
    "armLengthRange": {
      "min": number,
      "max": number,
      "median": number
    },
    "actualPrice": number,
    "isWithinRange": true,
    "adjustment": number,
    "riskLevel": "low|medium|high",
    "documentation": ["string"],
    "recommendations": ["string"]
  }
}`;
        userPrompt = `Analizar precios de transferencia para transacción: ${transactionId}`;
        break;

      case 'generate_group_report':
        systemPrompt = `Eres un generador de reportes de grupo empresarial.

FORMATO DE RESPUESTA (JSON estricto):
{
  "reportId": "string",
  "reportType": "string",
  "generatedAt": "ISO date",
  "data": {
    "summary": "string",
    "keyMetrics": {},
    "entityBreakdown": [],
    "charts": []
  },
  "exportFormats": ["PDF", "Excel", "XBRL"]
}`;
        userPrompt = `Generar reporte de grupo tipo ${reportType} para: ${JSON.stringify(context || {})}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[obelixia-intercompany] Processing action: ${action}`);

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
      console.error('[obelixia-intercompany] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[obelixia-intercompany] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[obelixia-intercompany] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
