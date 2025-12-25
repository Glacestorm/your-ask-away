/**
 * useTrainingEnrollments - Hook para gestionar inscripciones a cursos
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  enrollment_type: string;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  last_accessed_at: string | null;
  progress_percentage: number;
  time_spent_minutes: number;
  certificate_issued: boolean;
  certificate_id: string | null;
  created_at: string;
  course?: {
    id: string;
    title: { es: string; en: string } | string;
    description?: { es: string; en: string } | string;
    thumbnail_url?: string;
    duration_hours?: number;
    difficulty_level?: string;
  };
}

export function useTrainingEnrollments() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user enrollments
  const fetchMyEnrollments = useCallback(async () => {
    if (!user?.id) return [];

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('training_enrollments')
        .select(`
          *,
          training_courses:course_id (
            id,
            title,
            description,
            thumbnail_url,
            duration_hours,
            difficulty_level
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const transformedData = (data || []).map((e: Record<string, unknown>) => ({
        id: e.id as string,
        user_id: e.user_id as string,
        course_id: e.course_id as string,
        status: e.status as Enrollment['status'],
        enrollment_type: e.enrollment_type as string,
        started_at: e.started_at as string | null,
        completed_at: e.completed_at as string | null,
        expires_at: e.expires_at as string | null,
        last_accessed_at: e.last_accessed_at as string | null,
        progress_percentage: Number(e.progress_percentage) || 0,
        time_spent_minutes: Number(e.time_spent_minutes) || 0,
        certificate_issued: Boolean(e.certificate_issued),
        certificate_id: e.certificate_id as string | null,
        created_at: e.created_at as string,
        course: e.training_courses as Enrollment['course'],
      }));

      setEnrollments(transformedData);
      return transformedData;
    } catch (err) {
      console.error('[useTrainingEnrollments] fetchMyEnrollments error:', err);
      setError('Error al cargar inscripciones');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Get enrollment stats
  const getStats = useCallback(() => {
    const active = enrollments.filter(e => e.status === 'active').length;
    const completed = enrollments.filter(e => e.status === 'completed').length;
    const totalTimeMinutes = enrollments.reduce((acc, e) => acc + e.time_spent_minutes, 0);
    const avgProgress = enrollments.length > 0
      ? enrollments.reduce((acc, e) => acc + e.progress_percentage, 0) / enrollments.length
      : 0;

    return {
      total: enrollments.length,
      active,
      completed,
      totalTimeMinutes,
      totalTimeHours: Math.round(totalTimeMinutes / 60),
      avgProgress: Math.round(avgProgress),
    };
  }, [enrollments]);

  // Initial fetch
  useEffect(() => {
    if (user?.id) {
      fetchMyEnrollments();
    }
  }, [user?.id, fetchMyEnrollments]);

  return {
    enrollments,
    loading,
    error,
    fetchMyEnrollments,
    getStats,
  };
}

export default useTrainingEnrollments;
