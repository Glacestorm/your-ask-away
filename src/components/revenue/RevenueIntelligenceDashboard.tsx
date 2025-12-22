import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useRevenueIntelligence } from '@/hooks/useRevenueIntelligence';
import { useExpansionIntelligence } from '@/hooks/useExpansionIntelligence';
import { useRevenueRiskAlerts } from '@/hooks/useRevenueRiskAlerts';

export const RevenueIntelligenceDashboard: React.FC = () => {
  const { currentMetrics, isLoading: revenueLoading } = useRevenueIntelligence();
  const { expansionMetrics, isLoading: expansionLoading } = useExpansionIntelligence();
  const { riskSummary, isLoading: riskLoading } = useRevenueRiskAlerts();

  const isLoading = revenueLoading || expansionLoading || riskLoading;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Cargando Revenue Intelligence...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          Revenue Intelligence Dashboard
        </h2>
        <Badge variant="outline">Fase 4</Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">MRR</p>
            <p className="text-2xl font-bold">${currentMetrics.currentMRR.toLocaleString()}</p>
            <div className={`flex items-center text-sm ${currentMetrics.mrrGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {currentMetrics.mrrGrowth >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {Math.abs(currentMetrics.mrrGrowth).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">NRR</p>
            <p className="text-2xl font-bold">{currentMetrics.nrr}%</p>
            <Progress value={currentMetrics.nrr} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Expansion Pipeline</p>
            <p className="text-2xl font-bold">${expansionMetrics.pipelineValue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{expansionMetrics.totalOpportunities} oportunidades</p>
          </CardContent>
        </Card>

        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-4">
            <p className="text-sm text-red-600">MRR en Riesgo</p>
            <p className="text-2xl font-bold text-red-600">${riskSummary.totalMRRAtRisk.toLocaleString()}</p>
            <p className="text-xs text-red-500">{riskSummary.criticalAlerts} alertas críticas</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Expansion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-sm">Expansion MRR</span><span className="font-medium">${currentMetrics.expansionMRR.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-sm">Won MRR</span><span className="font-medium text-green-600">${expansionMetrics.wonMRR.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-sm">Conversion Rate</span><span className="font-medium">{expansionMetrics.conversionRate.toFixed(1)}%</span></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Contraction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-sm">Contraction MRR</span><span className="font-medium text-orange-500">${currentMetrics.contractionMRR.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-sm">Churned MRR</span><span className="font-medium text-red-500">${currentMetrics.churnedMRR.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-sm">GRR</span><span className="font-medium">{currentMetrics.grr}%</span></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Alertas de Riesgo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-sm">Críticas</span><Badge variant="destructive">{riskSummary.criticalAlerts}</Badge></div>
              <div className="flex justify-between"><span className="text-sm">Altas</span><Badge variant="secondary">{riskSummary.highAlerts}</Badge></div>
              <div className="flex justify-between"><span className="text-sm">En Progreso</span><Badge variant="outline">{riskSummary.inProgressAlerts}</Badge></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevenueIntelligenceDashboard;
