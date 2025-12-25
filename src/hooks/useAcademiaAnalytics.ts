/**
 * useAcademiaAnalytics - Hook para analytics del sistema de formación
 * Proporciona métricas, reportes y datos para el dashboard administrativo
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Interfaces
export interface CourseMetrics {
  courseId: string;
  courseName: string;
  totalEnrollments: number;
  completedEnrollments: number;
  activeEnrollments: number;
  completionRate: number;
  avgProgress: number;
  avgScore: number;
  totalTimeSpent: number;
  certificatesIssued: number;
}

export interface UserMetrics {
  userId: string;
  userName: string;
  email: string;
  enrolledCourses: number;
  completedCourses: number;
  totalXP: number;
  level: number;
  certificatesEarned: number;
  lastActivity: string;
  avgScore: number;
}

export interface OverviewMetrics {
  totalUsers: number;
  totalEnrollments: number;
  totalCompletions: number;
  totalCertificates: number;
  avgCompletionRate: number;
  avgScore: number;
  activeUsersLast7Days: number;
  activeUsersLast30Days: number;
  totalTimeSpentHours: number;
  coursesAvailable: number;
}

export interface TimeSeriesData {
  date: string;
  enrollments: number;
  completions: number;
  certificates: number;
}

export interface TopPerformer {
  userId: string;
  userName: string;
  xp: number;
  level: number;
  completedCourses: number;
  certificates: number;
}

export function useAcademiaAnalytics() {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
  });

  // Fetch overview metrics
  const { data: overviewMetrics, isLoading: loadingOverview, refetch: refetchOverview } = useQuery({
    queryKey: ['academia-analytics-overview', dateRange],
    queryFn: async (): Promise<OverviewMetrics> => {
      // Fetch enrollments
      const { data: enrollments, error: enrollError } = await supabase
        .from('training_enrollments')
        .select('id, status, progress_percentage, time_spent_minutes, created_at, last_accessed_at');

      if (enrollError) throw enrollError;

      // Fetch certificates
      const { data: certificates, error: certError } = await supabase
        .from('training_certificates')
        .select('id, score');

      if (certError) throw certError;

      // Fetch courses
      const { data: courses, error: coursesError } = await supabase
        .from('training_courses')
        .select('id')
        .eq('is_published', true);

      if (coursesError) throw coursesError;

      // Get unique user count from enrollments
      const uniqueUsers = new Set(enrollments?.map(e => (e as { user_id?: string }).user_id).filter(Boolean));

      // Calculate metrics
      const totalEnrollments = enrollments?.length || 0;
      const completedEnrollments = enrollments?.filter(e => e.status === 'completed').length || 0;
      const totalCertificates = certificates?.length || 0;
      const avgScore = certificates?.length 
        ? certificates.reduce((acc, c) => acc + (c.score || 0), 0) / certificates.length
        : 0;
      const avgCompletionRate = totalEnrollments > 0 
        ? (completedEnrollments / totalEnrollments) * 100 
        : 0;
      const totalTimeSpentMinutes = enrollments?.reduce((acc, e) => acc + (e.time_spent_minutes || 0), 0) || 0;

      // Active users calculation
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const activeUsersLast7Days = new Set(
        enrollments?.filter(e => e.last_accessed_at && new Date(e.last_accessed_at) >= sevenDaysAgo)
          .map(e => (e as { user_id?: string }).user_id)
          .filter(Boolean)
      ).size;

      const activeUsersLast30Days = new Set(
        enrollments?.filter(e => e.last_accessed_at && new Date(e.last_accessed_at) >= thirtyDaysAgo)
          .map(e => (e as { user_id?: string }).user_id)
          .filter(Boolean)
      ).size;

      return {
        totalUsers: uniqueUsers.size,
        totalEnrollments,
        totalCompletions: completedEnrollments,
        totalCertificates,
        avgCompletionRate: Math.round(avgCompletionRate * 10) / 10,
        avgScore: Math.round(avgScore * 10) / 10,
        activeUsersLast7Days,
        activeUsersLast30Days,
        totalTimeSpentHours: Math.round(totalTimeSpentMinutes / 60),
        coursesAvailable: courses?.length || 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch course metrics
  const { data: courseMetrics, isLoading: loadingCourses, refetch: refetchCourses } = useQuery({
    queryKey: ['academia-analytics-courses'],
    queryFn: async (): Promise<CourseMetrics[]> => {
      // Get all courses
      const { data: courses, error: coursesError } = await supabase
        .from('training_courses')
        .select('id, title')
        .eq('is_published', true);

      if (coursesError) throw coursesError;

      // Get enrollments
      const { data: enrollments, error: enrollError } = await supabase
        .from('training_enrollments')
        .select('course_id, status, progress_percentage, time_spent_minutes');

      if (enrollError) throw enrollError;

      // Get certificates
      const { data: certificates, error: certError } = await supabase
        .from('training_certificates')
        .select('course_id, score');

      if (certError) throw certError;

      // Calculate metrics per course
      return (courses || []).map(course => {
        const courseTitle = typeof course.title === 'string' 
          ? course.title 
          : (course.title as { es?: string; en?: string })?.es || 'Curso';
        
        const courseEnrollments = enrollments?.filter(e => e.course_id === course.id) || [];
        const courseCerts = certificates?.filter(c => c.course_id === course.id) || [];
        
        const completed = courseEnrollments.filter(e => e.status === 'completed').length;
        const active = courseEnrollments.filter(e => e.status === 'active').length;
        const avgProgress = courseEnrollments.length > 0
          ? courseEnrollments.reduce((acc, e) => acc + (e.progress_percentage || 0), 0) / courseEnrollments.length
          : 0;
        const avgScore = courseCerts.length > 0
          ? courseCerts.reduce((acc, c) => acc + (c.score || 0), 0) / courseCerts.length
          : 0;
        const totalTime = courseEnrollments.reduce((acc, e) => acc + (e.time_spent_minutes || 0), 0);

        return {
          courseId: course.id,
          courseName: courseTitle,
          totalEnrollments: courseEnrollments.length,
          completedEnrollments: completed,
          activeEnrollments: active,
          completionRate: courseEnrollments.length > 0 ? (completed / courseEnrollments.length) * 100 : 0,
          avgProgress: Math.round(avgProgress),
          avgScore: Math.round(avgScore),
          totalTimeSpent: totalTime,
          certificatesIssued: courseCerts.length,
        };
      }).sort((a, b) => b.totalEnrollments - a.totalEnrollments);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch top performers from certificates (simplified approach)
  const { data: topPerformers, isLoading: loadingPerformers } = useQuery({
    queryKey: ['academia-analytics-top-performers'],
    queryFn: async (): Promise<TopPerformer[]> => {
      // Get certificates with user info
      const { data: certificates, error } = await supabase
        .from('training_certificates')
        .select('user_id, score')
        .order('score', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Aggregate by user
      const userStats = new Map<string, { certs: number; totalScore: number }>();
      certificates?.forEach(c => {
        const userId = c.user_id;
        const existing = userStats.get(userId) || { certs: 0, totalScore: 0 };
        userStats.set(userId, {
          certs: existing.certs + 1,
          totalScore: existing.totalScore + (c.score || 0),
        });
      });

      // Get user profiles
      const userIds = Array.from(userStats.keys());
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      return Array.from(userStats.entries())
        .map(([userId, stats]) => ({
          userId,
          userName: profileMap.get(userId)?.full_name || 'Usuario',
          xp: stats.totalScore * 10,
          level: Math.floor(stats.certs / 2) + 1,
          completedCourses: stats.certs,
          certificates: stats.certs,
        }))
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 10);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch time series data
  const { data: timeSeriesData, isLoading: loadingTimeSeries } = useQuery({
    queryKey: ['academia-analytics-timeseries', dateRange],
    queryFn: async (): Promise<TimeSeriesData[]> => {
      const { data: enrollments, error: enrollError } = await supabase
        .from('training_enrollments')
        .select('created_at, completed_at')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (enrollError) throw enrollError;

      const { data: certificates, error: certError } = await supabase
        .from('training_certificates')
        .select('issued_at')
        .gte('issued_at', dateRange.start.toISOString())
        .lte('issued_at', dateRange.end.toISOString());

      if (certError) throw certError;

      // Group by date
      const dataMap = new Map<string, TimeSeriesData>();
      
      // Initialize all days in range
      const current = new Date(dateRange.start);
      while (current <= dateRange.end) {
        const dateStr = current.toISOString().split('T')[0];
        dataMap.set(dateStr, { date: dateStr, enrollments: 0, completions: 0, certificates: 0 });
        current.setDate(current.getDate() + 1);
      }

      // Count enrollments
      enrollments?.forEach(e => {
        const date = e.created_at.split('T')[0];
        const data = dataMap.get(date);
        if (data) data.enrollments++;
        
        if (e.completed_at) {
          const completedDate = e.completed_at.split('T')[0];
          const completedData = dataMap.get(completedDate);
          if (completedData) completedData.completions++;
        }
      });

      // Count certificates
      certificates?.forEach(c => {
        const date = c.issued_at.split('T')[0];
        const data = dataMap.get(date);
        if (data) data.certificates++;
      });

      return Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Export to CSV
  const exportToCSV = useCallback(<T extends Record<string, unknown>>(data: T[], filename: string) => {
    if (!data.length) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

  // Refresh all data
  const refreshAll = useCallback(() => {
    refetchOverview();
    refetchCourses();
  }, [refetchOverview, refetchCourses]);

  return {
    // Data
    overviewMetrics,
    courseMetrics,
    topPerformers,
    timeSeriesData,
    // Loading states
    isLoading: loadingOverview || loadingCourses || loadingPerformers || loadingTimeSeries,
    loadingOverview,
    loadingCourses,
    loadingPerformers,
    loadingTimeSeries,
    // Actions
    setDateRange,
    dateRange,
    exportToCSV,
    refreshAll,
  };
}

export default useAcademiaAnalytics;
