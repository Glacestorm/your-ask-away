import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversationalRequest {
  action: 'process_message' | 'get_context' | 'execute_command' | 'get_suggestions' | 
          'analyze_intent' | 'multi_turn_dialogue' | 'voice_to_action' | 'summarize_conversation' |
          'get_conversation_history' | 'clear_context';
  message?: string;
  context?: Record<string, unknown>;
  conversation_id?: string;
  user_id?: string;
  voice_input?: string;
  history?: Array<{ role: string; content: string }>;
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

    const { action, message, context, conversation_id, user_id, voice_input, history } = await req.json() as ConversationalRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'process_message':
        systemPrompt = `Eres un asistente de IA conversacional para una plataforma enterprise bancaria/financiera.

ROL Y CAPACIDADES:
- Comprendes el contexto empresarial y técnico
- Puedes ejecutar acciones del sistema mediante comandos
- Mantienes contexto multi-turno en conversaciones
- Proporcionas respuestas precisas y accionables

CONTEXTO ACTUAL:
${JSON.stringify(context || {}, null, 2)}

FORMATO DE RESPUESTA (JSON):
{
  "response": "Respuesta conversacional natural",
  "intent": "detected_intent",
  "confidence": 0.95,
  "suggested_actions": [
    {
      "action_type": "navigate|create|update|analyze|report",
      "action_name": "Nombre descriptivo",
      "parameters": {},
      "confirmation_required": true
    }
  ],
  "entities_extracted": {
    "companies": [],
    "dates": [],
    "metrics": [],
    "users": []
  },
  "follow_up_questions": [],
  "context_update": {}
}`;

        userPrompt = `Mensaje del usuario: "${message}"
Historial de conversación: ${JSON.stringify(history || [])}`;
        break;

      case 'analyze_intent':
        systemPrompt = `Eres un analizador de intenciones para comandos empresariales.

INTENCIONES SOPORTADAS:
- QUERY: Consultas de información
- COMMAND: Órdenes de ejecución
- NAVIGATION: Navegación en la aplicación
- REPORT: Generación de reportes
- ANALYSIS: Solicitud de análisis
- AUTOMATION: Configuración de automatizaciones
- HELP: Solicitud de ayuda
- SMALL_TALK: Conversación casual
- ESCALATION: Escalamiento a humano

FORMATO DE RESPUESTA (JSON):
{
  "primary_intent": "COMMAND",
  "secondary_intents": ["ANALYSIS"],
  "confidence": 0.92,
  "intent_breakdown": {
    "COMMAND": 0.92,
    "ANALYSIS": 0.45,
    "QUERY": 0.23
  },
  "required_permissions": ["admin", "reports"],
  "complexity": "medium",
  "estimated_execution_time": "2-5 seconds",
  "clarification_needed": false,
  "ambiguity_points": []
}`;

        userPrompt = `Analiza la intención: "${message}"`;
        break;

      case 'execute_command':
        systemPrompt = `Eres un ejecutor de comandos de IA para sistemas enterprise.

COMANDOS DISPONIBLES:
- create_report: Crear reportes
- send_notification: Enviar notificaciones
- schedule_task: Programar tareas
- analyze_data: Analizar datos
- generate_alert: Generar alertas
- update_status: Actualizar estados
- assign_task: Asignar tareas
- export_data: Exportar datos

CONTEXTO:
${JSON.stringify(context || {}, null, 2)}

FORMATO DE RESPUESTA (JSON):
{
  "command_parsed": {
    "action": "create_report",
    "target": "ventas_mensuales",
    "parameters": {},
    "modifiers": []
  },
  "execution_plan": [
    {
      "step": 1,
      "action": "fetch_data",
      "description": "Obtener datos de ventas",
      "estimated_time": "1s"
    }
  ],
  "pre_execution_checks": [
    {
      "check": "permissions",
      "status": "passed",
      "details": ""
    }
  ],
  "confirmation_message": "¿Deseas crear el reporte de ventas mensuales?",
  "rollback_available": true,
  "side_effects": []
}`;

        userPrompt = `Comando a ejecutar: "${message}"`;
        break;

      case 'get_suggestions':
        systemPrompt = `Eres un asistente proactivo que sugiere acciones útiles.

CONTEXTO DEL USUARIO:
${JSON.stringify(context || {}, null, 2)}

FORMATO DE RESPUESTA (JSON):
{
  "suggestions": [
    {
      "id": "sug_001",
      "type": "action|insight|reminder|optimization",
      "title": "Título de la sugerencia",
      "description": "Descripción detallada",
      "priority": "high|medium|low",
      "relevance_score": 0.95,
      "reason": "Por qué se sugiere esto",
      "quick_action": {
        "label": "Ejecutar",
        "command": "comando_a_ejecutar"
      },
      "expires_at": "2025-12-28T00:00:00Z"
    }
  ],
  "context_based_tips": [],
  "trending_actions": [],
  "personalization_factors": []
}`;

        userPrompt = `Usuario: ${user_id}, Contexto actual: ${JSON.stringify(context)}`;
        break;

      case 'multi_turn_dialogue':
        systemPrompt = `Eres un sistema de diálogo multi-turno avanzado.

HISTORIAL DE CONVERSACIÓN:
${JSON.stringify(history || [], null, 2)}

CONTEXTO PERSISTENTE:
${JSON.stringify(context || {}, null, 2)}

INSTRUCCIONES:
- Mantén coherencia con turnos anteriores
- Resuelve referencias anafóricas (él, esto, aquello)
- Actualiza el contexto según la conversación
- Detecta cambios de tema

FORMATO DE RESPUESTA (JSON):
{
  "response": "Respuesta contextualizada",
  "dialogue_state": {
    "current_topic": "topic_name",
    "topic_stack": [],
    "unresolved_queries": [],
    "pending_confirmations": []
  },
  "context_updates": {
    "added": {},
    "modified": {},
    "removed": []
  },
  "anaphora_resolved": {
    "él": "Juan García",
    "esto": "el reporte mensual"
  },
  "topic_transition_detected": false,
  "continuation_prompts": []
}`;

        userPrompt = `Nuevo mensaje: "${message}"`;
        break;

      case 'voice_to_action':
        systemPrompt = `Eres un procesador de comandos de voz para sistemas enterprise.

CAPACIDADES:
- Transcripción a texto estructurado
- Corrección de errores de reconocimiento
- Detección de comandos en lenguaje natural
- Mapeo a acciones del sistema

FORMATO DE RESPUESTA (JSON):
{
  "transcription": {
    "raw": "texto original",
    "corrected": "texto corregido",
    "confidence": 0.95
  },
  "detected_commands": [
    {
      "command": "nombre_comando",
      "confidence": 0.9,
      "parameters": {},
      "alternatives": []
    }
  ],
  "voice_characteristics": {
    "language": "es-ES",
    "urgency_detected": false,
    "emotion": "neutral"
  },
  "disambiguation_needed": false,
  "confirmation_phrase": "Entendido, voy a..."
}`;

        userPrompt = `Input de voz: "${voice_input || message}"`;
        break;

      case 'summarize_conversation':
        systemPrompt = `Eres un resumidor de conversaciones empresariales.

HISTORIAL:
${JSON.stringify(history || [], null, 2)}

FORMATO DE RESPUESTA (JSON):
{
  "summary": {
    "brief": "Resumen en una línea",
    "detailed": "Resumen detallado",
    "key_points": [],
    "decisions_made": [],
    "action_items": []
  },
  "topics_discussed": [],
  "participants_mentioned": [],
  "follow_ups_required": [],
  "sentiment_analysis": {
    "overall": "positive|neutral|negative",
    "progression": []
  },
  "keywords": [],
  "exportable_notes": ""
}`;

        userPrompt = `Resumir conversación ID: ${conversation_id}`;
        break;

      case 'get_context':
        return new Response(JSON.stringify({
          success: true,
          action,
          data: {
            conversation_id,
            context: context || {},
            history_length: (history || []).length
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'get_conversation_history':
        return new Response(JSON.stringify({
          success: true,
          action,
          data: {
            conversation_id,
            history: history || [],
            total_turns: (history || []).length
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'clear_context':
        return new Response(JSON.stringify({
          success: true,
          action,
          data: {
            conversation_id,
            context_cleared: true,
            timestamp: new Date().toISOString()
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[conversational-ai-hub] Processing: ${action}`);

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
    } catch {
      result = { rawContent: content, parseError: true };
    }

    console.log(`[conversational-ai-hub] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      conversation_id: conversation_id || `conv_${Date.now()}`,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[conversational-ai-hub] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
