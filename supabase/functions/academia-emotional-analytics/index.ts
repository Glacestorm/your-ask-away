/**
 * Academia Emotional Analytics - Análisis emocional del estudiante
 * Detecta frustración, confusión y nivel de engagement basado en patrones de interacción
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InteractionPattern {
  type: 'pause' | 'rewind' | 'skip' | 'question' | 'error' | 'success' | 'idle' | 'fast_forward';
  timestamp: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

interface EmotionalAnalysisRequest {
  action: 'analyze' | 'record' | 'get_summary';
  courseId: string;
  lessonId?: string;
  sessionId: string;
  patterns?: InteractionPattern[];
  currentVideoTime?: number;
  totalVideoTime?: number;
  quizAttempts?: number;
  incorrectAnswers?: number;
  timeOnPage?: number;
  scrollBehavior?: {
    totalScrolls: number;
    backScrolls: number;
    rapidScrolls: number;
  };
}

// Analyze patterns to detect emotional state
function analyzeEmotionalState(patterns: InteractionPattern[]): {
  state: string;
  confidence: number;
  frustrationLevel: number;
  engagementLevel: number;
  indicators: Record<string, unknown>;
} {
  const recentPatterns = patterns.slice(-20);
  
  // Count pattern types
  const counts = {
    pause: 0,
    rewind: 0,
    skip: 0,
    error: 0,
    success: 0,
    idle: 0,
    question: 0,
    fast_forward: 0,
  };

  let totalIdleTime = 0;
  let rewindCount = 0;

  for (const pattern of recentPatterns) {
    if (pattern.type in counts) {
      counts[pattern.type as keyof typeof counts]++;
    }
    if (pattern.type === 'idle' && pattern.duration) {
      totalIdleTime += pattern.duration;
    }
    if (pattern.type === 'rewind') {
      rewindCount++;
    }
  }

  // Calculate frustration indicators
  const errorRate = counts.error / Math.max(counts.error + counts.success, 1);
  const rewindRate = rewindCount / Math.max(recentPatterns.length, 1);
  const pauseRate = counts.pause / Math.max(recentPatterns.length, 1);
  
  // Frustration is high when: many errors, many rewinds, long pauses
  const frustrationLevel = Math.min(1, (
    (errorRate * 0.4) + 
    (rewindRate * 0.3) + 
    (pauseRate * 0.2) +
    (counts.idle > 3 ? 0.1 : 0)
  ));

  // Engagement is high when: questions asked, consistent progress, low skips
  const skipRate = counts.skip / Math.max(recentPatterns.length, 1);
  const questionRate = counts.question / Math.max(recentPatterns.length, 1);
  const progressRate = counts.success / Math.max(recentPatterns.length, 1);
  
  const engagementLevel = Math.min(1, Math.max(0, (
    (1 - skipRate) * 0.3 +
    (questionRate * 0.3) +
    (progressRate * 0.3) +
    (1 - (totalIdleTime > 60000 ? 0.1 : 0))
  )));

  // Determine emotional state
  let state = 'neutral';
  let confidence = 0.5;

  if (frustrationLevel > 0.7) {
    state = 'frustrated';
    confidence = frustrationLevel;
  } else if (frustrationLevel > 0.4 && rewindCount > 3) {
    state = 'confused';
    confidence = 0.6 + (rewindRate * 0.3);
  } else if (engagementLevel < 0.3) {
    state = 'disengaged';
    confidence = 1 - engagementLevel;
  } else if (engagementLevel > 0.7 && frustrationLevel < 0.3) {
    state = 'engaged';
    confidence = engagementLevel;
  } else if (counts.success > counts.error && engagementLevel > 0.5) {
    state = 'confident';
    confidence = 0.5 + (progressRate * 0.3);
  }

  return {
    state,
    confidence: Math.round(confidence * 100) / 100,
    frustrationLevel: Math.round(frustrationLevel * 100) / 100,
    engagementLevel: Math.round(engagementLevel * 100) / 100,
    indicators: {
      errorRate: Math.round(errorRate * 100) / 100,
      rewindRate: Math.round(rewindRate * 100) / 100,
      skipRate: Math.round(skipRate * 100) / 100,
      totalIdleTime,
      patternCounts: counts,
    },
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const requestData: EmotionalAnalysisRequest = await req.json();
    const { action, courseId, lessonId, sessionId, patterns } = requestData;

    console.log('[EmotionalAnalytics] Action:', action, 'Session:', sessionId);

    if (action === 'analyze' && patterns) {
      // Analyze emotional state from patterns
      const analysis = analyzeEmotionalState(patterns);

      // Store the analysis
      const { error: insertError } = await supabase
        .from('academia_emotional_analytics')
        .insert({
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId || null,
          session_id: sessionId,
          emotional_state: analysis.state,
          confidence_score: analysis.confidence,
          engagement_level: analysis.engagementLevel,
          frustration_indicators: analysis.indicators,
          attention_metrics: {
            rewindCount: analysis.indicators.patternCounts,
          },
          interaction_patterns: patterns.slice(-10),
        });

      if (insertError) {
        console.error('[EmotionalAnalytics] Insert error:', insertError);
      }

      return new Response(JSON.stringify({
        success: true,
        analysis,
        recommendations: getRecommendations(analysis),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'record' && patterns) {
      // Just record patterns without full analysis
      const lastPattern = patterns[patterns.length - 1];
      
      return new Response(JSON.stringify({
        success: true,
        recorded: true,
        patternType: lastPattern?.type,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'get_summary') {
      // Get emotional summary for session
      const { data: analytics, error: fetchError } = await supabase
        .from('academia_emotional_analytics')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .order('detected_at', { ascending: false })
        .limit(10);

      if (fetchError) {
        throw fetchError;
      }

      // Calculate averages
      const summary = {
        totalEntries: analytics?.length || 0,
        averageFrustration: 0,
        averageEngagement: 0,
        dominantState: 'neutral',
        stateHistory: [] as string[],
      };

      if (analytics && analytics.length > 0) {
        const frustrationSum = analytics.reduce((sum, a) => sum + (Number(a.frustration_indicators?.frustrationLevel) || 0), 0);
        const engagementSum = analytics.reduce((sum, a) => sum + (Number(a.engagement_level) || 0), 0);
        
        summary.averageFrustration = Math.round((frustrationSum / analytics.length) * 100) / 100;
        summary.averageEngagement = Math.round((engagementSum / analytics.length) * 100) / 100;
        summary.stateHistory = analytics.map(a => a.emotional_state);
        
        // Find dominant state
        const stateCounts: Record<string, number> = {};
        for (const a of analytics) {
          stateCounts[a.emotional_state] = (stateCounts[a.emotional_state] || 0) + 1;
        }
        summary.dominantState = Object.entries(stateCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';
      }

      return new Response(JSON.stringify({
        success: true,
        summary,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('[EmotionalAnalytics] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Generate recommendations based on emotional state
function getRecommendations(analysis: ReturnType<typeof analyzeEmotionalState>): string[] {
  const recommendations: string[] = [];

  if (analysis.state === 'frustrated') {
    recommendations.push('Considera tomar un breve descanso');
    recommendations.push('Prueba revisar el material anterior');
    recommendations.push('Usa el tutor de voz para explicaciones más detalladas');
  } else if (analysis.state === 'confused') {
    recommendations.push('Rebobina el video a la sección anterior');
    recommendations.push('Pregunta al tutor IA sobre conceptos específicos');
    recommendations.push('Revisa los recursos complementarios');
  } else if (analysis.state === 'disengaged') {
    recommendations.push('Intenta el modo interactivo con quizzes');
    recommendations.push('Establece metas pequeñas para esta sesión');
    recommendations.push('Prueba el reto semanal para mayor motivación');
  } else if (analysis.state === 'engaged' || analysis.state === 'confident') {
    recommendations.push('¡Excelente progreso! Continúa así');
    recommendations.push('Considera ayudar a otros en la comunidad');
  }

  return recommendations;
}
