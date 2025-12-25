import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  courseId: string;
  lessonId?: string;
  courseTitle: string;
  lessonTitle?: string;
  conversationHistory?: { role: string; content: string }[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const { 
      message, 
      courseId, 
      lessonId, 
      courseTitle, 
      lessonTitle,
      conversationHistory = [] 
    } = await req.json() as ChatRequest;

    console.log(`[training-course-chat] Processing message for course: ${courseId}`);

    // Try to get relevant course knowledge using RAG (if embeddings exist)
    let ragContext = '';
    let sources: { lessonId?: string; contentType: string; similarity: number }[] = [];
    
    try {
      // Generate embedding for the query
      const embeddingResponse = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: message,
        }),
      });

      if (embeddingResponse.ok) {
        const embeddingData = await embeddingResponse.json();
        const queryEmbedding = embeddingData.data?.[0]?.embedding;

        if (queryEmbedding) {
          // Search for relevant course knowledge
          const { data: knowledgeData } = await supabase.rpc('search_course_knowledge', {
            p_course_id: courseId,
            p_query_embedding: queryEmbedding,
            p_match_threshold: 0.6,
            p_match_count: 3,
          });

          if (knowledgeData && knowledgeData.length > 0) {
            ragContext = knowledgeData.map((k: any) => k.content_chunk || k.content).join('\n\n');
            sources = knowledgeData.map((k: any) => ({
              lessonId: k.lesson_id,
              contentType: k.content_type,
              similarity: k.similarity,
            }));
            console.log(`[training-course-chat] Found ${knowledgeData.length} relevant knowledge chunks`);
          }
        }
      }
    } catch (ragError) {
      console.log('[training-course-chat] RAG search not available, using general context');
    }

    // Build system prompt
    const systemPrompt = `Eres un tutor IA experto y amigable para el curso "${courseTitle}".
${lessonTitle ? `Estás ayudando al estudiante con la lección: "${lessonTitle}".` : ''}

**Tu rol:**
- Responder preguntas sobre el contenido del curso de forma clara y concisa
- Proporcionar ejemplos prácticos cuando sea útil
- Guiar al estudiante sin dar respuestas directas a evaluaciones
- Motivar y mantener un tono positivo y profesional
- Sugerir lecciones relacionadas cuando sea relevante

**Formato de respuestas:**
- Usa markdown para estructurar respuestas largas
- Incluye ejemplos de código cuando sea apropiado
- Mantén respuestas concisas pero completas
- Usa emojis moderadamente para hacer la conversación más amigable

${ragContext ? `**Contexto del curso (información relevante):**
${ragContext}

Usa esta información para responder de forma precisa y específica al contenido del curso.` : ''}

**Restricciones:**
- No inventes información que no esté en el contexto del curso
- Si no sabes algo, sugiere revisar materiales adicionales
- No proporciones respuestas a quizzes o evaluaciones directamente`;

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Last 10 messages for context
      { role: 'user', content: message },
    ];

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
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
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required', 
          message: 'Créditos de IA insuficientes.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('[training-course-chat] AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No response from AI');
    }

    // Save to chat history if user is authenticated
    if (userId) {
      // Save user message
      await supabase.from('training_chat_history').insert({
        user_id: userId,
        course_id: courseId,
        lesson_id: lessonId,
        role: 'user',
        content: message,
      });

      // Save assistant message
      await supabase.from('training_chat_history').insert({
        user_id: userId,
        course_id: courseId,
        lesson_id: lessonId,
        role: 'assistant',
        content: assistantMessage,
        sources: sources,
      });
    }

    console.log(`[training-course-chat] Successfully generated response`);

    return new Response(JSON.stringify({
      success: true,
      message: assistantMessage,
      sources,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[training-course-chat] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
