import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIRequest {
  action: 'chat' | 'analyze' | 'suggest_mappings' | 'detect_anomalies' | 'predict_issues';
  message?: string;
  migrationContext?: {
    id: string;
    source: string;
    status?: string;
    totalRecords?: number;
    config?: Record<string, unknown>;
  };
  conversationHistory?: Array<{ role: string; content: string }>;
  dataContext?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { action, message, migrationContext, conversationHistory, dataContext } = await req.json() as AIRequest;

    console.log(`[crm-ai-assistant] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'chat':
        systemPrompt = `Eres un asistente experto en migración de datos CRM. Tu rol es ayudar a los usuarios a:
        
1. Entender el proceso de migración de datos
2. Resolver problemas comunes de mapeo de campos
3. Optimizar el rendimiento de las migraciones
4. Identificar y resolver errores
5. Sugerir mejores prácticas

CONTEXTO DE LA MIGRACIÓN ACTUAL:
${migrationContext ? JSON.stringify(migrationContext, null, 2) : 'No hay migración activa'}

Responde de forma clara, concisa y en español. Usa ejemplos prácticos cuando sea útil.
Si no tienes información suficiente, pide más detalles al usuario.`;

        const history = conversationHistory?.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })) || [];

        userPrompt = message || '';
        break;

      case 'analyze':
        systemPrompt = `Eres un analizador de datos experto en migraciones CRM. Analiza el contexto proporcionado y genera:

1. Sugerencias de mapeo automático
2. Predicciones de posibles problemas
3. Recomendaciones de optimización
4. Detección de anomalías en los datos

FORMATO DE RESPUESTA (JSON estricto):
{
  "suggestions": [
    {
      "id": "string",
      "type": "mapping" | "optimization" | "warning" | "insight",
      "title": "string",
      "description": "string",
      "confidence": number (0-100),
      "action": "string"
    }
  ],
  "predictiveAnalysis": {
    "successProbability": number,
    "estimatedDuration": number,
    "potentialIssues": [
      {"issue": "string", "probability": number, "mitigation": "string"}
    ],
    "recommendations": ["string"]
  },
  "anomalies": [
    {
      "id": "string",
      "field": "string",
      "anomalyType": "string",
      "severity": "low" | "medium" | "high",
      "description": "string",
      "affectedRecords": number,
      "suggestion": "string"
    }
  ]
}`;

        userPrompt = `Analiza esta migración CRM:
${JSON.stringify(migrationContext, null, 2)}

Datos adicionales:
${JSON.stringify(dataContext || {}, null, 2)}

Genera un análisis completo con sugerencias, predicciones y detección de anomalías.`;
        break;

      case 'suggest_mappings':
        systemPrompt = `Eres un experto en mapeo de campos de datos CRM. Analiza los campos de origen y sugiere mapeos automáticos con el sistema destino.

FORMATO DE RESPUESTA (JSON estricto):
{
  "mappings": [
    {
      "sourceField": "string",
      "targetField": "string",
      "confidence": number (0-100),
      "transformFunction": "string" | null,
      "reason": "string"
    }
  ]
}`;

        userPrompt = `Sugiere mapeos para estos campos: ${JSON.stringify(dataContext)}`;
        break;

      case 'detect_anomalies':
        systemPrompt = `Eres un detector de anomalías especializado en datos CRM. Identifica patrones inusuales, datos inconsistentes y posibles errores.

FORMATO DE RESPUESTA (JSON estricto):
{
  "anomalies": [
    {
      "id": "string",
      "field": "string",
      "anomalyType": "string",
      "severity": "low" | "medium" | "high",
      "description": "string",
      "affectedRecords": number,
      "suggestion": "string"
    }
  ],
  "overallQuality": number (0-100),
  "criticalIssues": number
}`;

        userPrompt = `Detecta anomalías en estos datos: ${JSON.stringify(dataContext)}`;
        break;

      case 'predict_issues':
        systemPrompt = `Eres un sistema predictivo para migraciones CRM. Predice posibles problemas basándote en patrones históricos y características de los datos.

FORMATO DE RESPUESTA (JSON estricto):
{
  "predictions": [
    {
      "issue": "string",
      "probability": number (0-100),
      "impact": "low" | "medium" | "high",
      "mitigation": "string"
    }
  ],
  "overallRisk": "low" | "medium" | "high",
  "successProbability": number
}`;

        userPrompt = `Predice problemas para: ${JSON.stringify(migrationContext)}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    // Build messages array
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history for chat
    if (action === 'chat' && conversationHistory) {
      messages.push(...conversationHistory);
    }

    messages.push({ role: 'user', content: userPrompt });

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: action === 'chat' ? 0.7 : 0.3,
        max_tokens: action === 'chat' ? 1000 : 2000,
      }),
    });

    // Handle rate limiting and payment errors
    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          response: 'Lo siento, hay demasiadas solicitudes en este momento. Por favor, intenta de nuevo en unos momentos.'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required',
          response: 'Los créditos de IA se han agotado. Por favor, contacta al administrador.'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('[crm-ai-assistant] AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log(`[crm-ai-assistant] Success: ${action}`);

    // For chat, return the response directly
    if (action === 'chat') {
      return new Response(JSON.stringify({
        success: true,
        response: content,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For other actions, try to parse JSON
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[crm-ai-assistant] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    return new Response(JSON.stringify({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[crm-ai-assistant] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      response: 'Ha ocurrido un error al procesar tu solicitud. Por favor, intenta de nuevo.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
