/**
 * Badge de estado reutilizable
 * @version 2.0 - Mejoras: Más estados, animación de pulso, tooltips
 */

import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Pause, 
  Ban,
  Loader2,
  CheckCheck,
  Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusType = 
  | 'active' 
  | 'inactive' 
  | 'pending' 
  | 'warning' 
  | 'paused' 
  | 'blocked'
  | 'processing'
  | 'completed'
  | 'expired';

export interface StatusBadgeProps {
  status: StatusType | boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  showIcon?: boolean;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  pulse?: boolean;
  tooltip?: string;
}

const statusConfig: Record<StatusType, { 
  icon: React.ElementType; 
  className: string; 
  label: string;
  description: string;
}> = {
  active: {
    icon: CheckCircle,
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
    label: 'Activo',
    description: 'El elemento está activo y funcionando correctamente'
  },
  inactive: {
    icon: XCircle,
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    label: 'Inactivo',
    description: 'El elemento está desactivado'
  },
  pending: {
    icon: Clock,
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    label: 'Pendiente',
    description: 'Esperando acción o aprobación'
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    label: 'Atención',
    description: 'Requiere atención o revisión'
  },
  paused: {
    icon: Pause,
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    label: 'Pausado',
    description: 'Temporalmente detenido'
  },
  blocked: {
    icon: Ban,
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    label: 'Bloqueado',
    description: 'Acceso denegado o bloqueado'
  },
  processing: {
    icon: Loader2,
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    label: 'Procesando',
    description: 'En proceso de ejecución'
  },
  completed: {
    icon: CheckCheck,
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    label: 'Completado',
    description: 'Finalizado exitosamente'
  },
  expired: {
    icon: Timer,
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    label: 'Expirado',
    description: 'Ha caducado o vencido'
  }
};

const sizeClasses = {
  sm: 'text-[10px] px-1.5 py-0 h-5',
  default: 'text-xs px-2 py-0.5',
  lg: 'text-sm px-3 py-1'
};

const iconSizes = {
  sm: 'h-2.5 w-2.5',
  default: 'h-3 w-3',
  lg: 'h-4 w-4'
};

export const StatusBadge = memo(function StatusBadge({
  status,
  activeLabel,
  inactiveLabel,
  showIcon = true,
  size = 'default',
  className,
  pulse = false,
  tooltip
}: StatusBadgeProps) {
  // Convert boolean to status type
  const statusType: StatusType = typeof status === 'boolean' 
    ? (status ? 'active' : 'inactive')
    : status;

  const config = statusConfig[statusType];
  const Icon = config.icon;

  const label = statusType === 'active' 
    ? (activeLabel || config.label)
    : statusType === 'inactive'
      ? (inactiveLabel || config.label)
      : config.label;

  const badge = (
    <Badge 
      variant="outline"
      className={cn(
        'gap-1 font-normal border transition-all',
        config.className,
        sizeClasses[size],
        pulse && 'animate-pulse',
        className
      )}
    >
      {showIcon && (
        <Icon 
          className={cn(
            iconSizes[size],
            statusType === 'processing' && 'animate-spin'
          )} 
        />
      )}
      {label}
    </Badge>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
});

export default StatusBadge;
