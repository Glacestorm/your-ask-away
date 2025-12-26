/**
 * CopilotSectorIntel - Inteligencia del Sector 2026
 * Tendencias de mercado, benchmarks, regulaciones y competencia por CNAE
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Building2,
  Scale,
  Newspaper,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Sparkles,
  Shield,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { SectorContext } from '@/hooks/useRoleCopilot2026';

interface CopilotSectorIntelProps {
  sector?: string;
  cnae?: string;
  sectorContext?: SectorContext;
  onRefresh?: () => void;
  isLoading?: boolean;
}

// Mock market trends data
const MARKET_TRENDS = [
  { month: 'Ago', sector: 85, youValue: 82, market: 78 },
  { month: 'Sep', sector: 88, youValue: 85, market: 80 },
  { month: 'Oct', sector: 90, youValue: 89, market: 82 },
  { month: 'Nov', sector: 87, youValue: 92, market: 79 },
  { month: 'Dic', sector: 92, youValue: 95, market: 83 },
  { month: 'Ene', sector: 95, youValue: 98, market: 85 },
];

// Mock sector benchmarks
const SECTOR_BENCHMARKS = [
  { metric: 'Win Rate', yourValue: 32, sectorAvg: 28, top10: 42, unit: '%' },
  { metric: 'Ciclo de Venta', yourValue: 45, sectorAvg: 52, top10: 35, unit: 'días', inverse: true },
  { metric: 'Deal Size', yourValue: 24500, sectorAvg: 22000, top10: 35000, unit: '€' },
  { metric: 'NPS Clientes', yourValue: 72, sectorAvg: 65, top10: 85, unit: '' },
  { metric: 'Retención', yourValue: 88, sectorAvg: 82, top10: 94, unit: '%' },
  { metric: 'Cross-sell Rate', yourValue: 25, sectorAvg: 22, top10: 38, unit: '%' },
];

// Mock regulatory updates
const REGULATORY_UPDATES = [
  { 
    id: '1', 
    title: 'Nueva normativa de protección de datos financieros', 
    type: 'regulation',
    impact: 'high',
    deadline: '2026-03-01',
    status: 'pending',
    summary: 'Nuevos requisitos de consentimiento explícito para datos sensibles.',
  },
  { 
    id: '2', 
    title: 'Actualización requisitos KYC/AML', 
    type: 'compliance',
    impact: 'medium',
    deadline: '2026-02-15',
    status: 'in_progress',
    summary: 'Procedimientos actualizados de verificación de identidad.',
  },
  { 
    id: '3', 
    title: 'Directiva de sostenibilidad ESG', 
    type: 'regulation',
    impact: 'medium',
    deadline: '2026-06-01',
    status: 'pending',
    summary: 'Reporting obligatorio de impacto medioambiental.',
  },
];

// Mock competitor insights
const COMPETITOR_INSIGHTS = [
  { 
    id: '1',
    competitor: 'CompetidorA', 
    movement: 'Lanzamiento nuevo producto digital',
    impact: 'high',
    action: 'Preparar contra-oferta',
    date: '2026-01-20',
  },
  { 
    id: '2',
    competitor: 'CompetidorB', 
    movement: 'Expansión a mercado LATAM',
    impact: 'medium',
    action: 'Monitorizar cuentas compartidas',
    date: '2026-01-18',
  },
  { 
    id: '3',
    competitor: 'CompetidorC', 
    movement: 'Reducción de precios -15%',
    impact: 'high',
    action: 'Enfatizar valor diferencial',
    date: '2026-01-15',
  },
];

// Mock sector news
const SECTOR_NEWS = [
  { 
    id: '1',
    title: 'El sector financiero acelera la adopción de IA generativa',
    source: 'Financial Times',
    date: '2026-01-24',
    relevance: 95,
    url: '#',
  },
  { 
    id: '2',
    title: 'BCE anuncia nuevas directrices para banca digital',
    source: 'Reuters',
    date: '2026-01-23',
    relevance: 88,
    url: '#',
  },
  { 
    id: '3',
    title: 'Fusiones y adquisiciones en aumento en el sector',
    source: 'Bloomberg',
    date: '2026-01-22',
    relevance: 75,
    url: '#',
  },
];

export function CopilotSectorIntel({
  sector = 'Banca',
  cnae = 'K',
  sectorContext,
  onRefresh,
  isLoading,
}: CopilotSectorIntelProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
      default: return 'bg-green-500/20 text-green-600 border-green-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-500/20 text-blue-600';
      case 'in_progress': return 'bg-amber-500/20 text-amber-600';
      case 'completed': return 'bg-green-500/20 text-green-600';
      default: return 'bg-muted';
    }
  };

  const getBenchmarkPosition = (yourValue: number, sectorAvg: number, top10: number, inverse?: boolean) => {
    if (inverse) {
      if (yourValue <= top10) return { status: 'excellent', color: 'text-green-600' };
      if (yourValue <= sectorAvg) return { status: 'good', color: 'text-blue-600' };
      return { status: 'below', color: 'text-amber-600' };
    }
    if (yourValue >= top10) return { status: 'excellent', color: 'text-green-600' };
    if (yourValue >= sectorAvg) return { status: 'good', color: 'text-blue-600' };
    return { status: 'below', color: 'text-amber-600' };
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-[400px] bg-muted/50" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-500/10 via-cyan-500/5 to-transparent border-blue-500/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Globe className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  Inteligencia del Sector
                  <Badge variant="outline">{sector}</Badge>
                  <Badge variant="secondary">CNAE {cnae}</Badge>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Tendencias, benchmarks y regulaciones en tiempo real
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={onRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="benchmarks" className="gap-2">
            <Target className="h-4 w-4" />
            Benchmarks
          </TabsTrigger>
          <TabsTrigger value="regulatory" className="gap-2">
            <Scale className="h-4 w-4" />
            Regulación
          </TabsTrigger>
          <TabsTrigger value="competitors" className="gap-2">
            <Building2 className="h-4 w-4" />
            Competencia
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Market Trend Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tendencia del Mercado vs Tu Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={MARKET_TRENDS}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="youValue" 
                      name="Tu rendimiento" 
                      stroke="#8b5cf6" 
                      fill="#8b5cf6" 
                      fillOpacity={0.3}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sector" 
                      name="Media sector" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.1}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="market" 
                      name="Mercado general" 
                      stroke="#94a3b8" 
                      fill="transparent"
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Insights Clave
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[220px]">
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2 text-green-600">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium">+15% crecimiento sector</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        El sector muestra tendencia alcista en Q1 2026
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">3 cambios regulatorios</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Nuevas normativas que afectan al sector próximamente
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center gap-2 text-blue-600">
                        <Building2 className="h-4 w-4" />
                        <span className="text-sm font-medium">2 movimientos competidores</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Competidores con nuevos lanzamientos esta semana
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Latest News */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Newspaper className="h-4 w-4" />
                  Noticias del Sector
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {SECTOR_NEWS.map((news) => (
                    <a
                      key={news.id}
                      href={news.url}
                      className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                            {news.title}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>{news.source}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(news.date), { locale: es, addSuffix: true })}</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs ml-2">
                          {news.relevance}%
                        </Badge>
                      </div>
                      <ExternalLink className="h-3 w-3 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Benchmarks Tab */}
        <TabsContent value="benchmarks" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tu Posición vs Sector</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {SECTOR_BENCHMARKS.map((benchmark) => {
                  const position = getBenchmarkPosition(
                    benchmark.yourValue, 
                    benchmark.sectorAvg, 
                    benchmark.top10,
                    benchmark.inverse
                  );
                  const vsAvg = benchmark.inverse
                    ? benchmark.sectorAvg - benchmark.yourValue
                    : benchmark.yourValue - benchmark.sectorAvg;
                  
                  return (
                    <div key={benchmark.metric} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{benchmark.metric}</span>
                          {position.status === 'excellent' && (
                            <Badge className="bg-green-500/20 text-green-600 text-xs">Top 10%</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            Media: {benchmark.sectorAvg.toLocaleString()}{benchmark.unit}
                          </span>
                          <span className="text-muted-foreground">
                            Top 10%: {benchmark.top10.toLocaleString()}{benchmark.unit}
                          </span>
                          <span className={cn("font-bold", position.color)}>
                            {benchmark.yourValue.toLocaleString()}{benchmark.unit}
                          </span>
                        </div>
                      </div>
                      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                        {/* Sector average marker */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
                          style={{ left: `${(benchmark.sectorAvg / benchmark.top10) * 100}%` }}
                        />
                        {/* Your value */}
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            position.status === 'excellent' ? 'bg-green-500' :
                            position.status === 'good' ? 'bg-blue-500' : 'bg-amber-500'
                          )}
                          style={{ 
                            width: `${Math.min((benchmark.yourValue / benchmark.top10) * 100, 100)}%` 
                          }}
                        />
                      </div>
                      <p className={cn("text-xs flex items-center gap-1", position.color)}>
                        {vsAvg >= 0 ? (
                          <>
                            <ArrowUpRight className="h-3 w-3" />
                            +{Math.abs(vsAvg).toLocaleString()}{benchmark.unit} sobre la media
                          </>
                        ) : (
                          <>
                            <ArrowDownRight className="h-3 w-3" />
                            {Math.abs(vsAvg).toLocaleString()}{benchmark.unit} bajo la media
                          </>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regulatory Tab */}
        <TabsContent value="regulatory" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Actualizaciones Regulatorias
                </CardTitle>
                <Badge variant="outline" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {REGULATORY_UPDATES.filter(r => r.impact === 'high').length} alta prioridad
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {REGULATORY_UPDATES.map((update) => (
                  <div 
                    key={update.id}
                    className={cn(
                      "p-4 rounded-lg border transition-colors",
                      update.impact === 'high' ? 'border-red-500/30 bg-red-500/5' : 'hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{update.title}</h4>
                          <Badge variant="outline" className={getImpactColor(update.impact)}>
                            {update.impact === 'high' ? 'Alta' : 
                             update.impact === 'medium' ? 'Media' : 'Baja'}
                          </Badge>
                          <Badge className={getStatusColor(update.status)}>
                            {update.status === 'pending' ? 'Pendiente' :
                             update.status === 'in_progress' ? 'En progreso' : 'Completado'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{update.summary}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Scale className="h-3 w-3" />
                            {update.type === 'regulation' ? 'Regulación' : 'Cumplimiento'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            Fecha límite: {format(new Date(update.deadline), 'd MMM yyyy', { locale: es })}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver detalles
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Movimientos de la Competencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {COMPETITOR_INSIGHTS.map((insight) => (
                  <div 
                    key={insight.id}
                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{insight.competitor}</Badge>
                          <Badge variant="outline" className={getImpactColor(insight.impact)}>
                            Impacto {insight.impact === 'high' ? 'Alto' : 'Medio'}
                          </Badge>
                        </div>
                        <p className="font-medium mt-2">{insight.movement}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <Lightbulb className="h-4 w-4 text-amber-500" />
                          <span className="text-sm text-amber-600 font-medium">
                            Acción recomendada: {insight.action}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Detectado: {formatDistanceToNow(new Date(insight.date), { locale: es, addSuffix: true })}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Tomar acción
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CopilotSectorIntel;
