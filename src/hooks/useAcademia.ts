/**
 * useAcademia - Hook principal para el módulo Academia
 * Conecta con la edge function academia-ai y las tablas de Supabase
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface AcademiaContext {
  userId: string;
  courseId?: string;
  enrollmentId?: string;
  currentProgress?: number;
  recentActivity?: Array<{
    action: string;
    timestamp: string;
    lessonId?: string;
  }>;
}

export interface CourseRecommendation {
  courseId: string;
  courseTitle: string;
  reason: string;
  matchScore: number;
  category: string;
  level: string;
}

export interface ProgressAnalysis {
  currentProgress: number;
  predictedCompletion: string;
  strengths: string[];
  areasToImprove: string[];
  recommendations: string[];
  engagementLevel: 'high' | 'medium' | 'low';
}

export interface ContentSummary {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
}

export interface AcademiaAIResponse {
  success: boolean;
  action: string;
  data: CourseRecommendation[] | ProgressAnalysis | ContentSummary | string;
  timestamp: string;
}

// === HOOK ===
export function useAcademia() {
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<CourseRecommendation[]>([]);
  const [progressAnalysis, setProgressAnalysis] = useState<ProgressAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Refs para auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === INVOKE AI ===
  const invokeAI = useCallback(async (
    action: string,
    context?: AcademiaContext,
    params?: Record<string, unknown>
  ): Promise<AcademiaAIResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'academia-ai',
        {
          body: {
            action,
            context,
            params
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setLastRefresh(new Date());
        return fnData as AcademiaAIResponse;
      }

      throw new Error(fnData?.error || 'Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useAcademia] invokeAI error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET RECOMMENDATIONS ===
  const getRecommendations = useCallback(async (context: AcademiaContext) => {
    const result = await invokeAI('recommend_courses', context);
    if (result?.success && Array.isArray(result.data)) {
      setRecommendations(result.data as CourseRecommendation[]);
      return result.data as CourseRecommendation[];
    }
    return [];
  }, [invokeAI]);

  // === ANALYZE PROGRESS ===
  const analyzeProgress = useCallback(async (context: AcademiaContext) => {
    const result = await invokeAI('analyze_progress', context);
    if (result?.success && result.data) {
      setProgressAnalysis(result.data as ProgressAnalysis);
      return result.data as ProgressAnalysis;
    }
    return null;
  }, [invokeAI]);

  // === GENERATE SUMMARY ===
  const generateSummary = useCallback(async (
    content: string,
    lessonTitle: string
  ): Promise<ContentSummary | null> => {
    const result = await invokeAI('generate_summary', undefined, { content, lessonTitle });
    if (result?.success && result.data) {
      return result.data as ContentSummary;
    }
    return null;
  }, [invokeAI]);

  // === ANSWER QUESTION ===
  const answerQuestion = useCallback(async (
    question: string,
    courseContext: string
  ): Promise<string | null> => {
    const result = await invokeAI('answer_question', undefined, { question, courseContext });
    if (result?.success && typeof result.data === 'string') {
      return result.data;
    }
    return null;
  }, [invokeAI]);

  // === SUGGEST NEXT STEPS ===
  const suggestNextSteps = useCallback(async (context: AcademiaContext) => {
    const result = await invokeAI('suggest_next_steps', context);
    if (result?.success) {
      return result.data;
    }
    return null;
  }, [invokeAI]);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: AcademiaContext, intervalMs = 120000) => {
    stopAutoRefresh();
    getRecommendations(context);
    autoRefreshInterval.current = setInterval(() => {
      getRecommendations(context);
    }, intervalMs);
  }, [getRecommendations]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  // === RETURN ===
  return {
    // Estado
    isLoading,
    recommendations,
    progressAnalysis,
    error,
    lastRefresh,
    // Acciones AI
    getRecommendations,
    analyzeProgress,
    generateSummary,
    answerQuestion,
    suggestNextSteps,
    // Auto-refresh
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useAcademia;
