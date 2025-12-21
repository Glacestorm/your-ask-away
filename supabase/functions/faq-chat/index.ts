import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_URL = "https://api.lovable.dev/ai";

// Company knowledge base for context
const COMPANY_KNOWLEDGE = `
ObelixIA es una empresa especializada en implementaciones de Odoo para empresas de diversos sectores.

SERVICIOS PRINCIPALES:
- Implementación de Odoo ERP completo
- Migración desde otros ERPs (SAP, Sage, Navision, A3, etc.)
- Desarrollo de módulos personalizados
- Soporte y mantenimiento continuo
- Formación y capacitación

INFORMACIÓN DE CONTACTO:
- Email comercial: comercial@obelixia.com
- Teléfono: +34 606 770 033
- Contacto comercial: Jaime Fernández García

VENTAJAS COMPETITIVAS:
- Equipo experto certificado en Odoo
- Metodología ágil con entregas semanales
- Soporte 24/7 incluido
- Precios competitivos adaptados al tamaño de empresa
- Garantía de satisfacción

SECTORES PRINCIPALES:
- Banca y finanzas
- Manufactura
- Retail
- Servicios profesionales
- Logística
`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, sessionId, matchingFaqs } = await req.json();

    console.log('FAQ Chat request:', { question, sessionId, matchingFaqsCount: matchingFaqs?.length });

    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context from matching FAQs
    let faqContext = '';
    if (matchingFaqs && matchingFaqs.length > 0) {
      faqContext = '\n\nPREGUNTAS FRECUENTES RELACIONADAS:\n' +
        matchingFaqs.map((faq: { question: string; answer: string }) => 
          `P: ${faq.question}\nR: ${faq.answer}`
        ).join('\n\n');
    }

    // Create the prompt for Lovable AI
    const systemPrompt = `Eres un asistente virtual de ObelixIA, una empresa líder en implementaciones de Odoo.
Tu objetivo es ayudar a potenciales clientes respondiendo sus preguntas de forma clara, profesional y amigable.

${COMPANY_KNOWLEDGE}

${faqContext}

INSTRUCCIONES:
1. Responde siempre en español
2. Sé conciso pero completo
3. Si la pregunta está relacionada con las FAQs proporcionadas, usa esa información
4. Si no tienes información específica, ofrece contactar con el equipo comercial
5. Mantén un tono profesional pero cercano
6. Si mencionas precios o plazos, indica que son aproximados y pueden variar
7. Promueve la demo gratuita cuando sea relevante`;

    // Call Lovable AI
    const response = await fetch(`${LOVABLE_API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY') || ''}`
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        model: 'openai/gpt-5-mini',
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      // Fallback to FAQ-based response if AI fails
      if (matchingFaqs && matchingFaqs.length > 0) {
        return new Response(
          JSON.stringify({
            response: matchingFaqs[0].answer,
            sources: matchingFaqs.slice(0, 2),
            confidence: 0.8
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI service error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices?.[0]?.message?.content || 
      'Lo siento, no he podido procesar tu pregunta. Por favor, contacta con nuestro equipo en comercial@obelixia.com';

    console.log('FAQ Chat response generated successfully');

    return new Response(
      JSON.stringify({
        response: aiResponse,
        sources: matchingFaqs?.slice(0, 2) || [],
        confidence: matchingFaqs?.length > 0 ? 0.9 : 0.7
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('FAQ Chat error:', error);
    
    return new Response(
      JSON.stringify({
        response: 'Disculpa, ha ocurrido un error técnico. Por favor, contacta directamente con nuestro equipo en comercial@obelixia.com o llama al +34 606 770 033.',
        sources: [],
        confidence: 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
