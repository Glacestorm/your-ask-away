/**
 * useGamification - Hook para sistema de gamificación
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export interface UserPoints {
  totalPoints: number;
  currentLevel: number;
  experiencePoints: number;
  streakDays: number;
  longestStreak: number;
  weeklyPoints: number;
  monthlyPoints: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  earnedAt: string;
  badgeUrl?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatarUrl?: string;
  totalPoints: number;
  lessonsCompleted: number;
  quizzesPassed: number;
}

export interface LevelProgress {
  current: number;
  progress: number;
  xpToNextLevel: number;
}

export interface PointTransaction {
  id: string;
  points: number;
  type: string;
  source: string;
  description: string;
  createdAt: string;
}

interface UseGamificationOptions {
  courseId?: string;
  autoLoad?: boolean;
}

export function useGamification(options: UseGamificationOptions = {}) {
  const { courseId, autoLoad = true } = options;
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [level, setLevel] = useState<LevelProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<PointTransaction[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  // Load user stats
  const loadStats = useCallback(async () => {
    if (!user) return null;

    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('academia-gamification', {
        body: {
          action: 'get_stats',
        },
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        const { points, level: levelData, achievements: achievementsData, recentTransactions: transactions, streak } = data.data;

        setUserPoints({
          totalPoints: points?.total_points || 0,
          currentLevel: points?.current_level || 1,
          experiencePoints: points?.experience_points || 0,
          streakDays: streak?.current || 0,
          longestStreak: streak?.longest || 0,
          weeklyPoints: points?.weekly_points || 0,
          monthlyPoints: points?.monthly_points || 0,
        });

        setLevel({
          current: levelData?.current || 1,
          progress: levelData?.progress || 0,
          xpToNextLevel: levelData?.xpToNextLevel || 100,
        });

        setAchievements(
          achievementsData?.map((a: any) => ({
            id: a.achievement_id,
            name: a.achievement?.name || 'Logro',
            description: a.achievement?.description || '',
            icon: a.achievement?.icon || '🏆',
            points: a.achievement?.points || 0,
            earnedAt: a.earned_at,
            badgeUrl: a.achievement?.badge_url,
          })) || []
        );

        setRecentTransactions(
          transactions?.map((t: any) => ({
            id: t.id,
            points: t.points,
            type: t.transaction_type,
            source: t.source,
            description: t.description || '',
            createdAt: t.created_at,
          })) || []
        );

        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useGamification] loadStats error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load leaderboard
  const loadLeaderboard = useCallback(async (periodType: 'weekly' | 'monthly' | 'all_time' = 'weekly') => {
    if (!user) return null;

    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('academia-gamification', {
        body: {
          action: 'get_leaderboard',
          courseId,
          periodType,
        },
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        const entries = data.data.leaderboard?.map((e: any) => ({
          rank: e.rank,
          userId: e.user_id,
          userName: e.profile?.full_name || 'Usuario',
          avatarUrl: e.profile?.avatar_url,
          totalPoints: e.total_points,
          lessonsCompleted: e.lessons_completed,
          quizzesPassed: e.quizzes_passed,
        })) || [];

        setLeaderboard(entries);
        setUserRank(data.data.userRank);

        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useGamification] loadLeaderboard error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, courseId]);

  // Check for new achievements
  const checkAchievements = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('academia-gamification', {
        body: {
          action: 'check_achievements',
        },
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data?.newlyEarned?.length > 0) {
        // Load full achievement details
        const { data: achievementDetails } = await supabase
          .from('academia_achievements')
          .select('*')
          .in('id', data.data.newlyEarned);

        const newlyEarned = achievementDetails?.map((a: any) => ({
          id: a.id,
          name: a.name,
          description: a.description || '',
          icon: a.icon || '🏆',
          points: a.points || 0,
          earnedAt: new Date().toISOString(),
          badgeUrl: a.badge_url,
        })) || [];

        setNewAchievements(newlyEarned);

        // Show toast for each new achievement
        newlyEarned.forEach((achievement) => {
          toast.success(`🏆 ¡Logro desbloqueado: ${achievement.name}!`, {
            description: `+${achievement.points} puntos`,
            duration: 5000,
          });
        });

        // Reload stats to update achievements list
        await loadStats();

        return newlyEarned;
      }

      return [];
    } catch (err) {
      console.error('[useGamification] checkAchievements error:', err);
      return null;
    }
  }, [user, loadStats]);

  // Award points
  const awardPoints = useCallback(async (
    points: number,
    source: string,
    description?: string,
    sourceId?: string
  ) => {
    if (!user) return false;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('academia-gamification', {
        body: {
          action: 'award_points',
          points,
          source,
          sourceId,
          description,
        },
      });

      if (fnError) throw fnError;

      if (data?.success) {
        // Reload stats and check achievements
        await loadStats();
        await checkAchievements();
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useGamification] awardPoints error:', err);
      return false;
    }
  }, [user, loadStats, checkAchievements]);

  // Update streak
  const updateStreak = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('academia-gamification', {
        body: {
          action: 'update_streak',
        },
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        const { streak, streakBonus } = data.data;

        if (streakBonus > 0) {
          toast.success(`🔥 ¡Racha de ${streak} días!`, {
            description: `+${streakBonus} puntos bonus`,
          });
        }

        // Reload stats
        await loadStats();

        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useGamification] updateStreak error:', err);
      return null;
    }
  }, [user, loadStats]);

  // Clear new achievements notification
  const clearNewAchievements = useCallback(() => {
    setNewAchievements([]);
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && user) {
      loadStats();
    }
  }, [autoLoad, user, loadStats]);

  return {
    // State
    isLoading,
    userPoints,
    level,
    achievements,
    recentTransactions,
    leaderboard,
    userRank,
    newAchievements,
    // Actions
    loadStats,
    loadLeaderboard,
    checkAchievements,
    awardPoints,
    updateStreak,
    clearNewAchievements,
  };
}

export default useGamification;
