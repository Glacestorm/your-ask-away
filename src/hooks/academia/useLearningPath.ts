/**
 * useLearningPath - Hook para rutas de aprendizaje adaptativas
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export interface LearningPathLesson {
  lessonId: string;
  priority: number;
  reason: string;
  estimatedMinutes: number;
  prerequisitesMet?: boolean;
}

export interface LearningPath {
  id: string;
  pathType: 'standard' | 'accelerated' | 'remedial' | 'custom';
  sequence: LearningPathLesson[];
  recommendations: string[];
  focusAreas: string[];
  estimatedCompletionDays: number;
  currentPosition: number;
  performanceMetrics: {
    avgQuizScore: number;
    completedLessons: number;
    totalLessons: number;
  };
}

interface UseLearningPathOptions {
  courseId: string;
  autoLoad?: boolean;
}

export function useLearningPath(options: UseLearningPathOptions) {
  const { courseId, autoLoad = true } = options;
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [nextLesson, setNextLesson] = useState<LearningPathLesson | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load existing learning path
  const loadLearningPath = useCallback(async () => {
    if (!user || !courseId) return null;

    setIsLoading(true);
    setError(null);

    try {
      const { data: pathData } = await supabase
        .from('academia_learning_paths')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      if (pathData) {
        const path: LearningPath = {
          id: pathData.id,
          pathType: pathData.path_type as LearningPath['pathType'],
          sequence: (pathData.recommended_sequence as any[]) || [],
          recommendations: (pathData.ai_recommendations as any)?.recommendations || [],
          focusAreas: (pathData.ai_recommendations as any)?.focusAreas || [],
          estimatedCompletionDays: (pathData.ai_recommendations as any)?.estimatedCompletionDays || 7,
          currentPosition: pathData.current_position || 0,
          performanceMetrics: (pathData.performance_metrics as any) || {
            avgQuizScore: 0,
            completedLessons: 0,
            totalLessons: 0,
          },
        };

        setLearningPath(path);
        setRecommendations(path.recommendations);
        
        if (path.sequence && path.sequence.length > path.currentPosition) {
          setNextLesson(path.sequence[path.currentPosition]);
        }

        return path;
      }

      return null;
    } catch (err) {
      console.error('[useLearningPath] loadLearningPath error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, courseId]);

  // Generate new learning path with AI
  const generatePath = useCallback(async () => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('academia-learning-path', {
        body: {
          action: 'generate',
          courseId,
        },
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        const pathData = data.data;
        
        // Reload the saved path
        await loadLearningPath();
        
        toast.success('Ruta de aprendizaje generada');
        return pathData;
      }

      throw new Error('Failed to generate learning path');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useLearningPath] generatePath error:', err);
      toast.error('Error al generar ruta de aprendizaje');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [user, courseId, loadLearningPath]);

  // Get AI recommendations
  const getRecommendations = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('academia-learning-path', {
        body: {
          action: 'get_recommendations',
          courseId,
        },
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setRecommendations(data.data.recommendations || []);
        if (data.data.nextLesson) {
          setNextLesson(data.data.nextLesson);
        }
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useLearningPath] getRecommendations error:', err);
      return null;
    }
  }, [user, courseId]);

  // Update progress after completing a lesson
  const updateProgress = useCallback(async (
    lessonId: string,
    progressData: {
      timeSpent: number;
      quizScore?: number;
      completed: boolean;
    }
  ) => {
    if (!user) return false;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('academia-learning-path', {
        body: {
          action: 'update_progress',
          courseId,
          lessonId,
          progressData,
        },
      });

      if (fnError) throw fnError;

      if (data?.success) {
        // Reload path to get updated position
        await loadLearningPath();
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useLearningPath] updateProgress error:', err);
      return false;
    }
  }, [user, courseId, loadLearningPath]);

  // Analyze current performance
  const analyzePerformance = useCallback(async () => {
    if (!user) return null;

    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('academia-learning-path', {
        body: {
          action: 'analyze',
          courseId,
        },
      });

      if (fnError) throw fnError;

      return data?.data || null;
    } catch (err) {
      console.error('[useLearningPath] analyzePerformance error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, courseId]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && user && courseId) {
      loadLearningPath();
    }
  }, [autoLoad, user, courseId, loadLearningPath]);

  return {
    // State
    isLoading,
    isGenerating,
    learningPath,
    recommendations,
    nextLesson,
    error,
    // Computed
    progress: learningPath ? {
      current: learningPath.currentPosition,
      total: learningPath.sequence.length,
      percentage: learningPath.sequence.length 
        ? (learningPath.currentPosition / learningPath.sequence.length) * 100 
        : 0,
    } : null,
    hasPath: !!learningPath,
    // Actions
    loadLearningPath,
    generatePath,
    getRecommendations,
    updateProgress,
    analyzePerformance,
  };
}

export default useLearningPath;
