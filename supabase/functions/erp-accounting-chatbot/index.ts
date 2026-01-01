import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  action: 'chat';
  message: string;
  conversation_id?: string;
  context?: {
    company_id?: string;
    company_name?: string;
    fiscal_year?: string;
    current_module?: string;
    recent_entries?: Array<{ id: string; description: string }>;
  };
  history?: Array<{ role: string; content: string }>;
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

    const { action, message, conversation_id, context, history } = await req.json() as ChatRequest;

    if (action !== 'chat') {
      throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[erp-accounting-chatbot] ConvID: ${conversation_id}, Message: ${message.substring(0, 50)}...`);

    // Build context info
    let contextInfo = '';
    if (context) {
      contextInfo = `
CONTEXTO ACTUAL:
- Empresa: ${context.company_name || 'No especificada'}
- Año Fiscal: ${context.fiscal_year || 'Actual'}
- Módulo: ${context.current_module || 'Contabilidad General'}
${context.recent_entries?.length ? `- Asientos recientes: ${context.recent_entries.slice(0, 3).map(e => e.description).join(', ')}` : ''}`;
    }

    const systemPrompt = `Eres un experto contable y fiscal español especializado en:
- Plan General de Contabilidad (PGC) 2007 y sus modificaciones
- Normativa fiscal española (IVA, IRPF, Impuesto de Sociedades)
- Normas Internacionales de Información Financiera (NIIF/NIC)
- Procedimientos de cierre contable y auditoría
- Asientos contables y partida doble
- Análisis financiero y ratios

REGLAS:
1. Responde siempre en español profesional
2. Cita artículos específicos del PGC o normativa cuando sea relevante
3. Proporciona ejemplos prácticos con asientos contables cuando aplique
4. Si no estás seguro, indica que se consulte con un profesional
5. Mantén respuestas concisas pero completas
6. Usa formato estructurado con viñetas cuando sea apropiado
${contextInfo}

FORMATO DE ASIENTOS:
Cuando muestres asientos contables, usa este formato:
---
DEBE:
  (código) Nombre cuenta: importe €
HABER:
  (código) Nombre cuenta: importe €
---`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Demasiadas solicitudes. Por favor, espera un momento.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Créditos de IA insuficientes.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error('No content in AI response');

    console.log(`[erp-accounting-chatbot] Response generated successfully`);

    return new Response(JSON.stringify({
      success: true,
      response: {
        content,
        conversation_id
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-accounting-chatbot] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
