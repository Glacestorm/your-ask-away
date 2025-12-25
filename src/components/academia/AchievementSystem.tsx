/**
 * AchievementSystem - Sistema de logros, badges y ranking
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Medal,
  Star,
  Flame,
  Target,
  Crown,
  Zap,
  TrendingUp,
  Award,
  Users,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTrainingGamification, StudentBadge, LeaderboardEntry } from '@/hooks/useTrainingGamification';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AchievementSystemProps {
  className?: string;
  showLeaderboard?: boolean;
  compact?: boolean;
}

// Icon mapping for badges
const BADGE_ICONS: Record<string, React.ReactNode> = {
  '🎯': <Target className="w-5 h-5" />,
  '🏆': <Trophy className="w-5 h-5" />,
  '🧠': <Sparkles className="w-5 h-5" />,
  '🔥': <Flame className="w-5 h-5" />,
  '💎': <Star className="w-5 h-5" />,
  '🥇': <Medal className="w-5 h-5" />,
  '📜': <Award className="w-5 h-5" />,
  '⚡': <Zap className="w-5 h-5" />,
};

// Badge color classes
const BADGE_COLORS: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600',
  gold: 'from-yellow-400 to-orange-500',
  purple: 'from-purple-500 to-purple-600',
  orange: 'from-orange-400 to-red-500',
  diamond: 'from-cyan-400 to-blue-500',
  green: 'from-green-500 to-emerald-600',
  yellow: 'from-yellow-400 to-yellow-500',
  primary: 'from-primary to-primary/80',
};

export const AchievementSystem: React.FC<AchievementSystemProps> = ({
  className,
  showLeaderboard = true,
  compact = false,
}) => {
  const { user } = useAuth();
  const {
    myStats,
    myBadges,
    leaderboard,
    loading,
    getLevelInfo,
    getProgressToNextLevel,
    fetchLeaderboard,
    LEVEL_NAMES,
  } = useTrainingGamification();

  useEffect(() => {
    if (showLeaderboard) {
      fetchLeaderboard(10);
    }
  }, [showLeaderboard, fetchLeaderboard]);

  const levelInfo = myStats ? getLevelInfo(myStats.level) : getLevelInfo(1);
  const progressInfo = myStats 
    ? getProgressToNextLevel(myStats.total_xp, myStats.level)
    : { progress: 0, xpInLevel: 0, xpNeeded: 100, xpRemaining: 100 };

  if (compact) {
    return (
      <Card className={cn("bg-slate-900/50 border-slate-800", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Level Badge */}
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{myStats?.level || 1}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-yellow-500 text-[10px] font-bold text-black">
                {myStats?.total_xp || 0} XP
              </div>
            </div>

            {/* Progress */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-300">
                  {levelInfo.name.es}
                </span>
                <span className="text-xs text-slate-500">
                  {progressInfo.xpRemaining} XP para nivel {(myStats?.level || 1) + 1}
                </span>
              </div>
              <Progress value={progressInfo.progress} className="h-2" />
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-3 text-sm">
              <div className="text-center">
                <Flame className="w-4 h-4 text-orange-400 mx-auto" />
                <span className="text-slate-400">{myStats?.current_streak_days || 0}d</span>
              </div>
              <div className="text-center">
                <Trophy className="w-4 h-4 text-yellow-400 mx-auto" />
                <span className="text-slate-400">{myStats?.badges_count || 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("bg-slate-900/50 border-slate-800", className)}>
      <Tabs defaultValue="stats" className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Logros y Progreso
            </CardTitle>
            <TabsList className="bg-slate-800">
              <TabsTrigger value="stats" className="text-xs">Mi Progreso</TabsTrigger>
              <TabsTrigger value="badges" className="text-xs">Badges</TabsTrigger>
              {showLeaderboard && (
                <TabsTrigger value="ranking" className="text-xs">Ranking</TabsTrigger>
              )}
            </TabsList>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <TabsContent value="stats" className="mt-0 space-y-6">
            {/* Level Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
              <div className="flex items-start gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary via-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-primary/25">
                    <span className="text-3xl font-bold text-white">{myStats?.level || 1}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
                  />
                </motion.div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white">{levelInfo.name.es}</h3>
                    <Badge variant="outline" className="border-primary/50 text-primary">
                      Nivel {myStats?.level || 1}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">
                    {myStats?.total_xp || 0} XP totales
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Progreso al nivel {(myStats?.level || 1) + 1}</span>
                      <span>{Math.round(progressInfo.progress)}%</span>
                    </div>
                    <Progress value={progressInfo.progress} className="h-2" />
                    <p className="text-xs text-slate-500">
                      {progressInfo.xpRemaining} XP restantes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                icon={<Flame className="w-5 h-5" />}
                label="Racha"
                value={`${myStats?.current_streak_days || 0} días`}
                color="orange"
              />
              <StatCard
                icon={<Trophy className="w-5 h-5" />}
                label="Cursos"
                value={myStats?.courses_completed || 0}
                color="yellow"
              />
              <StatCard
                icon={<Target className="w-5 h-5" />}
                label="Quizzes"
                value={myStats?.quizzes_passed || 0}
                color="green"
              />
              <StatCard
                icon={<Award className="w-5 h-5" />}
                label="Certificados"
                value={myStats?.certificates_earned || 0}
                color="blue"
              />
            </div>
          </TabsContent>

          <TabsContent value="badges" className="mt-0">
            <ScrollArea className="h-[300px] pr-4">
              {myBadges.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Medal className="w-12 h-12 text-slate-600 mb-3" />
                  <p className="text-slate-400">Aún no tienes badges</p>
                  <p className="text-sm text-slate-500">Completa cursos y quizzes para desbloquear logros</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <AnimatePresence>
                    {myBadges.map((badge, index) => (
                      <BadgeCard key={badge.id} badge={badge} index={index} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {showLeaderboard && (
            <TabsContent value="ranking" className="mt-0">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <LeaderboardRow
                      key={entry.id}
                      entry={entry}
                      rank={index + 1}
                      isCurrentUser={entry.user_id === user?.id}
                    />
                  ))}
                  {leaderboard.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full py-8">
                      <Users className="w-12 h-12 text-slate-600 mb-3" />
                      <p className="text-slate-400">No hay datos de ranking</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          )}
        </CardContent>
      </Tabs>
    </Card>
  );
};

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'orange' | 'yellow' | 'green' | 'blue' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  const colorClasses = {
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
  };

  return (
    <div className={cn(
      "p-3 rounded-lg bg-gradient-to-br border",
      colorClasses[color]
    )}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
};

// Badge Card Component
interface BadgeCardProps {
  badge: StudentBadge;
  index: number;
}

const BadgeCard: React.FC<BadgeCardProps> = ({ badge, index }) => {
  const colorClass = BADGE_COLORS[badge.badge_color] || BADGE_COLORS.primary;
  const icon = BADGE_ICONS[badge.badge_icon || ''] || <Star className="w-5 h-5" />;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
          >
            <div className={cn(
              "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center mx-auto mb-2",
              colorClass
            )}>
              <span className="text-white">{icon}</span>
            </div>
            <p className="text-xs font-medium text-center text-slate-300 truncate">
              {badge.badge_name?.es || badge.badge_key}
            </p>
            <p className="text-[10px] text-center text-slate-500">
              +{badge.points_awarded} XP
            </p>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">{badge.badge_name?.es}</p>
            <p className="text-xs text-muted-foreground">
              {badge.badge_description?.es}
            </p>
            <p className="text-xs mt-1">
              Obtenido: {new Date(badge.earned_at).toLocaleDateString('es-ES')}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Leaderboard Row Component
interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
}

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ entry, rank, isCurrentUser }) => {
  const getRankIcon = () => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-medium text-slate-500">{rank}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-colors",
        isCurrentUser 
          ? "bg-primary/10 border border-primary/30" 
          : "bg-slate-800/30 hover:bg-slate-800/50"
      )}
    >
      <div className="w-8 h-8 flex items-center justify-center">
        {getRankIcon()}
      </div>

      <Avatar className="h-9 w-9">
        <AvatarImage src={entry.profile?.avatar_url || undefined} />
        <AvatarFallback className="bg-slate-700 text-slate-300">
          {(entry.profile?.full_name || 'U')[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          isCurrentUser ? "text-primary" : "text-slate-300"
        )}>
          {entry.profile?.full_name || 'Usuario'}
          {isCurrentUser && <span className="text-xs ml-1">(Tú)</span>}
        </p>
        <p className="text-xs text-slate-500">
          Nivel {entry.level} • {entry.courses_completed} cursos
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm font-bold text-white">{entry.total_xp.toLocaleString()}</p>
        <p className="text-[10px] text-slate-500">XP</p>
      </div>

      {entry.current_streak_days > 0 && (
        <div className="flex items-center gap-1 text-orange-400">
          <Flame className="w-4 h-4" />
          <span className="text-xs">{entry.current_streak_days}</span>
        </div>
      )}
    </motion.div>
  );
};

export default AchievementSystem;
