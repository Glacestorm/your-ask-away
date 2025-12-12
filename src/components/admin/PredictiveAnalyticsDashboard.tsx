import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, AlertTriangle, Target,
  Lightbulb, RefreshCw, Play, Settings, ChevronRight,
  Activity, BarChart2, PieChart as PieIcon, Zap
} from 'lucide-react';

interface KPI {
  kpi_code: string;
  kpi_name: string;
  kpi_category: string;
  current_value: number;
  previous_value: number;
  change_percentage: number;
  trend: 'up' | 'down' | 'stable' | 'volatile';
  trend_strength: number;
  alert_status: 'normal' | 'warning' | 'critical' | 'opportunity';
  benchmark_percentile: number;
  confidence_score: number;
}

interface KPISummary {
  totalKPIs: number;
  criticalAlerts: number;
  warnings: number;
  opportunities: number;
  trendingUp: number;
  trendingDown: number;
  avgConfidence: number;
}

interface ScenarioParams {
  revenueGrowth: number;
  clientGrowth: number;
  conversionRate: number;
  averageDealSize: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function PredictiveAnalyticsDashboard() {
  const [periodType, setPeriodType] = useState<string>('monthly');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('kpis');
  const [scenarioParams, setScenarioParams] = useState<ScenarioParams>({
    revenueGrowth: 10,
    clientGrowth: 5,
    conversionRate: 25,
    averageDealSize: 15000
  });
  const [scenarioResult, setScenarioResult] = useState<any>(null);

  // Fetch KPIs from database
  const { data: kpisData, isLoading: kpisLoading, refetch: refetchKPIs } = useQuery({
    queryKey: ['dynamic-kpis', periodType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dynamic_kpis')
        .select('*')
        .eq('period_type', periodType)
        .order('kpi_category', { ascending: true });
      
      if (error) throw error;
      return data as KPI[];
    }
  });

  // Fetch predictions
  const { data: predictionsData, isLoading: predictionsLoading } = useQuery({
    queryKey: ['analytics-predictions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_predictions')
        .select('*')
        .order('prediction_date', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    }
  });

  // Generate KPIs
  const handleGenerateKPIs = useCallback(async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-kpis', {
        body: {
          entityType: 'bank',
          entityId: null,
          periodType
        }
      });

      if (error) throw error;

      toast.success(`${data.summary.totalKPIs} KPIs generats correctament`);
      refetchKPIs();
    } catch (err) {
      toast.error('Error generant KPIs');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }, [periodType, refetchKPIs]);

  // Run scenario simulation
  const handleRunScenario = useCallback(async () => {
    setIsGenerating(true);
    try {
      // Simulate scenario calculation (would normally call an edge function)
      const baseRevenue = 500000;
      const baseClients = 150;
      
      const projectedRevenue = baseRevenue * (1 + scenarioParams.revenueGrowth / 100);
      const projectedClients = baseClients * (1 + scenarioParams.clientGrowth / 100);
      const projectedDeals = projectedClients * (scenarioParams.conversionRate / 100);
      const projectedValue = projectedDeals * scenarioParams.averageDealSize;

      setScenarioResult({
        baseline: {
          revenue: baseRevenue,
          clients: baseClients,
          deals: Math.round(baseClients * 0.2),
          totalValue: baseRevenue
        },
        projected: {
          revenue: projectedRevenue,
          clients: Math.round(projectedClients),
          deals: Math.round(projectedDeals),
          totalValue: projectedValue
        },
        growth: {
          revenue: scenarioParams.revenueGrowth,
          clients: scenarioParams.clientGrowth,
          deals: ((projectedDeals / (baseClients * 0.2)) - 1) * 100,
          totalValue: ((projectedValue / baseRevenue) - 1) * 100
        },
        recommendations: [
          {
            priority: 1,
            action: 'Incrementar visites a clients VIP',
            impact: 'Alt',
            effort: 'Mitjà',
            expectedROI: '25%'
          },
          {
            priority: 2,
            action: 'Llançar campanya cross-selling productes',
            impact: 'Mitjà',
            effort: 'Baix',
            expectedROI: '15%'
          },
          {
            priority: 3,
            action: 'Reduir temps de tancament en un 20%',
            impact: 'Alt',
            effort: 'Alt',
            expectedROI: '30%'
          }
        ]
      });

      toast.success('Simulació completada');
    } catch (err) {
      toast.error('Error en simulació');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }, [scenarioParams]);

  // Group KPIs by category
  const groupedKPIs = React.useMemo(() => {
    if (!kpisData) return {};
    return kpisData.reduce((acc: Record<string, KPI[]>, kpi) => {
      if (!acc[kpi.kpi_category]) acc[kpi.kpi_category] = [];
      acc[kpi.kpi_category].push(kpi);
      return acc;
    }, {});
  }, [kpisData]);

  // Calculate summary
  const summary: KPISummary = React.useMemo(() => {
    if (!kpisData?.length) return {
      totalKPIs: 0,
      criticalAlerts: 0,
      warnings: 0,
      opportunities: 0,
      trendingUp: 0,
      trendingDown: 0,
      avgConfidence: 0
    };

    return {
      totalKPIs: kpisData.length,
      criticalAlerts: kpisData.filter(k => k.alert_status === 'critical').length,
      warnings: kpisData.filter(k => k.alert_status === 'warning').length,
      opportunities: kpisData.filter(k => k.alert_status === 'opportunity').length,
      trendingUp: kpisData.filter(k => k.trend === 'up').length,
      trendingDown: kpisData.filter(k => k.trend === 'down').length,
      avgConfidence: kpisData.reduce((sum, k) => sum + k.confidence_score, 0) / kpisData.length
    };
  }, [kpisData]);

  // Prepare forecast data for charts
  const forecastData = React.useMemo(() => {
    const months = ['Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(currentMonth).concat(months.slice(0, 3)).map((month, idx) => ({
      month,
      actual: idx < 1 ? 100000 + Math.random() * 50000 : null,
      baseline: 100000 + (idx * 5000) + Math.random() * 10000,
      optimistic: 110000 + (idx * 8000) + Math.random() * 15000,
      pessimistic: 90000 + (idx * 3000) + Math.random() * 8000
    }));
  }, []);

  // Segment growth data
  const segmentData = [
    { segment: 'Premium', growth: 15, clients: 25, revenue: 180000 },
    { segment: 'Estàndard', growth: 8, clients: 85, revenue: 250000 },
    { segment: 'Bàsic', growth: -3, clients: 40, revenue: 70000 }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAlertBadge = (status: string) => {
    switch (status) {
      case 'critical': return <Badge variant="destructive">Crític</Badge>;
      case 'warning': return <Badge className="bg-yellow-500">Alerta</Badge>;
      case 'opportunity': return <Badge className="bg-emerald-500">Oportunitat</Badge>;
      default: return <Badge variant="secondary">Normal</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics Predictiu Avançat</h2>
          <p className="text-muted-foreground">
            KPIs dinàmics, forecasting i simulació d'escenaris
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodType} onValueChange={setPeriodType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diari</SelectItem>
              <SelectItem value="weekly">Setmanal</SelectItem>
              <SelectItem value="monthly">Mensual</SelectItem>
              <SelectItem value="quarterly">Trimestral</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleGenerateKPIs} disabled={isGenerating}>
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Generar KPIs
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{summary.totalKPIs}</div>
            <p className="text-xs text-muted-foreground">Total KPIs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-500">{summary.criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">Alertes Crítiques</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-500">{summary.warnings}</div>
            <p className="text-xs text-muted-foreground">Avisos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-500">{summary.opportunities}</div>
            <p className="text-xs text-muted-foreground">Oportunitats</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-bold">{summary.trendingUp}</span>
            </div>
            <p className="text-xs text-muted-foreground">En Creixement</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{summary.trendingDown}</span>
            </div>
            <p className="text-xs text-muted-foreground">En Descens</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{(summary.avgConfidence * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Confiança Mitjana</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="kpis" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            KPIs Dinàmics
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Forecast Ingressos
          </TabsTrigger>
          <TabsTrigger value="segments" className="flex items-center gap-2">
            <PieIcon className="h-4 w-4" />
            Segments
          </TabsTrigger>
          <TabsTrigger value="simulator" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Simulador
          </TabsTrigger>
        </TabsList>

        {/* KPIs Tab */}
        <TabsContent value="kpis" className="space-y-4">
          {kpisLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : Object.keys(groupedKPIs).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No hi ha KPIs generats</h3>
                <p className="text-muted-foreground mb-4">
                  Fes clic al botó "Generar KPIs" per calcular els indicadors
                </p>
                <Button onClick={handleGenerateKPIs} disabled={isGenerating}>
                  <Zap className="h-4 w-4 mr-2" />
                  Generar KPIs
                </Button>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedKPIs).map(([category, kpis]) => (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <CardTitle className="capitalize">{category}</CardTitle>
                  <CardDescription>{kpis.length} indicadors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {kpis.map((kpi) => (
                      <div key={kpi.kpi_code} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium">{kpi.kpi_name}</span>
                          {getAlertBadge(kpi.alert_status)}
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-2xl font-bold">
                            {typeof kpi.current_value === 'number' 
                              ? kpi.current_value.toLocaleString('ca-ES', { maximumFractionDigits: 1 })
                              : kpi.current_value}
                          </span>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(kpi.trend)}
                            <span className={`text-sm ${
                              kpi.change_percentage > 0 ? 'text-emerald-500' : 
                              kpi.change_percentage < 0 ? 'text-red-500' : 'text-muted-foreground'
                            }`}>
                              {kpi.change_percentage > 0 ? '+' : ''}{kpi.change_percentage?.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Percentil benchmark</span>
                            <span>{kpi.benchmark_percentile}%</span>
                          </div>
                          <Progress value={kpi.benchmark_percentile} className="h-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Forecast d'Ingressos</CardTitle>
              <CardDescription>
                Projecció a 12 mesos amb intervals de confiança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString('ca-ES')}€`, '']}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="optimistic" 
                    stroke="hsl(var(--chart-2))" 
                    fill="hsl(var(--chart-2))" 
                    fillOpacity={0.2}
                    name="Optimista"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="baseline" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.4}
                    name="Base"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pessimistic" 
                    stroke="hsl(var(--chart-4))" 
                    fill="hsl(var(--chart-4))" 
                    fillOpacity={0.2}
                    name="Pessimista"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={3}
                    dot={{ r: 6 }}
                    name="Real"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Predictions List */}
          <Card>
            <CardHeader>
              <CardTitle>Prediccions Recents</CardTitle>
            </CardHeader>
            <CardContent>
              {predictionsLoading ? (
                <Skeleton className="h-32" />
              ) : !predictionsData?.length ? (
                <p className="text-muted-foreground text-center py-4">
                  No hi ha prediccions registrades
                </p>
              ) : (
                <div className="space-y-2">
                  {predictionsData.slice(0, 5).map((pred: any) => (
                    <div key={pred.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <span className="font-medium">{pred.prediction_type}</span>
                        <p className="text-sm text-muted-foreground">
                          Model: {pred.model_name} v{pred.model_version}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">
                          {pred.predicted_value?.toLocaleString('ca-ES')}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          Confiança: {((pred.confidence_level || 0) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Predicció Creixement per Segment</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={segmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="segment" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="growth" name="Creixement %" fill="hsl(var(--primary))">
                      {segmentData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.growth >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribució d'Ingressos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={segmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ segment, percent }) => `${segment}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {segmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toLocaleString('ca-ES')}€`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Segment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detall per Segment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {segmentData.map((segment, idx) => (
                  <div key={segment.segment} className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[idx] }}
                      />
                      <span className="font-medium">{segment.segment}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Clients</span>
                        <span className="font-medium">{segment.clients}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ingressos</span>
                        <span className="font-medium">{segment.revenue.toLocaleString('ca-ES')}€</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Creixement</span>
                        <span className={`font-medium ${segment.growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {segment.growth > 0 ? '+' : ''}{segment.growth}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Simulator Tab */}
        <TabsContent value="simulator" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Parameters */}
            <Card>
              <CardHeader>
                <CardTitle>Paràmetres de l'Escenari</CardTitle>
                <CardDescription>
                  Ajusta els paràmetres per simular diferents escenaris
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Creixement Ingressos</label>
                    <span className="text-sm text-muted-foreground">{scenarioParams.revenueGrowth}%</span>
                  </div>
                  <Slider
                    value={[scenarioParams.revenueGrowth]}
                    onValueChange={([value]) => setScenarioParams(p => ({ ...p, revenueGrowth: value }))}
                    min={-20}
                    max={50}
                    step={1}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Creixement Clients</label>
                    <span className="text-sm text-muted-foreground">{scenarioParams.clientGrowth}%</span>
                  </div>
                  <Slider
                    value={[scenarioParams.clientGrowth]}
                    onValueChange={([value]) => setScenarioParams(p => ({ ...p, clientGrowth: value }))}
                    min={-10}
                    max={30}
                    step={1}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Taxa de Conversió</label>
                    <span className="text-sm text-muted-foreground">{scenarioParams.conversionRate}%</span>
                  </div>
                  <Slider
                    value={[scenarioParams.conversionRate]}
                    onValueChange={([value]) => setScenarioParams(p => ({ ...p, conversionRate: value }))}
                    min={5}
                    max={50}
                    step={1}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Valor Mitjà Operació</label>
                    <span className="text-sm text-muted-foreground">{scenarioParams.averageDealSize.toLocaleString('ca-ES')}€</span>
                  </div>
                  <Slider
                    value={[scenarioParams.averageDealSize]}
                    onValueChange={([value]) => setScenarioParams(p => ({ ...p, averageDealSize: value }))}
                    min={5000}
                    max={50000}
                    step={1000}
                  />
                </div>

                <Button onClick={handleRunScenario} className="w-full" disabled={isGenerating}>
                  {isGenerating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Executar Simulació
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle>Resultats de la Simulació</CardTitle>
              </CardHeader>
              <CardContent>
                {!scenarioResult ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Ajusta els paràmetres i executa la simulació</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground mb-1">Ingressos Base</p>
                        <p className="font-bold">{scenarioResult.baseline.revenue.toLocaleString('ca-ES')}€</p>
                      </div>
                      <div className="p-3 rounded-lg bg-primary/10">
                        <p className="text-xs text-muted-foreground mb-1">Ingressos Projectats</p>
                        <p className="font-bold text-primary">
                          {scenarioResult.projected.revenue.toLocaleString('ca-ES')}€
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded border text-center">
                        <p className="text-xs text-muted-foreground">Clients</p>
                        <p className="font-medium">{scenarioResult.projected.clients}</p>
                        <p className={`text-xs ${scenarioResult.growth.clients >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {scenarioResult.growth.clients >= 0 ? '+' : ''}{scenarioResult.growth.clients.toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-2 rounded border text-center">
                        <p className="text-xs text-muted-foreground">Operacions</p>
                        <p className="font-medium">{scenarioResult.projected.deals}</p>
                        <p className={`text-xs ${scenarioResult.growth.deals >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {scenarioResult.growth.deals >= 0 ? '+' : ''}{scenarioResult.growth.deals.toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-2 rounded border text-center">
                        <p className="text-xs text-muted-foreground">Valor Total</p>
                        <p className="font-medium">{(scenarioResult.projected.totalValue / 1000).toFixed(0)}k€</p>
                        <p className={`text-xs ${scenarioResult.growth.totalValue >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {scenarioResult.growth.totalValue >= 0 ? '+' : ''}{scenarioResult.growth.totalValue.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Recomanacions Prioritzades
                      </h4>
                      <div className="space-y-2">
                        {scenarioResult.recommendations.map((rec: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 p-2 rounded border">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                              {rec.priority}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{rec.action}</p>
                              <p className="text-xs text-muted-foreground">
                                Impacte: {rec.impact} | Esforç: {rec.effort} | ROI: {rec.expectedROI}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PredictiveAnalyticsDashboard;
