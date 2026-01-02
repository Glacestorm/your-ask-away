/**
 * HealthScoreCard - Tarjeta de puntuación de salud financiera
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIRatioInsight } from '@/hooks/erp/useERPFinancialRatios';

export interface HealthScoreCardProps {
  aiInsights: AIRatioInsight | null;
  className?: string;
}

const getHealthColor = (score: number) => {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-blue-500';
  if (score >= 40) return 'text-amber-500';
  return 'text-red-500';
};

const getHealthBg = (health: string) => {
  switch (health) {
    case 'excellent': return 'bg-emerald-500';
    case 'good': return 'bg-blue-500';
    case 'fair': return 'bg-amber-500';
    case 'poor': return 'bg-orange-500';
    case 'critical': return 'bg-red-500';
    default: return 'bg-muted';
  }
};

export function HealthScoreCard({ aiInsights, className }: HealthScoreCardProps) {
  return (
    <Card className={cn("lg:col-span-1", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Salud Financiera
        </CardTitle>
      </CardHeader>
      <CardContent>
        {aiInsights ? (
          <div className="text-center py-4">
            <div className={cn(
              "text-5xl font-bold mb-2",
              getHealthColor(aiInsights.healthScore)
            )}>
              {aiInsights.healthScore}
            </div>
            <Badge className={cn("mb-4", getHealthBg(aiInsights.overallHealth))}>
              {aiInsights.overallHealth.toUpperCase()}
            </Badge>
            <Progress 
              value={aiInsights.healthScore} 
              className="h-2 mb-4" 
            />
            <p className="text-sm text-muted-foreground">
              {aiInsights.summary}
            </p>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Brain className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Ejecuta el análisis IA para obtener el score de salud financiera
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default HealthScoreCard;
