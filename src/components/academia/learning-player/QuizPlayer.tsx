/**
 * QuizPlayer - Componente para realizar quizzes dentro del curso
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, CheckCircle, XCircle, ChevronRight, 
  RotateCcw, Trophy, AlertCircle, Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizPlayerProps {
  quizId: string;
  title: string;
  questions: QuizQuestion[];
  passingScore?: number;
  onComplete: (score: number, passed: boolean) => void;
  onRetry?: () => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  quizId,
  title,
  questions,
  passingScore = 70,
  onComplete,
  onRetry,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isAnswered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === currentQuestion?.correctIndex;

  const handleSelectAnswer = (index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
  };

  const handleConfirmAnswer = () => {
    if (!isAnswered) return;
    
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setAnswers(newAnswers);
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // Calculate score
      const correctCount = answers.filter(
        (answer, index) => answer === questions[index].correctIndex
      ).length + (isCorrect ? 1 : 0);
      const score = Math.round((correctCount / questions.length) * 100);
      const passed = score >= passingScore;
      
      setIsCompleted(true);
      onComplete(score, passed);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers(new Array(questions.length).fill(null));
    setShowExplanation(false);
    setIsCompleted(false);
    onRetry?.();
  };

  const calculateCurrentScore = () => {
    const answeredCount = answers.filter(a => a !== null).length + (showExplanation ? 1 : 0);
    const correctCount = answers.filter(
      (answer, index) => answer === questions[index].correctIndex
    ).length + (showExplanation && isCorrect ? 1 : 0);
    return { answeredCount, correctCount };
  };

  const { answeredCount, correctCount } = calculateCurrentScore();

  if (isCompleted) {
    const finalScore = Math.round((correctCount / questions.length) * 100);
    const passed = finalScore >= passingScore;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-full flex items-center justify-center p-6"
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
              {passed ? "Congratulations!" : "Keep Learning!"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">{finalScore}%</div>
              <p className="text-slate-400">
                You answered {correctCount} out of {questions.length} correctly
              </p>
              <Badge 
                variant={passed ? "default" : "secondary"}
                className={cn(
                  passed ? "bg-green-500/20 text-green-400 border-green-500/50" : ""
                )}
              >
                {passed ? "Passed" : `${passingScore}% required to pass`}
              </Badge>
            </div>

            <div className="pt-4 space-y-2">
              {!passed && (
                <Button 
                  className="w-full gap-2" 
                  onClick={handleRetry}
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </Button>
              )}
              <Button 
                variant={passed ? "default" : "outline"} 
                className="w-full"
                onClick={() => onComplete(finalScore, passed)}
              >
                {passed ? "Continue to Next Lesson" : "Review Answers"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="border-slate-600">
            <HelpCircle className="w-3 h-3 mr-1" />
            Quiz
          </Badge>
          <span className="text-sm text-slate-400">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>
        <Progress 
          value={((currentQuestionIndex + (showExplanation ? 1 : 0)) / questions.length) * 100} 
          className="h-2" 
        />
        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
          <span>{correctCount} correct</span>
          <span>{answeredCount} answered</span>
        </div>
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
              {showExplanation && (
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
                        {isCorrect ? "Correct!" : "Not quite right"}
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
            disabled={!isAnswered}
            className="min-w-[200px]"
          >
            Confirm Answer
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={handleNextQuestion}
            className="min-w-[200px] gap-2"
          >
            {isLastQuestion ? "See Results" : "Next Question"}
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuizPlayer;
