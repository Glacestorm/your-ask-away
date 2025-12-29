import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GrantsRequest {
  action: 'scan_grants' | 'analyze_eligibility' | 'get_deadlines' | 'generate_application' | 'search_grants';
  context?: {
    companyType?: string;
    sector?: string;
    region?: string;
    employees?: number;
    turnover?: number;
    projectDescription?: string;
  };
  params?: {
    grantId?: string;
    level?: string;
    searchQuery?: string;
    limit?: number;
  };
}

// Catalonia & Spain Grant Sources Knowledge Base
const GRANT_SOURCES = {
  catalonia: {
    name: 'ACCIÓ - Generalitat de Catalunya',
    programs: [
      {
        name: 'Startup Capital',
        maxAmount: 100000,
        type: 'loan',
        eligibility: ['startup', 'pyme'],
        focus: ['innovation', 'technology', 'digital'],
        deadline: '2025-03-31'
      },
      {
        name: 'Nuclis d\'Innovació',
        maxAmount: 250000,
        type: 'subsidy',
        eligibility: ['pyme', 'gran_empresa'],
        focus: ['r+d', 'innovation'],
        deadline: '2025-06-30'
      },
      {
        name: 'Cupons a la competitivitat',
        maxAmount: 10000,
        type: 'voucher',
        eligibility: ['pyme', 'autonomo'],
        focus: ['consulting', 'digitalization'],
        deadline: '2025-04-15'
      }
    ]
  },
  national: {
    cdti: {
      name: 'CDTI - Centro para el Desarrollo Tecnológico Industrial',
      programs: [
        {
          name: 'NEOTEC 2025',
          maxAmount: 325000,
          type: 'subsidy',
          eligibility: ['ebt', 'startup'],
          focus: ['technology', 'r+d', 'innovation'],
          deadline: '2025-05-15'
        },
        {
          name: 'PID - Proyectos I+D',
          maxAmount: 1500000,
          type: 'loan',
          eligibility: ['pyme', 'gran_empresa'],
          focus: ['r+d'],
          deadline: '2025-12-31'
        }
      ]
    },
    enisa: {
      name: 'ENISA - Empresa Nacional de Innovación',
      programs: [
        {
          name: 'Jóvenes Emprendedores',
          maxAmount: 75000,
          type: 'loan',
          eligibility: ['startup', 'autonomo'],
          focus: ['entrepreneurship'],
          deadline: '2025-12-31'
        },
        {
          name: 'Emprendedores',
          maxAmount: 300000,
          type: 'loan',
          eligibility: ['startup', 'pyme'],
          focus: ['growth', 'innovation'],
          deadline: '2025-12-31'
        },
        {
          name: 'Crecimiento',
          maxAmount: 1500000,
          type: 'loan',
          eligibility: ['pyme'],
          focus: ['scale', 'internationalization'],
          deadline: '2025-12-31'
        }
      ]
    },
    ministerio: {
      name: 'Ministerio de Economía y Competitividad',
      programs: [
        {
          name: 'Kit Digital',
          maxAmount: 12000,
          type: 'voucher',
          eligibility: ['pyme', 'autonomo', 'microempresa'],
          focus: ['digitalization'],
          deadline: '2025-06-30'
        }
      ]
    }
  },
  european: {
    horizon: {
      name: 'Horizon Europe',
      programs: [
        {
          name: 'EIC Accelerator',
          maxAmount: 2500000,
          type: 'grant_equity',
          eligibility: ['startup', 'pyme'],
          focus: ['deep_tech', 'scale'],
          deadline: '2025-10-01'
        },
        {
          name: 'EIC Pathfinder',
          maxAmount: 4000000,
          type: 'grant',
          eligibility: ['research', 'consortium'],
          focus: ['breakthrough', 'r+d'],
          deadline: '2025-04-15'
        }
      ]
    },
    digital_europe: {
      name: 'Digital Europe Programme',
      programs: [
        {
          name: 'AI & Data',
          maxAmount: 500000,
          type: 'grant',
          eligibility: ['pyme', 'consortium'],
          focus: ['ai', 'data', 'digital'],
          deadline: '2025-05-01'
        }
      ]
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

    const { action, context, params } = await req.json() as GrantsRequest;
    console.log(`[obelixia-grants-intelligence] Action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'scan_grants':
        systemPrompt = `Eres un experto en ayudas y subvenciones públicas para empresas en España, especialmente Cataluña.
        
CONOCIMIENTO BASE DE AYUDAS:
${JSON.stringify(GRANT_SOURCES, null, 2)}

Tu rol es analizar las ayudas disponibles y presentarlas de forma estructurada.

CONTEXTO DE LA EMPRESA OBELIXIA:
- Sector: Software/SaaS
- Enfoque: ERP con IA, Contabilidad Autónoma
- Tipo: Startup tecnológica (EBT)
- Ubicación: Cataluña, España
- Características I+D+i: Alto componente de innovación en IA aplicada a contabilidad

FORMATO DE RESPUESTA (JSON estricto):
{
  "grants": [
    {
      "id": "unique_id",
      "name": "Nombre del programa",
      "organization": "Entidad convocante",
      "level": "local|regional|national|european",
      "type": "subsidy|loan|voucher|equity|grant",
      "minAmount": 0,
      "maxAmount": 100000,
      "coveragePercentage": 80,
      "deadline": "2025-03-31",
      "eligibilityScore": 85,
      "successProbability": 70,
      "relevanceScore": 90,
      "requirements": ["requisito1", "requisito2"],
      "focus": ["innovation", "technology"],
      "applicationComplexity": "low|medium|high",
      "estimatedTime": "2-4 semanas",
      "keyBenefits": ["beneficio1", "beneficio2"],
      "sourceUrl": "https://...",
      "aiNotes": "Notas del análisis IA"
    }
  ],
  "summary": {
    "totalGrants": 10,
    "totalPotentialFunding": 2000000,
    "highPriorityGrants": 3,
    "upcomingDeadlines": 5
  },
  "recommendations": [
    "Recomendación estratégica 1",
    "Recomendación estratégica 2"
  ]
}`;

        userPrompt = context 
          ? `Escanea ayudas para empresa con perfil: ${JSON.stringify(context)}`
          : 'Escanea todas las ayudas disponibles para una startup tecnológica SaaS en Cataluña';
        break;

      case 'analyze_eligibility':
        systemPrompt = `Eres un consultor experto en elegibilidad de ayudas públicas.

PERFIL DE OBELIXIA:
- Software ERP con IA para contabilidad autónoma
- Startup tecnológica de base tecnológica (EBT)
- Ubicación: Cataluña
- Alto componente I+D+i
- Sector: SaaS/Enterprise Software

Analiza la elegibilidad para cada ayuda considerando:
1. Requisitos formales (tipo empresa, sector, ubicación)
2. Requisitos financieros (facturación, empleados)
3. Requisitos técnicos (tipo de proyecto, innovación)
4. Historial (ayudas previas, deudas)

FORMATO DE RESPUESTA (JSON estricto):
{
  "eligibilityAnalysis": {
    "overallScore": 85,
    "eligibleGrants": [
      {
        "grantId": "neotec_2025",
        "grantName": "NEOTEC 2025",
        "eligibilityScore": 95,
        "matchedCriteria": ["ebt", "innovation", "technology"],
        "missingCriteria": [],
        "risks": [],
        "actionItems": ["Preparar memoria técnica", "Documentar innovación"]
      }
    ],
    "partiallyEligible": [],
    "notEligible": []
  },
  "prioritizedActions": [
    {
      "priority": 1,
      "action": "Solicitar NEOTEC",
      "deadline": "2025-05-15",
      "potentialFunding": 325000,
      "successProbability": 80
    }
  ],
  "documentation": [
    "Documentos necesarios"
  ]
}`;

        userPrompt = params?.grantId 
          ? `Analiza elegibilidad específica para la ayuda ${params.grantId}` 
          : `Analiza elegibilidad general de Obelixia para todas las ayudas disponibles. Contexto: ${JSON.stringify(context || {})}`;
        break;

      case 'get_deadlines':
        systemPrompt = `Eres un asistente de gestión de plazos para ayudas públicas.

Proporciona un calendario de plazos ordenado por fecha, incluyendo:
- Fecha límite
- Nombre de la ayuda
- Entidad
- Estado de preparación recomendado
- Alertas de tiempo

FORMATO DE RESPUESTA (JSON estricto):
{
  "deadlines": [
    {
      "grantId": "id",
      "grantName": "Nombre",
      "organization": "Entidad",
      "deadline": "2025-03-31",
      "daysRemaining": 60,
      "urgency": "low|medium|high|critical",
      "preparationStatus": "not_started|in_progress|ready",
      "estimatedPrepTime": "4 semanas",
      "alert": "Mensaje de alerta si aplica"
    }
  ],
  "calendarSummary": {
    "thisMonth": 2,
    "nextMonth": 3,
    "thisQuarter": 5,
    "criticalDeadlines": 1
  },
  "recommendations": [
    "Priorizar NEOTEC por cercanía de plazo"
  ]
}`;

        userPrompt = 'Lista todos los plazos de ayudas relevantes para Obelixia ordenados por fecha';
        break;

      case 'generate_application':
        systemPrompt = `Eres un experto en redacción de solicitudes de ayudas públicas.

PERFIL DE OBELIXIA:
- Plataforma: ERP con IA para contabilidad autónoma
- Innovación: Motor de contabilidad autónomo impulsado por IA
- Mercado objetivo: PYMEs españolas
- Diferenciación: Único ERP con contabilidad completamente automatizada por IA
- Tecnología: React, TypeScript, Supabase, Edge Functions, Modelos IA

Genera un borrador de solicitud profesional y convincente.

FORMATO DE RESPUESTA (JSON estricto):
{
  "applicationDraft": {
    "grantName": "Nombre de la ayuda",
    "sections": {
      "projectTitle": "Título del proyecto",
      "executiveSummary": "Resumen ejecutivo...",
      "problemStatement": "Problema que resuelve...",
      "proposedSolution": "Solución propuesta...",
      "innovationDescription": "Descripción de la innovación...",
      "marketAnalysis": "Análisis de mercado...",
      "teamDescription": "Descripción del equipo...",
      "workPlan": "Plan de trabajo...",
      "budget": "Presupuesto estimado...",
      "expectedResults": "Resultados esperados...",
      "impactAssessment": "Evaluación de impacto..."
    },
    "keyMessages": ["Mensaje clave 1", "Mensaje clave 2"],
    "strengthsToHighlight": ["Fortaleza 1", "Fortaleza 2"],
    "riskMitigation": ["Riesgo y mitigación"]
  },
  "documentChecklist": [
    {
      "document": "Memoria técnica",
      "status": "required",
      "template": "Disponible en web convocante"
    }
  ],
  "tips": [
    "Consejo para mejorar la solicitud"
  ]
}`;

        userPrompt = params?.grantId 
          ? `Genera borrador de solicitud para la ayuda ${params.grantId}`
          : 'Genera un borrador de solicitud para la ayuda más prioritaria para Obelixia';
        break;

      case 'search_grants':
        systemPrompt = `Eres un buscador experto de ayudas públicas.
        
Busca ayudas que coincidan con la consulta del usuario.

FORMATO DE RESPUESTA (JSON estricto):
{
  "searchResults": [
    {
      "id": "grant_id",
      "name": "Nombre",
      "organization": "Entidad",
      "matchScore": 90,
      "matchReasons": ["Razón 1", "Razón 2"],
      "summary": "Breve descripción",
      "maxAmount": 100000,
      "deadline": "2025-03-31"
    }
  ],
  "totalResults": 5,
  "suggestions": ["Sugerencia de búsqueda alternativa"]
}`;

        userPrompt = `Buscar ayudas: ${params?.searchQuery || 'innovación tecnológica IA'}`;
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
        max_tokens: 4000,
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
      console.error('[obelixia-grants-intelligence] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[obelixia-grants-intelligence] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[obelixia-grants-intelligence] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
