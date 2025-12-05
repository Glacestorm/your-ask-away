import { useNavigate } from 'react-router-dom';
import { Map, Building2, MapPin, TrendingUp, ExternalLink, Calendar, ArrowUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const getVinculacionColor = (value: number): string => {
  if (value >= 70) return 'bg-green-500';
  if (value >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};
type SortMode = 'vinculacion' | 'lastVisit';
type VinculacionFilter = 'all' | 'high' | 'medium' | 'low';

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

interface MapButtonProps {
  onNavigateToMap?: () => void;
}

export function MapButton({ onNavigateToMap }: MapButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyPreview[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('vinculacion');
  const [vinculacionFilter, setVinculacionFilter] = useState<VinculacionFilter>('all');
  const [chartVisible, setChartVisible] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) {
      fetchCompanyPreview();
    }
  }, [user?.id]);

  const fetchCompanyPreview = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Get total count
      const { count } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', user.id);

      setTotalCount(count || 0);

      // Get companies (fetch more to allow client-side sorting)
      const { data } = await supabase
        .from('companies')
        .select('id, name, parroquia, vinculacion_entidad_1, sector, cnae, fecha_ultima_visita, facturacion_anual')
        .eq('gestor_id', user.id)
        .limit(20);

      if (data && data.length > 0) {
        const companyIds = data.map(c => c.id);
        
        // Fetch photos and visits in parallel
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

        // Map photos to companies
        const photoMap: Record<string, { url: string; count: number }> = {};
        photosResult.data?.forEach(p => {
          if (!photoMap[p.company_id]) {
            photoMap[p.company_id] = { url: p.photo_url, count: 1 };
          } else {
            photoMap[p.company_id].count += 1;
          }
        });

        // Count visits per company
        const visitCountMap: Record<string, number> = {};
        visitsResult.data?.forEach(v => {
          visitCountMap[v.company_id] = (visitCountMap[v.company_id] || 0) + 1;
        });

        const companiesWithData = data.map(c => ({
          ...c,
          photo_url: photoMap[c.id]?.url || null,
          photo_count: photoMap[c.id]?.count || 0,
          sector: c.sector,
          cnae: c.cnae,
          fecha_ultima_visita: c.fecha_ultima_visita,
          visit_count: visitCountMap[c.id] || 0,
          facturacion_anual: c.facturacion_anual,
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

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <Button
          onClick={handleClick}
          variant="outline"
          className="gap-2 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 hover:bg-primary/20 hover:border-primary/50 transition-all duration-300"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/80 shadow-sm">
            <Map className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-medium">Mapa</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent 
        side="bottom" 
        align="start"
        className="w-72 p-0 overflow-hidden"
      >
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Mapa d'Empreses</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Visualitza les teves empreses assignades
          </p>
        </div>
        
        <div className="p-3 space-y-3">
          {/* Stats row */}
          <div className="flex items-center justify-between text-xs">
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

          {/* Mini distribution chart */}
          {companies.length > 0 && (
            <div 
              className="space-y-1.5"
              ref={chartRef}
              onMouseEnter={() => setChartVisible(true)}
            >
              <p className="text-[10px] text-muted-foreground">Distribució per vinculació:</p>
              <div className="flex h-4 w-full rounded-full overflow-hidden bg-muted">
                {vinculacionCounts.high > 0 && (
                  <TooltipProvider delayDuration={100}>
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
                          <span>Alta (≥70%): <strong>{vinculacionCounts.high}</strong> empreses</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Clic per filtrar</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {vinculacionCounts.medium > 0 && (
                  <TooltipProvider delayDuration={100}>
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
                          <span>Mitjana (40-69%): <strong>{vinculacionCounts.medium}</strong> empreses</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Clic per filtrar</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {vinculacionCounts.low > 0 && (
                  <TooltipProvider delayDuration={100}>
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
                          <span>Baixa (&lt;40%): <strong>{vinculacionCounts.low}</strong> empreses</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Clic per filtrar</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  {Math.round((vinculacionCounts.high / companies.length) * 100)}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  {Math.round((vinculacionCounts.medium / companies.length) * 100)}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  {Math.round((vinculacionCounts.low / companies.length) * 100)}%
                </span>
              </div>

              {/* Filtered companies summary */}
              {vinculacionFilter !== 'all' && filteredCompanies.length > 0 && (
                <div className="mt-2 p-2 rounded-md bg-primary/5 border border-primary/20 space-y-1">
                  <p className="text-[10px] font-medium text-primary">
                    Resum ({vinculacionFilter === 'high' ? 'Alta' : vinculacionFilter === 'medium' ? 'Mitjana' : 'Baixa'}):
                  </p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Empreses:</span>
                      <span className="font-medium">{filteredCompanies.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vinc. mitjana:</span>
                      <span className="font-medium">
                        {Math.round(filteredCompanies.reduce((sum, c) => sum + (c.vinculacion_entidad_1 || 0), 0) / filteredCompanies.length)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Facturació:</span>
                      <span className="font-medium">
                        {(() => {
                          const total = filteredCompanies.reduce((sum, c) => sum + (c.facturacion_anual || 0), 0);
                          if (total >= 1000000) return `${(total / 1000000).toFixed(1)}M€`;
                          if (total >= 1000) return `${(total / 1000).toFixed(0)}K€`;
                          return `${total.toFixed(0)}€`;
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Últ. visita:</span>
                      <span className="font-medium">
                        {(() => {
                          const withDates = filteredCompanies.filter(c => c.fecha_ultima_visita);
                          if (withDates.length === 0) return 'N/A';
                          const avgDays = Math.round(
                            withDates.reduce((sum, c) => {
                              const days = Math.floor((Date.now() - new Date(c.fecha_ultima_visita!).getTime()) / (1000 * 60 * 60 * 24));
                              return sum + days;
                            }, 0) / withDates.length
                          );
                          return `~${avgDays}d`;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vinculación filter */}
          <div className="flex items-center gap-1 flex-wrap">
            {[
              { key: 'all', label: 'Totes', color: '' },
              { key: 'high', label: 'Alta', color: 'bg-green-500' },
              { key: 'medium', label: 'Mitjana', color: 'bg-yellow-500' },
              { key: 'low', label: 'Baixa', color: 'bg-red-500' },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={(e) => {
                  e.stopPropagation();
                  setVinculacionFilter(filter.key as VinculacionFilter);
                }}
                className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] transition-all ${
                  vinculacionFilter === filter.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {filter.color && (
                  <span className={`h-2 w-2 rounded-full ${filter.color}`} />
                )}
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
            <div className="text-xs text-muted-foreground text-center py-2">
              Carregant...
            </div>
          ) : companies.length > 0 ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Top empreses per {sortMode === 'vinculacion' ? 'vinculació' : 'última visita'}:
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSortMode(prev => prev === 'vinculacion' ? 'lastVisit' : 'vinculacion');
                  }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin?section=map&company=${company.id}`);
                        }}
                        className="text-xs truncate group-hover:text-primary transition-colors text-left"
                      >
                        {company.name}
                      </button>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        {(company.sector || company.cnae) && (
                          <span className="truncate max-w-[80px]">{company.sector || company.cnae}</span>
                        )}
                        {(company.sector || company.cnae) && company.parroquia && <span>·</span>}
                        {company.parroquia && (
                          <span className="truncate">{company.parroquia}</span>
                        )}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin?section=map&company=${company.id}`);
                        }}
                        className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center"
                      >
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  {/* Vinculación progress bar */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${getVinculacionColor(company.vinculacion_entidad_1 || 0)}`}
                        style={{ width: `${company.vinculacion_entidad_1 || 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground w-8 text-right">
                      {company.vinculacion_entidad_1 || 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center py-2">
              No tens empreses assignades
            </div>
          )}

          {totalCount > 5 && (
            <p className="text-xs text-center text-muted-foreground">
              + {totalCount - 5} empreses més al mapa
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
