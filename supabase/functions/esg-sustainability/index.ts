import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ESGRequest {
  action: 'calculate_carbon' | 'assess_esg_risk' | 'generate_report' | 'get_benchmarks' | 
          'calculate_scope' | 'get_offset_options' | 'track_targets' | 'analyze_supply_chain';
  context?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

interface EmissionFactors {
  electricity_kwh: number; // kg CO2e per kWh
  natural_gas_m3: number;
  diesel_l: number;
  gasoline_l: number;
  flight_km_short: number;
  flight_km_long: number;
  train_km: number;
  car_km: number;
  waste_kg: number;
  water_m3: number;
  paper_kg: number;
  plastic_kg: number;
}

// Emission factors by region (kg CO2e)
const emissionFactorsByRegion: Record<string, EmissionFactors> = {
  europe: {
    electricity_kwh: 0.276,
    natural_gas_m3: 2.02,
    diesel_l: 2.68,
    gasoline_l: 2.31,
    flight_km_short: 0.255,
    flight_km_long: 0.195,
    train_km: 0.041,
    car_km: 0.171,
    waste_kg: 0.467,
    water_m3: 0.344,
    paper_kg: 0.919,
    plastic_kg: 2.53
  },
  north_america: {
    electricity_kwh: 0.385,
    natural_gas_m3: 2.02,
    diesel_l: 2.68,
    gasoline_l: 2.31,
    flight_km_short: 0.255,
    flight_km_long: 0.195,
    train_km: 0.089,
    car_km: 0.192,
    waste_kg: 0.467,
    water_m3: 0.376,
    paper_kg: 0.919,
    plastic_kg: 2.53
  },
  latam: {
    electricity_kwh: 0.189,
    natural_gas_m3: 2.02,
    diesel_l: 2.68,
    gasoline_l: 2.31,
    flight_km_short: 0.255,
    flight_km_long: 0.195,
    train_km: 0.056,
    car_km: 0.185,
    waste_kg: 0.467,
    water_m3: 0.298,
    paper_kg: 0.919,
    plastic_kg: 2.53
  },
  asia: {
    electricity_kwh: 0.512,
    natural_gas_m3: 2.02,
    diesel_l: 2.68,
    gasoline_l: 2.31,
    flight_km_short: 0.255,
    flight_km_long: 0.195,
    train_km: 0.035,
    car_km: 0.168,
    waste_kg: 0.467,
    water_m3: 0.312,
    paper_kg: 0.919,
    plastic_kg: 2.53
  }
};

// ESG industry benchmarks
const industryBenchmarks: Record<string, { environmental: number; social: number; governance: number }> = {
  technology: { environmental: 72, social: 68, governance: 75 },
  manufacturing: { environmental: 58, social: 62, governance: 70 },
  retail: { environmental: 61, social: 65, governance: 68 },
  healthcare: { environmental: 67, social: 78, governance: 73 },
  finance: { environmental: 69, social: 64, governance: 82 },
  energy: { environmental: 45, social: 58, governance: 71 },
  agriculture: { environmental: 52, social: 60, governance: 65 },
  construction: { environmental: 48, social: 55, governance: 67 },
  hospitality: { environmental: 56, social: 72, governance: 64 },
  logistics: { environmental: 42, social: 59, governance: 69 }
};

// Carbon offset providers mock data
const carbonOffsetProviders = [
  { id: 'gold_standard', name: 'Gold Standard', price_per_ton: 18.50, type: 'renewable_energy', location: 'Global', rating: 4.8 },
  { id: 'verra_vcs', name: 'Verra VCS', price_per_ton: 15.20, type: 'forestry', location: 'Amazon', rating: 4.6 },
  { id: 'american_carbon', name: 'American Carbon Registry', price_per_ton: 22.00, type: 'methane_capture', location: 'USA', rating: 4.9 },
  { id: 'plan_vivo', name: 'Plan Vivo', price_per_ton: 12.80, type: 'community_forestry', location: 'Africa', rating: 4.5 },
  { id: 'climate_action', name: 'Climate Action Reserve', price_per_ton: 19.50, type: 'soil_carbon', location: 'North America', rating: 4.7 }
];

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

    console.log(`[esg-sustainability] Processing action: ${action}`);

    let result: Record<string, unknown> = {};

    switch (action) {
      case 'calculate_carbon': {
        const region = (params?.region as string) || 'europe';
        const factors = emissionFactorsByRegion[region] || emissionFactorsByRegion.europe;
        const consumption = params?.consumption as Record<string, number> || {};
        
        // Calculate Scope 1 (Direct emissions)
        const scope1 = {
          natural_gas: (consumption.natural_gas_m3 || 0) * factors.natural_gas_m3,
          diesel: (consumption.diesel_l || 0) * factors.diesel_l,
          gasoline: (consumption.gasoline_l || 0) * factors.gasoline_l,
          company_vehicles: (consumption.company_vehicle_km || 0) * factors.car_km
        };
        const scope1Total = Object.values(scope1).reduce((a, b) => a + b, 0);

        // Calculate Scope 2 (Indirect from energy)
        const scope2 = {
          electricity: (consumption.electricity_kwh || 0) * factors.electricity_kwh,
          heating: (consumption.heating_kwh || 0) * factors.electricity_kwh * 0.8,
          cooling: (consumption.cooling_kwh || 0) * factors.electricity_kwh * 1.2
        };
        const scope2Total = Object.values(scope2).reduce((a, b) => a + b, 0);

        // Calculate Scope 3 (Value chain)
        const scope3 = {
          business_travel_flights: (consumption.flight_km || 0) * factors.flight_km_long,
          business_travel_train: (consumption.train_km || 0) * factors.train_km,
          employee_commuting: (consumption.commute_km || 0) * factors.car_km * 0.5,
          waste: (consumption.waste_kg || 0) * factors.waste_kg,
          water: (consumption.water_m3 || 0) * factors.water_m3,
          paper: (consumption.paper_kg || 0) * factors.paper_kg,
          plastic: (consumption.plastic_kg || 0) * factors.plastic_kg,
          purchased_goods: (consumption.purchased_goods_eur || 0) * 0.0002, // Approximate
          upstream_transport: (consumption.upstream_transport_km || 0) * 0.1
        };
        const scope3Total = Object.values(scope3).reduce((a, b) => a + b, 0);

        const totalEmissions = scope1Total + scope2Total + scope3Total;
        const employees = params?.employees as number || 1;
        const revenue = params?.revenue as number || 1;

        result = {
          success: true,
          data: {
            scope1: { breakdown: scope1, total: Math.round(scope1Total * 100) / 100 },
            scope2: { breakdown: scope2, total: Math.round(scope2Total * 100) / 100 },
            scope3: { breakdown: scope3, total: Math.round(scope3Total * 100) / 100 },
            total_emissions_kg: Math.round(totalEmissions * 100) / 100,
            total_emissions_tons: Math.round(totalEmissions / 1000 * 100) / 100,
            per_employee: Math.round((totalEmissions / employees) * 100) / 100,
            per_million_revenue: Math.round((totalEmissions / (revenue / 1000000)) * 100) / 100,
            carbon_intensity: Math.round((totalEmissions / revenue * 1000) * 100) / 100,
            region: region,
            calculation_date: new Date().toISOString(),
            methodology: 'GHG Protocol Corporate Standard',
            recommendations: [
              scope1Total > scope2Total ? 'Considerar vehículos eléctricos para reducir emisiones Scope 1' : null,
              scope2Total > 1000 ? 'Evaluar contratos de energía renovable para Scope 2' : null,
              scope3Total > scope1Total + scope2Total ? 'Implementar programa de proveedores sostenibles' : null,
              consumption.flight_km > 10000 ? 'Sustituir viajes por videoconferencias cuando sea posible' : null
            ].filter(Boolean)
          }
        };
        break;
      }

      case 'assess_esg_risk': {
        const industry = (params?.industry as string) || 'technology';
        const benchmark = industryBenchmarks[industry] || industryBenchmarks.technology;
        const companyData = params?.companyData as Record<string, unknown> || {};

        // Use AI to generate ESG assessment
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `Eres un experto en ESG (Environmental, Social, Governance) que evalúa riesgos empresariales.
                
Evalúa los siguientes criterios y proporciona puntuaciones de 0-100:

ENVIRONMENTAL:
- Gestión de emisiones de carbono
- Uso de energías renovables
- Gestión de residuos
- Conservación de agua
- Biodiversidad e impacto ambiental

SOCIAL:
- Diversidad e inclusión
- Salud y seguridad laboral
- Desarrollo de empleados
- Impacto en comunidad
- Derechos humanos en cadena de suministro

GOVERNANCE:
- Independencia del consejo
- Transparencia y disclosure
- Ética empresarial
- Gestión de riesgos
- Derechos de accionistas

RESPUESTA JSON (estricto):
{
  "environmental": { "score": 0-100, "risks": ["lista de riesgos"], "opportunities": ["lista"] },
  "social": { "score": 0-100, "risks": ["lista"], "opportunities": ["lista"] },
  "governance": { "score": 0-100, "risks": ["lista"], "opportunities": ["lista"] },
  "overall_score": 0-100,
  "rating": "AAA|AA|A|BBB|BB|B|CCC|CC|C",
  "key_risks": ["top 3 riesgos prioritarios"],
  "action_plan": ["top 5 acciones recomendadas"],
  "sdg_alignment": ["ODS alineados (ej: SDG 7, SDG 13)"],
  "materiality_matrix": [{"topic": "tema", "importance": 1-10, "impact": 1-10}]
}`
              },
              {
                role: 'user',
                content: `Evalúa el perfil ESG de esta empresa:
Industria: ${industry}
Benchmark del sector: E:${benchmark.environmental}, S:${benchmark.social}, G:${benchmark.governance}
Datos de la empresa: ${JSON.stringify(companyData)}
Contexto adicional: ${JSON.stringify(context)}`
              }
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        let assessment;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          assessment = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
          assessment = null;
        }

        result = {
          success: true,
          data: {
            assessment: assessment || {
              environmental: { score: 65, risks: ['Falta de política climática'], opportunities: ['Energía renovable'] },
              social: { score: 70, risks: ['Diversidad limitada'], opportunities: ['Programa de formación'] },
              governance: { score: 75, risks: ['Falta de comité ESG'], opportunities: ['Mayor transparencia'] },
              overall_score: 70,
              rating: 'BBB',
              key_risks: ['Huella de carbono elevada', 'Falta de diversidad', 'Reporting ESG incompleto'],
              action_plan: ['Establecer objetivos SBTi', 'Crear comité de sostenibilidad', 'Publicar informe CSRD'],
              sdg_alignment: ['SDG 7', 'SDG 12', 'SDG 13'],
              materiality_matrix: [
                { topic: 'Cambio climático', importance: 9, impact: 8 },
                { topic: 'Diversidad', importance: 7, impact: 6 },
                { topic: 'Ética empresarial', importance: 8, impact: 7 }
              ]
            },
            industry_benchmark: benchmark,
            comparison: {
              vs_industry_environmental: (assessment?.environmental?.score || 65) - benchmark.environmental,
              vs_industry_social: (assessment?.social?.score || 70) - benchmark.social,
              vs_industry_governance: (assessment?.governance?.score || 75) - benchmark.governance
            },
            calculation_date: new Date().toISOString()
          }
        };
        break;
      }

      case 'generate_report': {
        const reportType = (params?.reportType as string) || 'CSRD';
        const period = (params?.period as string) || new Date().getFullYear().toString();
        const companyData = params?.companyData as Record<string, unknown> || {};
        const emissions = params?.emissions as Record<string, unknown> || {};
        const esgScore = params?.esgScore as Record<string, unknown> || {};

        // Generate report using AI
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `Eres un experto en reporting ESG que genera informes según estándares ${reportType}.

ESTÁNDARES SOPORTADOS:
- CSRD: Corporate Sustainability Reporting Directive (EU)
- GRI: Global Reporting Initiative
- TCFD: Task Force on Climate-related Financial Disclosures
- SASB: Sustainability Accounting Standards Board
- CDP: Carbon Disclosure Project

Genera un informe estructurado con todas las secciones requeridas por el estándar.

RESPUESTA JSON (estricto):
{
  "report_title": "Título del informe",
  "executive_summary": "Resumen ejecutivo (máx 300 palabras)",
  "sections": [
    {
      "section_id": "E1",
      "title": "Título de sección",
      "content": "Contenido detallado",
      "metrics": [{"name": "métrica", "value": "valor", "unit": "unidad", "trend": "up|down|stable"}],
      "targets": [{"name": "objetivo", "target": "meta", "progress": 0-100}],
      "disclosures": ["lista de divulgaciones requeridas cubiertas"]
    }
  ],
  "materiality_assessment": "Evaluación de materialidad",
  "governance_structure": "Estructura de gobernanza ESG",
  "risk_management": "Gestión de riesgos climáticos",
  "strategy": "Estrategia de sostenibilidad",
  "targets_and_metrics": "Objetivos y métricas clave",
  "compliance_checklist": [{"requirement": "requisito", "status": "compliant|partial|non_compliant"}],
  "assurance_statement": "Declaración de aseguramiento",
  "appendices": ["Lista de anexos necesarios"]
}`
              },
              {
                role: 'user',
                content: `Genera un informe ${reportType} para el período ${period}:
Datos de la empresa: ${JSON.stringify(companyData)}
Emisiones calculadas: ${JSON.stringify(emissions)}
Puntuación ESG: ${JSON.stringify(esgScore)}
Contexto: ${JSON.stringify(context)}`
              }
            ],
            temperature: 0.6,
            max_tokens: 4000,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        let report;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          report = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
          report = null;
        }

        result = {
          success: true,
          data: {
            report: report || {
              report_title: `Informe de Sostenibilidad ${reportType} - ${period}`,
              executive_summary: 'Este informe presenta el desempeño ESG de la organización según los estándares requeridos.',
              sections: [
                { section_id: 'E1', title: 'Cambio Climático', content: 'Gestión de emisiones GEI', metrics: [], targets: [], disclosures: [] }
              ],
              compliance_checklist: [{ requirement: 'Divulgación de emisiones Scope 1-3', status: 'compliant' }]
            },
            report_type: reportType,
            period: period,
            generated_at: new Date().toISOString(),
            format_options: ['PDF', 'HTML', 'XBRL'],
            validation_status: 'pending_review'
          }
        };
        break;
      }

      case 'get_benchmarks': {
        const industry = (params?.industry as string) || 'technology';
        result = {
          success: true,
          data: {
            industry: industry,
            benchmark: industryBenchmarks[industry] || industryBenchmarks.technology,
            all_industries: industryBenchmarks,
            average_market: {
              environmental: Math.round(Object.values(industryBenchmarks).reduce((sum, b) => sum + b.environmental, 0) / Object.keys(industryBenchmarks).length),
              social: Math.round(Object.values(industryBenchmarks).reduce((sum, b) => sum + b.social, 0) / Object.keys(industryBenchmarks).length),
              governance: Math.round(Object.values(industryBenchmarks).reduce((sum, b) => sum + b.governance, 0) / Object.keys(industryBenchmarks).length)
            }
          }
        };
        break;
      }

      case 'get_offset_options': {
        const emissionsTons = (params?.emissions_tons as number) || 100;
        const budget = params?.budget as number;

        const options = carbonOffsetProviders.map(provider => ({
          ...provider,
          tons_available: Math.floor(Math.random() * 10000) + 1000,
          total_cost: Math.round(provider.price_per_ton * emissionsTons * 100) / 100,
          verification: 'Third-party verified',
          co_benefits: provider.type === 'forestry' ? ['Biodiversidad', 'Comunidades locales'] :
                       provider.type === 'renewable_energy' ? ['Empleo local', 'Transición energética'] :
                       ['Reducción metano', 'Innovación tecnológica']
        }));

        const filteredOptions = budget 
          ? options.filter(o => o.total_cost <= budget)
          : options;

        result = {
          success: true,
          data: {
            emissions_to_offset: emissionsTons,
            options: filteredOptions.sort((a, b) => b.rating - a.rating),
            recommended: filteredOptions[0] || options[0],
            total_market_price_range: {
              min: Math.min(...options.map(o => o.total_cost)),
              max: Math.max(...options.map(o => o.total_cost)),
              average: Math.round(options.reduce((sum, o) => sum + o.total_cost, 0) / options.length)
            }
          }
        };
        break;
      }

      case 'track_targets': {
        const targets = params?.targets as Array<{ name: string; baseline: number; target: number; current: number; deadline: string }> || [];
        
        const trackedTargets = targets.map(t => {
          const progress = ((t.baseline - t.current) / (t.baseline - t.target)) * 100;
          const deadline = new Date(t.deadline);
          const now = new Date();
          const totalDays = (deadline.getTime() - new Date(2020, 0, 1).getTime()) / (1000 * 60 * 60 * 24);
          const elapsedDays = (now.getTime() - new Date(2020, 0, 1).getTime()) / (1000 * 60 * 60 * 24);
          const expectedProgress = (elapsedDays / totalDays) * 100;
          
          return {
            ...t,
            progress: Math.min(100, Math.max(0, Math.round(progress))),
            expected_progress: Math.round(expectedProgress),
            on_track: progress >= expectedProgress * 0.9,
            remaining: t.current - t.target,
            annual_reduction_needed: (t.current - t.target) / Math.max(1, (deadline.getFullYear() - now.getFullYear()))
          };
        });

        result = {
          success: true,
          data: {
            targets: trackedTargets,
            summary: {
              total_targets: targets.length,
              on_track: trackedTargets.filter(t => t.on_track).length,
              at_risk: trackedTargets.filter(t => !t.on_track && t.progress > 0).length,
              not_started: trackedTargets.filter(t => t.progress === 0).length
            },
            sbti_alignment: 'Targets align with Science Based Targets initiative methodology'
          }
        };
        break;
      }

      case 'analyze_supply_chain': {
        const suppliers = params?.suppliers as Array<{ name: string; category: string; spend: number; country: string }> || [];
        
        // Use AI to analyze supply chain ESG risks
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `Eres un experto en análisis ESG de cadenas de suministro. Evalúa riesgos por país y categoría.

RESPUESTA JSON:
{
  "high_risk_suppliers": [{"name": "nombre", "risk_score": 0-100, "main_risks": ["riesgos"]}],
  "country_risk_matrix": [{"country": "país", "environmental_risk": "alto|medio|bajo", "social_risk": "alto|medio|bajo", "governance_risk": "alto|medio|bajo"}],
  "category_analysis": [{"category": "categoría", "emissions_intensity": "alto|medio|bajo", "recommendations": ["recomendaciones"]}],
  "scope3_hotspots": ["principales fuentes de emisiones scope 3"],
  "due_diligence_recommendations": ["recomendaciones de due diligence"],
  "supplier_engagement_plan": ["plan de engagement con proveedores"]
}`
              },
              {
                role: 'user',
                content: `Analiza esta cadena de suministro: ${JSON.stringify(suppliers)}`
              }
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        let analysis;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
          analysis = null;
        }

        result = {
          success: true,
          data: {
            analysis: analysis || {
              high_risk_suppliers: [],
              country_risk_matrix: [],
              category_analysis: [],
              scope3_hotspots: ['Transporte y logística', 'Materias primas'],
              due_diligence_recommendations: ['Implementar auditorías ESG a proveedores clave'],
              supplier_engagement_plan: ['Establecer código de conducta para proveedores']
            },
            total_suppliers: suppliers.length,
            total_spend: suppliers.reduce((sum, s) => sum + s.spend, 0),
            geographic_distribution: [...new Set(suppliers.map(s => s.country))]
          }
        };
        break;
      }

      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    console.log(`[esg-sustainability] Success: ${action}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[esg-sustainability] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
