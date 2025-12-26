import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmotionalAnalysisRequest {
  action: 'analyze_text' | 'analyze_voice' | 'analyze_video' | 'analyze_multimodal' | 'predict_abandonment' | 'get_adaptive_response' | 'get_trends';
  text?: string;
  audioData?: string;
  frameData?: string;
  input?: {
    text?: string;
    audioData?: string;
    videoFrame?: string;
  };
  sessionId?: string;
  config?: Record<string, unknown>;
  currentEmotionalState?: Record<string, unknown>;
  sessionDuration?: number;
  interactionCount?: number;
  emotionalState?: Record<string, unknown>;
  conversationContext?: string;
  customerId?: string;
  timeRange?: 'day' | 'week' | 'month';
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

    const body: EmotionalAnalysisRequest = await req.json();
    const { action } = body;

    console.log(`[emotional-analysis-multimodal] Processing action: ${action}`);

    let result;

    switch (action) {
      case 'analyze_text': {
        const { text } = body;
        
        const textPrompt = `Analiza las emociones en este texto de una conversación de soporte:

TEXTO: "${text}"

Detecta:
1. Sentimiento general
2. Emociones específicas
3. Indicadores de urgencia
4. Palabras clave de frustración
5. Palabras clave de satisfacción

RESPONDE EN JSON:
{
  "sentiment": "positive|negative|neutral",
  "sentimentScore": number,
  "emotions": [{ "emotion": "string", "score": number }],
  "urgencyIndicators": ["string"],
  "frustrationKeywords": ["string"],
  "satisfactionKeywords": ["string"]
}`;

        const textResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Eres un experto en análisis de sentimientos y emociones. Responde en JSON.' },
              { role: 'user', content: textPrompt }
            ],
            temperature: 0.3,
            max_tokens: 1000,
          }),
        });

        const textData = await textResponse.json();
        const textContent = textData.choices?.[0]?.message?.content || '';
        
        let signals;
        try {
          const jsonMatch = textContent.match(/\{[\s\S]*\}/);
          signals = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
          signals = {
            sentiment: 'neutral',
            sentimentScore: 0,
            emotions: [],
            urgencyIndicators: [],
            frustrationKeywords: [],
            satisfactionKeywords: []
          };
        }

        result = { success: true, signals };
        break;
      }

      case 'analyze_voice': {
        // Simulated voice analysis (in production would use audio processing)
        result = {
          success: true,
          signals: {
            pitch: 200 + Math.random() * 100,
            pitchVariation: Math.random() * 50,
            speakingRate: 100 + Math.random() * 80,
            volume: 0.5 + Math.random() * 0.5,
            pauseFrequency: Math.random() * 10,
            emotionalTone: ['calm', 'anxious', 'frustrated', 'happy'][Math.floor(Math.random() * 4)],
            stressLevel: Math.random(),
            confidence: 0.7 + Math.random() * 0.3
          }
        };
        break;
      }

      case 'analyze_video': {
        // Simulated video analysis
        result = {
          success: true,
          signals: {
            facialExpression: ['neutral', 'smiling', 'frowning', 'confused'][Math.floor(Math.random() * 4)],
            eyeContact: Math.random() > 0.3,
            headMovement: ['still', 'nodding', 'shaking', 'tilted'][Math.floor(Math.random() * 4)],
            microExpressions: [],
            engagementLevel: 0.5 + Math.random() * 0.5,
            attentionScore: 0.6 + Math.random() * 0.4,
            confidence: 0.65 + Math.random() * 0.35
          }
        };
        break;
      }

      case 'analyze_multimodal': {
        const { input, sessionId } = body;
        
        let textSignals = null;
        if (input?.text) {
          const textAnalysis = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: 'Analiza emociones en texto. Responde en JSON con: sentiment, sentimentScore, emotions[].' },
                { role: 'user', content: `Analiza: "${input.text}"` }
              ],
              temperature: 0.3,
              max_tokens: 500,
            }),
          });
          
          const textData = await textAnalysis.json();
          try {
            const content = textData.choices?.[0]?.message?.content || '';
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            textSignals = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
          } catch {
            textSignals = { sentiment: 'neutral', sentimentScore: 0, emotions: [] };
          }
        }

        // Combine signals
        const combined = {
          primary: textSignals?.sentiment === 'negative' ? 'frustrated' : 
                   textSignals?.sentiment === 'positive' ? 'satisfied' : 'neutral',
          secondary: null,
          intensity: Math.abs(textSignals?.sentimentScore || 0) / 100,
          confidence: 0.75,
          timestamp: new Date().toISOString()
        };

        // Calculate abandonment risk
        const abandonmentRisk = {
          score: combined.primary === 'frustrated' ? 60 + Math.random() * 30 : 20 + Math.random() * 30,
          level: combined.primary === 'frustrated' ? 'high' : 'medium',
          factors: combined.primary === 'frustrated' 
            ? ['Frustración detectada', 'Múltiples interacciones', 'Tono negativo']
            : ['Sesión prolongada'],
          recommendations: ['Ofrecer escalación', 'Mostrar empatía', 'Proporcionar alternativas'],
          interventionNeeded: combined.primary === 'frustrated'
        };

        // Generate adaptive response
        const adaptiveResponse = {
          tone: combined.primary === 'frustrated' ? 'empathetic' : 'professional',
          pacing: combined.primary === 'frustrated' ? 'slow' : 'normal',
          emphasis: combined.primary === 'frustrated' 
            ? ['comprensión', 'solución', 'prioridad']
            : ['eficiencia', 'claridad'],
          avoidTopics: combined.primary === 'frustrated' ? ['tiempos de espera'] : [],
          suggestedPhrases: combined.primary === 'frustrated'
            ? ['Entiendo su frustración', 'Vamos a resolver esto juntos', 'Es una prioridad para nosotros']
            : ['Permítame ayudarle', 'La solución es...'],
          escalationRecommended: abandonmentRisk.score > 70,
          humanHandoffSuggested: abandonmentRisk.score > 80
        };

        result = {
          success: true,
          signals: {
            text: textSignals,
            voice: null,
            video: null,
            combined
          },
          abandonmentRisk,
          adaptiveResponse,
          timeline: {
            sessionId,
            customerId: 'unknown',
            states: [{ timestamp: new Date().toISOString(), state: combined }],
            overallTrend: 'stable',
            criticalMoments: []
          }
        };
        break;
      }

      case 'predict_abandonment': {
        const { sessionDuration, interactionCount, currentEmotionalState } = body;
        
        // Simple prediction model
        let baseScore = 20;
        
        // Duration factor
        if ((sessionDuration || 0) > 600) baseScore += 15;
        if ((sessionDuration || 0) > 1200) baseScore += 20;
        
        // Interaction factor
        if ((interactionCount || 0) > 5) baseScore += 10;
        if ((interactionCount || 0) > 10) baseScore += 15;
        
        // Emotional factor
        const emotionalPrimary = (currentEmotionalState as any)?.primary;
        if (emotionalPrimary === 'frustrated') baseScore += 25;
        if (emotionalPrimary === 'angry') baseScore += 35;
        if (emotionalPrimary === 'anxious') baseScore += 15;
        
        const score = Math.min(100, baseScore);
        
        result = {
          success: true,
          risk: {
            score,
            level: score > 70 ? 'critical' : score > 50 ? 'high' : score > 30 ? 'medium' : 'low',
            factors: [
              ...(sessionDuration && sessionDuration > 600 ? ['Duración prolongada'] : []),
              ...(interactionCount && interactionCount > 5 ? ['Múltiples interacciones'] : []),
              ...(emotionalPrimary === 'frustrated' ? ['Estado emocional negativo'] : [])
            ],
            timeToAbandon: score > 70 ? 60 : score > 50 ? 180 : undefined,
            recommendations: [
              'Ofrecer escalación',
              'Proporcionar alternativas',
              'Mostrar empatía activa'
            ],
            interventionNeeded: score > 60
          }
        };
        break;
      }

      case 'get_adaptive_response': {
        const { emotionalState, conversationContext } = body;
        
        const adaptivePrompt = `Dado el estado emocional del cliente y el contexto, sugiere cómo adaptar la respuesta:

ESTADO EMOCIONAL: ${JSON.stringify(emotionalState)}
CONTEXTO: ${conversationContext}

RESPONDE EN JSON:
{
  "tone": "empathetic|professional|friendly|urgent|reassuring",
  "pacing": "slow|normal|fast",
  "emphasis": ["string"],
  "avoidTopics": ["string"],
  "suggestedPhrases": ["string"],
  "escalationRecommended": boolean,
  "humanHandoffSuggested": boolean
}`;

        const adaptiveResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Eres un experto en comunicación empática y servicio al cliente. Responde en JSON.' },
              { role: 'user', content: adaptivePrompt }
            ],
            temperature: 0.4,
            max_tokens: 800,
          }),
        });

        const adaptiveData = await adaptiveResp.json();
        const adaptiveContent = adaptiveData.choices?.[0]?.message?.content || '';
        
        let response;
        try {
          const jsonMatch = adaptiveContent.match(/\{[\s\S]*\}/);
          response = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
          response = {
            tone: 'professional',
            pacing: 'normal',
            emphasis: [],
            avoidTopics: [],
            suggestedPhrases: [],
            escalationRecommended: false,
            humanHandoffSuggested: false
          };
        }

        result = { success: true, response };
        break;
      }

      case 'get_trends': {
        const { customerId, timeRange } = body;
        
        // Generate mock trends
        const dataPoints = timeRange === 'day' ? 24 : timeRange === 'week' ? 7 : 30;
        const trends = Array.from({ length: dataPoints }, (_, i) => ({
          timestamp: new Date(Date.now() - i * (timeRange === 'day' ? 3600000 : 86400000)).toISOString(),
          satisfaction: 0.5 + Math.random() * 0.4,
          frustration: Math.random() * 0.3,
          engagement: 0.6 + Math.random() * 0.3
        }));

        result = {
          success: true,
          trends: {
            customerId,
            timeRange,
            dataPoints: trends,
            averageSatisfaction: 0.72,
            frustrationPeaks: 2,
            overallTrend: 'improving'
          }
        };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`[emotional-analysis-multimodal] Action ${action} completed successfully`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[emotional-analysis-multimodal] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
