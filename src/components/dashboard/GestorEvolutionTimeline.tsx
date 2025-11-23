import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Calendar, Activity, Target, Loader2, Info } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

interface TimelineDataPoint {
  period: string;
  [key: string]: number | string;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function GestorEvolutionTimeline() {
  const { user } = useAuth();
  const [gestores, setGestores] = useState<Profile[]>([]);
  const [selectedGestores, setSelectedGestores] = useState<string[]>([]);
  const [periodMonths, setPeriodMonths] = useState<number>(6);
  const [showProjections, setShowProjections] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<string>('visits');
  const [loading, setLoading] = useState(true);
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);

  useEffect(() => {
    fetchGestores();
  }, []);

  useEffect(() => {
    if (selectedGestores.length > 0) {
      fetchTimelineData();
    }
  }, [selectedGestores, periodMonths, selectedMetric]);

  const fetchGestores = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');

      if (error) throw error;
      
      const gestoresList = data || [];
      setGestores(gestoresList);
      
      // Auto-select current user and one other
      if (gestoresList.length > 0) {
        const userGestor = gestoresList.find(g => g.id === user?.id);
        const otherGestor = gestoresList.find(g => g.id !== user?.id);
        const autoSelected = [userGestor?.id, otherGestor?.id].filter(Boolean) as string[];
        setSelectedGestores(autoSelected.slice(0, 4));
      }
    } catch (error) {
      console.error('Error fetching gestores:', error);
    }
  };

  const calculateLinearRegression = (data: number[]) => {
    const n = data.length;
    if (n < 2) return { slope: 0, intercept: 0 };

    const sumX = data.reduce((sum, _, i) => sum + i, 0);
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = data.reduce((sum, val, i) => sum + i * val, 0);
    const sumX2 = data.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  };

  const fetchTimelineData = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = subMonths(endDate, periodMonths);

      // Generate all months in the period
      const months = eachMonthOfInterval({ start: startDate, end: endDate });
      const timelineMap = new Map<string, any>();

      months.forEach(month => {
        const key = format(month, 'yyyy-MM');
        timelineMap.set(key, { 
          period: format(month, 'MMM yyyy', { locale: es }),
          sortKey: key
        });
      });

      // Fetch data for each gestor
      for (const gestorId of selectedGestores) {
        const gestor = gestores.find(g => g.id === gestorId);
        if (!gestor) continue;

        const gestorName = gestor.full_name || gestor.email;

        // Fetch visits grouped by month
        const { data: visits } = await supabase
          .from('visits')
          .select('*')
          .eq('gestor_id', gestorId)
          .gte('visit_date', startDate.toISOString())
          .lte('visit_date', endDate.toISOString());

        // Group by month
        const monthlyStats = new Map<string, any>();
        
        visits?.forEach(visit => {
          const monthKey = format(parseISO(visit.visit_date), 'yyyy-MM');
          if (!monthlyStats.has(monthKey)) {
            monthlyStats.set(monthKey, {
              visits: 0,
              successfulVisits: 0,
              productsOffered: 0,
              totalVinculacion: 0,
              vinculacionCount: 0,
            });
          }

          const stats = monthlyStats.get(monthKey);
          stats.visits++;
          
          if (visit.result && (visit.result.toLowerCase().includes('positiv') || visit.result.toLowerCase().includes('éxito'))) {
            stats.successfulVisits++;
          }
          
          stats.productsOffered += visit.productos_ofrecidos?.length || 0;
          
          if (visit.porcentaje_vinculacion) {
            stats.totalVinculacion += visit.porcentaje_vinculacion;
            stats.vinculacionCount++;
          }
        });

        // Add data to timeline
        months.forEach(month => {
          const key = format(month, 'yyyy-MM');
          const stats = monthlyStats.get(key) || {
            visits: 0,
            successfulVisits: 0,
            productsOffered: 0,
            totalVinculacion: 0,
            vinculacionCount: 0,
          };

          const existingData = timelineMap.get(key);
          const successRate = stats.visits > 0 ? (stats.successfulVisits / stats.visits) * 100 : 0;
          const avgVinculacion = stats.vinculacionCount > 0 ? stats.totalVinculacion / stats.vinculacionCount : 0;

          timelineMap.set(key, {
            ...existingData,
            [`${gestorName}_visits`]: stats.visits,
            [`${gestorName}_successRate`]: Math.round(successRate),
            [`${gestorName}_products`]: stats.productsOffered,
            [`${gestorName}_vinculacion`]: Math.round(avgVinculacion),
          });
        });
      }

      // Convert to array and sort
      let timelineArray = Array.from(timelineMap.values())
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
        .map(({ sortKey, ...rest }) => rest);

      // Add projections if enabled
      if (showProjections && timelineArray.length >= 3) {
        const projectionMonths = 3;
        const lastMonth = months[months.length - 1];

        // Calculate projections for each gestor
        selectedGestores.forEach(gestorId => {
          const gestor = gestores.find(g => g.id === gestorId);
          if (!gestor) return;

          const gestorName = gestor.full_name || gestor.email;
          const metricKey = `${gestorName}_${selectedMetric}`;
          
          // Get historical values
          const historicalValues = timelineArray
            .map(d => d[metricKey] as number || 0)
            .filter(v => v !== undefined);

          if (historicalValues.length < 2) return;

          // Calculate trend
          const { slope, intercept } = calculateLinearRegression(historicalValues);

          // Generate projections
          for (let i = 1; i <= projectionMonths; i++) {
            const projectionMonth = new Date(lastMonth);
            projectionMonth.setMonth(projectionMonth.getMonth() + i);
            
            const projectionPeriod = format(projectionMonth, 'MMM yyyy', { locale: es });
            const projectionValue = Math.max(0, Math.round(slope * (historicalValues.length + i - 1) + intercept));

            const existingProjection = timelineArray.find(d => d.period === projectionPeriod);
            if (existingProjection) {
              existingProjection[`${metricKey}_projection`] = projectionValue;
            } else {
              const newProjection: any = { 
                period: projectionPeriod,
                isProjection: true
              };
              newProjection[`${metricKey}_projection`] = projectionValue;
              timelineArray.push(newProjection);
            }
          }
        });
      }

      setTimelineData(timelineArray);
    } catch (error) {
      console.error('Error fetching timeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGestorToggle = (gestorId: string) => {
    setSelectedGestores(prev => {
      if (prev.includes(gestorId)) {
        return prev.filter(id => id !== gestorId);
      } else if (prev.length < 4) {
        return [...prev, gestorId];
      }
      return prev;
    });
  };

  const getMetricLabel = (metric: string) => {
    const labels: Record<string, string> = {
      visits: 'Total Visitas',
      successRate: 'Tasa de Éxito (%)',
      products: 'Productos Ofrecidos',
      vinculacion: 'Vinculación Media (%)',
    };
    return labels[metric] || metric;
  };

  const renderChart = () => {
    if (timelineData.length === 0) return null;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={timelineData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="period" 
            className="text-xs"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis className="text-xs" />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (!active || !payload) return null;
              const isProjection = timelineData.find(d => d.period === label)?.isProjection;
              
              return (
                <div className="rounded-lg border bg-background p-3 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium">{label}</p>
                    {isProjection && (
                      <Badge variant="secondary" className="text-xs">Proyección</Badge>
                    )}
                  </div>
                  {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div 
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span>{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Legend />
          
          {/* Reference line to separate historical from projections */}
          {showProjections && timelineData.some(d => d.isProjection) && (
            <ReferenceLine 
              x={timelineData.find(d => !d.isProjection && timelineData.indexOf(d) === timelineData.filter(d => !d.isProjection).length - 1)?.period}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
            />
          )}

          {selectedGestores.map((gestorId, idx) => {
            const gestor = gestores.find(g => g.id === gestorId);
            if (!gestor) return null;

            const gestorName = gestor.full_name || gestor.email;
            const dataKey = `${gestorName}_${selectedMetric}`;
            const projectionKey = `${dataKey}_projection`;

            return (
              <React.Fragment key={gestorId}>
                {/* Historical line */}
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke={COLORS[idx]}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name={gestorName}
                  connectNulls
                />
                
                {/* Projection line */}
                {showProjections && (
                  <Line
                    type="monotone"
                    dataKey={projectionKey}
                    stroke={COLORS[idx]}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3 }}
                    name={`${gestorName} (proyección)`}
                    connectNulls
                  />
                )}
              </React.Fragment>
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolución Temporal de Gestores
          </CardTitle>
          <CardDescription>
            Analiza la evolución del rendimiento a lo largo del tiempo con proyecciones futuras
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Gestor Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Seleccionar Gestores (máx. 4)</label>
            <div className="flex flex-wrap gap-2">
              {gestores.map((gestor) => {
                const isSelected = selectedGestores.includes(gestor.id);
                const isCurrentUser = gestor.id === user?.id;
                return (
                  <Button
                    key={gestor.id}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleGestorToggle(gestor.id)}
                    disabled={!isSelected && selectedGestores.length >= 4}
                    className="relative"
                  >
                    {isSelected && (
                      <div 
                        className="absolute left-1 top-1 h-2 w-2 rounded-full"
                        style={{ backgroundColor: COLORS[selectedGestores.indexOf(gestor.id)] }}
                      />
                    )}
                    {gestor.full_name || gestor.email}
                    {isCurrentUser && (
                      <Badge variant="secondary" className="ml-2">Tú</Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select 
                value={periodMonths.toString()} 
                onValueChange={(value) => setPeriodMonths(parseInt(value))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Últimos 3 meses</SelectItem>
                  <SelectItem value="6">Últimos 6 meses</SelectItem>
                  <SelectItem value="12">Último año</SelectItem>
                  <SelectItem value="24">Últimos 2 años</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Métrica</label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visits">Total Visitas</SelectItem>
                  <SelectItem value="successRate">Tasa de Éxito</SelectItem>
                  <SelectItem value="products">Productos Ofrecidos</SelectItem>
                  <SelectItem value="vinculacion">Vinculación Media</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="projections"
                checked={showProjections}
                onCheckedChange={setShowProjections}
              />
              <Label htmlFor="projections" className="text-sm cursor-pointer">
                Mostrar proyecciones
              </Label>
            </div>
          </div>

          {showProjections && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Las proyecciones se calculan mediante regresión lineal basada en tendencias históricas. 
                Las líneas punteadas representan valores proyectados para los próximos 3 meses.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : selectedGestores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Selecciona al menos un gestor para ver la evolución
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {getMetricLabel(selectedMetric)} - Evolución en el Tiempo
            </CardTitle>
            <CardDescription>
              {showProjections && 'Datos históricos con proyecciones futuras basadas en tendencias'}
              {!showProjections && 'Datos históricos de rendimiento'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderChart()}
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {!loading && timelineData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {selectedGestores.map((gestorId, idx) => {
            const gestor = gestores.find(g => g.id === gestorId);
            if (!gestor) return null;

            const gestorName = gestor.full_name || gestor.email;
            const dataKey = `${gestorName}_${selectedMetric}`;
            
            const values = timelineData
              .filter(d => !d.isProjection)
              .map(d => d[dataKey] as number)
              .filter(v => v !== undefined && v !== null);

            if (values.length === 0) return null;

            const current = values[values.length - 1];
            const previous = values[values.length - 2] || current;
            const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
            const average = values.reduce((sum, v) => sum + v, 0) / values.length;

            return (
              <Card key={gestorId} className="relative overflow-hidden">
                <div 
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: COLORS[idx] }}
                />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium truncate">{gestorName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Actual</span>
                    <span className="text-2xl font-bold">{Math.round(current)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Cambio</span>
                    <Badge variant={change >= 0 ? 'default' : 'destructive'}>
                      {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Promedio</span>
                    <span className="text-sm font-medium">{Math.round(average)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
