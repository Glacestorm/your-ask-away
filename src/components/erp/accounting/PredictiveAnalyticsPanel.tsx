/**
 * PredictiveAnalyticsPanel - Panel de analítica predictiva y forecasting
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Calendar,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { HelpTooltip } from './HelpTooltip';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { useERPForecasting } from '@/hooks/erp/useERPForecasting';
import { cn } from '@/lib/utils';

interface Forecast {
  period: string;
  predicted_revenue: number;
  predicted_expenses: number;
  predicted_cashflow: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

interface Scenario {
  name: string;
  description: string;
  impact_revenue: number;
  impact_expenses: number;
  probability: number;
}

interface PredictiveAnalyticsPanelProps {
  className?: string;
}

export function PredictiveAnalyticsPanel({ className }: PredictiveAnalyticsPanelProps) {
  const { currentCompany } = useERPContext();
  const {
    isLoading,
    forecast: hookForecast,
    scenarios: hookScenarios,
    generateForecast,
    analyzeScenarios
  } = useERPForecasting();

  const [horizon, setHorizon] = useState('3m');
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeTab, setActiveTab] = useState('forecast');

  // Sync hook data to local state
  useEffect(() => {
    if (hookForecast?.forecast?.periods) {
      setForecasts(hookForecast.forecast.periods.map((p, i) => ({
        period: p.period,
        predicted_revenue: p.projected_revenue || 0,
        predicted_expenses: p.projected_expenses || 0,
        predicted_cashflow: p.projected_net || 0,
        confidence: p.confidence,
        trend: hookForecast.forecast.summary.trend === 'growth' ? 'up' : 
               hookForecast.forecast.summary.trend === 'decline' ? 'down' : 'stable'
      })));
    }
  }, [hookForecast]);

  useEffect(() => {
    if (hookScenarios?.scenarios) {
      setScenarios(hookScenarios.scenarios.map(s => ({
        name: s.name,
        description: s.recommendations.join('. '),
        impact_revenue: ((s.projections.revenue - 100000) / 100000) * 100,
        impact_expenses: ((s.projections.expenses - 80000) / 80000) * 100,
        probability: s.probability
      })));
    }
  }, [hookScenarios]);

  const handleGenerateForecast = async () => {
    if (!currentCompany?.id) return;

    const months = horizon === '1m' ? 1 : horizon === '3m' ? 3 : horizon === '6m' ? 6 : 12;

    await generateForecast(currentCompany.id, 'comprehensive', months);
    await analyzeScenarios(currentCompany.id, { revenue: 100000, expenses: 80000 });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currentCompany?.currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toFixed(1)}%`;
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            Analítica Predictiva
            <HelpTooltip
              type="tip"
              title="Pronósticos IA"
              content="Proyecciones de flujo de caja, ingresos y gastos basados en modelos de Machine Learning."
            />
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={horizon} onValueChange={setHorizon}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1 mes</SelectItem>
                <SelectItem value="3m">3 meses</SelectItem>
                <SelectItem value="6m">6 meses</SelectItem>
                <SelectItem value="12m">12 meses</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleGenerateForecast}
              disabled={isLoading}
              size="sm"
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="forecast" className="text-xs gap-1">
              <TrendingUp className="h-3 w-3" />
              Pronóstico
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="text-xs gap-1">
              <Target className="h-3 w-3" />
              Escenarios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forecast" className="mt-0">
            {forecasts.length > 0 ? (
              <div className="space-y-3">
                {forecasts.map((forecast, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{forecast.period}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {forecast.confidence}% confianza
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Ingresos</p>
                        <p className="font-bold text-green-600 text-sm">
                          {formatCurrency(forecast.predicted_revenue)}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Gastos</p>
                        <p className="font-bold text-red-600 text-sm">
                          {formatCurrency(forecast.predicted_expenses)}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Cash Flow</p>
                        <p className={cn(
                          "font-bold text-sm",
                          forecast.predicted_cashflow >= 0 ? 'text-blue-600' : 'text-red-600'
                        )}>
                          {formatCurrency(forecast.predicted_cashflow)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center mt-2 gap-1 text-xs">
                      {forecast.trend === 'up' && (
                        <>
                          <ArrowUpRight className="h-3 w-3 text-green-500" />
                          <span className="text-green-600">Tendencia alcista</span>
                        </>
                      )}
                      {forecast.trend === 'down' && (
                        <>
                          <ArrowDownRight className="h-3 w-3 text-red-500" />
                          <span className="text-red-600">Tendencia bajista</span>
                        </>
                      )}
                      {forecast.trend === 'stable' && (
                        <span className="text-muted-foreground">Tendencia estable</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Genera un pronóstico para ver proyecciones</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scenarios" className="mt-0">
            {scenarios.length > 0 ? (
              <div className="space-y-3">
                {scenarios.map((scenario, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{scenario.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {scenario.probability}% prob.
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{scenario.description}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className={cn(
                        "p-2 rounded text-center text-xs",
                        scenario.impact_revenue >= 0 
                          ? 'bg-green-100 dark:bg-green-950/30' 
                          : 'bg-red-100 dark:bg-red-950/30'
                      )}>
                        <span className="text-muted-foreground">Ingresos: </span>
                        <span className={cn("font-medium", scenario.impact_revenue >= 0 ? 'text-green-600' : 'text-red-600')}>
                          {formatPercent(scenario.impact_revenue)}
                        </span>
                      </div>
                      <div className={cn(
                        "p-2 rounded text-center text-xs",
                        scenario.impact_expenses <= 0 
                          ? 'bg-green-100 dark:bg-green-950/30' 
                          : 'bg-red-100 dark:bg-red-950/30'
                      )}>
                        <span className="text-muted-foreground">Gastos: </span>
                        <span className={cn("font-medium", scenario.impact_expenses <= 0 ? 'text-green-600' : 'text-red-600')}>
                          {formatPercent(scenario.impact_expenses)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Genera un pronóstico para ver escenarios</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default PredictiveAnalyticsPanel;
