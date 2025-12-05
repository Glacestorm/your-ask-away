import { useNavigate } from 'react-router-dom';
import { Map, Building2, MapPin, TrendingUp, TrendingDown, ExternalLink, Calendar, ArrowUpDown, Plus, BarChart3, Eye, EyeOff, Award, AlertTriangle, Table, LayoutGrid, ChevronDown, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ca } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type ResultFilter = 'all' | 'exitosa' | 'pendiente' | 'fallida' | 'reagendada';
type SortMode = 'vinculacion' | 'lastVisit';
type VinculacionFilter = 'all' | 'high' | 'medium' | 'low';

interface MonthlyVisits {
  month: string;
  shortMonth: string;
  count: number;
  lastYearCount?: number;
}

interface CompanyPreview {
  id: string;
  name: string;
  parroquia: string;
  vinculacion_entidad_1: number | null;
  photo_url?: string | null;
  photo_count?: number;
  sector?: string | null;
  cnae?: string | null;
  fecha_ultima_visita?: string | null;
  visit_count?: number;
  facturacion_anual?: number | null;
}

const getDateColorClass = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'text-muted-foreground';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 30) return 'text-green-600 dark:text-green-400';
  if (diffDays <= 90) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

const getDaysAgo = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'Mai visitada';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Avui';
  if (diffDays === 1) return 'Ahir';
  return `Fa ${diffDays} dies`;
};

interface MapDashboardCardProps {
  onNavigateToMap?: () => void;
}

