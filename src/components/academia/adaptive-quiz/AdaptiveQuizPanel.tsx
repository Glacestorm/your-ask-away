/**
 * AdaptiveQuizPanel - Quiz adaptativo con IA
 */

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Sparkles,
  Trophy,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Target
} from 'lucide-react';
import { useAdaptiveQuiz } from '@/hooks/academia/useAdaptiveQuiz';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AdaptiveQuizPanelProps {
  courseId: string;
  lessonId?: string;
  onComplete?: (result: {
    score: number;
    passed: boolean;
    percentage: number;
  }) => void;
  className?: string;
}

export function AdaptiveQuizPanel({ 
  courseId,
  lessonId,
  onComplete,
  className 
}: AdaptiveQuizPanelProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const {
    isLoading,
    questions,
    currentQuestion,
    currentIndex,
    attempt,
    result,
    feedback,
    showHint,
    progress,
    startQuiz,
    submitAnswer,
    nextQuestion,
    completeQuiz,
    resetQuiz,
    setShowHint,
  } = useAdaptiveQuiz({ 
    courseId,
    lessonId,
    onComplete: (quizResult) => {
      onComplete?.({
        score: quizResult.score,
        passed: quizResult.passed,
        percentage: quizResult.percentage,
      });
    },
  });

  // Handle answer submission
  const handleSubmitAnswer = useCallback(async () => {
    if (!selectedAnswer || !currentQuestion) return;

    const result = await submitAnswer(selectedAnswer);
    
    if (result) {
      setShowFeedback(true);

      // Auto-advance after 2 seconds
      setTimeout(() => {
        setShowFeedback(false);
        setSelectedAnswer(null);
        
        // Move to next or complete
        if (!nextQuestion()) {
          completeQuiz();
        }
      }, 2500);
    }
  }, [selectedAnswer, currentQuestion, submitAnswer, nextQuestion, completeQuiz]);

  // Render start screen
  if (!attempt) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="py-12 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-primary/50" />
          <h3 className="text-lg font-semibold mb-2">Quiz Adaptativo</h3>
          <p className="text-sm text-muted-foreground mb-6">
            La dificultad se ajusta a tu rendimiento en tiempo real
          </p>
          <Button 
            onClick={() => startQuiz()}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Comenzar Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render result screen
  if (result) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className={cn(
          "pb-4",
          result.passed 
            ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20" 
            : "bg-gradient-to-r from-amber-500/20 to-orange-500/20"
        )}>
          <div className="flex items-center justify-center">
            {result.passed ? (
              <Trophy className="h-16 w-16 text-green-500" />
            ) : (
              <Target className="h-16 w-16 text-amber-500" />
            )}
          </div>
          <CardTitle className="text-center text-2xl">
            {result.passed ? '¡Excelente trabajo!' : 'Sigue practicando'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Score */}
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">
              {Math.round(result.percentage)}%
            </div>
            <p className="text-muted-foreground">
              {result.score} de {result.total} respuestas correctas
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-lg font-semibold">{result.totalPoints}</div>
              <div className="text-xs text-muted-foreground">Puntos</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-lg font-semibold">
                {Math.round(result.timeSpent / 60)}min
              </div>
              <div className="text-xs text-muted-foreground">Tiempo</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-lg font-semibold">
                {result.passed ? 'Aprobado' : 'Pendiente'}
              </div>
              <div className="text-xs text-muted-foreground">Estado</div>
            </div>
          </div>

          <Button 
            onClick={() => {
              resetQuiz();
              startQuiz();
            }}
            className="w-full gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Intentar de nuevo
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render quiz question
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Quiz Adaptativo</CardTitle>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Pregunta {progress.current} de {progress.total}</span>
            <span>{Math.round(progress.percentage)}%</span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <AnimatePresence mode="wait">
          {showFeedback && feedback ? (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "p-6 rounded-lg text-center",
                feedback.isCorrect 
                  ? "bg-green-500/20" 
                  : "bg-red-500/20"
              )}
            >
              {feedback.isCorrect ? (
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              ) : (
                <XCircle className="h-12 w-12 mx-auto mb-3 text-red-500" />
              )}
              <h4 className="font-semibold mb-2">
                {feedback.isCorrect ? '¡Correcto!' : 'Incorrecto'}
              </h4>
              {feedback.explanation && (
                <p className="text-sm text-muted-foreground">
                  {feedback.explanation}
                </p>
              )}
            </motion.div>
          ) : currentQuestion ? (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Difficulty badge */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Nivel {currentQuestion.difficulty_level || 1}
                </Badge>
                {currentQuestion.points && (
                  <Badge variant="secondary" className="text-xs">
                    +{currentQuestion.points} pts
                  </Badge>
                )}
              </div>

              {/* Question */}
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-medium">{currentQuestion.question_text}</p>
              </div>

              {/* Hint */}
              {showHint && currentQuestion.hint && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    {currentQuestion.hint}
                  </p>
                </div>
              )}

              {/* Options */}
              <ScrollArea className="h-[200px]">
                <RadioGroup 
                  value={selectedAnswer || ''} 
                  onValueChange={setSelectedAnswer}
                  className="space-y-2"
                >
                  {currentQuestion.options?.map((option, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
                        selectedAnswer === option.text 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:bg-muted/50"
                      )}
                      onClick={() => setSelectedAnswer(option.text)}
                    >
                      <RadioGroupItem value={option.text} id={`option-${idx}`} />
                      <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </ScrollArea>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHint(true)}
                  disabled={showHint || !currentQuestion.hint}
                  className="gap-1"
                >
                  <Lightbulb className="h-4 w-4" />
                  Pista
                </Button>
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer || isLoading}
                  className="flex-1 gap-2"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Responder
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Cargando pregunta...</p>
            </div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default AdaptiveQuizPanel;
