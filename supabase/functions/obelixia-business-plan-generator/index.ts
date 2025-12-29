import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BusinessPlanRequest {
  action: 'generate_full_plan' | 'generate_section' | 'generate_executive' | 'update_section' | 'get_template';
  planType?: 'complete' | 'executive' | 'investor' | 'grant';
  targetAudience?: 'vc' | 'angel' | 'bank' | 'grant' | 'internal';
  section?: string;
  context?: {
    companyData?: Record<string, unknown>;
    financialData?: Record<string, unknown>;
    marketData?: Record<string, unknown>;
  };
  language?: 'es' | 'en' | 'ca';
}

// Obelixia Company Profile
const OBELIXIA_PROFILE = {
  name: 'Obelixia',
  legalName: 'Obelixia Technologies S.L.',
  foundingYear: 2024,
  location: 'Barcelona, Cataluña, España',
  sector: 'Enterprise Software / SaaS',
  subsector: 'Financial Technology (FinTech) / RegTech',
  
  mission: 'Democratizar la contabilidad inteligente para PYMEs, eliminando la complejidad financiera mediante IA autónoma',
  vision: 'Ser el estándar global en contabilidad autónoma para empresas, donde la IA gestiona el 100% de las operaciones contables',
  
  product: {
    name: 'ObelixIA ERP',
    type: 'Cloud ERP Platform con IA',
    mainFeatures: [
      'Contabilidad autónoma impulsada por IA',
      'Asientos contables automáticos',
      'Reconciliación bancaria inteligente',
      'Predicción de flujo de caja',
      'Cumplimiento fiscal automatizado',
      'Reporting financiero en tiempo real',
      'Multi-divisa con IA',
      'Auditoría continua automatizada'
    ],
    technology: ['React', 'TypeScript', 'Supabase', 'Edge Functions', 'Gemini AI', 'GPT-5'],
    differentiators: [
      'Único ERP con motor de contabilidad 100% autónomo',
      'IA nativa, no añadida posteriormente',
      'Curva de aprendizaje cero',
      'Tiempo real vs batch processing tradicional'
    ]
  },
  
  market: {
    tam: 50000000000, // $50B global ERP market
    sam: 5000000000, // $5B European SMB ERP
    som: 500000000, // $500M Spain + Portugal SMB
    targetCustomers: ['PYMEs 10-250 empleados', 'Startups', 'Despachos profesionales'],
    competitors: ['Holded', 'Sage', 'A3', 'Contasol', 'Factorial', 'SAP Business One', 'Odoo']
  },
  
  businessModel: {
    type: 'SaaS Subscription',
    pricing: {
      starter: { price: 49, users: 2, features: 'Basic' },
      professional: { price: 149, users: 10, features: 'Full AI' },
      enterprise: { price: 499, users: 'unlimited', features: 'Custom' }
    },
    revenueStreams: ['Subscriptions', 'Implementation Services', 'API Access', 'Premium Support']
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const { action, planType, targetAudience, section, context, language } = await req.json() as BusinessPlanRequest;
    console.log(`[obelixia-business-plan-generator] Action: ${action}, Type: ${planType}`);

    let systemPrompt = '';
    let userPrompt = '';

    const baseContext = `
PERFIL COMPLETO DE OBELIXIA:
${JSON.stringify(OBELIXIA_PROFILE, null, 2)}

DATOS ADICIONALES DEL CONTEXTO:
${context ? JSON.stringify(context, null, 2) : 'No hay datos adicionales'}

IDIOMA: ${language === 'en' ? 'English' : language === 'ca' ? 'Català' : 'Español'}
`;

    switch (action) {
      case 'generate_full_plan':
        systemPrompt = `Eres un consultor de estrategia empresarial de primer nivel, especializado en planes de negocio para startups tecnológicas.

${baseContext}

OBJETIVO: Generar un Plan de Negocio COMPLETO y PROFESIONAL para Obelixia.
AUDIENCIA: ${targetAudience || 'inversores'}
TIPO: ${planType || 'complete'}

El plan debe ser:
- EXTENSO: 50-80 páginas de contenido detallado
- PROFESIONAL: Lenguaje formal, datos concretos, proyecciones fundamentadas
- CONVINCENTE: Destacar fortalezas, mitigar debilidades, mostrar oportunidad clara
- ESTRUCTURADO: Secciones claras con subsecciones detalladas

ESTRUCTURA DEL PLAN DE NEGOCIO (13 secciones):

1. RESUMEN EJECUTIVO (2-3 páginas)
2. DESCRIPCIÓN DE LA EMPRESA (5-7 páginas)
3. ANÁLISIS DE MERCADO (8-10 páginas)
4. ANÁLISIS COMPETITIVO (6-8 páginas)
5. PRODUCTO/SERVICIO (8-10 páginas)
6. MODELO DE NEGOCIO (5-7 páginas)
7. ESTRATEGIA DE MARKETING Y VENTAS (6-8 páginas)
8. PLAN OPERATIVO (5-7 páginas)
9. EQUIPO Y ORGANIZACIÓN (4-5 páginas)
10. PLAN FINANCIERO (10-12 páginas)
11. ANÁLISIS DE RIESGOS (4-5 páginas)
12. ROADMAP DE IMPLEMENTACIÓN (4-5 páginas)
13. NECESIDADES DE INVERSIÓN Y EXIT (3-4 páginas)

FORMATO DE RESPUESTA (JSON estricto):
{
  "businessPlan": {
    "title": "Plan de Negocio - Obelixia Technologies",
    "version": "1.0",
    "date": "2025-01",
    "confidentiality": "CONFIDENCIAL",
    "sections": {
      "executiveSummary": {
        "title": "1. Resumen Ejecutivo",
        "content": "Contenido extenso en markdown...",
        "keyPoints": ["Punto 1", "Punto 2"],
        "callToAction": "Mensaje final"
      },
      "companyDescription": {
        "title": "2. Descripción de la Empresa",
        "content": "Contenido extenso...",
        "subsections": {
          "missionVision": "...",
          "history": "...",
          "legalStructure": "...",
          "location": "..."
        }
      },
      "marketAnalysis": {
        "title": "3. Análisis de Mercado",
        "content": "...",
        "tam": { "value": 50000000000, "description": "..." },
        "sam": { "value": 5000000000, "description": "..." },
        "som": { "value": 500000000, "description": "..." },
        "trends": ["Trend 1", "Trend 2"],
        "targetSegments": [{"name": "...", "size": "...", "characteristics": "..."}]
      },
      "competitiveAnalysis": {
        "title": "4. Análisis Competitivo",
        "content": "...",
        "competitors": [{"name": "...", "strengths": [], "weaknesses": []}],
        "competitiveAdvantages": [],
        "positioningStrategy": "..."
      },
      "productService": {
        "title": "5. Producto/Servicio",
        "content": "...",
        "features": [],
        "technology": "...",
        "roadmap": [],
        "intellectualProperty": "..."
      },
      "businessModel": {
        "title": "6. Modelo de Negocio",
        "content": "...",
        "revenueModel": "...",
        "pricing": {},
        "unitEconomics": {}
      },
      "marketingStrategy": {
        "title": "7. Estrategia de Marketing y Ventas",
        "content": "...",
        "channels": [],
        "customerAcquisition": "...",
        "salesProcess": "..."
      },
      "operationsPlan": {
        "title": "8. Plan Operativo",
        "content": "...",
        "infrastructure": "...",
        "processes": [],
        "suppliers": []
      },
      "teamOrganization": {
        "title": "9. Equipo y Organización",
        "content": "...",
        "orgChart": "...",
        "keyRoles": [],
        "hiringPlan": []
      },
      "financialPlan": {
        "title": "10. Plan Financiero",
        "content": "...",
        "projections": {
          "revenue": [{"year": 2025, "amount": 0}, {"year": 2026, "amount": 0}],
          "costs": [],
          "profit": []
        },
        "breakeven": "...",
        "cashFlow": []
      },
      "riskAnalysis": {
        "title": "11. Análisis de Riesgos",
        "content": "...",
        "risks": [{"risk": "...", "probability": "...", "impact": "...", "mitigation": "..."}]
      },
      "implementationRoadmap": {
        "title": "12. Roadmap de Implementación",
        "content": "...",
        "phases": [{"phase": 1, "name": "...", "duration": "...", "milestones": []}]
      },
      "investmentNeeds": {
        "title": "13. Necesidades de Inversión",
        "content": "...",
        "fundingRequired": 0,
        "useOfFunds": [],
        "exitStrategy": "..."
      }
    }
  },
  "metadata": {
    "totalPages": 65,
    "wordCount": 25000,
    "generatedAt": "2025-01-01T00:00:00Z"
  }
}`;

        userPrompt = 'Genera el Plan de Negocio completo para Obelixia con todo el detalle requerido. Sé exhaustivo y profesional.';
        break;

      case 'generate_section':
        systemPrompt = `Eres un experto en redacción de planes de negocio.

${baseContext}

Genera SOLO la sección solicitada del plan de negocio con máximo detalle.

FORMATO DE RESPUESTA (JSON estricto):
{
  "section": {
    "title": "Título de la sección",
    "content": "Contenido completo en markdown (mínimo 2000 palabras)",
    "subsections": {},
    "keyTakeaways": [],
    "dataPoints": [],
    "charts": []
  }
}`;

        userPrompt = `Genera la sección "${section}" del plan de negocio para Obelixia con máximo detalle.`;
        break;

      case 'generate_executive':
        systemPrompt = `Eres un experto en comunicación ejecutiva para inversores.

${baseContext}

Genera un RESUMEN EJECUTIVO de 2-3 páginas que capture la esencia del negocio y convenza al lector de seguir leyendo.

FORMATO DE RESPUESTA (JSON estricto):
{
  "executiveSummary": {
    "headline": "Frase gancho inicial",
    "problem": "El problema que resolvemos",
    "solution": "Nuestra solución única",
    "market": "Oportunidad de mercado",
    "traction": "Tracción/validación",
    "team": "Por qué este equipo",
    "financials": "Proyecciones clave",
    "ask": "Lo que buscamos",
    "callToAction": "Cierre convincente"
  }
}`;

        userPrompt = 'Genera un resumen ejecutivo impactante para Obelixia';
        break;

      case 'get_template':
        return new Response(JSON.stringify({
          success: true,
          data: {
            template: {
              sections: [
                'Resumen Ejecutivo',
                'Descripción de la Empresa',
                'Análisis de Mercado',
                'Análisis Competitivo',
                'Producto/Servicio',
                'Modelo de Negocio',
                'Estrategia de Marketing',
                'Plan Operativo',
                'Equipo y Organización',
                'Plan Financiero',
                'Análisis de Riesgos',
                'Roadmap',
                'Inversión y Exit'
              ],
              estimatedPages: 65,
              audiences: ['vc', 'angel', 'bank', 'grant', 'internal']
            }
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

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
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 8000,
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
      console.error('[obelixia-business-plan-generator] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[obelixia-business-plan-generator] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[obelixia-business-plan-generator] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
