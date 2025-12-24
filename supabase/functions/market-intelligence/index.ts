import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const { action, sector_key, project_description, existing_items } = await req.json();

    const systemPrompt = `Eres un analista de inteligencia de mercado especializado en datos de Statista, INE y Eurostat.
    
Para el sector "${sector_key}" y descripción "${project_description}", genera insights de mercado realistas basados en datos públicos típicos de estas fuentes.

FORMATO JSON:
{
  "market_data": {
    "market_size": number (en euros),
    "growth_rate": number (porcentaje),
    "competition_level": "low"|"medium"|"high",
    "avg_margin": number (0-1),
    "regulatory_risk": "low"|"medium"|"high"
  },
  "insights": [
    {
      "source": "statista"|"ine"|"eurostat",
      "category": "strengths"|"weaknesses"|"opportunities"|"threats",
      "title": "string",
      "description": "string",
      "value": number (opcional),
      "unit": "string" (opcional),
      "trend": "up"|"down"|"stable",
      "confidence": number (0-100)
    }
  ]
}

Genera 6-8 insights relevantes distribuidos entre las 4 categorías DAFO.`;

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
          { role: 'user', content: `Genera datos de mercado e insights para: ${project_description}` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { insights: [], market_data: null };
    } catch {
      result = { insights: [], market_data: null };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('[market-intelligence] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
    });
  }
});
