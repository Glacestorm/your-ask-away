/**
 * ModuleMarketplacePanel - Catálogo de módulos con ratings, reviews e instalación
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Store,
  Download,
  Star,
  Search,
  Filter,
  Upload,
  Package,
  TrendingUp,
  Users,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useModuleMarketplace, MarketplaceModule, ModuleReview } from '@/hooks/admin/useModuleMarketplace';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ModuleMarketplacePanelProps {
  onInstall?: (moduleKey: string) => void;
  className?: string;
}

export function ModuleMarketplacePanel({ 
  onInstall,
  className 
}: ModuleMarketplacePanelProps) {
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<MarketplaceModule | null>(null);

  const {
    isLoading,
    modules,
    installedModules,
    error,
    lastRefresh,
    fetchModules,
    installModule,
    uninstallModule,
    publishModule,
    fetchReviews,
    startAutoRefresh,
    stopAutoRefresh
  } = useModuleMarketplace();

  useEffect(() => {
    startAutoRefresh(120000);
    return () => stopAutoRefresh();
  }, [startAutoRefresh, stopAutoRefresh]);

  const handleInstall = async (moduleKey: string) => {
    const result = await installModule(moduleKey);
    if (result) {
      onInstall?.(moduleKey);
    }
  };

  const handleViewDetails = async (mod: MarketplaceModule) => {
    setSelectedModule(mod);
    await fetchReviews(mod.id);
  };

  const filteredModules = modules.filter(mod => {
    const matchesSearch = !searchQuery || 
      mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || mod.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(modules.map(m => m.category).filter(Boolean))];

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star 
          key={i} 
          className={cn(
            "h-3 w-3",
            i <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
          )} 
        />
      ))}
    </div>
  );

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Module Marketplace</CardTitle>
              <CardDescription className="text-xs">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Sincronizando...'
                }
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => fetchModules()}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="discover" className="text-xs gap-1">
              <Search className="h-3 w-3" /> Descubrir
            </TabsTrigger>
            <TabsTrigger value="installed" className="text-xs gap-1">
              <Download className="h-3 w-3" /> Instalados
            </TabsTrigger>
            <TabsTrigger value="publish" className="text-xs gap-1">
              <Upload className="h-3 w-3" /> Publicar
            </TabsTrigger>
            <TabsTrigger value="trending" className="text-xs gap-1">
              <TrendingUp className="h-3 w-3" /> Trending
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="mt-0 space-y-3">
            {/* Search & Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar módulos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Categories */}
            <div className="flex gap-2 flex-wrap">
              <Badge 
                variant={!selectedCategory ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(null)}
              >
                Todos
              </Badge>
              {categories.map(cat => (
                <Badge 
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>

            {/* Module Grid */}
            <ScrollArea className="h-[400px]">
              {error ? (
                <div className="text-center py-8 text-destructive text-sm">{error}</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredModules.map(mod => {
                    const isInstalled = installedModules.includes(mod.key);
                    return (
                      <div 
                        key={mod.id}
                        className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleViewDetails(mod)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">{mod.name}</h4>
                              <p className="text-xs text-muted-foreground">{mod.author}</p>
                            </div>
                          </div>
                          {isInstalled && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" /> Instalado
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {mod.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {renderStars(mod.rating)}
                            <span className="text-xs text-muted-foreground">
                              ({mod.reviewCount})
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Download className="h-3 w-3" />
                            {mod.downloads}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Badge variant="outline" className="text-xs">
                            v{mod.version}
                          </Badge>
                          {mod.price === 0 ? (
                            <Badge variant="secondary" className="text-xs">Gratis</Badge>
                          ) : (
                            <Badge className="text-xs">{mod.price}€</Badge>
                          )}
                        </div>
                        {!isInstalled && (
                          <Button 
                            size="sm" 
                            className="w-full mt-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInstall(mod.key);
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Instalar
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="installed" className="mt-0">
            <ScrollArea className="h-[450px]">
              <div className="space-y-2">
                {modules.filter(m => installedModules.includes(m.key)).map(mod => (
                  <div 
                    key={mod.id}
                    className="p-3 rounded-lg border bg-card flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                        <Package className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{mod.name}</h4>
                        <p className="text-xs text-muted-foreground">v{mod.version}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => uninstallModule(mod.key)}
                    >
                      Desinstalar
                    </Button>
                  </div>
                ))}
                {installedModules.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Download className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm">No hay módulos instalados</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="publish" className="mt-0">
            <div className="text-center py-12">
              <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="font-medium mb-2">Publicar un Módulo</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                Comparte tu módulo con la comunidad. Asegúrate de incluir documentación y tests.
              </p>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Subir Módulo
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="trending" className="mt-0">
            <ScrollArea className="h-[450px]">
              <div className="space-y-2">
                {modules
                  .sort((a, b) => b.downloads - a.downloads)
                  .slice(0, 10)
                  .map((mod, idx) => (
                    <div 
                      key={mod.id}
                      className="p-3 rounded-lg border bg-card flex items-center gap-3"
                    >
                      <span className="text-2xl font-bold text-muted-foreground/50 w-8">
                        #{idx + 1}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{mod.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(mod.rating)}
                          <span className="text-xs text-muted-foreground">
                            {mod.downloads} descargas
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline">
                        <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                        +{Math.floor(mod.downloads * 0.1)}
                      </Badge>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ModuleMarketplacePanel;
