import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PredictionRequest {
  historicalData: {
    month: string;
    visits: number;
    successRate: number;
    products: number;
    vinculacion: number;
    revenue?: number;
  }[];
  gestorId?: string;
  predictionMonths?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { historicalData, gestorId, predictionMonths = 3 }: PredictionRequest = await req.json();

    console.log('Generating ML predictions for:', { gestorId, months: predictionMonths, dataPoints: historicalData?.length });

    if (!historicalData || historicalData.length < 3) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient historical data. Need at least 3 months of data for predictions.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `You are a banking analytics ML expert. Analyze the following historical performance data and generate predictions for the next ${predictionMonths} months.

Historical Data (JSON):
${JSON.stringify(historicalData, null, 2)}

Based on this data, predict the following metrics for each of the next ${predictionMonths} months:
- visits: Expected number of client visits
- successRate: Expected success rate percentage (0-100)
- products: Expected products per client ratio
- vinculacion: Expected client binding percentage (0-100)
- revenue: Expected revenue if data is available

Also provide:
- trends: Key trends identified in the data
- risks: Potential risks or concerns
- opportunities: Growth opportunities
- confidence: Overall prediction confidence level (low/medium/high)

Return ONLY valid JSON in this exact format:
{
  "predictions": [
    { "month": "YYYY-MM", "visits": number, "successRate": number, "products": number, "vinculacion": number, "revenue": number }
  ],
  "analysis": {
    "trends": ["trend1", "trend2"],
    "risks": ["risk1", "risk2"],
    "opportunities": ["opportunity1", "opportunity2"],
    "confidence": "medium",
    "summary": "Brief summary of predictions"
  }
}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a banking analytics ML expert. Always respond with valid JSON only, no markdown.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required, please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';

    // Parse the JSON response
    let predictions;
    try {
      // Remove any markdown formatting if present
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      predictions = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Return default predictions based on simple linear regression
      predictions = generateFallbackPredictions(historicalData, predictionMonths);
    }

    console.log('Predictions generated successfully');

    return new Response(
      JSON.stringify(predictions),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error generating predictions:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ error: 'Request timeout. Please try again.' }),
        { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateFallbackPredictions(historicalData: any[], months: number) {
  const lastMonth = historicalData[historicalData.length - 1];
  const avgGrowth = calculateAvgGrowth(historicalData);
  
  const predictions = [];
  const now = new Date();
  
  for (let i = 1; i <= months; i++) {
    const predMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
    predictions.push({
      month: predMonth.toISOString().slice(0, 7),
      visits: Math.round(lastMonth.visits * (1 + avgGrowth.visits * i)),
      successRate: Math.min(100, lastMonth.successRate * (1 + avgGrowth.successRate * i)),
      products: lastMonth.products * (1 + avgGrowth.products * i),
      vinculacion: Math.min(100, lastMonth.vinculacion * (1 + avgGrowth.vinculacion * i)),
      revenue: lastMonth.revenue ? lastMonth.revenue * (1 + avgGrowth.visits * i) : undefined,
    });
  }

  return {
    predictions,
    analysis: {
      trends: ['Datos insuficientes para análisis de tendencias detallado'],
      risks: ['Predicciones basadas en proyección lineal simple'],
      opportunities: ['Recopilar más datos históricos para mejorar precisión'],
      confidence: 'low',
      summary: 'Predicciones generadas con modelo de regresión lineal simple debido a limitaciones de datos.',
    }
  };
}

function calculateAvgGrowth(data: any[]) {
  if (data.length < 2) return { visits: 0.02, successRate: 0.01, products: 0.01, vinculacion: 0.01 };
  
  const growthRates = { visits: 0, successRate: 0, products: 0, vinculacion: 0 };
  
  for (let i = 1; i < data.length; i++) {
    growthRates.visits += (data[i].visits - data[i-1].visits) / Math.max(1, data[i-1].visits);
    growthRates.successRate += (data[i].successRate - data[i-1].successRate) / Math.max(1, data[i-1].successRate);
    growthRates.products += (data[i].products - data[i-1].products) / Math.max(1, data[i-1].products);
    growthRates.vinculacion += (data[i].vinculacion - data[i-1].vinculacion) / Math.max(1, data[i-1].vinculacion);
  }

  const n = data.length - 1;
  return {
    visits: growthRates.visits / n,
    successRate: growthRates.successRate / n,
    products: growthRates.products / n,
    vinculacion: growthRates.vinculacion / n,
  };
}
