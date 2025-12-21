import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { message, conversationId } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const { data: newConv, error: convError } = await supabase
        .from('news_chat_conversations')
        .insert({
          user_id: user.id,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        })
        .select()
        .single();

      if (convError) throw convError;
      convId = newConv.id;
    }

    // Save user message
    await supabase
      .from('news_chat_messages')
      .insert({
        conversation_id: convId,
        role: 'user',
        content: message,
      });

    // Search for relevant news articles
    const searchTerms = message.toLowerCase().split(' ').filter((t: string) => t.length > 3);
    
    const { data: articles, error: articlesError } = await supabase
      .from('news_articles')
      .select('id, title, ai_summary, category, published_at, source_name, relevance_score, importance_level')
      .or(searchTerms.map((t: string) => `title.ilike.%${t}%,ai_summary.ilike.%${t}%`).join(','))
      .order('published_at', { ascending: false })
      .limit(10);

    if (articlesError) {
      console.error('Error fetching articles:', articlesError);
    }

    // If no search results, get recent critical/high importance articles
    let contextArticles = articles || [];
    if (contextArticles.length === 0) {
      const { data: recentArticles } = await supabase
        .from('news_articles')
        .select('id, title, ai_summary, category, published_at, source_name, relevance_score, importance_level')
        .in('importance_level', ['critical', 'high'])
        .order('published_at', { ascending: false })
        .limit(5);
      
      contextArticles = recentArticles || [];
    }

    // Build context from articles
    const articlesContext = contextArticles.map((a: any, i: number) => 
      `[${i + 1}] "${a.title}" (${a.source_name}, ${new Date(a.published_at).toLocaleDateString('es-ES')}): ${a.ai_summary || 'Sin resumen disponible'}`
    ).join('\n\n');

    const systemPrompt = `Eres ObelixIA News Assistant, un asistente experto en noticias del sector financiero y bancario español. Tu rol es ayudar a los usuarios a entender las noticias y su impacto en el sector.

CONTEXTO DE NOTICIAS RECIENTES:
${articlesContext || 'No hay noticias relevantes en la base de datos para esta consulta.'}

INSTRUCCIONES:
1. Responde siempre en español de forma profesional pero accesible
2. Cuando cites una noticia, usa el formato [N] donde N es el número de la noticia
3. Si la pregunta no está relacionada con noticias o finanzas, indica amablemente que tu especialidad es el análisis de noticias del sector
4. Proporciona análisis útiles sobre el impacto de las noticias en el sector bancario español
5. Si no tienes información suficiente, indícalo honestamente
6. Mantén respuestas concisas pero informativas (máximo 3-4 párrafos)`;

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Límite de solicitudes alcanzado. Por favor, intenta de nuevo en unos momentos.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Créditos de IA agotados. Contacte con el administrador.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const assistantMessage = aiResponse.choices?.[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';

    // Extract sources from context
    const sources = contextArticles.map((a: any) => ({
      id: a.id,
      title: a.title,
      source: a.source_name,
      date: a.published_at,
      relevance: a.relevance_score,
    }));

    // Save assistant message
    const { data: savedMessage, error: saveError } = await supabase
      .from('news_chat_messages')
      .insert({
        conversation_id: convId,
        role: 'assistant',
        content: assistantMessage,
        sources: sources,
        metadata: { model: 'gemini-2.5-flash', articlesUsed: contextArticles.length },
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving message:', saveError);
    }

    // Update conversation last_message_at
    await supabase
      .from('news_chat_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', convId);

    return new Response(JSON.stringify({
      success: true,
      conversationId: convId,
      message: {
        id: savedMessage?.id,
        role: 'assistant',
        content: assistantMessage,
        sources: sources,
        created_at: savedMessage?.created_at || new Date().toISOString(),
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in news-ai-chat:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
