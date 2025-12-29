import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ESGRequest {
  action: 'get_metrics' | 'generate_report' | 'analyze_impact' | 'benchmark' | 'set_targets';
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

    const { action, context, params } = await req.json() as ESGRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_metrics':
        systemPrompt = `Eres un experto en métricas ESG (Environmental, Social, Governance) y sostenibilidad corporativa.

FORMATO DE RESPUESTA (JSON estricto):
{
  "metrics": {
    "environmental": [
      {
        "id": "string",
        "name": "string",
        "category": "emissions" | "energy" | "water" | "waste" | "biodiversity",
        "value": number,
        "unit": "string",
        "target": number,
        "progress": number,
        "trend": "improving" | "stable" | "worsening",
        "period": "string"
      }
    ],
    "social": [
      {
        "id": "string",
        "name": "string",
        "category": "diversity" | "safety" | "community" | "labor" | "human_rights",
        "value": number,
        "unit": "string",
        "target": number,
        "progress": number,
        "trend": "string"
      }
    ],
    "governance": [
      {
        "id": "string",
        "name": "string",
        "category": "board" | "ethics" | "transparency" | "risk" | "compliance",
        "value": number,
        "unit": "string",
        "target": number,
        "progress": number,
        "trend": "string"
      }
    ]
  },
  "scores": {
    "environmental": 0-100,
    "social": 0-100,
    "governance": 0-100,
    "overall": 0-100
  },
  "certifications": [],
  "frameworks": ["GRI", "SASB", "TCFD", "CDP"]
}`;
        userPrompt = context 
          ? `Obtén métricas ESG para: ${JSON.stringify(context)}`
          : 'Proporciona resumen de métricas ESG actuales';
        break;

      case 'generate_report':
        systemPrompt = `Eres un generador de reportes de sostenibilidad conforme a estándares internacionales.

FORMATO DE RESPUESTA (JSON estricto):
{
  "report": {
    "id": "string",
    "title": "string",
    "framework": "GRI" | "SASB" | "TCFD" | "CDP" | "integrated",
    "period": "string",
    "sections": [
      {
        "id": "string",
        "title": "string",
        "disclosures": [
          {
            "code": "string",
            "name": "string",
            "response": "string",
            "data": {},
            "evidence": []
          }
        ]
      }
    ],
    "materiality": {
      "topics": [],
      "stakeholders": []
    },
    "assurance": {
      "level": "limited" | "reasonable" | "none",
      "provider": "string"
    }
  },
  "completeness": number,
  "recommendations": []
}`;
        userPrompt = `Genera reporte de sostenibilidad: ${JSON.stringify(params)}`;
        break;

      case 'analyze_impact':
        systemPrompt = `Eres un analista de impacto ESG y doble materialidad.

FORMATO DE RESPUESTA (JSON estricto):
{
  "impactAnalysis": {
    "financialMateriality": [
      {
        "topic": "string",
        "impact": "high" | "medium" | "low",
        "timeframe": "short" | "medium" | "long",
        "financialImpact": number,
        "risks": [],
        "opportunities": []
      }
    ],
    "environmentalMateriality": [
      {
        "topic": "string",
        "impact": "high" | "medium" | "low",
        "scope": "direct" | "indirect" | "value_chain",
        "quantification": {}
      }
    ],
    "socialMateriality": [],
    "doubleMateriality": {
      "criticalTopics": [],
      "matrix": {}
    }
  },
  "carbonFootprint": {
    "scope1": number,
    "scope2": number,
    "scope3": number,
    "total": number,
    "intensity": number
  },
  "netZeroPathway": {}
}`;
        userPrompt = `Analiza impacto ESG: ${JSON.stringify(params)}`;
        break;

      case 'benchmark':
        systemPrompt = `Eres un analista de benchmarking ESG sectorial.

FORMATO DE RESPUESTA (JSON estricto):
{
  "benchmark": {
    "industry": "string",
    "peerGroup": [],
    "comparison": [
      {
        "metric": "string",
        "category": "E" | "S" | "G",
        "companyValue": number,
        "industryAverage": number,
        "bestInClass": number,
        "percentile": number,
        "gap": number,
        "recommendation": "string"
      }
    ],
    "rankings": {
      "overall": number,
      "environmental": number,
      "social": number,
      "governance": number
    },
    "ratings": {
      "msci": "string",
      "sustainalytics": number,
      "cdp": "string"
    }
  },
  "strengths": [],
  "improvements": [],
  "bestPractices": []
}`;
        userPrompt = `Realiza benchmark ESG: ${JSON.stringify(params)}`;
        break;

      case 'set_targets':
        systemPrompt = `Eres un consultor de objetivos de sostenibilidad basados en ciencia (SBTi).

FORMATO DE RESPUESTA (JSON estricto):
{
  "targets": {
    "environmental": [
      {
        "id": "string",
        "name": "string",
        "baseline": { "year": number, "value": number },
        "target": { "year": number, "value": number },
        "reduction": number,
        "type": "absolute" | "intensity",
        "scope": "string",
        "sbtiAligned": boolean,
        "pathway": [],
        "milestones": []
      }
    ],
    "social": [],
    "governance": []
  },
  "netZero": {
    "targetYear": number,
    "interimTargets": [],
    "offsetStrategy": "string"
  },
  "investments": {
    "required": number,
    "byCategory": {},
    "roi": number
  },
  "roadmap": []
}`;
        userPrompt = `Define objetivos ESG: ${JSON.stringify(params)}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[obelixia-esg] Processing action: ${action}`);

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
      console.error('[obelixia-esg] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[obelixia-esg] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[obelixia-esg] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
