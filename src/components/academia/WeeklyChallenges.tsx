/**
 * WeeklyChallenges - Sistema de retos semanales con recompensas
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Target,
  Clock,
  Gift,
  Trophy,
  Star,
  Zap,
  CheckCircle,
  Lock,
  ChevronRight,
  Sparkles,
  Calendar,
  TrendingUp,
  BookOpen,
  Award,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useCelebration } from '@/hooks/useCelebration';
import { toast } from 'sonner';

// Types
interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  category: 'learning' | 'engagement' | 'streak' | 'social';
  icon: React.ReactNode;
  target: number;
  current: number;
  xpReward: number;
  bonusReward?: {
    type: 'badge' | 'coins' | 'multiplier';
    value: string | number;
  };
  expiresAt: Date;
  isCompleted: boolean;
  isLocked: boolean;
  unlockRequirement?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
}

interface WeeklyChallengesProps {
  className?: string;
  userId?: string;
}

// Difficulty colors and labels
const difficultyConfig = {
  easy: { color: 'text-green-400 bg-green-500/20', label: 'Fácil', multiplier: 1 },
  medium: { color: 'text-yellow-400 bg-yellow-500/20', label: 'Medio', multiplier: 1.5 },
  hard: { color: 'text-orange-400 bg-orange-500/20', label: 'Difícil', multiplier: 2 },
  legendary: { color: 'text-purple-400 bg-purple-500/20', label: 'Legendario', multiplier: 3 },
};

// Category icons and colors
const categoryConfig = {
  learning: { icon: <BookOpen className="w-4 h-4" />, color: 'from-blue-500 to-cyan-500' },
  engagement: { icon: <Zap className="w-4 h-4" />, color: 'from-yellow-500 to-orange-500' },
  streak: { icon: <Flame className="w-4 h-4" />, color: 'from-orange-500 to-red-500' },
  social: { icon: <Trophy className="w-4 h-4" />, color: 'from-purple-500 to-pink-500' },
};

// Generate mock challenges
const generateChallenges = (): Challenge[] => {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);

  return [
    // Daily Challenges
    {
      id: 'd1',
      title: 'Estudiante Dedicado',
      description: 'Completa 3 lecciones hoy',
      type: 'daily',
      category: 'learning',
      icon: <BookOpen className="w-5 h-5" />,
      target: 3,
      current: 2,
      xpReward: 50,
      expiresAt: endOfDay,
      isCompleted: false,
      isLocked: false,
      difficulty: 'easy',
    },
    {
      id: 'd2',
      title: 'Quiz Master',
      description: 'Aprueba un quiz con 100% de aciertos',
      type: 'daily',
      category: 'engagement',
      icon: <Target className="w-5 h-5" />,
      target: 1,
      current: 0,
      xpReward: 75,
      bonusReward: { type: 'coins', value: 10 },
      expiresAt: endOfDay,
      isCompleted: false,
      isLocked: false,
      difficulty: 'medium',
    },
    {
      id: 'd3',
      title: 'Madrugador',
      description: 'Estudia antes de las 9 AM',
      type: 'daily',
      category: 'streak',
      icon: <Clock className="w-5 h-5" />,
      target: 1,
      current: 1,
      xpReward: 30,
      expiresAt: endOfDay,
      isCompleted: true,
      isLocked: false,
      difficulty: 'easy',
    },
    // Weekly Challenges
    {
      id: 'w1',
      title: 'Racha de Fuego',
      description: 'Mantén una racha de 7 días consecutivos',
      type: 'weekly',
      category: 'streak',
      icon: <Flame className="w-5 h-5" />,
      target: 7,
      current: 4,
      xpReward: 200,
      bonusReward: { type: 'badge', value: 'fire_week' },
      expiresAt: endOfWeek,
      isCompleted: false,
      isLocked: false,
      difficulty: 'hard',
    },
    {
      id: 'w2',
      title: 'Explorador del Conocimiento',
      description: 'Completa 15 lecciones esta semana',
      type: 'weekly',
      category: 'learning',
      icon: <Star className="w-5 h-5" />,
      target: 15,
      current: 8,
      xpReward: 150,
      expiresAt: endOfWeek,
      isCompleted: false,
      isLocked: false,
      difficulty: 'medium',
    },
    {
      id: 'w3',
      title: 'Colaborador Social',
      description: 'Ayuda a 5 compañeros en el foro',
      type: 'weekly',
      category: 'social',
      icon: <Trophy className="w-5 h-5" />,
      target: 5,
      current: 2,
      xpReward: 100,
      bonusReward: { type: 'coins', value: 25 },
      expiresAt: endOfWeek,
      isCompleted: false,
      isLocked: false,
      difficulty: 'medium',
    },
    // Special Challenge
    {
      id: 's1',
      title: 'Maestro Legendario',
      description: 'Completa un curso entero esta semana',
      type: 'special',
      category: 'learning',
      icon: <Award className="w-5 h-5" />,
      target: 1,
      current: 0,
      xpReward: 500,
      bonusReward: { type: 'multiplier', value: 2 },
      expiresAt: endOfWeek,
      isCompleted: false,
      isLocked: true,
      unlockRequirement: 'Completa 10 lecciones primero',
      difficulty: 'legendary',
    },
  ];
};

// Time remaining formatter
const formatTimeRemaining = (date: Date): string => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expirado';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  return `${hours}h ${minutes}m`;
};

// Challenge Card Component
interface ChallengeCardProps {
  challenge: Challenge;
  onClaim: (id: string) => void;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, onClaim }) => {
  const progress = Math.min((challenge.current / challenge.target) * 100, 100);
  const timeRemaining = formatTimeRemaining(challenge.expiresAt);
  const diffConfig = difficultyConfig[challenge.difficulty];
  const catConfig = categoryConfig[challenge.category];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={!challenge.isLocked ? { scale: 1.02 } : undefined}
      className={cn(
        "relative p-4 rounded-xl border transition-all",
        challenge.isCompleted
          ? "bg-green-500/10 border-green-500/30"
          : challenge.isLocked
          ? "bg-slate-800/30 border-slate-700/30 opacity-60"
          : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600"
      )}
    >
      {/* Completed overlay */}
      {challenge.isCompleted && (
        <div className="absolute top-2 right-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <CheckCircle className="w-6 h-6 text-green-400" />
          </motion.div>
        </div>
      )}

      {/* Locked overlay */}
      {challenge.isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-xl backdrop-blur-sm">
          <div className="text-center">
            <Lock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400">{challenge.unlockRequirement}</p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
          catConfig.color
        )}>
          <span className="text-white">{challenge.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-slate-200 truncate">{challenge.title}</h4>
            <Badge className={cn("text-[10px] px-1.5 py-0", diffConfig.color)}>
              {diffConfig.label}
            </Badge>
          </div>
          <p className="text-sm text-slate-400 mb-2">{challenge.description}</p>

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {challenge.current}/{challenge.target}
              </span>
              <span className="text-slate-500">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/50">
        <div className="flex items-center gap-3">
          {/* XP Reward */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1 text-yellow-400">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-medium">+{challenge.xpReward}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Recompensa XP</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Bonus Reward */}
          {challenge.bonusReward && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1 text-purple-400">
                    <Gift className="w-4 h-4" />
                    <span className="text-sm">
                      {challenge.bonusReward.type === 'badge' && '🏅'}
                      {challenge.bonusReward.type === 'coins' && `+${challenge.bonusReward.value}🪙`}
                      {challenge.bonusReward.type === 'multiplier' && `x${challenge.bonusReward.value}`}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {challenge.bonusReward.type === 'badge' && 'Badge especial'}
                  {challenge.bonusReward.type === 'coins' && 'Monedas bonus'}
                  {challenge.bonusReward.type === 'multiplier' && 'Multiplicador XP'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Time remaining */}
          <div className="flex items-center gap-1 text-slate-500">
            <Clock className="w-3 h-3" />
            <span className="text-xs">{timeRemaining}</span>
          </div>
        </div>

        {/* Claim button */}
        {challenge.isCompleted && !challenge.isLocked && (
          <Button
            size="sm"
            onClick={() => onClaim(challenge.id)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Gift className="w-4 h-4 mr-1" />
            Reclamar
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export const WeeklyChallenges: React.FC<WeeklyChallengesProps> = ({ className }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'special'>('daily');
  const { fireCelebration, fireStarBurst } = useCelebration();

  useEffect(() => {
    setChallenges(generateChallenges());
  }, []);

  const handleClaimReward = useCallback((challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    // Fire celebration
    fireCelebration();
    setTimeout(() => fireStarBurst(), 300);

    // Show toast with reward
    toast.success(
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-yellow-400" />
        <span>¡+{challenge.xpReward} XP obtenidos!</span>
        {challenge.bonusReward && (
          <Badge className="ml-2 bg-purple-500/20 text-purple-400">
            Bonus: {challenge.bonusReward.type === 'coins' && `+${challenge.bonusReward.value} monedas`}
            {challenge.bonusReward.type === 'badge' && 'Badge desbloqueado'}
            {challenge.bonusReward.type === 'multiplier' && `x${challenge.bonusReward.value} activo`}
          </Badge>
        )}
      </div>,
      { duration: 4000 }
    );

    // Remove challenge from list (or mark as claimed)
    setChallenges(prev => prev.filter(c => c.id !== challengeId));
  }, [challenges, fireCelebration, fireStarBurst]);

  const filteredChallenges = challenges.filter(c => c.type === activeTab);
  const completedToday = challenges.filter(c => c.type === 'daily' && c.isCompleted).length;
  const totalDaily = challenges.filter(c => c.type === 'daily').length;

  return (
    <Card className={cn("bg-slate-900/50 border-slate-800", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
              <Flame className="w-5 h-5 text-white" />
            </div>
            Retos y Desafíos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              {completedToday}/{totalDaily} hoy
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          {(['daily', 'weekly', 'special'] as const).map(tab => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1",
                activeTab === tab && "bg-primary hover:bg-primary/90"
              )}
            >
              {tab === 'daily' && <Clock className="w-4 h-4 mr-1" />}
              {tab === 'weekly' && <TrendingUp className="w-4 h-4 mr-1" />}
              {tab === 'special' && <Star className="w-4 h-4 mr-1" />}
              {tab === 'daily' && 'Diarios'}
              {tab === 'weekly' && 'Semanales'}
              {tab === 'special' && 'Especiales'}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredChallenges.length > 0 ? (
                filteredChallenges.map(challenge => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onClaim={handleClaimReward}
                  />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <Trophy className="w-12 h-12 text-slate-600 mb-3" />
                  <p className="text-slate-400">No hay retos disponibles</p>
                  <p className="text-sm text-slate-500">¡Vuelve mañana para nuevos desafíos!</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Weekly Progress Summary */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-slate-800 to-slate-800/50 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">Progreso Semanal</span>
            <span className="text-sm text-primary">
              {challenges.filter(c => c.isCompleted).length}/{challenges.length} completados
            </span>
          </div>
          <Progress 
            value={(challenges.filter(c => c.isCompleted).length / challenges.length) * 100} 
            className="h-2"
          />
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
            <span>XP potencial restante: {challenges.filter(c => !c.isCompleted).reduce((acc, c) => acc + c.xpReward, 0)}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyChallenges;
