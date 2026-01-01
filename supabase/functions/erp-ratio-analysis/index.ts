/**
 * erp-ratio-analysis - Edge function para análisis IA de ratios financieros
 * Fase 2: Análisis con benchmarks sectoriales y recomendaciones
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RatioAnalysisRequest {
  action: 'analyze' | 'benchmarks' | 'trend' | 'compare';
  ratios?: Record<string, unknown>;
  sector?: string;
  companyId?: string;
  years?: number;
  includeRecommendations?: boolean;
}

// Benchmarks sectoriales por industria
const SECTOR_BENCHMARKS: Record<string, Record<string, { avg: number; good: number; excellent: number }>> = {
  'general': {
    currentRatio: { avg: 1.5, good: 2.0, excellent: 2.5 },
    quickRatio: { avg: 1.0, good: 1.2, excellent: 1.5 },
    debtToEquity: { avg: 1.0, good: 0.7, excellent: 0.4 },
    interestCoverage: { avg: 3.0, good: 4.5, excellent: 6.0 },
    roe: { avg: 12, good: 18, excellent: 25 },
    roa: { avg: 5, good: 8, excellent: 12 },
    grossMargin: { avg: 30, good: 40, excellent: 50 },
    operatingMargin: { avg: 10, good: 15, excellent: 22 },
    netMargin: { avg: 6, good: 10, excellent: 15 },
    inventoryDays: { avg: 60, good: 45, excellent: 30 },
    daysReceivables: { avg: 45, good: 35, excellent: 25 },
    daysPayables: { avg: 40, good: 50, excellent: 60 },
  },
  'retail': {
    currentRatio: { avg: 1.3, good: 1.6, excellent: 2.0 },
    quickRatio: { avg: 0.5, good: 0.8, excellent: 1.0 },
    debtToEquity: { avg: 1.5, good: 1.0, excellent: 0.6 },
    interestCoverage: { avg: 2.5, good: 4.0, excellent: 5.5 },
    roe: { avg: 15, good: 22, excellent: 30 },
    roa: { avg: 4, good: 7, excellent: 10 },
    grossMargin: { avg: 25, good: 35, excellent: 45 },
    operatingMargin: { avg: 5, good: 10, excellent: 15 },
    netMargin: { avg: 3, good: 6, excellent: 10 },
    inventoryDays: { avg: 90, good: 60, excellent: 40 },
    daysReceivables: { avg: 15, good: 10, excellent: 5 },
    daysPayables: { avg: 35, good: 45, excellent: 55 },
  },
  'manufacturing': {
    currentRatio: { avg: 1.8, good: 2.2, excellent: 2.8 },
    quickRatio: { avg: 0.9, good: 1.2, excellent: 1.5 },
    debtToEquity: { avg: 0.8, good: 0.5, excellent: 0.3 },
    interestCoverage: { avg: 4.0, good: 6.0, excellent: 8.0 },
    roe: { avg: 10, good: 15, excellent: 20 },
    roa: { avg: 6, good: 9, excellent: 12 },
    grossMargin: { avg: 28, good: 35, excellent: 42 },
    operatingMargin: { avg: 8, good: 12, excellent: 18 },
    netMargin: { avg: 5, good: 8, excellent: 12 },
    inventoryDays: { avg: 75, good: 55, excellent: 40 },
    daysReceivables: { avg: 50, good: 40, excellent: 30 },
    daysPayables: { avg: 45, good: 55, excellent: 65 },
  },
  'technology': {
    currentRatio: { avg: 2.5, good: 3.0, excellent: 4.0 },
    quickRatio: { avg: 2.2, good: 2.8, excellent: 3.5 },
    debtToEquity: { avg: 0.4, good: 0.2, excellent: 0.1 },
    interestCoverage: { avg: 8.0, good: 12.0, excellent: 20.0 },
    roe: { avg: 18, good: 25, excellent: 35 },
    roa: { avg: 10, good: 15, excellent: 22 },
    grossMargin: { avg: 60, good: 70, excellent: 80 },
    operatingMargin: { avg: 18, good: 25, excellent: 35 },
    netMargin: { avg: 12, good: 18, excellent: 25 },
    inventoryDays: { avg: 30, good: 20, excellent: 10 },
    daysReceivables: { avg: 55, good: 45, excellent: 35 },
    daysPayables: { avg: 50, good: 60, excellent: 75 },
  },
  'services': {
    currentRatio: { avg: 1.4, good: 1.8, excellent: 2.3 },
    quickRatio: { avg: 1.3, good: 1.6, excellent: 2.0 },
    debtToEquity: { avg: 0.6, good: 0.4, excellent: 0.2 },
    interestCoverage: { avg: 5.0, good: 8.0, excellent: 12.0 },
    roe: { avg: 20, good: 28, excellent: 38 },
    roa: { avg: 8, good: 12, excellent: 18 },
    grossMargin: { avg: 45, good: 55, excellent: 65 },
    operatingMargin: { avg: 12, good: 18, excellent: 25 },
    netMargin: { avg: 8, good: 12, excellent: 18 },
    inventoryDays: { avg: 10, good: 5, excellent: 2 },
    daysReceivables: { avg: 40, good: 30, excellent: 20 },
    daysPayables: { avg: 25, good: 35, excellent: 45 },
  },
  'healthcare': {
    currentRatio: { avg: 1.6, good: 2.0, excellent: 2.5 },
    quickRatio: { avg: 1.2, good: 1.5, excellent: 1.9 },
    debtToEquity: { avg: 0.7, good: 0.5, excellent: 0.3 },
    interestCoverage: { avg: 4.5, good: 7.0, excellent: 10.0 },
    roe: { avg: 14, good: 20, excellent: 28 },
    roa: { avg: 7, good: 11, excellent: 16 },
    grossMargin: { avg: 50, good: 60, excellent: 70 },
    operatingMargin: { avg: 15, good: 22, excellent: 30 },
    netMargin: { avg: 10, good: 15, excellent: 22 },
    inventoryDays: { avg: 40, good: 30, excellent: 20 },
    daysReceivables: { avg: 55, good: 45, excellent: 35 },
    daysPayables: { avg: 35, good: 45, excellent: 55 },
  },
};

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { action, ratios, sector, companyId, years, includeRecommendations } = await req.json() as RatioAnalysisRequest;
    const sectorKey = sector?.toLowerCase() || 'general';
    const benchmarks = SECTOR_BENCHMARKS[sectorKey] || SECTOR_BENCHMARKS['general'];

    console.log(`[erp-ratio-analysis] Processing action: ${action}, sector: ${sectorKey}`);

    switch (action) {
      case 'benchmarks': {
        return new Response(JSON.stringify({
          success: true,
          benchmarks,
          sector: sectorKey,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'analyze': {
        if (!ratios) {
          throw new Error('Ratios data is required for analysis');
        }

        const systemPrompt = `Eres un analista financiero experto especializado en análisis de ratios financieros empresariales.
Tu rol es evaluar la salud financiera de empresas basándote en sus ratios y compararlos con benchmarks del sector ${sectorKey}.

BENCHMARKS DEL SECTOR ${sectorKey.toUpperCase()}:
${JSON.stringify(benchmarks, null, 2)}

FORMATO DE RESPUESTA (JSON estricto):
{
  "overallHealth": "excellent" | "good" | "fair" | "poor" | "critical",
  "healthScore": 0-100,
  "summary": "Resumen ejecutivo de 2-3 oraciones sobre la situación financiera",
  "keyStrengths": ["Fortaleza 1", "Fortaleza 2", "Fortaleza 3"],
  "keyWeaknesses": ["Debilidad 1", "Debilidad 2"],
  "recommendations": [
    {
      "priority": "high" | "medium" | "low",
      "area": "Área financiera",
      "action": "Acción específica recomendada",
      "expectedImpact": "Impacto esperado de la acción"
    }
  ],
  "sectorComparison": {
    "sector": "${sectorKey}",
    "percentile": 0-100,
    "comparison": "Descripción de cómo se compara con el sector"
  },
  "ratioAnalysis": [
    {
      "category": "liquidity" | "solvency" | "profitability" | "efficiency",
      "ratioName": "Nombre del ratio",
      "value": numero,
      "benchmark": numero,
      "status": "excellent" | "good" | "warning" | "critical",
      "interpretation": "Interpretación del ratio"
    }
  ],
  "trends": [
    {
      "ratio": "Nombre del ratio",
      "direction": "improving" | "stable" | "deteriorating",
      "note": "Nota sobre la tendencia"
    }
  ]
}

IMPORTANTE:
- Sé específico y accionable en las recomendaciones
- Considera las interrelaciones entre ratios (ej: alta rentabilidad pero baja liquidez)
- Prioriza problemas que requieren atención inmediata
- El healthScore debe reflejar el balance general de todos los ratios`;

        const userPrompt = `Analiza los siguientes ratios financieros y proporciona un análisis completo:

RATIOS DE LA EMPRESA:
${JSON.stringify(ratios, null, 2)}

Proporciona:
1. Evaluación general de salud financiera
2. Análisis detallado de cada categoría (liquidez, solvencia, rentabilidad, eficiencia)
3. Comparación con benchmarks del sector ${sectorKey}
4. ${includeRecommendations ? 'Recomendaciones priorizadas para mejorar' : 'Resumen de áreas de mejora'}
5. Identificación de fortalezas y debilidades clave`;

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
            temperature: 0.4,
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
          console.error('[erp-ratio-analysis] JSON parse error:', parseError);
          result = { 
            overallHealth: 'fair',
            healthScore: 50,
            summary: content,
            parseError: true 
          };
        }

        console.log(`[erp-ratio-analysis] Analysis complete: healthScore=${result.healthScore}`);

        return new Response(JSON.stringify({
          success: true,
          action: 'analyze',
          insights: result,
          analysis: result.ratioAnalysis || [],
          benchmarks,
          sector: sectorKey,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'trend': {
        // Análisis de tendencias históricas
        const systemPrompt = `Eres un analista financiero especializado en análisis de tendencias.
Genera un análisis de tendencia simulado basado en patrones típicos del sector ${sectorKey}.

FORMATO DE RESPUESTA (JSON estricto):
{
  "trend": {
    "periods": ["2024", "2023", "2022"],
    "metrics": {
      "currentRatio": [valores por período],
      "roe": [valores por período],
      "netMargin": [valores por período]
    },
    "overallTrend": "improving" | "stable" | "deteriorating",
    "keyInsights": ["Insight 1", "Insight 2"],
    "projections": {
      "nextYear": {
        "optimistic": {},
        "baseline": {},
        "pessimistic": {}
      }
    }
  }
}`;

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
              { role: 'user', content: `Genera un análisis de tendencia para los últimos ${years || 3} años en el sector ${sectorKey}` }
            ],
            temperature: 0.5,
            max_tokens: 1500,
          }),
        });

        if (!response.ok) throw new Error(`AI API error: ${response.status}`);

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        let result;
        try {
          const jsonMatch = content?.match(/\{[\s\S]*\}/);
          result = jsonMatch ? JSON.parse(jsonMatch[0]) : { rawContent: content };
        } catch {
          result = { rawContent: content };
        }

        return new Response(JSON.stringify({
          success: true,
          action: 'trend',
          ...result,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'compare': {
        // Comparación con competidores
        return new Response(JSON.stringify({
          success: true,
          action: 'compare',
          message: 'Comparación con competidores requiere datos adicionales',
          benchmarks,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

  } catch (error) {
    console.error('[erp-ratio-analysis] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
