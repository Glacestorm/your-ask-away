/**
 * Academia Streaming Chat - Chat con streaming token-by-token
 * Proporciona respuestas del tutor IA en tiempo real con SSE
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface StreamingChatRequest {
  message: string;
  courseId: string;
  lessonId?: string;
  courseTitle?: string;
  lessonTitle?: string;
  conversationHistory?: ChatMessage[];
  emotionalContext?: {
    state: string;
    frustrationLevel: number;
    engagementLevel: number;
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

    const requestData: StreamingChatRequest = await req.json();
    const { 
      message, 
      courseId, 
      lessonId, 
      courseTitle, 
      lessonTitle, 
      conversationHistory,
      emotionalContext 
    } = requestData;

    console.log('[AcademiaStreamingChat] Processing message for course:', courseId);

    // Build adaptive system prompt based on emotional context
    let emotionalAdaptation = '';
    if (emotionalContext) {
      if (emotionalContext.frustrationLevel > 0.6) {
        emotionalAdaptation = `
IMPORTANTE: El estudiante muestra signos de frustración. 
- Sé más paciente y comprensivo
- Divide las explicaciones en partes más pequeñas
- Ofrece más ejemplos sencillos
- Usa un tono más cálido y motivador`;
      } else if (emotionalContext.engagementLevel < 0.4) {
        emotionalAdaptation = `
NOTA: El estudiante parece estar perdiendo interés.
- Hazlo más interactivo con preguntas
- Usa ejemplos más relevantes y emocionantes
- Mantén las respuestas concisas`;
      } else if (emotionalContext.state === 'confused') {
        emotionalAdaptation = `
El estudiante parece confundido. 
- Reformula las explicaciones de forma más sencilla
- Usa analogías cotidianas
- Verifica comprensión paso a paso`;
      }
    }

    const systemPrompt = `Eres un tutor de IA experto y amigable especializado en formación empresarial.
${courseTitle ? `Estás enseñando el curso: "${courseTitle}"` : ''}
${lessonTitle ? `La lección actual es: "${lessonTitle}"` : ''}

Tu objetivo es ayudar al estudiante a comprender el material de forma clara y práctica.

Instrucciones:
- Responde de forma clara, estructurada y concisa
- Usa ejemplos prácticos cuando sea posible
- Si algo es complejo, divídelo en partes manejables
- Mantén un tono profesional pero amigable
- Usa formato Markdown para mejor legibilidad
- Limita respuestas a 300 palabras máximo a menos que sea necesario más detalle
${emotionalAdaptation}

Responde siempre en español a menos que el estudiante escriba en otro idioma.`;

    // Build messages array
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (last 10 messages)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10);
      messages.push(...recentHistory);
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    // Make streaming request to Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        stream: true,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AcademiaStreamingChat] AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'rate_limit',
          message: 'Demasiadas solicitudes. Por favor, espera un momento.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'payment_required',
          message: 'Créditos de IA insuficientes.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    // Return the stream directly
    console.log('[AcademiaStreamingChat] Streaming response started');
    
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('[AcademiaStreamingChat] Error:', error);
    return new Response(JSON.stringify({
      error: 'server_error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
