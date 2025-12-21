import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FeedbackGamification {
  id: string;
  company_id: string;
  contact_id: string | null;
  total_coins: number;
  coins_earned_30d: number;
  surveys_completed: number;
  streak_days: number;
  best_streak: number;
  badges: string[];
  company_rank: number | null;
  last_response_date: string | null;
  created_at: string;
  updated_at: string;
}

export function useSurveyGamification(companyId?: string) {
  const queryClient = useQueryClient();

  const { data: gamification, isLoading } = useQuery({
    queryKey: ['survey-gamification', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const { data, error } = await supabase
        .from('feedback_gamification')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
      
      if (error) throw error;
      return data as unknown as FeedbackGamification | null;
    },
    enabled: !!companyId,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['gamification-leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback_gamification')
        .select(`
          *,
          company:companies(id, name)
        `)
        .order('total_coins', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as unknown as (FeedbackGamification & { company: { id: string; name: string } })[];
    },
  });

  const addCoins = useMutation({
    mutationFn: async ({ 
      targetCompanyId, 
      coins, 
      reason 
    }: { 
      targetCompanyId: string; 
      coins: number; 
      reason: string;
    }) => {
      // First check if company has gamification record
      const { data: existing } = await supabase
        .from('feedback_gamification')
        .select('id, total_coins')
        .eq('company_id', targetCompanyId)
        .maybeSingle();

      if (existing) {
        const typedExisting = existing as unknown as { id: string; total_coins: number };
        const { error } = await supabase
          .from('feedback_gamification')
          .update({ 
            total_coins: typedExisting.total_coins + coins,
            last_response_date: new Date().toISOString().split('T')[0],
          } as never)
          .eq('id', typedExisting.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('feedback_gamification')
          .insert({
            company_id: targetCompanyId,
            total_coins: coins,
            last_response_date: new Date().toISOString().split('T')[0],
          } as never);
        if (error) throw error;
      }

      return { coins, reason };
    },
    onSuccess: ({ coins, reason }) => {
      queryClient.invalidateQueries({ queryKey: ['survey-gamification'] });
      queryClient.invalidateQueries({ queryKey: ['gamification-leaderboard'] });
      toast.success(`+${coins} monedas: ${reason}`);
    },
  });

  const getLevelFromCoins = (coins: number) => {
    const thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000];
    let level = 1;
    for (let i = 1; i < thresholds.length; i++) {
      if (coins >= thresholds[i]) {
        level = i + 1;
      }
    }
    return level;
  };

  const getLevelName = (level: number) => {
    const levels = [
      'Novato',
      'Aprendiz',
      'Intermedio',
      'Avanzado',
      'Experto',
      'Maestro',
      'Gran Maestro',
      'Leyenda',
    ];
    return levels[Math.min(level - 1, levels.length - 1)] || 'Novato';
  };

  const getLevelProgress = (coins: number) => {
    const thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000];
    const level = getLevelFromCoins(coins);
    
    const currentThreshold = thresholds[level - 1] || 0;
    const nextThreshold = thresholds[level] || thresholds[thresholds.length - 1];
    const progress = ((coins - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    
    return {
      level,
      progress: Math.min(100, Math.max(0, progress)),
      coinsToNext: nextThreshold - coins,
    };
  };

  const getBadgeIcon = (badge: string) => {
    const badges: Record<string, string> = {
      'first_response': '🎯',
      'streak_7': '🔥',
      'streak_30': '💎',
      'recovery_master': '🏆',
      'fast_responder': '⚡',
      'top_performer': '🌟',
      'feedback_guru': '🧙',
      'team_player': '🤝',
    };
    return badges[badge] || '🏅';
  };

  const getBadgeName = (badge: string) => {
    const names: Record<string, string> = {
      'first_response': 'Primera Respuesta',
      'streak_7': 'Racha de 7 días',
      'streak_30': 'Racha de 30 días',
      'recovery_master': 'Maestro de Recuperación',
      'fast_responder': 'Respuesta Rápida',
      'top_performer': 'Top Performer',
      'feedback_guru': 'Gurú del Feedback',
      'team_player': 'Jugador de Equipo',
    };
    return names[badge] || badge;
  };

  return {
    gamification,
    leaderboard,
    isLoading,
    addCoins: addCoins.mutate,
    isAddingCoins: addCoins.isPending,
    getLevelName,
    getLevelProgress,
    getLevelFromCoins,
    getBadgeIcon,
    getBadgeName,
  };
}
