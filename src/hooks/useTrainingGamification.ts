/**
 * useTrainingGamification - Hook para gestionar gamificación de cursos
 * XP, badges, leaderboard, streaks
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface StudentBadge {
  id: string;
  user_id: string;
  badge_key: string;
  badge_name: Record<string, string>;
  badge_description: Record<string, string>;
  badge_icon: string | null;
  badge_color: string;
  category: string;
  points_awarded: number;
  metadata: Record<string, unknown>;
  earned_at: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  total_xp: number;
  level: number;
  courses_completed: number;
  quizzes_passed: number;
  certificates_earned: number;
  badges_count: number;
  current_streak_days: number;
  longest_streak_days: number;
  rank_position: number | null;
  // Joined from profiles
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface XPTransaction {
  id: string;
  xp_type: string;
  points: number;
  source_type: string | null;
  source_id: string | null;
  description: string | null;
  earned_at: string;
}

// XP rewards config
const XP_REWARDS = {
  lesson_complete: 10,
  module_complete: 50,
  course_complete: 200,
  quiz_pass: 30,
  quiz_perfect: 50,
  first_lesson: 20,
  streak_day: 5,
  certificate_earned: 100,
};

// Badge definitions
const BADGE_DEFINITIONS = {
  first_lesson: {
    name: { es: 'Primera Lección', en: 'First Lesson' },
    description: { es: 'Completaste tu primera lección', en: 'Completed your first lesson' },
    icon: '🎯',
    color: 'blue',
    points: 20,
  },
  course_complete: {
    name: { es: 'Curso Completado', en: 'Course Complete' },
    description: { es: 'Completaste un curso completo', en: 'Completed a full course' },
    icon: '🏆',
    color: 'gold',
    points: 100,
  },
  quiz_master: {
    name: { es: 'Maestro del Quiz', en: 'Quiz Master' },
    description: { es: 'Obtuviste 100% en un quiz', en: 'Got 100% on a quiz' },
    icon: '🧠',
    color: 'purple',
    points: 50,
  },
  streak_7: {
    name: { es: 'Racha de 7 días', en: '7-Day Streak' },
    description: { es: 'Estudiaste 7 días seguidos', en: 'Studied 7 days in a row' },
    icon: '🔥',
    color: 'orange',
    points: 70,
  },
  streak_30: {
    name: { es: 'Racha de 30 días', en: '30-Day Streak' },
    description: { es: 'Estudiaste 30 días seguidos', en: 'Studied 30 days in a row' },
    icon: '💎',
    color: 'diamond',
    points: 300,
  },
  top_10: {
    name: { es: 'Top 10', en: 'Top 10' },
    description: { es: 'Llegaste al top 10 del ranking', en: 'Reached top 10 in ranking' },
    icon: '🥇',
    color: 'gold',
    points: 150,
  },
  certified: {
    name: { es: 'Certificado', en: 'Certified' },
    description: { es: 'Obtuviste tu primer certificado', en: 'Earned your first certificate' },
    icon: '📜',
    color: 'green',
    points: 100,
  },
  fast_learner: {
    name: { es: 'Aprendiz Veloz', en: 'Fast Learner' },
    description: { es: 'Completaste un curso en menos de una semana', en: 'Completed a course in less than a week' },
    icon: '⚡',
    color: 'yellow',
    points: 80,
  },
};

// Level names
const LEVEL_NAMES: Record<number, { es: string; en: string }> = {
  1: { es: 'Novato', en: 'Novice' },
  2: { es: 'Aprendiz', en: 'Apprentice' },
  3: { es: 'Estudiante', en: 'Student' },
  4: { es: 'Practicante', en: 'Practitioner' },
  5: { es: 'Competente', en: 'Competent' },
  6: { es: 'Experto', en: 'Expert' },
  7: { es: 'Maestro', en: 'Master' },
  8: { es: 'Gurú', en: 'Guru' },
  9: { es: 'Leyenda', en: 'Legend' },
  10: { es: 'Campeón', en: 'Champion' },
};

export function useTrainingGamification() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [myStats, setMyStats] = useState<LeaderboardEntry | null>(null);
  const [myBadges, setMyBadges] = useState<StudentBadge[]>([]);
  const [myXPHistory, setMyXPHistory] = useState<XPTransaction[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch user stats
  const fetchMyStats = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const { data, error: fetchError } = await supabase
        .from('training_leaderboard')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      setMyStats(data);
      return data;
    } catch (err) {
      console.error('[useTrainingGamification] fetchMyStats error:', err);
      return null;
    }
  }, [user?.id]);

  // Fetch user badges
  const fetchMyBadges = useCallback(async () => {
    if (!user?.id) return [];

    try {
      const { data, error: fetchError } = await supabase
        .from('training_student_badges')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (fetchError) throw fetchError;

      const badges = (data || []).map((b: Record<string, unknown>) => ({
        id: b.id as string,
        user_id: b.user_id as string,
        badge_key: b.badge_key as string,
        badge_name: (b.badge_name as Record<string, string>) || {},
        badge_description: (b.badge_description as Record<string, string>) || {},
        badge_icon: b.badge_icon as string | null,
        badge_color: b.badge_color as string,
        category: b.category as string,
        points_awarded: b.points_awarded as number,
        metadata: (b.metadata as Record<string, unknown>) || {},
        earned_at: b.earned_at as string,
      }));

      setMyBadges(badges);
      return badges;
    } catch (err) {
      console.error('[useTrainingGamification] fetchMyBadges error:', err);
      return [];
    }
  }, [user?.id]);

  // Fetch XP history
  const fetchMyXPHistory = useCallback(async (limit = 20) => {
    if (!user?.id) return [];

    try {
      const { data, error: fetchError } = await supabase
        .from('training_student_xp')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      const xpHistory = (data || []).map((x: Record<string, unknown>) => ({
        id: x.id as string,
        xp_type: x.xp_type as string,
        points: x.points as number,
        source_type: x.source_type as string | null,
        source_id: x.source_id as string | null,
        description: x.description as string | null,
        earned_at: x.earned_at as string,
      }));

      setMyXPHistory(xpHistory);
      return xpHistory;
    } catch (err) {
      console.error('[useTrainingGamification] fetchMyXPHistory error:', err);
      return [];
    }
  }, [user?.id]);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async (limit = 10) => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('training_leaderboard')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .order('total_xp', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      const entries = (data || []).map((entry: Record<string, unknown>, index: number) => ({
        id: entry.id as string,
        user_id: entry.user_id as string,
        total_xp: entry.total_xp as number,
        level: entry.level as number,
        courses_completed: entry.courses_completed as number,
        quizzes_passed: entry.quizzes_passed as number,
        certificates_earned: entry.certificates_earned as number,
        badges_count: entry.badges_count as number,
        current_streak_days: entry.current_streak_days as number,
        longest_streak_days: entry.longest_streak_days as number,
        rank_position: index + 1,
        profile: entry.profiles as { full_name: string | null; avatar_url: string | null } | undefined,
      }));

      setLeaderboard(entries);
      return entries;
    } catch (err) {
      console.error('[useTrainingGamification] fetchLeaderboard error:', err);
      setError('Error fetching leaderboard');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Award XP
  const awardXP = useCallback(async (
    xpType: keyof typeof XP_REWARDS,
    sourceType?: string,
    sourceId?: string,
    description?: string,
    customPoints?: number
  ) => {
    if (!user?.id) return false;

    const points = customPoints ?? XP_REWARDS[xpType];
    
    try {
      const { error: insertError } = await supabase
        .from('training_student_xp')
        .insert({
          user_id: user.id,
          xp_type: xpType,
          points,
          source_type: sourceType || null,
          source_id: sourceId || null,
          description: description || null,
        });

      if (insertError) throw insertError;

      toast.success(`+${points} XP`, {
        description: description || `¡Has ganado experiencia!`,
        duration: 2000,
      });

      // Refresh stats
      await fetchMyStats();
      return true;
    } catch (err) {
      console.error('[useTrainingGamification] awardXP error:', err);
      return false;
    }
  }, [user?.id, fetchMyStats]);

  // Award badge
  const awardBadge = useCallback(async (badgeKey: keyof typeof BADGE_DEFINITIONS) => {
    if (!user?.id) return false;

    const badgeDef = BADGE_DEFINITIONS[badgeKey];
    if (!badgeDef) return false;

    try {
      // Check if already has badge
      const { data: existing } = await supabase
        .from('training_student_badges')
        .select('id')
        .eq('user_id', user.id)
        .eq('badge_key', badgeKey)
        .maybeSingle();

      if (existing) return false; // Already has badge

      const { error: insertError } = await supabase
        .from('training_student_badges')
        .insert({
          user_id: user.id,
          badge_key: badgeKey,
          badge_name: badgeDef.name,
          badge_description: badgeDef.description,
          badge_icon: badgeDef.icon,
          badge_color: badgeDef.color,
          points_awarded: badgeDef.points,
          category: 'achievement',
        });

      if (insertError) throw insertError;

      // Award XP for badge
      await awardXP('lesson_complete', 'badge', badgeKey, `Badge: ${badgeDef.name.es}`, badgeDef.points);

      // Update badge count
      await supabase.rpc('update_leaderboard_counters', {
        p_user_id: user.id,
        p_counter: 'badges_count',
        p_increment: 1,
      });

      toast.success(`🏅 ¡Nuevo badge desbloqueado!`, {
        description: `${badgeDef.icon} ${badgeDef.name.es}`,
        duration: 4000,
      });

      await fetchMyBadges();
      return true;
    } catch (err) {
      console.error('[useTrainingGamification] awardBadge error:', err);
      return false;
    }
  }, [user?.id, awardXP, fetchMyBadges]);

  // Get level info
  const getLevelInfo = useCallback((level: number) => {
    const xpThresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000];
    const currentThreshold = xpThresholds[level - 1] || 0;
    const nextThreshold = xpThresholds[level] || 12000;
    const levelName = LEVEL_NAMES[level] || { es: 'Desconocido', en: 'Unknown' };

    return {
      level,
      name: levelName,
      xpToNext: nextThreshold,
      xpCurrent: currentThreshold,
    };
  }, []);

  // Calculate progress to next level
  const getProgressToNextLevel = useCallback((totalXP: number, currentLevel: number) => {
    const levelInfo = getLevelInfo(currentLevel);
    const nextLevelInfo = getLevelInfo(currentLevel + 1);
    
    const xpInCurrentLevel = totalXP - levelInfo.xpCurrent;
    const xpNeededForLevel = nextLevelInfo.xpCurrent - levelInfo.xpCurrent;
    const progress = Math.min((xpInCurrentLevel / xpNeededForLevel) * 100, 100);

    return {
      progress,
      xpInLevel: xpInCurrentLevel,
      xpNeeded: xpNeededForLevel,
      xpRemaining: xpNeededForLevel - xpInCurrentLevel,
    };
  }, [getLevelInfo]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      fetchMyStats();
      fetchMyBadges();
      fetchLeaderboard();
    }
  }, [user?.id, fetchMyStats, fetchMyBadges, fetchLeaderboard]);

  return {
    // State
    loading,
    error,
    myStats,
    myBadges,
    myXPHistory,
    leaderboard,
    // Actions
    fetchMyStats,
    fetchMyBadges,
    fetchMyXPHistory,
    fetchLeaderboard,
    awardXP,
    awardBadge,
    // Helpers
    getLevelInfo,
    getProgressToNextLevel,
    // Constants
    XP_REWARDS,
    BADGE_DEFINITIONS,
    LEVEL_NAMES,
  };
}

export default useTrainingGamification;
