import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  action: 'list_templates' | 'list_channels' | 'send_notification' | 'create_template' | 'get_logs' | 'get_stats';
  template?: Record<string, unknown>;
  templateId?: string;
  recipients?: string[];
  variables?: Record<string, string>;
  channels?: string[];
  filters?: Record<string, unknown>;
  period?: string;
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

    const { action, template, templateId, recipients, variables, channels, filters, period } = await req.json() as NotificationRequest;

    console.log(`[notification-system] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'list_templates':
        systemPrompt = `Eres un gestor de plantillas de notificación empresarial.

FORMATO DE RESPUESTA (JSON estricto):
{
  "templates": [
    {
      "id": "uuid",
      "name": "nombre de plantilla",
      "type": "email|push|sms|in_app|webhook",
      "subject": "asunto (para email)",
      "body": "contenido de la plantilla con {{variables}}",
      "variables": ["variable1", "variable2"],
      "is_active": true,
      "created_at": "ISO timestamp",
      "updated_at": "ISO timestamp"
    }
  ]
}`;
        userPrompt = 'Listar todas las plantillas de notificación disponibles';
        break;

      case 'list_channels':
        systemPrompt = `Eres un gestor de canales de notificación.

FORMATO DE RESPUESTA (JSON estricto):
{
  "channels": [
    {
      "id": "uuid",
      "name": "nombre del canal",
      "channel_type": "email|push|sms|slack|teams|webhook",
      "config": {},
      "is_active": true,
      "rate_limit": número,
      "retry_config": {
        "max_retries": 3,
        "retry_delay_ms": 1000
      }
    }
  ]
}`;
        userPrompt = 'Listar todos los canales de notificación configurados';
        break;

      case 'send_notification':
        systemPrompt = `Eres un sistema de envío de notificaciones.

FORMATO DE RESPUESTA (JSON estricto):
{
  "results": [
    {
      "recipient": "destinatario",
      "channel": "canal",
      "status": "sent|pending|failed",
      "message_id": "uuid",
      "sent_at": "ISO timestamp"
    }
  ],
  "summary": {
    "total_sent": número,
    "total_failed": número,
    "total_pending": número
  }
}`;
        userPrompt = `Enviar notificación con plantilla ${templateId} a ${recipients?.length} destinatarios. Variables: ${JSON.stringify(variables)}`;
        break;

      case 'create_template':
        systemPrompt = `Eres un creador de plantillas de notificación.

FORMATO DE RESPUESTA (JSON estricto):
{
  "template": {
    "id": "nuevo-uuid",
    "name": "nombre",
    "type": "tipo",
    "subject": "asunto",
    "body": "contenido",
    "variables": ["var1", "var2"],
    "is_active": false,
    "created_at": "ISO timestamp",
    "updated_at": "ISO timestamp"
  }
}`;
        userPrompt = `Crear plantilla de notificación: ${JSON.stringify(template)}`;
        break;

      case 'get_logs':
        systemPrompt = `Eres un analizador de logs de notificaciones.

FORMATO DE RESPUESTA (JSON estricto):
{
  "logs": [
    {
      "id": "uuid",
      "template_id": "template-uuid",
      "channel_id": "channel-uuid",
      "recipient": "destinatario",
      "status": "pending|sent|delivered|failed|bounced",
      "sent_at": "ISO timestamp",
      "delivered_at": "ISO timestamp o null",
      "error_message": "mensaje de error o null",
      "metadata": {}
    }
  ],
  "pagination": {
    "total": número,
    "page": 1,
    "per_page": 50
  }
}`;
        userPrompt = `Obtener logs de notificaciones. Filtros: ${JSON.stringify(filters || {})}`;
        break;

      case 'get_stats':
        systemPrompt = `Eres un analizador de estadísticas de notificaciones.

FORMATO DE RESPUESTA (JSON estricto):
{
  "stats": {
    "period": "${period || 'week'}",
    "total_sent": número,
    "total_delivered": número,
    "total_failed": número,
    "delivery_rate": porcentaje,
    "by_channel": {
      "email": { "sent": número, "delivered": número },
      "push": { "sent": número, "delivered": número },
      "sms": { "sent": número, "delivered": número }
    },
    "by_template": [
      { "template_id": "uuid", "template_name": "nombre", "count": número }
    ],
    "trend": [
      { "date": "YYYY-MM-DD", "sent": número, "delivered": número }
    ]
  }
}`;
        userPrompt = `Obtener estadísticas de notificaciones para período: ${period || 'week'}`;
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
        max_tokens: 3000,
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

    console.log(`[notification-system] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[notification-system] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
