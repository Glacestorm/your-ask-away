import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  TrendingUp, 
  Shield, 
  Clock,
  RefreshCw,
  Euro,
  Target,
  CheckCircle2,
  XCircle,
  BarChart3,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useNextBestAction } from '@/hooks/useNextBestAction';
import { NBAActionCard } from './NBAActionCard';
import { NBAImpactTracker } from './NBAImpactTracker';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function NBADashboard() {
  const {
    actionTypes,
    nbaQueue,
    stats,
    isLoading,
    isExecuting,
    executeNBA,
    dismissNBA,
    generateNBAs,
    refetchQueue,
    // KB 2.0
    isError,
    error,
    lastRefresh,
    clearError,
  } = useNextBestAction();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeEffort, setActiveEffort] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateNBAs();
      await refetchQueue();
    } finally {
      setIsGenerating(false);
    }
  };

  // Filtrar por categoría y esfuerzo
  const filteredQueue = nbaQueue?.filter(item => {
    const categoryMatch = activeCategory === 'all' || item.action_type?.action_category === activeCategory;
    const effortMatch = activeEffort === 'all' || item.action_type?.effort_level === activeEffort;
    return categoryMatch && effortMatch;
  });

  const categories = [
    { id: 'all', label: 'Tots', icon: BarChart3, color: 'text-foreground' },
    { id: 'revenue', label: 'Ingressos', icon: Euro, color: 'text-green-500' },
    { id: 'retention', label: 'Retenció', icon: Target, color: 'text-blue-500' },
    { id: 'compliance', label: 'Compliance', icon: Shield, color: 'text-amber-500' },
    { id: 'efficiency', label: 'Eficiència', icon: Zap, color: 'text-purple-500' },
  ];

  const effortLevels = [
    { id: 'all', label: 'Tots', color: 'text-foreground' },
    { id: 'low', label: 'Fàcil', color: 'text-green-500' },
    { id: 'medium', label: 'Mitjà', color: 'text-amber-500' },
    { id: 'high', label: 'Complex', color: 'text-red-500' },
  ];

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error State */}
      {isError && error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{error.message}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={clearError}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Refresh Indicator */}
      {lastRefresh && (
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            Actualitzat {formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}
          </span>
          <Button variant="ghost" size="sm" onClick={() => refetchQueue()} className="h-6 px-2">
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                <p className="text-xs text-muted-foreground">Pendents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.completed || 0}</p>
                <p className="text-xs text-muted-foreground">Completades</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-muted/50 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.dismissed || 0}</p>
                <p className="text-xs text-muted-foreground">Descartades</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-600/20">
                <Euro className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {((stats?.totalEstimatedValue || 0) / 1000).toFixed(1)}k€
                </p>
                <p className="text-xs text-muted-foreground">Valor Estimat</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {((stats?.totalActualValue || 0) / 1000).toFixed(1)}k€
                </p>
                <p className="text-xs text-muted-foreground">Valor Real</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Impact Tracker */}
      <NBAImpactTracker stats={stats} />

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Next Best Actions
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex bg-muted rounded-lg p-1">
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={activeCategory === cat.id ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveCategory(cat.id)}
                    className="gap-1"
                  >
                    <cat.icon className={`h-4 w-4 ${cat.color}`} />
                    <span className="hidden md:inline">{cat.label}</span>
                    {cat.id !== 'all' && stats?.byCategory?.[cat.id] && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {stats.byCategory[cat.id]}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
              {/* Effort Filter */}
              <div className="flex bg-muted/50 rounded-lg p-1">
                {effortLevels.map((effort) => (
                  <Button
                    key={effort.id}
                    variant={activeEffort === effort.id ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveEffort(effort.id)}
                    className="text-xs"
                  >
                    <span className={effort.color}>{effort.label}</span>
                  </Button>
                ))}
              </div>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generant...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Generar NBAs
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            {!filteredQueue || filteredQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Zap className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  No hi ha accions pendents
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Fes clic a "Generar NBAs" per obtenir recomanacions
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQueue.map((item) => (
                  <NBAActionCard
                    key={item.id}
                    item={item}
                    onExecute={executeNBA}
                    onDismiss={dismissNBA}
                    isExecuting={isExecuting}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
