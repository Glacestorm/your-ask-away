/**
 * GamificationDashboard - Dashboard de gamificación y logros
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Trophy, 
  Star, 
  Flame, 
  Medal,
  Crown,
  Target,
  Zap,
  TrendingUp,
  Award,
  Users,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Minus
} from 'lucide-react';
import { useGamification } from '@/hooks/academia/useGamification';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

interface GamificationDashboardProps {
  courseId?: string;
  className?: string;
}

export function GamificationDashboard({ 
  courseId,
  className 
}: GamificationDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const {
    isLoading,
    userPoints,
    level,
    achievements,
    recentTransactions,
    leaderboard,
    loadStats,
    loadLeaderboard,
  } = useGamification({ courseId });

  // Trigger confetti celebration
  const triggerCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6347'],
    });
  };

  // Loading state
  if (isLoading && !userPoints) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-3 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando progreso...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Mi Progreso</CardTitle>
              <p className="text-xs text-muted-foreground">
                Nivel {userPoints?.currentLevel || 1} • {userPoints?.totalPoints || 0} puntos
              </p>
            </div>
          </div>
          
          {/* Streak badge */}
          {userPoints && userPoints.streakDays > 0 && (
            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white gap-1">
              <Flame className="h-3 w-3" />
              {userPoints.streakDays} días
            </Badge>
          )}
        </div>

        {/* Level progress */}
        {level && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-500" />
                Nivel {level.current}
              </span>
              <span className="text-muted-foreground">
                {userPoints?.experiencePoints || 0} / {level.xpToNextLevel} XP
              </span>
            </div>
            <Progress value={level.progress} className="h-3 bg-muted" />
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-3">
            <TabsTrigger value="overview" className="text-xs">Resumen</TabsTrigger>
            <TabsTrigger value="achievements" className="text-xs">Logros</TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs">Ranking</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">Historial</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-2 gap-3">
              {/* Stats cards */}
              <StatCard
                icon={<Zap className="h-5 w-5" />}
                label="Puntos Totales"
                value={userPoints?.totalPoints || 0}
                color="from-blue-500 to-cyan-500"
              />
              <StatCard
                icon={<Target className="h-5 w-5" />}
                label="Esta Semana"
                value={userPoints?.weeklyPoints || 0}
                color="from-green-500 to-emerald-500"
              />
              <StatCard
                icon={<Flame className="h-5 w-5" />}
                label="Racha Actual"
                value={`${userPoints?.streakDays || 0} días`}
                color="from-orange-500 to-red-500"
              />
              <StatCard
                icon={<Medal className="h-5 w-5" />}
                label="Mejor Racha"
                value={`${userPoints?.longestStreak || 0} días`}
                color="from-purple-500 to-pink-500"
              />
            </div>

            {/* Quick achievements preview */}
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                Logros Recientes
              </h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {achievements.slice(0, 5).map((achievement) => (
                  <div
                    key={achievement.id}
                    className="shrink-0 w-16 text-center"
                  >
                    <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xl">
                      {achievement.icon || '🏆'}
                    </div>
                    <p className="text-xs mt-1 truncate">{achievement.name}</p>
                  </div>
                ))}
                {achievements.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aún no tienes logros
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="mt-0">
            <ScrollArea className="h-[280px]">
              <div className="grid grid-cols-2 gap-2">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "p-3 rounded-lg border text-center",
                      achievement.earnedAt 
                        ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30"
                        : "bg-muted/30 border-muted opacity-50"
                    )}
                  >
                    <div className="text-3xl mb-2">
                      {achievement.icon || '🔒'}
                    </div>
                    <h5 className="text-sm font-medium truncate">
                      {achievement.name}
                    </h5>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {achievement.description}
                    </p>
                    {achievement.points && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        +{achievement.points} pts
                      </Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="mt-0">
            <div className="mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadLeaderboard('weekly')}
                disabled={isLoading}
                className="w-full gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                Actualizar Ranking
              </Button>
            </div>
            <ScrollArea className="h-[240px]">
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <LeaderboardItem
                    key={`${entry.userId}-${index}`}
                    rank={entry.rank}
                    userName={entry.userName}
                    points={entry.totalPoints}
                    trend={index < 3 ? 'up' : index > 7 ? 'down' : 'stable'}
                    isCurrentUser={false}
                  />
                ))}
                {leaderboard.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No hay datos de ranking aún
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-0">
            <ScrollArea className="h-[280px]">
              <div className="space-y-2">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        tx.type === 'earn' 
                          ? "bg-green-500/20 text-green-500"
                          : "bg-red-500/20 text-red-500"
                      )}>
                        {tx.type === 'earn' ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <Zap className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{tx.source}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={tx.type === 'earn' ? 'default' : 'secondary'}
                      className="shrink-0"
                    >
                      {tx.type === 'earn' ? '+' : '-'}{tx.points}
                    </Badge>
                  </div>
                ))}
                {recentTransactions.length === 0 && (
                  <div className="text-center py-8">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Sin actividad reciente
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Stat card component
function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className={cn(
      "p-3 rounded-lg bg-gradient-to-br text-white",
      color
    )}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs opacity-90">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

// Leaderboard item component
function LeaderboardItem({ 
  rank, 
  userName, 
  points, 
  trend,
  isCurrentUser 
}: { 
  rank: number;
  userName: string;
  points: number;
  trend: 'up' | 'down' | 'stable';
  isCurrentUser: boolean;
}) {
  const getRankIcon = () => {
    if (rank === 1) return <Crown className="h-5 w-5 text-amber-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <ChevronUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <ChevronDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg",
      isCurrentUser ? "bg-primary/10 border border-primary/30" : "bg-muted/30"
    )}>
      <div className="w-8 flex justify-center">
        {getRankIcon()}
      </div>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">
          {userName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm font-medium">{userName}</p>
      </div>
      <div className="flex items-center gap-2">
        {getTrendIcon()}
        <Badge variant="secondary">{points} pts</Badge>
      </div>
    </div>
  );
}

export default GamificationDashboard;
