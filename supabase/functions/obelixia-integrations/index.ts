import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FunctionRequest {
  action: 'get_integrations' | 'sync_integration' | 'test_connection' | 'configure';
  context?: Record<string, unknown>;
  integrationId?: string;
  config?: Record<string, unknown>;
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

    const { action, context, integrationId, config } = await req.json() as FunctionRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_integrations':
        systemPrompt = `Eres un gestor de integraciones empresariales especializado.

FORMATO DE RESPUESTA (JSON estricto):
{
  "integrations": [
    {
      "id": "string",
      "name": "string",
      "type": "erp|bank|invoicing|crm|payroll|custom",
      "provider": "string",
      "status": "active|inactive|error|pending",
      "lastSync": "ISO date",
      "metrics": {
        "totalSyncs": number,
        "successRate": number,
        "avgSyncTime": number
      }
    }
  ],
  "recentLogs": [
    {
      "id": "string",
      "integrationId": "string",
      "startedAt": "ISO date",
      "status": "running|success|failed",
      "recordsProcessed": number
    }
  ],
  "availableConnectors": ["SAP", "Oracle", "Sage", "A3", "Holded", "Stripe", "BBVA", "Santander"]
}`;
        userPrompt = `Genera lista de integraciones disponibles para: ${JSON.stringify(context || {})}`;
        break;

      case 'sync_integration':
        systemPrompt = `Eres un sistema de sincronización de datos.

FORMATO DE RESPUESTA (JSON estricto):
{
  "syncId": "string",
  "status": "started",
  "estimatedTime": number,
  "recordsToProcess": number
}`;
        userPrompt = `Inicia sincronización para integración: ${integrationId}`;
        break;

      case 'test_connection':
        systemPrompt = `Eres un verificador de conexiones.

FORMATO DE RESPUESTA (JSON estricto):
{
  "connected": true,
  "latency": number,
  "version": "string",
  "capabilities": ["read", "write", "sync"]
}`;
        userPrompt = `Verifica conexión para: ${integrationId}`;
        break;

      case 'configure':
        systemPrompt = `Eres un configurador de integraciones.

FORMATO DE RESPUESTA (JSON estricto):
{
  "configured": true,
  "validationErrors": [],
  "warnings": [],
  "nextSteps": ["string"]
}`;
        userPrompt = `Configura integración ${integrationId} con: ${JSON.stringify(config || {})}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[obelixia-integrations] Processing action: ${action}`);

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
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('[obelixia-integrations] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[obelixia-integrations] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[obelixia-integrations] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
