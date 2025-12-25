/**
 * QuizModule - Módulo completo de exámenes con requisito para certificación
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
  RotateCcw,
  Trophy,
  AlertCircle,
  Lightbulb,
  Clock,
  Target,
  Award,
  Lock,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTrainingQuizzes, Quiz, QuizQuestion as QuizQuestionType } from '@/hooks/useTrainingQuizzes';
import { useTrainingGamification } from '@/hooks/useTrainingGamification';
import { useCelebration } from '@/hooks/useCelebration';
import { cn } from '@/lib/utils';

interface QuizModuleProps {
  quizId?: string;
  courseId?: string;
  enrollmentId?: string;
  onComplete?: (score: number, passed: boolean) => void;
  onCertificateEligible?: () => void;
  className?: string;
}

type QuizState = 'intro' | 'question' | 'review' | 'result';

export const QuizModule: React.FC<QuizModuleProps> = ({
  quizId,
  courseId,
  enrollmentId,
  onComplete,
  onCertificateEligible,
  className,
}) => {
  const { fetchQuiz, fetchCourseQuizzes, startAttempt, completeAttempt, canTakeQuiz, prepareQuizForTaking } = useTrainingQuizzes();
  const { awardXP, awardBadge } = useTrainingGamification();
  const { fireCelebration, fireStarBurst } = useCelebration();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [preparedQuiz, setPreparedQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizState, setQuizState] = useState<QuizState>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Array<{ questionId: string; selectedIndex: number }>>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [passed, setPassed] = useState(false);
  const [canAttempt, setCanAttempt] = useState({ canTake: true, attemptsUsed: 0, bestScore: 0 });
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Load quiz
  useEffect(() => {
    const loadQuiz = async () => {
      setLoading(true);
      try {
        let loadedQuiz: Quiz | null = null;

        if (quizId) {
          loadedQuiz = await fetchQuiz(quizId);
        } else if (courseId) {
          const quizzes = await fetchCourseQuizzes(courseId);
          if (quizzes.length > 0) {
            loadedQuiz = quizzes[0]; // Get first quiz for course
          }
        }

        if (loadedQuiz) {
          setQuiz(loadedQuiz);
          const eligibility = await canTakeQuiz(loadedQuiz.id, loadedQuiz.max_attempts);
          setCanAttempt(eligibility);
        }
      } catch (err) {
        console.error('Error loading quiz:', err);
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId, courseId, fetchQuiz, fetchCourseQuizzes, canTakeQuiz]);

  // Timer effect
  useEffect(() => {
    if (quizState !== 'question' || !preparedQuiz?.time_limit_minutes || timeRemaining === null) return;

    if (timeRemaining <= 0) {
      handleTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState, timeRemaining, preparedQuiz]);

  const currentQuestion = useMemo(() => {
    if (!preparedQuiz) return null;
    return preparedQuiz.questions[currentQuestionIndex];
  }, [preparedQuiz, currentQuestionIndex]);

  const isLastQuestion = useMemo(() => {
    if (!preparedQuiz) return false;
    return currentQuestionIndex === preparedQuiz.questions.length - 1;
  }, [preparedQuiz, currentQuestionIndex]);

  const isCorrect = useMemo(() => {
    if (!currentQuestion || selectedAnswer === null) return false;
    return selectedAnswer === currentQuestion.correctIndex;
  }, [currentQuestion, selectedAnswer]);

  const handleStartQuiz = useCallback(async () => {
    if (!quiz) return;

    const prepared = prepareQuizForTaking(quiz);
    setPreparedQuiz(prepared);

    const attempt = await startAttempt(quiz.id, enrollmentId);
    if (attempt) {
      setAttemptId(attempt.id);
      setStartTime(new Date());
      setQuizState('question');
      setAnswers([]);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowExplanation(false);

      if (quiz.time_limit_minutes) {
        setTimeRemaining(quiz.time_limit_minutes * 60);
      }
    }
  }, [quiz, enrollmentId, startAttempt, prepareQuizForTaking]);

  const handleSelectAnswer = useCallback((index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
  }, [showExplanation]);

  const handleConfirmAnswer = useCallback(() => {
    if (selectedAnswer === null || !currentQuestion) return;

    setAnswers(prev => [...prev, { questionId: currentQuestion.id, selectedIndex: selectedAnswer }]);
    setShowExplanation(true);
  }, [selectedAnswer, currentQuestion]);

  const handleNextQuestion = useCallback(async () => {
    if (isLastQuestion && preparedQuiz && attemptId) {
      // Complete quiz
      const timeSpent = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0;
      const finalAnswers = [...answers, { questionId: currentQuestion!.id, selectedIndex: selectedAnswer! }];
      
      const result = await completeAttempt(attemptId, finalAnswers, preparedQuiz, timeSpent);
      
      if (result) {
        setFinalScore(result.score);
        setPassed(result.passed);
        setQuizState('result');

        if (result.passed) {
          fireCelebration();
          await awardXP('quiz_pass', 'quiz', preparedQuiz.id, `Quiz aprobado: ${preparedQuiz.title.es}`);
          
          if (result.score === 100) {
            fireStarBurst();
            await awardBadge('quiz_master');
            await awardXP('quiz_perfect', 'quiz', preparedQuiz.id, 'Quiz perfecto!', 20);
          }

          if (preparedQuiz.is_required_for_certificate) {
            onCertificateEligible?.();
          }
        }

        onComplete?.(result.score, result.passed);
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  }, [isLastQuestion, preparedQuiz, attemptId, answers, currentQuestion, selectedAnswer, startTime, completeAttempt, fireCelebration, fireStarBurst, awardXP, awardBadge, onComplete, onCertificateEligible]);

  const handleTimeUp = useCallback(async () => {
    if (!preparedQuiz || !attemptId) return;

    const timeSpent = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0;
    const result = await completeAttempt(attemptId, answers, preparedQuiz, timeSpent);

    if (result) {
      setFinalScore(result.score);
      setPassed(result.passed);
      setQuizState('result');
      onComplete?.(result.score, result.passed);
    }
  }, [preparedQuiz, attemptId, startTime, answers, completeAttempt, onComplete]);

  const handleRetry = useCallback(() => {
    setQuizState('intro');
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowExplanation(false);
    setAttemptId(null);
    setStartTime(null);
    setTimeRemaining(null);
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="animate-pulse text-slate-400">Cargando quiz...</div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <Card className={cn("bg-slate-900/50 border-slate-800", className)}>
        <CardContent className="p-8 text-center">
          <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No hay quiz disponible</p>
        </CardContent>
      </Card>
    );
  }

  // Intro state
  if (quizState === 'intro') {
    return (
      <Card className={cn("bg-slate-900/50 border-slate-800", className)}>
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl">{quiz.title.es || 'Quiz'}</CardTitle>
          {quiz.description && (
            <CardDescription>{quiz.description.es}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quiz Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-800/50">
            <div className="text-center">
              <Target className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{quiz.questions.length}</p>
              <p className="text-xs text-slate-400">Preguntas</p>
            </div>
            <div className="text-center">
              <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{quiz.passing_score}%</p>
              <p className="text-xs text-slate-400">Para aprobar</p>
            </div>
            <div className="text-center">
              <Clock className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">
                {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : '∞'}
              </p>
              <p className="text-xs text-slate-400">Tiempo límite</p>
            </div>
            <div className="text-center">
              <RotateCcw className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">
                {quiz.max_attempts - canAttempt.attemptsUsed}
              </p>
              <p className="text-xs text-slate-400">Intentos restantes</p>
            </div>
          </div>

          {/* Certificate requirement */}
          {quiz.is_required_for_certificate && (
            <Alert className="bg-blue-500/10 border-blue-500/30">
              <Award className="w-4 h-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                Este quiz es <strong>obligatorio</strong> para obtener el certificado del curso.
              </AlertDescription>
            </Alert>
          )}

          {/* Previous attempts */}
          {canAttempt.attemptsUsed > 0 && (
            <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700">
              <p className="text-sm text-slate-400">
                Has intentado este quiz {canAttempt.attemptsUsed} {canAttempt.attemptsUsed === 1 ? 'vez' : 'veces'}.
                Tu mejor puntuación: <span className="font-bold text-white">{canAttempt.bestScore}%</span>
              </p>
            </div>
          )}

          {/* Action button */}
          {canAttempt.canTake ? (
            <Button
              size="lg"
              onClick={handleStartQuiz}
              className="w-full gap-2 bg-gradient-to-r from-primary to-blue-600"
            >
              <Play className="w-5 h-5" />
              {canAttempt.attemptsUsed > 0 ? 'Reintentar Quiz' : 'Comenzar Quiz'}
            </Button>
          ) : (
            <div className="space-y-3">
              <Button disabled size="lg" className="w-full gap-2">
                <Lock className="w-5 h-5" />
                {canAttempt.bestScore >= quiz.passing_score 
                  ? 'Ya aprobaste este quiz'
                  : 'Sin intentos restantes'}
              </Button>
              {canAttempt.bestScore >= quiz.passing_score && (
                <Alert className="bg-green-500/10 border-green-500/30">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <AlertDescription className="text-green-300">
                    ¡Felicidades! Ya has aprobado este quiz con {canAttempt.bestScore}%.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Question state
  if (quizState === 'question' && preparedQuiz && currentQuestion) {
    return (
      <div className={cn("h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-4 sm:p-6", className)}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="border-slate-600">
              <HelpCircle className="w-3 h-3 mr-1" />
              Quiz
            </Badge>
            <div className="flex items-center gap-4">
              {timeRemaining !== null && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "border-slate-600",
                    timeRemaining < 60 && "border-red-500 text-red-400 animate-pulse"
                  )}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTime(timeRemaining)}
                </Badge>
              )}
              <span className="text-sm text-slate-400">
                Pregunta {currentQuestionIndex + 1} de {preparedQuiz.questions.length}
              </span>
            </div>
          </div>
          <Progress
            value={((currentQuestionIndex + (showExplanation ? 1 : 0)) / preparedQuiz.questions.length) * 100}
            className="h-2"
          />
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-semibold text-white text-center">
                {currentQuestion.question}
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrectAnswer = index === currentQuestion.correctIndex;
                  const showResult = showExplanation;

                  return (
                    <motion.button
                      key={index}
                      whileHover={!showResult ? { scale: 1.02 } : {}}
                      whileTap={!showResult ? { scale: 0.98 } : {}}
                      onClick={() => handleSelectAnswer(index)}
                      disabled={showResult}
                      className={cn(
                        "w-full p-4 rounded-lg border-2 text-left transition-all",
                        !showResult && !isSelected && "border-slate-700 bg-slate-800/50 hover:border-slate-600",
                        !showResult && isSelected && "border-primary bg-primary/10",
                        showResult && isCorrectAnswer && "border-green-500 bg-green-500/10",
                        showResult && isSelected && !isCorrectAnswer && "border-red-500 bg-red-500/10",
                        showResult && !isSelected && !isCorrectAnswer && "border-slate-700 bg-slate-800/30 opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-medium",
                          !showResult && !isSelected && "bg-slate-700 text-slate-300",
                          !showResult && isSelected && "bg-primary text-primary-foreground",
                          showResult && isCorrectAnswer && "bg-green-500 text-white",
                          showResult && isSelected && !isCorrectAnswer && "bg-red-500 text-white",
                          showResult && !isSelected && !isCorrectAnswer && "bg-slate-700 text-slate-500"
                        )}>
                          {showResult ? (
                            isCorrectAnswer ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : isSelected ? (
                              <XCircle className="w-5 h-5" />
                            ) : (
                              String.fromCharCode(65 + index)
                            )
                          ) : (
                            String.fromCharCode(65 + index)
                          )}
                        </div>
                        <span className={cn(
                          "text-sm sm:text-base",
                          showResult && isCorrectAnswer ? "text-green-400" : "text-slate-200"
                        )}>
                          {option}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {showExplanation && preparedQuiz.show_correct_answers && currentQuestion.explanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className={cn(
                      "p-4 rounded-lg flex gap-3",
                      isCorrect ? "bg-green-500/10 border border-green-500/30" : "bg-yellow-500/10 border border-yellow-500/30"
                    )}>
                      <Lightbulb className={cn(
                        "w-5 h-5 shrink-0 mt-0.5",
                        isCorrect ? "text-green-400" : "text-yellow-400"
                      )} />
                      <div>
                        <p className={cn(
                          "text-sm font-medium mb-1",
                          isCorrect ? "text-green-400" : "text-yellow-400"
                        )}>
                          {isCorrect ? "¡Correcto!" : "Incorrecto"}
                        </p>
                        <p className="text-sm text-slate-300">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-center">
          {!showExplanation ? (
            <Button
              size="lg"
              onClick={handleConfirmAnswer}
              disabled={selectedAnswer === null}
              className="min-w-[200px]"
            >
              Confirmar Respuesta
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleNextQuestion}
              className="min-w-[200px] gap-2"
            >
              {isLastQuestion ? "Ver Resultados" : "Siguiente Pregunta"}
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Result state
  if (quizState === 'result') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("flex items-center justify-center p-6", className)}
      >
        <Card className="max-w-md w-full bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center pb-2">
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
              passed ? "bg-green-500/20" : "bg-yellow-500/20"
            )}>
              {passed ? (
                <Trophy className="w-10 h-10 text-green-400" />
              ) : (
                <AlertCircle className="w-10 h-10 text-yellow-400" />
              )}
            </div>
            <CardTitle className="text-xl text-white">
              {passed ? "¡Felicidades!" : "¡Sigue practicando!"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">{finalScore}%</div>
              <p className="text-slate-400">
                Respondiste correctamente {answers.filter((a, i) => 
                  preparedQuiz && a.selectedIndex === preparedQuiz.questions[i]?.correctIndex
                ).length} de {preparedQuiz?.questions.length || 0} preguntas
              </p>
              <Badge
                variant={passed ? "default" : "secondary"}
                className={cn(
                  passed ? "bg-green-500/20 text-green-400 border-green-500/50" : ""
                )}
              >
                {passed ? "Aprobado" : `${quiz.passing_score}% requerido para aprobar`}
              </Badge>
            </div>

            {passed && quiz.is_required_for_certificate && (
              <Alert className="bg-blue-500/10 border-blue-500/30 text-left">
                <Award className="w-4 h-4 text-blue-400" />
                <AlertDescription className="text-blue-300">
                  ¡Ya puedes obtener tu certificado del curso!
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-4 space-y-2">
              {!passed && canAttempt.attemptsUsed < quiz.max_attempts && (
                <Button
                  className="w-full gap-2"
                  onClick={handleRetry}
                >
                  <RotateCcw className="w-4 h-4" />
                  Reintentar
                </Button>
              )}
              <Button
                variant={passed ? "default" : "outline"}
                className="w-full"
                onClick={() => onComplete?.(finalScore, passed)}
              >
                {passed ? "Continuar" : "Volver al curso"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return null;
};

export default QuizModule;
