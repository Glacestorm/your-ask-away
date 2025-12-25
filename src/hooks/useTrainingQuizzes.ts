/**
 * useTrainingQuizzes - Hook para gestionar quizzes de cursos
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  points?: number;
}

export interface Quiz {
  id: string;
  course_id: string | null;
  module_id: string | null;
  content_id: string | null;
  quiz_key: string;
  title: Record<string, string>;
  description: Record<string, string> | null;
  questions: QuizQuestion[];
  passing_score: number;
  time_limit_minutes: number | null;
  max_attempts: number;
  is_required_for_certificate: boolean;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_correct_answers: boolean;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  enrollment_id: string | null;
  attempt_number: number;
  answers: Array<{ questionId: string; selectedIndex: number }>;
  score: number;
  passed: boolean;
  time_spent_seconds: number | null;
  started_at: string;
  completed_at: string | null;
}

export function useTrainingQuizzes() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch quiz by ID
  const fetchQuiz = useCallback(async (quizId: string): Promise<Quiz | null> => {
    try {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('training_quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (fetchError) throw fetchError;

      return {
        id: data.id,
        course_id: data.course_id,
        module_id: data.module_id,
        content_id: data.content_id,
        quiz_key: data.quiz_key,
        title: (data.title as Record<string, string>) || { es: 'Quiz' },
        description: data.description as Record<string, string> | null,
        questions: (data.questions as unknown as QuizQuestion[]) || [],
        passing_score: data.passing_score || 70,
        time_limit_minutes: data.time_limit_minutes,
        max_attempts: data.max_attempts || 3,
        is_required_for_certificate: data.is_required_for_certificate || false,
        shuffle_questions: data.shuffle_questions ?? true,
        shuffle_options: data.shuffle_options ?? true,
        show_correct_answers: data.show_correct_answers ?? true,
      };
    } catch (err) {
      console.error('[useTrainingQuizzes] fetchQuiz error:', err);
      setError('Error loading quiz');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch quizzes for a course
  const fetchCourseQuizzes = useCallback(async (courseId: string): Promise<Quiz[]> => {
    try {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('training_quizzes')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      return (data || []).map((q: Record<string, unknown>) => ({
        id: q.id as string,
        course_id: q.course_id as string | null,
        module_id: q.module_id as string | null,
        content_id: q.content_id as string | null,
        quiz_key: q.quiz_key as string,
        title: (q.title as Record<string, string>) || { es: 'Quiz' },
        description: q.description as Record<string, string> | null,
        questions: (q.questions || []) as QuizQuestion[],
        passing_score: (q.passing_score as number) || 70,
        time_limit_minutes: q.time_limit_minutes as number | null,
        max_attempts: (q.max_attempts as number) || 3,
        is_required_for_certificate: (q.is_required_for_certificate as boolean) || false,
        shuffle_questions: (q.shuffle_questions as boolean) ?? true,
        shuffle_options: (q.shuffle_options as boolean) ?? true,
        show_correct_answers: (q.show_correct_answers as boolean) ?? true,
      }));
    } catch (err) {
      console.error('[useTrainingQuizzes] fetchCourseQuizzes error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user attempts for a quiz
  const fetchMyAttempts = useCallback(async (quizId: string): Promise<QuizAttempt[]> => {
    if (!user?.id) return [];

    try {
      const { data, error: fetchError } = await supabase
        .from('training_quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .order('attempt_number', { ascending: false });

      if (fetchError) throw fetchError;

      return (data || []).map((a: Record<string, unknown>) => ({
        id: a.id as string,
        quiz_id: a.quiz_id as string,
        user_id: a.user_id as string,
        enrollment_id: a.enrollment_id as string | null,
        attempt_number: a.attempt_number as number,
        answers: (a.answers || []) as Array<{ questionId: string; selectedIndex: number }>,
        score: a.score as number,
        passed: a.passed as boolean,
        time_spent_seconds: a.time_spent_seconds as number | null,
        started_at: a.started_at as string,
        completed_at: a.completed_at as string | null,
      }));
    } catch (err) {
      console.error('[useTrainingQuizzes] fetchMyAttempts error:', err);
      return [];
    }
  }, [user?.id]);

  // Start a quiz attempt
  const startAttempt = useCallback(async (quizId: string, enrollmentId?: string): Promise<QuizAttempt | null> => {
    if (!user?.id) return null;

    try {
      // Get previous attempt count
      const { data: prevAttempts } = await supabase
        .from('training_quiz_attempts')
        .select('attempt_number')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .order('attempt_number', { ascending: false })
        .limit(1);

      const attemptNumber = prevAttempts && prevAttempts.length > 0 
        ? (prevAttempts[0].attempt_number as number) + 1 
        : 1;

      const { data, error: insertError } = await supabase
        .from('training_quiz_attempts')
        .insert({
          quiz_id: quizId,
          user_id: user.id,
          enrollment_id: enrollmentId || null,
          attempt_number: attemptNumber,
          answers: [],
          score: 0,
          passed: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return {
        id: data.id,
        quiz_id: data.quiz_id,
        user_id: data.user_id,
        enrollment_id: data.enrollment_id,
        attempt_number: data.attempt_number,
        answers: [],
        score: 0,
        passed: false,
        time_spent_seconds: null,
        started_at: data.started_at,
        completed_at: null,
      };
    } catch (err) {
      console.error('[useTrainingQuizzes] startAttempt error:', err);
      toast.error('Error al iniciar el quiz');
      return null;
    }
  }, [user?.id]);

  // Complete a quiz attempt
  const completeAttempt = useCallback(async (
    attemptId: string,
    answers: Array<{ questionId: string; selectedIndex: number }>,
    quiz: Quiz,
    timeSpentSeconds: number
  ): Promise<{ score: number; passed: boolean } | null> => {
    if (!user?.id) return null;

    try {
      // Calculate score
      let correctCount = 0;
      for (const answer of answers) {
        const question = quiz.questions.find(q => q.id === answer.questionId);
        if (question && question.correctIndex === answer.selectedIndex) {
          correctCount++;
        }
      }

      const score = Math.round((correctCount / quiz.questions.length) * 100);
      const passed = score >= quiz.passing_score;

      const { error: updateError } = await supabase
        .from('training_quiz_attempts')
        .update({
          answers,
          score,
          passed,
          time_spent_seconds: timeSpentSeconds,
          completed_at: new Date().toISOString(),
        })
        .eq('id', attemptId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      if (passed) {
        toast.success(`🎉 ¡Aprobado! ${score}%`);
        
        // Update leaderboard
        await supabase.rpc('update_leaderboard_counters', {
          p_user_id: user.id,
          p_counter: 'quizzes_passed',
          p_increment: 1,
        });
      } else {
        toast.info(`Resultado: ${score}% - Necesitas ${quiz.passing_score}% para aprobar`);
      }

      return { score, passed };
    } catch (err) {
      console.error('[useTrainingQuizzes] completeAttempt error:', err);
      toast.error('Error al guardar resultados');
      return null;
    }
  }, [user?.id]);

  // Check if user can take quiz (has attempts remaining)
  const canTakeQuiz = useCallback(async (quizId: string, maxAttempts: number): Promise<{ canTake: boolean; attemptsUsed: number; bestScore: number }> => {
    if (!user?.id) return { canTake: false, attemptsUsed: 0, bestScore: 0 };

    try {
      const { data: attempts } = await supabase
        .from('training_quiz_attempts')
        .select('score, passed')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id);

      const attemptsUsed = attempts?.length || 0;
      const bestScore = attempts && attempts.length > 0
        ? Math.max(...attempts.map(a => (a.score as number) || 0))
        : 0;
      const hasPassed = attempts?.some(a => a.passed);

      return {
        canTake: !hasPassed && attemptsUsed < maxAttempts,
        attemptsUsed,
        bestScore,
      };
    } catch (err) {
      console.error('[useTrainingQuizzes] canTakeQuiz error:', err);
      return { canTake: false, attemptsUsed: 0, bestScore: 0 };
    }
  }, [user?.id]);

  // Shuffle array helper
  const shuffleArray = useCallback(<T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Prepare quiz for taking (shuffle if needed)
  const prepareQuizForTaking = useCallback((quiz: Quiz): Quiz => {
    let questions = [...quiz.questions];

    if (quiz.shuffle_questions) {
      questions = shuffleArray(questions);
    }

    if (quiz.shuffle_options) {
      questions = questions.map(q => {
        const optionsWithIndex = q.options.map((opt, idx) => ({ opt, isCorrect: idx === q.correctIndex }));
        const shuffledOptions = shuffleArray(optionsWithIndex);
        const newCorrectIndex = shuffledOptions.findIndex(o => o.isCorrect);
        
        return {
          ...q,
          options: shuffledOptions.map(o => o.opt),
          correctIndex: newCorrectIndex,
        };
      });
    }

    return { ...quiz, questions };
  }, [shuffleArray]);

  return {
    // State
    loading,
    error,
    // Actions
    fetchQuiz,
    fetchCourseQuizzes,
    fetchMyAttempts,
    startAttempt,
    completeAttempt,
    canTakeQuiz,
    // Helpers
    prepareQuizForTaking,
    shuffleArray,
  };
}

export default useTrainingQuizzes;
