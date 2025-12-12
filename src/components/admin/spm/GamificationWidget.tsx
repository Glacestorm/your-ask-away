import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, Award, Medal, Star, Flame, Target, 
  Zap, Crown, Rocket, Gift, Sparkles
} from 'lucide-react';
import { useSalesAchievements, useSalesQuotas } from '@/hooks/useSalesPerformance';
import { useAuth } from '@/hooks/useAuth';
import confetti from 'canvas-confetti';

const ACHIEVEMENT_ICONS: Record<string, React.ReactNode> = {
  'first_visit': <Target className="h-5 w-5" />,
  'streak_5': <Flame className="h-5 w-5" />,
  'streak_10': <Flame className="h-5 w-5 text-orange-500" />,
  'streak_30': <Flame className="h-5 w-5 text-red-500" />,
  'quota_50': <TrendingProgress value={50} />,
  'quota_100': <Trophy className="h-5 w-5 text-yellow-500" />,
  'quota_150': <Crown className="h-5 w-5 text-yellow-500" />,
  'top_3': <Medal className="h-5 w-5 text-amber-500" />,
  'top_1': <Crown className="h-5 w-5 text-yellow-500" />,
  'new_client': <Star className="h-5 w-5 text-blue-500" />,
  'cross_sell': <Sparkles className="h-5 w-5 text-purple-500" />,
  'big_deal': <Rocket className="h-5 w-5 text-green-500" />,
  'team_player': <Gift className="h-5 w-5 text-pink-500" />,
};

function TrendingProgress({ value }: { value: number }) {
  return (
    <div className="relative w-5 h-5">
      <svg viewBox="0 0 20 20" className="w-full h-full">
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-20" />
        <circle 
          cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2"
          strokeDasharray={`${value * 0.5} 100`}
          transform="rotate(-90 10 10)"
        />
      </svg>
    </div>
  );
}

const BADGE_DEFINITIONS = [
  { id: 'bronze', name: 'Bronce', minPoints: 100, icon: <Medal className="h-6 w-6 text-amber-700" />, color: 'bg-amber-700' },
  { id: 'silver', name: 'Plata', minPoints: 500, icon: <Medal className="h-6 w-6 text-gray-400" />, color: 'bg-gray-400' },
  { id: 'gold', name: 'Oro', minPoints: 1000, icon: <Medal className="h-6 w-6 text-yellow-500" />, color: 'bg-yellow-500' },
  { id: 'platinum', name: 'Platino', minPoints: 2500, icon: <Award className="h-6 w-6 text-cyan-400" />, color: 'bg-cyan-400' },
  { id: 'diamond', name: 'Diamante', minPoints: 5000, icon: <Crown className="h-6 w-6 text-purple-400" />, color: 'bg-purple-400' },
];

export function GamificationWidget() {
  const { user } = useAuth();
  const { data: achievements, isLoading: achievementsLoading } = useSalesAchievements(user?.id);
  const { data: quotas, isLoading: quotasLoading } = useSalesQuotas(user?.id, 'monthly');

  const currentQuota = quotas?.[0];
  const totalPoints = achievements?.reduce((sum, a) => sum + a.points, 0) || 0;
  
  const currentBadge = BADGE_DEFINITIONS.filter(b => totalPoints >= b.minPoints).pop() || BADGE_DEFINITIONS[0];
  const nextBadge = BADGE_DEFINITIONS.find(b => totalPoints < b.minPoints);
  const pointsToNext = nextBadge ? nextBadge.minPoints - totalPoints : 0;
  const progressToNext = nextBadge 
    ? ((totalPoints - (currentBadge?.minPoints || 0)) / (nextBadge.minPoints - (currentBadge?.minPoints || 0))) * 100 
    : 100;

  const recentAchievements = achievements?.slice(0, 6) || [];

  const celebrateAchievement = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Gamificación y Logros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
          <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center shadow-lg">
            {currentBadge?.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">{currentBadge?.name || 'Novato'}</h3>
              <Badge variant="secondary">{totalPoints} pts</Badge>
            </div>
            {nextBadge && (
              <>
                <Progress value={progressToNext} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {pointsToNext} puntos para {nextBadge.name}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Quota Progress */}
        {currentQuota && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Objetivo Mensual</span>
              <span className="text-sm text-muted-foreground">
                {currentQuota.achievement_percentage?.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={Math.min(currentQuota.achievement_percentage || 0, 100)} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(currentQuota.actual_value)}
              </span>
              <span>
                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(currentQuota.target_value)}
              </span>
            </div>
          </div>
        )}

        {/* Badge Collection */}
        <div>
          <h4 className="text-sm font-medium mb-3">Insignias</h4>
          <div className="flex gap-2">
            {BADGE_DEFINITIONS.map((badge) => (
              <div 
                key={badge.id}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  totalPoints >= badge.minPoints 
                    ? `${badge.color} text-white shadow-lg` 
                    : 'bg-muted opacity-30'
                }`}
                title={`${badge.name}: ${badge.minPoints} pts`}
              >
                {badge.icon}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Achievements */}
        <div>
          <h4 className="text-sm font-medium mb-3">Logros Recientes</h4>
          {achievementsLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-muted/50 animate-pulse rounded" />
              ))}
            </div>
          ) : recentAchievements.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {recentAchievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={celebrateAchievement}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: achievement.badge_color || 'hsl(var(--primary))' }}
                  >
                    {ACHIEVEMENT_ICONS[achievement.achievement_type] || <Star className="h-4 w-4 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{achievement.achievement_name}</p>
                    <p className="text-xs text-muted-foreground">+{achievement.points} pts</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>¡Completa actividades para desbloquear logros!</p>
            </div>
          )}
        </div>

        {/* Streak Indicator */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-500/10 to-orange-500/5 rounded-lg">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="font-medium">Racha de Actividad</span>
          </div>
          <Badge variant="secondary" className="bg-orange-500/20 text-orange-600">
            0 días consecutivos
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
