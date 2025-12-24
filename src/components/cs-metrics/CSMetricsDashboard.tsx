import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  LayoutGrid, 
  List, 
  BookOpen,
  Calculator,
  Heart,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Zap,
  Sparkles
} from 'lucide-react';
import { useCSMetricsKnowledge } from '@/hooks/useCSMetricsKnowledge';
import { MetricCategory } from '@/types/cs-metrics';
import { MetricCard } from './MetricCard';
import { MetricCalculator } from './MetricCalculator';
import { CSHealthSummary } from './CSHealthSummary';
import { cn } from '@/lib/utils';

const CATEGORY_CONFIG: Record<MetricCategory, { label: string; icon: React.ReactNode; color: string }> = {
  perception: { 
    label: 'Percepción', 
    icon: <Heart className="h-4 w-4" />, 
    color: 'from-blue-500/20 to-blue-600/10' 
  },
  retention: { 
    label: 'Retención', 
    icon: <Target className="h-4 w-4" />, 
    color: 'from-green-500/20 to-green-600/10' 
  },
  value: { 
    label: 'Valor', 
    icon: <DollarSign className="h-4 w-4" />, 
    color: 'from-amber-500/20 to-amber-600/10' 
  },
  engagement: { 
    label: 'Engagement', 
    icon: <Zap className="h-4 w-4" />, 
    color: 'from-purple-500/20 to-purple-600/10' 
  },
  growth: { 
    label: 'Crecimiento', 
    icon: <TrendingUp className="h-4 w-4" />, 
    color: 'from-pink-500/20 to-pink-600/10' 
  },
  health: { 
    label: 'Salud', 
    icon: <Users className="h-4 w-4" />, 
    color: 'from-cyan-500/20 to-cyan-600/10' 
  }
};

export function CSMetricsDashboard() {
  const { allMetrics, searchMetrics, getMetricsByCategory } = useCSMetricsKnowledge();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MetricCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('metrics');

  const filteredMetrics = useMemo(() => {
    let metrics = selectedCategory === 'all' 
      ? allMetrics 
      : getMetricsByCategory(selectedCategory);
    
    if (searchQuery.trim()) {
      metrics = searchMetrics(searchQuery);
      if (selectedCategory !== 'all') {
        metrics = metrics.filter(m => m.category === selectedCategory);
      }
    }
    
    return metrics;
  }, [allMetrics, selectedCategory, searchQuery, searchMetrics, getMetricsByCategory]);

  const categoryStats = useMemo(() => {
    return (Object.keys(CATEGORY_CONFIG) as MetricCategory[]).map(cat => ({
      category: cat,
      count: allMetrics.filter(m => m.category === cat).length,
      ...CATEGORY_CONFIG[cat]
    }));
  }, [allMetrics]);

  // Mock data for demonstration
  const mockSparklineData = [65, 70, 68, 72, 75, 73, 78, 80, 77, 82];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            CS Metrics Knowledge Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Base de conocimiento completa de métricas Customer Success
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {allMetrics.length} métricas
          </Badge>
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
            <Sparkles className="h-3 w-3 mr-1" />
            Incluye 2025
          </Badge>
        </div>
      </div>

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="metrics" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Métricas</span>
          </TabsTrigger>
          <TabsTrigger value="calculator" className="gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Calculadora</span>
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-2">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Health Score</span>
          </TabsTrigger>
        </TabsList>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar métricas por nombre, descripción o tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Category filters */}
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="shrink-0"
              >
                Todas ({allMetrics.length})
              </Button>
              {categoryStats.map((cat) => (
                <Button
                  key={cat.category}
                  variant={selectedCategory === cat.category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.category)}
                  className="shrink-0 gap-1.5"
                >
                  {cat.icon}
                  {cat.label} ({cat.count})
                </Button>
              ))}
            </div>
          </ScrollArea>

          {/* Metrics grid/list */}
          {filteredMetrics.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                No se encontraron métricas para "{searchQuery}"
              </p>
            </div>
          ) : (
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "flex flex-col gap-3"
            )}>
              {filteredMetrics.map((metric) => (
                <MetricCard
                  key={metric.id}
                  metric={metric}
                  value={Math.random() * 100}
                  previousValue={Math.random() * 100}
                  trend={['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable'}
                  trendPercentage={(Math.random() - 0.5) * 20}
                  benchmarkPosition={['below', 'average', 'above', 'top_quartile'][Math.floor(Math.random() * 4)] as any}
                  riskLevel={['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any}
                  sparklineData={mockSparklineData}
                  className={viewMode === 'list' ? 'w-full' : ''}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Calculator Tab */}
        <TabsContent value="calculator">
          <div className="grid lg:grid-cols-2 gap-6">
            <MetricCalculator />
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Cómo usar la calculadora
                </h3>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Selecciona la métrica que deseas calcular</li>
                  <li>Ingresa los valores requeridos en cada campo</li>
                  <li>Haz clic en "Calcular" para ver el resultado</li>
                  <li>Revisa la interpretación y las recomendaciones</li>
                </ol>
              </div>
              <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg p-4 border border-primary/20">
                <h3 className="font-semibold mb-2">💡 Consejo Pro</h3>
                <p className="text-sm text-muted-foreground">
                  Para obtener métricas precisas, asegúrate de usar datos del mismo período de tiempo
                  y mantener consistencia en las definiciones (por ejemplo, qué cuenta como "cliente activo").
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Health Score Tab */}
        <TabsContent value="health">
          <div className="grid lg:grid-cols-2 gap-6">
            <CSHealthSummary />
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                <h3 className="font-semibold mb-3">Sobre el Health Score Compuesto</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  El Health Score es una métrica compuesta que combina múltiples indicadores
                  para proporcionar una visión holística de la salud de tus clientes.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>NPS (Lealtad)</span>
                    <Badge variant="outline">20%</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>CSAT (Satisfacción)</span>
                    <Badge variant="outline">15%</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>CES (Esfuerzo)</span>
                    <Badge variant="outline">15%</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Retención</span>
                    <Badge variant="outline">20%</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>NRR (Ingresos)</span>
                    <Badge variant="outline">20%</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Engagement</span>
                    <Badge variant="outline">10%</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-lg p-4 border border-green-500/20">
                <h3 className="font-semibold mb-2 text-green-600">Rangos de Salud</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>70-100: Saludable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>40-69: En Riesgo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>0-39: Crítico</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CSMetricsDashboard;
