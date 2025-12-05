import { useNavigate } from 'react-router-dom';
import { Map, Building2, MapPin, TrendingUp, ExternalLink } from 'lucide-react';
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
}

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
        .select('id, name, parroquia, vinculacion_entidad_1')
        .eq('gestor_id', user.id)
        .order('vinculacion_entidad_1', { ascending: false, nullsFirst: false })
        .limit(5);

      setCompanies(data || []);
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
                    <MapPin className="h-3 w-3 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs truncate group-hover:text-primary transition-colors">{company.name}</span>
                      {company.parroquia && (
                        <span className="text-[10px] text-muted-foreground truncate">{company.parroquia}</span>
                      )}
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
