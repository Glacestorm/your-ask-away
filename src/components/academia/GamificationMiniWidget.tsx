/**
 * GamificationMiniWidget - Widget compacto de gamificación para el LearningPlayer
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy,
  Flame,
  Star,
  Award,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTrainingGamification, LeaderboardEntry } from '@/hooks/useTrainingGamification';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface GamificationMiniWidgetProps {
  className?: string;
  courseProgress?: number;
  onCertificateClick?: () => void;
  showCertificateButton?: boolean;
}

export const GamificationMiniWidget: React.FC<GamificationMiniWidgetProps> = ({
  className,
  courseProgress = 0,
  onCertificateClick,
  showCertificateButton = false,
}) => {
  const { user } = useAuth();
  const {
    myStats,
    leaderboard,
    getLevelInfo,
    getProgressToNextLevel,
  } = useTrainingGamification();

  const levelInfo = myStats ? getLevelInfo(myStats.level) : getLevelInfo(1);
  const progressInfo = myStats 
    ? getProgressToNextLevel(myStats.total_xp, myStats.level)
    : { progress: 0, xpInLevel: 0, xpNeeded: 100, xpRemaining: 100 };

  // Get top 5 for mini leaderboard
  const topFive = leaderboard.slice(0, 5);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Level & XP Card */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="relative"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="text-lg font-bold text-white">{myStats?.level || 1}</span>
            </div>
          </motion.div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-white">{levelInfo.name.es}</span>
              <Badge variant="outline" className="text-[10px] h-4 border-primary/50 text-primary">
                {myStats?.total_xp || 0} XP
              </Badge>
            </div>
            <Progress value={progressInfo.progress} className="h-1.5" />
            <p className="text-[10px] text-slate-500 mt-0.5">
              {progressInfo.xpRemaining} XP para nivel {(myStats?.level || 1) + 1}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-slate-800/50 text-center">
            <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <p className="text-xs font-medium text-white">{myStats?.current_streak_days || 0}</p>
            <p className="text-[10px] text-slate-500">Racha</p>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/50 text-center">
            <Trophy className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
            <p className="text-xs font-medium text-white">{myStats?.courses_completed || 0}</p>
            <p className="text-[10px] text-slate-500">Cursos</p>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/50 text-center">
            <Award className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="text-xs font-medium text-white">{myStats?.badges_count || 0}</p>
            <p className="text-[10px] text-slate-500">Badges</p>
          </div>
        </div>
      </div>

      {/* Next Badge Teaser */}
      {myStats && myStats.level < 10 && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-300">Próximo logro</p>
              <p className="text-[10px] text-slate-500">
                Completa {progressInfo.xpRemaining} XP más
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mini Leaderboard */}
      {topFive.length > 0 && (
        <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              Top 5
            </span>
            <Link to="/academia/mi-perfil">
              <Button variant="ghost" size="sm" className="h-6 text-xs text-slate-500 hover:text-white p-0">
                Ver todo
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-1.5">
            {topFive.map((entry, index) => (
              <MiniLeaderboardRow 
                key={entry.id} 
                entry={entry} 
                rank={index + 1}
                isCurrentUser={entry.user_id === user?.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Certificate Button */}
      {showCertificateButton && courseProgress >= 100 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={onCertificateClick}
            className="w-full gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-medium"
          >
            <Award className="w-4 h-4" />
            Obtener Certificado
          </Button>
        </motion.div>
      )}

      {/* Profile Link */}
      <Link to="/academia/mi-perfil">
        <Button variant="outline" size="sm" className="w-full text-xs border-slate-700">
          Ver mi perfil completo
          <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </Link>
    </div>
  );
};

// Mini Leaderboard Row
interface MiniLeaderboardRowProps {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
}

const MiniLeaderboardRow: React.FC<MiniLeaderboardRowProps> = ({ entry, rank, isCurrentUser }) => {
  const getRankColor = () => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-slate-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-slate-500';
  };

  return (
    <div className={cn(
      "flex items-center gap-2 py-1 px-2 rounded",
      isCurrentUser && "bg-primary/10"
    )}>
      <span className={cn("text-xs font-bold w-4", getRankColor())}>{rank}</span>
      <Avatar className="h-5 w-5">
        <AvatarImage src={entry.profile?.avatar_url || undefined} />
        <AvatarFallback className="text-[10px] bg-slate-700">
          {(entry.profile?.full_name || 'U')[0]}
        </AvatarFallback>
      </Avatar>
      <span className={cn(
        "flex-1 text-xs truncate",
        isCurrentUser ? "text-primary font-medium" : "text-slate-400"
      )}>
        {entry.profile?.full_name || 'Usuario'}
      </span>
      <span className="text-[10px] text-slate-500">{entry.total_xp} XP</span>
    </div>
  );
};

export default GamificationMiniWidget;
