/**
 * ERP ESG & Carbon Accounting - Contabilidad de carbono y sostenibilidad
 * Tendencia 2025-2027: CSRD, taxonomía UE, Net Zero
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ESGRequest {
  action: 'calculate_carbon' | 'esg_score' | 'taxonomy_alignment' | 'csrd_report' | 'net_zero_pathway';
  company_id?: string;
  financial_data?: any;
  activity_data?: any;
  period?: { start: string; end: string };
  country_code?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, company_id, financial_data, activity_data, period, country_code } = await req.json() as ESGRequest;

    let systemPrompt = '';
    let userPrompt = '';
    let result: any = {};

    switch (action) {
      case 'calculate_carbon':
        systemPrompt = `Eres un experto en contabilidad de carbono según el GHG Protocol.

ALCANCES:
- Scope 1: Emisiones directas (combustibles, vehículos propios)
- Scope 2: Emisiones indirectas de energía (electricidad, calefacción)
- Scope 3: Otras indirectas (proveedores, viajes, residuos)

FACTORES DE EMISIÓN:
Usa factores actualizados 2024-2025 para España/UE:
- Electricidad España: 0.12 kgCO2e/kWh (mix actual)
- Gas natural: 2.0 kgCO2e/m³
- Diésel: 2.68 kgCO2e/litro
- Gasolina: 2.31 kgCO2e/litro

FORMATO DE RESPUESTA (JSON estricto):
{
  "carbon_footprint": {
    "total_tco2e": number,
    "scope1": {
      "total": number,
      "breakdown": [
        {
          "category": "string",
          "source": "string",
          "activity_value": number,
          "activity_unit": "string",
          "emission_factor": number,
          "emissions_tco2e": number
        }
      ]
    },
    "scope2": {
      "total": number,
      "location_based": number,
      "market_based": number,
      "breakdown": []
    },
    "scope3": {
      "total": number,
      "categories": {}
    }
  },
  "intensity_metrics": {
    "per_revenue": number,
    "per_employee": number,
    "per_sqm": number
  },
  "comparison": {
    "vs_previous_period": number,
    "vs_sector_average": number,
    "ranking": "string"
  },
  "reduction_opportunities": [
    {
      "action": "string",
      "potential_reduction_tco2e": number,
      "investment_eur": number,
      "payback_years": number,
      "difficulty": "easy" | "medium" | "hard"
    }
  ],
  "certifications_eligible": ["string"],
  "methodology_notes": ["string"]
}`;

        userPrompt = `Calcula la huella de carbono basándote en:

DATOS FINANCIEROS (para estimación Scope 3):
${JSON.stringify(financial_data, null, 2)}

DATOS DE ACTIVIDAD:
${JSON.stringify(activity_data, null, 2)}

Período: ${period?.start} a ${period?.end}
País: ${country_code || 'ES'}`;
        break;

      case 'esg_score':
        systemPrompt = `Eres un analista ESG que evalúa empresas según estándares internacionales.

FRAMEWORKS:
- GRI Standards
- SASB
- TCFD
- UN SDGs
- EU Taxonomy

PILARES:
E - Environmental: emisiones, recursos, biodiversidad
S - Social: empleados, comunidad, DDHH
G - Governance: ética, transparencia, gestión

FORMATO DE RESPUESTA (JSON estricto):
{
  "esg_score": {
    "overall": 0-100,
    "environmental": {
      "score": 0-100,
      "rating": "A" | "B" | "C" | "D" | "E",
      "metrics": [
        {
          "metric": "string",
          "value": "string",
          "benchmark": "string",
          "score": 0-100
        }
      ],
      "strengths": ["string"],
      "weaknesses": ["string"]
    },
    "social": {},
    "governance": {}
  },
  "sdg_alignment": [
    {
      "sdg": number,
      "name": "string",
      "contribution": "positive" | "negative" | "neutral",
      "score": 0-100
    }
  ],
  "controversies": [
    {
      "type": "string",
      "severity": "low" | "medium" | "high",
      "description": "string"
    }
  ],
  "peer_comparison": {
    "sector_average": number,
    "percentile": number,
    "leaders": ["string"]
  },
  "improvement_roadmap": [
    {
      "action": "string",
      "impact": "string",
      "timeline": "string",
      "priority": 1-5
    }
  ]
}`;

        userPrompt = `Evalúa el desempeño ESG basándote en:

${JSON.stringify({ financial_data, activity_data }, null, 2)}`;
        break;

      case 'taxonomy_alignment':
        systemPrompt = `Eres un experto en la Taxonomía Verde de la UE.

EVALÚA:
1. Elegibilidad según actividades económicas
2. Alineación con criterios técnicos
3. Cumplimiento DNSH (Do No Significant Harm)
4. Salvaguardas sociales mínimas

OBJETIVOS MEDIOAMBIENTALES:
1. Mitigación del cambio climático
2. Adaptación al cambio climático
3. Uso sostenible del agua
4. Economía circular
5. Prevención de la contaminación
6. Biodiversidad

FORMATO DE RESPUESTA (JSON estricto):
{
  "taxonomy_alignment": {
    "eligible_revenue_pct": number,
    "aligned_revenue_pct": number,
    "eligible_capex_pct": number,
    "aligned_capex_pct": number,
    "eligible_opex_pct": number,
    "aligned_opex_pct": number
  },
  "activities_analysis": [
    {
      "activity_code": "string",
      "activity_name": "string",
      "revenue_eur": number,
      "eligibility": boolean,
      "alignment": boolean,
      "objective": "string",
      "technical_criteria_met": boolean,
      "dnsh_assessment": {
        "climate_mitigation": boolean,
        "climate_adaptation": boolean,
        "water": boolean,
        "circular_economy": boolean,
        "pollution": boolean,
        "biodiversity": boolean
      },
      "gaps": ["string"],
      "remediation_actions": ["string"]
    }
  ],
  "disclosure_requirements": ["string"],
  "audit_notes": ["string"]
}`;

        userPrompt = `Evalúa la alineación con la taxonomía UE:

${JSON.stringify(financial_data, null, 2)}`;
        break;

      case 'csrd_report':
        systemPrompt = `Eres un experto en la Directiva CSRD (Corporate Sustainability Reporting Directive).

ESTRUCTURA ESRS:
- ESRS 1: Requisitos generales
- ESRS 2: Información general
- ESRS E1-E5: Medioambiente
- ESRS S1-S4: Social
- ESRS G1: Gobernanza

GENERA contenido para cada sección requerida.

FORMATO DE RESPUESTA (JSON estricto):
{
  "report_sections": [
    {
      "esrs_code": "string",
      "title": "string",
      "content_markdown": "string",
      "data_points": [
        {
          "disclosure": "string",
          "value": "string",
          "unit": "string",
          "methodology": "string"
        }
      ],
      "completeness": 0-100,
      "gaps": ["string"]
    }
  ],
  "materiality_assessment": {
    "material_topics": [
      {
        "topic": "string",
        "impact_materiality": 0-100,
        "financial_materiality": 0-100,
        "is_material": boolean
      }
    ]
  },
  "assurance_readiness": {
    "score": 0-100,
    "ready_sections": ["string"],
    "gaps": ["string"]
  },
  "timeline": {
    "reporting_deadline": "string",
    "assurance_deadline": "string",
    "key_milestones": []
  }
}`;

        userPrompt = `Genera un borrador de informe CSRD para:

${JSON.stringify({ financial_data, activity_data, period }, null, 2)}`;
        break;

      case 'net_zero_pathway':
        systemPrompt = `Eres un consultor de estrategia Net Zero.

PRINCIPIOS SBTi:
1. Reducciones absolutas de emisiones
2. Objetivo de 1.5°C
3. Neutralización de emisiones residuales
4. Cadena de valor completa

GENERA un pathway realista con hitos.

FORMATO DE RESPUESTA (JSON estricto):
{
  "baseline": {
    "year": number,
    "emissions_tco2e": number,
    "scope1": number,
    "scope2": number,
    "scope3": number
  },
  "targets": [
    {
      "year": number,
      "reduction_pct": number,
      "target_emissions": number,
      "sbti_aligned": boolean
    }
  ],
  "pathway": [
    {
      "year": number,
      "projected_emissions": number,
      "key_actions": ["string"],
      "investment_required": number,
      "roi": number
    }
  ],
  "decarbonization_levers": [
    {
      "lever": "string",
      "scope": "1" | "2" | "3",
      "reduction_potential_tco2e": number,
      "implementation_cost": number,
      "timeline": "string",
      "maturity": "proven" | "emerging" | "experimental"
    }
  ],
  "offsetting_strategy": {
    "residual_emissions": number,
    "offset_types": ["string"],
    "annual_cost": number
  },
  "governance": {
    "executive_sponsor": boolean,
    "board_oversight": boolean,
    "kpis": ["string"]
  }
}`;

        userPrompt = `Diseña un pathway a Net Zero para:

Huella actual:
${JSON.stringify(activity_data, null, 2)}

Datos financieros:
${JSON.stringify(financial_data, null, 2)}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[erp-esg-carbon-accounting] Processing action: ${action}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 6000,
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

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('[erp-esg-carbon-accounting] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-esg-carbon-accounting] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
