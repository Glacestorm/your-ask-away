/**
 * BudgetStatusBadge - Badge de estado del presupuesto
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';

export type BudgetLineStatus = 'on_track' | 'warning' | 'critical' | 'exceeded';

export interface BudgetStatusBadgeProps {
  status: BudgetLineStatus;
}

const statusConfig: Record<BudgetLineStatus, { label: string; className: string }> = {
  on_track: { label: 'En objetivo', className: 'bg-emerald-500/20 text-emerald-700' },
  warning: { label: 'Atención', className: 'bg-amber-500/20 text-amber-700' },
  critical: { label: 'Crítico', className: 'bg-red-500/20 text-red-700' },
  exceeded: { label: 'Excedido', className: 'bg-red-600/20 text-red-700' },
};

export function BudgetStatusBadge({ status }: BudgetStatusBadgeProps) {
  const config = statusConfig[status];
  
  if (!config) {
    return <Badge variant="outline">-</Badge>;
  }

  return <Badge className={config.className}>{config.label}</Badge>;
}

export function getStatusColor(status: BudgetLineStatus): string {
  const colorMap: Record<BudgetLineStatus, string> = {
    on_track: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
    exceeded: 'bg-red-600',
  };
  return colorMap[status] || 'bg-muted';
}

export default BudgetStatusBadge;
