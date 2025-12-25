import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookRequest {
  action: 'list_webhooks' | 'create_webhook' | 'update_webhook' | 'delete_webhook' | 'list_deliveries' | 'retry_delivery';
  webhook?: Record<string, unknown>;
  id?: string;
  webhookId?: string;
  deliveryId?: string;
  limit?: number;
  updates?: Record<string, unknown>;
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

    const { action, webhook, id, webhookId, deliveryId, limit, updates } = await req.json() as WebhookRequest;

    console.log(`[webhooks-manager] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'list_webhooks':
        systemPrompt = `Eres un gestor de webhooks enterprise.
        
Genera una lista de webhooks configurados.

FORMATO DE RESPUESTA (JSON estricto):
{
  "webhooks": [
    {
      "id": "uuid",
      "name": "nombre descriptivo",
      "url": "https://endpoint.example.com/webhook",
      "events": ["order.created", "payment.received"],
      "is_active": true,
      "retry_policy": {
        "max_retries": 3,
        "retry_delay_ms": 1000
      },
      "created_at": "ISO timestamp",
      "updated_at": "ISO timestamp"
    }
  ]
}`;
        userPrompt = 'Genera 4-6 webhooks enterprise típicos';
        break;

      case 'create_webhook':
        systemPrompt = `Eres un gestor de webhooks.
        
Crea un nuevo webhook con la configuración proporcionada.

FORMATO DE RESPUESTA (JSON estricto):
{
  "webhook": {
    "id": "uuid",
    "name": "nombre",
    "url": "url",
    "events": ["eventos"],
    "is_active": true,
    "retry_policy": {
      "max_retries": 3,
      "retry_delay_ms": 1000
    },
    "created_at": "ISO timestamp",
    "updated_at": "ISO timestamp"
  }
}`;
        userPrompt = `Crea webhook: ${JSON.stringify(webhook)}`;
        break;

      case 'update_webhook':
        systemPrompt = `Eres un gestor de webhooks.
        
Actualiza un webhook existente.

FORMATO DE RESPUESTA (JSON estricto):
{
  "updated": true,
  "webhook_id": "uuid"
}`;
        userPrompt = `Actualiza webhook ${id}: ${JSON.stringify(updates)}`;
        break;

      case 'delete_webhook':
        systemPrompt = `Eres un gestor de webhooks.

FORMATO DE RESPUESTA (JSON estricto):
{
  "deleted": true,
  "webhook_id": "uuid"
}`;
        userPrompt = `Elimina webhook: ${id}`;
        break;

      case 'list_deliveries':
        systemPrompt = `Eres un monitor de entregas de webhooks.
        
Genera historial de entregas de webhooks.

FORMATO DE RESPUESTA (JSON estricto):
{
  "deliveries": [
    {
      "id": "uuid",
      "webhook_id": "uuid",
      "event_type": "order.created",
      "payload": {"data": "ejemplo"},
      "response_status": 200,
      "attempts": 1,
      "status": "success|failed|pending|retrying",
      "delivered_at": "ISO timestamp",
      "created_at": "ISO timestamp"
    }
  ]
}`;
        userPrompt = `Lista entregas para webhook ${webhookId || 'todos'}, limit: ${limit || 50}`;
        break;

      case 'retry_delivery':
        systemPrompt = `Eres un sistema de reintento de webhooks.

FORMATO DE RESPUESTA (JSON estricto):
{
  "retry": {
    "delivery_id": "uuid",
    "status": "retrying",
    "attempt_number": número,
    "next_retry_at": "ISO timestamp"
  }
}`;
        userPrompt = `Reintentar entrega: ${deliveryId}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

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
          success: false,
          error: 'Rate limit exceeded' 
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
    } catch {
      result = { rawContent: content, parseError: true };
    }

    console.log(`[webhooks-manager] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[webhooks-manager] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
