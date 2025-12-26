import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CopilotRequest {
  action: 'get_capabilities' | 'chat' | 'generate_suggestions' | 'execute_suggestion' | 'multimodal_analysis';
  sessionId: string;
  message?: string;
  attachments?: Array<{ type: string; content?: string; url?: string; name: string }>;
  context?: Record<string, unknown>;
  conversationHistory?: Array<{ role: string; content: string }>;
  suggestionId?: string;
  actionData?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
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

    const { action, sessionId, message, context, conversationHistory, inputs } = await req.json() as CopilotRequest;

    console.log(`[advanced-copilot] Processing action: ${action}, session: ${sessionId}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_capabilities':
        return new Response(JSON.stringify({
          success: true,
          capabilities: [
            { id: 'analysis', name: 'Análisis de Datos', description: 'Analizar datos y generar insights', category: 'analysis', isEnabled: true, usageCount: 0 },
            { id: 'generation', name: 'Generación de Contenido', description: 'Crear documentos, reportes e informes', category: 'generation', isEnabled: true, usageCount: 0 },
            { id: 'automation', name: 'Automatización', description: 'Ejecutar tareas automatizadas', category: 'automation', isEnabled: true, usageCount: 0 },
            { id: 'prediction', name: 'Predicciones', description: 'Generar predicciones basadas en ML', category: 'prediction', isEnabled: true, usageCount: 0 },
            { id: 'interaction', name: 'Interacción Natural', description: 'Conversación en lenguaje natural', category: 'interaction', isEnabled: true, usageCount: 0 }
          ]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'chat':
        systemPrompt = `Eres un copiloto empresarial avanzado con capacidades multimodales.

CONTEXTO DEL USUARIO:
${context ? JSON.stringify(context, null, 2) : 'Sin contexto específico'}

CAPACIDADES:
- Análisis de datos y métricas
- Generación de informes
- Recomendaciones estratégicas
- Predicciones basadas en datos
- Automatización de tareas

INSTRUCCIONES:
1. Responde de forma concisa y profesional
2. Ofrece insights accionables
3. Sugiere próximos pasos cuando sea relevante
4. Si detectas oportunidades, menciónalas

FORMATO DE RESPUESTA (JSON):
{
  "content": "Tu respuesta aquí",
  "suggestions": [
    {"id": "uuid", "type": "action|insight|recommendation", "title": "string", "description": "string", "priority": "low|medium|high", "actionable": true}
  ]
}`;

        userPrompt = message || 'Hola';
        if (conversationHistory && conversationHistory.length > 0) {
          userPrompt = `Historial reciente:\n${conversationHistory.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUsuario: ${message}`;
        }
        break;

      case 'generate_suggestions':
        systemPrompt = `Eres un sistema de sugerencias proactivas basado en IA.

CONTEXTO:
${context ? JSON.stringify(context, null, 2) : 'General'}

Genera 3-5 sugerencias relevantes basadas en el contexto.

FORMATO DE RESPUESTA (JSON):
{
  "suggestions": [
    {
      "id": "uuid",
      "type": "action|insight|warning|recommendation",
      "title": "Título breve",
      "description": "Descripción detallada",
      "priority": "low|medium|high|critical",
      "actionable": true,
      "actionData": {}
    }
  ]
}`;

        userPrompt = 'Genera sugerencias proactivas basadas en el contexto actual.';
        break;

      case 'multimodal_analysis':
        systemPrompt = `Eres un sistema de análisis multimodal avanzado.

Analiza los inputs proporcionados (texto, imágenes, documentos, datos) y genera un análisis comprehensivo.

FORMATO DE RESPUESTA (JSON):
{
  "analysis": {
    "summary": "Resumen del análisis",
    "findings": ["hallazgo1", "hallazgo2"],
    "insights": ["insight1", "insight2"],
    "recommendations": ["rec1", "rec2"],
    "confidence": 0.85,
    "dataQuality": "high|medium|low"
  }
}`;

        userPrompt = `Analiza estos inputs: ${JSON.stringify(inputs || {})}`;
        break;

      default:
        return new Response(JSON.stringify({
          success: true,
          message: 'Acción procesada'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const startTime = Date.now();
    
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
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
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
        result = { content, rawResponse: true };
      }
    } catch {
      result = { content, parseError: true };
    }

    const processingTime = Date.now() - startTime;

    console.log(`[advanced-copilot] Success: ${action} in ${processingTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      action,
      response: {
        content: result.content || content,
        model: 'gemini-2.5-flash',
        tokens: data.usage?.total_tokens,
        processingTime,
        confidence: result.confidence || 0.85
      },
      suggestions: result.suggestions || [],
      analysis: result.analysis,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[advanced-copilot] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
