import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Sparkles,
  Download,
  Brain,
  Activity,
  Calculator,
  Lightbulb
} from 'lucide-react';
import { useNextBestAction } from '@/hooks/useNextBestAction';
import { NBAActionCard } from './NBAActionCard';
import { NBAImpactTracker } from './NBAImpactTracker';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

// Colores para gráficos
const COLORS = ['#8b5cf6', '#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#06b6d4'];

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
  const [activeTab, setActiveTab] = useState('queue');

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

  // Datos para gráficos
  const categoryDistribution = useMemo(() => {
    if (!stats?.byCategory) return [];
    return Object.entries(stats.byCategory).map(([category, count]) => ({
      name: category === 'revenue' ? 'Ingressos' : 
            category === 'retention' ? 'Retenció' : 
            category === 'compliance' ? 'Compliance' : 
            category === 'efficiency' ? 'Eficiència' : category,
      value: count as number,
      category
    }));
  }, [stats?.byCategory]);

  const effortDistribution = useMemo(() => {
    if (!nbaQueue) return [];
    const counts = { low: 0, medium: 0, high: 0 };
    nbaQueue.forEach(item => {
      const effort = item.action_type?.effort_level as keyof typeof counts;
      if (effort && counts[effort] !== undefined) counts[effort]++;
    });
    return [
      { name: 'Fàcil', value: counts.low, color: '#22c55e' },
      { name: 'Mitjà', value: counts.medium, color: '#f59e0b' },
      { name: 'Complex', value: counts.high, color: '#ef4444' }
    ];
  }, [nbaQueue]);

  const valueByCategory = useMemo(() => {
    if (!nbaQueue) return [];
    const values: Record<string, number> = {};
    nbaQueue.forEach(item => {
      const cat = item.action_type?.action_category || 'other';
      values[cat] = (values[cat] || 0) + (item.estimated_value || 0);
    });
    return Object.entries(values).map(([cat, val]) => ({
      category: cat === 'revenue' ? 'Ingressos' : 
                cat === 'retention' ? 'Retenció' : 
                cat === 'compliance' ? 'Compliance' : 
                cat === 'efficiency' ? 'Eficiència' : cat,
      valor: val / 1000
    }));
  }, [nbaQueue]);

  // Exportar PDF
  const handleExportPDF = useCallback(() => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Next Best Actions Report', 20, 25);
    doc.setFontSize(10);
    doc.text(format(new Date(), 'dd/MM/yyyy HH:mm'), pageWidth - 50, 25);

    // Stats
    doc.setTextColor(0, 0, 0);
    let y = 55;
    doc.setFontSize(14);
    doc.text('Resum Executiu', 20, y);
    y += 10;

    doc.setFontSize(11);
    const statsData = [
      ['Accions Pendents', String(stats?.pending || 0)],
      ['Accions Completades', String(stats?.completed || 0)],
      ['Accions Descartades', String(stats?.dismissed || 0)],
      ['Valor Estimat Total', `${((stats?.totalEstimatedValue || 0) / 1000).toFixed(1)}k€`],
      ['Valor Real Generat', `${((stats?.totalActualValue || 0) / 1000).toFixed(1)}k€`],
      ['Taxa Acceptació', `${stats?.completed && stats?.pending ? Math.round((stats.completed / (stats.completed + stats.pending)) * 100) : 0}%`]
    ];

    statsData.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 25, y);
      y += 7;
    });

    // Category breakdown
    y += 10;
    doc.setFontSize(14);
    doc.text('Distribució per Categoria', 20, y);
    y += 10;

    doc.setFontSize(10);
    categoryDistribution.forEach(cat => {
      doc.text(`• ${cat.name}: ${cat.value} accions`, 25, y);
      y += 6;
    });

    // Top pending actions
    if (filteredQueue && filteredQueue.length > 0) {
      y += 10;
      doc.setFontSize(14);
      doc.text('Top 10 Accions Pendents', 20, y);
      y += 10;

      doc.setFontSize(9);
      filteredQueue.slice(0, 10).forEach((item, idx) => {
        const text = `${idx + 1}. ${item.action_type?.action_name || 'Acció'} - ${((item.estimated_value || 0) / 1000).toFixed(1)}k€`;
        doc.text(text, 25, y);
        y += 6;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
    }

    doc.save(`NBA_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
    toast.success('Report NBA exportat correctament');
  }, [stats, categoryDistribution, filteredQueue]);

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

  // Métricas de rendimiento
  const performanceMetrics = useMemo(() => {
    const total = (stats?.completed || 0) + (stats?.dismissed || 0);
    return {
      acceptanceRate: total > 0 ? Math.round(((stats?.completed || 0) / total) * 100) : 0,
      avgValuePerAction: stats?.completed ? Math.round((stats?.totalActualValue || 0) / stats.completed) : 0,
      conversionRate: stats?.totalEstimatedValue ? Math.round(((stats?.totalActualValue || 0) / stats.totalEstimatedValue) * 100) : 0
    };
  }, [stats]);

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
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>
              Actualitzat {formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}
            </span>
            <Button variant="ghost" size="sm" onClick={() => refetchQueue()} className="h-6 px-2">
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
            <Download className="h-3 w-3" />
            Exportar PDF
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

      {/* Main Content with Tabs */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Next Best Actions
            </CardTitle>
            <div className="flex items-center gap-2">
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="queue" className="gap-2">
                <Clock className="h-4 w-4" />
                Cua d'Accions
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-2">
                <Lightbulb className="h-4 w-4" />
                Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="queue">
              {/* Category and Effort Filters */}
              <div className="flex flex-wrap gap-2 mb-4">
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
              </div>

              <ScrollArea className="h-[400px] pr-4">
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
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Distribución por categoría */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Distribució per Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {categoryDistribution.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Distribución por esfuerzo */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4 text-amber-500" />
                      Distribució per Esforç
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={effortDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {effortDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Valor por categoría */}
                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Euro className="h-4 w-4 text-green-500" />
                      Valor Estimat per Categoria (k€)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={valueByCategory}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="category" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip 
                            formatter={(value: number) => [`${value.toFixed(1)}k€`, 'Valor']}
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                          />
                          <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="insights">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Performance Metrics */}
                <Card className="bg-gradient-to-br from-violet-500/10 to-transparent">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-violet-500/20">
                        <Brain className="h-5 w-5 text-violet-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{performanceMetrics.acceptanceRate}%</p>
                        <p className="text-xs text-muted-foreground">Taxa Acceptació</p>
                      </div>
                    </div>
                    <Progress value={performanceMetrics.acceptanceRate} className="h-2" />
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-cyan-500/10 to-transparent">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-cyan-500/20">
                        <Calculator className="h-5 w-5 text-cyan-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{(performanceMetrics.avgValuePerAction / 1000).toFixed(1)}k€</p>
                        <p className="text-xs text-muted-foreground">Valor Mitjà/Acció</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-emerald-500/20">
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{performanceMetrics.conversionRate}%</p>
                        <p className="text-xs text-muted-foreground">Conversió Valor</p>
                      </div>
                    </div>
                    <Progress value={performanceMetrics.conversionRate} className="h-2" />
                  </CardContent>
                </Card>
              </div>

              {/* AI Insights */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Insights Intel·ligents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {performanceMetrics.acceptanceRate < 50 && (
                      <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Taxa d'acceptació baixa</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Considera revisar els criteris de generació d'NBAs per millorar la rellevància de les recomanacions.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {(stats?.pending || 0) > 20 && (
                      <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/10">
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Moltes accions pendents</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Hi ha {stats?.pending} accions pendents. Considera prioritzar les d'alt valor per maximitzar l'impacte.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {performanceMetrics.conversionRate > 80 && (
                      <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/10">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Excel·lent conversió de valor</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Les accions executades estan generant el {performanceMetrics.conversionRate}% del valor estimat. Continua així!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {categoryDistribution.length > 0 && (
                      <div className="p-3 rounded-lg border border-violet-500/30 bg-violet-500/10">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="h-5 w-5 text-violet-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Focus recomanat</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              La categoria amb més accions pendents és "{categoryDistribution[0]?.name}". Considera prioritzar-la.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
