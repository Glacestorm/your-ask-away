/**
 * ESGReportingPanel - Fase 13: ESG y Sostenibilidad
 */
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Leaf, Users, Building } from 'lucide-react';
import { useObelixiaESG } from '@/hooks/admin/obelixia-accounting/useObelixiaESG';
import { cn } from '@/lib/utils';

export function ESGReportingPanel() {
  const { isLoading, scores, carbonFootprint, fetchMetrics, analyzeImpact } = useObelixiaESG();

  useEffect(() => { fetchMetrics(); analyzeImpact({}); }, [fetchMetrics, analyzeImpact]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Leaf className="h-6 w-6 text-green-500" />
            ESG y Sostenibilidad
          </h2>
          <p className="text-muted-foreground">Environmental, Social & Governance</p>
        </div>
        <Button onClick={() => fetchMetrics()} disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-green-500/30">
          <CardContent className="pt-6 text-center">
            <Leaf className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-3xl font-bold text-green-600">{scores.environmental}</div>
            <p className="text-sm text-muted-foreground">Environmental</p>
            <Progress value={scores.environmental} className="mt-2" />
          </CardContent>
        </Card>
        <Card className="border-blue-500/30">
          <CardContent className="pt-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-3xl font-bold text-blue-600">{scores.social}</div>
            <p className="text-sm text-muted-foreground">Social</p>
            <Progress value={scores.social} className="mt-2" />
          </CardContent>
        </Card>
        <Card className="border-purple-500/30">
          <CardContent className="pt-6 text-center">
            <Building className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-3xl font-bold text-purple-600">{scores.governance}</div>
            <p className="text-sm text-muted-foreground">Governance</p>
            <Progress value={scores.governance} className="mt-2" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{scores.overall}</div>
            <p className="text-sm text-muted-foreground">Score ESG Total</p>
            <Progress value={scores.overall} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {carbonFootprint && (
        <Card>
          <CardHeader><CardTitle>Huella de Carbono</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div><div className="text-xl font-bold">{carbonFootprint.scope1}</div><p className="text-xs text-muted-foreground">Scope 1 (tCO2e)</p></div>
              <div><div className="text-xl font-bold">{carbonFootprint.scope2}</div><p className="text-xs text-muted-foreground">Scope 2 (tCO2e)</p></div>
              <div><div className="text-xl font-bold">{carbonFootprint.scope3}</div><p className="text-xs text-muted-foreground">Scope 3 (tCO2e)</p></div>
              <div><div className="text-xl font-bold text-green-600">{carbonFootprint.total}</div><p className="text-xs text-muted-foreground">Total (tCO2e)</p></div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ESGReportingPanel;
