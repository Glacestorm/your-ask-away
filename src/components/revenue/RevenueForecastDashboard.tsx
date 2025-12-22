import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { useRevenueForecast } from '@/hooks/useRevenueForecast';
import { TrendingUp, Sparkles, RefreshCw, Target, AlertTriangle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const RevenueForecastDashboard: React.FC = () => {
  const { forecasts, isLoading, generateForecast, isGenerating, getForecastTrend, getConfidenceIntervals } = useRevenueForecast();
  const [selectedScenario, setSelectedScenario] = useState<string>('expected');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const trendData = getForecastTrend();
  const confidence = getConfidenceIntervals();
  const latestForecast = forecasts?.find(f => f.scenario === selectedScenario);

  const handleGenerateForecast = async () => {
    await generateForecast({
      forecastType: 'monthly',
      historicalData: {}
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Pronóstico de Revenue con IA</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerateForecast}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generar Pronóstico
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedScenario} onValueChange={setSelectedScenario} className="mb-4">
          <TabsList>
            <TabsTrigger value="optimistic" className="text-chart-2">Optimista</TabsTrigger>
            <TabsTrigger value="expected">Esperado</TabsTrigger>
            <TabsTrigger value="pessimistic" className="text-chart-4">Pesimista</TabsTrigger>
          </TabsList>
        </Tabs>

        {latestForecast && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">MRR Predicho</p>
              <p className="text-xl font-bold">{formatCurrency(latestForecast.predicted_mrr)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">ARR Predicho</p>
              <p className="text-xl font-bold">{formatCurrency(latestForecast.predicted_arr)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Confianza</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold">{(latestForecast.confidence_level * 100).toFixed(0)}%</p>
                <Badge variant={latestForecast.confidence_level >= 0.8 ? "default" : "secondary"}>
                  {latestForecast.confidence_level >= 0.8 ? 'Alta' : 'Media'}
                </Badge>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Crecimiento Est.</p>
              <p className="text-xl font-bold text-chart-2">
                +{((latestForecast.growth_rate_predicted || 0) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        {confidence && (
          <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-muted/30 border border-border">
            <Target className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Intervalo de Confianza</p>
              <p className="text-xs text-muted-foreground">
                Rango: {formatCurrency(confidence.low || 0)} - {formatCurrency(confidence.high || 0)}
              </p>
            </div>
          </div>
        )}

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), '']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="low" 
                fill="hsl(var(--primary) / 0.1)" 
                stroke="none"
              />
              <Area 
                type="monotone" 
                dataKey="high" 
                fill="hsl(var(--primary) / 0.1)" 
                stroke="none"
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {latestForecast?.ai_insights && (
          <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">Insights de IA</p>
                <p className="text-sm text-muted-foreground">{latestForecast.ai_insights}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RevenueForecastDashboard;
