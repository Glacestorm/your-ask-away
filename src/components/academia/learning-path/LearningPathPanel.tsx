/**
 * LearningPathPanel - Panel de ruta de aprendizaje adaptativa
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Route, 
  Sparkles, 
  Clock, 
  CheckCircle,
  Circle,
  Lock,
  Play,
  RefreshCw,
  TrendingUp,
  Target,
  Lightbulb,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useLearningPath, LearningPathLesson } from '@/hooks/academia/useLearningPath';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LearningPathPanelProps {
  courseId: string;
  onLessonSelect?: (lessonId: string) => void;
  className?: string;
}

export function LearningPathPanel({ 
  courseId, 
  onLessonSelect,
  className 
}: LearningPathPanelProps) {
  const [activeTab, setActiveTab] = useState('path');

  const {
    isLoading,
    isGenerating,
    learningPath,
    recommendations,
    nextLesson,
    progress,
    hasPath,
    generatePath,
    getRecommendations,
    analyzePerformance,
  } = useLearningPath({ courseId });

  // Generate path if none exists
  const handleGeneratePath = async () => {
    await generatePath();
  };

  // Get path type label
  const getPathTypeLabel = (type: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      standard: { label: 'Estándar', color: 'bg-blue-500' },
      accelerated: { label: 'Acelerado', color: 'bg-green-500' },
      remedial: { label: 'Refuerzo', color: 'bg-amber-500' },
      custom: { label: 'Personalizado', color: 'bg-purple-500' },
    };
    return labels[type] || labels.standard;
  };

  // Render empty state
  if (!hasPath && !isLoading) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="py-12 text-center">
          <Route className="h-12 w-12 mx-auto mb-4 text-primary/50" />
          <h3 className="text-lg font-semibold mb-2">Ruta de Aprendizaje IA</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Genera una ruta personalizada basada en tu nivel y objetivos de aprendizaje
          </p>
          <Button 
            onClick={handleGeneratePath}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generar Mi Ruta
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading && !learningPath) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-3 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando ruta...</p>
        </CardContent>
      </Card>
    );
  }

  const pathType = learningPath ? getPathTypeLabel(learningPath.pathType) : null;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Route className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Mi Ruta de Aprendizaje
                {pathType && (
                  <Badge className={cn("text-xs text-white", pathType.color)}>
                    {pathType.label}
                  </Badge>
                )}
              </CardTitle>
              {learningPath && (
                <p className="text-xs text-muted-foreground">
                  ~{learningPath.estimatedCompletionDays} días para completar
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGeneratePath}
            disabled={isGenerating}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
          </Button>
        </div>

        {/* Progress */}
        {progress && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress.current} de {progress.total} lecciones</span>
              <span>{Math.round(progress.percentage)}%</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="path" className="text-xs">Ruta</TabsTrigger>
            <TabsTrigger value="next" className="text-xs">Siguiente</TabsTrigger>
            <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
          </TabsList>

          {/* Path Tab */}
          <TabsContent value="path" className="mt-0">
            <ScrollArea className="h-[300px] pr-2">
              <div className="space-y-2">
                {learningPath?.sequence.map((lesson, index) => (
                  <LessonItem
                    key={lesson.lessonId}
                    lesson={lesson}
                    index={index}
                    isCurrentPosition={index === learningPath.currentPosition}
                    isCompleted={index < learningPath.currentPosition}
                    onSelect={() => onLessonSelect?.(lesson.lessonId)}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Next Lesson Tab */}
          <TabsContent value="next" className="mt-0">
            {nextLesson ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/20">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">Próxima Lección</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {nextLesson.reason}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          ~{nextLesson.estimatedMinutes} min
                        </span>
                        <Badge variant="outline" className="text-xs">
                          Prioridad {nextLesson.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => onLessonSelect?.(nextLesson.lessonId)}
                    className="w-full mt-4 gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Comenzar Lección
                  </Button>
                </div>

                {/* Prerequisites */}
                {nextLesson.prerequisitesMet === false && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Completa los prerrequisitos primero
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <h4 className="font-medium mb-1">¡Ruta Completada!</h4>
                <p className="text-sm text-muted-foreground">
                  Has completado todas las lecciones de esta ruta
                </p>
              </div>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="mt-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {/* Performance metrics */}
                {learningPath?.performanceMetrics && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <div className="text-lg font-semibold text-primary">
                        {learningPath.performanceMetrics.avgQuizScore}%
                      </div>
                      <div className="text-xs text-muted-foreground">Promedio Quiz</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <div className="text-lg font-semibold text-green-500">
                        {learningPath.performanceMetrics.completedLessons}
                      </div>
                      <div className="text-xs text-muted-foreground">Completadas</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <div className="text-lg font-semibold text-amber-500">
                        {learningPath.performanceMetrics.totalLessons - learningPath.performanceMetrics.completedLessons}
                      </div>
                      <div className="text-xs text-muted-foreground">Pendientes</div>
                    </div>
                  </div>
                )}

                {/* Focus areas */}
                {learningPath?.focusAreas && learningPath.focusAreas.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Áreas de Enfoque
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {learningPath.focusAreas.map((area, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      Recomendaciones IA
                    </h4>
                    <ul className="space-y-2">
                      {recommendations.map((rec, i) => (
                        <li 
                          key={i} 
                          className="text-sm text-muted-foreground flex items-start gap-2 p-2 rounded-lg bg-muted/30"
                        >
                          <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Analyze button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={analyzePerformance}
                  disabled={isLoading}
                  className="w-full gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Analizar Mi Rendimiento
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Lesson item component
function LessonItem({ 
  lesson, 
  index, 
  isCurrentPosition, 
  isCompleted,
  onSelect 
}: { 
  lesson: LearningPathLesson;
  index: number;
  isCurrentPosition: boolean;
  isCompleted: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
        isCurrentPosition 
          ? "border-primary bg-primary/5 shadow-sm" 
          : isCompleted
            ? "border-green-500/30 bg-green-500/5"
            : "border-border hover:bg-muted/50"
      )}
    >
      {/* Status icon */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
        isCompleted 
          ? "bg-green-500 text-white" 
          : isCurrentPosition
            ? "bg-primary text-white"
            : "bg-muted text-muted-foreground"
      )}>
        {isCompleted ? (
          <CheckCircle className="h-4 w-4" />
        ) : isCurrentPosition ? (
          <Play className="h-4 w-4" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </div>

      {/* Lesson info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          Lección {index + 1}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {lesson.reason}
        </div>
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {lesson.estimatedMinutes}m
        </span>
        {!lesson.prerequisitesMet && (
          <Lock className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </motion.div>
  );
}

export default LearningPathPanel;
