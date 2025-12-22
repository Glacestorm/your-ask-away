import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSmartPrioritization, PrioritizedAccount } from '@/hooks/useSmartPrioritization';
import { useRevenueScoring } from '@/hooks/useRevenueScoring';
import { Sparkles, RefreshCw, TrendingUp, Shield, Users, Target } from 'lucide-react';

const PrioritizationMatrix: React.FC = () => {
  const { prioritizeAccounts, isPrioritizing, prioritizedData, getPriorityMatrix, getQuickWins, getTotalPotentialRevenue, getTotalAtRiskRevenue } = useSmartPrioritization();
  const { scores } = useRevenueScoring();
  const [hasRun, setHasRun] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handlePrioritize = async () => {
    if (!scores || scores.length === 0) return;

    const uniqueCompanies = new Map<string, typeof scores[0]>();
    scores.forEach(s => {
      if (!uniqueCompanies.has(s.company_id)) {
        uniqueCompanies.set(s.company_id, s);
      }
    });

    const accounts = Array.from(uniqueCompanies.values()).slice(0, 20).map(s => ({
      companyId: s.company_id,
      companyName: s.company?.name || 'Empresa',
      mrr: 5000,
      healthScore: s.health_score,
      expansionScore: s.expansion_score,
      retentionScore: s.retention_score,
      plgSignals: 0,
      lastActivity: s.created_at
    }));

    await prioritizeAccounts({ accounts });
    setHasRun(true);
  };

  const prioritizedAccounts = prioritizedData?.prioritizedAccounts || [];
  const matrix = getPriorityMatrix(prioritizedAccounts);
  const quickWins = getQuickWins(prioritizedAccounts);
  const potentialRevenue = getTotalPotentialRevenue(prioritizedAccounts);
  const atRiskRevenue = getTotalAtRiskRevenue(prioritizedAccounts);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'expand': return 'bg-chart-2/10 border-chart-2/30 text-chart-2';
      case 'retain': return 'bg-destructive/10 border-destructive/30 text-destructive';
      case 'nurture': return 'bg-chart-1/10 border-chart-1/30 text-chart-1';
      default: return 'bg-muted border-border text-muted-foreground';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'expand': return 'Expandir';
      case 'retain': return 'Retener';
      case 'nurture': return 'Nutrir';
      default: return 'Monitorear';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Matriz de Priorización IA
            </CardTitle>
            <Button
              onClick={handlePrioritize}
              disabled={isPrioritizing || !scores?.length}
              variant="outline"
              size="sm"
            >
              {isPrioritizing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Analizar con IA
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hasRun && prioritizedAccounts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-chart-2/10 border border-chart-2/20 text-center">
                  <TrendingUp className="h-5 w-5 text-chart-2 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-chart-2">{matrix.expand.length}</p>
                  <p className="text-xs text-muted-foreground">Para Expandir</p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                  <Shield className="h-5 w-5 text-destructive mx-auto mb-2" />
                  <p className="text-2xl font-bold text-destructive">{matrix.retain.length}</p>
                  <p className="text-xs text-muted-foreground">Para Retener</p>
                </div>
                <div className="p-4 rounded-lg bg-chart-1/10 border border-chart-1/20 text-center">
                  <Users className="h-5 w-5 text-chart-1 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-chart-1">{matrix.nurture.length}</p>
                  <p className="text-xs text-muted-foreground">Para Nutrir</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <Target className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                  <p className="text-2xl font-bold">{matrix.monitor.length}</p>
                  <p className="text-xs text-muted-foreground">Monitorear</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-chart-2/5 border border-chart-2/10">
                  <p className="text-sm text-muted-foreground mb-1">Revenue Potencial</p>
                  <p className="text-2xl font-bold text-chart-2">{formatCurrency(potentialRevenue)}</p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/10">
                  <p className="text-sm text-muted-foreground mb-1">Revenue en Riesgo</p>
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(atRiskRevenue)}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="mb-2">Ejecuta el análisis de IA para ver la matriz de priorización</p>
              <p className="text-sm">La IA analizará tus cuentas y recomendará acciones</p>
            </div>
          )}
        </CardContent>
      </Card>

      {hasRun && quickWins.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-chart-2" />
              Quick Wins (Bajo Esfuerzo, Alto Impacto)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickWins.slice(0, 5).map((account) => (
                <div 
                  key={account.companyId}
                  className={`p-4 rounded-lg border ${getPriorityColor(account.priority)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{account.companyName}</p>
                      <Badge variant="outline" className="text-xs">
                        {getPriorityLabel(account.priority)}
                      </Badge>
                    </div>
                    <p className="font-semibold">{formatCurrency(account.mrr)}/mes</p>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{account.reasoning}</p>
                  <div className="flex flex-wrap gap-2">
                    {account.recommendedActions.slice(0, 2).map((action, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {action}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {hasRun && prioritizedAccounts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Todas las Cuentas Priorizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {prioritizedAccounts.map((account) => (
                <div 
                  key={account.companyId}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={getPriorityColor(account.priority)}>
                      {getPriorityLabel(account.priority)}
                    </Badge>
                    <span className="font-medium">{account.companyName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-chart-2">+{(account.expansionPotential * 100).toFixed(0)}%</span>
                    <span className="text-destructive">{(account.churnRisk * 100).toFixed(0)}% riesgo</span>
                    <span className="font-medium">{formatCurrency(account.mrr)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PrioritizationMatrix;
