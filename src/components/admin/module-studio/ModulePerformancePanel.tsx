import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  RefreshCw,
  Database,
  HardDrive,
  Trash2,
  Settings,
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';
import { useModulePerformance, PerformanceMetrics, LazyLoadConfig } from '@/hooks/admin/useModulePerformance';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ModulePerformancePanelProps {
  className?: string;
}

export function ModulePerformancePanel({ className }: ModulePerformancePanelProps) {
  const [activeTab, setActiveTab] = useState('metrics');
  const [optimizing, setOptimizing] = useState<string | null>(null);

  const {
    metrics,
    cacheEntries,
    lazyLoadConfigs,
    isLoading,
    aggregateStats,
    fetchMetrics,
    invalidateCache,
    updateLazyLoadConfig,
    optimizeModule
  } = useModulePerformance();

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getMetricColor = (value: number, thresholds: { good: number; warn: number }) => {
    if (value <= thresholds.good) return 'text-green-500';
    if (value <= thresholds.warn) return 'text-yellow-500';
    return 'text-destructive';
  };

  const handleOptimize = async (moduleKey: string) => {
    setOptimizing(moduleKey);
    try {
      const recommendations = await optimizeModule(moduleKey);
      console.log('Recommendations:', recommendations);
    } finally {
      setOptimizing(null);
    }
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Optimización de Performance</CardTitle>
              <p className="text-xs text-muted-foreground">
                Lazy loading, caché y métricas de velocidad
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => fetchMetrics()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Stats agregados */}
        {aggregateStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <div className="p-2 rounded-lg bg-muted/50 border text-center">
              <Clock className="h-4 w-4 mx-auto text-blue-500 mb-1" />
              <p className="text-lg font-bold">{aggregateStats.avgLoadTime}ms</p>
              <p className="text-[10px] text-muted-foreground">Carga promedio</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 border text-center">
              <HardDrive className="h-4 w-4 mx-auto text-purple-500 mb-1" />
              <p className="text-lg font-bold">{formatBytes(aggregateStats.totalBundleSize)}</p>
              <p className="text-[10px] text-muted-foreground">Bundle total</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 border text-center">
              <Database className="h-4 w-4 mx-auto text-green-500 mb-1" />
              <p className="text-lg font-bold">{aggregateStats.avgCacheHitRate}%</p>
              <p className="text-[10px] text-muted-foreground">Cache hit rate</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 border text-center">
              <TrendingUp className="h-4 w-4 mx-auto text-orange-500 mb-1" />
              <p className="text-lg font-bold">{aggregateStats.avgMemoryUsage}%</p>
              <p className="text-[10px] text-muted-foreground">Memoria</p>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="metrics" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Métricas
            </TabsTrigger>
            <TabsTrigger value="cache" className="text-xs">
              <Database className="h-3 w-3 mr-1" />
              Caché
            </TabsTrigger>
            <TabsTrigger value="lazyload" className="text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Lazy Load
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="mt-0">
            <ScrollArea className="h-[280px]">
              <div className="space-y-3">
                {metrics.map((m) => (
                  <div key={m.moduleKey} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-sm">{m.moduleKey}</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleOptimize(m.moduleKey)}
                        disabled={optimizing === m.moduleKey}
                      >
                        {optimizing === m.moduleKey ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 mr-1" />
                            Optimizar
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Tiempo de carga</p>
                        <p className={cn("font-medium", getMetricColor(m.loadTime, { good: 300, warn: 500 }))}>
                          {m.loadTime}ms
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tiempo de render</p>
                        <p className={cn("font-medium", getMetricColor(m.renderTime, { good: 100, warn: 200 }))}>
                          {m.renderTime}ms
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Bundle size</p>
                        <p className="font-medium">{formatBytes(m.bundleSize)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cache hit rate</p>
                        <p className={cn("font-medium", m.cacheHitRate >= 80 ? 'text-green-500' : 'text-yellow-500')}>
                          {m.cacheHitRate}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Memoria</span>
                        <span>{m.memoryUsage}%</span>
                      </div>
                      <Progress value={m.memoryUsage} className="h-1" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="cache" className="mt-0">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-muted-foreground">
                {cacheEntries.length} entradas • {formatBytes(aggregateStats?.totalCacheSize || 0)}
              </p>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => invalidateCache()}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpiar todo
              </Button>
            </div>
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {cacheEntries.map((entry) => (
                  <div key={entry.key} className="p-2 rounded-lg border bg-card text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs truncate">{entry.key}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>{formatBytes(entry.size)}</span>
                          <span>{entry.hits} hits</span>
                        </div>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6"
                        onClick={() => invalidateCache(entry.key)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="lazyload" className="mt-0">
            <ScrollArea className="h-[280px]">
              <div className="space-y-3">
                {lazyLoadConfigs.map((config) => (
                  <div key={config.moduleKey} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-sm">{config.moduleKey}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Habilitado</span>
                        <Switch 
                          checked={config.enabled}
                          onCheckedChange={(checked) => 
                            updateLazyLoadConfig(config.moduleKey, { enabled: checked })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Preload on hover</span>
                        <Switch 
                          checked={config.preloadOnHover}
                          onCheckedChange={(checked) => 
                            updateLazyLoadConfig(config.moduleKey, { preloadOnHover: checked })
                          }
                          disabled={!config.enabled}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Prioridad</span>
                        <Badge variant={
                          config.priority === 'high' ? 'default' :
                          config.priority === 'auto' ? 'secondary' : 'outline'
                        }>
                          {config.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Prefetch distance</span>
                        <span>{config.prefetchDistance} pantallas</span>
                      </div>
                    </div>
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

export default ModulePerformancePanel;
