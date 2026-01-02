/**
 * CashFlowKPIs - KPIs principales de flujo de caja
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { DollarSign, Calendar, TrendingDown, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LiquidityMetrics {
  current_cash: number;
  cash_runway_days: number;
  cash_burn_rate: number;
  liquidity_ratio: number;
}

export interface CashFlowKPIsProps {
  liquidityMetrics: LiquidityMetrics | null;
  formatCurrency: (amount: number) => string;
  className?: string;
}

export function CashFlowKPIs({ liquidityMetrics, formatCurrency, className }: CashFlowKPIsProps) {
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-3", className)}>
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Efectivo Actual</p>
            <p className="text-lg font-bold text-emerald-600">
              {formatCurrency(liquidityMetrics?.current_cash || 0)}
            </p>
          </div>
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Días de Runway</p>
            <p className={cn(
              "text-lg font-bold",
              (liquidityMetrics?.cash_runway_days || 0) > 90 ? 'text-emerald-600' :
              (liquidityMetrics?.cash_runway_days || 0) > 30 ? 'text-amber-600' : 'text-red-600'
            )}>
              {liquidityMetrics?.cash_runway_days || 0} días
            </p>
          </div>
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Burn Rate Diario</p>
            <p className="text-lg font-bold text-amber-600">
              {formatCurrency(liquidityMetrics?.cash_burn_rate || 0)}
            </p>
          </div>
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <TrendingDown className="h-4 w-4 text-amber-600" />
          </div>
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Ratio Liquidez</p>
            <p className={cn(
              "text-lg font-bold",
              (liquidityMetrics?.liquidity_ratio || 0) >= 1.5 ? 'text-emerald-600' :
              (liquidityMetrics?.liquidity_ratio || 0) >= 1 ? 'text-amber-600' : 'text-red-600'
            )}>
              {(liquidityMetrics?.liquidity_ratio || 0).toFixed(2)}
            </p>
          </div>
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Target className="h-4 w-4 text-purple-600" />
          </div>
        </div>
      </Card>
    </div>
  );
}

export default CashFlowKPIs;
