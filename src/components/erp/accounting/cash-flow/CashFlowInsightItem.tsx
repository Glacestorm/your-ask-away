/**
 * CashFlowInsightItem - Componente para renderizar un insight de IA
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Zap, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIInsight } from '@/hooks/erp/useERPCashFlow';

export interface CashFlowInsightItemProps {
  insight: AIInsight;
}

export function CashFlowInsightItem({ insight }: CashFlowInsightItemProps) {
  return (
    <div className="p-3 rounded-lg border bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          insight.type === 'prediction' && 'bg-blue-100 dark:bg-blue-900/30',
          insight.type === 'recommendation' && 'bg-green-100 dark:bg-green-900/30',
          insight.type === 'warning' && 'bg-amber-100 dark:bg-amber-900/30',
          insight.type === 'opportunity' && 'bg-purple-100 dark:bg-purple-900/30'
        )}>
          {insight.type === 'prediction' && <TrendingUp className="h-4 w-4 text-blue-600" />}
          {insight.type === 'recommendation' && <Zap className="h-4 w-4 text-green-600" />}
          {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
          {insight.type === 'opportunity' && <Sparkles className="h-4 w-4 text-purple-600" />}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">{insight.title}</p>
            <Badge variant="outline" className="text-xs">
              {insight.confidence}% confianza
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
          
          {insight.suggested_actions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {insight.suggested_actions.slice(0, 2).map((action, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {action}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CashFlowInsightItem;
