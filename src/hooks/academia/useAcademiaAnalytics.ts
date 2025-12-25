import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CourseOverview {
  overview: {
    total_students: number;
    active_students: number;
    completion_rate: number;
    avg_progress: number;
    avg_quiz_score: number;
    engagement_score: number;
  };
  trends: {
    enrollment_trend: 'growing' | 'stable' | 'declining';
    completion_trend: 'improving' | 'stable' | 'declining';
    engagement_trend: 'high' | 'medium' | 'low';
  };
  highlights: Array<{
    type: 'success' | 'warning' | 'info';
    title: string;
    description: string;
    metric: number;
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    expected_impact: string;
  }>;
}

export interface StudentPerformance {
  students: Array<{
    user_id: string;
    performance_score: number;
    ranking: number;
    percentile: number;
    metrics: {
      progress: number;
      quiz_avg: number;
      engagement: number;
      consistency: number;
    };
    strengths: string[];
    areas_to_improve: string[];
    learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
    pace: 'fast' | 'normal' | 'slow';
  }>;
  class_distribution: {
    top_performers: number;
    average: number;
    struggling: number;
    at_risk: number;
  };
  insights: string[];
}

export interface EngagementTrends {
  engagement_metrics: {
    current_score: number;
    trend: 'up' | 'stable' | 'down';
    change_percentage: number;
  };
  temporal_patterns: {
    peak_hours: string[];
    peak_days: string[];
    avg_session_duration_minutes: number;
    sessions_per_week: number;
  };
  emotional_distribution: {
    engaged: number;
    neutral: number;
    confused: number;
    frustrated: number;
    tired: number;
  };
  content_engagement: Array<{
    lesson_id: string;
    engagement_score: number;
    completion_rate: number;
    avg_time_spent: number;
  }>;
  alerts: Array<{
    type: 'low_engagement' | 'high_frustration' | 'declining_participation';
    severity: 'low' | 'medium' | 'high';
    affected_users: number;
    recommendation: string;
  }>;
}

export interface ContentEffectiveness {
  lessons_effectiveness: Array<{
    lesson_id: string;
    effectiveness_score: number;
    completion_rate: number;
    avg_score_after: number;
    engagement_level: 'high' | 'medium' | 'low';
    common_struggles: string[];
    improvement_suggestions: string[];
  }>;
  quiz_effectiveness: Array<{
    quiz_id: string;
    difficulty_alignment: 'too_easy' | 'appropriate' | 'too_hard';
    avg_score: number;
    pass_rate: number;
    discrimination_index: number;
    problematic_questions: string[];
  }>;
  content_gaps: Array<{
    topic: string;
    gap_description: string;
    evidence: string[];
    recommended_action: string;
  }>;
  top_performing_content: string[];
  needs_revision: string[];
}

export interface PredictiveInsights {
  predictions: {
    expected_completion_rate: number;
    expected_avg_score: number;
    churn_risk_students: number;
    estimated_time_to_complete_avg: number;
  };
  forecasts: Array<{
    metric: string;
    current_value: number;
    predicted_value_30d: number;
    predicted_value_90d: number;
    confidence: number;
    trend: 'up' | 'stable' | 'down';
  }>;
  opportunities: Array<{
    type: 'engagement' | 'conversion' | 'retention' | 'satisfaction';
    description: string;
    potential_impact: 'alto' | 'medio' | 'bajo';
    suggested_action: string;
  }>;
  risks: Array<{
    type: 'churn' | 'low_engagement' | 'poor_performance';
    probability: number;
    impact: 'alto' | 'medio' | 'bajo';
    mitigation: string;
  }>;
}

type AnalyticsAction = 'course_overview' | 'student_performance' | 'engagement_trends' | 'content_effectiveness' | 'predictive_insights';
type Status = 'idle' | 'loading' | 'success' | 'error';

export function useAcademiaAnalytics() {
  const [status, setStatus] = useState<Status>('idle');
  const [courseOverview, setCourseOverview] = useState<CourseOverview | null>(null);
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance | null>(null);
  const [engagementTrends, setEngagementTrends] = useState<EngagementTrends | null>(null);
  const [contentEffectiveness, setContentEffectiveness] = useState<ContentEffectiveness | null>(null);
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (
    action: AnalyticsAction,
    courseId?: string,
    userId?: string,
    dateRange?: { start: string; end: string }
  ) => {
    setStatus('loading');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-analytics',
        {
          body: {
            action,
            course_id: courseId,
            user_id: userId,
            date_range: dateRange
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        switch (action) {
          case 'course_overview':
            setCourseOverview(data.data as CourseOverview);
            break;
          case 'student_performance':
            setStudentPerformance(data.data as StudentPerformance);
            break;
          case 'engagement_trends':
            setEngagementTrends(data.data as EngagementTrends);
            break;
          case 'content_effectiveness':
            setContentEffectiveness(data.data as ContentEffectiveness);
            break;
          case 'predictive_insights':
            setPredictiveInsights(data.data as PredictiveInsights);
            break;
        }
        setStatus('success');
        return data.data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al obtener analytics';
      setError(message);
      setStatus('error');
      toast.error(message);
      return null;
    }
  }, []);

  const getCourseOverview = useCallback((courseId?: string) => 
    fetchAnalytics('course_overview', courseId), [fetchAnalytics]);

  const getStudentPerformance = useCallback((courseId?: string) => 
    fetchAnalytics('student_performance', courseId), [fetchAnalytics]);

  const getEngagementTrends = useCallback((courseId?: string) => 
    fetchAnalytics('engagement_trends', courseId), [fetchAnalytics]);

  const getContentEffectiveness = useCallback((courseId?: string) => 
    fetchAnalytics('content_effectiveness', courseId), [fetchAnalytics]);

  const getPredictiveInsights = useCallback((courseId?: string) => 
    fetchAnalytics('predictive_insights', courseId), [fetchAnalytics]);

  const reset = useCallback(() => {
    setStatus('idle');
    setCourseOverview(null);
    setStudentPerformance(null);
    setEngagementTrends(null);
    setContentEffectiveness(null);
    setPredictiveInsights(null);
    setError(null);
  }, []);

  return {
    // State
    status,
    courseOverview,
    studentPerformance,
    engagementTrends,
    contentEffectiveness,
    predictiveInsights,
    error,
    // Status helpers
    isIdle: status === 'idle',
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    // Actions
    getCourseOverview,
    getStudentPerformance,
    getEngagementTrends,
    getContentEffectiveness,
    getPredictiveInsights,
    reset,
  };
}

export default useAcademiaAnalytics;
