import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Activity, Target, Building2, Package, Filter, X, GitCompare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { DateRange } from 'react-day-picker';
import { subMonths, format, subYears, startOfMonth, endOfMonth, differenceInMonths } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PersonalGoalsTracker } from '@/components/dashboard/PersonalGoalsTracker';
import { PersonalGoalsHistory } from '@/components/dashboard/PersonalGoalsHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GestorStats {
  totalVisits: number;
  successRate: number;
  totalCompanies: number;
  totalProducts: number;
}

interface MonthlyData {
  month: string;
  visits: number;
  successful: number;
  comparisonVisits?: number;
  comparisonSuccessful?: number;
}

interface RecentVisit {
  id: string;
  visit_date: string;
  company_name: string;
  result: string;
  notes: string;
}

interface ResultDistribution {
  result: string;
  count: number;
}

interface ProductCount {
  product: string;
  count: number;
}

interface TopCompany {
  name: string;
  vinculacion: number;
}

export function GestorDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: subMonths(today, 6), to: today };
  });
  const [stats, setStats] = useState<GestorStats>({
    totalVisits: 0,
    successRate: 0,
    totalCompanies: 0,
    totalProducts: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([]);
  const [resultDistribution, setResultDistribution] = useState<ResultDistribution[]>([]);
  const [topProducts, setTopProducts] = useState<ProductCount[]>([]);
  const [topCompanies, setTopCompanies] = useState<TopCompany[]>([]);
  
  // Filtros avanzados
  const [availableProducts, setAvailableProducts] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [minVinculacion, setMinVinculacion] = useState<number>(0);
  const [maxVinculacion, setMaxVinculacion] = useState<number>(100);
  const [showFilters, setShowFilters] = useState(false);

  // Comparación de períodos
  const [comparisonPeriod, setComparisonPeriod] = useState<string>('none');
  const [comparisonDateRange, setComparisonDateRange] = useState<DateRange | undefined>();
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonStats, setComparisonStats] = useState<GestorStats>({
    totalVisits: 0,
    successRate: 0,
    totalCompanies: 0,
    totalProducts: 0
  });

  useEffect(() => {
    if (user) {
      loadAvailableProducts();
    }
  }, [user]);

  useEffect(() => {
    if (user && dateRange?.from && dateRange?.to) {
      fetchData();
    }
  }, [user, dateRange, selectedProducts, minVinculacion, maxVinculacion, comparisonPeriod]);

  useEffect(() => {
    if (comparisonPeriod !== 'none' && dateRange?.from && dateRange?.to) {
      calculateComparisonPeriod();
    } else {
      setComparisonDateRange(undefined);
      setShowComparison(false);
    }
  }, [comparisonPeriod, dateRange]);

  const loadAvailableProducts = async () => {
    if (!user) return;
    
    try {
      const { data: products } = await supabase
        .from('products')
        .select('name')
        .eq('active', true)
        .order('name');
      
      if (products) {
        setAvailableProducts(products.map(p => p.name));
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const toggleProductFilter = (product: string) => {
    setSelectedProducts(prev => 
      prev.includes(product) 
        ? prev.filter(p => p !== product)
        : [...prev, product]
    );
  };

  const clearFilters = () => {
    setSelectedProducts([]);
    setMinVinculacion(0);
    setMaxVinculacion(100);
  };

  const hasActiveFilters = selectedProducts.length > 0 || minVinculacion > 0 || maxVinculacion < 100;

  const calculateComparisonPeriod = () => {
    if (!dateRange?.from || !dateRange?.to) return;

    let compFrom: Date;
    let compTo: Date;

    switch (comparisonPeriod) {
      case 'previous_month':
        const monthsDiff = differenceInMonths(dateRange.to, dateRange.from);
        compFrom = subMonths(dateRange.from, monthsDiff + 1);
        compTo = subMonths(dateRange.to, monthsDiff + 1);
        break;
      case 'same_last_year':
        compFrom = subYears(dateRange.from, 1);
        compTo = subYears(dateRange.to, 1);
        break;
      case 'previous_6_months':
        compFrom = subMonths(dateRange.from, 6);
        compTo = subMonths(dateRange.to, 6);
        break;
      default:
        return;
    }

    setComparisonDateRange({ from: compFrom, to: compTo });
    setShowComparison(true);
  };

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const fromDate = format(dateRange!.from!, 'yyyy-MM-dd');
      const toDate = format(dateRange!.to!, 'yyyy-MM-dd');

      // Obtener visitas del gestor en el período
      const { data: allVisits, error: visitsError } = await supabase
        .from('visits')
        .select('*, companies(name, vinculacion_entidad_1)')
        .eq('gestor_id', user.id)
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate)
        .order('visit_date', { ascending: false });

      if (visitsError) throw visitsError;

      // Aplicar filtros adicionales
      let visits = allVisits || [];

      // Filtrar por productos seleccionados
      if (selectedProducts.length > 0) {
        visits = visits.filter(visit => {
          if (!visit.productos_ofrecidos || !Array.isArray(visit.productos_ofrecidos)) return false;
          return visit.productos_ofrecidos.some(p => selectedProducts.includes(p));
        });
      }

      // Filtrar por rango de vinculación
      visits = visits.filter(visit => {
        const vinculacion = visit.companies?.vinculacion_entidad_1 || 0;
        return vinculacion >= minVinculacion && vinculacion <= maxVinculacion;
      });

      const totalVisits = visits?.length || 0;
      const successfulVisits = visits?.filter(v => v.result === 'Exitosa').length || 0;
      const successRate = totalVisits > 0 ? Math.round((successfulVisits / totalVisits) * 100) : 0;

      // Obtener empresas asignadas
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', user.id);

      // Obtener productos únicos ofrecidos
      const uniqueProducts = new Set<string>();
      visits?.forEach(visit => {
        if (visit.productos_ofrecidos && Array.isArray(visit.productos_ofrecidos)) {
          visit.productos_ofrecidos.forEach(p => uniqueProducts.add(p));
        }
      });

      setStats({
        totalVisits,
        successRate,
        totalCompanies: companiesCount || 0,
        totalProducts: uniqueProducts.size
      });

      // Agrupar visitas por mes
      const monthlyMap = new Map<string, { visits: number; successful: number }>();
      
      let current = new Date(dateRange!.from!);
      const end = new Date(dateRange!.to!);
      
      while (current <= end) {
        const monthKey = format(current, 'yyyy-MM');
        monthlyMap.set(monthKey, { visits: 0, successful: 0 });
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      }

      visits?.forEach(visit => {
        const monthKey = format(new Date(visit.visit_date), 'yyyy-MM');
        if (monthlyMap.has(monthKey)) {
          const data = monthlyMap.get(monthKey)!;
          data.visits++;
          if (visit.result === 'Exitosa') {
            data.successful++;
          }
          monthlyMap.set(monthKey, data);
        }
      });

      const monthlyDataArray: MonthlyData[] = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month: format(new Date(month + '-01'), 'MMM yyyy'),
        visits: data.visits,
        successful: data.successful
      }));

      setMonthlyData(monthlyDataArray);

      // Últimas 10 visitas
      const recentVisitsData: RecentVisit[] = (visits?.slice(0, 10) || []).map(v => ({
        id: v.id,
        visit_date: v.visit_date,
        company_name: v.companies?.name || 'Desconocida',
        result: v.result || 'Sin resultado',
        notes: v.notes || ''
      }));

      setRecentVisits(recentVisitsData);

      // Distribución de visitas por resultado
      const resultsMap = new Map<string, number>();
      visits?.forEach(visit => {
        const result = visit.result || 'Sin resultado';
        resultsMap.set(result, (resultsMap.get(result) || 0) + 1);
      });
      const resultDistData: ResultDistribution[] = Array.from(resultsMap.entries()).map(([result, count]) => ({
        result,
        count
      }));
      setResultDistribution(resultDistData);

      // Productos más ofrecidos
      const productsMap = new Map<string, number>();
      visits?.forEach(visit => {
        if (visit.productos_ofrecidos && Array.isArray(visit.productos_ofrecidos)) {
          visit.productos_ofrecidos.forEach(product => {
            productsMap.set(product, (productsMap.get(product) || 0) + 1);
          });
        }
      });
      const topProductsData: ProductCount[] = Array.from(productsMap.entries())
        .map(([product, count]) => ({ product, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setTopProducts(topProductsData);

      // Empresas con mayor vinculación (aplicar filtro de rango)
      const { data: allCompanies, error: companiesError } = await supabase
        .from('companies')
        .select('name, vinculacion_entidad_1, vinculacion_entidad_2, vinculacion_entidad_3')
        .eq('gestor_id', user.id)
        .gte('vinculacion_entidad_1', minVinculacion)
        .lte('vinculacion_entidad_1', maxVinculacion)
        .order('vinculacion_entidad_1', { ascending: false, nullsFirst: false })
        .limit(10);

      if (companiesError) throw companiesError;

      const topCompaniesData: TopCompany[] = (allCompanies || []).map(c => ({
        name: c.name,
        vinculacion: c.vinculacion_entidad_1 || 0
      }));
      setTopCompanies(topCompaniesData);

      // Obtener datos de comparación si está habilitado
      if (showComparison && comparisonDateRange?.from && comparisonDateRange?.to) {
        await fetchComparisonData();
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar los datos');
      setLoading(false);
    }
  };

  const fetchComparisonData = async () => {
    if (!user || !comparisonDateRange?.from || !comparisonDateRange?.to) return;

    try {
      const fromDate = format(comparisonDateRange.from, 'yyyy-MM-dd');
      const toDate = format(comparisonDateRange.to, 'yyyy-MM-dd');

      // Obtener visitas del período de comparación
      const { data: allCompVisits, error: compVisitsError } = await supabase
        .from('visits')
        .select('*, companies(name, vinculacion_entidad_1)')
        .eq('gestor_id', user.id)
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate)
        .order('visit_date', { ascending: false });

      if (compVisitsError) throw compVisitsError;

      // Aplicar los mismos filtros
      let compVisits = allCompVisits || [];

      if (selectedProducts.length > 0) {
        compVisits = compVisits.filter(visit => {
          if (!visit.productos_ofrecidos || !Array.isArray(visit.productos_ofrecidos)) return false;
          return visit.productos_ofrecidos.some(p => selectedProducts.includes(p));
        });
      }

      compVisits = compVisits.filter(visit => {
        const vinculacion = visit.companies?.vinculacion_entidad_1 || 0;
        return vinculacion >= minVinculacion && vinculacion <= maxVinculacion;
      });

      const totalCompVisits = compVisits?.length || 0;
      const successfulCompVisits = compVisits?.filter(v => v.result === 'Exitosa').length || 0;
      const compSuccessRate = totalCompVisits > 0 ? Math.round((successfulCompVisits / totalCompVisits) * 100) : 0;

      // Productos únicos del período de comparación
      const compUniqueProducts = new Set<string>();
      compVisits?.forEach(visit => {
        if (visit.productos_ofrecidos && Array.isArray(visit.productos_ofrecidos)) {
          visit.productos_ofrecidos.forEach(p => compUniqueProducts.add(p));
        }
      });

      setComparisonStats({
        totalVisits: totalCompVisits,
        successRate: compSuccessRate,
        totalCompanies: stats.totalCompanies, // Same companies
        totalProducts: compUniqueProducts.size
      });

      // Agrupar visitas de comparación por mes para el gráfico
      const compMonthlyMap = new Map<string, { visits: number; successful: number }>();
      
      let current = new Date(comparisonDateRange.from);
      const end = new Date(comparisonDateRange.to);
      
      while (current <= end) {
        const monthKey = format(current, 'yyyy-MM');
        compMonthlyMap.set(monthKey, { visits: 0, successful: 0 });
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      }

      compVisits?.forEach(visit => {
        const monthKey = format(new Date(visit.visit_date), 'yyyy-MM');
        if (compMonthlyMap.has(monthKey)) {
          const data = compMonthlyMap.get(monthKey)!;
          data.visits++;
          if (visit.result === 'Exitosa') {
            data.successful++;
          }
          compMonthlyMap.set(monthKey, data);
        }
      });

      // Combinar datos mensuales con datos de comparación
      setMonthlyData(prev => {
        const compArray = Array.from(compMonthlyMap.entries());
        return prev.map((item, index) => ({
          ...item,
          comparisonVisits: compArray[index]?.[1].visits || 0,
          comparisonSuccessful: compArray[index]?.[1].successful || 0
        }));
      });

    } catch (error) {
      console.error('Error fetching comparison data:', error);
      toast.error('Error al cargar datos de comparación');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
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
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="mb-6">
        <TabsTrigger value="overview">{t('gestor.dashboard.tabs.overview')}</TabsTrigger>
        <TabsTrigger value="goals">{t('gestor.dashboard.tabs.goals')}</TabsTrigger>
        <TabsTrigger value="history">{t('gestor.dashboard.tabs.history')}</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="space-y-6">
      {/* Encabezado */}
      <Card>
        <CardHeader>
          <CardTitle>{t('gestor.dashboard.title')}</CardTitle>
          <CardDescription>
            {t('gestor.dashboard.subtitle')}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {t('gestor.dashboard.filters')}
              </CardTitle>
              <CardDescription>{t('gestor.dashboard.filtersDesc')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  {t('gestor.dashboard.clearFilters')}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? t('gestor.dashboard.hideFilters') : t('gestor.dashboard.showFilters')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtro de fecha */}
          <div>
            <Label>{t('gestor.dashboard.dateRange')}</Label>
            <DateRangeFilter 
              dateRange={dateRange} 
              onDateRangeChange={setDateRange}
            />
          </div>

          {/* Comparación de períodos */}
          <div className="space-y-2 border-t pt-4">
            <Label className="flex items-center gap-2">
              <GitCompare className="h-4 w-4" />
              {t('gestor.dashboard.periodComparison')}
            </Label>
            <Select value={comparisonPeriod} onValueChange={setComparisonPeriod}>
              <SelectTrigger>
                <SelectValue placeholder={t('gestor.dashboard.selectComparison')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('gestor.dashboard.noComparison')}</SelectItem>
                <SelectItem value="previous_month">{t('gestor.dashboard.previousPeriod')}</SelectItem>
                <SelectItem value="same_last_year">{t('gestor.dashboard.sameLastYear')}</SelectItem>
                <SelectItem value="previous_6_months">{t('gestor.dashboard.previous6Months')}</SelectItem>
              </SelectContent>
            </Select>
            {showComparison && comparisonDateRange && (
              <p className="text-xs text-muted-foreground">
                {t('gestor.dashboard.comparingWith')}: {format(comparisonDateRange.from!, 'dd/MM/yyyy')} - {format(comparisonDateRange.to!, 'dd/MM/yyyy')}
              </p>
            )}
          </div>

          {showFilters && (
            <>
              {/* Filtro de productos */}
              <div className="space-y-2">
                <Label>{t('gestor.dashboard.filterByProducts')}</Label>
                <ScrollArea className="h-32 border rounded-md p-3">
                  <div className="space-y-2">
                    {availableProducts.map(product => (
                      <div key={product} className="flex items-center space-x-2">
                        <Checkbox
                          id={`product-${product}`}
                          checked={selectedProducts.includes(product)}
                          onCheckedChange={() => toggleProductFilter(product)}
                        />
                        <label
                          htmlFor={`product-${product}`}
                          className="text-sm cursor-pointer"
                        >
                          {product}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {selectedProducts.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedProducts.map(product => (
                      <Badge key={product} variant="secondary" className="text-xs">
                        {product}
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer"
                          onClick={() => toggleProductFilter(product)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Filtro de rango de vinculación */}
              <div className="space-y-2">
                <Label>{t('gestor.dashboard.vinculacionRange')}</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('gestor.dashboard.minVinculacion')}</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={minVinculacion}
                      onChange={(e) => setMinVinculacion(Math.max(0, Math.min(100, Number(e.target.value))))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('gestor.dashboard.maxVinculacion')}</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={maxVinculacion}
                      onChange={(e) => setMaxVinculacion(Math.max(0, Math.min(100, Number(e.target.value))))}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('gestor.dashboard.vinculacionRangeDesc')}: {minVinculacion}% - {maxVinculacion}%
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* KPIs Personales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('gestor.dashboard.totalVisits')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVisits}</div>
            {showComparison && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {t('gestor.dashboard.comparison')}: {comparisonStats.totalVisits}
                </span>
                {stats.totalVisits > comparisonStats.totalVisits ? (
                  <span className="text-xs text-green-600">↑ {stats.totalVisits - comparisonStats.totalVisits}</span>
                ) : stats.totalVisits < comparisonStats.totalVisits ? (
                  <span className="text-xs text-red-600">↓ {comparisonStats.totalVisits - stats.totalVisits}</span>
                ) : null}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {t('gestor.dashboard.visitsDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('gestor.dashboard.successRate')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            {showComparison && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {t('gestor.dashboard.comparison')}: {comparisonStats.successRate}%
                </span>
                {stats.successRate > comparisonStats.successRate ? (
                  <span className="text-xs text-green-600">↑ {stats.successRate - comparisonStats.successRate}%</span>
                ) : stats.successRate < comparisonStats.successRate ? (
                  <span className="text-xs text-red-600">↓ {comparisonStats.successRate - stats.successRate}%</span>
                ) : null}
              </div>
            )}
            <p className="text-xs text-muted-foreground">{t('gestor.dashboard.successDesc')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('gestor.dashboard.companies')}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">{t('gestor.dashboard.companiesDesc')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('gestor.dashboard.products')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            {showComparison && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {t('gestor.dashboard.comparison')}: {comparisonStats.totalProducts}
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">{t('gestor.dashboard.productsDesc')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de evolución mensual */}
      <Card>
        <CardHeader>
          <CardTitle>{t('gestor.dashboard.monthlyEvolution')}</CardTitle>
          <CardDescription>{t('gestor.dashboard.monthlyEvolutionDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="visits" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  name={t('gestor.dashboard.currentPeriod') + ' - ' + t('gestor.dashboard.totalVisits')}
                />
                <Line 
                  type="monotone" 
                  dataKey="successful" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name={t('gestor.dashboard.currentPeriod') + ' - ' + t('gestor.dashboard.successfulVisits')}
                />
                {showComparison && (
                  <>
                    <Line 
                      type="monotone" 
                      dataKey="comparisonVisits" 
                      stroke="hsl(var(--chart-3))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name={t('gestor.dashboard.comparisonPeriod') + ' - ' + t('gestor.dashboard.totalVisits')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="comparisonSuccessful" 
                      stroke="hsl(var(--chart-4))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name={t('gestor.dashboard.comparisonPeriod') + ' - ' + t('gestor.dashboard.successfulVisits')}
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              {t('director.noData')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribución de visitas por resultado */}
      <Card>
        <CardHeader>
          <CardTitle>{t('gestor.dashboard.resultDistribution')}</CardTitle>
          <CardDescription>{t('gestor.dashboard.resultDistributionDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {resultDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={resultDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="result" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--chart-1))" name={t('gestor.dashboard.visits')} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              {t('director.noData')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Productos más ofrecidos */}
      <Card>
        <CardHeader>
          <CardTitle>{t('gestor.dashboard.topProducts')}</CardTitle>
          <CardDescription>{t('gestor.dashboard.topProductsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="product" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--chart-2))" name={t('gestor.dashboard.timesOffered')} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              {t('director.noData')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empresas con mayor vinculación */}
      <Card>
        <CardHeader>
          <CardTitle>{t('gestor.dashboard.topCompanies')}</CardTitle>
          <CardDescription>{t('gestor.dashboard.topCompaniesDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {topCompanies.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCompanies} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="vinculacion" fill="hsl(var(--chart-3))" name={t('gestor.dashboard.vinculacion')} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              {t('director.noData')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de visitas recientes */}
      <Card>
        <CardHeader>
          <CardTitle>{t('gestor.dashboard.recentVisits')}</CardTitle>
          <CardDescription>{t('gestor.dashboard.recentVisitsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('gestor.dashboard.date')}</TableHead>
                <TableHead>{t('gestor.dashboard.company')}</TableHead>
                <TableHead>{t('gestor.dashboard.result')}</TableHead>
                <TableHead>{t('gestor.dashboard.notes')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentVisits.length > 0 ? (
                recentVisits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell>{format(new Date(visit.visit_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="font-medium">{visit.company_name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        visit.result === 'Exitosa' 
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                          : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {visit.result}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{visit.notes}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {t('director.noData')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </div>
      </TabsContent>

      <TabsContent value="goals">
        <PersonalGoalsTracker />
      </TabsContent>

      <TabsContent value="history">
        <PersonalGoalsHistory />
      </TabsContent>
    </Tabs>
  );
}