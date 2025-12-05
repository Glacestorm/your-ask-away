import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar as CalendarIcon, 
  Users, 
  TrendingUp, 
  Target, 
  FileText,
  BarChart3,
  Trophy,
  Percent
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line
} from 'recharts';

interface GestorMetrics {
  gestorId: string;
  gestorName: string;
  totalSheets: number;
  avgProbability: number;
  totalPotencial: number;
  sheetsWithHighProbability: number;
  avgDuration: number;
  uniqueCompanies: number;
  conversionRate: number;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

export function VisitSheetsGestorComparison() {
  const [gestores, setGestores] = useState<Profile[]>([]);
  const [selectedGestores, setSelectedGestores] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<GestorMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>(startOfMonth(subMonths(new Date(), 3)));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  useEffect(() => {
    fetchGestores();
  }, []);

  useEffect(() => {
    if (selectedGestores.length > 0) {
      fetchMetrics();
    } else {
      setMetrics([]);
    }
  }, [selectedGestores, startDate, endDate]);

  const fetchGestores = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');

      if (error) throw error;
      setGestores(data || []);
    } catch (error: any) {
      console.error('Error fetching gestores:', error);
      toast.error('Error al cargar gestores');
    }
  };

  const fetchMetrics = async () => {
    if (selectedGestores.length === 0) return;

    try {
      setLoading(true);
      const metricsData: GestorMetrics[] = [];

      for (const gestorId of selectedGestores) {
        const { data: sheets, error } = await supabase
          .from('visit_sheets')
          .select('*')
          .eq('gestor_id', gestorId)
          .gte('fecha', format(startDate, 'yyyy-MM-dd'))
          .lte('fecha', format(endDate, 'yyyy-MM-dd'));

        if (error) throw error;

        const gestor = gestores.find(g => g.id === gestorId);
        const totalSheets = sheets?.length || 0;
        const sheetsWithProb = sheets?.filter(s => s.probabilidad_cierre !== null) || [];
        const avgProbability = sheetsWithProb.length > 0
          ? sheetsWithProb.reduce((acc, s) => acc + (s.probabilidad_cierre || 0), 0) / sheetsWithProb.length
          : 0;
        const totalPotencial = sheets?.reduce((acc, s) => acc + (s.potencial_anual_estimado || 0), 0) || 0;
        const sheetsWithHighProbability = sheets?.filter(s => (s.probabilidad_cierre || 0) >= 75).length || 0;
        const sheetsWithDuration = sheets?.filter(s => s.duracion !== null) || [];
        const avgDuration = sheetsWithDuration.length > 0
          ? sheetsWithDuration.reduce((acc, s) => acc + (s.duracion || 0), 0) / sheetsWithDuration.length
          : 0;
        const uniqueCompanies = new Set(sheets?.map(s => s.company_id)).size;
        const conversionRate = totalSheets > 0 ? (sheetsWithHighProbability / totalSheets) * 100 : 0;

        metricsData.push({
          gestorId,
          gestorName: gestor?.full_name || gestor?.email || 'Sin nombre',
          totalSheets,
          avgProbability,
          totalPotencial,
          sheetsWithHighProbability,
          avgDuration,
          uniqueCompanies,
          conversionRate
        });
      }

      setMetrics(metricsData);
    } catch (error: any) {
      console.error('Error fetching metrics:', error);
      toast.error('Error al cargar métricas');
    } finally {
      setLoading(false);
    }
  };

  const toggleGestor = (gestorId: string) => {
    setSelectedGestores(prev =>
      prev.includes(gestorId)
        ? prev.filter(id => id !== gestorId)
        : prev.length < 5 ? [...prev, gestorId] : prev
    );
  };

  const radarData = useMemo(() => {
    if (metrics.length === 0) return [];

    const maxValues = {
      totalSheets: Math.max(...metrics.map(m => m.totalSheets), 1),
      avgProbability: 100,
      conversionRate: 100,
      uniqueCompanies: Math.max(...metrics.map(m => m.uniqueCompanies), 1),
      avgDuration: Math.max(...metrics.map(m => m.avgDuration), 1),
    };

    return [
      { metric: 'Fichas', fullMark: 100, ...Object.fromEntries(metrics.map(m => [m.gestorName, (m.totalSheets / maxValues.totalSheets) * 100])) },
      { metric: 'Prob. Media', fullMark: 100, ...Object.fromEntries(metrics.map(m => [m.gestorName, m.avgProbability])) },
      { metric: 'Conversión', fullMark: 100, ...Object.fromEntries(metrics.map(m => [m.gestorName, m.conversionRate])) },
      { metric: 'Empresas', fullMark: 100, ...Object.fromEntries(metrics.map(m => [m.gestorName, (m.uniqueCompanies / maxValues.uniqueCompanies) * 100])) },
      { metric: 'Duración', fullMark: 100, ...Object.fromEntries(metrics.map(m => [m.gestorName, (m.avgDuration / maxValues.avgDuration) * 100])) },
    ];
  }, [metrics]);

  const barData = useMemo(() => {
    return metrics.map(m => ({
      name: m.gestorName.split(' ')[0],
      'Total Fichas': m.totalSheets,
      'Alta Prob. (≥75%)': m.sheetsWithHighProbability,
      'Empresas Únicas': m.uniqueCompanies,
    }));
  }, [metrics]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Trophy className="h-5 w-5 text-amber-600" />;
    return null;
  };

  const rankedMetrics = useMemo(() => {
    return [...metrics].sort((a, b) => {
      const scoreA = (a.avgProbability * 0.4) + (a.conversionRate * 0.3) + (a.totalSheets * 0.3);
      const scoreB = (b.avgProbability * 0.4) + (b.conversionRate * 0.3) + (b.totalSheets * 0.3);
      return scoreB - scoreA;
    });
  }, [metrics]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Comparativa de Gestores - Fichas de Visita
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Selector de gestores */}
            <div className="space-y-2 md:col-span-1">
              <Label className="text-sm font-medium">Seleccionar Gestores (máx. 5)</Label>
              <ScrollArea className="h-48 border rounded-md p-2">
                {gestores.map((gestor) => (
                  <div
                    key={gestor.id}
                    className="flex items-center space-x-2 py-1.5 px-1 hover:bg-muted/50 rounded"
                  >
                    <Checkbox
                      id={gestor.id}
                      checked={selectedGestores.includes(gestor.id)}
                      onCheckedChange={() => toggleGestor(gestor.id)}
                      disabled={!selectedGestores.includes(gestor.id) && selectedGestores.length >= 5}
                    />
                    <label
                      htmlFor={gestor.id}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {gestor.full_name || gestor.email}
                    </label>
                  </div>
                ))}
              </ScrollArea>
              {selectedGestores.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedGestores.map((id, idx) => {
                    const gestor = gestores.find(g => g.id === id);
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="text-xs"
                        style={{ borderColor: COLORS[idx % COLORS.length] }}
                      >
                        {gestor?.full_name?.split(' ')[0] || gestor?.email?.split('@')[0]}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Rango de fechas */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Desde</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, 'dd/MM/yyyy', { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Hasta</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, 'dd/MM/yyyy', { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="text-sm text-muted-foreground">Cargando métricas...</div>
            </div>
          )}

          {!loading && selectedGestores.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
              <Users className="h-12 w-12 mb-4 opacity-50" />
              <p>Selecciona al menos un gestor para ver la comparativa</p>
            </div>
          )}

          {!loading && metrics.length > 0 && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {rankedMetrics.slice(0, 4).map((m, idx) => (
                  <Card key={m.gestorId} className={cn(
                    "relative overflow-hidden",
                    idx === 0 && "ring-2 ring-yellow-500/50"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground truncate">
                          {m.gestorName}
                        </span>
                        {getRankIcon(idx)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="text-lg font-bold">{m.totalSheets}</span>
                          <span className="text-xs text-muted-foreground">fichas</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Percent className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-semibold text-primary">
                            {m.avgProbability.toFixed(0)}%
                          </span>
                          <span className="text-xs text-muted-foreground">prob. media</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{m.sheetsWithHighProbability}</span>
                          <span className="text-xs text-muted-foreground">alta prob.</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Radar Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Comparativa de Rendimiento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                        {metrics.map((m, idx) => (
                          <Radar
                            key={m.gestorId}
                            name={m.gestorName}
                            dataKey={m.gestorName}
                            stroke={COLORS[idx % COLORS.length]}
                            fill={COLORS[idx % COLORS.length]}
                            fillOpacity={0.2}
                          />
                        ))}
                        <Legend />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Bar Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Métricas por Gestor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))' 
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="Total Fichas" fill="hsl(var(--primary))" />
                        <Bar dataKey="Alta Prob. (≥75%)" fill="hsl(var(--chart-2))" />
                        <Bar dataKey="Empresas Únicas" fill="hsl(var(--chart-3))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Detalle de Métricas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 font-medium">#</th>
                          <th className="text-left py-2 px-2 font-medium">Gestor</th>
                          <th className="text-right py-2 px-2 font-medium">Fichas</th>
                          <th className="text-right py-2 px-2 font-medium">Prob. Media</th>
                          <th className="text-right py-2 px-2 font-medium">Alta Prob.</th>
                          <th className="text-right py-2 px-2 font-medium">Conversión</th>
                          <th className="text-right py-2 px-2 font-medium">Empresas</th>
                          <th className="text-right py-2 px-2 font-medium">Potencial Total</th>
                          <th className="text-right py-2 px-2 font-medium">Duración Media</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rankedMetrics.map((m, idx) => (
                          <tr key={m.gestorId} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-2">
                              <div className="flex items-center gap-1">
                                {getRankIcon(idx)}
                                <span className="text-muted-foreground">{idx + 1}</span>
                              </div>
                            </td>
                            <td className="py-2 px-2 font-medium">{m.gestorName}</td>
                            <td className="py-2 px-2 text-right">{m.totalSheets}</td>
                            <td className="py-2 px-2 text-right">
                              <Badge variant={m.avgProbability >= 75 ? 'default' : m.avgProbability >= 50 ? 'secondary' : 'outline'}>
                                {m.avgProbability.toFixed(0)}%
                              </Badge>
                            </td>
                            <td className="py-2 px-2 text-right">{m.sheetsWithHighProbability}</td>
                            <td className="py-2 px-2 text-right">{m.conversionRate.toFixed(1)}%</td>
                            <td className="py-2 px-2 text-right">{m.uniqueCompanies}</td>
                            <td className="py-2 px-2 text-right">
                              {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(m.totalPotencial)}
                            </td>
                            <td className="py-2 px-2 text-right">{m.avgDuration.toFixed(0)} min</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
