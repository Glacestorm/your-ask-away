import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ESGRequest {
  action: 'calculate_carbon' | 'esg_score' | 'sustainability_report' | 'reduction_plan';
  params?: {
    period?: string;
    scope?: 'scope1' | 'scope2' | 'scope3' | 'all';
    category?: string;
  };
  activityData?: Record<string, number>;
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

    const { action, params, activityData } = await req.json() as ESGRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'calculate_carbon':
        systemPrompt = `Eres un experto en contabilidad de carbono según GHG Protocol.
        
SCOPES:
- Scope 1: Emisiones directas (combustibles, flota)
- Scope 2: Electricidad comprada
- Scope 3: Cadena de valor

FORMATO JSON ESTRICTO:
{
  "carbon_footprint": {
    "total_tco2e": number,
    "scope1": {
      "total": number,
      "breakdown": [{"source": "string", "tco2e": number, "percentage": number}]
    },
    "scope2": {...},
    "scope3": {...},
    "intensity_metrics": {
      "per_revenue": number,
      "per_employee": number,
      "per_unit": number
    },
    "comparison": {
      "vs_previous_period": number,
      "vs_industry_average": number
    }
  },
  "methodology": "GHG Protocol",
  "data_quality_score": number
}`;
        userPrompt = `Calcula huella de carbono para: ${params?.scope || 'todos los scopes'}
Período: ${params?.period || 'último año'}
Datos de actividad: ${JSON.stringify(activityData || {})}`;
        break;

      case 'esg_score':
        systemPrompt = `Eres un analista ESG especializado en ratings corporativos.
        
DIMENSIONES:
- Environmental: emisiones, recursos, residuos
- Social: empleados, comunidad, derechos humanos
- Governance: ética, transparencia, gestión de riesgos

FORMATO JSON ESTRICTO:
{
  "esg_rating": {
    "overall_score": number,
    "rating": "AAA|AA|A|BBB|BB|B|CCC",
    "environmental": {
      "score": number,
      "indicators": [{"name": "string", "score": number, "trend": "up|stable|down"}]
    },
    "social": {...},
    "governance": {...},
    "strengths": ["string"],
    "improvement_areas": ["string"],
    "peer_comparison": {
      "percentile": number,
      "sector_average": number
    }
  }
}`;
        userPrompt = `Evalúa puntuación ESG basada en datos disponibles.`;
        break;

      case 'sustainability_report':
        systemPrompt = `Eres un experto en reportes de sostenibilidad según GRI y ESRS.
        
ESTÁNDARES:
- GRI Universal Standards
- ESRS (European Sustainability Reporting Standards)
- TCFD (Climate-related Financial Disclosures)

FORMATO JSON ESTRICTO:
{
  "sustainability_report": {
    "executive_summary": "string",
    "material_topics": [
      {"topic": "string", "relevance": "high|medium|low", "gri_standard": "string"}
    ],
    "environmental_performance": {
      "highlights": ["string"],
      "kpis": [{"name": "string", "value": number, "unit": "string", "target": number}]
    },
    "social_performance": {...},
    "governance_performance": {...},
    "sdg_alignment": [
      {"sdg": number, "contribution": "string", "indicators": ["string"]}
    ],
    "future_commitments": ["string"]
  }
}`;
        userPrompt = `Genera estructura de informe de sostenibilidad para período: ${params?.period || 'anual'}`;
        break;

      case 'reduction_plan':
        systemPrompt = `Eres un consultor de descarbonización y Net Zero.
        
ESTRATEGIAS:
- Eficiencia energética
- Energías renovables
- Electrificación
- Compensación de carbono

FORMATO JSON ESTRICTO:
{
  "reduction_plan": {
    "baseline_emissions": number,
    "target_year": number,
    "reduction_target": number,
    "pathway": [
      {"year": number, "emissions": number, "reduction_vs_baseline": number}
    ],
    "initiatives": [
      {
        "name": "string",
        "category": "efficiency|renewable|electrification|offset",
        "reduction_potential_tco2e": number,
        "investment_required": number,
        "payback_years": number,
        "priority": "high|medium|low"
      }
    ],
    "total_investment": number,
    "total_reduction": number,
    "net_zero_feasibility": "string"
  }
}`;
        userPrompt = `Desarrolla plan de reducción de emisiones con horizonte 2030.`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[erp-esg-carbon] Processing: ${action}`);

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
        temperature: 0.5,
        max_tokens: 3000,
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

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { rawContent: content };
    } catch {
      result = { rawContent: content };
    }

    console.log(`[erp-esg-carbon] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-esg-carbon] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
