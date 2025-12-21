import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  sentiment_score: number; // -1 to 1
  confidence: number;
  key_phrases: string[];
  emotions: {
    joy?: number;
    trust?: number;
    fear?: number;
    surprise?: number;
    sadness?: number;
    disgust?: number;
    anger?: number;
    anticipation?: number;
  };
  topics: string[];
  action_required: boolean;
  summary?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      content, 
      company_id, 
      source_type, 
      source_id,
      gestor_id,
      save_result = true 
    } = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get company context if available
    let companyContext = '';
    if (company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('name, sector, segment')
        .eq('id', company_id)
        .single();
      
      if (company) {
        companyContext = `\nContexto: Cliente "${company.name}", sector: ${company.sector || 'No especificado'}, segmento: ${company.segment || 'No especificado'}.`;
      }
    }

    const systemPrompt = `Eres un experto en análisis de sentimiento y emociones para Customer Success en el contexto bancario/financiero B2B.

Tu tarea es analizar el texto proporcionado y devolver un JSON con:
1. sentiment: "positive", "neutral", "negative" o "mixed"
2. sentiment_score: número entre -1 (muy negativo) y 1 (muy positivo)
3. confidence: confianza del análisis (0-1)
4. key_phrases: array de frases clave que indican el sentimiento
5. emotions: objeto con emociones detectadas (joy, trust, fear, surprise, sadness, disgust, anger, anticipation) con valores 0-1
6. topics: temas principales mencionados
7. action_required: boolean indicando si se requiere acción urgente (quejas, amenazas de abandono, insatisfacción grave)
8. summary: resumen de 1-2 frases del contenido

Considera:
- Señales de churn: menciones de competencia, quejas recurrentes, frustración
- Señales positivas: agradecimientos, satisfacción, intención de renovar/ampliar
- Urgencia: problemas críticos, deadlines, presión

IMPORTANTE: Responde SOLO con el JSON válido, sin explicaciones adicionales.`;

    const userPrompt = `Analiza el siguiente texto:${companyContext}

"${content}"`;

    // Call AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || '{}';
    
    // Parse JSON response
    let result: SentimentResult;
    try {
      const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Default fallback
      result = {
        sentiment: 'neutral',
        sentiment_score: 0,
        confidence: 0.5,
        key_phrases: [],
        emotions: {},
        topics: [],
        action_required: false,
        summary: 'No se pudo analizar el contenido.'
      };
    }

    // Save to database if requested
    if (save_result && company_id) {
      const { error: insertError } = await supabase
        .from('sentiment_analysis')
        .insert({
          company_id,
          source_type: source_type || 'unknown',
          source_id,
          content_analyzed: content.substring(0, 5000), // Limit content size
          sentiment: result.sentiment,
          sentiment_score: result.sentiment_score,
          confidence: result.confidence,
          key_phrases: result.key_phrases,
          emotions: result.emotions,
          topics: result.topics,
          action_required: result.action_required,
          gestor_id
        });

      if (insertError) {
        console.error('Error saving sentiment analysis:', insertError);
      }

      // Create alert if action required
      if (result.action_required) {
        // Check for matching alert configuration
        const { data: alerts } = await supabase
          .from('satisfaction_alerts')
          .select('*')
          .eq('alert_type', 'negative_sentiment')
          .eq('is_active', true);

        for (const alert of alerts || []) {
          if (result.sentiment_score <= (alert.threshold_value || -0.5)) {
            // Create alert history
            await supabase
              .from('satisfaction_alert_history')
              .insert({
                alert_id: alert.id,
                company_id,
                trigger_value: result.sentiment_score,
                trigger_context: {
                  source_type,
                  source_id,
                  summary: result.summary,
                  key_phrases: result.key_phrases
                },
                notified_users: gestor_id ? [gestor_id] : []
              });

            // Create AI task if configured
            if (alert.auto_create_task) {
              await supabase
                .from('ai_task_queue')
                .insert({
                  task_type: 'retention',
                  task_title: `Sentimiento negativo detectado`,
                  task_description: `Se ha detectado sentimiento negativo en interacción con el cliente. ${result.summary}`,
                  ai_reasoning: `Score: ${result.sentiment_score}, Frases clave: ${result.key_phrases.join(', ')}`,
                  target_entity_type: 'company',
                  target_entity_id: company_id,
                  target_gestor_id: gestor_id,
                  priority: result.sentiment_score <= -0.7 ? 10 : 7,
                  suggested_action: 'Contactar al cliente para resolver preocupaciones y mejorar satisfacción',
                  status: 'pending'
                });
            }
          }
        }
      }
    }

    // Analyze feedback from survey response if provided
    if (source_type === 'survey_response' && source_id) {
      await supabase
        .from('survey_responses')
        .update({
          sentiment: result.sentiment,
          sentiment_score: result.sentiment_score
        })
        .eq('id', source_id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        saved: save_result && !!company_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in analyze-sentiment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
