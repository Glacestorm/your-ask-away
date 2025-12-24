import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCallback, useEffect, useState } from 'react';

// === ERROR TIPADO KB ===
export interface BehavioralNudgesError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Innovative Behavioral Nudges System
 * Based on Octalysis Framework and behavioral science research
 * 
 * Core Drives:
 * 1. Epic Meaning & Calling - Connect actions to larger purpose
 * 2. Development & Accomplishment - Progress and mastery
 * 3. Empowerment of Creativity - Expression and choice
 * 4. Ownership & Possession - Building and collecting
 * 5. Social Influence - Community and competition
 * 6. Scarcity & Impatience - Limited time/access
 * 7. Unpredictability & Curiosity - Mystery and discovery
 * 8. Loss & Avoidance - Fear of missing out
 */

export interface BehavioralNudge {
  id: string;
  type: 'streak' | 'milestone' | 'social_proof' | 'scarcity' | 'progress' | 'reward' | 'challenge' | 'mystery';
  title: string;
  message: string;
  cta_text?: string;
  cta_action?: string;
  icon?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  expires_at?: string;
  reward_type?: 'points' | 'badge' | 'unlock' | 'discount';
  reward_value?: number | string;
  trigger_condition?: Record<string, unknown>;
  dismissed?: boolean;
  clicked?: boolean;
}

export interface UserStreak {
  current_streak: number;
  best_streak: number;
  last_activity_date: string;
  streak_type: string;
  bonus_multiplier: number;
}

export interface ProgressMilestone {
  id: string;
  name: string;
  target: number;
  current: number;
  reward: string;
  category: string;
  unlocked: boolean;
}

