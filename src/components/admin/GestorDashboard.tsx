import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Target, Building2, Package, Users, Home, ChevronLeft, ChevronRight, CalendarDays, BarChart3, TrendingUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeSelector } from '@/components/ThemeSelector';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { subMonths, format, subYears, differenceInMonths } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PersonalGoalsTracker } from '@/components/dashboard/PersonalGoalsTracker';
import { PersonalGoalsHistory } from '@/components/dashboard/PersonalGoalsHistory';
import { QuickVisitManager } from '@/components/dashboard/QuickVisitManager';
import { MapButton } from '@/components/dashboard/MapButton';
import { GestorDashboardCard } from '@/components/dashboard/GestorDashboardCard';
import { MapDashboardCard } from '@/components/dashboard/MapDashboardCard';
import { QuickVisitSheetCard } from '@/components/dashboard/QuickVisitSheetCard';
import { cn } from '@/lib/utils';
import { GestorOverviewSection } from '@/components/dashboard/GestorOverviewSection';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

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

interface GestorDashboardProps {
  canGoBack?: boolean;
  canGoForward?: boolean;
  onGoBack?: () => void;
  onGoForward?: () => void;
}

type ActiveSection = 'home' | 'overview' | 'visits' | 'goals' | 'history';

export function GestorDashboard({ 
  canGoBack = false,
  canGoForward = false,
  onGoBack,
  onGoForward
}: GestorDashboardProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userCargo, setUserCargo] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>('home');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'in' | 'out'>('in');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: subMonths(today, 6), to: today };
  });

  const handleSectionChange = (newSection: ActiveSection) => {
    if (newSection === activeSection) return;
    
    setIsTransitioning(true);
    setTransitionDirection('out');
    
    setTimeout(() => {
      setActiveSection(newSection);
      setTransitionDirection('in');
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 200);
  };
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
      fetchUserCargo();
    }
  }, [user]);

  const fetchUserCargo = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('cargo')
        .eq('id', user.id)
        .single();
      if (data?.cargo) {
        setUserCargo(data.cargo);
      }
    } catch (error) {
      console.error('Error fetching user cargo:', error);
    }
  };

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

      const { data: allVisits, error: visitsError } = await supabase
        .from('visits')
        .select('*, companies(name, vinculacion_entidad_1)')
        .eq('gestor_id', user.id)
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate)
        .order('visit_date', { ascending: false });

      if (visitsError) throw visitsError;

      let visits = allVisits || [];

      if (selectedProducts.length > 0) {
        visits = visits.filter(visit => {
          if (!visit.productos_ofrecidos || !Array.isArray(visit.productos_ofrecidos)) return false;
          return visit.productos_ofrecidos.some(p => selectedProducts.includes(p));
        });
      }

      visits = visits.filter(visit => {
        const vinculacion = visit.companies?.vinculacion_entidad_1 || 0;
        return vinculacion >= minVinculacion && vinculacion <= maxVinculacion;
      });

      const totalVisits = visits?.length || 0;
      const successfulVisits = visits?.filter(v => v.result === 'Exitosa').length || 0;
      const successRate = totalVisits > 0 ? Math.round((successfulVisits / totalVisits) * 100) : 0;

      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', user.id);

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

      const recentVisitsData: RecentVisit[] = (visits?.slice(0, 10) || []).map(v => ({
        id: v.id,
        visit_date: v.visit_date,
        company_name: v.companies?.name || 'Desconocida',
        result: v.result || 'Sin resultado',
        notes: v.notes || ''
      }));

      setRecentVisits(recentVisitsData);

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

      const { data: allCompVisits, error: compVisitsError } = await supabase
        .from('visits')
        .select('*, companies(name, vinculacion_entidad_1)')
        .eq('gestor_id', user.id)
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate)
        .order('visit_date', { ascending: false });

      if (compVisitsError) throw compVisitsError;

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

      const compUniqueProducts = new Set<string>();
      compVisits?.forEach(visit => {
        if (visit.productos_ofrecidos && Array.isArray(visit.productos_ofrecidos)) {
          visit.productos_ofrecidos.forEach(p => compUniqueProducts.add(p));
        }
      });

      setComparisonStats({
        totalVisits: totalCompVisits,
        successRate: compSuccessRate,
        totalCompanies: stats.totalCompanies,
        totalProducts: compUniqueProducts.size
      });

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
              <CardContent className="p-6">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    {
      id: 'overview' as ActiveSection,
      title: 'Visió General',
      description: 'Mètriques clau, gràfics d\'evolució i anàlisi de rendiment',
      icon: BarChart3,
      color: 'hsl(var(--chart-1))',
      stats: { value: stats.totalVisits, label: 'Visites totals' },
      tooltip: 'Consulta els teus KPIs principals, gràfics d\'evolució mensual, distribució de resultats de visites, productes més oferts i empreses amb major vinculació. Inclou filtres avançats i comparació de períodes.'
    },
    {
      id: 'visits' as ActiveSection,
      title: 'Gestió de Visites',
      description: 'Crear, editar i consultar les teves visites',
      icon: CalendarDays,
      color: 'hsl(var(--chart-2))',
      stats: { value: `${stats.successRate}%`, label: 'Taxa èxit' },
      tooltip: 'Crea noves visites, edita les existents i consulta l\'historial complet. Registra productes oferts, notes i resultats de cada visita comercial.'
    },
    {
      id: 'goals' as ActiveSection,
      title: 'Objectius',
      description: 'Seguiment dels teus objectius personals',
      icon: Target,
      color: 'hsl(var(--chart-3))',
      stats: { value: stats.totalCompanies, label: 'Empreses' },
      tooltip: 'Visualitza i fes seguiment dels objectius assignats pel teu responsable. Controla el progrés en temps real de visites, empreses, productes i vinculació.'
    },
    {
      id: 'history' as ActiveSection,
      title: 'Historial',
      description: 'Anàlisi detallat i benchmarking del teu rendiment',
      icon: TrendingUp,
      color: 'hsl(var(--chart-4))',
      stats: { value: stats.totalProducts, label: 'Productes' },
      tooltip: 'Analitza el teu rendiment històric, compara\'t amb la mitjana d\'oficina i d\'equip, i accedeix als plans d\'acció generats amb IA per millorar les teves mètriques.'
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <GestorOverviewSection
            stats={stats}
            comparisonStats={comparisonStats}
            monthlyData={monthlyData}
            recentVisits={recentVisits}
            resultDistribution={resultDistribution}
            topProducts={topProducts}
            topCompanies={topCompanies}
            dateRange={dateRange}
            setDateRange={setDateRange}
            comparisonPeriod={comparisonPeriod}
            setComparisonPeriod={setComparisonPeriod}
            comparisonDateRange={comparisonDateRange}
            showComparison={showComparison}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            hasActiveFilters={hasActiveFilters}
            clearFilters={clearFilters}
            availableProducts={availableProducts}
            selectedProducts={selectedProducts}
            toggleProductFilter={toggleProductFilter}
            minVinculacion={minVinculacion}
            setMinVinculacion={setMinVinculacion}
            maxVinculacion={maxVinculacion}
            setMaxVinculacion={setMaxVinculacion}
            onBack={() => handleSectionChange('home')}
          />
        );
      case 'visits':
        return (
          <div>
            <Button variant="ghost" onClick={() => handleSectionChange('home')} className="mb-4">
              ← Tornar al panell
            </Button>
            <QuickVisitManager gestorId={user?.id} />
          </div>
        );
      case 'goals':
        return (
          <div>
            <Button variant="ghost" onClick={() => handleSectionChange('home')} className="mb-4">
              ← Tornar al panell
            </Button>
            <PersonalGoalsTracker />
          </div>
        );
      case 'history':
        return (
          <div>
            <Button variant="ghost" onClick={() => handleSectionChange('home')} className="mb-4">
              ← Tornar al panell
            </Button>
            <PersonalGoalsHistory />
          </div>
        );
      default:
        return null;
    }
  };

  const sectionLabels: Record<ActiveSection, string> = {
    home: 'Panell Principal',
    overview: 'Visió General',
    visits: 'Gestió de Visites',
    goals: 'Objectius',
    history: 'Historial'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">El Meu Panell</h1>
              <Badge variant="outline" className="h-7 px-3 text-sm">
                <Users className="h-4 w-4 mr-2" />
                {userCargo || 'Gestor'}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Vista exclusiva de les meves mètriques i objectius personals
            </p>
          </div>
          <MapButton />
        </div>
        <div className="flex items-center gap-2">
          {(onGoBack || onGoForward) && (
            <div className="flex items-center gap-1 mr-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onGoBack}
                disabled={!canGoBack}
                className="h-8 w-8 rounded-lg hover:bg-accent/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Enrere"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onGoForward}
                disabled={!canGoForward}
                className="h-8 w-8 rounded-lg hover:bg-accent/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Endavant"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/home')}
            className="hover:bg-accent/50 transition-colors rounded-xl h-9 w-9"
            title="Inicio"
          >
            <Home className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')}
            className="hover:bg-accent/50 transition-colors rounded-xl h-9 w-9"
            title="Mi Perfil"
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
          <ThemeSelector />
          <LanguageSelector />
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            {activeSection === 'home' ? (
              <BreadcrumbPage className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                El Meu Panell
              </BreadcrumbPage>
            ) : (
              <BreadcrumbLink 
                onClick={() => handleSectionChange('home')}
                className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
              >
                <Home className="h-4 w-4" />
                El Meu Panell
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {activeSection !== 'home' && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="flex items-center gap-2 font-medium">
                  {cards.find(c => c.id === activeSection)?.icon && 
                    (() => {
                      const IconComp = cards.find(c => c.id === activeSection)?.icon;
                      return IconComp ? <IconComp className="h-4 w-4" /> : null;
                    })()
                  }
                  {sectionLabels[activeSection]}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Main Content */}
      <div 
        className={cn(
          "transition-all duration-300 ease-out",
          transitionDirection === 'out' && "opacity-0 translate-y-4 scale-[0.98]",
          transitionDirection === 'in' && !isTransitioning && "opacity-100 translate-y-0 scale-100",
          transitionDirection === 'in' && isTransitioning && "opacity-0 -translate-y-4 scale-[0.98]"
        )}
      >
        {activeSection === 'home' ? (
          <div className="space-y-8">
            {/* 3D Cards Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {cards.map((card, index) => (
                <div 
                  key={card.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <GestorDashboardCard
                    title={card.title}
                    description={card.description}
                    icon={card.icon}
                    color={card.color}
                    onClick={() => handleSectionChange(card.id)}
                    stats={card.stats}
                    tooltip={card.tooltip}
                  />
                </div>
              ))}
              
              {/* Ficha de Visita Card */}
              <div className="animate-fade-in" style={{ animationDelay: `${cards.length * 100}ms` }}>
                <QuickVisitSheetCard />
              </div>

              {/* Mapa Card */}
              <div className="animate-fade-in" style={{ animationDelay: `${(cards.length + 1) * 100}ms` }}>
                <MapDashboardCard />
              </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                      <Activity className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-2xl font-bold">{stats.totalVisits}</p>
                      <p className="text-sm text-muted-foreground">Visites totals</p>
                    </div>
                  </div>
                  {monthlyData.length > 0 && (
                    <div className="mt-3 h-12 -mx-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData}>
                          <defs>
                            <linearGradient id="sparkVisits" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area 
                            type="monotone" 
                            dataKey="visits" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            fill="url(#sparkVisits)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-chart-2/5 to-chart-2/10 border-chart-2/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-2/20">
                      <Target className="h-6 w-6 text-chart-2" />
                    </div>
                    <div className="flex-1">
                      <p className="text-2xl font-bold">{stats.successRate}%</p>
                      <p className="text-sm text-muted-foreground">Taxa d'èxit</p>
                    </div>
                  </div>
                  {monthlyData.length > 0 && (
                    <div className="mt-3 h-12 -mx-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData.map(d => ({ ...d, rate: d.visits > 0 ? Math.round((d.successful / d.visits) * 100) : 0 }))}>
                          <defs>
                            <linearGradient id="sparkRate" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area 
                            type="monotone" 
                            dataKey="rate" 
                            stroke="hsl(var(--chart-2))" 
                            strokeWidth={2}
                            fill="url(#sparkRate)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-chart-3/5 to-chart-3/10 border-chart-3/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-3/20">
                      <Building2 className="h-6 w-6 text-chart-3" />
                    </div>
                    <div className="flex-1">
                      <p className="text-2xl font-bold">{stats.totalCompanies}</p>
                      <p className="text-sm text-muted-foreground">Empreses</p>
                    </div>
                  </div>
                  {monthlyData.length > 0 && (
                    <div className="mt-3 h-12 -mx-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData}>
                          <defs>
                            <linearGradient id="sparkSuccessful" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--chart-3))" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area 
                            type="monotone" 
                            dataKey="successful" 
                            stroke="hsl(var(--chart-3))" 
                            strokeWidth={2}
                            fill="url(#sparkSuccessful)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-chart-4/5 to-chart-4/10 border-chart-4/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-4/20">
                      <Package className="h-6 w-6 text-chart-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-2xl font-bold">{stats.totalProducts}</p>
                      <p className="text-sm text-muted-foreground">Productes</p>
                    </div>
                  </div>
                  {monthlyData.length > 0 && (
                    <div className="mt-3 h-12 -mx-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData}>
                          <defs>
                            <linearGradient id="sparkProducts" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--chart-4))" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area 
                            type="monotone" 
                            dataKey="visits" 
                            stroke="hsl(var(--chart-4))" 
                            strokeWidth={2}
                            fill="url(#sparkProducts)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
}
