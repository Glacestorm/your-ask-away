import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { notes, companyName } = await req.json();

    if (!notes) {
      return new Response(
        JSON.stringify({ error: "Notes are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres ObelixIA, un asistente especializado en análisis de reuniones comerciales bancarias. 
Tu tarea es analizar las notas de una reunión y generar:
1. Un resumen ejecutivo conciso (máximo 150 palabras)
2. Una lista de 3-5 próximos pasos accionables
3. Una lista de 1-3 riesgos o puntos de atención identificados

Responde SIEMPRE en español y en formato JSON con esta estructura exacta:
{
  "summary": "El resumen ejecutivo aquí...",
  "nextSteps": ["Paso 1", "Paso 2", "Paso 3"],
  "risks": ["Riesgo 1", "Riesgo 2"]
}

Sé profesional, conciso y enfocado en valor comercial para el banco.`;

    const userPrompt = `Analiza las siguientes notas de reunión con el cliente "${companyName || 'Cliente'}":

${notes}

Genera el análisis en formato JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de peticiones excedido. Inténtalo en unos minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response content from AI");
    }

    // Parse the JSON response
    let result;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      
      result = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Fallback: create a simple response
      result = {
        summary: content.substring(0, 500),
        nextSteps: ["Revisar notas y definir acciones específicas"],
        risks: ["Análisis automático incompleto - revisar manualmente"],
      };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in summarize-visit:", error);
    const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
