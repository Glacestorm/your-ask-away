/**
 * BudgetSummaryCards - Tarjetas de resumen del presupuesto
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

export interface BudgetSummary {
  totalBudgetedRevenue: number;
  totalActualRevenue: number;
  totalBudgetedExpenses: number;
  totalActualExpenses: number;
  budgetedNetIncome: number;
  actualNetIncome: number;
  revenueVariance: number;
  revenueVariancePercentage: number;
  expenseVariance: number;
  expenseVariancePercentage: number;
  budgetUtilization: number;
  overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface BudgetSummaryCardsProps {
  summary: BudgetSummary;
  formatCurrency: (amount: number) => string;
  className?: string;
}

export function BudgetSummaryCards({ summary, formatCurrency, className }: BudgetSummaryCardsProps) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${className || ''}`}>
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <span className="text-xs text-muted-foreground">Ingresos</span>
        </div>
        <p className="text-lg font-bold">{formatCurrency(summary.totalActualRevenue)}</p>
        <div className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">vs</span>
          <span>{formatCurrency(summary.totalBudgetedRevenue)}</span>
          <Badge variant={summary.revenueVariance >= 0 ? "default" : "destructive"} className="text-xs">
            {summary.revenueVariance >= 0 ? '+' : ''}{summary.revenueVariancePercentage.toFixed(1)}%
          </Badge>
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <TrendingDown className="h-4 w-4 text-red-500" />
          <span className="text-xs text-muted-foreground">Gastos</span>
        </div>
        <p className="text-lg font-bold">{formatCurrency(summary.totalActualExpenses)}</p>
        <div className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">vs</span>
          <span>{formatCurrency(summary.totalBudgetedExpenses)}</span>
          <Badge variant={summary.expenseVariance <= 0 ? "default" : "destructive"} className="text-xs">
            {summary.expenseVariance >= 0 ? '+' : ''}{summary.expenseVariancePercentage.toFixed(1)}%
          </Badge>
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="h-4 w-4 text-blue-500" />
          <span className="text-xs text-muted-foreground">Resultado</span>
        </div>
        <p className="text-lg font-bold">{formatCurrency(summary.actualNetIncome)}</p>
        <div className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">Ppto:</span>
          <span>{formatCurrency(summary.budgetedNetIncome)}</span>
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="h-4 w-4 text-purple-500" />
          <span className="text-xs text-muted-foreground">Utilización</span>
        </div>
        <p className="text-lg font-bold">{summary.budgetUtilization.toFixed(1)}%</p>
        <Progress value={summary.budgetUtilization} className="h-1.5 mt-1" />
      </Card>
    </div>
  );
}

export default BudgetSummaryCards;
