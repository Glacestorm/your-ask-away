/**
 * useAdaptiveQuiz - Hook para quizzes adaptativos con IA
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  difficulty_level: number;
  points: number;
  options?: Array<{
    text: string;
    isCorrect: boolean;
    feedback: string;
  }>;
  explanation?: string;
  hint?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  startedAt: Date;
  answers: Array<{
    questionId: string;
    answer: string;
    isCorrect: boolean;
    points: number;
  }>;
  currentQuestion: number;
  score: number;
}

export interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  totalPoints: number;
  timeSpent: number;
}

interface UseAdaptiveQuizOptions {
  courseId: string;
  lessonId?: string;
  onComplete?: (result: QuizResult) => void;
}

export function useAdaptiveQuiz(options: UseAdaptiveQuizOptions) {
  const { courseId, lessonId, onComplete } = options;
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    message: string;
    explanation?: string;
  } | null>(null);

  const performanceRef = useRef({
    correctCount: 0,
    totalCount: 0,
    averageDifficulty: 2,
  });

  // Generate adaptive questions
  const generateQuestions = useCallback(async (difficulty?: number) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('academia-adaptive-quiz', {
        body: {
          action: 'generate_questions',
          courseId,
          lessonId,
          difficulty,
          previousPerformance: performanceRef.current.totalCount > 0 
            ? performanceRef.current 
            : undefined,
        },
      });

      if (error) throw error;

      if (data?.success && data?.data?.questions) {
        const generatedQuestions = data.data.questions.map((q: any, i: number) => ({
          id: `gen-${Date.now()}-${i}`,
          ...q,
        }));
        setQuestions(generatedQuestions);
        setCurrentQuestion(generatedQuestions[0]);
        setCurrentIndex(0);
        return generatedQuestions;
      }

      throw new Error('No questions generated');
    } catch (error) {
      console.error('[useAdaptiveQuiz] generateQuestions error:', error);
      toast.error('Error al generar preguntas');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, courseId, lessonId]);

  // Start quiz attempt
  const startQuiz = useCallback(async (quizId?: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    setIsLoading(true);
    setResult(null);
    setFeedback(null);
    performanceRef.current = { correctCount: 0, totalCount: 0, averageDifficulty: 2 };

    try {
      // If quizId provided, load existing quiz questions
      if (quizId) {
        const { data: quizQuestions } = await supabase
          .from('academia_quiz_questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('order_index');

        if (quizQuestions && quizQuestions.length > 0) {
          const mappedQuestions: QuizQuestion[] = quizQuestions.map(q => ({
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type as QuizQuestion['question_type'],
            difficulty_level: q.difficulty_level,
            points: q.points,
            options: q.options as QuizQuestion['options'],
            explanation: q.explanation || undefined,
            hint: q.hint || undefined,
          }));
          setQuestions(mappedQuestions);
          setCurrentQuestion(mappedQuestions[0]);
          setCurrentIndex(0);

          // Create attempt record
          const { data: attemptData } = await supabase
            .from('academia_quiz_attempts')
            .insert({
              user_id: user.id,
              quiz_id: quizId,
              answers: [],
              adaptive_data: { avgDifficulty: 2, successRate: 0 },
            })
            .select()
            .single();

          if (attemptData) {
            setAttempt({
              id: attemptData.id,
              quizId,
              startedAt: new Date(),
              answers: [],
              currentQuestion: 0,
              score: 0,
            });
          }

          setIsLoading(false);
          return attemptData;
        }
      }

      // Otherwise generate new questions
      await generateQuestions();
      
      setAttempt({
        id: `temp-${Date.now()}`,
        quizId: quizId || 'generated',
        startedAt: new Date(),
        answers: [],
        currentQuestion: 0,
        score: 0,
      });

      return true;
    } catch (error) {
      console.error('[useAdaptiveQuiz] startQuiz error:', error);
      toast.error('Error al iniciar quiz');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, generateQuestions]);

  // Submit answer
  const submitAnswer = useCallback(async (answer: string) => {
    if (!currentQuestion || !attempt) return null;

    setIsLoading(true);
    setFeedback(null);

    try {
      // Evaluate answer locally for generated questions
      const options = currentQuestion.options || [];
      const selectedOption = options.find(o => o.text === answer);
      const correctOption = options.find(o => o.isCorrect);
      const isCorrect = selectedOption?.isCorrect || false;
      const earnedPoints = isCorrect ? currentQuestion.points * currentQuestion.difficulty_level : 0;

      // Update performance tracking
      performanceRef.current.totalCount += 1;
      if (isCorrect) {
        performanceRef.current.correctCount += 1;
      }
      performanceRef.current.averageDifficulty = 
        (performanceRef.current.averageDifficulty + currentQuestion.difficulty_level) / 2;

      // Update attempt answers
      const newAnswer = {
        questionId: currentQuestion.id,
        answer,
        isCorrect,
        points: earnedPoints,
      };

      const updatedAnswers = [...attempt.answers, newAnswer];
      setAttempt({
        ...attempt,
        answers: updatedAnswers,
        score: attempt.score + earnedPoints,
      });

      // Show feedback
      setFeedback({
        isCorrect,
        message: selectedOption?.feedback || (isCorrect ? '¡Correcto!' : 'Incorrecto'),
        explanation: currentQuestion.explanation,
      });

      return {
        isCorrect,
        earnedPoints,
        correctAnswer: correctOption?.text,
      };
    } catch (error) {
      console.error('[useAdaptiveQuiz] submitAnswer error:', error);
      toast.error('Error al evaluar respuesta');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentQuestion, attempt]);

  // Move to next question
  const nextQuestion = useCallback(() => {
    setFeedback(null);
    setShowHint(false);

    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setCurrentQuestion(questions[nextIdx]);
      return true;
    }

    return false; // No more questions
  }, [currentIndex, questions]);

  // Complete quiz
  const completeQuiz = useCallback(async () => {
    if (!attempt) return null;

    setIsLoading(true);

    try {
      const answers = attempt.answers;
      const correctCount = answers.filter(a => a.isCorrect).length;
      const totalPoints = answers.reduce((sum, a) => sum + a.points, 0);
      const percentage = (correctCount / answers.length) * 100;
      const passed = percentage >= 70;
      const timeSpent = Math.round((Date.now() - attempt.startedAt.getTime()) / 1000);

      const quizResult: QuizResult = {
        score: correctCount,
        total: answers.length,
        percentage,
        passed,
        totalPoints,
        timeSpent,
      };

      setResult(quizResult);

      // If we have a real attempt ID, update it
      if (attempt.id && !attempt.id.startsWith('temp-')) {
        await supabase.functions.invoke('academia-adaptive-quiz', {
          body: {
            action: 'complete_quiz',
            attemptId: attempt.id,
          },
        });
      }

      // Award points for completion
      if (passed) {
        await supabase.functions.invoke('academia-gamification', {
          body: {
            action: 'award_points',
            points: Math.round(totalPoints * (percentage / 100)),
            source: 'quiz_completion',
            description: `Quiz completado con ${percentage.toFixed(0)}%`,
          },
        });
      }

      onComplete?.(quizResult);
      return quizResult;
    } catch (error) {
      console.error('[useAdaptiveQuiz] completeQuiz error:', error);
      toast.error('Error al completar quiz');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [attempt, onComplete]);

  // Reset quiz
  const resetQuiz = useCallback(() => {
    setQuestions([]);
    setCurrentQuestion(null);
    setCurrentIndex(0);
    setAttempt(null);
    setResult(null);
    setFeedback(null);
    setShowHint(false);
    performanceRef.current = { correctCount: 0, totalCount: 0, averageDifficulty: 2 };
  }, []);

  return {
    // State
    isLoading,
    questions,
    currentQuestion,
    currentIndex,
    attempt,
    result,
    feedback,
    showHint,
    // Computed
    progress: {
      current: currentIndex + 1,
      total: questions.length,
      percentage: questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0,
    },
    performance: performanceRef.current,
    // Actions
    startQuiz,
    generateQuestions,
    submitAnswer,
    nextQuestion,
    completeQuiz,
    resetQuiz,
    setShowHint,
  };
}

export default useAdaptiveQuiz;
