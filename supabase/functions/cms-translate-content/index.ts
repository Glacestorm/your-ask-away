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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { text, sourceLocale, targetLocale, contentType } = await req.json();

    if (!text || !targetLocale) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const languageNames: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      ca: 'Catalan',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese'
    };

    const sourceLang = languageNames[sourceLocale] || sourceLocale;
    const targetLang = languageNames[targetLocale] || targetLocale;

    const prompt = `Translate the following ${contentType || 'text'} from ${sourceLang} to ${targetLang}. 
Maintain the original formatting, tone, and style. 
If there are technical terms or proper nouns, keep them as is unless there's a well-known translation.
Only return the translated text, nothing else.

Text to translate:
${text}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a professional translator. Provide accurate, natural-sounding translations while preserving the original meaning and tone.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI translation error:', errorText);
      throw new Error('Translation service unavailable');
    }

    const data = await response.json();
    const translatedText = data.choices[0].message.content.trim();

    console.log(`Translated content from ${sourceLocale} to ${targetLocale}`);

    return new Response(JSON.stringify({ 
      success: true, 
      translatedText,
      sourceLocale,
      targetLocale
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error translating content:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
