import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompetitiveRequest {
  action: 'analyze_competitors' | 'generate_swot' | 'feature_comparison' | 'positioning_map' | 'competitive_strategy';
  competitors?: string[];
  context?: {
    focusAreas?: string[];
    depth?: 'quick' | 'standard' | 'deep';
  };
}

// Competitor Database
const COMPETITORS = {
  holded: {
    name: 'Holded',
    type: 'direct',
    website: 'https://holded.com',
    founded: 2016,
    headquarters: 'Barcelona, España',
    employees: '100-250',
    funding: '6M EUR',
    description: 'ERP cloud para PYMEs con contabilidad, facturación, CRM',
    pricing: {
      starter: 19,
      professional: 49,
      enterprise: 99
    },
    strengths: [
      'Brand awareness en España',
      'UI/UX intuitiva',
      'Integraciones bancarias',
      'Soporte localizado'
    ],
    weaknesses: [
      'IA limitada (features básicos)',
      'Escalabilidad para empresas grandes',
      'Personalización limitada',
      'Sin contabilidad autónoma'
    ],
    features: {
      accounting: true,
      invoicing: true,
      crm: true,
      hr: true,
      inventory: true,
      ai: 'basic',
      multiCurrency: true,
      reporting: 'standard'
    }
  },
  sage: {
    name: 'Sage',
    type: 'direct',
    website: 'https://sage.com',
    founded: 1981,
    headquarters: 'Newcastle, UK',
    employees: '10000+',
    funding: 'Public (FTSE 100)',
    description: 'Suite empresarial de contabilidad y finanzas',
    pricing: {
      basic: 35,
      standard: 75,
      plus: 150
    },
    strengths: [
      'Marca establecida',
      'Red de partners',
      'Cumplimiento normativo',
      'Soporte extensivo'
    ],
    weaknesses: [
      'UI anticuada',
      'Lento en innovación',
      'Caro para PYMEs',
      'Complejidad de implementación',
      'Sin IA nativa'
    ],
    features: {
      accounting: true,
      invoicing: true,
      crm: false,
      hr: true,
      inventory: true,
      ai: 'none',
      multiCurrency: true,
      reporting: 'advanced'
    }
  },
  a3: {
    name: 'Wolters Kluwer A3',
    type: 'direct',
    website: 'https://a3software.com',
    founded: 1990,
    headquarters: 'España',
    employees: '500-1000',
    funding: 'Part of Wolters Kluwer (AMS)',
    description: 'Software de gestión para asesorías y empresas',
    pricing: {
      eco: 45,
      pro: 95,
      premium: 195
    },
    strengths: [
      'Fuerte en asesorías',
      'Cumplimiento fiscal España',
      'Formación y soporte',
      'Integraciones SII/AEAT'
    ],
    weaknesses: [
      'Tecnología legacy',
      'UX pobre',
      'Innovación lenta',
      'Dependencia de canal'
    ],
    features: {
      accounting: true,
      invoicing: true,
      crm: false,
      hr: true,
      inventory: false,
      ai: 'none',
      multiCurrency: false,
      reporting: 'standard'
    }
  },
  factorial: {
    name: 'Factorial',
    type: 'indirect',
    website: 'https://factorial.co',
    founded: 2016,
    headquarters: 'Barcelona, España',
    employees: '500-1000',
    funding: '120M EUR',
    description: 'Software HR con módulos financieros',
    pricing: {
      core: 4,
      professional: 6,
      enterprise: 10
    },
    strengths: [
      'Fuerte en HR',
      'UX moderna',
      'Crecimiento rápido',
      'Expansión internacional'
    ],
    weaknesses: [
      'Contabilidad básica',
      'No enfocado en finanzas',
      'Sin IA contable'
    ],
    features: {
      accounting: 'basic',
      invoicing: true,
      crm: false,
      hr: true,
      inventory: false,
      ai: 'hr_only',
      multiCurrency: true,
      reporting: 'hr_focused'
    }
  },
  odoo: {
    name: 'Odoo',
    type: 'direct',
    website: 'https://odoo.com',
    founded: 2005,
    headquarters: 'Bélgica',
    employees: '1000+',
    funding: 'Private',
    description: 'ERP open source modular',
    pricing: {
      online: 24,
      onpremise: 'free + modules'
    },
    strengths: [
      'Open source',
      'Modularidad total',
      'Comunidad activa',
      'Personalización'
    ],
    weaknesses: [
      'Complejidad',
      'Requiere implementación',
      'Costes ocultos',
      'Sin IA integrada'
    ],
    features: {
      accounting: true,
      invoicing: true,
      crm: true,
      hr: true,
      inventory: true,
      ai: 'none',
      multiCurrency: true,
      reporting: 'advanced'
    }
  },
  sap: {
    name: 'SAP Business One',
    type: 'indirect',
    website: 'https://sap.com',
    founded: 1972,
    headquarters: 'Alemania',
    employees: '100000+',
    funding: 'Public (DAX)',
    description: 'ERP enterprise para medianas empresas',
    pricing: {
      perUser: 150,
      implementation: '50000+'
    },
    strengths: [
      'Funcionalidad completa',
      'Estabilidad',
      'Enterprise-ready',
      'Ecosistema partners'
    ],
    weaknesses: [
      'Muy caro',
      'Implementación larga',
      'Overkill para PYMEs',
      'Curva aprendizaje alta'
    ],
    features: {
      accounting: true,
      invoicing: true,
      crm: true,
      hr: true,
      inventory: true,
      ai: 'limited',
      multiCurrency: true,
      reporting: 'enterprise'
    }
  }
};

