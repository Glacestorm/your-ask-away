import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DAFORequest {
  sector_key: string;
  project_description: string;
  existing_items: { category: string; description: string }[];
}

interface BusinessPlanRequest {
  evaluation_id: string;
  sections: { section_number: number; section_name: string; section_score: number; questions: any[] }[];
}

interface ScenarioRequest {
  plan_id: string;
  baseline_data: {
    revenues: number[];
    costs: number[];
    investments: number[];
    sector_key: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Strategic AI - Action: ${action}`);

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case 'generate_dafo': {
        const { sector_key, project_description, existing_items } = data as DAFORequest;
        
        systemPrompt = `Eres un experto analista estratégico especializado en análisis DAFO (Debilidades, Amenazas, Fortalezas, Oportunidades).
Tu tarea es generar sugerencias de alta calidad para un análisis DAFO basándote en el sector y la descripción del proyecto.

Reglas:
- Genera entre 3-5 items por categoría
- Cada item debe ser específico, accionable y relevante para el sector
- Asigna una importancia del 1 al 10
- Proporciona un concepto clave y un plan de acción concreto
- Evita duplicar items que ya existan`;

        userPrompt = `Sector: ${sector_key}
Descripción del proyecto: ${project_description}

Items existentes a evitar duplicar:
${existing_items.map(i => `- ${i.category}: ${i.description}`).join('\n') || 'Ninguno'}

Genera sugerencias DAFO estructuradas.`;
        break;
      }

      case 'coach_business_plan': {
        const { sections } = data as BusinessPlanRequest;
        
        systemPrompt = `Eres un coach de negocios experto en evaluación de planes empresariales.
Tu tarea es analizar las secciones de un Business Plan y proporcionar recomendaciones de mejora.

Reglas:
- Identifica áreas de mejora específicas por sección
- Prioriza las recomendaciones (high, medium, low)
- Destaca fortalezas identificadas
- Proporciona un assessment general`;

        userPrompt = `Secciones del Business Plan:
${sections.map(s => `
Sección ${s.section_number}: ${s.section_name}
Puntuación: ${s.section_score}
Preguntas evaluadas: ${JSON.stringify(s.questions)}
`).join('\n')}

Proporciona coaching estructurado para mejorar el plan.`;
        break;
      }

      case 'predict_scenarios': {
        const { baseline_data } = data as ScenarioRequest;
        
        systemPrompt = `Eres un analista financiero experto en proyecciones y escenarios.
Tu tarea es generar 3 escenarios (optimista, realista, pesimista) basándote en datos financieros base.

Reglas:
- Calcula métricas proyectadas a 5 años
- Incluye supuestos clave para cada escenario
- Identifica riesgos principales
- Asigna probabilidades realistas a cada escenario`;

        userPrompt = `Datos base del plan financiero:
Sector: ${baseline_data.sector_key}
Ingresos anuales: ${JSON.stringify(baseline_data.revenues)}
Costos anuales: ${JSON.stringify(baseline_data.costs)}
Inversiones: ${JSON.stringify(baseline_data.investments)}

Genera predicciones de escenarios financieros.`;
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Define tools based on action
    const tools = getToolsForAction(action);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools,
        tool_choice: { type: "function", function: { name: getToolName(action) } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI Response received");

    // Extract tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const result = JSON.parse(toolCall.function.arguments);
    const responseKey = getResponseKey(action);

    return new Response(JSON.stringify({ [responseKey]: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Strategic AI error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getToolsForAction(action: string) {
  switch (action) {
    case 'generate_dafo':
      return [{
        type: "function",
        function: {
          name: "generate_dafo_suggestions",
          description: "Generate DAFO analysis suggestions",
          parameters: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string", enum: ["threats", "opportunities", "weaknesses", "strengths"] },
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          description: { type: "string" },
                          importance: { type: "number", minimum: 1, maximum: 10 },
                          concept: { type: "string" },
                          action_plan: { type: "string" }
                        },
                        required: ["description", "importance", "concept", "action_plan"]
                      }
                    }
                  },
                  required: ["category", "items"]
                }
              }
            },
            required: ["suggestions"]
          }
        }
      }];

    case 'coach_business_plan':
      return [{
        type: "function",
        function: {
          name: "provide_business_plan_coaching",
          description: "Provide coaching for business plan",
          parameters: {
            type: "object",
            properties: {
              section_recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    section_number: { type: "number" },
                    recommendations: { type: "array", items: { type: "string" } },
                    priority: { type: "string", enum: ["high", "medium", "low"] }
                  },
                  required: ["section_number", "recommendations", "priority"]
                }
              },
              overall_assessment: { type: "string" },
              improvement_areas: { type: "array", items: { type: "string" } },
              strengths: { type: "array", items: { type: "string" } }
            },
            required: ["section_recommendations", "overall_assessment", "improvement_areas", "strengths"]
          }
        }
      }];

    case 'predict_scenarios':
      return [{
        type: "function",
        function: {
          name: "predict_financial_scenarios",
          description: "Predict financial scenarios",
          parameters: {
            type: "object",
            properties: {
              scenarios: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    scenario_type: { type: "string", enum: ["optimistic", "realistic", "pessimistic"] },
                    probability: { type: "number", minimum: 0, maximum: 100 },
                    projected_metrics: {
                      type: "object",
                      properties: {
                        revenue_year_5: { type: "number" },
                        profit_year_5: { type: "number" },
                        breakeven_year: { type: "number" },
                        npv: { type: "number" },
                        irr: { type: "number" }
                      },
                      required: ["revenue_year_5", "profit_year_5", "breakeven_year", "npv", "irr"]
                    },
                    key_assumptions: { type: "array", items: { type: "string" } },
                    risks: { type: "array", items: { type: "string" } }
                  },
                  required: ["scenario_type", "probability", "projected_metrics", "key_assumptions", "risks"]
                }
              }
            },
            required: ["scenarios"]
          }
        }
      }];

    default:
      return [];
  }
}

function getToolName(action: string): string {
  switch (action) {
    case 'generate_dafo': return 'generate_dafo_suggestions';
    case 'coach_business_plan': return 'provide_business_plan_coaching';
    case 'predict_scenarios': return 'predict_financial_scenarios';
    default: return '';
  }
}

function getResponseKey(action: string): string {
  switch (action) {
    case 'generate_dafo': return 'suggestions';
    case 'coach_business_plan': return 'coaching';
    case 'predict_scenarios': return 'scenarios';
    default: return 'result';
  }
}
