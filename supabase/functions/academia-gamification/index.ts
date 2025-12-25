/**
 * Academia Gamification - Sistema de puntos, niveles y logros
 * Gestiona la gamificación del aprendizaje
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GamificationRequest {
  action: 'get_stats' | 'get_leaderboard' | 'check_achievements' | 'award_points' | 'update_streak';
  courseId?: string;
  points?: number;
  source?: string;
  sourceId?: string;
  description?: string;
  periodType?: 'weekly' | 'monthly' | 'all_time';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestData: GamificationRequest = await req.json();
    const { action, courseId, points, source, sourceId, description, periodType } = requestData;

    console.log('[AcademiaGamification] Action:', action, 'User:', user.id);

    switch (action) {
      case 'get_stats': {
        // Get or create user points
        let { data: userPoints } = await supabase
          .from('academia_user_points')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!userPoints) {
          const { data: newPoints } = await supabase
            .from('academia_user_points')
            .insert({ user_id: user.id })
            .select()
            .single();
          userPoints = newPoints;
        }

        // Get user achievements
        const { data: achievements } = await supabase
          .from('academia_user_achievements')
          .select('*, achievement:academia_achievements(*)')
          .eq('user_id', user.id);

        // Get recent transactions
        const { data: recentTransactions } = await supabase
          .from('academia_point_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        // Calculate level progress
        const currentLevel = userPoints?.current_level || 1;
        const xpForCurrentLevel = (currentLevel - 1) * (currentLevel - 1) * 100;
        const xpForNextLevel = currentLevel * currentLevel * 100;
        const currentXp = userPoints?.experience_points || 0;
        const levelProgress = ((currentXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

        return new Response(JSON.stringify({
          success: true,
          data: {
            points: userPoints,
            level: {
              current: currentLevel,
              progress: Math.min(100, Math.max(0, levelProgress)),
              xpToNextLevel: xpForNextLevel - currentXp,
            },
            achievements: achievements || [],
            recentTransactions: recentTransactions || [],
            streak: {
              current: userPoints?.streak_days || 0,
              longest: userPoints?.longest_streak || 0,
            },
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_leaderboard': {
        const period = periodType || 'weekly';
        
        // Get leaderboard entries
        const { data: leaderboard } = await supabase
          .from('academia_leaderboards')
          .select('*')
          .eq('period_type', period)
          .eq('course_id', courseId || null)
          .order('total_points', { ascending: false })
          .limit(50);

        // Get user's rank
        const userEntry = leaderboard?.find(e => e.user_id === user.id);
        const userRank = userEntry 
          ? (leaderboard?.indexOf(userEntry) || 0) + 1 
          : null;

        // Get profiles for display
        const userIds = leaderboard?.map(e => e.user_id) || [];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        const enrichedLeaderboard = leaderboard?.map((entry, index) => ({
          ...entry,
          rank: index + 1,
          profile: profiles?.find(p => p.id === entry.user_id),
        }));

        return new Response(JSON.stringify({
          success: true,
          data: {
            leaderboard: enrichedLeaderboard,
            userRank,
            period,
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'check_achievements': {
        // Get all available achievements
        const { data: allAchievements } = await supabase
          .from('academia_achievements')
          .select('*')
          .eq('is_active', true);

        // Get user's earned achievements
        const { data: earnedAchievements } = await supabase
          .from('academia_user_achievements')
          .select('achievement_id')
          .eq('user_id', user.id);

        const earnedIds = earnedAchievements?.map(a => a.achievement_id) || [];
        
        // Get user stats for achievement checking
        const { data: userPoints } = await supabase
          .from('academia_user_points')
          .select('*')
          .eq('user_id', user.id)
          .single();

        const { data: completedLessons } = await supabase
          .from('academia_lesson_progress')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        const { data: passedQuizzes } = await supabase
          .from('academia_quiz_attempts')
          .select('id')
          .eq('user_id', user.id)
          .eq('passed', true);

        const stats = {
          totalPoints: userPoints?.total_points || 0,
          streakDays: userPoints?.streak_days || 0,
          lessonsCompleted: completedLessons?.length || 0,
          quizzesPassed: passedQuizzes?.length || 0,
          level: userPoints?.current_level || 1,
        };

        // Check for new achievements
        const newlyEarned: string[] = [];
        
        for (const achievement of allAchievements || []) {
          if (earnedIds.includes(achievement.id)) continue;
          
          const criteria = achievement.criteria as any;
          if (!criteria) continue;

          let earned = false;
          
          switch (criteria.type) {
            case 'points':
              earned = stats.totalPoints >= (criteria.value || 0);
              break;
            case 'streak':
              earned = stats.streakDays >= (criteria.value || 0);
              break;
            case 'lessons':
              earned = stats.lessonsCompleted >= (criteria.value || 0);
              break;
            case 'quizzes':
              earned = stats.quizzesPassed >= (criteria.value || 0);
              break;
            case 'level':
              earned = stats.level >= (criteria.value || 0);
              break;
          }

          if (earned) {
            await supabase
              .from('academia_user_achievements')
              .insert({
                user_id: user.id,
                achievement_id: achievement.id,
              });

            // Award achievement points
            if (achievement.points) {
              await supabase
                .from('academia_point_transactions')
                .insert({
                  user_id: user.id,
                  points: achievement.points,
                  transaction_type: 'bonus',
                  source: 'achievement',
                  source_id: achievement.id,
                  description: `Logro desbloqueado: ${achievement.name}`,
                });
            }

            newlyEarned.push(achievement.id);
          }
        }

        return new Response(JSON.stringify({
          success: true,
          data: {
            newlyEarned,
            stats,
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'award_points': {
        if (!points || !source) {
          throw new Error('Missing points or source');
        }

        await supabase
          .from('academia_point_transactions')
          .insert({
            user_id: user.id,
            points,
            transaction_type: 'earned',
            source,
            source_id: sourceId,
            description,
          });

        return new Response(JSON.stringify({
          success: true,
          data: { awarded: points },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update_streak': {
        const today = new Date().toISOString().split('T')[0];
        
        const { data: userPoints } = await supabase
          .from('academia_user_points')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!userPoints) {
          await supabase
            .from('academia_user_points')
            .insert({
              user_id: user.id,
              streak_days: 1,
              longest_streak: 1,
              last_activity_date: today,
            });

          return new Response(JSON.stringify({
            success: true,
            data: { streak: 1, isNewStreak: true },
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const lastActivity = userPoints.last_activity_date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = userPoints.streak_days;
        let streakBonus = 0;

        if (lastActivity === yesterdayStr) {
          // Continue streak
          newStreak += 1;
          
          // Bonus for streak milestones
          if (newStreak % 7 === 0) {
            streakBonus = 50; // Weekly streak bonus
          } else if (newStreak % 30 === 0) {
            streakBonus = 200; // Monthly streak bonus
          }
        } else if (lastActivity !== today) {
          // Streak broken
          newStreak = 1;
        }

        await supabase
          .from('academia_user_points')
          .update({
            streak_days: newStreak,
            longest_streak: Math.max(userPoints.longest_streak, newStreak),
            last_activity_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (streakBonus > 0) {
          await supabase
            .from('academia_point_transactions')
            .insert({
              user_id: user.id,
              points: streakBonus,
              transaction_type: 'bonus',
              source: 'streak_bonus',
              description: `¡Racha de ${newStreak} días!`,
            });
        }

        return new Response(JSON.stringify({
          success: true,
          data: {
            streak: newStreak,
            longestStreak: Math.max(userPoints.longest_streak, newStreak),
            streakBonus,
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('[AcademiaGamification] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
