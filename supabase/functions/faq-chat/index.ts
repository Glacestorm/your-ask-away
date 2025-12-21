import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Company knowledge base for context - ObelixIA
const COMPANY_KNOWLEDGE = `
ObelixIA es una suite modular de gestión empresarial con inteligencia artificial integrada.

DESCRIPCIÓN GENERAL:
ObelixIA combina CRM avanzado, analítica predictiva y automatización inteligente. A diferencia de ERPs tradicionales como SAP, Odoo o Salesforce, ObelixIA está diseñado desde cero con IA nativa para maximizar la eficiencia y anticipar las necesidades del negocio.

SERVICIOS Y MÓDULOS PRINCIPALES:
- CRM Inteligente con scoring predictivo de clientes
- Analítica Avanzada con dashboards en tiempo real
- Automatización de Procesos (BPMN) sin código
- Gestión de Compliance multi-regulación (RGPD, PSD2, ISO 27001)
- Mapas Interactivos con geolocalización inteligente
- Gestor Documental con OCR e IA
- Predicción de Churn y detección de anomalías
- Recomendaciones de productos personalizadas
- Asistentes virtuales para gestores y clientes

SECTORES ESPECIALIZADOS:
- Banca y Finanzas (cumplimiento PSD2, scoring crediticio)
- Seguros (gestión de pólizas, siniestros)
- Retail (omnicanalidad, gestión de inventario)
- Manufactura (control de producción, MRP)

PRECIOS:
- Desde 49€/usuario/mes para funcionalidades básicas
- Hasta 499€/usuario/mes para suite enterprise completa
- Modelo flexible basado en usuarios y módulos
- Análisis inicial gratuito

TIEMPOS DE IMPLEMENTACIÓN:
- Implementación básica: 2-4 semanas
- Implementación completa: 4-8 semanas
- Metodología ágil con entregables semanales

MIGRACIONES:
- Experiencia migrando desde Salesforce, SAP, Sage, Dynamics, HubSpot, Odoo
- Mapeo inteligente de campos con IA
- Garantía de integridad de datos

SOPORTE:
- 6 meses de soporte premium incluido
- Planes de mantenimiento desde 150€/mes
- Soporte técnico 24/7
- Formación continua y academia online

SEGURIDAD:
- Cifrado AES-256 en reposo y tránsito
- Autenticación multifactor
- Cumplimiento RGPD, PSD2, ISO 27001
- Hosting en servidores europeos certificados
- Pentesting mensual

DIFERENCIACIÓN VS COMPETENCIA:
- IA nativa integrada en cada módulo (no como add-on)
- Especialización sectorial real
- Precio competitivo sin sacrificar funcionalidades enterprise
- Implementación más rápida que Salesforce o SAP

INFORMACIÓN DE CONTACTO:
- Email comercial: comercial@obelixia.com
- Teléfono: +34 606 770 033
- Contacto comercial: Jaime Fernández García
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
    const systemPrompt = `Eres un asistente virtual de ObelixIA, una suite modular de gestión empresarial con inteligencia artificial integrada.
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
7. Promueve la demo gratuita cuando sea relevante
8. NUNCA menciones Odoo ni ningún otro competidor de forma positiva - ObelixIA es nuestra plataforma propia
9. Si preguntan por ERPs o CRMs de la competencia, explica las ventajas de ObelixIA frente a ellos`;

    // Call Lovable AI
    const response = await fetch(LOVABLE_API_URL, {
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
        model: 'google/gemini-2.5-flash',
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
