import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegulatoryRequest {
  action: 'get_standards' | 'generate_report' | 'validate_compliance' | 'get_deadlines' | 'analyze_gaps';
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

    const { action, context, params } = await req.json() as RegulatoryRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_standards':
        systemPrompt = `Eres un experto en normativas contables y regulatorias internacionales (IFRS, GAAP, NIF).

FORMATO DE RESPUESTA (JSON estricto):
{
  "standards": [
    {
      "id": "string",
      "code": "IFRS 16",
      "name": "string",
      "category": "financial_instruments" | "revenue" | "leases" | "consolidation" | "tax" | "disclosure",
      "status": "applicable" | "pending" | "not_applicable",
      "complianceLevel": 0-100,
      "lastReview": "ISO date",
      "nextReview": "ISO date",
      "requirements": ["string"],
      "gaps": ["string"]
    }
  ],
  "overallCompliance": 0-100,
  "criticalGaps": number,
  "upcomingDeadlines": number
}`;
        userPrompt = context 
          ? `Analiza el estado de cumplimiento regulatorio para: ${JSON.stringify(context)}`
          : 'Proporciona un resumen de las principales normativas contables aplicables';
        break;

      case 'generate_report':
        systemPrompt = `Eres un generador de reportes regulatorios experto en compliance contable.

FORMATO DE RESPUESTA (JSON estricto):
{
  "report": {
    "id": "string",
    "type": "ifrs" | "gaap" | "local" | "tax" | "audit",
    "title": "string",
    "period": "string",
    "status": "draft" | "review" | "approved" | "submitted",
    "sections": [
      {
        "id": "string",
        "title": "string",
        "content": "string",
        "tables": [],
        "notes": ["string"]
      }
    ],
    "validations": [
      {
        "rule": "string",
        "passed": boolean,
        "message": "string"
      }
    ],
    "attachments": []
  },
  "warnings": ["string"],
  "recommendations": ["string"]
}`;
        userPrompt = `Genera reporte regulatorio: ${JSON.stringify(params)}`;
        break;

      case 'validate_compliance':
        systemPrompt = `Eres un auditor de cumplimiento regulatorio especializado en contabilidad.

FORMATO DE RESPUESTA (JSON estricto):
{
  "validation": {
    "overallScore": 0-100,
    "status": "compliant" | "partial" | "non_compliant",
    "findings": [
      {
        "id": "string",
        "severity": "critical" | "high" | "medium" | "low",
        "standard": "string",
        "description": "string",
        "impact": "string",
        "recommendation": "string",
        "deadline": "ISO date"
      }
    ],
    "strengths": ["string"],
    "improvements": ["string"]
  },
  "actionPlan": [
    {
      "priority": number,
      "action": "string",
      "responsible": "string",
      "dueDate": "ISO date"
    }
  ]
}`;
        userPrompt = `Valida cumplimiento: ${JSON.stringify(params)}`;
        break;

      case 'get_deadlines':
        systemPrompt = `Eres un experto en calendarios regulatorios y fiscales.

FORMATO DE RESPUESTA (JSON estricto):
{
  "deadlines": [
    {
      "id": "string",
      "title": "string",
      "type": "tax" | "regulatory" | "audit" | "disclosure",
      "dueDate": "ISO date",
      "status": "pending" | "in_progress" | "completed" | "overdue",
      "priority": "critical" | "high" | "medium" | "low",
      "requirements": ["string"],
      "estimatedEffort": "string"
    }
  ],
  "upcoming30Days": number,
  "overdue": number,
  "monthlyCalendar": {}
}`;
        userPrompt = context 
          ? `Obtén calendario de vencimientos para: ${JSON.stringify(context)}`
          : 'Lista los próximos vencimientos regulatorios';
        break;

      case 'analyze_gaps':
        systemPrompt = `Eres un analista de brechas de cumplimiento regulatorio.

FORMATO DE RESPUESTA (JSON estricto):
{
  "gapAnalysis": {
    "totalGaps": number,
    "criticalGaps": number,
    "gapsByCategory": {},
    "gaps": [
      {
        "id": "string",
        "standard": "string",
        "requirement": "string",
        "currentState": "string",
        "desiredState": "string",
        "gap": "string",
        "severity": "critical" | "high" | "medium" | "low",
        "remediationCost": number,
        "estimatedTime": "string"
      }
    ]
  },
  "remediationPlan": {
    "totalCost": number,
    "timeline": "string",
    "phases": []
  },
  "riskExposure": number
}`;
        userPrompt = `Analiza brechas de cumplimiento: ${JSON.stringify(params)}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[obelixia-regulatory] Processing action: ${action}`);

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
      console.error('[obelixia-regulatory] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[obelixia-regulatory] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[obelixia-regulatory] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
