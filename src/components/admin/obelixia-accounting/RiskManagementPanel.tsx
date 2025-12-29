/**
 * RiskManagementPanel - Fase 13
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, ShieldAlert, Activity } from 'lucide-react';
import { useObelixiaRiskManagement } from '@/hooks/admin/obelixia-accounting/useObelixiaRiskManagement';
import { cn } from '@/lib/utils';

const riskColors = { critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-green-500' };

export function RiskManagementPanel() {
  const { isLoading, risks, kris, fetchRisks, monitorKRIs } = useObelixiaRiskManagement();

  useEffect(() => { fetchRisks(); monitorKRIs(); }, [fetchRisks, monitorKRIs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            Gestión de Riesgos
          </h2>
          <p className="text-muted-foreground">Monitoreo y mitigación de riesgos financieros</p>
        </div>
        <Button onClick={() => { fetchRisks(); monitorKRIs(); }} disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['critical', 'high', 'medium', 'low'].map((level) => (
          <Card key={level}>
            <CardContent className="pt-6 text-center">
              <div className={cn("w-3 h-3 rounded-full mx-auto mb-2", riskColors[level as keyof typeof riskColors])} />
              <div className="text-2xl font-bold">{risks.filter(r => r.impact === level).length}</div>
              <p className="text-sm text-muted-foreground capitalize">{level}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Riesgos Activos</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {risks.map((risk) => (
                  <div key={risk.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{risk.name}</p>
                      <Badge variant={risk.impact === 'critical' ? 'destructive' : 'secondary'}>{risk.impact}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{risk.category}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>KRIs - Indicadores Clave</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {kris.map((kri) => (
                  <div key={kri.id} className="p-3 border rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className={cn("h-4 w-4", kri.status === 'green' ? 'text-green-500' : kri.status === 'yellow' ? 'text-yellow-500' : 'text-red-500')} />
                      <span>{kri.name}</span>
                    </div>
                    <Badge variant={kri.status === 'red' ? 'destructive' : 'secondary'}>{kri.currentValue}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default RiskManagementPanel;
