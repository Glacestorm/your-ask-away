import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  action: 'chat';
  message: string;
  context?: {
    companyId?: string;
    fiscalYearId?: string;
    currentModule?: string;
    currentAccount?: string;
    conversationHistory?: Array<{ role: string; content: string }>;
  };
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

    const { action, message, context } = await req.json() as ChatRequest;

    if (action !== 'chat') {
      throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[erp-accounting-chatbot] Processing message: ${message.substring(0, 50)}...`);

    const systemPrompt = `Eres un experto contable y fiscal español especializado en:
- Plan General de Contabilidad (PGC) 2007 y sus modificaciones
- Normativa fiscal española (IVA, IRPF, Impuesto de Sociedades)
- Normas Internacionales de Información Financiera (NIIF/NIC)
- Procedimientos de cierre contable y auditoría

REGLAS:
1. Responde siempre en español profesional
2. Cita artículos específicos del PGC o normativa cuando sea relevante
3. Proporciona ejemplos prácticos con asientos contables cuando aplique
4. Si no estás seguro, indica que se consulte con un profesional
5. Mantén respuestas concisas pero completas (máximo 300 palabras)
6. Usa formato estructurado con viñetas cuando sea apropiado

CONTEXTO ACTUAL:
- Módulo: ${context?.currentModule || 'General'}
- Cuenta activa: ${context?.currentAccount || 'Ninguna'}

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
      ...(context?.conversationHistory || []),
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
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          response: 'Lo siento, hay demasiadas solicitudes. Por favor, espera un momento.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required',
          response: 'Créditos de IA insuficientes.' 
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
      response: content,
      context: context?.currentModule,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-accounting-chatbot] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      response: 'Lo siento, ocurrió un error. Por favor, intenta de nuevo.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
