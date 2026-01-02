/**
 * BudgetInsightItem - Componente para renderizar un insight de IA del presupuesto
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIBudgetInsight } from '@/hooks/erp/useERPBudget';

export interface BudgetInsightItemProps {
  insight: AIBudgetInsight;
}

export function BudgetInsightItem({ insight }: BudgetInsightItemProps) {
  const getIcon = () => {
    switch (insight.type) {
      case 'optimization':
        return <TrendingUp className="h-4 w-4 text-emerald-600" />;
      case 'risk':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'opportunity':
        return <Lightbulb className="h-4 w-4 text-blue-600" />;
      case 'trend':
        return <TrendingDown className="h-4 w-4 text-purple-600" />;
      default:
        return <Lightbulb className="h-4 w-4 text-purple-600" />;
    }
  };

  const getBackgroundClass = () => {
    switch (insight.type) {
      case 'optimization':
        return 'bg-emerald-100 dark:bg-emerald-900/30';
      case 'risk':
        return 'bg-amber-100 dark:bg-amber-900/30';
      case 'opportunity':
        return 'bg-blue-100 dark:bg-blue-900/30';
      case 'trend':
        return 'bg-purple-100 dark:bg-purple-900/30';
      default:
        return 'bg-purple-100 dark:bg-purple-900/30';
    }
  };

  return (
    <div className="p-3 rounded-lg border bg-gradient-to-r from-primary/5 to-accent/5">
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", getBackgroundClass())}>
          {getIcon()}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">{insight.title}</p>
            <Badge 
              variant={insight.impact === 'high' ? 'destructive' : 'secondary'} 
              className="text-xs"
            >
              {insight.impact === 'high' ? 'Alto' : insight.impact === 'medium' ? 'Medio' : 'Bajo'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
          
          {insight.suggestedActions && insight.suggestedActions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {insight.suggestedActions.slice(0, 2).map((action, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {action}
                </Badge>
              ))}
            </div>
          )}
          
          {insight.potentialSavings && (
            <p className="text-xs text-muted-foreground mt-2">
              Ahorro potencial: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(insight.potentialSavings)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default BudgetInsightItem;
