/**
 * Academia Learning Path - Rutas de aprendizaje adaptativas con IA
 * Genera y ajusta learning paths basados en el progreso y rendimiento del estudiante
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LearningPathRequest {
  action: 'generate' | 'analyze' | 'get_recommendations' | 'update_progress';
  courseId: string;
  lessonId?: string;
  progressData?: {
    timeSpent: number;
    quizScore?: number;
    completed: boolean;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestData: LearningPathRequest = await req.json();
    const { action, courseId, lessonId, progressData } = requestData;

    console.log('[AcademiaLearningPath] Action:', action, 'Course:', courseId);

    switch (action) {
      case 'generate': {
        // Get course structure
        const { data: course } = await supabase
          .from('academia_courses')
          .select('*, modules:academia_modules(*, lessons:academia_lessons(*))')
          .eq('id', courseId)
          .single();

        if (!course) {
          throw new Error('Course not found');
        }

        // Get user's existing progress
        const { data: progress } = await supabase
          .from('academia_lesson_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId);

        // Get quiz attempts
        const { data: quizAttempts } = await supabase
          .from('academia_quiz_attempts')
          .select('*, quiz:academia_quizzes(lesson_id)')
          .eq('user_id', user.id);

        // Calculate performance metrics
        const completedLessons = progress?.filter(p => p.status === 'completed') || [];
        const avgQuizScore = quizAttempts?.length 
          ? quizAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / quizAttempts.length 
          : 0;

        // Build lesson sequence with AI recommendations
        const allLessons = course.modules?.flatMap((m: any) => 
          m.lessons?.map((l: any) => ({
            ...l,
            moduleName: m.title,
            moduleOrder: m.order_index,
          }))
        ) || [];

        const systemPrompt = `Eres un experto en diseño instruccional y aprendizaje adaptativo.
        
Analiza el progreso del estudiante y genera una ruta de aprendizaje optimizada.

Curso: ${course.title}
Lecciones completadas: ${completedLessons.length}/${allLessons.length}
Promedio en quizzes: ${avgQuizScore.toFixed(1)}%

FORMATO DE RESPUESTA (JSON estricto):
{
  "pathType": "standard" | "accelerated" | "remedial" | "custom",
  "sequence": [
    {
      "lessonId": "uuid",
      "priority": 1-10,
      "reason": "Motivo de esta posición",
      "estimatedMinutes": 15,
      "prerequisitesMet": true
    }
  ],
  "recommendations": [
    "Recomendación 1",
    "Recomendación 2"
  ],
  "focusAreas": ["área1", "área2"],
  "estimatedCompletionDays": 7
}`;

        const lessonsData = allLessons.map((l: any) => ({
          id: l.id,
          title: l.title,
          duration: l.duration_minutes,
          module: l.moduleName,
          completed: completedLessons.some(p => p.lesson_id === l.id),
        }));

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
              { role: 'user', content: `Lecciones disponibles: ${JSON.stringify(lessonsData)}` }
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        let pathData;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            pathData = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error('[AcademiaLearningPath] Parse error:', e);
          // Fallback to standard sequence
          pathData = {
            pathType: 'standard',
            sequence: allLessons.map((l: any, i: number) => ({
              lessonId: l.id,
              priority: i + 1,
              reason: 'Secuencia estándar',
              estimatedMinutes: l.duration_minutes || 15,
            })),
            recommendations: ['Sigue el orden sugerido'],
            estimatedCompletionDays: Math.ceil(allLessons.length / 3),
          };
        }

        // Save or update learning path
        const { data: existingPath } = await supabase
          .from('academia_learning_paths')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .single();

        if (existingPath) {
          await supabase
            .from('academia_learning_paths')
            .update({
              path_type: pathData.pathType,
              recommended_sequence: pathData.sequence,
              ai_recommendations: {
                recommendations: pathData.recommendations,
                focusAreas: pathData.focusAreas,
                estimatedCompletionDays: pathData.estimatedCompletionDays,
              },
              performance_metrics: {
                avgQuizScore,
                completedLessons: completedLessons.length,
                totalLessons: allLessons.length,
              },
              last_analyzed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingPath.id);
        } else {
          await supabase
            .from('academia_learning_paths')
            .insert({
              user_id: user.id,
              course_id: courseId,
              path_type: pathData.pathType,
              recommended_sequence: pathData.sequence,
              ai_recommendations: {
                recommendations: pathData.recommendations,
                focusAreas: pathData.focusAreas,
                estimatedCompletionDays: pathData.estimatedCompletionDays,
              },
              performance_metrics: {
                avgQuizScore,
                completedLessons: completedLessons.length,
                totalLessons: allLessons.length,
              },
              last_analyzed_at: new Date().toISOString(),
            });
        }

        return new Response(JSON.stringify({
          success: true,
          data: pathData,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'analyze': {
        // Get user's learning path
        const { data: learningPath } = await supabase
          .from('academia_learning_paths')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .single();

        // Get recent activity
        const { data: recentProgress } = await supabase
          .from('academia_lesson_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .order('updated_at', { ascending: false })
          .limit(10);

        // Get emotional analytics
        const { data: emotionalData } = await supabase
          .from('academia_emotional_analytics')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .order('detected_at', { ascending: false })
          .limit(5);

        const avgFrustration = emotionalData?.reduce((sum, e) => sum + (e.frustration_indicators as any)?.level || 0, 0) / (emotionalData?.length || 1);
        const avgEngagement = emotionalData?.reduce((sum, e) => sum + (e.engagement_level || 0), 0) / (emotionalData?.length || 1);

        return new Response(JSON.stringify({
          success: true,
          data: {
            learningPath,
            recentProgress,
            emotionalInsights: {
              avgFrustration,
              avgEngagement,
              trend: avgFrustration > 0.5 ? 'struggling' : avgEngagement > 0.7 ? 'engaged' : 'neutral',
            },
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_recommendations': {
        const { data: learningPath } = await supabase
          .from('academia_learning_paths')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .single();

        if (!learningPath) {
          return new Response(JSON.stringify({
            success: true,
            data: {
              recommendations: ['Genera tu ruta de aprendizaje personalizada'],
              nextLesson: null,
            },
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const sequence = learningPath.recommended_sequence as any[];
        const currentPos = learningPath.current_position || 0;
        const nextLesson = sequence?.[currentPos];

        return new Response(JSON.stringify({
          success: true,
          data: {
            recommendations: (learningPath.ai_recommendations as any)?.recommendations || [],
            focusAreas: (learningPath.ai_recommendations as any)?.focusAreas || [],
            nextLesson,
            progress: {
              current: currentPos,
              total: sequence?.length || 0,
              percentage: sequence?.length ? (currentPos / sequence.length) * 100 : 0,
            },
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update_progress': {
        if (!lessonId || !progressData) {
          throw new Error('Missing lessonId or progressData');
        }

        // Update learning path position
        const { data: learningPath } = await supabase
          .from('academia_learning_paths')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .single();

        if (learningPath && progressData.completed) {
          const sequence = learningPath.recommended_sequence as any[];
          const lessonIndex = sequence?.findIndex((s: any) => s.lessonId === lessonId);
          
          if (lessonIndex !== undefined && lessonIndex >= 0) {
            await supabase
              .from('academia_learning_paths')
              .update({
                current_position: lessonIndex + 1,
                updated_at: new Date().toISOString(),
              })
              .eq('id', learningPath.id);
          }
        }

        // Award points for lesson completion
        if (progressData.completed) {
          const basePoints = 10;
          const quizBonus = progressData.quizScore ? Math.round(progressData.quizScore / 10) : 0;
          
          await supabase
            .from('academia_point_transactions')
            .insert({
              user_id: user.id,
              points: basePoints + quizBonus,
              transaction_type: 'earned',
              source: 'lesson_complete',
              source_id: lessonId,
              description: `Lección completada${quizBonus > 0 ? ` (+${quizBonus} bonus quiz)` : ''}`,
            });
        }

        return new Response(JSON.stringify({
          success: true,
          data: { updated: true },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('[AcademiaLearningPath] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
