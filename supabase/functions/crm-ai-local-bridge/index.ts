import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LocalAIRequest {
  action: 'chat' | 'generate' | 'analyze' | 'test_connection' | 'list_models';
  model?: string;
  prompt?: string;
  context?: Record<string, unknown>;
  messages?: Array<{ role: string; content: string }>;
  ollamaUrl?: string;
  stream?: boolean;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  message?: { role: string; content: string };
  response?: string;
  done: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      action, 
      model = 'llama3.2', 
      prompt, 
      context, 
      messages,
      ollamaUrl = 'http://localhost:11434',
      stream = false
    } = await req.json() as LocalAIRequest;

    console.log(`[crm-ai-local-bridge] Action: ${action}, Model: ${model}`);

    // Fallback to Lovable AI if local not available
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    let useLocalAI = true;

    // Test connection to local Ollama
    if (action === 'test_connection') {
      try {
        const testResponse = await fetch(`${ollamaUrl}/api/tags`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        
        if (testResponse.ok) {
          const data = await testResponse.json();
          return new Response(JSON.stringify({
            success: true,
            connected: true,
            models: data.models || [],
            serverUrl: ollamaUrl,
            timestamp: new Date().toISOString()
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw new Error('Connection failed');
      } catch (error) {
        return new Response(JSON.stringify({
          success: true,
          connected: false,
          error: error instanceof Error ? error.message : 'Connection failed',
          fallbackAvailable: !!LOVABLE_API_KEY,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // List available models
    if (action === 'list_models') {
      try {
        const modelsResponse = await fetch(`${ollamaUrl}/api/tags`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        
        if (modelsResponse.ok) {
          const data = await modelsResponse.json();
          return new Response(JSON.stringify({
            success: true,
            models: data.models || [],
            source: 'local',
            timestamp: new Date().toISOString()
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw new Error('Failed to fetch models');
      } catch {
        // Return fallback models from Lovable AI
        return new Response(JSON.stringify({
          success: true,
          models: [
            { name: 'google/gemini-2.5-flash', size: 'cloud', source: 'lovable' },
            { name: 'google/gemini-2.5-pro', size: 'cloud', source: 'lovable' },
            { name: 'openai/gpt-5', size: 'cloud', source: 'lovable' },
          ],
          source: 'fallback',
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Build system prompt based on context
    let systemPrompt = `Eres un asistente de IA integrado en un CRM empresarial.
Tu rol es ayudar a los usuarios con tareas de gestión de clientes, ventas, marketing, soporte y análisis de datos.

CAPACIDADES:
- Análisis de datos de clientes y métricas
- Generación de emails y comunicaciones
- Recomendaciones de ventas y cross-selling
- Análisis de sentimiento en comunicaciones
- Predicción de comportamiento de clientes
- Automatización de tareas repetitivas

FORMATO DE RESPUESTA:
- Responde de forma concisa y profesional
- Proporciona acciones concretas cuando sea posible
- Si necesitas más información, pregunta
- Usa formato estructurado para listas y datos`;

    if (context) {
      systemPrompt += `\n\nCONTEXTO ACTUAL:\n${JSON.stringify(context, null, 2)}`;
    }

    // Try local Ollama first
    try {
      const ollamaMessages = [
        { role: 'system', content: systemPrompt },
        ...(messages || [{ role: 'user', content: prompt || '' }])
      ];

      const ollamaResponse = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: ollamaMessages,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 2000,
          }
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (ollamaResponse.ok) {
        const data = await ollamaResponse.json() as OllamaResponse;
        
        console.log(`[crm-ai-local-bridge] Local AI response received`);
        
        return new Response(JSON.stringify({
          success: true,
          source: 'local',
          model,
          response: data.message?.content || data.response,
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
          },
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      useLocalAI = false;
    } catch (localError) {
      console.log(`[crm-ai-local-bridge] Local AI failed, trying fallback:`, localError);
      useLocalAI = false;
    }

    // Fallback to Lovable AI
    if (!useLocalAI && LOVABLE_API_KEY) {
      console.log(`[crm-ai-local-bridge] Using Lovable AI fallback`);
      
      const fallbackMessages = [
        { role: 'system', content: systemPrompt },
        ...(messages || [{ role: 'user', content: prompt || '' }])
      ];

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: fallbackMessages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ 
            success: false,
            error: 'Rate limit exceeded. Try again later.' 
          }), { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ 
            success: false,
            error: 'Payment required. Add credits to continue.' 
          }), { 
            status: 402, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
        throw new Error(`Fallback AI error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      return new Response(JSON.stringify({
        success: true,
        source: 'fallback',
        model: 'google/gemini-2.5-flash',
        response: content,
        usage: data.usage,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('No AI service available');

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[crm-ai-local-bridge] Error:', message);
    return new Response(JSON.stringify({ 
      success: false, 
      error: message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
