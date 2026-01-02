/**
 * AIInsightsCards - Tarjetas de insights de IA (fortalezas, debilidades, recomendaciones)
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  Lightbulb 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIRatioInsight } from '@/hooks/erp/useERPFinancialRatios';

export interface AIInsightsCardsProps {
  aiInsights: AIRatioInsight;
  className?: string;
}

export function AIStrengthsCard({ aiInsights, className }: AIInsightsCardsProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-emerald-600">
          <CheckCircle className="h-5 w-5" />
          Fortalezas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {aiInsights.keyStrengths.map((strength, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <ArrowUpRight className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              {strength}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function AIWeaknessesCard({ aiInsights, className }: AIInsightsCardsProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-amber-600">
          <AlertTriangle className="h-5 w-5" />
          Áreas de Mejora
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {aiInsights.keyWeaknesses.map((weakness, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <ArrowDownRight className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              {weakness}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function AIRecommendationsCard({ aiInsights, className }: AIInsightsCardsProps) {
  if (!aiInsights.recommendations || aiInsights.recommendations.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Recomendaciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {aiInsights.recommendations.map((rec, idx) => (
            <div 
              key={idx} 
              className={cn(
                "p-3 rounded-lg border-l-4",
                rec.priority === 'high' 
                  ? 'bg-red-500/5 border-red-500' 
                  : rec.priority === 'medium'
                  ? 'bg-amber-500/5 border-amber-500'
                  : 'bg-blue-500/5 border-blue-500'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className="text-xs">
                  {rec.area}
                </Badge>
                <Badge 
                  variant={rec.priority === 'high' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Media' : 'Baja'}
                </Badge>
              </div>
              <p className="text-sm font-medium">{rec.action}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Impacto esperado: {rec.expectedImpact}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default { AIStrengthsCard, AIWeaknessesCard, AIRecommendationsCard };
