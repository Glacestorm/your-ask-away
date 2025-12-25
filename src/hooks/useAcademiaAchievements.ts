/**
 * useAcademiaAchievements - Hook para logros y gamificación
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  badge_url: string | null;
  points: number | null;
  criteria: Record<string, unknown> | null;
  is_active: boolean | null;
  created_at: string | null;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string | null;
  metadata: Record<string, unknown> | null;
  achievement?: Achievement;
}

export function useAcademiaAchievements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // === ALL ACHIEVEMENTS ===
  const achievementsQuery = useQuery({
    queryKey: ['academia-achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academia_achievements')
        .select('*')
        .eq('is_active', true)
        .order('points', { ascending: false });

      if (error) throw error;
      return data as Achievement[];
    },
  });

  // === USER ACHIEVEMENTS ===
  const userAchievementsQuery = useQuery({
    queryKey: ['academia-user-achievements', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('academia_user_achievements')
        .select(`
          *,
          achievement:academia_achievements(*)
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data as UserAchievement[];
    },
    enabled: !!user?.id,
  });

  // === TOTAL POINTS ===
  const totalPoints = (userAchievementsQuery.data || []).reduce((sum, ua) => {
    return sum + (ua.achievement?.points || 0);
  }, 0);

  // === UNLOCK ACHIEVEMENT ===
  const unlockAchievementMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      if (!user?.id) throw new Error('Usuario no autenticado');

      // Check if already unlocked
      const existing = userAchievementsQuery.data?.find(
        ua => ua.achievement_id === achievementId
      );
      if (existing) {
        throw new Error('Logro ya desbloqueado');
      }

      const { data, error } = await supabase
        .from('academia_user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievementId,
          earned_at: new Date().toISOString(),
        })
        .select(`
          *,
          achievement:academia_achievements(*)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['academia-user-achievements'] });
      const achievement = data.achievement;
      if (achievement) {
        toast.success(`🏆 ¡Logro desbloqueado: ${achievement.name}!`);
      }
    },
    onError: (error) => {
      if (error.message !== 'Logro ya desbloqueado') {
        console.error('Unlock achievement error:', error);
        toast.error('Error al desbloquear logro');
      }
    },
  });

  // === CHECK CRITERIA ===
  const checkAndUnlockAchievements = async (criteria: {
    coursesCompleted?: number;
    lessonsCompleted?: number;
    certificatesEarned?: number;
    postsCreated?: number;
    commentsAdded?: number;
    streakDays?: number;
  }) => {
    const allAchievements = achievementsQuery.data || [];
    const unlockedIds = new Set((userAchievementsQuery.data || []).map(ua => ua.achievement_id));

    for (const achievement of allAchievements) {
      if (unlockedIds.has(achievement.id)) continue;

      const achCriteria = achievement.criteria as Record<string, number> | null;
      if (!achCriteria) continue;

      let shouldUnlock = true;

      // Check each criterion
      for (const [key, required] of Object.entries(achCriteria)) {
        const current = criteria[key as keyof typeof criteria] || 0;
        if (current < required) {
          shouldUnlock = false;
          break;
        }
      }

      if (shouldUnlock) {
        unlockAchievementMutation.mutate(achievement.id);
      }
    }
  };

  return {
    achievements: achievementsQuery.data || [],
    userAchievements: userAchievementsQuery.data || [],
    totalPoints,
    loading: achievementsQuery.isLoading || userAchievementsQuery.isLoading,
    unlockAchievement: unlockAchievementMutation.mutate,
    checkAndUnlockAchievements,
    refetch: () => {
      achievementsQuery.refetch();
      userAchievementsQuery.refetch();
    },
  };
}

export default useAcademiaAchievements;
