import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  SECURITY_HEADERS, 
  handleOptionsRequest, 
  createSecureResponse,
  checkRateLimit,
  validatePayloadSize
} from '../_shared/owasp-security.ts';
import { secureAICall, getClientIP, generateRequestId } from '../_shared/edge-function-template.ts';

interface DAFORequest {
  sector_key: string;
  project_description: string;
  existing_items: { category: string; description: string }[];
}

interface BusinessPlanRequest {
  evaluation_id: string;
  sections: { section_number: number; section_name: string; section_score: number; questions: unknown[] }[];
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
  const requestId = generateRequestId();
  const clientIp = getClientIP(req);
  const startTime = Date.now();

  console.log(`[strategic-ai] Request ${requestId} from ${clientIp}`);

  // === CORS ===
  if (req.method === 'OPTIONS') {
    return handleOptionsRequest();
  }

  try {
    // === Rate Limiting ===
    const rateCheck = checkRateLimit({
      maxRequests: 30, // Lower limit for heavy AI operations
      windowMs: 60000,
      identifier: `strategic-ai:${clientIp}`,
    });

    if (!rateCheck.allowed) {
      console.warn(`[strategic-ai] Rate limit exceeded: ${clientIp}`);
      return createSecureResponse({ 
        success: false,
        error: 'rate_limit_exceeded', 
        message: 'Demasiadas solicitudes. Intenta más tarde.',
        retryAfter: Math.ceil(rateCheck.resetIn / 1000)
      }, 429);
    }

    // === Parse & Validate Body ===
    let body: { action: string; data: DAFORequest | BusinessPlanRequest | ScenarioRequest };
    try {
      body = await req.json();
    } catch {
      return createSecureResponse({ 
        success: false, 
        error: 'invalid_json', 
        message: 'El cuerpo no es JSON válido' 
      }, 400);
    }

    const payloadCheck = validatePayloadSize(body);
    if (!payloadCheck.valid) {
      return createSecureResponse({ 
        success: false, 
        error: 'payload_too_large', 
        message: payloadCheck.error 
      }, 413);
    }

    const { action, data } = body;

    console.log(`[strategic-ai] Action: ${action}`);

    let systemPrompt = "";
    let userPrompt = "";
    let tools: unknown[] = [];
    let toolName = "";
    let responseKey = "result";

    switch (action) {
      case 'generate_dafo': {
        const dafoData = data as DAFORequest;
        
        systemPrompt = `Eres un experto analista estratégico especializado en análisis DAFO (Debilidades, Amenazas, Fortalezas, Oportunidades).
Tu tarea es generar sugerencias de alta calidad para un análisis DAFO basándote en el sector y la descripción del proyecto.

Reglas:
- Genera entre 3-5 items por categoría
- Cada item debe ser específico, accionable y relevante para el sector
- Asigna una importancia del 1 al 10
- Proporciona un concepto clave y un plan de acción concreto
- Evita duplicar items que ya existan`;

        userPrompt = `Sector: ${dafoData.sector_key}
Descripción del proyecto: ${dafoData.project_description}

Items existentes a evitar duplicar:
${dafoData.existing_items?.map(i => `- ${i.category}: ${i.description}`).join('\n') || 'Ninguno'}

Genera sugerencias DAFO estructuradas.`;

        tools = [{
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
        toolName = 'generate_dafo_suggestions';
        responseKey = 'suggestions';
        break;
      }

      case 'coach_business_plan': {
        const bpData = data as BusinessPlanRequest;
        
        systemPrompt = `Eres un coach de negocios experto en evaluación de planes empresariales.
Tu tarea es analizar las secciones de un Business Plan y proporcionar recomendaciones de mejora.

Reglas:
- Identifica áreas de mejora específicas por sección
- Prioriza las recomendaciones (high, medium, low)
- Destaca fortalezas identificadas
- Proporciona un assessment general`;

        userPrompt = `Secciones del Business Plan:
${bpData.sections?.map(s => `
Sección ${s.section_number}: ${s.section_name}
Puntuación: ${s.section_score}
Preguntas evaluadas: ${JSON.stringify(s.questions)}
`).join('\n') || 'Sin secciones'}

Proporciona coaching estructurado para mejorar el plan.`;

        tools = [{
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
        toolName = 'provide_business_plan_coaching';
        responseKey = 'coaching';
        break;
      }

      case 'predict_scenarios': {
        const scenarioData = data as ScenarioRequest;
        
        systemPrompt = `Eres un analista financiero experto en proyecciones y escenarios.
Tu tarea es generar 3 escenarios (optimista, realista, pesimista) basándote en datos financieros base.

Reglas:
- Calcula métricas proyectadas a 5 años
- Incluye supuestos clave para cada escenario
- Identifica riesgos principales
- Asigna probabilidades realistas a cada escenario`;

        userPrompt = `Datos base del plan financiero:
Sector: ${scenarioData.baseline_data?.sector_key}
Ingresos anuales: ${JSON.stringify(scenarioData.baseline_data?.revenues)}
Costos anuales: ${JSON.stringify(scenarioData.baseline_data?.costs)}
Inversiones: ${JSON.stringify(scenarioData.baseline_data?.investments)}

Genera predicciones de escenarios financieros.`;

        tools = [{
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
        toolName = 'predict_financial_scenarios';
        responseKey = 'scenarios';
        break;
      }

      default:
        return createSecureResponse({ 
          success: false, 
          error: 'invalid_action', 
          message: `Acción no soportada: ${action}` 
        }, 400);
    }

    // === AI Call with Tools ===
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
        tool_choice: { type: "function", function: { name: toolName } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn(`[strategic-ai] AI rate limit exceeded`);
        return createSecureResponse({ 
          success: false,
          error: 'rate_limit_exceeded', 
          message: 'Demasiadas solicitudes a IA. Intenta más tarde.' 
        }, 429);
      }
      if (response.status === 402) {
        return createSecureResponse({ 
          success: false,
          error: 'payment_required', 
          message: 'Créditos de IA insuficientes.' 
        }, 402);
      }
      const errorText = await response.text();
      console.error("[strategic-ai] AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    
    // Extract tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const result = JSON.parse(toolCall.function.arguments);

    const duration = Date.now() - startTime;
    console.log(`[strategic-ai] Success: ${action} in ${duration}ms`);

    return createSecureResponse({
      success: true,
      [responseKey]: result,
      requestId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[strategic-ai] Error after ${duration}ms:`, error);
    
    return createSecureResponse({
      success: false,
      error: 'internal_error',
      message: error instanceof Error ? error.message : 'Error interno',
      requestId
    }, 500);
  }
});
