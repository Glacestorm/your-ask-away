import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { GestorFilterSelector } from '@/components/dashboard/GestorFilterSelector';
import { PowerBIExport } from '@/components/dashboard/PowerBIExport';
import { MLPredictions } from '@/components/dashboard/MLPredictions';
import { PushNotifications } from '@/components/dashboard/PushNotifications';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, Target, Users, Building2, 
  Package, Percent, BarChart3, LineChartIcon, PieChartIcon, 
  ArrowUpRight, ArrowDownRight, Minus, Calendar, Filter,
  Award, Zap, DollarSign, Shield, RefreshCw, Brain, Bell
} from 'lucide-react';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

type ChartType = 'bar' | 'line' | 'area' | 'radar' | 'pie' | 'composed';
type MetricCategory = 'overview' | 'commercial' | 'productivity' | 'quality' | 'benchmark' | 'predictions' | 'notifications';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
];

interface KPIData {
  label: string;
  value: number;
  previousValue?: number;
  target?: number;
  unit: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
  description?: string;
}

interface MetricDataPoint {
  name: string;
  value?: number;
  target?: number;
  previous?: number;
  [key: string]: any;
}

export function UnifiedMetricsDashboard() {
  const { user, isOfficeDirector, isCommercialDirector, isCommercialManager, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedGestorId, setSelectedGestorId] = useState<string | null>(null);
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [activeCategory, setActiveCategory] = useState<MetricCategory>('overview');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: subMonths(today, 3), to: today };
  });
  
  // KPIs State
  const [kpis, setKpis] = useState<KPIData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MetricDataPoint[]>([]);
  const [productData, setProductData] = useState<MetricDataPoint[]>([]);
  const [vinculacionData, setVinculacionData] = useState<MetricDataPoint[]>([]);
  const [gestorPerformance, setGestorPerformance] = useState<MetricDataPoint[]>([]);
  const [radarData, setRadarData] = useState<MetricDataPoint[]>([]);

  const isRegularGestor = !isOfficeDirector && !isCommercialDirector && !isCommercialManager && !isSuperAdmin;
  const effectiveGestorId = isRegularGestor ? user?.id : selectedGestorId;

  useEffect(() => {
    fetchAllMetrics();
  }, [effectiveGestorId, dateRange]);

  const fetchAllMetrics = async () => {
    try {
      setLoading(true);
      
      const fromDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : format(subMonths(new Date(), 3), 'yyyy-MM-dd');
      const toDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

      // Fetch visits data
      let visitsQuery = supabase
        .from('visits')
        .select('*, profiles(full_name, email, oficina)')
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate)
        .order('visit_date');

      if (effectiveGestorId) {
        visitsQuery = visitsQuery.eq('gestor_id', effectiveGestorId);
      }

      const { data: visitsData } = await visitsQuery;

      // Fetch companies data
      let companiesQuery = supabase
        .from('companies')
        .select('*, profiles(full_name, email)');

      if (effectiveGestorId) {
        companiesQuery = companiesQuery.eq('gestor_id', effectiveGestorId);
      }

      const { data: companiesData } = await companiesQuery;

      // Fetch products data
      let productsQuery = supabase
        .from('company_products')
        .select('*, products(name, category), companies(gestor_id)')
        .eq('active', true);

      const { data: productsData } = await productsQuery;

      // Fetch visit sheets for quality metrics
      let visitSheetsQuery = supabase
        .from('visit_sheets')
        .select('*, companies(name, gestor_id)')
        .gte('fecha_visita', fromDate)
        .lte('fecha_visita', toDate);

      if (effectiveGestorId) {
        visitSheetsQuery = visitSheetsQuery.eq('gestor_id', effectiveGestorId);
      }

      const { data: visitSheetsData } = await visitSheetsQuery;

      // Process KPIs
      const totalVisits = visitsData?.length || 0;
      const successfulVisits = visitsData?.filter(v => v.result === 'Exitosa').length || 0;
      const successRate = totalVisits > 0 ? Math.round((successfulVisits / totalVisits) * 100) : 0;
      
      const totalCompanies = companiesData?.length || 0;
      const filteredProducts = effectiveGestorId 
        ? productsData?.filter(p => p.companies?.gestor_id === effectiveGestorId) 
        : productsData;
      const totalProducts = filteredProducts?.length || 0;
      
      // Average vinculacion from visits table
      let avgVinculacion = 0;
      if (visitsData && visitsData.length > 0) {
        const validVisits = visitsData.filter(v => v.porcentaje_vinculacion !== null && v.porcentaje_vinculacion !== undefined);
        if (validVisits.length > 0) {
          avgVinculacion = Math.round(validVisits.reduce((sum, v) => sum + (v.porcentaje_vinculacion || 0), 0) / validVisits.length);
        }
      }

      // Conversion rate (high probability closures)
      const highProbSheets = visitSheetsData?.filter(vs => (vs.probabilidad_cierre || 0) >= 75).length || 0;
      const conversionRate = visitSheetsData && visitSheetsData.length > 0 
        ? Math.round((highProbSheets / visitSheetsData.length) * 100) 
        : 0;

      // Average products per company
      const avgProductsPerCompany = totalCompanies > 0 
        ? Math.round((totalProducts / totalCompanies) * 10) / 10 
        : 0;

      // Visits per company (efficiency)
      const visitsPerCompany = totalCompanies > 0 
        ? Math.round((totalVisits / totalCompanies) * 10) / 10 
        : 0;

      // Calculate previous period for comparison
      const previousFromDate = subMonths(new Date(fromDate), 3);
      const previousToDate = subMonths(new Date(toDate), 3);

      let previousVisitsQuery = supabase
        .from('visits')
        .select('id, result')
        .gte('visit_date', format(previousFromDate, 'yyyy-MM-dd'))
        .lte('visit_date', format(previousToDate, 'yyyy-MM-dd'));

      if (effectiveGestorId) {
        previousVisitsQuery = previousVisitsQuery.eq('gestor_id', effectiveGestorId);
      }

      const { data: previousVisits } = await previousVisitsQuery;
      const previousTotalVisits = previousVisits?.length || 0;
      const previousSuccessful = previousVisits?.filter(v => v.result === 'Exitosa').length || 0;
      const previousSuccessRate = previousTotalVisits > 0 
        ? Math.round((previousSuccessful / previousTotalVisits) * 100) 
        : 0;

      // Set KPIs with banking industry metrics
      setKpis([
        {
          label: 'Total Visites',
          value: totalVisits,
          previousValue: previousTotalVisits,
          target: Math.round(totalVisits * 1.1),
          unit: '',
          icon: Activity,
          trend: totalVisits > previousTotalVisits ? 'up' : totalVisits < previousTotalVisits ? 'down' : 'stable',
          color: 'text-blue-500',
          description: 'Visites comercials realitzades'
        },
        {
          label: 'Taxa d\'Èxit',
          value: successRate,
          previousValue: previousSuccessRate,
          target: 75,
          unit: '%',
          icon: Target,
          trend: successRate > previousSuccessRate ? 'up' : successRate < previousSuccessRate ? 'down' : 'stable',
          color: 'text-green-500',
          description: 'Percentatge de visites exitoses'
        },
        {
          label: 'Vinculació Mitjana',
          value: avgVinculacion,
          target: 50,
          unit: '%',
          icon: Percent,
          trend: avgVinculacion >= 50 ? 'up' : 'down',
          color: 'text-purple-500',
          description: 'Grau de vinculació amb el banc'
        },
        {
          label: 'Productes/Client',
          value: avgProductsPerCompany,
          target: 3,
          unit: '',
          icon: Package,
          trend: avgProductsPerCompany >= 3 ? 'up' : 'down',
          color: 'text-amber-500',
          description: 'Cross-selling ratio'
        },
        {
          label: 'Taxa Conversió',
          value: conversionRate,
          target: 25,
          unit: '%',
          icon: Zap,
          trend: conversionRate >= 25 ? 'up' : 'down',
          color: 'text-cyan-500',
          description: 'Oportunitats d\'alta probabilitat'
        },
        {
          label: 'Cartera Clients',
          value: totalCompanies,
          unit: '',
          icon: Building2,
          trend: 'stable',
          color: 'text-rose-500',
          description: 'Empreses assignades'
        },
        {
          label: 'Productes Actius',
          value: totalProducts,
          unit: '',
          icon: Package,
          trend: 'stable',
          color: 'text-indigo-500',
          description: 'Productes contractats'
        },
        {
          label: 'Visites/Client',
          value: visitsPerCompany,
          target: 2,
          unit: '',
          icon: Users,
          trend: visitsPerCompany >= 2 ? 'up' : 'down',
          color: 'text-teal-500',
          description: 'Freqüència de contacte'
        }
      ]);

      // Process monthly evolution data
      const monthlyMap: Record<string, any> = {};
      visitsData?.forEach(visit => {
        const date = new Date(visit.visit_date);
        const monthKey = format(date, 'MMM yy');
        const sortKey = format(date, 'yyyy-MM');
        
        if (!monthlyMap[sortKey]) {
          monthlyMap[sortKey] = {
            name: monthKey,
            sortKey,
            visites: 0,
            exitoses: 0,
            taxaExit: 0
          };
        }
        monthlyMap[sortKey].visites++;
        if (visit.result === 'Exitosa') {
          monthlyMap[sortKey].exitoses++;
        }
      });

      Object.values(monthlyMap).forEach((m: any) => {
        m.taxaExit = m.visites > 0 ? Math.round((m.exitoses / m.visites) * 100) : 0;
      });

      const sortedMonthly = Object.values(monthlyMap)
        .sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey));
      setMonthlyData(sortedMonthly);

      // Process products by category
      const productCategoryMap: Record<string, number> = {};
      filteredProducts?.forEach(cp => {
        const category = cp.products?.category || 'Altres';
        productCategoryMap[category] = (productCategoryMap[category] || 0) + 1;
      });

      const productCategoryData = Object.entries(productCategoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
      setProductData(productCategoryData);

      // Process vinculacion distribution
      const vinculacionRanges: { name: string; min: number; max: number; value: number }[] = [
        { name: '0-20%', min: 0, max: 20, value: 0 },
        { name: '21-40%', min: 21, max: 40, value: 0 },
        { name: '41-60%', min: 41, max: 60, value: 0 },
        { name: '61-80%', min: 61, max: 80, value: 0 },
        { name: '81-100%', min: 81, max: 100, value: 0 }
      ];

      visitsData?.forEach(v => {
        const vinc = v.porcentaje_vinculacion || 0;
      vinculacionRanges.forEach(range => {
        if (vinc >= range.min && vinc <= range.max) {
          range.value = (range.value || 0) + 1;
        }
      });
    });
    setVinculacionData(vinculacionRanges);

      // Process radar data for balanced scorecard
      const radarMetrics = [
        { name: 'Visites', value: Math.min(100, (totalVisits / 50) * 100), fullMark: 100 },
        { name: 'Èxit', value: successRate, fullMark: 100 },
        { name: 'Vinculació', value: avgVinculacion, fullMark: 100 },
        { name: 'Cross-sell', value: Math.min(100, (avgProductsPerCompany / 5) * 100), fullMark: 100 },
        { name: 'Conversió', value: conversionRate, fullMark: 100 },
        { name: 'Cobertura', value: Math.min(100, (visitsPerCompany / 3) * 100), fullMark: 100 }
      ];
      setRadarData(radarMetrics);

      // Gestor performance (if not filtering by specific gestor)
      if (!effectiveGestorId) {
        const gestorMap: Record<string, any> = {};
        visitsData?.forEach(visit => {
          const gestorName = visit.profiles?.full_name || visit.profiles?.email || 'N/A';
          const gestorId = visit.gestor_id;
          if (!gestorMap[gestorId]) {
            gestorMap[gestorId] = {
              name: gestorName,
              visites: 0,
              exitoses: 0
            };
          }
          gestorMap[gestorId].visites++;
          if (visit.result === 'Exitosa') {
            gestorMap[gestorId].exitoses++;
          }
        });

        const gestorData: MetricDataPoint[] = Object.values(gestorMap)
          .map((g: any) => ({
            name: g.name.length > 15 ? g.name.substring(0, 15) + '...' : g.name,
            value: g.visites,
            visites: g.visites,
            taxaExit: g.visites > 0 ? Math.round((g.exitoses / g.visites) * 100) : 0
          }))
          .sort((a, b) => (b.visites || 0) - (a.visites || 0))
          .slice(0, 10);
        setGestorPerformance(gestorData);
      }

    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast.error('Error al carregar les mètriques');
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (data: any[], dataKeys: string[], title: string) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No hi ha dades disponibles
        </div>
      );
    }

    const chartProps = {
      data,
      margin: { top: 10, right: 30, left: 0, bottom: 0 }
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              {dataKeys.map((key, i) => (
                <Line 
                  key={key}
                  type="monotone" 
                  dataKey={key} 
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart {...chartProps}>
              <defs>
                {dataKeys.map((key, i) => (
                  <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.1}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              {dataKeys.map((key, i) => (
                <Area 
                  key={key}
                  type="monotone" 
                  dataKey={key} 
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  fill={`url(#gradient-${key})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar
                name="Rendiment"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.5}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              <Bar yAxisId="left" dataKey={dataKeys[0]} fill={CHART_COLORS[0]} />
              {dataKeys.length > 1 && (
                <Line yAxisId="right" type="monotone" dataKey={dataKeys[1]} stroke={CHART_COLORS[1]} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        );

      default: // bar
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              {dataKeys.map((key, i) => (
                <Bar 
                  key={key}
                  dataKey={key} 
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const chartTypeOptions = [
    { value: 'bar', label: 'Barres', icon: BarChart3 },
    { value: 'line', label: 'Línies', icon: LineChartIcon },
    { value: 'area', label: 'Àrea', icon: Activity },
    { value: 'pie', label: 'Circular', icon: PieChartIcon },
    { value: 'radar', label: 'Radar', icon: Target },
    { value: 'composed', label: 'Combinat', icon: BarChart3 }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                Quadre de Comandament Integral
              </CardTitle>
              <CardDescription className="mt-1">
                Mètriques clau de rendiment comercial i bancari
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <GestorFilterSelector
                selectedGestorId={selectedGestorId}
                onGestorChange={setSelectedGestorId}
                showAllOption={true}
              />
              <DateRangeFilter 
                dateRange={dateRange} 
                onDateRangeChange={setDateRange}
              />
              <PowerBIExport
                datasets={[
                  { id: 'kpis', label: 'KPIs', data: kpis },
                  { id: 'monthly', label: 'Dades mensuals', data: monthlyData },
                  { id: 'products', label: 'Productes', data: productData },
                ]}
                filename="metrics-dashboard"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchAllMetrics()}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Actualitzar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.slice(0, 8).map((kpi, index) => {
          const Icon = kpi.icon;
          const progress = kpi.target ? Math.min(100, (kpi.value / kpi.target) * 100) : null;
          
          return (
            <Card 
              key={index} 
              className="relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
            >
              <div className={cn(
                "absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10",
                kpi.color?.replace('text-', 'bg-')
              )} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <Icon className={cn("h-5 w-5", kpi.color)} />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {kpi.value.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">{kpi.unit}</span>
                  {getTrendIcon(kpi.trend)}
                </div>
                
                {kpi.previousValue !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    vs anterior: {kpi.previousValue.toLocaleString()}{kpi.unit}
                    {kpi.previousValue !== 0 && (
                      <span className={cn(
                        "ml-1",
                        kpi.value > kpi.previousValue ? "text-green-500" : "text-red-500"
                      )}>
                        ({kpi.value > kpi.previousValue ? '+' : ''}
                        {Math.round(((kpi.value - kpi.previousValue) / kpi.previousValue) * 100)}%)
                      </span>
                    )}
                  </p>
                )}
                
                {progress !== null && (
                  <div className="space-y-1">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Objectiu: {kpi.target?.toLocaleString()}{kpi.unit} ({Math.round(progress)}%)
                    </p>
                  </div>
                )}
                
                {kpi.description && (
                  <p className="text-xs text-muted-foreground/80 italic">
                    {kpi.description}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart Type Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Tipus de gràfic:</span>
        <div className="flex gap-1 flex-wrap">
          {chartTypeOptions.map(option => {
            const Icon = option.icon;
            return (
              <Button
                key={option.value}
                variant={chartType === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType(option.value as ChartType)}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{option.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as MetricCategory)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Resum</span>
          </TabsTrigger>
          <TabsTrigger value="commercial" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Comercial</span>
          </TabsTrigger>
          <TabsTrigger value="productivity" className="gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Productivitat</span>
          </TabsTrigger>
          <TabsTrigger value="quality" className="gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Qualitat</span>
          </TabsTrigger>
          <TabsTrigger value="benchmark" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Benchmark</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Evolució Mensual
                </CardTitle>
                <CardDescription>Visites i taxa d'èxit per mes</CardDescription>
              </CardHeader>
              <CardContent>
                {renderChart(monthlyData, ['visites', 'taxaExit'], 'Evolució Mensual')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Scorecard de Rendiment
                </CardTitle>
                <CardDescription>Visió equilibrada de KPIs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="Rendiment"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.5}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="commercial" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Productes per Categoria
                </CardTitle>
                <CardDescription>Distribució de productes contractats</CardDescription>
              </CardHeader>
              <CardContent>
                {renderChart(productData, ['value'], 'Productes')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5 text-primary" />
                  Distribució Vinculació
                </CardTitle>
                <CardDescription>Clients per rang de vinculació</CardDescription>
              </CardHeader>
              <CardContent>
                {renderChart(vinculacionData, ['value'], 'Vinculació')}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Evolució de Visites
                </CardTitle>
                <CardDescription>Tendència de l'activitat comercial</CardDescription>
              </CardHeader>
              <CardContent>
                {renderChart(monthlyData, ['visites'], 'Visites')}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Taxa d'Èxit Mensual
                </CardTitle>
                <CardDescription>Qualitat de les visites comercials</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <ReferenceLine y={75} stroke="hsl(var(--chart-2))" strokeDasharray="5 5" label="Objectiu" />
                    <Line 
                      type="monotone" 
                      dataKey="taxaExit" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  KPIs de Qualitat
                </CardTitle>
                <CardDescription>Indicadors clau de servei</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {kpis.filter(k => ['Taxa d\'Èxit', 'Vinculació Mitjana', 'Taxa Conversió'].includes(k.label)).map((kpi, i) => {
                  const Icon = kpi.icon;
                  const progress = kpi.target ? Math.min(100, (kpi.value / kpi.target) * 100) : 0;
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", kpi.color)} />
                          <span className="text-sm font-medium">{kpi.label}</span>
                        </div>
                        <span className="text-sm font-bold">{kpi.value}{kpi.unit}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-right">
                        Objectiu: {kpi.target}{kpi.unit}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="benchmark" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {!effectiveGestorId && gestorPerformance.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Comparativa de Gestors
                  </CardTitle>
                  <CardDescription>Rendiment relatiu de l'equip comercial</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderChart(gestorPerformance, ['visites', 'taxaExit'], 'Gestors')}
                </CardContent>
              </Card>
            )}

            <Card className={effectiveGestorId ? 'lg:col-span-2' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Benchmarks Sector Bancari
                </CardTitle>
                <CardDescription>Comparació amb estàndards europeus</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Cross-selling Ratio', value: kpis.find(k => k.label === 'Productes/Client')?.value || 0, benchmark: 3.5, unit: '' },
                    { label: 'Taxa d\'Èxit Comercial', value: kpis.find(k => k.label === 'Taxa d\'Èxit')?.value || 0, benchmark: 70, unit: '%' },
                    { label: 'Vinculació Client', value: kpis.find(k => k.label === 'Vinculació Mitjana')?.value || 0, benchmark: 55, unit: '%' },
                    { label: 'Freqüència Contacte', value: kpis.find(k => k.label === 'Visites/Client')?.value || 0, benchmark: 2.5, unit: '' },
                  ].map((item, i) => {
                    const percentage = (item.value / item.benchmark) * 100;
                    const isAbove = item.value >= item.benchmark;
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={isAbove ? "default" : "secondary"} className={cn(
                              isAbove ? "bg-green-500/20 text-green-700 dark:text-green-400" : "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                            )}>
                              {item.value}{item.unit}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              vs {item.benchmark}{item.unit}
                            </span>
                          </div>
                        </div>
                        <div className="relative">
                          <Progress value={Math.min(100, percentage)} className="h-2" />
                          <div 
                            className="absolute top-0 h-2 w-0.5 bg-foreground" 
                            style={{ left: '100%', transform: 'translateX(-100%)' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
