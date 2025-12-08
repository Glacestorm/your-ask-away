import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyWithDetails, StatusColor } from '@/types/database';
import { 
  BarChart3, 
  X, 
  Building2, 
  MapPin, 
  TrendingUp, 
  Users,
  PieChart,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapStatisticsPanelProps {
  companies: CompanyWithDetails[];
  filteredCompanies: CompanyWithDetails[];
  statusColors: StatusColor[];
  isVisible: boolean;
  onClose: () => void;
}

export function MapStatisticsPanel({
  companies,
  filteredCompanies,
  statusColors,
  isVisible,
  onClose,
}: MapStatisticsPanelProps) {

  const stats = useMemo(() => {
    const filtered = filteredCompanies;
    
    // Status distribution
    const statusDistribution = statusColors.map(status => ({
      ...status,
      count: filtered.filter(c => c.status_id === status.id).length,
    })).filter(s => s.count > 0).sort((a, b) => b.count - a.count);

    // Parish distribution
    const parishMap = new Map<string, number>();
    filtered.forEach(c => {
      if (c.parroquia) {
        parishMap.set(c.parroquia, (parishMap.get(c.parroquia) || 0) + 1);
      }
    });
    const parishDistribution = Array.from(parishMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Sector distribution
    const sectorMap = new Map<string, number>();
    filtered.forEach(c => {
      if (c.sector) {
        sectorMap.set(c.sector, (sectorMap.get(c.sector) || 0) + 1);
      }
    });
    const sectorDistribution = Array.from(sectorMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Vinculacion stats
    const withVinculacion = filtered.filter(c => 
      c.vinculacion_entidad_1 != null || c.vinculacion_entidad_2 != null || c.vinculacion_entidad_3 != null
    );
    const avgVinculacion = withVinculacion.length > 0
      ? withVinculacion.reduce((sum, c) => {
          const v1 = c.vinculacion_entidad_1 || 0;
          const v2 = c.vinculacion_entidad_2 || 0;
          const v3 = c.vinculacion_entidad_3 || 0;
          return sum + (v1 + v2 + v3) / 3;
        }, 0) / withVinculacion.length
      : 0;

    // Financial stats
    const withFacturacion = filtered.filter(c => c.turnover && c.turnover > 0);
    const totalFacturacion = withFacturacion.reduce((sum, c) => sum + (c.turnover || 0), 0);
    const avgFacturacion = withFacturacion.length > 0 ? totalFacturacion / withFacturacion.length : 0;

    // Client type distribution
    const clientTypeMap = new Map<string, number>();
    filtered.forEach(c => {
      const type = c.client_type || 'sense_tipus';
      clientTypeMap.set(type, (clientTypeMap.get(type) || 0) + 1);
    });
    const clientTypeDistribution = Array.from(clientTypeMap.entries())
      .map(([type, count]) => ({ 
        type, 
        label: type === 'cliente' ? 'Client' : type === 'potencial_cliente' ? 'Potencial' : 'Sense tipus',
        count 
      }))
      .sort((a, b) => b.count - a.count);

    // Geolocation coverage
    const withGeo = filtered.filter(c => c.latitude && c.longitude).length;
    const geoPercentage = filtered.length > 0 ? (withGeo / filtered.length) * 100 : 0;

    return {
      total: filtered.length,
      totalAll: companies.length,
      statusDistribution,
      parishDistribution,
      sectorDistribution,
      avgVinculacion,
      totalFacturacion,
      avgFacturacion,
      clientTypeDistribution,
      withGeo,
      geoPercentage,
    };
  }, [filteredCompanies, companies, statusColors]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M€`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k€`;
    return `${value.toFixed(0)}€`;
  };

  if (!isVisible) return null;

  return (
    <div className="absolute left-4 bottom-24 z-10">
      <Card className="w-80 shadow-lg bg-card/95 backdrop-blur-sm">
        <div className="border-b p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Estadístiques del Mapa</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 m-2 mb-0" style={{ width: 'calc(100% - 16px)' }}>
              <TabsTrigger value="overview" className="text-xs">Resum</TabsTrigger>
              <TabsTrigger value="distribution" className="text-xs">Distribució</TabsTrigger>
              <TabsTrigger value="financial" className="text-xs">Financer</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[350px]">
              <TabsContent value="overview" className="p-3 pt-2 space-y-3 mt-0">
                {/* Key metrics */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/30 rounded-lg p-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <Building2 className="h-3.5 w-3.5" />
                      <span className="text-xs">Empreses</span>
                    </div>
                    <div className="text-lg font-bold">{stats.total}</div>
                    <div className="text-xs text-muted-foreground">de {stats.totalAll} total</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="text-xs">Geolocalitzades</span>
                    </div>
                    <div className="text-lg font-bold">{stats.withGeo}</div>
                    <Progress value={stats.geoPercentage} className="h-1 mt-1" />
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span className="text-xs">Vinculació Mitja</span>
                    </div>
                    <div className="text-lg font-bold">{stats.avgVinculacion.toFixed(1)}%</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <Activity className="h-3.5 w-3.5" />
                      <span className="text-xs">Fact. Mitja</span>
                    </div>
                    <div className="text-lg font-bold">{formatCurrency(stats.avgFacturacion)}</div>
                  </div>
                </div>

                {/* Client type */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Tipus de Client
                  </h4>
                  {stats.clientTypeDistribution.map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <span className="text-sm">{item.label}</span>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="distribution" className="p-3 pt-2 space-y-4 mt-0">
                {/* Status distribution */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Per Estat
                  </h4>
                  {stats.statusDistribution.slice(0, 6).map((status) => (
                    <div key={status.id} className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: status.color_hex }}
                      />
                      <span className="text-xs flex-1 truncate">{status.status_name}</span>
                      <Badge variant="outline" className="font-mono text-xs h-5">
                        {status.count}
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Parish distribution */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Per Parròquia
                  </h4>
                  {stats.parishDistribution.slice(0, 7).map((parish) => {
                    const percentage = (parish.count / stats.total) * 100;
                    return (
                      <div key={parish.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="truncate max-w-[150px]">{parish.name}</span>
                          <span className="text-muted-foreground font-mono">{parish.count}</span>
                        </div>
                        <Progress value={percentage} className="h-1" />
                      </div>
                    );
                  })}
                </div>

                {/* Sector distribution */}
                {stats.sectorDistribution.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Per Sector
                    </h4>
                    {stats.sectorDistribution.slice(0, 5).map((sector) => (
                      <div key={sector.name} className="flex items-center justify-between">
                        <span className="text-xs truncate max-w-[180px]">{sector.name}</span>
                        <Badge variant="outline" className="font-mono text-xs h-5">
                          {sector.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="financial" className="p-3 pt-2 space-y-4 mt-0">
                {/* Total Facturacion */}
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Facturació Total Visible</div>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(stats.totalFacturacion)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stats.total} empreses visibles
                  </div>
                </div>

                {/* Vinculacion breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Distribució Vinculació
                  </h4>
                  {[
                    { label: 'Alta (>80%)', min: 80, max: 100, color: 'hsl(142, 70%, 40%)' },
                    { label: 'Mitjana-Alta (60-80%)', min: 60, max: 80, color: 'hsl(90, 60%, 45%)' },
                    { label: 'Mitjana (40-60%)', min: 40, max: 60, color: 'hsl(45, 85%, 50%)' },
                    { label: 'Baixa-Mitjana (20-40%)', min: 20, max: 40, color: 'hsl(25, 80%, 55%)' },
                    { label: 'Baixa (<20%)', min: 0, max: 20, color: 'hsl(0, 70%, 50%)' },
                  ].map((range) => {
                    const count = filteredCompanies.filter(c => {
                      const avg = ((c.vinculacion_entidad_1 || 0) + (c.vinculacion_entidad_2 || 0) + (c.vinculacion_entidad_3 || 0)) / 3;
                      return avg >= range.min && avg < range.max;
                    }).length;
                    const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                    
                    return (
                      <div key={range.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: range.color }}
                            />
                            <span>{range.label}</span>
                          </div>
                          <span className="text-muted-foreground font-mono">{count}</span>
                        </div>
                        <Progress value={percentage} className="h-1" />
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </Card>
    </div>
  );
}
