import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Zap, 
  Timer, 
  LayoutGrid, 
  MousePointer2, 
  Gauge,
  RefreshCw,
  Trash2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useWebVitals } from '@/hooks/useWebVitals';
import { WebVitalsMetric } from '@/lib/webVitals';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  metric: WebVitalsMetric | null;
  icon: React.ReactNode;
  description: string;
  unit: string;
  thresholds: { good: number; poor: number };
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  metric, 
  icon, 
  description, 
  unit,
  thresholds 
}) => {
  const getRatingColor = (rating?: string) => {
    switch (rating) {
      case 'good': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'needs-improvement': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'poor': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-muted-foreground bg-muted/10 border-muted/20';
    }
  };

  const getProgress = () => {
    if (!metric) return 0;
    const { good, poor } = thresholds;
    const value = metric.value;
    
    if (value <= good) return (value / good) * 33;
    if (value <= poor) return 33 + ((value - good) / (poor - good)) * 33;
    return Math.min(100, 66 + ((value - poor) / poor) * 34);
  };

  return (
    <Card className={cn('transition-all hover:shadow-md', metric ? '' : 'opacity-50')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-semibold text-sm">{metric?.name || '-'}</span>
          </div>
          {metric && (
            <Badge 
              variant="outline" 
              className={cn('text-xs capitalize', getRatingColor(metric.rating))}
            >
              {metric.rating === 'needs-improvement' ? 'Mitjà' : 
               metric.rating === 'good' ? 'Bo' : 
               metric.rating === 'poor' ? 'Dolent' : '-'}
            </Badge>
          )}
        </div>
        
        <div className="mb-2">
          <span className="text-2xl font-bold">
            {metric ? (metric.name === 'CLS' ? metric.value.toFixed(3) : Math.round(metric.value)) : '-'}
          </span>
          <span className="text-muted-foreground text-sm ml-1">{unit}</span>
        </div>
        
        <Progress 
          value={getProgress()} 
          className={cn(
            'h-1.5',
            metric?.rating === 'good' ? '[&>div]:bg-green-500' :
            metric?.rating === 'needs-improvement' ? '[&>div]:bg-yellow-500' :
            metric?.rating === 'poor' ? '[&>div]:bg-red-500' : ''
          )}
        />
        
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
        
        <div className="flex justify-between text-xs text-muted-foreground mt-2 border-t pt-2">
          <span className="text-green-500">≤{thresholds.good}{unit === '' ? '' : unit}</span>
          <span className="text-yellow-500">≤{thresholds.poor}{unit === '' ? '' : unit}</span>
          <span className="text-red-500">&gt;{thresholds.poor}{unit === '' ? '' : unit}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export const PerformanceMonitor: React.FC = () => {
  const { metrics, overallScore, getHistory, clearHistory } = useWebVitals({ 
    enableLogging: true,
    enableAnalytics: true 
  });
  const [history, setHistory] = useState<ReturnType<typeof getHistory>>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, [metrics, getHistory]);

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'good': return 'bg-green-500';
      case 'needs-improvement': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getScoreIcon = (score: string) => {
    switch (score) {
      case 'good': return <TrendingUp className="h-4 w-4" />;
      case 'needs-improvement': return <Activity className="h-4 w-4" />;
      case 'poor': return <TrendingDown className="h-4 w-4" />;
      default: return <Gauge className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Core Web Vitals
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge 
                className={cn(
                  'flex items-center gap-1 text-white',
                  getScoreColor(overallScore)
                )}
              >
                {getScoreIcon(overallScore)}
                {overallScore === 'good' ? 'Puntuació Excel·lent' :
                 overallScore === 'needs-improvement' ? 'Necessita Millores' :
                 'Puntuació Baixa'}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Les mètriques Core Web Vitals de Google mesuren l'experiència d'usuari real: 
            velocitat de càrrega (LCP), interactivitat (INP/FID) i estabilitat visual (CLS).
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              metric={metrics.LCP}
              icon={<Timer className="h-4 w-4 text-blue-500" />}
              description="Largest Contentful Paint - Temps fins que es renderitza el contingut principal"
              unit="ms"
              thresholds={{ good: 2500, poor: 4000 }}
            />
            <MetricCard
              metric={metrics.INP || metrics.FID}
              icon={<MousePointer2 className="h-4 w-4 text-purple-500" />}
              description="Interaction to Next Paint - Temps de resposta a interaccions d'usuari"
              unit="ms"
              thresholds={{ good: 200, poor: 500 }}
            />
            <MetricCard
              metric={metrics.CLS}
              icon={<LayoutGrid className="h-4 w-4 text-orange-500" />}
              description="Cumulative Layout Shift - Estabilitat visual durant la càrrega"
              unit=""
              thresholds={{ good: 0.1, poor: 0.25 }}
            />
            <MetricCard
              metric={metrics.FCP}
              icon={<Zap className="h-4 w-4 text-yellow-500" />}
              description="First Contentful Paint - Temps fins al primer contingut visible"
              unit="ms"
              thresholds={{ good: 1800, poor: 3000 }}
            />
            <MetricCard
              metric={metrics.TTFB}
              icon={<Activity className="h-4 w-4 text-green-500" />}
              description="Time to First Byte - Temps de resposta del servidor"
              unit="ms"
              thresholds={{ good: 800, poor: 1800 }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Optimization Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consells d'Optimització</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Timer className="h-4 w-4 text-blue-500" />
                Millorar LCP
              </h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Precarregar imatges crítiques</li>
                <li>Optimitzar fonts web</li>
                <li>Utilitzar CDN per a recursos</li>
                <li>Comprimir i optimitzar imatges</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <MousePointer2 className="h-4 w-4 text-purple-500" />
                Millorar INP
              </h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Dividir tasques JavaScript llargues</li>
                <li>Debounce en events freqüents</li>
                <li>Utilitzar Web Workers</li>
                <li>Evitar bloqueig del fil principal</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-orange-500" />
                Millorar CLS
              </h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Definir mides d'imatges</li>
                <li>Reservar espai per contingut dinàmic</li>
                <li>Evitar injecció de contingut</li>
                <li>Carregar fonts amb swap</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Optimitzacions Generals
              </h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Code splitting amb lazy loading</li>
                <li>Service Worker per caching</li>
                <li>Prefetch de recursos</li>
                <li>Comprimir recursos (Brotli/Gzip)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Historial de Mètriques</CardTitle>
              <Button variant="outline" size="sm" onClick={handleClearHistory}>
                <Trash2 className="h-4 w-4 mr-1" />
                Esborrar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Mètrica</th>
                    <th className="text-left py-2">Valor</th>
                    <th className="text-left py-2">Estat</th>
                    <th className="text-left py-2">Pàgina</th>
                    <th className="text-left py-2">Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(-20).reverse().map((m, i) => (
                    <tr key={i} className="border-b border-dashed">
                      <td className="py-1.5 font-medium">{m.name}</td>
                      <td className="py-1.5">
                        {m.name === 'CLS' ? m.value.toFixed(3) : Math.round(m.value)}
                        {m.name !== 'CLS' && 'ms'}
                      </td>
                      <td className="py-1.5">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'text-xs capitalize',
                            m.rating === 'good' ? 'text-green-500' :
                            m.rating === 'needs-improvement' ? 'text-yellow-500' :
                            'text-red-500'
                          )}
                        >
                          {m.rating === 'good' ? 'Bo' :
                           m.rating === 'needs-improvement' ? 'Mitjà' : 'Dolent'}
                        </Badge>
                      </td>
                      <td className="py-1.5 text-muted-foreground">{m.url}</td>
                      <td className="py-1.5 text-muted-foreground">
                        {new Date(m.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceMonitor;
