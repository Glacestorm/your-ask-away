/**
 * ProgressDashboard - Dashboard de progreso del estudiante con análisis IA
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Clock,
  Award,
  Target,
  Sparkles,
  BookOpen,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAcademia, AcademiaContext, ProgressAnalysis } from '@/hooks/useAcademia';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface ProgressDashboardProps {
  userId: string;
  enrollmentId?: string;
  courseId?: string;
  currentProgress?: number;
  className?: string;
}

export function ProgressDashboard({
  userId,
  enrollmentId,
  courseId,
  currentProgress = 0,
  className
}: ProgressDashboardProps) {
  const { language } = useLanguage();
  const { analyzeProgress, progressAnalysis, isLoading, lastRefresh } = useAcademia();
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const context: AcademiaContext = {
    userId,
    enrollmentId,
    courseId,
    currentProgress
  };

  const handleAnalyze = async () => {
    await analyzeProgress(context);
    setHasAnalyzed(true);
  };

  useEffect(() => {
    // Auto-analyze on mount if we have context
    if (userId && !hasAnalyzed) {
      handleAnalyze();
    }
  }, [userId]);

  const getEngagementColor = (level?: string) => {
    switch (level) {
      case 'high': return 'text-emerald-400 bg-emerald-400/20';
      case 'medium': return 'text-amber-400 bg-amber-400/20';
      case 'low': return 'text-rose-400 bg-rose-400/20';
      default: return 'text-slate-400 bg-slate-400/20';
    }
  };

  const getEngagementLabel = (level?: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      high: { es: 'Alto', en: 'High' },
      medium: { es: 'Medio', en: 'Medium' },
      low: { es: 'Bajo', en: 'Low' },
    };
    return labels[level || '']?.[language as 'es' | 'en'] || level;
  };

  return (
    <Card className={cn("bg-slate-800/50 border-slate-700", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base text-white">
                {language === 'es' ? 'Análisis de Progreso IA' : 'AI Progress Analysis'}
              </CardTitle>
              {lastRefresh && (
                <p className="text-xs text-slate-400">
                  {language === 'es' ? 'Actualizado' : 'Updated'}{' '}
                  {formatDistanceToNow(lastRefresh, { 
                    addSuffix: true, 
                    locale: language === 'es' ? es : enUS 
                  })}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAnalyze}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && !progressAnalysis ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            <p className="text-sm text-slate-400">
              {language === 'es' ? 'Analizando tu progreso...' : 'Analyzing your progress...'}
            </p>
          </div>
        ) : progressAnalysis ? (
          <>
            {/* Main Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  {language === 'es' ? 'Progreso actual' : 'Current progress'}
                </span>
                <span className="text-white font-medium">{progressAnalysis.currentProgress}%</span>
              </div>
              <Progress value={progressAnalysis.currentProgress} className="h-2" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-xs text-slate-400">
                    {language === 'es' ? 'Finalización estimada' : 'Est. completion'}
                  </span>
                </div>
                <p className="text-sm font-medium text-white">
                  {progressAnalysis.predictedCompletion}
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-slate-400" />
                  <span className="text-xs text-slate-400">
                    {language === 'es' ? 'Engagement' : 'Engagement'}
                  </span>
                </div>
                <Badge className={cn("text-xs", getEngagementColor(progressAnalysis.engagementLevel))}>
                  {getEngagementLabel(progressAnalysis.engagementLevel)}
                </Badge>
              </div>
            </div>

            {/* Strengths */}
            {progressAnalysis.strengths.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  {language === 'es' ? 'Fortalezas' : 'Strengths'}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {progressAnalysis.strengths.map((strength, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="border-emerald-500/30 text-emerald-400 text-xs"
                    >
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Areas to Improve */}
            {progressAnalysis.areasToImprove.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  {language === 'es' ? 'Áreas de mejora' : 'Areas to improve'}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {progressAnalysis.areasToImprove.map((area, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="border-amber-500/30 text-amber-400 text-xs"
                    >
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {progressAnalysis.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {language === 'es' ? 'Recomendaciones IA' : 'AI Recommendations'}
                </h4>
                <ScrollArea className="h-32">
                  <ul className="space-y-2">
                    {progressAnalysis.recommendations.map((rec, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-2 text-sm text-slate-300 bg-slate-900/30 rounded-lg p-2"
                      >
                        <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        {rec}
                      </motion.li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Target className="h-8 w-8 text-slate-500" />
            <p className="text-sm text-slate-400 text-center">
              {language === 'es' 
                ? 'No hay datos de progreso disponibles' 
                : 'No progress data available'}
            </p>
            <Button size="sm" onClick={handleAnalyze}>
              {language === 'es' ? 'Analizar ahora' : 'Analyze now'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProgressDashboard;
