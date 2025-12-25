/**
 * Academia Adaptive Quiz - Quiz inteligente con IA
 * Genera y evalúa quizzes adaptativos basados en el rendimiento del estudiante
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuizRequest {
  action: 'generate_questions' | 'evaluate_answer' | 'get_next_question' | 'complete_quiz';
  quizId?: string;
  lessonId?: string;
  courseId?: string;
  attemptId?: string;
  questionId?: string;
  answer?: string;
  difficulty?: number;
  previousPerformance?: {
    correctCount: number;
    totalCount: number;
    averageDifficulty: number;
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

    const requestData: QuizRequest = await req.json();
    const { action, quizId, lessonId, courseId, attemptId, questionId, answer, difficulty, previousPerformance } = requestData;

    console.log('[AcademiaAdaptiveQuiz] Action:', action, 'User:', user.id);

    switch (action) {
      case 'generate_questions': {
        // Get lesson content for context
        let lessonContent = '';
        let courseTitle = '';
        
        if (lessonId) {
          const { data: lesson } = await supabase
            .from('academia_lessons')
            .select('title, content, course_id')
            .eq('id', lessonId)
            .single();
          
          if (lesson) {
            lessonContent = lesson.content || lesson.title;
            
            const { data: course } = await supabase
              .from('academia_courses')
              .select('title')
              .eq('id', lesson.course_id)
              .single();
            
            courseTitle = course?.title || '';
          }
        }

        // Determine difficulty based on previous performance
        let targetDifficulty = difficulty || 2;
        if (previousPerformance) {
          const successRate = previousPerformance.correctCount / previousPerformance.totalCount;
          if (successRate > 0.8) {
            targetDifficulty = Math.min(5, previousPerformance.averageDifficulty + 1);
          } else if (successRate < 0.5) {
            targetDifficulty = Math.max(1, previousPerformance.averageDifficulty - 1);
          }
        }

        const systemPrompt = `Eres un experto en evaluación educativa. Genera preguntas de quiz adaptativas.
        
Curso: ${courseTitle}
Contenido de la lección: ${lessonContent.substring(0, 2000)}
Nivel de dificultad objetivo: ${targetDifficulty}/5

Genera exactamente 5 preguntas de opción múltiple en formato JSON.

FORMATO DE RESPUESTA (JSON estricto):
{
  "questions": [
    {
      "question_text": "Pregunta clara y concisa",
      "question_type": "multiple_choice",
      "difficulty_level": 1-5,
      "options": [
        {"text": "Opción A", "isCorrect": false, "feedback": "Feedback si elige esta opción"},
        {"text": "Opción B", "isCorrect": true, "feedback": "¡Correcto! Explicación"},
        {"text": "Opción C", "isCorrect": false, "feedback": "Feedback"},
        {"text": "Opción D", "isCorrect": false, "feedback": "Feedback"}
      ],
      "explanation": "Explicación detallada de la respuesta correcta",
      "hint": "Pista sutil para ayudar"
    }
  ]
}`;

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
              { role: 'user', content: `Genera 5 preguntas de dificultad ${targetDifficulty}/5 sobre: ${lessonContent.substring(0, 1000)}` }
            ],
            temperature: 0.7,
            max_tokens: 3000,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        let questions;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            questions = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error('[AcademiaAdaptiveQuiz] Parse error:', e);
          questions = { questions: [] };
        }

        return new Response(JSON.stringify({
          success: true,
          data: questions,
          targetDifficulty,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'evaluate_answer': {
        // Get question details
        const { data: question } = await supabase
          .from('academia_quiz_questions')
          .select('*')
          .eq('id', questionId)
          .single();

        if (!question) {
          throw new Error('Question not found');
        }

        const options = question.options as any[];
        const correctOption = options?.find(o => o.isCorrect);
        const selectedOption = options?.find(o => o.text === answer);
        const isCorrect = selectedOption?.isCorrect || false;

        // Calculate points based on difficulty
        const earnedPoints = isCorrect ? question.points * question.difficulty_level : 0;

        return new Response(JSON.stringify({
          success: true,
          data: {
            isCorrect,
            earnedPoints,
            correctAnswer: correctOption?.text,
            feedback: selectedOption?.feedback || (isCorrect ? '¡Correcto!' : 'Incorrecto'),
            explanation: question.explanation,
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_next_question': {
        // Get quiz attempt and determine next question based on adaptive algorithm
        const { data: attempt } = await supabase
          .from('academia_quiz_attempts')
          .select('*, quiz:academia_quizzes(*)')
          .eq('id', attemptId)
          .single();

        if (!attempt) {
          throw new Error('Attempt not found');
        }

        const answeredIds = (attempt.answers as any[])?.map(a => a.questionId) || [];
        
        // Get unanswered questions
        const { data: questions } = await supabase
          .from('academia_quiz_questions')
          .select('*')
          .eq('quiz_id', attempt.quiz_id)
          .order('order_index');

        const unanswered = questions?.filter(q => !answeredIds.includes(q.id)) || [];

        if (unanswered.length === 0) {
          return new Response(JSON.stringify({
            success: true,
            data: { completed: true },
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Adaptive selection: choose question based on performance
        const adaptiveData = attempt.adaptive_data as any || { avgDifficulty: 2, successRate: 0.5 };
        let targetDiff = Math.round(adaptiveData.avgDifficulty);
        
        // Find best matching question
        let nextQuestion = unanswered.find(q => q.difficulty_level === targetDiff) 
          || unanswered[0];

        return new Response(JSON.stringify({
          success: true,
          data: {
            question: nextQuestion,
            progress: {
              answered: answeredIds.length,
              total: questions?.length || 0,
            },
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'complete_quiz': {
        const { data: attempt } = await supabase
          .from('academia_quiz_attempts')
          .select('*')
          .eq('id', attemptId)
          .single();

        if (!attempt) {
          throw new Error('Attempt not found');
        }

        const answers = (attempt.answers as any[]) || [];
        const correctCount = answers.filter(a => a.isCorrect).length;
        const totalPoints = answers.reduce((sum, a) => sum + (a.points || 0), 0);
        const percentage = (correctCount / answers.length) * 100;

        // Get quiz passing score
        const { data: quiz } = await supabase
          .from('academia_quizzes')
          .select('passing_score')
          .eq('id', attempt.quiz_id)
          .single();

        const passed = percentage >= (quiz?.passing_score || 70);
        const timeSpent = Math.round((Date.now() - new Date(attempt.started_at).getTime()) / 1000);

        // Update attempt
        await supabase
          .from('academia_quiz_attempts')
          .update({
            completed_at: new Date().toISOString(),
            score: correctCount,
            total_points: totalPoints,
            percentage,
            passed,
            time_spent_seconds: timeSpent,
          })
          .eq('id', attemptId);

        // Award points if passed
        if (passed) {
          const bonusPoints = Math.round(totalPoints * (percentage / 100));
          await supabase
            .from('academia_point_transactions')
            .insert({
              user_id: user.id,
              points: bonusPoints,
              transaction_type: 'earned',
              source: 'quiz_completion',
              source_id: attempt.quiz_id,
              description: `Quiz completado con ${percentage.toFixed(0)}%`,
            });
        }

        return new Response(JSON.stringify({
          success: true,
          data: {
            score: correctCount,
            total: answers.length,
            percentage,
            passed,
            totalPoints,
            timeSpent,
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('[AcademiaAdaptiveQuiz] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
