import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ViabilityRequest {
  action: 'generate_full_study' | 'technical_analysis' | 'commercial_analysis' | 'financial_analysis' | 'organizational_analysis' | 'risk_analysis' | 'monte_carlo';
  studyType?: 'complete' | 'technical' | 'commercial' | 'financial' | 'organizational';
  context?: {
    projectData?: Record<string, unknown>;
    financialAssumptions?: Record<string, unknown>;
    marketData?: Record<string, unknown>;
  };
  params?: {
    iterations?: number;
    variables?: Record<string, unknown>;
  };
}

const OBELIXIA_PROJECT = {
  name: 'Obelixia ERP Platform',
  investmentRequired: 500000,
  timeline: '24 months',
  
  technical: {
    stack: ['React 19', 'TypeScript', 'Supabase', 'PostgreSQL', 'Edge Functions', 'Gemini AI', 'GPT-5'],
    architecture: 'Cloud-native SaaS, Multi-tenant',
    scalability: 'Horizontal scaling via Supabase infrastructure',
    security: 'SOC2, GDPR, ISO 27001 roadmap',
    infrastructure: 'Supabase Cloud (EU region)',
    development: 'Agile, CI/CD, TDD'
  },
  
  commercial: {
    targetMarket: 'Spanish SMBs (10-250 employees)',
    tam: 5000000000,
    sam: 1000000000,
    som: 50000000,
    pricingModel: 'SaaS subscription (€49-€499/month)',
    salesModel: 'PLG + Inside Sales',
    channels: ['Direct', 'Partners', 'Marketplace'],
    cac: 500,
    ltv: 3600,
    churnRate: 0.05
  },
  
  financial: {
    initialInvestment: 500000,
    monthlyBurn: 35000,
    runway: 14, // months
    breakeven: 18, // months
    projectedRevenue: {
      year1: 180000,
      year2: 720000,
      year3: 2160000,
      year4: 5400000,
      year5: 10800000
    }
  },
  
  team: {
    founders: 2,
    currentTeam: 5,
    plannedHires: {
      year1: 8,
      year2: 15,
      year3: 25
    }
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

    const { action, studyType, context, params } = await req.json() as ViabilityRequest;
    console.log(`[obelixia-viability-study] Action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    const baseContext = `
DATOS DEL PROYECTO OBELIXIA:
${JSON.stringify(OBELIXIA_PROJECT, null, 2)}

CONTEXTO ADICIONAL:
${context ? JSON.stringify(context, null, 2) : 'Sin datos adicionales'}
`;

    switch (action) {
      case 'generate_full_study':
        systemPrompt = `Eres un consultor senior especializado en estudios de viabilidad empresarial.

${baseContext}

OBJETIVO: Generar un ESTUDIO DE VIABILIDAD EXHAUSTIVO para Obelixia.

El estudio debe analizar 5 dimensiones:
1. VIABILIDAD TÉCNICA (30%)
2. VIABILIDAD COMERCIAL (25%)
3. VIABILIDAD ECONÓMICO-FINANCIERA (25%)
4. VIABILIDAD ORGANIZACIONAL (10%)
5. ANÁLISIS DE RIESGOS (10%)

Para cada dimensión:
- Análisis detallado
- Métricas cuantitativas
- Puntuación 0-100
- Conclusiones
- Recomendaciones

FORMATO DE RESPUESTA (JSON estricto):
{
  "viabilityStudy": {
    "title": "Estudio de Viabilidad - Obelixia Technologies",
    "date": "2025-01",
    "overallScore": 82,
    "recommendation": "VIABLE CON RECOMENDACIONES",
    
    "technicalViability": {
      "score": 90,
      "weight": 0.30,
      "weightedScore": 27,
      "analysis": {
        "technologyStack": {
          "assessment": "Excelente elección de stack tecnológico moderno y escalable",
          "score": 92,
          "strengths": ["React ecosystem maduro", "Supabase reduce tiempo desarrollo", "IA de última generación"],
          "risks": ["Dependencia de proveedores cloud", "Curva aprendizaje IA"],
          "recommendations": ["Documentar arquitectura", "Plan de contingencia multi-cloud"]
        },
        "scalability": {
          "score": 88,
          "currentCapacity": "1000 usuarios concurrentes",
          "projectedNeeds": "50000 usuarios en 5 años",
          "scalingStrategy": "Horizontal scaling automático",
          "bottlenecks": ["Base de datos en picos", "Costes IA por llamada"],
          "solutions": ["Read replicas", "Caching agresivo", "Optimización prompts"]
        },
        "security": {
          "score": 85,
          "compliance": ["GDPR", "LOPD"],
          "roadmap": ["SOC2 (12 meses)", "ISO 27001 (24 meses)"],
          "gaps": ["Pentesting pendiente", "Auditoría externa"],
          "priority": "Alta - cliente enterprise requiere certificaciones"
        },
        "developmentCapability": {
          "score": 90,
          "methodology": "Agile/Scrum",
          "velocity": "Estimada alta por herramientas modernas",
          "technicalDebt": "Bajo (proyecto nuevo)"
        }
      },
      "conclusion": "Viabilidad técnica muy alta. Stack moderno y arquitectura escalable.",
      "criticalSuccessFactors": ["Mantener calidad código", "Inversión continua en seguridad"]
    },
    
    "commercialViability": {
      "score": 78,
      "weight": 0.25,
      "weightedScore": 19.5,
      "analysis": {
        "marketDemand": {
          "score": 82,
          "tam": 5000000000,
          "sam": 1000000000,
          "som": 50000000,
          "growthRate": "12% anual",
          "validation": "Sector ERP en crecimiento, migración cloud acelerada post-COVID"
        },
        "competitiveLandscape": {
          "score": 75,
          "directCompetitors": ["Holded", "A3", "Sage"],
          "competitiveAdvantage": "IA nativa vs añadida",
          "barriers": ["Brand awareness", "Switching costs clientes"]
        },
        "customerAcquisition": {
          "score": 72,
          "cac": 500,
          "ltv": 3600,
          "ltvCacRatio": 7.2,
          "paybackPeriod": "8 meses",
          "channels": ["Content marketing", "Partnerships", "PLG"]
        },
        "pricingStrategy": {
          "score": 80,
          "positioning": "Mid-market con valor premium",
          "competitiveness": "20% por debajo de incumbents con más funcionalidad"
        }
      },
      "conclusion": "Mercado atractivo con buenas unit economics. Reto en adquisición de clientes.",
      "criticalSuccessFactors": ["Product-market fit validación", "Canales de adquisición escalables"]
    },
    
    "financialViability": {
      "score": 75,
      "weight": 0.25,
      "weightedScore": 18.75,
      "analysis": {
        "investment": {
          "required": 500000,
          "breakdown": {
            "development": 200000,
            "marketing": 150000,
            "operations": 100000,
            "legal": 50000
          }
        },
        "projections": {
          "year1": { "revenue": 180000, "costs": 420000, "profit": -240000 },
          "year2": { "revenue": 720000, "costs": 600000, "profit": 120000 },
          "year3": { "revenue": 2160000, "costs": 1200000, "profit": 960000 },
          "year4": { "revenue": 5400000, "costs": 2500000, "profit": 2900000 },
          "year5": { "revenue": 10800000, "costs": 4500000, "profit": 6300000 }
        },
        "breakeven": {
          "months": 18,
          "revenueAtBreakeven": 50000,
          "customersAtBreakeven": 150
        },
        "metrics": {
          "npv": 8500000,
          "irr": 0.45,
          "payback": "3.5 años",
          "roiAt5Years": 12.6
        },
        "scenarios": {
          "pessimistic": { "probability": 0.20, "npv": 2000000 },
          "realistic": { "probability": 0.60, "npv": 8500000 },
          "optimistic": { "probability": 0.20, "npv": 15000000 }
        },
        "sensitivity": {
          "mostSensitive": ["Churn rate", "CAC", "ARPU"],
          "breakpoints": {
            "maxChurn": 0.12,
            "maxCAC": 800,
            "minARPU": 80
          }
        }
      },
      "conclusion": "Proyecto rentable con métricas sólidas. Requiere financiación inicial.",
      "criticalSuccessFactors": ["Control de burn rate", "Alcanzar PMF antes de mes 12"]
    },
    
    "organizationalViability": {
      "score": 80,
      "weight": 0.10,
      "weightedScore": 8,
      "analysis": {
        "teamCapabilities": {
          "score": 82,
          "currentGaps": ["CMO", "VP Sales"],
          "hiringPlan": "8 contrataciones año 1",
          "culture": "Remote-first, async"
        },
        "organizationalStructure": {
          "score": 78,
          "structure": "Flat, squads autónomos",
          "scalability": "Modelo permite escalar a 50+ personas"
        },
        "operationalCapacity": {
          "score": 80,
          "infrastructure": "100% cloud, sin oficina física inicial",
          "tools": "Stack moderno (Notion, Slack, Linear)"
        }
      },
      "conclusion": "Estructura lean adecuada para fase inicial."
    },
    
    "riskAnalysis": {
      "score": 70,
      "weight": 0.10,
      "weightedScore": 7,
      "risks": [
        {
          "id": "R1",
          "name": "Competencia de incumbents",
          "probability": "Media",
          "impact": "Alto",
          "score": 60,
          "mitigation": "Diferenciación clara en IA, nicho inicial específico"
        },
        {
          "id": "R2",
          "name": "Regulación IA",
          "probability": "Media",
          "impact": "Medio",
          "score": 50,
          "mitigation": "Diseño compliance-first, monitorización regulatoria"
        },
        {
          "id": "R3",
          "name": "Fallo en product-market fit",
          "probability": "Media",
          "impact": "Muy Alto",
          "score": 70,
          "mitigation": "Validación continua, pivots rápidos, lean approach"
        },
        {
          "id": "R4",
          "name": "Dificultad captación talento",
          "probability": "Alta",
          "impact": "Medio",
          "score": 55,
          "mitigation": "ESOP, remote work, cultura atractiva"
        }
      ],
      "overallRiskLevel": "MEDIO",
      "conclusion": "Riesgos gestionables con estrategias de mitigación claras."
    }
  },
  
  "summary": {
    "overallViability": "ALTA",
    "overallScore": 82,
    "recommendation": "PROCEDER CON PRECAUCIONES",
    "keyStrengths": [
      "Stack tecnológico moderno y escalable",
      "Propuesta de valor diferenciada (IA nativa)",
      "Unit economics sólidas (LTV/CAC = 7.2)",
      "Mercado en crecimiento"
    ],
    "keyWeaknesses": [
      "Requiere validación de PMF",
      "Competencia de players establecidos",
      "Dependencia de financiación inicial"
    ],
    "criticalActions": [
      "Validar PMF en primeros 6 meses",
      "Asegurar financiación semilla",
      "Contratar CMO/VP Sales",
      "Establecer partnerships estratégicos"
    ],
    "goNoGoDecision": "GO - Con monitorización de KPIs críticos"
  }
}`;

        userPrompt = 'Genera el Estudio de Viabilidad completo para Obelixia con análisis exhaustivo de cada dimensión.';
        break;

      case 'monte_carlo':
        systemPrompt = `Eres un experto en simulación Monte Carlo para análisis financiero.

${baseContext}

PARÁMETROS DE SIMULACIÓN:
- Iteraciones: ${params?.iterations || 1000}
- Variables: ${JSON.stringify(params?.variables || {})}

Ejecuta simulación Monte Carlo para las proyecciones financieras de Obelixia.

FORMATO DE RESPUESTA (JSON estricto):
{
  "monteCarloResults": {
    "iterations": 1000,
    "variables": {
      "revenue": { "min": 0, "max": 0, "distribution": "normal", "mean": 0, "stdDev": 0 },
      "cac": { "min": 0, "max": 0, "distribution": "normal" },
      "churn": { "min": 0, "max": 0, "distribution": "triangular" }
    },
    "npvDistribution": {
      "mean": 8500000,
      "median": 8200000,
      "stdDev": 2500000,
      "min": 1500000,
      "max": 18000000,
      "percentiles": {
        "p5": 4000000,
        "p25": 6500000,
        "p50": 8200000,
        "p75": 10500000,
        "p95": 14000000
      }
    },
    "irrDistribution": {
      "mean": 0.45,
      "median": 0.42,
      "percentiles": {
        "p5": 0.15,
        "p50": 0.42,
        "p95": 0.75
      }
    },
    "probabilityOfSuccess": {
      "positiveNPV": 0.92,
      "breakeven3Years": 0.85,
      "targetReturn": 0.70
    },
    "sensitivityAnalysis": {
      "mostImpactful": ["revenue_growth", "churn_rate", "cac"],
      "correlations": {}
    },
    "riskMetrics": {
      "valueAtRisk95": 4000000,
      "expectedShortfall": 3000000,
      "probabilityOfRuin": 0.05
    },
    "conclusion": "Conclusión del análisis Monte Carlo..."
  }
}`;

        userPrompt = 'Ejecuta simulación Monte Carlo para el proyecto Obelixia';
        break;

      case 'technical_analysis':
      case 'commercial_analysis':
      case 'financial_analysis':
      case 'organizational_analysis':
      case 'risk_analysis':
        systemPrompt = `Eres un experto en análisis de viabilidad ${action.replace('_analysis', '')}.

${baseContext}

Genera un análisis detallado de viabilidad ${action.replace('_analysis', '')} para Obelixia.

FORMATO DE RESPUESTA (JSON estricto):
{
  "analysis": {
    "type": "${action}",
    "score": 0,
    "summary": "...",
    "details": {},
    "strengths": [],
    "weaknesses": [],
    "recommendations": [],
    "criticalFactors": []
  }
}`;

        userPrompt = `Analiza la viabilidad ${action.replace('_analysis', '')} de Obelixia en detalle.`;
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
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
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
      console.error('[obelixia-viability-study] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[obelixia-viability-study] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[obelixia-viability-study] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
