/**
 * Core Web Vitals Dashboard
 * Métricas de rendimiento en tiempo real para el panel de administración
 */
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Clock, 
  LayoutGrid, 
  MousePointer, 
  Gauge, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer,
  Zap
} from 'lucide-react';
import { useWebVitals } from '@/hooks/useWebVitals';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

interface MetricCardProps {
  name: string;
  value: number | null;
  unit: string;
  rating: 'good' | 'needs-improvement' | 'poor' | undefined;
  thresholds: { good: number; poor: number };
  description: string;
  icon: React.ReactNode;
}

const MetricCard = ({ name, value, unit, rating, thresholds, description, icon }: MetricCardProps) => {
  const getRatingColor = (rating?: string) => {
    switch (rating) {
      case 'good': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'needs-improvement': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'poor': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-muted-foreground bg-muted/50 border-muted';
    }
  };

  const getRatingIcon = (rating?: string) => {
    switch (rating) {
      case 'good': return <CheckCircle className="h-4 w-4" />;
      case 'needs-improvement': return <AlertTriangle className="h-4 w-4" />;
      case 'poor': return <XCircle className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  const getProgressValue = () => {
    if (value === null) return 0;
    const maxValue = thresholds.poor * 1.5;
    return Math.min((value / maxValue) * 100, 100);
  };

  const getProgressColor = (rating?: string) => {
    switch (rating) {
      case 'good': return 'bg-emerald-500';
      case 'needs-improvement': return 'bg-amber-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-muted-foreground';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`border ${getRatingColor(rating)}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${getRatingColor(rating)}`}>
                {icon}
              </div>
              <div>
                <CardTitle className="text-sm font-medium">{name}</CardTitle>
                <CardDescription className="text-xs">{description}</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className={getRatingColor(rating)}>
              {getRatingIcon(rating)}
              <span className="ml-1 capitalize">{rating || 'Pending'}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">
                {value !== null ? value.toFixed(value < 1 ? 3 : 0) : '--'}
              </span>
              <span className="text-sm text-muted-foreground">{unit}</span>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Good: &lt;{thresholds.good}{unit}</span>
                <span>Poor: &gt;{thresholds.poor}{unit}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${getProgressColor(rating)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressValue()}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface HistoryEntry {
  timestamp: number;
  LCP?: number;
  FID?: number;
  CLS?: number;
  FCP?: number;
  TTFB?: number;
  INP?: number;
}

export function CoreWebVitalsDashboard() {
  const { metrics, overallScore, getHistory, clearHistory } = useWebVitals({ 
    enableLogging: true 
  });
  
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update history when metrics change
  useEffect(() => {
    const storedHistory = getHistory();
    if (storedHistory.length > 0) {
      // Transform stored metrics to history entries
      const entries = storedHistory.slice(-20).map((entry: any) => ({
        timestamp: entry.timestamp || Date.now(),
        LCP: entry.LCP?.value,
        FID: entry.FID?.value,
        CLS: entry.CLS?.value,
        FCP: entry.FCP?.value,
        TTFB: entry.TTFB?.value,
        INP: entry.INP?.value,
      }));
      setHistory(entries);
    }
  }, [metrics, getHistory]);

  // Add current metrics to history
  useEffect(() => {
    if (metrics.LCP || metrics.CLS || metrics.FCP) {
      setHistory(prev => {
        const newEntry: HistoryEntry = {
          timestamp: Date.now(),
          LCP: metrics.LCP?.value,
          FID: metrics.FID?.value,
          CLS: metrics.CLS?.value,
          FCP: metrics.FCP?.value,
          TTFB: metrics.TTFB?.value,
          INP: metrics.INP?.value,
        };
        
        // Keep only last 20 entries
        const updated = [...prev, newEntry].slice(-20);
        return updated;
      });
    }
  }, [metrics]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    window.location.reload();
  }, []);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, [clearHistory]);

  const getOverallScoreColor = () => {
    switch (overallScore) {
      case 'good': return 'text-emerald-500';
      case 'needs-improvement': return 'text-amber-500';
      case 'poor': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getOverallScoreIcon = () => {
    switch (overallScore) {
      case 'good': return <TrendingUp className="h-5 w-5" />;
      case 'needs-improvement': return <Minus className="h-5 w-5" />;
      case 'poor': return <TrendingDown className="h-5 w-5" />;
      default: return <Gauge className="h-5 w-5" />;
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gauge className="h-6 w-6 text-primary" />
            Core Web Vitals
          </h2>
          <p className="text-sm text-muted-foreground">
            Métricas de rendimiento en tiempo real
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getOverallScoreColor()}`}>
            {getOverallScoreIcon()}
            <span className="font-medium capitalize">{overallScore}</span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          name="LCP"
          value={metrics.LCP?.value ?? null}
          unit="ms"
          rating={metrics.LCP?.rating}
          thresholds={{ good: 2500, poor: 4000 }}
          description="Largest Contentful Paint"
          icon={<LayoutGrid className="h-4 w-4" />}
        />
        
        <MetricCard
          name="FID"
          value={metrics.FID?.value ?? null}
          unit="ms"
          rating={metrics.FID?.rating}
          thresholds={{ good: 100, poor: 300 }}
          description="First Input Delay"
          icon={<MousePointer className="h-4 w-4" />}
        />
        
        <MetricCard
          name="CLS"
          value={metrics.CLS?.value ?? null}
          unit=""
          rating={metrics.CLS?.rating}
          thresholds={{ good: 0.1, poor: 0.25 }}
          description="Cumulative Layout Shift"
          icon={<Activity className="h-4 w-4" />}
        />
        
        <MetricCard
          name="INP"
          value={metrics.INP?.value ?? null}
          unit="ms"
          rating={metrics.INP?.rating}
          thresholds={{ good: 200, poor: 500 }}
          description="Interaction to Next Paint"
          icon={<Zap className="h-4 w-4" />}
        />
        
        <MetricCard
          name="FCP"
          value={metrics.FCP?.value ?? null}
          unit="ms"
          rating={metrics.FCP?.rating}
          thresholds={{ good: 1800, poor: 3000 }}
          description="First Contentful Paint"
          icon={<Clock className="h-4 w-4" />}
        />
        
        <MetricCard
          name="TTFB"
          value={metrics.TTFB?.value ?? null}
          unit="ms"
          rating={metrics.TTFB?.rating}
          thresholds={{ good: 800, poor: 1800 }}
          description="Time to First Byte"
          icon={<Timer className="h-4 w-4" />}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="details">Detalles</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Historial de Métricas</CardTitle>
                  <CardDescription>Últimas 20 mediciones</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={handleClearHistory}>
                  Limpiar historial
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={formatTime}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        labelFormatter={formatTime}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="LCP"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary) / 0.2)"
                        strokeWidth={2}
                        name="LCP (ms)"
                      />
                      <Area
                        type="monotone"
                        dataKey="FCP"
                        stroke="hsl(142.1 76.2% 36.3%)"
                        fill="hsl(142.1 76.2% 36.3% / 0.2)"
                        strokeWidth={2}
                        name="FCP (ms)"
                      />
                      <Area
                        type="monotone"
                        dataKey="TTFB"
                        stroke="hsl(47.9 95.8% 53.1%)"
                        fill="hsl(47.9 95.8% 53.1% / 0.2)"
                        strokeWidth={2}
                        name="TTFB (ms)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Gauge className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay datos de historial disponibles</p>
                    <p className="text-sm">Las métricas se registrarán automáticamente</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información Detallada</CardTitle>
              <CardDescription>Recomendaciones y umbrales de rendimiento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <h4 className="font-medium text-emerald-500 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Bueno (Good)
                    </h4>
                    <ul className="mt-2 text-sm space-y-1 text-muted-foreground">
                      <li>• LCP &lt; 2.5s</li>
                      <li>• FID &lt; 100ms</li>
                      <li>• CLS &lt; 0.1</li>
                      <li>• INP &lt; 200ms</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <h4 className="font-medium text-amber-500 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Necesita Mejora
                    </h4>
                    <ul className="mt-2 text-sm space-y-1 text-muted-foreground">
                      <li>• LCP 2.5s - 4s</li>
                      <li>• FID 100ms - 300ms</li>
                      <li>• CLS 0.1 - 0.25</li>
                      <li>• INP 200ms - 500ms</li>
                    </ul>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <h4 className="font-medium mb-2">💡 Consejos de Optimización</h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li><strong>LCP:</strong> Optimiza imágenes, usa preload para recursos críticos</li>
                    <li><strong>FID/INP:</strong> Divide código JavaScript, usa web workers</li>
                    <li><strong>CLS:</strong> Define dimensiones de imágenes, reserva espacio para anuncios</li>
                    <li><strong>TTFB:</strong> Usa CDN, optimiza consultas de base de datos</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CoreWebVitalsDashboard;
