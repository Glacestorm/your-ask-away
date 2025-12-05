import { useNavigate } from 'react-router-dom';
import { Map, Building2, MapPin, TrendingUp, ExternalLink, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

interface MapButtonProps {
  onNavigateToMap?: () => void;
}

export function MapButton({ onNavigateToMap }: MapButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyPreview[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

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

      // Get top 5 companies by vinculacion
      const { data } = await supabase
        .from('companies')
        .select('id, name, parroquia, vinculacion_entidad_1, sector, cnae, fecha_ultima_visita')
        .eq('gestor_id', user.id)
        .order('vinculacion_entidad_1', { ascending: false, nullsFirst: false })
        .limit(5);

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

          {/* Companies preview */}
          {loading ? (
            <div className="text-xs text-muted-foreground text-center py-2">
              Carregant...
            </div>
          ) : companies.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Top empreses per vinculació:</p>
              {companies.map((company) => (
                <button 
                  key={company.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin?section=map&company=${company.id}`);
                  }}
                  className="w-full flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/50 hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
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
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs truncate group-hover:text-primary transition-colors">{company.name}</span>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        {(company.sector || company.cnae) && (
                          <span className="truncate max-w-[80px]">{company.sector || company.cnae}</span>
                        )}
                        {(company.sector || company.cnae) && company.parroquia && <span>·</span>}
                        {company.parroquia && (
                          <span className="truncate">{company.parroquia}</span>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 text-[10px] ${getDateColorClass(company.fecha_ultima_visita)}`}>
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
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {company.vinculacion_entidad_1 !== null && (
                      <span className="text-xs font-medium text-primary">
                        {company.vinculacion_entidad_1}%
                      </span>
                    )}
                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
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
