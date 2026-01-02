import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FunctionRequest {
  action: 'analyze' | 'benchmark' | 'predict';
  ratios: any;
  sector?: string;
  includeRecommendations?: boolean;
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

    const { action, ratios, sector, includeRecommendations } = await req.json() as FunctionRequest;

    console.log(`[erp-advanced-analysis] Processing action: ${action}, sector: ${sector}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'analyze':
        systemPrompt = `Eres un analista financiero experto especializado en análisis avanzado de empresas.
        
CONTEXTO DEL ROL:
- Analizar ratios financieros avanzados: Z-Score de Altman, pirámide DuPont, capital circulante, EBIT/EBITDA
- Identificar fortalezas, debilidades y riesgos financieros
- Proporcionar recomendaciones accionables basadas en datos
- Comparar con benchmarks sectoriales

FORMATO DE RESPUESTA (JSON estricto):
{
  "overallAssessment": "Evaluación general en 2-3 frases",
  "healthScore": 0-100,
  "riskIndicators": [
    {"indicator": "nombre", "level": "low|medium|high", "description": "descripción breve"}
  ],
  "strengths": ["fortaleza 1", "fortaleza 2"],
  "weaknesses": ["debilidad 1", "debilidad 2"],
  "recommendations": [
    {"priority": "high|medium|low", "area": "área", "action": "acción concreta", "expectedImpact": "impacto esperado"}
  ],
  "zScoreInterpretation": "Interpretación del Z-Score y tendencia",
  "duPontAnalysis": "Análisis de la descomposición DuPont del ROE",
  "workingCapitalAnalysis": "Análisis del capital circulante y liquidez",
  "sectorComparison": "Comparación con el sector ${sector || 'general'}"
}`;

        userPrompt = `Analiza estos ratios financieros avanzados:

Z-SCORE (último año): ${JSON.stringify(ratios.zScore?.[0] || {})}
Histórico Z-Score: ${JSON.stringify(ratios.zScore?.slice(0, 3) || [])}

DUPONT (último año): ${JSON.stringify(ratios.duPont?.[0] || {})}
ROE: ${ratios.duPont?.[0]?.roe ? (ratios.duPont[0].roe * 100).toFixed(2) + '%' : 'N/A'}
ROA: ${ratios.duPont?.[0]?.roa ? (ratios.duPont[0].roa * 100).toFixed(2) + '%' : 'N/A'}

CAPITAL CIRCULANTE:
- Fondo de Maniobra: ${ratios.workingCapital?.[0]?.workingCapital || 0}
- NOF: ${ratios.workingCapital?.[0]?.nof || 0}
- Ratio Solvencia: ${ratios.workingCapital?.[0]?.solvencyRatio?.toFixed(2) || 'N/A'}
- Test Ácido: ${ratios.workingCapital?.[0]?.acidTestRatio?.toFixed(2) || 'N/A'}

EBIT/EBITDA:
- EBIT: ${ratios.ebitEbitda?.[0]?.ebit || 0}
- EBITDA: ${ratios.ebitEbitda?.[0]?.ebitda || 0}
- Margen EBITDA: ${ratios.ebitEbitda?.[0]?.margenEbitda?.toFixed(2) || 'N/A'}%

RATING BANCARIO:
- Score: ${ratios.bankRating?.score?.toFixed(0) || 'N/A'}
- Rating: ${ratios.bankRating?.rating || 'N/A'}
- Nivel Riesgo: ${ratios.bankRating?.riskLevel || 'N/A'}

RATIOS SECTORIALES:
${JSON.stringify(ratios.sectoralRatios || [], null, 2)}

Sector de comparación: ${sector || 'general'}

Proporciona un análisis completo con recomendaciones priorizadas.`;
        break;

      case 'benchmark':
        systemPrompt = `Eres un experto en benchmarking financiero sectorial.

FORMATO DE RESPUESTA (JSON estricto):
{
  "sectorBenchmarks": {
    "zScore": {"min": 0, "median": 0, "max": 0, "quartile25": 0, "quartile75": 0},
    "roe": {"min": 0, "median": 0, "max": 0},
    "solvency": {"min": 0, "median": 0, "max": 0},
    "ebitdaMargin": {"min": 0, "median": 0, "max": 0}
  },
  "companyPosition": "percentil y posición relativa",
  "competitiveAdvantages": ["ventaja 1", "ventaja 2"],
  "areasToImprove": ["área 1", "área 2"]
}`;

        userPrompt = `Proporciona benchmarks sectoriales para el sector: ${sector || 'general'}
        
Compara con estos ratios de la empresa:
${JSON.stringify(ratios, null, 2)}`;
        break;

      case 'predict':
        systemPrompt = `Eres un sistema de predicción financiera basado en análisis de tendencias.

FORMATO DE RESPUESTA (JSON estricto):
{
  "predictions": [
    {"metric": "nombre", "currentValue": 0, "predictedValue": 0, "confidence": 0-100, "trend": "up|down|stable"}
  ],
  "riskForecast": "pronóstico de riesgo a 12 meses",
  "opportunities": ["oportunidad 1", "oportunidad 2"],
  "warnings": ["advertencia 1", "advertencia 2"]
}`;

        userPrompt = `Basándote en el histórico de ratios, predice tendencias:
${JSON.stringify(ratios, null, 2)}`;
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
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Rate limit exceeded', 
          message: 'Demasiadas solicitudes. Intenta más tarde.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Payment required', 
          message: 'Créditos de IA insuficientes.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) throw new Error('No content in AI response');

    let insights;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('[erp-advanced-analysis] JSON parse error:', parseError);
      insights = { 
        overallAssessment: content.substring(0, 500),
        parseError: true 
      };
    }

    console.log(`[erp-advanced-analysis] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      insights,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-advanced-analysis] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
