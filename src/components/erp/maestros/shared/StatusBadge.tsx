/**
 * Badge de estado reutilizable
 */

import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertTriangle, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusType = 'active' | 'inactive' | 'pending' | 'warning' | 'paused';

export interface StatusBadgeProps {
  status: StatusType | boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  showIcon?: boolean;
  size?: 'sm' | 'default';
  className?: string;
}

const statusConfig: Record<StatusType, { 
  icon: React.ElementType; 
  className: string; 
  label: string;
}> = {
  active: {
    icon: CheckCircle,
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
    label: 'Activo'
  },
  inactive: {
    icon: XCircle,
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    label: 'Inactivo'
  },
  pending: {
    icon: Clock,
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    label: 'Pendiente'
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    label: 'Atención'
  },
  paused: {
    icon: Pause,
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    label: 'Pausado'
  }
};

export const StatusBadge = memo(function StatusBadge({
  status,
  activeLabel,
  inactiveLabel,
  showIcon = true,
  size = 'default',
  className
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

  return (
    <Badge 
      variant="outline"
      className={cn(
        'gap-1 font-normal border',
        config.className,
        size === 'sm' && 'text-[10px] px-1.5 py-0',
        className
      )}
    >
      {showIcon && <Icon className={cn('h-3 w-3', size === 'sm' && 'h-2.5 w-2.5')} />}
      {label}
    </Badge>
  );
});

export default StatusBadge;
