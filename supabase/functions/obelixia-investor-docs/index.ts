import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvestorDocsRequest {
  action: 'generate_pitch_deck' | 'generate_one_pager' | 'generate_investor_memo' | 'generate_grant_dossier' | 'generate_data_room_index';
  targetInvestor?: 'vc' | 'angel' | 'bank' | 'grant' | 'corporate';
  grantId?: string;
  language?: 'es' | 'en' | 'ca';
  context?: {
    askAmount?: number;
    useOfFunds?: Record<string, unknown>;
    highlights?: string[];
  };
}

const OBELIXIA_DATA = {
  company: {
    name: 'Obelixia Technologies S.L.',
    tagline: 'La contabilidad que se hace sola',
    founded: 2024,
    location: 'Barcelona, España',
    website: 'https://obelixia.com'
  },
  
  problem: {
    statement: 'Las PYMEs pierden 15+ horas/semana en tareas contables manuales',
    painPoints: [
      '68% de PYMEs no tienen contabilidad al día',
      '45% de errores contables por entrada manual',
      'Coste medio de €3,000/mes en servicios contables externos',
      'Falta de visibilidad financiera en tiempo real'
    ]
  },
  
  solution: {
    headline: 'ERP con IA que automatiza el 100% de la contabilidad',
    features: [
      'Asientos contables automáticos en tiempo real',
      'Reconciliación bancaria con 99% precisión',
      'Predicción de flujo de caja a 12 meses',
      'Cumplimiento fiscal automático (SII, 303, 390)',
      'Auditoría continua 24/7'
    ],
    differentiators: [
      'ÚNICO ERP con motor de contabilidad autónomo',
      'IA nativa (Gemini + GPT-5), no añadida',
      'Curva de aprendizaje CERO',
      'Tiempo real vs procesamiento batch'
    ]
  },
  
  market: {
    tam: '€50B - Global ERP Market',
    sam: '€5B - European SMB ERP',
    som: '€500M - Spain & Portugal',
    growth: '12% CAGR',
    targetSegment: 'PYMEs 10-250 empleados en España'
  },
  
  businessModel: {
    type: 'SaaS Subscription',
    tiers: [
      { name: 'Starter', price: 49, features: 'Contabilidad básica IA' },
      { name: 'Professional', price: 149, features: 'Full IA + Multi-user' },
      { name: 'Enterprise', price: 499, features: 'Custom + API + Support' }
    ],
    unitEconomics: {
      arpu: 120,
      cac: 500,
      ltv: 3600,
      ltvCac: 7.2,
      payback: '5 meses',
      grossMargin: 85,
      netRevenueRetention: 115
    }
  },
  
  traction: {
    stage: 'Pre-revenue / MVP',
    milestones: [
      'MVP completo con 15 módulos',
      '10 beta testers activos',
      '2 LOIs de partners potenciales',
      'Pipeline de €50K ARR'
    ],
    roadmap: [
      { quarter: 'Q1 2025', milestone: 'Launch público' },
      { quarter: 'Q2 2025', milestone: '100 clientes' },
      { quarter: 'Q4 2025', milestone: '500 clientes, breakeven' },
      { quarter: 'Q4 2026', milestone: '2000 clientes, €2M ARR' }
    ]
  },
  
  competition: {
    landscape: [
      { name: 'Holded', position: 'Líder español', gap: 'Sin IA autónoma' },
      { name: 'Sage', position: 'Incumbent', gap: 'UX anticuada, sin IA' },
      { name: 'A3', position: 'Asesorías', gap: 'Legacy, sin innovación' }
    ],
    moat: 'Propiedad intelectual en motor de contabilidad autónoma'
  },
  
  team: {
    founders: [
      { role: 'CEO', background: 'Ex-CFO startup, 15 años finanzas' },
      { role: 'CTO', background: 'Ex-Google, 10 años IA/ML' }
    ],
    advisors: ['Ex-CEO Holded', 'Partner Big4'],
    hiring: ['VP Sales', 'Lead Engineer', 'Product Manager']
  },
  
  financials: {
    projections: {
      2025: { revenue: 180000, customers: 200, arr: 240000 },
      2026: { revenue: 720000, customers: 800, arr: 960000 },
      2027: { revenue: 2160000, customers: 2000, arr: 2880000 }
    },
    metrics: {
      burnRate: 35000,
      runway: '14 meses',
      breakeven: 'Q4 2025'
    }
  },
  
  ask: {
    amount: 500000,
    type: 'Pre-Seed',
    valuation: '€3M pre-money',
    useOfFunds: {
      'Product & Engineering': 40,
      'Sales & Marketing': 35,
      'Operations': 15,
      'Legal & Compliance': 10
    },
    milestones: [
      '500 clientes pagando',
      '€500K ARR',
      'Breakeven operativo',
      'Preparación Serie A'
    ]
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

    const { action, targetInvestor, grantId, language, context } = await req.json() as InvestorDocsRequest;
    console.log(`[obelixia-investor-docs] Action: ${action}, Target: ${targetInvestor}`);

    let systemPrompt = '';
    let userPrompt = '';

    const baseContext = `
DATOS COMPLETOS DE OBELIXIA:
${JSON.stringify(OBELIXIA_DATA, null, 2)}

CONTEXTO ADICIONAL:
${context ? JSON.stringify(context, null, 2) : 'Sin datos adicionales'}

IDIOMA: ${language === 'en' ? 'English' : language === 'ca' ? 'Català' : 'Español'}
AUDIENCIA: ${targetInvestor || 'general'}
`;

    switch (action) {
      case 'generate_pitch_deck':
        systemPrompt = `Eres un experto en creación de pitch decks para startups tecnológicas.

${baseContext}

Genera un PITCH DECK de 15-20 slides siguiendo la estructura óptima para ${targetInvestor || 'VCs'}.

ESTRUCTURA:
1. Cover (Nombre, tagline, logo placeholder)
2. Problem (El dolor del mercado)
3. Solution (Nuestra propuesta única)
4. Product Demo (Features principales)
5. Market Size (TAM/SAM/SOM)
6. Business Model (Cómo ganamos dinero)
7. Traction (Métricas, milestones)
8. Competition (Mapa competitivo)
9. Competitive Advantage (Nuestro moat)
10. Go-to-Market (Estrategia de crecimiento)
11. Team (Fundadores y advisors)
12. Financials (Proyecciones)
13. The Ask (Cuánto y para qué)
14. Milestones (Qué lograremos)
15. Thank You / Contact

FORMATO DE RESPUESTA (JSON estricto):
{
  "pitchDeck": {
    "title": "Obelixia - Pitch Deck",
    "version": "1.0",
    "targetAudience": "${targetInvestor}",
    "slides": [
      {
        "number": 1,
        "title": "Cover",
        "type": "cover",
        "content": {
          "headline": "Obelixia",
          "tagline": "La contabilidad que se hace sola",
          "visual": "Logo + imagen IA contabilidad"
        },
        "speakerNotes": "Notas para el presentador...",
        "duration": "30 segundos"
      },
      {
        "number": 2,
        "title": "The Problem",
        "type": "problem",
        "content": {
          "headline": "Las PYMEs pierden 15+ horas/semana en contabilidad manual",
          "bullets": ["Stat 1", "Stat 2", "Stat 3"],
          "visual": "Gráfico de tiempo perdido"
        },
        "speakerNotes": "...",
        "duration": "1 minuto"
      }
    ],
    "metadata": {
      "totalSlides": 15,
      "estimatedDuration": "12 minutos",
      "keyMessages": [],
      "callToAction": "Agendar reunión de seguimiento"
    }
  }
}`;

        userPrompt = `Genera pitch deck completo para Obelixia orientado a ${targetInvestor || 'VCs'}`;
        break;

      case 'generate_one_pager':
        systemPrompt = `Eres un experto en comunicación ejecutiva condensada.

${baseContext}

Genera un ONE-PAGER de 1 página que capture la esencia de Obelixia para networking e introducción rápida.

FORMATO DE RESPUESTA (JSON estricto):
{
  "onePager": {
    "header": {
      "companyName": "Obelixia",
      "tagline": "...",
      "website": "...",
      "contact": "..."
    },
    "sections": {
      "problem": {
        "headline": "...",
        "content": "2-3 frases"
      },
      "solution": {
        "headline": "...",
        "bullets": ["Feature 1", "Feature 2", "Feature 3"]
      },
      "market": {
        "tam": "€50B",
        "sam": "€5B",
        "som": "€500M",
        "targetSegment": "..."
      },
      "traction": {
        "metrics": ["Metric 1", "Metric 2"],
        "logos": ["Partner 1"]
      },
      "businessModel": {
        "type": "SaaS",
        "pricing": "€49-€499/mes",
        "unitEconomics": "LTV/CAC: 7.2x"
      },
      "team": {
        "founders": ["Founder 1", "Founder 2"],
        "advisors": ["Advisor 1"]
      },
      "ask": {
        "amount": "€500K",
        "use": "Product & GTM"
      }
    },
    "footer": {
      "cta": "Agendar demo: demo@obelixia.com",
      "social": "@obelixia"
    }
  }
}`;

        userPrompt = 'Genera one-pager ejecutivo para Obelixia';
        break;

      case 'generate_investor_memo':
        systemPrompt = `Eres un experto en redacción de investment memos.

${baseContext}

Genera un INVESTOR MEMO de 5-10 páginas con análisis profundo de la oportunidad de inversión.

FORMATO DE RESPUESTA (JSON estricto):
{
  "investorMemo": {
    "title": "Investment Memo - Obelixia Technologies",
    "date": "Enero 2025",
    "confidentiality": "CONFIDENCIAL",
    "sections": {
      "executiveSummary": {
        "recommendation": "INVERTIR",
        "amount": "€500K",
        "valuation": "€3M pre-money",
        "keyReasons": ["Razón 1", "Razón 2", "Razón 3"]
      },
      "investmentThesis": {
        "mainThesis": "...",
        "supportingPoints": []
      },
      "companyOverview": {
        "description": "...",
        "history": "...",
        "legal": "..."
      },
      "productAnalysis": {
        "description": "...",
        "moat": "...",
        "roadmap": []
      },
      "marketAnalysis": {
        "size": {},
        "trends": [],
        "dynamics": "..."
      },
      "competitiveAnalysis": {
        "landscape": "...",
        "positioning": "...",
        "advantages": []
      },
      "teamAssessment": {
        "founders": [],
        "gaps": [],
        "plan": "..."
      },
      "financialAnalysis": {
        "historicals": {},
        "projections": {},
        "assumptions": [],
        "sensitivities": {}
      },
      "riskAnalysis": {
        "keyRisks": [],
        "mitigations": []
      },
      "dealTerms": {
        "amount": "€500K",
        "instrument": "SAFE / Equity",
        "valuation": "€3M pre-money",
        "terms": []
      },
      "conclusion": {
        "recommendation": "INVERTIR",
        "nextSteps": []
      }
    }
  }
}`;

        userPrompt = 'Genera investor memo completo para Obelixia';
        break;

      case 'generate_grant_dossier':
        systemPrompt = `Eres un experto en redacción de solicitudes de ayudas públicas.

${baseContext}

AYUDA OBJETIVO: ${grantId || 'NEOTEC 2025'}

Genera un DOSSIER para solicitud de ayuda pública con toda la documentación requerida.

FORMATO DE RESPUESTA (JSON estricto):
{
  "grantDossier": {
    "grantName": "${grantId || 'NEOTEC 2025'}",
    "applicant": "Obelixia Technologies S.L.",
    "projectTitle": "ObelixIA: Motor de Contabilidad Autónoma impulsado por IA",
    "sections": {
      "memoriaDescriptiva": {
        "title": "Memoria Descriptiva del Proyecto",
        "resumenEjecutivo": "...",
        "antecedentes": "...",
        "objetivos": ["Obj 1", "Obj 2"],
        "descripcionTecnica": "...",
        "planDeTrabajo": [],
        "cronograma": {},
        "presupuesto": {},
        "resultadosEsperados": []
      },
      "memoriaEconomica": {
        "presupuestoTotal": 500000,
        "ayudaSolicitada": 325000,
        "cofinanciacion": 175000,
        "desglose": {}
      },
      "justificacionInnovacion": {
        "estadoDelArte": "...",
        "aportacionInnovadora": "...",
        "proteccionPI": "...",
        "impactoMercado": "..."
      },
      "equipoInvestigador": {
        "miembros": [],
        "experiencia": "...",
        "capacidades": []
      },
      "impactoSocioeconomico": {
        "empleoGenerado": "...",
        "impactoRegional": "...",
        "sostenibilidad": "..."
      }
    },
    "anexos": [
      "Estatutos sociales",
      "Cuentas anuales",
      "CV equipo directivo",
      "Plan de negocio"
    ],
    "checklistDocumental": []
  }
}`;

        userPrompt = `Genera dossier de solicitud para ${grantId || 'NEOTEC 2025'}`;
        break;

      case 'generate_data_room_index':
        systemPrompt = `Eres un experto en due diligence y data rooms.

${baseContext}

Genera un ÍNDICE DE DATA ROOM completo para proceso de due diligence.

FORMATO DE RESPUESTA (JSON estricto):
{
  "dataRoomIndex": {
    "title": "Obelixia - Data Room Index",
    "lastUpdated": "2025-01",
    "categories": [
      {
        "name": "1. Corporate Documents",
        "documents": [
          { "name": "Escritura de constitución", "status": "uploaded", "priority": "critical" },
          { "name": "Estatutos vigentes", "status": "uploaded", "priority": "critical" }
        ]
      },
      {
        "name": "2. Financial Documents",
        "documents": []
      },
      {
        "name": "3. Legal Documents",
        "documents": []
      },
      {
        "name": "4. Product & Technology",
        "documents": []
      },
      {
        "name": "5. Commercial",
        "documents": []
      },
      {
        "name": "6. Team & HR",
        "documents": []
      },
      {
        "name": "7. Intellectual Property",
        "documents": []
      }
    ],
    "summary": {
      "totalDocuments": 50,
      "uploaded": 35,
      "pending": 15,
      "completeness": 70
    }
  }
}`;

        userPrompt = 'Genera índice de data room para due diligence';
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
      console.error('[obelixia-investor-docs] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[obelixia-investor-docs] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[obelixia-investor-docs] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
