/**
 * AIRecommendationsPanel - Panel de recomendaciones AI para Academia
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  RefreshCw, 
  BookOpen, 
  TrendingUp,
  Target,
  ChevronRight,
  Brain,
  Lightbulb,
  Award
} from 'lucide-react';
import { useAcademia, type CourseRecommendation, type ProgressAnalysis } from '@/hooks/useAcademia';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface AIRecommendationsPanelProps {
  courseId?: string;
  currentProgress?: number;
  className?: string;
}

export function AIRecommendationsPanel({ 
  courseId, 
  currentProgress = 0,
  className 
}: AIRecommendationsPanelProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'recommendations' | 'analysis'>('recommendations');
  
  const {
    isLoading,
    recommendations,
    progressAnalysis,
    error,
    lastRefresh,
    getRecommendations,
    analyzeProgress,
  } = useAcademia();

  useEffect(() => {
    if (user?.id) {
      const context = {
        userId: user.id,
        courseId,
        currentProgress,
      };
      
      getRecommendations(context);
      if (courseId) {
        analyzeProgress(context);
      }
    }
  }, [user?.id, courseId]);

  const handleRefresh = () => {
    if (user?.id) {
      const context = {
        userId: user.id,
        courseId,
        currentProgress,
      };
      getRecommendations(context);
      if (courseId) {
        analyzeProgress(context);
      }
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Asistente AI</CardTitle>
              <CardDescription className="text-xs">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Analizando tu progreso...'
                }
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === 'recommendations' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('recommendations')}
            className="flex-1"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Recomendaciones
          </Button>
          {courseId && (
            <Button
              variant={activeTab === 'analysis' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('analysis')}
              className="flex-1"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Mi Progreso
            </Button>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
            {error}
          </div>
        )}

        <ScrollArea className="h-[300px]">
          {activeTab === 'recommendations' && (
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-lg border space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))
              ) : recommendations.length > 0 ? (
                recommendations.map((rec, index) => (
                  <RecommendationCard key={index} recommendation={rec} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Completa más lecciones para recibir recomendaciones personalizadas</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analysis' && progressAnalysis && (
            <ProgressAnalysisCard analysis={progressAnalysis} />
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function RecommendationCard({ recommendation }: { recommendation: CourseRecommendation }) {
  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'principiante': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'intermedio': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'avanzado': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted';
    }
  };

  return (
    <Link to={`/academia/curso/${recommendation.courseId}`}>
      <div className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-primary shrink-0" />
              <p className="font-medium text-sm truncate">{recommendation.courseTitle}</p>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {recommendation.reason}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-xs", getLevelColor(recommendation.level))}>
                {recommendation.level}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {recommendation.category}
              </Badge>
              <span className="text-xs text-primary font-medium ml-auto">
                {Math.round(recommendation.matchScore * 100)}% match
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </div>
      </div>
    </Link>
  );
}

function ProgressAnalysisCard({ analysis }: { analysis: ProgressAnalysis }) {
  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getEngagementLabel = (level: string) => {
    switch (level) {
      case 'high': return 'Alto';
      case 'medium': return 'Medio';
      case 'low': return 'Bajo';
      default: return level;
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progreso del curso</span>
          <span className="text-sm text-primary font-bold">{analysis.currentProgress}%</span>
        </div>
        <Progress value={analysis.currentProgress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">
          Estimación de finalización: {analysis.predictedCompletion}
        </p>
      </div>

      {/* Engagement */}
      <div className="p-3 rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm">Nivel de engagement:</span>
          <span className={cn("font-medium", getEngagementColor(analysis.engagementLevel))}>
            {getEngagementLabel(analysis.engagementLevel)}
          </span>
        </div>
      </div>

      {/* Strengths */}
      {analysis.strengths.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <Award className="w-4 h-4 text-green-500" />
            Fortalezas
          </p>
          <ul className="space-y-1">
            {analysis.strengths.map((strength, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-green-500">✓</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Areas to Improve */}
      {analysis.areasToImprove.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-yellow-500" />
            Áreas de mejora
          </p>
          <ul className="space-y-1">
            {analysis.areasToImprove.map((area, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-yellow-500">→</span>
                {area}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            Recomendaciones
          </p>
          <ul className="space-y-1">
            {analysis.recommendations.map((rec, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-primary">💡</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default AIRecommendationsPanel;
