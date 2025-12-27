import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MultiChannelRequest {
  action: 'send_message' | 'list_threads' | 'list_messages' | 'get_channel_status' | 'list_templates' | 'broadcast';
  channel?: string;
  recipientId?: string;
  recipientIds?: string[];
  content?: string;
  templateId?: string;
  variables?: Record<string, string>;
  filter?: { channel?: string; unreadOnly?: boolean };
  threadId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, channel, recipientId, content, filter, threadId } = await req.json() as MultiChannelRequest;
    console.log(`[multi-channel] Processing action: ${action}`);

    switch (action) {
      case 'send_message':
        // Mock sending message
        const sentMessage = {
          id: crypto.randomUUID(),
          channel: channel || 'email',
          direction: 'outbound' as const,
          sender_id: 'system',
          recipient_id: recipientId || 'unknown',
          content: content || '',
          status: 'sent' as const,
          created_at: new Date().toISOString()
        };
        return new Response(JSON.stringify({
          success: true,
          message: sentMessage
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'list_threads':
        const threads = [
          {
            id: '1',
            contact_id: 'contact-1',
            contact_name: 'María García',
            last_message: '¿Cuándo estará disponible mi pedido?',
            last_message_at: new Date(Date.now() - 300000).toISOString(),
            unread_count: 2,
            channels_used: ['whatsapp', 'email'],
            sentiment: 'neutral' as const
          },
          {
            id: '2',
            contact_id: 'contact-2',
            contact_name: 'Carlos López',
            last_message: 'Gracias por la atención, excelente servicio!',
            last_message_at: new Date(Date.now() - 3600000).toISOString(),
            unread_count: 0,
            channels_used: ['email'],
            sentiment: 'positive' as const
          },
          {
            id: '3',
            contact_id: 'contact-3',
            contact_name: 'Ana Martínez',
            last_message: 'Necesito hablar con un supervisor urgente',
            last_message_at: new Date(Date.now() - 7200000).toISOString(),
            unread_count: 1,
            channels_used: ['sms', 'whatsapp'],
            sentiment: 'negative' as const
          }
        ];
        return new Response(JSON.stringify({
          success: true,
          threads: filter?.unreadOnly ? threads.filter(t => t.unread_count > 0) : threads
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'list_messages':
        const messages = [
          {
            id: 'm1',
            channel: 'whatsapp',
            direction: 'inbound' as const,
            sender_id: threadId || 'contact-1',
            recipient_id: 'system',
            content: '¿Cuándo estará disponible mi pedido?',
            status: 'read' as const,
            created_at: new Date(Date.now() - 600000).toISOString()
          },
          {
            id: 'm2',
            channel: 'whatsapp',
            direction: 'outbound' as const,
            sender_id: 'system',
            recipient_id: threadId || 'contact-1',
            content: 'Hola, su pedido está en camino. Llegará mañana antes de las 14:00.',
            status: 'delivered' as const,
            created_at: new Date(Date.now() - 300000).toISOString()
          }
        ];
        return new Response(JSON.stringify({
          success: true,
          messages
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'get_channel_status':
        const channels = [
          { channel: 'whatsapp', enabled: true, api_configured: true, daily_limit: 1000, templates_count: 12 },
          { channel: 'email', enabled: true, api_configured: true, daily_limit: 5000, templates_count: 25 },
          { channel: 'sms', enabled: true, api_configured: true, daily_limit: 500, templates_count: 8 },
          { channel: 'push', enabled: true, api_configured: true, templates_count: 15 },
          { channel: 'in_app', enabled: true, api_configured: true, templates_count: 10 }
        ];
        return new Response(JSON.stringify({
          success: true,
          channels
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'list_templates':
        const templates = [
          { id: 't1', name: 'Bienvenida', channel: 'email', content: 'Bienvenido {{nombre}} a nuestro servicio...', variables: ['nombre'], approved: true },
          { id: 't2', name: 'Confirmación pedido', channel: 'whatsapp', content: 'Hola {{nombre}}, tu pedido #{{pedido}} ha sido confirmado', variables: ['nombre', 'pedido'], approved: true },
          { id: 't3', name: 'Recordatorio cita', channel: 'sms', content: 'Recordatorio: Tienes una cita el {{fecha}} a las {{hora}}', variables: ['fecha', 'hora'], approved: true },
          { id: 't4', name: 'Encuesta satisfacción', channel: 'email', content: 'Queremos saber tu opinión sobre el servicio...', variables: [], approved: true },
          { id: 't5', name: 'Promoción', channel: 'push', content: '¡Oferta especial! {{descuento}}% de descuento', variables: ['descuento'], approved: false }
        ];
        return new Response(JSON.stringify({
          success: true,
          templates: channel ? templates.filter(t => t.channel === channel) : templates
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'broadcast':
        return new Response(JSON.stringify({
          success: true,
          sent: 45,
          failed: 3
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

  } catch (error) {
    console.error('[multi-channel] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
