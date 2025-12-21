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
    const elevenLabsKey = Deno.env.get('ELEVENLABS_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { date, voiceId = 'EXAVITQu4vr4xnSDxMaL' } = await req.json(); // Default: Spanish female voice

    const targetDate = date || new Date().toISOString().split('T')[0];

    // Check if already generated
    const { data: existing } = await supabase
      .from('news_audio_summaries')
      .select('*')
      .eq('date', targetDate)
      .eq('status', 'completed')
      .single();

    if (existing && existing.audio_url) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Audio ya generado para esta fecha',
        summary: existing,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get top news for the date
    const startOfDay = `${targetDate}T00:00:00Z`;
    const endOfDay = `${targetDate}T23:59:59Z`;

    const { data: articles, error: articlesError } = await supabase
      .from('news_articles')
      .select('id, title, ai_summary, category, importance_level, relevance_score')
      .gte('published_at', startOfDay)
      .lte('published_at', endOfDay)
      .order('relevance_score', { ascending: false })
      .limit(5);

    if (articlesError) throw articlesError;

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No hay noticias para esta fecha',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create or update the summary record
    const { data: summaryRecord, error: recordError } = await supabase
      .from('news_audio_summaries')
      .upsert({
        date: targetDate,
        status: 'generating',
        articles_included: articles.map(a => a.id),
        voice_id: voiceId,
      }, {
        onConflict: 'date'
      })
      .select()
      .single();

    if (recordError) throw recordError;

    // Generate script with AI
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const newsContext = articles.map((a, i) => 
      `${i + 1}. [${a.importance_level?.toUpperCase() || 'NORMAL'}] ${a.title}: ${a.ai_summary || ''}`
    ).join('\n');

    const scriptResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Eres un locutor profesional de noticias financieras. Genera un script de audio de aproximadamente 2 minutos (300-400 palabras) que resuma las noticias del día. 
            
El formato debe ser:
1. Saludo breve y fecha
2. Resumen de cada noticia importante (prioriza las críticas)
3. Cierre con perspectiva del día

Usa un tono profesional pero accesible. El texto debe sonar natural al leerlo en voz alta. NO uses asteriscos, guiones ni otros símbolos de formato - solo texto plano. Incluye pausas naturales con puntos y comas.`
          },
          {
            role: 'user',
            content: `Fecha: ${new Date(targetDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\nNoticias:\n${newsContext}`
          }
        ],
      }),
    });

    if (!scriptResponse.ok) {
      throw new Error(`Script generation failed: ${scriptResponse.status}`);
    }

    const scriptData = await scriptResponse.json();
    const script = scriptData.choices?.[0]?.message?.content || '';

    // Update with script
    await supabase
      .from('news_audio_summaries')
      .update({
        script,
        transcript: script, // Same for now
      })
      .eq('id', summaryRecord.id);

    // Generate audio with ElevenLabs if available
    let audioUrl = null;
    let durationSeconds = null;

    if (elevenLabsKey) {
      try {
        const audioResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': elevenLabsKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: script,
              model_id: 'eleven_multilingual_v2',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
              },
            }),
          }
        );

        if (audioResponse.ok) {
          const audioBuffer = await audioResponse.arrayBuffer();
          const audioBytes = new Uint8Array(audioBuffer);

          // Upload to Supabase Storage
          const fileName = `news-summary-${targetDate}.mp3`;
          const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('news-audio')
            .upload(fileName, audioBytes, {
              contentType: 'audio/mpeg',
              upsert: true,
            });

          if (!uploadError) {
            const { data: publicUrl } = supabase
              .storage
              .from('news-audio')
              .getPublicUrl(fileName);
            
            audioUrl = publicUrl.publicUrl;
            // Estimate duration (roughly 150 words per minute)
            const wordCount = script.split(/\s+/).length;
            durationSeconds = Math.round((wordCount / 150) * 60);
          }
        }
      } catch (error) {
        console.error('ElevenLabs error:', error);
        // Continue without audio - script is still available
      }
    }

    // Update final status
    await supabase
      .from('news_audio_summaries')
      .update({
        status: audioUrl ? 'completed' : 'completed', // Script ready even without audio
        audio_url: audioUrl,
        duration_seconds: durationSeconds,
        generated_at: new Date().toISOString(),
      })
      .eq('id', summaryRecord.id);

    return new Response(JSON.stringify({
      success: true,
      summary: {
        id: summaryRecord.id,
        date: targetDate,
        script,
        audioUrl,
        durationSeconds,
        articlesCount: articles.length,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-news-audio:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
