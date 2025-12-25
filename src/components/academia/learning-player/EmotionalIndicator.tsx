/**
 * EmotionalIndicator - Indicador visual del estado emocional detectado
 * Muestra el nivel de engagement y frustración del estudiante
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Smile, Meh, Frown, Zap, Brain, Coffee, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

export type EmotionalState = 'engaged' | 'neutral' | 'confused' | 'frustrated' | 'tired';

interface EmotionalIndicatorProps {
  state: EmotionalState;
  engagementLevel: number; // 0-100
  confidenceScore: number; // 0-100
  showDetails?: boolean;
  className?: string;
}

const emotionConfig: Record<EmotionalState, {
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
  suggestion: string;
}> = {
  engaged: {
    icon: Smile,
    label: 'Comprometido',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    suggestion: '¡Sigue así! Estás en tu mejor momento.',
  },
  neutral: {
    icon: Meh,
    label: 'Neutral',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20',
    suggestion: 'Mantén el ritmo, vas bien.',
  },
  confused: {
    icon: Brain,
    label: 'Confundido',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    suggestion: 'Considera repasar la sección anterior o preguntar al tutor.',
  },
  frustrated: {
    icon: Frown,
    label: 'Frustrado',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    suggestion: 'Toma un breve descanso o prueba un ejercicio más sencillo.',
  },
  tired: {
    icon: Coffee,
    label: 'Cansado',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    suggestion: 'Un descanso corto puede ayudarte a retener mejor.',
  },
};

export const EmotionalIndicator: React.FC<EmotionalIndicatorProps> = ({
  state,
  engagementLevel,
  confidenceScore,
  showDetails = false,
  className,
}) => {
  const config = emotionConfig[state];
  const Icon = config.icon;

  // Compact version
  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full",
                config.bgColor,
                className
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", config.color)} />
              <span className={cn("text-xs font-medium", config.color)}>
                {engagementLevel}%
              </span>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px]">
            <p className="font-medium">{config.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{config.suggestion}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Detailed version
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-lg border",
        config.bgColor,
        "border-slate-700",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          config.bgColor
        )}>
          <Icon className={cn("w-5 h-5", config.color)} />
        </div>
        
        <div className="flex-1 space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className={cn("font-medium", config.color)}>
                {config.label}
              </span>
              {confidenceScore < 70 && (
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Baja confianza
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {config.suggestion}
            </p>
          </div>

          {/* Engagement meter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Engagement</span>
              <span className={config.color}>{engagementLevel}%</span>
            </div>
            <Progress 
              value={engagementLevel} 
              className="h-1.5"
            />
          </div>

          {/* Quick actions for certain states */}
          {(state === 'confused' || state === 'frustrated') && (
            <div className="flex gap-2 pt-1">
              <button className="text-xs text-primary hover:underline flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Pedir ayuda
              </button>
              <button className="text-xs text-slate-400 hover:underline flex items-center gap-1">
                <Coffee className="w-3 h-3" />
                Tomar descanso
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EmotionalIndicator;
