import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Users, TrendingUp, CalendarIcon, Activity, Target, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

interface GestorMetrics {
  gestorId: string;
  gestorName: string;
  totalVisits: number;
  companiesManaged: number;
  successfulVisits: number;
  productsOffered: number;
  avgVinculacion: number;
  activityCount: number;
  successRate: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function GestorComparison() {
  const { user } = useAuth();
  const [gestores, setGestores] = useState<Profile[]>([]);
  const [selectedGestores, setSelectedGestores] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<GestorMetrics[]>([]);

  useEffect(() => {
    fetchGestores();
  }, []);

  useEffect(() => {
    if (selectedGestores.length > 0 && dateRange?.from && dateRange?.to) {
      fetchMetrics();
    }
  }, [selectedGestores, dateRange]);

  const fetchGestores = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');

      if (error) throw error;
      
      const gestoresList = data || [];
      setGestores(gestoresList);
      
      // Auto-select current user and one other gestor if available
      if (gestoresList.length > 0) {
        const userGestor = gestoresList.find(g => g.id === user?.id);
        const otherGestor = gestoresList.find(g => g.id !== user?.id);
        const autoSelected = [
          userGestor?.id,
          otherGestor?.id
        ].filter(Boolean) as string[];
        setSelectedGestores(autoSelected.slice(0, 4));
      }
    } catch (error) {
      console.error('Error fetching gestores:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const metricsData: GestorMetrics[] = [];

      for (const gestorId of selectedGestores) {
        const gestor = gestores.find(g => g.id === gestorId);
        if (!gestor) continue;

        const startDate = dateRange!.from!.toISOString();
        const endDate = dateRange!.to!.toISOString();

        // Fetch visits
        const { data: visits } = await supabase
          .from('visits')
          .select('*')
          .eq('gestor_id', gestorId)
          .gte('visit_date', startDate)
          .lte('visit_date', endDate);

        // Fetch companies managed
        const { data: companies } = await supabase
          .from('companies')
          .select('id')
          .eq('gestor_id', gestorId);

        // Fetch activity from audit logs
        const { data: activities } = await supabase
          .from('audit_logs')
          .select('id')
          .eq('user_id', gestorId)
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        const totalVisits = visits?.length || 0;
        const successfulVisits = visits?.filter(v => 
          v.result && (v.result.toLowerCase().includes('positiv') || v.result.toLowerCase().includes('éxito'))
        ).length || 0;
        
        const productsOffered = visits?.reduce((sum, v) => 
          sum + (v.productos_ofrecidos?.length || 0), 0
        ) || 0;

        const avgVinculacion = visits && visits.length > 0
          ? visits.reduce((sum, v) => sum + (v.porcentaje_vinculacion || 0), 0) / visits.length
          : 0;

        metricsData.push({
          gestorId,
          gestorName: gestor.full_name || gestor.email,
          totalVisits,
          companiesManaged: companies?.length || 0,
          successfulVisits,
          productsOffered,
          avgVinculacion: Math.round(avgVinculacion),
          activityCount: activities?.length || 0,
          successRate: totalVisits > 0 ? Math.round((successfulVisits / totalVisits) * 100) : 0,
        });
      }

      setMetrics(metricsData);
    } catch (error) {
      console.error('Error fetching metrics:', error);
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

  // Prepare data for radar chart
  const radarData = useMemo(() => {
    if (metrics.length === 0) return [];

    const categories = ['Visitas', 'Empresas', 'Efectividad', 'Productos', 'Vinculación'];
    
    return categories.map(category => {
      const dataPoint: any = { category };
      metrics.forEach(m => {
        let value = 0;
        switch (category) {
          case 'Visitas':
            value = m.totalVisits;
            break;
          case 'Empresas':
            value = m.companiesManaged;
            break;
          case 'Efectividad':
            value = m.successRate;
            break;
          case 'Productos':
            value = m.productsOffered;
            break;
          case 'Vinculación':
            value = m.avgVinculacion;
            break;
        }
        dataPoint[m.gestorName] = value;
      });
      return dataPoint;
    });
  }, [metrics]);

  // Prepare data for KPIs comparison
  const kpisData = useMemo(() => [
    {
      name: 'Total Visitas',
      ...metrics.reduce((acc, m) => ({ ...acc, [m.gestorName]: m.totalVisits }), {}),
    },
    {
      name: 'Visitas Exitosas',
      ...metrics.reduce((acc, m) => ({ ...acc, [m.gestorName]: m.successfulVisits }), {}),
    },
    {
      name: 'Productos Ofrecidos',
      ...metrics.reduce((acc, m) => ({ ...acc, [m.gestorName]: m.productsOffered }), {}),
    },
    {
      name: 'Actividad Sistema',
      ...metrics.reduce((acc, m) => ({ ...acc, [m.gestorName]: m.activityCount }), {}),
    },
  ], [metrics]);

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Comparación entre Gestores
          </CardTitle>
          <CardDescription>
            Compara el rendimiento y actividad de hasta 4 gestores simultáneamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Gestor Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Seleccionar Gestores (máx. 4)</label>
            <div className="flex flex-wrap gap-2">
              {gestores.map((gestor, idx) => {
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

          {/* Date Range */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período de Comparación</label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? format(dateRange.from, 'PPP', { locale: es }) : 'Fecha desde'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange?.from}
                      onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.to ? format(dateRange.to, 'PPP', { locale: es }) : 'Fecha hasta'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange?.to}
                      onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Button variant="outline" onClick={fetchMetrics} disabled={loading || selectedGestores.length === 0}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                  Actualizar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : selectedGestores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Selecciona al menos un gestor para comenzar
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, idx) => (
              <Card key={metric.gestorId} className="relative overflow-hidden">
                <div 
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: COLORS[idx] }}
                />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium truncate">{metric.gestorName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Visitas</span>
                    <span className="text-lg font-bold">{metric.totalVisits}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Efectividad</span>
                    <span className="text-lg font-bold">{metric.successRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Vinculación</span>
                    <span className="text-lg font-bold">{metric.avgVinculacion}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Empresas</span>
                    <span className="text-lg font-bold">{metric.companiesManaged}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Radar Chart - Overall Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Rendimiento General
              </CardTitle>
              <CardDescription>
                Comparativa multidimensional de rendimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid strokeDasharray="3 3" className="stroke-muted" />
                  <PolarAngleAxis dataKey="category" className="text-sm" />
                  <PolarRadiusAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  {metrics.map((metric, idx) => (
                    <Radar
                      key={metric.gestorId}
                      name={metric.gestorName}
                      dataKey={metric.gestorName}
                      stroke={COLORS[idx]}
                      fill={COLORS[idx]}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* KPIs Comparison - Bar Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4" />
                  Comparativa de KPIs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={kpisData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    {metrics.map((metric, idx) => (
                      <Bar
                        key={metric.gestorId}
                        dataKey={metric.gestorName}
                        fill={COLORS[idx]}
                        radius={[8, 8, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-4 w-4" />
                  Tasa de Éxito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.map(m => ({ name: m.gestorName, rate: m.successRate }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} className="text-xs" />
                    <YAxis className="text-xs" domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="rate" radius={[8, 8, 0, 0]}>
                      {metrics.map((metric, idx) => (
                        <Cell key={metric.gestorId} fill={COLORS[idx]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Tabla Comparativa Detallada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Métrica</th>
                      {metrics.map((metric, idx) => (
                        <th key={metric.gestorId} className="text-center py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <div 
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: COLORS[idx] }}
                            />
                            {metric.gestorName}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">Total Visitas</td>
                      {metrics.map(m => (
                        <td key={m.gestorId} className="text-center py-3 px-4">{m.totalVisits}</td>
                      ))}
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">Visitas Exitosas</td>
                      {metrics.map(m => (
                        <td key={m.gestorId} className="text-center py-3 px-4">{m.successfulVisits}</td>
                      ))}
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">Tasa de Éxito</td>
                      {metrics.map(m => (
                        <td key={m.gestorId} className="text-center py-3 px-4">
                          <Badge variant={m.successRate > 50 ? 'default' : 'secondary'}>
                            {m.successRate}%
                          </Badge>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">Empresas Gestionadas</td>
                      {metrics.map(m => (
                        <td key={m.gestorId} className="text-center py-3 px-4">{m.companiesManaged}</td>
                      ))}
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">Productos Ofrecidos</td>
                      {metrics.map(m => (
                        <td key={m.gestorId} className="text-center py-3 px-4">{m.productsOffered}</td>
                      ))}
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">% Vinculación Promedio</td>
                      {metrics.map(m => (
                        <td key={m.gestorId} className="text-center py-3 px-4">{m.avgVinculacion}%</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">Actividad en Sistema</td>
                      {metrics.map(m => (
                        <td key={m.gestorId} className="text-center py-3 px-4">{m.activityCount}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
