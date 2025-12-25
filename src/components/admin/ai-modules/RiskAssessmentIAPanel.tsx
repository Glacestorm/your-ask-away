import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, AlertOctagon, Shield, Maximize2, Minimize2 } from 'lucide-react';
import { useRiskAssessmentIA } from '@/hooks/admin/useRiskAssessmentIA';
import { cn } from '@/lib/utils';

interface RiskAssessmentIAPanelProps {
  context?: { entityId: string } | null;
  className?: string;
}

export function RiskAssessmentIAPanel({ context, className }: RiskAssessmentIAPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isLoading, assessment, alerts, assessRisk, fetchAlerts, getRiskLevelColor, getRiskScoreColor } = useRiskAssessmentIA();

  useEffect(() => {
    if (context?.entityId) {
      assessRisk(context.entityId, 'company');
      fetchAlerts();
    }
  }, [context?.entityId, assessRisk, fetchAlerts]);

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <AlertOctagon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Selecciona una entidad para evaluar riesgo</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all duration-300 overflow-hidden", isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
              <AlertOctagon className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-base">Risk Assessment IA</CardTitle>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => assessRisk(context.entityId, 'company')} disabled={isLoading} className="h-8 w-8">
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8">
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
          <div className="space-y-3">
            {assessment && (
              <div className="p-4 rounded-lg border bg-card text-center">
                <p className={cn("text-3xl font-bold", getRiskScoreColor(assessment.overall_score))}>{assessment.overall_score}</p>
                <Badge variant="outline" className={cn("mt-2", getRiskLevelColor(assessment.risk_level))}>{assessment.risk_level}</Badge>
              </div>
            )}
            {assessment?.factors?.map((factor, idx) => (
              <div key={idx} className="p-3 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{factor.name}</span>
                  <Badge variant="outline" className="text-xs">{factor.trend}</Badge>
                </div>
                <Progress value={factor.score} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{factor.description}</p>
              </div>
            ))}
            {assessment?.mitigations?.map((m, idx) => (
              <div key={idx} className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm">{m.action}</span>
                </div>
                <Badge variant="secondary" className="text-xs mt-2">Impacto: {m.impact}%</Badge>
              </div>
            ))}
            {alerts.map((alert) => (
              <div key={alert.id} className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                <div className="flex items-center gap-2">
                  <AlertOctagon className={cn("h-4 w-4", getRiskLevelColor(alert.risk_level))} />
                  <span className="text-sm">{alert.entity_name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{alert.trigger}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default RiskAssessmentIAPanel;
