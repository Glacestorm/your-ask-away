import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import confetti from 'canvas-confetti';

const ACHIEVEMENT_NAMES: Record<string, string> = {
  first_visit: '¡Primera Visita!',
  first_deal: '¡Primer Deal Cerrado!',
  visit_streak_5: '5 Visitas Consecutivas',
  visit_streak_10: '10 Visitas Consecutivas',
  monthly_target: 'Objetivo Mensual Alcanzado',
  top_performer: 'Top Performer del Mes',
  deal_closer: 'Cerrador de Deals',
  product_champion: 'Campeón de Productos',
  early_bird: 'Madrugador',
  consistency_king: 'Rey de la Consistencia',
};

const ACHIEVEMENT_ICONS: Record<string, string> = {
  first_visit: '🎯',
  first_deal: '💰',
  visit_streak_5: '🔥',
  visit_streak_10: '🔥🔥',
  monthly_target: '🏆',
  top_performer: '⭐',
  deal_closer: '🤝',
  product_champion: '📦',
  early_bird: '🌅',
  consistency_king: '👑',
};

export function useAchievementNotifications() {
  const { user } = useAuth();
  const processedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to new achievements for the current user
    const channel = supabase
      .channel('achievement-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales_achievements',
          filter: `gestor_id=eq.${user.id}`,
        },
        (payload) => {
          const achievement = payload.new as {
            id: string;
            achievement_type: string;
            points_earned: number;
          };

          // Prevent duplicate notifications
          if (processedIds.current.has(achievement.id)) return;
          processedIds.current.add(achievement.id);

          const name = ACHIEVEMENT_NAMES[achievement.achievement_type] || achievement.achievement_type;
          const icon = ACHIEVEMENT_ICONS[achievement.achievement_type] || '🏅';

          // Fire confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#FF4500', '#32CD32', '#1E90FF'],
          });

          // Show toast notification
          toast.success(`${icon} ${name} - +${achievement.points_earned} puntos`, {
            duration: 5000,
          });

          // Also show browser notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`${icon} ${name}`, {
              body: `¡Has ganado ${achievement.points_earned} puntos!`,
              icon: '/favicon.ico',
            });
          }
        }
      )
      .subscribe();

    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
}
