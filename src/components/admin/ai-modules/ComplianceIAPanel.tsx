import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Shield, AlertTriangle, CheckCircle, Maximize2, Minimize2 } from 'lucide-react';
import { useComplianceIA } from '@/hooks/admin/useComplianceIA';
import { cn } from '@/lib/utils';

interface ComplianceIAPanelProps {
  context?: { entityId: string } | null;
  className?: string;
}

export function ComplianceIAPanel({ className }: ComplianceIAPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isLoading, summary, alerts, runComplianceCheck, fetchAlerts, fetchSummary, getSeverityColor } = useComplianceIA();

  useEffect(() => { fetchAlerts(); fetchSummary(); }, [fetchAlerts, fetchSummary]);

  return (
    <Card className={cn("transition-all duration-300 overflow-hidden", isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-base">Compliance IA</CardTitle>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => runComplianceCheck('general')} disabled={isLoading} className="h-8 w-8">
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
          <div className="space-y-2">
            {summary.map((item) => (
              <div key={item.regulation} className="p-3 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{item.regulation}</span>
                  {item.compliance_score >= 80 ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                </div>
                <Progress value={item.compliance_score} className="h-2" />
              </div>
            ))}
            {alerts.map((alert) => (
              <div key={alert.id} className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={cn("h-4 w-4", getSeverityColor(alert.severity))} />
                  <span className="text-sm">{alert.title}</span>
                </div>
                <Badge variant="outline" className="text-xs mt-2">{alert.severity}</Badge>
              </div>
            ))}
            {summary.length === 0 && alerts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Ejecuta una verificación de cumplimiento</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default ComplianceIAPanel;
