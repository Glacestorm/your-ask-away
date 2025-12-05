import { useNavigate } from 'react-router-dom';
import { Map, Building2, TrendingUp, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CompanyPreview {
  id: string;
  name: string;
  vinculacion_entidad_1: number | null;
  fecha_ultima_visita?: string | null;
}

type VinculacionFilter = 'all' | 'high' | 'medium' | 'low';

interface MapDashboardCardProps {
  onNavigateToMap?: () => void;
  variant?: 'card' | 'full';
}

export function MapDashboardCard({ onNavigateToMap, variant = 'card' }: MapDashboardCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyPreview[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [vinculacionFilter, setVinculacionFilter] = useState<VinculacionFilter>('all');
  const [chartVisible, setChartVisible] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) {
      fetchCompanyPreview();
    }
  }, [user?.id]);

  useEffect(() => {
    // Auto-animate chart on mount
    const timer = setTimeout(() => setChartVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

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
        .select('id, name, vinculacion_entidad_1, fecha_ultima_visita')
        .eq('gestor_id', user.id)
        .limit(20);

      if (data) {
        setCompanies(data);
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

  return (
    <Card 
      className="group cursor-pointer overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-primary/40"
      onClick={handleClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-md">
              <Map className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Mapa d'Empreses</h3>
              <p className="text-xs text-muted-foreground">
                Visualitza les teves empreses
              </p>
            </div>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        
        {/* Stats row */}
        <div className="flex items-center justify-between text-xs bg-background/50 rounded-md p-2">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Total:</span>
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
          <div 
            className="space-y-1.5"
            ref={chartRef}
          >
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setVinculacionFilter(prev => prev === 'high' ? 'all' : 'high');
                        }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setVinculacionFilter(prev => prev === 'medium' ? 'all' : 'medium');
                        }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setVinculacionFilter(prev => prev === 'low' ? 'all' : 'low');
                        }}
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

        {/* CTA */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-2 text-xs bg-primary/10 hover:bg-primary/20"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          <Map className="h-3.5 w-3.5 mr-1.5" />
          Obrir Mapa
        </Button>
      </CardContent>
    </Card>
  );
}
