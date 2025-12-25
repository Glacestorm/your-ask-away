/**
 * Academia Voice Token - Genera tokens efímeros para ElevenLabs Conversational AI
 * Usado para el tutor de voz del módulo Academia
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const { courseId, lessonId, courseTitle, lessonTitle, systemPrompt } = await req.json();

    console.log('[AcademiaVoiceToken] Generating token for course:', courseId);

    // Build custom system prompt for the tutor
    const tutorPrompt = systemPrompt || `Eres un tutor de IA amigable y experto. 
Tu rol es ayudar al estudiante a comprender el contenido del curso "${courseTitle || 'actual'}".
${lessonTitle ? `La lección actual es: "${lessonTitle}".` : ''}

Instrucciones:
- Habla de forma clara, natural y conversacional
- Explica conceptos de forma sencilla con ejemplos prácticos
- Si el estudiante parece confundido, reformula la explicación
- Ofrece preguntas para verificar comprensión
- Mantén respuestas concisas pero completas
- Usa un tono motivador y positivo
- Si detectas frustración, sé más paciente y ofrece apoyo
- Responde en español a menos que el estudiante hable en otro idioma`;

    // Create a signed URL for WebSocket connection
    const response = await fetch(
      'https://api.elevenlabs.io/v1/convai/conversation/get-signed-url',
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_config: {
            agent: {
              prompt: {
                prompt: tutorPrompt,
              },
              first_message: `¡Hola! Soy tu tutor de IA para ${courseTitle || 'este curso'}. ¿En qué puedo ayudarte hoy?`,
              language: 'es',
            },
            tts: {
              voice_id: 'EXAVITQu4vr4xnSDxMaL', // Sarah voice - friendly and clear
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AcademiaVoiceToken] ElevenLabs error:', response.status, errorText);
      
      // Fallback: try to get a conversation token instead
      const tokenResponse = await fetch(
        'https://api.elevenlabs.io/v1/convai/conversation/get-signed-url',
        {
          method: 'GET',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
          },
        }
      );

      if (!tokenResponse.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const tokenData = await tokenResponse.json();
      return new Response(JSON.stringify({
        success: true,
        signed_url: tokenData.signed_url,
        type: 'fallback',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('[AcademiaVoiceToken] Token generated successfully');

    return new Response(JSON.stringify({
      success: true,
      signed_url: data.signed_url,
      type: 'configured',
      metadata: {
        courseId,
        lessonId,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[AcademiaVoiceToken] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
