import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventRequest {
  action: 'list_events' | 'get_processed_events' | 'publish_event' | 'register_handler' | 'reprocess_dead_letter';
  filters?: Record<string, unknown>;
  eventName?: string;
  payload?: Record<string, unknown>;
  eventId?: string;
  handler?: Record<string, unknown>;
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

    const { action, filters, eventName, payload, eventId, handler } = await req.json() as EventRequest;

    console.log(`[event-processor] Action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'list_events':
        systemPrompt = `Eres un sistema de eventos empresarial que gestiona event-driven architecture.

FORMATO DE RESPUESTA (JSON estricto):
{
  "events": [
    {
      "id": "uuid",
      "event_name": "string",
      "event_type": "system|user|integration|scheduled|webhook",
      "source": "string",
      "schema": {},
      "handlers": [],
      "is_active": boolean,
      "retention_days": number,
      "created_at": "ISO date"
    }
  ],
  "metrics": {
    "events_per_minute": number,
    "avg_processing_time_ms": number,
    "success_rate": 0-100,
    "dead_letter_count": number,
    "active_handlers": number,
    "events_by_type": {}
  }
}`;
        userPrompt = `Genera 8-10 definiciones de eventos empresariales típicos (user.created, order.placed, payment.completed, etc) con handlers y métricas en tiempo real.`;
        break;

      case 'get_processed_events':
        systemPrompt = `Eres un monitor de eventos procesados.

FORMATO DE RESPUESTA (JSON estricto):
{
  "processed_events": [
    {
      "id": "uuid",
      "event_id": "string",
      "event_name": "string",
      "payload": {},
      "status": "received|processing|processed|failed|dead_letter",
      "processed_by": [],
      "processing_time_ms": number,
      "error_message": "string o null",
      "received_at": "ISO date",
      "processed_at": "ISO date o null"
    }
  ]
}`;
        userPrompt = `Genera 15-20 eventos procesados recientes con diferentes estados. Filtros: ${JSON.stringify(filters || {})}`;
        break;

      case 'publish_event':
        return new Response(JSON.stringify({
          success: true,
          event_id: crypto.randomUUID(),
          event_name: eventName,
          status: 'published',
          received_at: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'register_handler':
        return new Response(JSON.stringify({
          success: true,
          handler: {
            id: crypto.randomUUID(),
            ...handler,
            registered_at: new Date().toISOString()
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'reprocess_dead_letter':
        return new Response(JSON.stringify({
          success: true,
          event_id: eventId,
          status: 'requeued',
          message: 'Evento reencolado para reprocesamiento'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

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
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Rate limit exceeded' 
        }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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

    console.log(`[event-processor] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[event-processor] Error:', message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