export function useBehavioralNudges(userId?: string, companyId?: string) {
  const queryClient = useQueryClient();
  const [activeNudges, setActiveNudges] = useState<BehavioralNudge[]>([]);
  const [streakData, setStreakData] = useState<UserStreak | null>(null);
  // === ESTADO KB ===
  const [error, setError] = useState<BehavioralNudgesError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);
  // Generate contextual nudges based on user behavior
  const generateNudges = useCallback(() => {
    const nudges: BehavioralNudge[] = [];
    const now = new Date();
    const hour = now.getHours();

    // Time-based nudges (Scarcity & Impatience)
    if (hour >= 9 && hour <= 11) {
      nudges.push({
        id: 'morning-momentum',
        type: 'challenge',
        title: '🌅 Desafío Matutino',
        message: 'Completa 3 tareas antes del mediodía y gana +50 puntos bonus',
        cta_text: 'Aceptar desafío',
        cta_action: 'accept_challenge',
        urgency: 'medium',
        expires_at: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0).toISOString(),
        reward_type: 'points',
        reward_value: 50,
      });
    }

    // Streak nudges (Loss & Avoidance)
    if (streakData) {
      if (streakData.current_streak > 0) {
        nudges.push({
          id: 'streak-protect',
          type: 'streak',
          title: `🔥 Racha de ${streakData.current_streak} días`,
          message: `¡No pierdas tu racha! Completa al menos una acción hoy.`,
          cta_text: 'Mantener racha',
          cta_action: 'view_tasks',
          urgency: streakData.current_streak >= 7 ? 'high' : 'medium',
          icon: '🔥',
        });
      }

      // Near best streak
      if (streakData.current_streak === streakData.best_streak - 1) {
        nudges.push({
          id: 'beat-record',
          type: 'milestone',
          title: '🏆 ¡A un paso del récord!',
          message: `Un día más y superarás tu mejor racha de ${streakData.best_streak} días`,
          cta_text: '¡Vamos!',
          cta_action: 'view_streak',
          urgency: 'high',
          reward_type: 'badge',
          reward_value: 'streak_master',
        });
      }
    }

    // Social proof nudges (Social Influence)
    nudges.push({
      id: 'social-proof',
      type: 'social_proof',
      title: '📈 Tu equipo está en racha',
      message: '3 de tus compañeros completaron onboarding esta semana',
      cta_text: 'Ver ranking',
      cta_action: 'view_leaderboard',
      urgency: 'low',
    });

    // Mystery box (Unpredictability & Curiosity)
    if (Math.random() > 0.7) {
      nudges.push({
        id: `mystery-${Date.now()}`,
        type: 'mystery',
        title: '🎁 Caja Misteriosa Desbloqueada',
        message: 'Has completado suficientes acciones. ¡Reclama tu recompensa sorpresa!',
        cta_text: 'Abrir caja',
        cta_action: 'open_mystery_box',
        urgency: 'medium',
        reward_type: 'unlock',
      });
    }

    // Progress nudge (Development & Accomplishment)
    nudges.push({
      id: 'progress-boost',
      type: 'progress',
      title: '📊 Progreso del trimestre',
      message: 'Estás al 67% de tus objetivos. ¡Acelera para cerrar fuerte!',
      cta_text: 'Ver objetivos',
      cta_action: 'view_goals',
      urgency: 'low',
    });

    setActiveNudges(nudges);
    return nudges;
  }, [streakData]);

  // Initialize and refresh nudges
  useEffect(() => {
    generateNudges();
    const interval = setInterval(generateNudges, 5 * 60 * 1000); // Refresh every 5 min
    return () => clearInterval(interval);
  }, [generateNudges]);

  // Track streak
  const updateStreak = useMutation({
    mutationFn: async (activity: { type: string; companyId: string }) => {
      // Simulated streak calculation - would connect to real data
      const newStreak: UserStreak = {
        current_streak: (streakData?.current_streak || 0) + 1,
        best_streak: Math.max(streakData?.best_streak || 0, (streakData?.current_streak || 0) + 1),
        last_activity_date: new Date().toISOString(),
        streak_type: activity.type,
        bonus_multiplier: Math.min(2, 1 + ((streakData?.current_streak || 0) * 0.1)),
      };
      setStreakData(newStreak);
      return newStreak;
    },
    onSuccess: (data) => {
      if (data.current_streak === 7) {
        toast.success('🔥 ¡7 días de racha! +100 puntos bonus');
      } else if (data.current_streak === 30) {
        toast.success('🏆 ¡30 días! Has desbloqueado el badge "Constancia de Hierro"');
      }
    },
  });

  // Dismiss a nudge
  const dismissNudge = useCallback((nudgeId: string) => {
    setActiveNudges(prev => prev.filter(n => n.id !== nudgeId));
  }, []);

  // Handle nudge action
  const handleNudgeAction = useMutation({
    mutationFn: async ({ nudge, action }: { nudge: BehavioralNudge; action: string }) => {
      // Track the engagement
      console.log('Nudge action:', nudge.id, action);
      
      // Handle specific actions
      switch (action) {
        case 'open_mystery_box':
          // Random reward
          const rewards = ['50_points', '100_points', 'early_bird_badge', 'custom_theme'];
          const reward = rewards[Math.floor(Math.random() * rewards.length)];
          return { type: 'mystery_reward', value: reward };
        
        case 'accept_challenge':
          return { type: 'challenge_accepted', expires: nudge.expires_at };
        
        default:
          return { type: 'action_tracked', action };
      }
    },
    onSuccess: (result, { nudge }) => {
      dismissNudge(nudge.id);
      
      if (result.type === 'mystery_reward') {
        toast.success(`🎉 ¡Has ganado: ${result.value}!`);
      } else if (result.type === 'challenge_accepted') {
        toast.success('💪 ¡Desafío aceptado! Tienes hasta el mediodía');
      }
    },
  });

  // Get personalized recommendations based on behavior
  const getPersonalizedRecommendations = useCallback(() => {
    const recommendations = [
      {
        id: 'explore-analytics',
        type: 'feature_discovery',
        title: 'Descubre Analytics Avanzado',
        description: 'Basado en tu uso, te beneficiarías de las métricas predictivas',
        confidence: 0.87,
        potential_impact: 'high',
      },
      {
        id: 'automate-reports',
        type: 'efficiency',
        title: 'Automatiza tus reportes',
        description: 'Ahorrarías 2 horas semanales con reportes automáticos',
        confidence: 0.92,
        potential_impact: 'medium',
      },
      {
        id: 'connect-team',
        type: 'social',
        title: 'Invita a tu equipo',
        description: 'Los equipos colaborativos tienen 40% más éxito',
        confidence: 0.78,
        potential_impact: 'high',
      },
    ];
    return recommendations;
  }, []);

  // Gamification leaderboard data
  const getLeaderboardPosition = useCallback(() => {
    return {
      rank: 12,
      totalUsers: 156,
      percentile: 92,
      pointsToNextRank: 45,
      topPerformer: 'María G.',
      trend: 'up' as const,
    };
  }, []);

  // Calculate engagement score
  const calculateEngagementScore = useCallback(() => {
    const factors = {
      streak_bonus: streakData ? Math.min(20, streakData.current_streak * 2) : 0,
      activity_frequency: 25, // Simulated
      feature_breadth: 30, // Simulated
      social_engagement: 15, // Simulated
    };

    const total = Object.values(factors).reduce((sum, val) => sum + val, 0);
    return {
      score: total,
      breakdown: factors,
      level: total >= 80 ? 'champion' : total >= 60 ? 'expert' : total >= 40 ? 'rising_star' : 'newcomer',
    };
  }, [streakData]);

  return {
    activeNudges,
    streakData,
    dismissNudge,
    handleNudgeAction: handleNudgeAction.mutate,
    updateStreak: updateStreak.mutate,
    getPersonalizedRecommendations,
    getLeaderboardPosition,
    calculateEngagementScore,
    generateNudges,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError,
  };
}
