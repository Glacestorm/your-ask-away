import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  TrendingUp, 
  Shield, 
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIAnalysis {
  summary?: string;
  priorities?: Array<{
    issue: string;
    priority: string;
    recommendation: string;
  }>;
  compliance_risks?: string[];
  optimization_suggestions?: string[];
}

interface AdvisorRecommendationsProps {
  analysis: AIAnalysis;
}

export function AdvisorRecommendations({ analysis }: AdvisorRecommendationsProps) {
  if (!analysis) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'alta':
        return 'bg-destructive text-destructive-foreground';
      case 'media':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      {analysis.summary && (
        <Card className="p-4 bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Resumen del Análisis</p>
              <p className="text-sm text-muted-foreground mt-1">{analysis.summary}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Priorities */}
      {analysis.priorities && analysis.priorities.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Prioridades
          </h4>
          {analysis.priorities.map((item, idx) => (
            <Card key={idx} className="p-3">
              <div className="flex items-start gap-3">
                <Badge className={cn("text-[10px] shrink-0", getPriorityColor(item.priority))}>
                  {item.priority}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.issue}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                    <ChevronRight className="h-3 w-3 mt-0.5 shrink-0" />
                    {item.recommendation}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Compliance Risks */}
      {analysis.compliance_risks && analysis.compliance_risks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Riesgos de Cumplimiento
          </h4>
          <Card className="p-3 bg-destructive/5 border-destructive/20">
            <ul className="space-y-1.5">
              {analysis.compliance_risks.map((risk, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* Optimization Suggestions */}
      {analysis.optimization_suggestions && analysis.optimization_suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Sugerencias de Optimización
          </h4>
          <Card className="p-3 bg-green-500/5 border-green-500/20">
            <ul className="space-y-1.5">
              {analysis.optimization_suggestions.map((suggestion, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <ChevronRight className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AdvisorRecommendations;