const OBELIXIA_PROFILE = {
  name: 'Obelixia',
  differentiators: [
    'IA nativa (no añadida)',
    'Contabilidad 100% autónoma',
    'Zero learning curve',
    'Tiempo real vs batch',
    'Pricing competitivo'
  ],
  features: {
    accounting: true,
    invoicing: true,
    crm: true,
    hr: false,
    inventory: true,
    ai: 'native_advanced',
    multiCurrency: true,
    reporting: 'ai_powered'
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

    const { action, competitors, context } = await req.json() as CompetitiveRequest;
    console.log(`[obelixia-competitive-analysis] Action: ${action}`);

    const selectedCompetitors = competitors || Object.keys(COMPETITORS);
    const competitorData = selectedCompetitors
      .filter(c => COMPETITORS[c.toLowerCase() as keyof typeof COMPETITORS])
      .map(c => COMPETITORS[c.toLowerCase() as keyof typeof COMPETITORS]);

    let systemPrompt = '';
    let userPrompt = '';

    const baseContext = `
PERFIL OBELIXIA:
${JSON.stringify(OBELIXIA_PROFILE, null, 2)}

COMPETIDORES A ANALIZAR:
${JSON.stringify(competitorData, null, 2)}
`;

    switch (action) {
      case 'analyze_competitors':
        systemPrompt = `Eres un analista de inteligencia competitiva senior.

${baseContext}

Genera un análisis competitivo completo incluyendo:
1. Perfil de cada competidor
2. Análisis DAFO individual
3. Comparación con Obelixia
4. Oportunidades y amenazas
5. Estrategia recomendada

FORMATO DE RESPUESTA (JSON estricto):
{
  "competitiveAnalysis": {
    "summary": "Resumen ejecutivo del panorama competitivo",
    "competitors": [
      {
        "name": "Holded",
        "type": "direct",
        "threatLevel": 85,
        "marketShare": "15%",
        "profile": {
          "description": "...",
          "targetMarket": "...",
          "positioning": "...",
          "growthTrend": "up|stable|down"
        },
        "swot": {
          "strengths": ["S1", "S2"],
          "weaknesses": ["W1", "W2"],
          "opportunities": ["O1", "O2"],
          "threats": ["T1", "T2"]
        },
        "vsObelixia": {
          "obelixiaAdvantages": ["Ventaja 1", "Ventaja 2"],
          "obelixiaDisadvantages": ["Desventaja 1"],
          "competitiveGaps": ["Gap 1", "Gap 2"],
          "battleStrategy": "Estrategia para competir"
        },
        "pricing": {},
        "recentMoves": ["Movimiento reciente 1"],
        "predictedMoves": ["Predicción 1"]
      }
    ],
    "marketLandscape": {
      "totalAddressableMarket": "...",
      "marketGrowth": "12% anual",
      "consolidationTrend": "...",
      "emergingTrends": ["Trend 1", "Trend 2"]
    },
    "obelixiaPositioning": {
      "currentPosition": "Challenger con diferenciación IA",
      "targetPosition": "Líder en contabilidad autónoma",
      "keyDifferentiators": [],
      "competitiveAdvantages": [],
      "vulnerabilities": []
    },
    "strategicRecommendations": [
      {
        "priority": 1,
        "recommendation": "...",
        "rationale": "...",
        "timeline": "...",
        "expectedImpact": "..."
      }
    ]
  }
}`;

        userPrompt = 'Genera análisis competitivo completo para Obelixia vs competidores principales';
        break;

      case 'generate_swot':
        systemPrompt = `Eres un estratega de negocio especializado en análisis DAFO.

${baseContext}

Genera un análisis DAFO COMPARATIVO mostrando Obelixia vs cada competidor.

FORMATO DE RESPUESTA (JSON estricto):
{
  "swotComparison": {
    "obelixia": {
      "strengths": [
        { "factor": "IA nativa", "impact": 9, "sustainability": "Alta", "evidence": "..." }
      ],
      "weaknesses": [
        { "factor": "Brand awareness", "impact": 7, "mitigable": true, "mitigation": "..." }
      ],
      "opportunities": [
        { "factor": "Mercado sin líder IA", "attractiveness": 9, "feasibility": 8, "timeframe": "12 meses" }
      ],
      "threats": [
        { "factor": "Incumbents añaden IA", "probability": 0.7, "impact": 8, "contingency": "..." }
      ]
    },
    "comparativeMatrix": {
      "strengths": {
        "obelixia": ["IA nativa", "UX moderna"],
        "holded": ["Brand", "Integraciones"],
        "sage": ["Red partners"]
      }
    },
    "competitiveGaps": [
      {
        "gap": "Ningún competidor tiene contabilidad autónoma",
        "obelixiaCapture": "First mover advantage"
      }
    ],
    "strategicImplications": []
  }
}`;

        userPrompt = 'Genera análisis DAFO comparativo Obelixia vs competidores';
        break;

      case 'feature_comparison':
        systemPrompt = `Eres un analista de producto.

${baseContext}

Genera matriz de comparación de features detallada.

FORMATO DE RESPUESTA (JSON estricto):
{
  "featureMatrix": {
    "categories": [
      {
        "name": "Contabilidad",
        "weight": 0.30,
        "features": [
          {
            "name": "Asientos automáticos",
            "importance": 9,
            "obelixia": { "score": 10, "notes": "100% IA autónoma" },
            "holded": { "score": 6, "notes": "Manual con sugerencias" },
            "sage": { "score": 4, "notes": "Manual" }
          }
        ]
      }
    ],
    "overallScores": {
      "obelixia": 85,
      "holded": 72,
      "sage": 65
    },
    "gapAnalysis": {
      "obelixiaLeads": [],
      "obelixiaLags": [],
      "parity": []
    },
    "productRoadmapSuggestions": []
  }
}`;

        userPrompt = 'Genera matriz de comparación de features';
        break;

      case 'positioning_map':
        systemPrompt = `Eres un experto en posicionamiento de marca.

${baseContext}

Genera mapa de posicionamiento competitivo con ejes relevantes.

FORMATO DE RESPUESTA (JSON estricto):
{
  "positioningMap": {
    "axes": {
      "x": { "name": "Precio", "low": "Económico", "high": "Premium" },
      "y": { "name": "Innovación IA", "low": "Tradicional", "high": "IA Avanzada" }
    },
    "positions": [
      { "company": "Obelixia", "x": 50, "y": 95, "bubbleSize": 20, "notes": "Líder IA, precio medio" },
      { "company": "Holded", "x": 40, "y": 45, "bubbleSize": 60, "notes": "Mid-market, IA básica" }
    ],
    "whitespace": [
      { "x": 30, "y": 80, "opportunity": "ERP asequible con IA avanzada" }
    ],
    "recommendedPosition": {
      "current": { "x": 50, "y": 95 },
      "target": { "x": 45, "y": 98 },
      "strategy": "Mantener liderazgo IA, ajustar pricing para volumen"
    }
  }
}`;

        userPrompt = 'Genera mapa de posicionamiento competitivo';
        break;

      case 'competitive_strategy':
        systemPrompt = `Eres un consultor de estrategia competitiva.

${baseContext}

Genera plan estratégico competitivo para Obelixia.

FORMATO DE RESPUESTA (JSON estricto):
{
  "competitiveStrategy": {
    "overallStrategy": "Diferenciación por innovación IA",
    "strategicPillars": [
      {
        "pillar": "Liderazgo tecnológico",
        "initiatives": [],
        "metrics": [],
        "timeline": "12 meses"
      }
    ],
    "battlePlans": {
      "vsHolded": {
        "strategy": "Superar en IA, igualar en UX",
        "tactics": [],
        "messaging": "Contabilidad que se hace sola"
      }
    },
    "defensiveStrategies": [],
    "offensiveStrategies": [],
    "resourceAllocation": {},
    "kpis": []
  }
}`;

        userPrompt = 'Genera estrategia competitiva para Obelixia';
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
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
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

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('[obelixia-competitive-analysis] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[obelixia-competitive-analysis] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[obelixia-competitive-analysis] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
