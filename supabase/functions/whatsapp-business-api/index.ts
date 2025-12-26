import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppRequest {
  action: 'send_template' | 'send_message' | 'process_webhook' | 'sync_contacts' | 'get_templates' | 'chatbot_response' | 'get_conversations' | 'update_crm';
  phone?: string;
  templateName?: string;
  templateParams?: Record<string, string>;
  message?: string;
  webhookPayload?: any;
  contactId?: string;
  conversationId?: string;
  context?: Record<string, unknown>;
}

interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  timestamp: string;
  type: 'text' | 'template' | 'image' | 'document' | 'audio' | 'video';
  content: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  direction: 'inbound' | 'outbound';
  metadata?: Record<string, unknown>;
}

interface ConversationContext {
  conversationId: string;
  contactPhone: string;
  contactName?: string;
  lastMessages: WhatsAppMessage[];
  crmData?: Record<string, unknown>;
  intent?: string;
  sentiment?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const WHATSAPP_API_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN');
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const WHATSAPP_WEBHOOK_VERIFY_TOKEN = Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle webhook verification (GET request from Meta)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && token === WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
        console.log('[whatsapp-business-api] Webhook verified');
        return new Response(challenge, { headers: corsHeaders });
      }
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }

    const { action, phone, templateName, templateParams, message, webhookPayload, contactId, conversationId, context } = await req.json() as WhatsAppRequest;

    console.log(`[whatsapp-business-api] Processing action: ${action}`);

    let result: any;

    switch (action) {
      case 'send_template': {
        // Send a pre-approved WhatsApp template message
        if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
          // Demo mode - return mock response
          result = {
            success: true,
            messageId: `demo_${Date.now()}`,
            status: 'sent',
            demo: true,
            message: 'Template enviado en modo demo (configure WHATSAPP_API_TOKEN para producción)'
          };
          break;
        }

        const templateResponse = await fetch(
          `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: phone,
              type: 'template',
              template: {
                name: templateName,
                language: { code: 'es' },
                components: templateParams ? [
                  {
                    type: 'body',
                    parameters: Object.entries(templateParams).map(([key, value]) => ({
                      type: 'text',
                      text: value
                    }))
                  }
                ] : []
              }
            })
          }
        );

        const templateData = await templateResponse.json();
        
        // Store message in database
        await supabase.from('whatsapp_messages').insert({
          external_id: templateData.messages?.[0]?.id,
          phone_number: phone,
          template_name: templateName,
          direction: 'outbound',
          type: 'template',
          content: JSON.stringify(templateParams),
          status: 'sent',
          metadata: { templateData }
        });

        result = {
          success: templateResponse.ok,
          messageId: templateData.messages?.[0]?.id,
          status: 'sent',
          data: templateData
        };
        break;
      }

      case 'send_message': {
        // Send a regular text message (only works within 24h window)
        if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
          result = {
            success: true,
            messageId: `demo_${Date.now()}`,
            status: 'sent',
            demo: true
          };
          break;
        }

        const messageResponse = await fetch(
          `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: phone,
              type: 'text',
              text: { body: message }
            })
          }
        );

        const messageData = await messageResponse.json();

        await supabase.from('whatsapp_messages').insert({
          external_id: messageData.messages?.[0]?.id,
          phone_number: phone,
          direction: 'outbound',
          type: 'text',
          content: message,
          status: 'sent'
        });

        result = {
          success: messageResponse.ok,
          messageId: messageData.messages?.[0]?.id,
          status: 'sent'
        };
        break;
      }

      case 'process_webhook': {
        // Process incoming webhook from WhatsApp
        const entry = webhookPayload?.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        if (value?.messages) {
          for (const msg of value.messages) {
            const incomingMessage: Partial<WhatsAppMessage> = {
              id: msg.id,
              from: msg.from,
              timestamp: msg.timestamp,
              type: msg.type,
              content: msg.text?.body || msg.caption || '',
              status: 'delivered',
              direction: 'inbound'
            };

            // Store incoming message
            const { data: storedMsg } = await supabase.from('whatsapp_messages').insert({
              external_id: msg.id,
              phone_number: msg.from,
              direction: 'inbound',
              type: msg.type,
              content: incomingMessage.content,
              status: 'received',
              metadata: msg
            }).select().single();

            // Trigger chatbot response if enabled
            if (storedMsg) {
              const chatbotResponse = await generateChatbotResponse(
                supabase,
                LOVABLE_API_KEY,
                msg.from,
                incomingMessage.content || '',
                context
              );

              if (chatbotResponse && chatbotResponse.autoReply) {
                // Auto-send response
                await fetch(
                  `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
                  {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      messaging_product: 'whatsapp',
                      to: msg.from,
                      type: 'text',
                      text: { body: chatbotResponse.message }
                    })
                  }
                );
              }
            }

            // Sync with CRM
            await syncWithCRM(supabase, msg.from, incomingMessage);
          }
        }

        // Handle status updates
        if (value?.statuses) {
          for (const status of value.statuses) {
            await supabase.from('whatsapp_messages')
              .update({ status: status.status })
              .eq('external_id', status.id);
          }
        }

        result = { success: true, processed: true };
        break;
      }

      case 'chatbot_response': {
        // Generate AI chatbot response
        const response = await generateChatbotResponse(
          supabase,
          LOVABLE_API_KEY,
          phone || '',
          message || '',
          context
        );
        result = response;
        break;
      }

      case 'get_templates': {
        // Get available WhatsApp templates
        if (!WHATSAPP_API_TOKEN) {
          result = {
            templates: [
              { name: 'bienvenida', status: 'APPROVED', language: 'es', category: 'UTILITY' },
              { name: 'seguimiento_visita', status: 'APPROVED', language: 'es', category: 'MARKETING' },
              { name: 'confirmacion_cita', status: 'APPROVED', language: 'es', category: 'UTILITY' },
              { name: 'recordatorio_pago', status: 'APPROVED', language: 'es', category: 'UTILITY' },
              { name: 'promocion_producto', status: 'APPROVED', language: 'es', category: 'MARKETING' },
              { name: 'encuesta_satisfaccion', status: 'APPROVED', language: 'es', category: 'UTILITY' },
            ],
            demo: true
          };
          break;
        }

        const templatesResponse = await fetch(
          `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/message_templates`,
          {
            headers: {
              'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
            }
          }
        );
        
        const templatesData = await templatesResponse.json();
        result = { templates: templatesData.data || [] };
        break;
      }

      case 'sync_contacts': {
        // Sync WhatsApp contacts with CRM
        const { data: crmContacts } = await supabase
          .from('companies')
          .select('id, name, phone, email, contact_name')
          .not('phone', 'is', null);

        const syncedContacts = [];
        for (const contact of crmContacts || []) {
          const { data: existing } = await supabase
            .from('whatsapp_contacts')
            .select('id')
            .eq('phone_number', contact.phone)
            .single();

          if (!existing) {
            const { data: newContact } = await supabase.from('whatsapp_contacts').insert({
              phone_number: contact.phone,
              name: contact.contact_name || contact.name,
              crm_company_id: contact.id,
              sync_status: 'synced',
              last_synced_at: new Date().toISOString()
            }).select().single();
            syncedContacts.push(newContact);
          } else {
            await supabase.from('whatsapp_contacts')
              .update({
                name: contact.contact_name || contact.name,
                crm_company_id: contact.id,
                sync_status: 'synced',
                last_synced_at: new Date().toISOString()
              })
              .eq('id', existing.id);
          }
        }

        result = { 
          success: true, 
          syncedCount: syncedContacts.length,
          totalContacts: crmContacts?.length || 0
        };
        break;
      }

      case 'get_conversations': {
        // Get recent conversations
        const { data: conversations } = await supabase
          .from('whatsapp_messages')
          .select(`
            *,
            whatsapp_contacts (id, name, crm_company_id)
          `)
          .order('created_at', { ascending: false })
          .limit(100);

        // Group by phone number
        const grouped = (conversations || []).reduce((acc: any, msg: any) => {
          const phone = msg.phone_number;
          if (!acc[phone]) {
            acc[phone] = {
              phoneNumber: phone,
              contactName: msg.whatsapp_contacts?.name,
              crmCompanyId: msg.whatsapp_contacts?.crm_company_id,
              messages: [],
              lastMessage: null,
              unreadCount: 0
            };
          }
          acc[phone].messages.push(msg);
          if (!acc[phone].lastMessage || new Date(msg.created_at) > new Date(acc[phone].lastMessage.created_at)) {
            acc[phone].lastMessage = msg;
          }
          if (msg.direction === 'inbound' && msg.status !== 'read') {
            acc[phone].unreadCount++;
          }
          return acc;
        }, {});

        result = { conversations: Object.values(grouped) };
        break;
      }

      case 'update_crm': {
        // Update CRM with WhatsApp interaction data
        if (!contactId) {
          throw new Error('contactId is required');
        }

        const { data: messages } = await supabase
          .from('whatsapp_messages')
          .select('*')
          .eq('phone_number', phone)
          .order('created_at', { ascending: false })
          .limit(10);

        // Update company interaction history
        await supabase.from('company_interactions').insert({
          company_id: contactId,
          type: 'whatsapp',
          direction: 'bidirectional',
          summary: `${messages?.length || 0} mensajes WhatsApp recientes`,
          metadata: { messages: messages?.map(m => ({ id: m.id, content: m.content, direction: m.direction })) }
        });

        result = { success: true, messagesLinked: messages?.length || 0 };
        break;
      }

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[whatsapp-business-api] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[whatsapp-business-api] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to generate AI chatbot response
async function generateChatbotResponse(
  supabase: any,
  apiKey: string | undefined,
  phone: string,
  message: string,
  context?: Record<string, unknown>
): Promise<{ message: string; intent: string; sentiment: string; autoReply: boolean; suggestedActions: string[] } | null> {
  if (!apiKey) {
    // Demo mode response
    return {
      message: 'Gracias por su mensaje. Un agente le responderá en breve.',
      intent: 'general_inquiry',
      sentiment: 'neutral',
      autoReply: false,
      suggestedActions: ['Asignar a agente', 'Ver historial']
    };
  }

  try {
    // Get conversation history
    const { data: history } = await supabase
      .from('whatsapp_messages')
      .select('content, direction, created_at')
      .eq('phone_number', phone)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get CRM context
    const { data: crmData } = await supabase
      .from('whatsapp_contacts')
      .select(`
        *,
        companies:crm_company_id (id, name, status, segment, gestor_id)
      `)
      .eq('phone_number', phone)
      .single();

    const systemPrompt = `Eres un asistente virtual de atención al cliente para un CRM empresarial.

CONTEXTO DEL CLIENTE:
- Teléfono: ${phone}
- Nombre: ${crmData?.name || 'Desconocido'}
- Empresa: ${crmData?.companies?.name || 'No vinculado'}
- Segmento: ${crmData?.companies?.segment || 'N/A'}
- Estado: ${crmData?.companies?.status || 'N/A'}

HISTORIAL RECIENTE:
${(history || []).reverse().map((m: any) => `${m.direction === 'inbound' ? 'Cliente' : 'Agente'}: ${m.content}`).join('\n')}

INSTRUCCIONES:
1. Responde de forma profesional y empática
2. Si es una consulta simple, responde directamente
3. Si requiere acción humana, indica que un agente se pondrá en contacto
4. Detecta el intent y sentiment del mensaje
5. Sugiere acciones para el CRM

FORMATO DE RESPUESTA (JSON):
{
  "message": "Respuesta al cliente",
  "intent": "tipo de consulta",
  "sentiment": "positivo|neutral|negativo",
  "autoReply": true/false,
  "suggestedActions": ["acción1", "acción2"]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      message: content,
      intent: 'unknown',
      sentiment: 'neutral',
      autoReply: false,
      suggestedActions: []
    };

  } catch (error) {
    console.error('[chatbot] Error generating response:', error);
    return null;
  }
}

// Helper function to sync with CRM
async function syncWithCRM(supabase: any, phone: string, message: any): Promise<void> {
  try {
    // Find or create contact
    const { data: contact } = await supabase
      .from('whatsapp_contacts')
      .select('id, crm_company_id')
      .eq('phone_number', phone)
      .single();

    if (contact?.crm_company_id) {
      // Update last interaction
      await supabase.from('companies')
        .update({ 
          last_contact_date: new Date().toISOString(),
          notes: supabase.sql`COALESCE(notes, '') || '\n[WhatsApp ' || NOW() || '] ' || ${message.content?.substring(0, 100) || ''}`
        })
        .eq('id', contact.crm_company_id);
    }
  } catch (error) {
    console.error('[syncWithCRM] Error:', error);
  }
}