export function MapDashboardCard({ onNavigateToMap }: MapDashboardCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyPreview[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('vinculacion');
  const [vinculacionFilter, setVinculacionFilter] = useState<VinculacionFilter>('all');
  const [chartVisible, setChartVisible] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const [monthlyVisits, setMonthlyVisits] = useState<MonthlyVisits[]>([]);
  const [showYoY, setShowYoY] = useState(true);
  const [chartViewMode, setChartViewMode] = useState<'chart' | 'table'>('chart');
  const [monthRange, setMonthRange] = useState<3 | 6 | 12>(6);
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
  const [resultCounts, setResultCounts] = useState<Record<string, number>>({ all: 0, exitosa: 0, pendiente: 0, fallida: 0, reagendada: 0 });
  
  // Card state
  const [isExpanded, setIsExpanded] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isExpanded) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    const rotateXValue = (mouseY / (rect.height / 2)) * -15;
    const rotateYValue = (mouseX / (rect.width / 2)) * 15;
    
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    if (!isExpanded) {
      setIsHovered(true);
    }
  };

  const handleCardClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setRotateX(0);
      setRotateY(0);
      setIsHovered(false);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
  };

  useEffect(() => {
    if (user?.id) {
      fetchCompanyPreview();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchMonthlyVisits();
    }
  }, [user?.id, monthRange, resultFilter]);

  useEffect(() => {
    const timer = setTimeout(() => setChartVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const fetchMonthlyVisits = async () => {
    if (!user?.id) return;
    try {
      const monthsAgo = startOfMonth(subMonths(new Date(), monthRange - 1));
      const dataStartDate = startOfMonth(subMonths(new Date(), monthRange + 11));
      
      const { data: allVisits } = await supabase
        .from('visits')
        .select('visit_date, result')
        .eq('gestor_id', user.id)
        .gte('visit_date', format(monthsAgo, 'yyyy-MM-dd'));
      
      if (allVisits) {
        const counts: Record<string, number> = { all: allVisits.length, exitosa: 0, pendiente: 0, fallida: 0, reagendada: 0 };
        allVisits.forEach(v => {
          if (v.result && counts[v.result] !== undefined) {
            counts[v.result]++;
          }
        });
        setResultCounts(counts);
      }
      
      let query = supabase
        .from('visits')
        .select('visit_date, result')
        .eq('gestor_id', user.id)
        .gte('visit_date', format(dataStartDate, 'yyyy-MM-dd'));
      
      if (resultFilter !== 'all') {
        query = query.eq('result', resultFilter);
      }

      const { data } = await query;

      if (data) {
        const months: MonthlyVisits[] = [];
        for (let i = monthRange - 1; i >= 0; i--) {
          const monthDate = subMonths(new Date(), i);
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          
          const lastYearMonthDate = subMonths(monthDate, 12);
          const lastYearMonthStart = startOfMonth(lastYearMonthDate);
          const lastYearMonthEnd = endOfMonth(lastYearMonthDate);
          
          const count = data.filter(v => {
            const visitDate = new Date(v.visit_date);
            return visitDate >= monthStart && visitDate <= monthEnd;
          }).length;

          const lastYearCount = data.filter(v => {
            const visitDate = new Date(v.visit_date);
            return visitDate >= lastYearMonthStart && visitDate <= lastYearMonthEnd;
          }).length;

          months.push({
            month: format(monthDate, 'MMMM', { locale: ca }),
            shortMonth: format(monthDate, 'MMM', { locale: ca }).substring(0, 3),
            count,
            lastYearCount,
          });
        }
        setMonthlyVisits(months);
      }
    } catch (error) {
      console.error('Error fetching monthly visits:', error);
    }
  };

  const fetchCompanyPreview = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { count } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', user.id);

      setTotalCount(count || 0);

      const { data } = await supabase
        .from('companies')
        .select('id, name, parroquia, vinculacion_entidad_1, sector, cnae, fecha_ultima_visita, facturacion_anual')
        .eq('gestor_id', user.id)
        .limit(20);

      if (data && data.length > 0) {
        const companyIds = data.map(c => c.id);
        
        const [photosResult, visitsResult] = await Promise.all([
          supabase
            .from('company_photos')
            .select('company_id, photo_url')
            .in('company_id', companyIds)
            .order('created_at', { ascending: false }),
          supabase
            .from('visits')
            .select('company_id')
            .in('company_id', companyIds)
        ]);

        const photoMap: Record<string, { url: string; count: number }> = {};
        photosResult.data?.forEach(p => {
          if (!photoMap[p.company_id]) {
            photoMap[p.company_id] = { url: p.photo_url, count: 1 };
          } else {
            photoMap[p.company_id].count += 1;
          }
        });

        const visitCountMap: Record<string, number> = {};
        visitsResult.data?.forEach(v => {
          visitCountMap[v.company_id] = (visitCountMap[v.company_id] || 0) + 1;
        });

        const companiesWithData = data.map(c => ({
          ...c,
          photo_url: photoMap[c.id]?.url || null,
          photo_count: photoMap[c.id]?.count || 0,
          visit_count: visitCountMap[c.id] || 0,
        }));

        setCompanies(companiesWithData);
      } else {
        setCompanies([]);
      }
    } catch (error) {
      console.error('Error fetching companies preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (onNavigateToMap) {
      onNavigateToMap();
    } else {
      navigate('/admin?section=map');
    }
  };

  const avgVinculacion = companies.length > 0
    ? Math.round(companies.reduce((sum, c) => sum + (c.vinculacion_entidad_1 || 0), 0) / companies.length)
    : 0;

  const vinculacionCounts = {
    all: companies.length,
    high: companies.filter(c => (c.vinculacion_entidad_1 || 0) >= 70).length,
    medium: companies.filter(c => (c.vinculacion_entidad_1 || 0) >= 40 && (c.vinculacion_entidad_1 || 0) < 70).length,
    low: companies.filter(c => (c.vinculacion_entidad_1 || 0) < 40).length,
  };

  const filteredCompanies = companies.filter(c => {
    const vinc = c.vinculacion_entidad_1 || 0;
    if (vinculacionFilter === 'high') return vinc >= 70;
    if (vinculacionFilter === 'medium') return vinc >= 40 && vinc < 70;
    if (vinculacionFilter === 'low') return vinc < 40;
    return true;
  });

  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    if (sortMode === 'vinculacion') {
      return (b.vinculacion_entidad_1 || 0) - (a.vinculacion_entidad_1 || 0);
    } else {
      const dateA = a.fecha_ultima_visita ? new Date(a.fecha_ultima_visita).getTime() : 0;
      const dateB = b.fecha_ultima_visita ? new Date(b.fecha_ultima_visita).getTime() : 0;
      return dateB - dateA;
    }
  }).slice(0, 5);

  // Calculate chart data
  const n = monthlyVisits.length;
  const sumX = monthlyVisits.reduce((sum, _, i) => sum + i, 0);
  const sumY = monthlyVisits.reduce((sum, m) => sum + m.count, 0);
  const sumXY = monthlyVisits.reduce((sum, m, i) => sum + i * m.count, 0);
  const sumX2 = monthlyVisits.reduce((sum, _, i) => sum + i * i, 0);
  const slope = n > 0 && (n * sumX2 - sumX * sumX) !== 0 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0;
  const intercept = n > 0 ? (sumY - slope * sumX) / n : 0;
  const predictedCount = Math.max(0, Math.round(slope * n + intercept));
  
  const meanY = n > 0 ? sumY / n : 0;
  const variance = n > 1 ? monthlyVisits.reduce((sum, m) => sum + Math.pow(m.count - meanY, 2), 0) / (n - 1) : 0;
  const stdDev = Math.sqrt(variance);
  const confidenceMargin = Math.round(stdDev * 1.2);
  const predictionMin = Math.max(0, predictedCount - confidenceMargin);
  const predictionMax = predictedCount + confidenceMargin;
  
  const allCounts = [...monthlyVisits.map(m => m.count), ...monthlyVisits.map(m => m.lastYearCount || 0), predictionMax];
  const maxCount = Math.max(...allCounts, 1);
  const hasLastYearData = monthlyVisits.some(m => (m.lastYearCount || 0) > 0);
  const totalLastYear = monthlyVisits.reduce((sum, m) => sum + (m.lastYearCount || 0), 0);
  const totalThisYear = monthlyVisits.reduce((sum, m) => sum + m.count, 0);
  const yoyChange = totalLastYear > 0 ? Math.round(((totalThisYear - totalLastYear) / totalLastYear) * 100) : null;
  const currentMonth = monthlyVisits[monthlyVisits.length - 1]?.count || 0;
  const previousMonth = monthlyVisits[monthlyVisits.length - 2]?.count || 0;
  const monthChange = previousMonth > 0 
    ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100)
    : currentMonth > 0 ? 100 : 0;
  const isPositive = monthChange >= 0;
  
  const barCount = monthlyVisits.length + 1;
  const trendPoints = monthlyVisits.map((m, i) => {
    const x = (i / barCount) * 100;
    const y = 100 - ((m.count / maxCount) * 80);
    return `${x},${y}`;
  }).join(' ');
  
  const areaPoints = [
    '0,100',
    ...monthlyVisits.map((m, i) => {
      const x = (i / barCount) * 100;
      const y = 100 - ((m.count / maxCount) * 80);
      return `${x},${y}`;
    }),
    `${((monthlyVisits.length - 1) / barCount) * 100},100`
  ].join(' ');
  
  const yoyChanges = monthlyVisits.map((m, idx) => ({
    idx,
    month: m.month,
    change: (m.lastYearCount || 0) > 0 
      ? Math.round(((m.count - (m.lastYearCount || 0)) / (m.lastYearCount || 0)) * 100)
      : null
  })).filter(m => m.change !== null);
  
  const bestMonth = yoyChanges.length > 0 ? yoyChanges.reduce((best, curr) => (curr.change || 0) > (best.change || 0) ? curr : best) : null;
  const worstMonth = yoyChanges.length > 0 ? yoyChanges.reduce((worst, curr) => (curr.change || 0) < (worst.change || 0) ? curr : worst) : null;

  // Collapsed card view (like GestorDashboardCard)
  if (!isExpanded) {
    const cardColor = 'hsl(var(--chart-5))';
    return (
      <div
        className="perspective-1000"
        style={{ perspective: '1000px' }}
      >
        <div
          onClick={handleCardClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={handleMouseEnter}
          className={cn(
            "relative cursor-pointer rounded-2xl p-6 h-48 transition-all duration-300 ease-out",
            "border-2 shadow-lg hover:shadow-2xl",
            "bg-gradient-to-br from-card via-card to-card/80",
            "transform-gpu will-change-transform",
            isHovered && "scale-[1.02]"
          )}
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Glow effect */}
          <div 
            className={cn(
              "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
              isHovered && "opacity-100"
            )}
            style={{
              background: `radial-gradient(circle at 50% 0%, ${cardColor}20, transparent 70%)`,
            }}
          />

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-between" style={{ transform: 'translateZ(30px)' }}>
            <div className="flex items-start justify-between">
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-300",
                  isHovered && "scale-110"
                )}
                style={{ backgroundColor: `${cardColor}20` }}
              >
                <Map className="h-7 w-7" style={{ color: cardColor }} />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">{totalCount}</div>
                <div className="text-xs text-muted-foreground">Empreses</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Mapa</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                Empreses, visites i vinculació...
              </p>
            </div>
          </div>

          {/* Bottom gradient line */}
          <div 
            className={cn(
              "absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl transition-all duration-300",
              isHovered ? "opacity-100" : "opacity-50"
            )}
            style={{ backgroundColor: cardColor }}
          />
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <CardContent className="p-4 space-y-3">
        {/* Header with close button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-md">
              <Map className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Mapa d'Empreses</h3>
              <p className="text-xs text-muted-foreground">
                Visualitza les teves empreses assignades
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs bg-background/50 rounded-md p-2">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Total empreses:</span>
            <span className="font-semibold">{totalCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Vinc. mitjana:</span>
            <span className="font-semibold">{avgVinculacion}%</span>
          </div>
        </div>

        {/* Distribution chart */}
        {companies.length > 0 && (
          <div className="space-y-1.5" ref={chartRef}>
            <p className="text-[10px] text-muted-foreground font-medium">Distribució per vinculació:</p>
            <div className="flex h-5 w-full rounded-full overflow-hidden bg-muted">
              <TooltipProvider delayDuration={100}>
                {vinculacionCounts.high > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={`bg-green-500 h-full cursor-pointer hover:brightness-110 transition-all duration-500 ease-out ${
                          vinculacionFilter === 'high' ? 'ring-2 ring-primary ring-offset-1' : ''
                        }`}
                        style={{ 
                          width: chartVisible ? `${(vinculacionCounts.high / companies.length) * 100}%` : '0%',
                          transitionDelay: '0ms'
                        }}
                        onClick={() => setVinculacionFilter(prev => prev === 'high' ? 'all' : 'high')}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        <span>Alta (≥70%): <strong>{vinculacionCounts.high}</strong></span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
                {vinculacionCounts.medium > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={`bg-yellow-500 h-full cursor-pointer hover:brightness-110 transition-all duration-500 ease-out ${
                          vinculacionFilter === 'medium' ? 'ring-2 ring-primary ring-offset-1' : ''
                        }`}
                        style={{ 
                          width: chartVisible ? `${(vinculacionCounts.medium / companies.length) * 100}%` : '0%',
                          transitionDelay: '150ms'
                        }}
                        onClick={() => setVinculacionFilter(prev => prev === 'medium' ? 'all' : 'medium')}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-yellow-500" />
                        <span>Mitjana (40-69%): <strong>{vinculacionCounts.medium}</strong></span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
                {vinculacionCounts.low > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={`bg-red-500 h-full cursor-pointer hover:brightness-110 transition-all duration-500 ease-out ${
                          vinculacionFilter === 'low' ? 'ring-2 ring-primary ring-offset-1' : ''
                        }`}
                        style={{ 
                          width: chartVisible ? `${(vinculacionCounts.low / companies.length) * 100}%` : '0%',
                          transitionDelay: '300ms'
                        }}
                        onClick={() => setVinculacionFilter(prev => prev === 'low' ? 'all' : 'low')}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        <span>Baixa (&lt;40%): <strong>{vinculacionCounts.low}</strong></span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {Math.round((vinculacionCounts.high / companies.length) * 100) || 0}%
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                {Math.round((vinculacionCounts.medium / companies.length) * 100) || 0}%
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                {Math.round((vinculacionCounts.low / companies.length) * 100) || 0}%
              </span>
            </div>
          </div>
        )}

        {/* Visits evolution */}
        {monthlyVisits.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="h-3 w-3 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground">Evolució visites ({monthRange} mesos):</p>
              </div>
              <div className="flex items-center gap-1">
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setChartViewMode(chartViewMode === 'chart' ? 'table' : 'chart')}
                        className={`p-1 rounded transition-all ${
                          chartViewMode === 'table'
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {chartViewMode === 'chart' ? <Table className="h-3 w-3" /> : <LayoutGrid className="h-3 w-3" />}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {chartViewMode === 'chart' ? 'Veure taula' : 'Veure gràfic'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {hasLastYearData && chartViewMode === 'chart' && (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setShowYoY(!showYoY)}
                          className={`p-1 rounded transition-all ${
                            showYoY 
                              ? 'bg-primary/20 text-primary' 
                              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {showYoY ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {showYoY ? 'Amagar any anterior' : 'Mostrar any anterior'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <div className="flex items-center gap-0.5 bg-muted/50 rounded p-0.5">
                  {([3, 6, 12] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setMonthRange(range)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-all ${
                        monthRange === range
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {range}m
                    </button>
                  ))}
                </div>
                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                  isPositive 
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}>
                  {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                  <span>{isPositive ? '+' : ''}{monthChange}%</span>
                </div>
              </div>
            </div>

            {/* Result Filter */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[9px] text-muted-foreground">Resultat:</span>
              <div className="flex items-center gap-0.5 bg-muted/50 rounded p-0.5">
                <TooltipProvider delayDuration={100}>
                  {([
                    { value: 'all' as const, label: 'Tot', dot: '', activeBg: 'bg-primary', inactiveBg: 'bg-muted/80', barColor: 'bg-primary' },
                    { value: 'exitosa' as const, label: 'Exitosa', dot: 'bg-green-500', activeBg: 'bg-green-500', inactiveBg: 'bg-green-500/15 hover:bg-green-500/25', barColor: 'bg-green-500' },
                    { value: 'pendiente' as const, label: 'Pendent', dot: 'bg-yellow-500', activeBg: 'bg-yellow-500', inactiveBg: 'bg-yellow-500/15 hover:bg-yellow-500/25', barColor: 'bg-yellow-500' },
                    { value: 'fallida' as const, label: 'Fallida', dot: 'bg-red-500', activeBg: 'bg-red-500', inactiveBg: 'bg-red-500/15 hover:bg-red-500/25', barColor: 'bg-red-500' },
                    { value: 'reagendada' as const, label: 'Reagend.', dot: 'bg-blue-500', activeBg: 'bg-blue-500', inactiveBg: 'bg-blue-500/15 hover:bg-blue-500/25', barColor: 'bg-blue-500' },
                  ]).map((filter) => {
                    const total = resultCounts.all || 1;
                    const count = resultCounts[filter.value] || 0;
                    const percentage = filter.value === 'all' ? 100 : Math.round((count / total) * 100);
                    const exactPercentage = filter.value === 'all' ? 100 : ((count / total) * 100).toFixed(1);
                    return (
                      <Tooltip key={filter.value}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setResultFilter(filter.value)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-all flex flex-col items-center gap-0.5 min-w-[42px] ${
                              resultFilter === filter.value
                                ? `${filter.activeBg} text-white`
                                : `${filter.inactiveBg} text-foreground/70`
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              {filter.dot && resultFilter !== filter.value && <span className={`h-1.5 w-1.5 rounded-full ${filter.dot}`} />}
                              {filter.label}
                              <span className={`text-[8px] ${resultFilter === filter.value ? 'opacity-80' : 'opacity-60'}`}>
                                ({count})
                              </span>
                            </div>
                            {filter.value !== 'all' && (
                              <div className="w-full h-1 bg-black/10 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${resultFilter === filter.value ? 'bg-white/50' : filter.barColor} transition-all`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          <p className="font-medium">{filter.label}</p>
                          <p>{count} visites ({exactPercentage}% del total)</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>
              </div>
            </div>

            {/* Chart View */}
            {chartViewMode === 'chart' && (
              <>
                <div className="relative flex items-end gap-1 h-14">
                  <svg 
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="areaGradientCard" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <polygon
                      points={areaPoints}
                      fill="url(#areaGradientCard)"
                      className="transition-all duration-700"
                      style={{ opacity: chartVisible ? 1 : 0, transitionDelay: '300ms' }}
                    />
                    <polyline
                      points={trendPoints}
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all duration-700"
                      style={{
                        strokeDasharray: chartVisible ? '0' : '500',
                        strokeDashoffset: chartVisible ? '0' : '500',
                        transitionDelay: '400ms'
                      }}
                    />
                    {monthlyVisits.map((m, i) => {
                      const x = (i / barCount) * 100;
                      const y = 100 - ((m.count / maxCount) * 80);
                      return (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="2.5"
                          fill="hsl(var(--background))"
                          stroke="hsl(var(--primary))"
                          strokeWidth="1.5"
                          className="transition-all duration-500"
                          style={{ opacity: chartVisible ? 1 : 0, transitionDelay: `${500 + i * 50}ms` }}
                        />
                      );
                    })}
                  </svg>
                  {monthlyVisits.map((month, idx) => (
                    <TooltipProvider key={month.month} delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center flex-1 relative z-20">
                            <div className="flex gap-0.5 items-end h-10 w-full justify-center">
                              {showYoY && hasLastYearData && (
                                <div 
                                  className="w-2 bg-muted-foreground/30 rounded-t transition-all duration-500"
                                  style={{ 
                                    height: chartVisible ? `${((month.lastYearCount || 0) / maxCount) * 100}%` : '0%',
                                    transitionDelay: `${idx * 100}ms`,
                                    minHeight: (month.lastYearCount || 0) > 0 ? '2px' : '0'
                                  }}
                                />
                              )}
                              <div 
                                className="w-2 bg-primary/50 hover:bg-primary/70 rounded-t transition-all duration-500 relative"
                                style={{ 
                                  height: chartVisible ? `${(month.count / maxCount) * 100}%` : '0%',
                                  transitionDelay: `${idx * 100}ms`,
                                  minHeight: month.count > 0 ? '2px' : '0'
                                }}
                              />
                            </div>
                            <span className="text-[8px] text-muted-foreground mt-0.5 capitalize">{month.shortMonth}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium capitalize">{month.month}</p>
                          <p>{month.count} visites</p>
                          {showYoY && hasLastYearData && (
                            <p className="text-muted-foreground">{month.lastYearCount || 0} any ant.</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  {/* Prediction bar */}
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center flex-1 relative z-20">
                          <div className="flex gap-0.5 items-end h-10 w-full justify-center">
                            <div 
                              className="w-2 bg-primary/30 rounded-t transition-all duration-500 border border-dashed border-primary/50"
                              style={{ 
                                height: chartVisible ? `${(predictedCount / maxCount) * 100}%` : '0%',
                                transitionDelay: `${monthlyVisits.length * 100}ms`,
                                minHeight: predictedCount > 0 ? '2px' : '0'
                              }}
                            />
                          </div>
                          <span className="text-[8px] text-primary/70 mt-0.5">Pred.</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-medium text-primary">Predicció proper mes</p>
                        <p className="font-medium">{predictedCount} visites</p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span>Interval:</span>
                          <span className="font-medium">{predictionMin} - {predictionMax}</span>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex justify-between items-center text-[9px] text-muted-foreground">
                  <div className="flex gap-2">
                    <span>Total: {totalThisYear}</span>
                    {hasLastYearData && showYoY && (
                      <span className="text-muted-foreground/60">({totalLastYear} ant.)</span>
                    )}
                  </div>
                  <span>Mitjana: {n > 0 ? Math.round(totalThisYear / n) : 0}/mes</span>
                </div>
              </>
            )}

            {/* Table View */}
            {chartViewMode === 'table' && (
              <div className="space-y-1">
                <div className="overflow-hidden rounded-md border border-border/50">
                  <table className="w-full text-[9px]">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-1.5 py-1 text-left font-medium text-muted-foreground">Mes</th>
                        <th className="px-1.5 py-1 text-right font-medium text-muted-foreground">Visites</th>
                        {hasLastYearData && <th className="px-1.5 py-1 text-right font-medium text-muted-foreground">Ant.</th>}
                        {hasLastYearData && <th className="px-1.5 py-1 text-right font-medium text-muted-foreground">Δ%</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyVisits.map((month, idx) => {
                        const yoyMonthChange = (month.lastYearCount || 0) > 0 
                          ? Math.round(((month.count - (month.lastYearCount || 0)) / (month.lastYearCount || 0)) * 100)
                          : null;
                        const isBestMonth = bestMonth?.idx === idx;
                        const isWorstMonth = worstMonth?.idx === idx && worstMonth?.change !== bestMonth?.change;
                        
                        return (
                          <tr 
                            key={month.month}
                            className={`border-t border-border/30 transition-colors ${
                              isBestMonth ? 'bg-green-500/10' : isWorstMonth ? 'bg-red-500/10' : 'hover:bg-muted/30'
                            }`}
                          >
                            <td className="px-1.5 py-1 capitalize flex items-center gap-1">
                              {month.shortMonth}
                              {isBestMonth && <Award className="h-2.5 w-2.5 text-green-500" />}
                              {isWorstMonth && <AlertTriangle className="h-2.5 w-2.5 text-red-500" />}
                            </td>
                            <td className="px-1.5 py-1 text-right font-medium">{month.count}</td>
                            {hasLastYearData && (
                              <td className="px-1.5 py-1 text-right text-muted-foreground">{month.lastYearCount || 0}</td>
                            )}
                            {hasLastYearData && (
                              <td className={`px-1.5 py-1 text-right font-medium ${
                                yoyMonthChange === null 
                                  ? 'text-muted-foreground' 
                                  : yoyMonthChange >= 0 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                              }`}>
                                {yoyMonthChange !== null ? `${yoyMonthChange >= 0 ? '+' : ''}${yoyMonthChange}%` : '-'}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-between items-center text-[9px] text-muted-foreground">
                  <span>Total: {totalThisYear}</span>
                  <span>Mitjana: {n > 0 ? Math.round(totalThisYear / n) : 0}/mes</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vinculación filter buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          {[
            { key: 'all', label: 'Totes', color: '' },
            { key: 'high', label: 'Alta', color: 'bg-green-500' },
            { key: 'medium', label: 'Mitjana', color: 'bg-yellow-500' },
            { key: 'low', label: 'Baixa', color: 'bg-red-500' },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setVinculacionFilter(filter.key as VinculacionFilter)}
              className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] transition-all ${
                vinculacionFilter === filter.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {filter.color && <span className={`h-2 w-2 rounded-full ${filter.color}`} />}
              <span>{filter.label}</span>
              <span className={`text-[9px] px-1 rounded ${
                vinculacionFilter === filter.key
                  ? 'bg-primary-foreground/20'
                  : 'bg-muted'
              }`}>
                {vinculacionCounts[filter.key as keyof typeof vinculacionCounts]}
              </span>
            </button>
          ))}
        </div>

        {/* Companies preview */}
        {loading ? (
          <div className="text-xs text-muted-foreground text-center py-2">Carregant...</div>
        ) : companies.length > 0 ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Top empreses per {sortMode === 'vinculacion' ? 'vinculació' : 'última visita'}:
              </p>
              <button
                onClick={() => setSortMode(prev => prev === 'vinculacion' ? 'lastVisit' : 'vinculacion')}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowUpDown className="h-3 w-3" />
                <span>{sortMode === 'vinculacion' ? 'Visita' : 'Vinc.'}</span>
              </button>
            </div>
            {sortedCompanies.map((company) => (
              <div 
                key={company.id}
                className="w-full py-1.5 px-2 rounded-md bg-muted/50 hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all group"
              >
                <div className="flex items-center gap-2">
                  {company.photo_url ? (
                    <div className="h-8 w-8 rounded-md overflow-hidden flex-shrink-0 border border-border/50 group-hover:border-primary/50 transition-all relative">
                      <img 
                        src={company.photo_url} 
                        alt={company.name}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
                      />
                      {company.photo_count && company.photo_count > 1 && (
                        <div className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-[9px] font-medium text-primary-foreground flex items-center justify-center">
                          {company.photo_count}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0 border border-border/50 group-hover:border-primary/50 transition-colors">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 flex-1">
                    <button 
                      onClick={() => navigate(`/admin?section=map&company=${company.id}`)}
                      className="text-xs truncate group-hover:text-primary transition-colors text-left"
                    >
                      {company.name}
                    </button>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      {(company.sector || company.cnae) && (
                        <span className="truncate max-w-[80px]">{company.sector || company.cnae}</span>
                      )}
                      {(company.sector || company.cnae) && company.parroquia && <span>·</span>}
                      {company.parroquia && <span className="truncate">{company.parroquia}</span>}
                    </div>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={`flex items-center gap-1 text-[10px] cursor-help ${getDateColorClass(company.fecha_ultima_visita)}`}>
                            <Calendar className="h-2.5 w-2.5" />
                            {company.fecha_ultima_visita ? (
                              <span>{new Date(company.fecha_ultima_visita).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' })}</span>
                            ) : (
                              <span className="text-muted-foreground">Sense visites</span>
                            )}
                            {company.visit_count !== undefined && company.visit_count > 0 && (
                              <span className="text-muted-foreground">({company.visit_count})</span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {getDaysAgo(company.fecha_ultima_visita)}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-1">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!user?.id) return;
                              try {
                                const { error } = await supabase.from('visits').insert({
                                  company_id: company.id,
                                  gestor_id: user.id,
                                  visit_date: new Date().toISOString().split('T')[0],
                                  result: 'pending'
                                });
                                if (error) throw error;
                                toast.success(`Visita creada per ${company.name}`);
                                fetchCompanyPreview();
                              } catch (err) {
                                toast.error('Error creant la visita');
                              }
                            }}
                            className="h-6 w-6 rounded-md bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5 text-primary" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          Crear visita ràpida
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <button 
                      onClick={() => navigate(`/admin?section=map&company=${company.id}`)}
                      className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center"
                    >
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={`text-xs font-semibold ${
                      (company.vinculacion_entidad_1 || 0) >= 70 ? 'text-green-600 dark:text-green-400' :
                      (company.vinculacion_entidad_1 || 0) >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {company.vinculacion_entidad_1 || 0}%
                    </div>
                    <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          (company.vinculacion_entidad_1 || 0) >= 70 ? 'bg-green-500' :
                          (company.vinculacion_entidad_1 || 0) >= 40 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${company.vinculacion_entidad_1 || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-2">
            No hi ha empreses assignades
          </div>
        )}

        {/* CTA */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-2 text-xs bg-primary/10 hover:bg-primary/20"
          onClick={handleClick}
        >
          <Map className="h-3.5 w-3.5 mr-1.5" />
          Obrir Mapa
        </Button>
      </CardContent>
    </Card>
  );
}
