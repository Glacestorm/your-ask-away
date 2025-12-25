import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VoiceRequest {
  action: 'start_session' | 'end_session' | 'process_command' | 'get_sessions' | 'get_token' | 'transcribe';
  sessionId?: string;
  userId?: string;
  command?: string;
  audioData?: string;
  context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

const VOICE_COMMAND_PROMPT = `Eres un asistente de voz inteligente para una plataforma bancaria enterprise.
Interpretas comandos de voz y los conviertes en acciones del sistema.

COMANDOS SOPORTADOS:
- Navegación: "ir a [sección]", "abrir [módulo]", "mostrar [dashboard]"
- Consultas: "cuál es [métrica]", "dame el resumen de [área]", "buscar [término]"
- Acciones: "crear [entidad]", "aprobar [solicitud]", "enviar [reporte]"
- Alertas: "mostrar alertas", "revisar pendientes", "ver notificaciones"

FORMATO DE RESPUESTA (JSON estricto):
{
  "understood": true,
  "intent": "navigate" | "query" | "action" | "alert" | "unknown",
  "command": {
    "type": "string",
    "target": "string",
    "params": {}
  },
  "response": {
    "text": "string para TTS",
    "action": "string para UI"
  },
  "confidence": 0-100,
  "alternatives": [
    { "intent": "string", "confidence": number }
  ]
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const ELEVEN_LABS_API_KEY = Deno.env.get('ELEVEN_LABS_API_KEY');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, sessionId, userId, command, audioData, context, metadata } = await req.json() as VoiceRequest;

    console.log(`[voice-interface] Action: ${action}, SessionId: ${sessionId}`);

    switch (action) {
      case 'start_session': {
        if (!userId) throw new Error('userId required');

        const { data, error } = await supabase
          .from('voice_sessions')
          .insert({
            user_id: userId,
            status: 'active',
            started_at: new Date().toISOString(),
            session_type: context?.sessionType || 'command',
            context_data: context,
            metadata
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'end_session': {
        if (!sessionId) throw new Error('sessionId required');

        const { data: session } = await supabase
          .from('voice_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        const { data: commands } = await supabase
          .from('voice_commands')
          .select('*')
          .eq('session_id', sessionId);

        const startTime = session?.started_at ? new Date(session.started_at).getTime() : Date.now();
        const duration = Math.floor((Date.now() - startTime) / 1000);

        const { data, error } = await supabase
          .from('voice_sessions')
          .update({
            status: 'ended',
            ended_at: new Date().toISOString(),
            total_duration_seconds: duration,
            commands_count: commands?.length || 0
          })
          .eq('id', sessionId)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'process_command': {
        if (!command) throw new Error('command required');

        if (!LOVABLE_API_KEY) {
          throw new Error('LOVABLE_API_KEY not configured');
        }

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: VOICE_COMMAND_PROMPT },
              { role: 'user', content: `Comando de voz: "${command}"\n\nContexto actual: ${JSON.stringify(context || {})}` }
            ],
            temperature: 0.3,
            max_tokens: 500,
          }),
        });

        if (!aiResponse.ok) {
          throw new Error(`AI API error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;

        let result;
        try {
          const jsonMatch = content?.match(/\{[\s\S]*\}/);
          result = jsonMatch ? JSON.parse(jsonMatch[0]) : { understood: false, rawContent: content };
        } catch {
          result = { understood: false, rawContent: content };
        }

        // Store command if we have a session
        if (sessionId) {
          await supabase.from('voice_commands').insert({
            session_id: sessionId,
            user_id: userId,
            command_text: command,
            intent: result.intent,
            parsed_command: result.command,
            confidence_score: result.confidence,
            was_executed: result.understood,
            execution_result: result
          });
        }

        return new Response(JSON.stringify({ success: true, data: result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_sessions': {
        if (!userId) throw new Error('userId required');

        const { data, error } = await supabase
          .from('voice_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('started_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_token': {
        // Return ElevenLabs configuration for client-side Conversational AI
        if (!ELEVEN_LABS_API_KEY) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'ElevenLabs not configured',
            fallbackMode: 'text'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // For ElevenLabs Conversational AI, we provide the agent ID
        // The actual conversation happens client-side
        return new Response(JSON.stringify({ 
          success: true, 
          data: {
            provider: 'elevenlabs',
            agentId: Deno.env.get('ELEVEN_LABS_AGENT_ID') || null,
            hasApiKey: true
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'transcribe': {
        if (!audioData) throw new Error('audioData required');

        // Use Lovable AI for transcription (Whisper compatible)
        if (!LOVABLE_API_KEY) {
          throw new Error('LOVABLE_API_KEY not configured');
        }

        // For audio transcription, we'd need to use OpenAI Whisper or similar
        // Since Lovable AI uses compatible endpoints, we can attempt transcription
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Transcription via Lovable AI not supported directly. Use client-side Web Speech API.',
          suggestion: 'Use browser SpeechRecognition API'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[voice-interface] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
