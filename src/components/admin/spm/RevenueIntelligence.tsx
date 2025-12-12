import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, TrendingDown, AlertCircle, Lightbulb, 
  Target, DollarSign, BarChart3, LineChart as LineChartIcon,
  Eye, CheckCircle2, Clock, Sparkles
} from 'lucide-react';
import { useRevenueSignals, useSalesPerformanceMutations } from '@/hooks/useSalesPerformance';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const SIGNAL_ICONS: Record<string, React.ReactNode> = {
  'opportunity': <Lightbulb className="h-5 w-5 text-green-500" />,
  'risk': <AlertCircle className="h-5 w-5 text-red-500" />,
  'trend': <TrendingUp className="h-5 w-5 text-blue-500" />,
  'anomaly': <AlertCircle className="h-5 w-5 text-yellow-500" />,
  'recommendation': <Sparkles className="h-5 w-5 text-purple-500" />,
};

const SEVERITY_COLORS: Record<string, string> = {
  'info': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'low': 'bg-green-500/10 text-green-500 border-green-500/20',
  'medium': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'high': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'critical': 'bg-red-500/10 text-red-500 border-red-500/20',
};

export function RevenueIntelligence() {
  const { user } = useAuth();
  const [signalFilter, setSignalFilter] = useState<string>('all');
  const { data: signals, isLoading } = useRevenueSignals(undefined, false);
  const { markSignalRead, actionSignal } = useSalesPerformanceMutations();

  const filteredSignals = signals?.filter(s => {
    if (signalFilter === 'all') return true;
    if (signalFilter === 'unread') return !s.is_read;
    return s.signal_type === signalFilter;
  }) || [];

  const signalCounts = {
    all: signals?.length || 0,
    unread: signals?.filter(s => !s.is_read).length || 0,
    opportunity: signals?.filter(s => s.signal_type === 'opportunity').length || 0,
    risk: signals?.filter(s => s.signal_type === 'risk').length || 0,
    trend: signals?.filter(s => s.signal_type === 'trend').length || 0,
    recommendation: signals?.filter(s => s.signal_type === 'recommendation').length || 0,
  };

  // Mock trend data for visualization
  const revenueData = [
    { month: 'Ene', actual: 125000, target: 150000 },
    { month: 'Feb', actual: 145000, target: 155000 },
    { month: 'Mar', actual: 178000, target: 160000 },
    { month: 'Abr', actual: 165000, target: 165000 },
    { month: 'May', actual: 192000, target: 170000 },
    { month: 'Jun', actual: 210000, target: 180000 },
  ];

  const productPerformance = [
    { name: 'Créditos', value: 45000, growth: 12 },
    { name: 'Seguros', value: 32000, growth: 8 },
    { name: 'Inversiones', value: 28000, growth: -3 },
    { name: 'TPV', value: 22000, growth: 25 },
    { name: 'Otros', value: 15000, growth: 5 },
  ];

  const handleMarkRead = async (signalId: string) => {
    await markSignalRead.mutateAsync(signalId);
  };

  const handleAction = async (signalId: string) => {
    if (user?.id) {
      await actionSignal.mutateAsync({ signalId, userId: user.id });
    }
  };

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Evolución de Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000)}K`}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={(value: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)}
                />
                <Area 
                  type="monotone" 
                  dataKey="target" 
                  stroke="hsl(var(--muted-foreground))" 
                  fill="hsl(var(--muted) / 0.3)"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.2)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Rendimiento por Producto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productPerformance.map((product) => (
                <div key={product.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{product.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(product.value)}
                      </span>
                      <Badge 
                        variant={product.growth >= 0 ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {product.growth >= 0 ? '+' : ''}{product.growth}%
                      </Badge>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(product.value / 45000) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Signals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Señales de Revenue Intelligence
            </CardTitle>
            {signalCounts.unread > 0 && (
              <Badge variant="destructive">{signalCounts.unread} sin leer</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={signalFilter} onValueChange={setSignalFilter}>
            <TabsList className="mb-4">
              <TabsTrigger value="all" className="gap-2">
                Todas
                <Badge variant="secondary" className="text-xs">{signalCounts.all}</Badge>
              </TabsTrigger>
              <TabsTrigger value="unread" className="gap-2">
                Sin leer
                <Badge variant="secondary" className="text-xs">{signalCounts.unread}</Badge>
              </TabsTrigger>
              <TabsTrigger value="opportunity" className="gap-2">
                <Lightbulb className="h-4 w-4 text-green-500" />
                <span className="hidden sm:inline">Oportunidades</span>
              </TabsTrigger>
              <TabsTrigger value="risk" className="gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="hidden sm:inline">Riesgos</span>
              </TabsTrigger>
              <TabsTrigger value="recommendation" className="gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="hidden sm:inline">IA</span>
              </TabsTrigger>
            </TabsList>

            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 bg-muted/50 animate-pulse rounded-lg" />
                ))
              ) : filteredSignals.length > 0 ? (
                filteredSignals.map((signal) => (
                  <div 
                    key={signal.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      signal.is_read ? 'bg-background' : 'bg-primary/5'
                    } ${SEVERITY_COLORS[signal.severity]}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {SIGNAL_ICONS[signal.signal_type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{signal.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {signal.severity}
                          </Badge>
                          {signal.confidence_score > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {(signal.confidence_score * 100).toFixed(0)}% confianza
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{signal.description}</p>
                        {signal.recommended_action && (
                          <p className="text-sm mt-2 font-medium text-primary">
                            → {signal.recommended_action}
                          </p>
                        )}
                        {signal.potential_value > 0 && (
                          <p className="text-sm mt-1 text-green-600">
                            Valor potencial: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(signal.potential_value)}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true, locale: es })}
                          </span>
                          {!signal.is_read && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleMarkRead(signal.id)}
                              className="gap-1 text-xs h-7"
                            >
                              <Eye className="h-3 w-3" />
                              Marcar leído
                            </Button>
                          )}
                          {!signal.is_actioned && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAction(signal.id)}
                              className="gap-1 text-xs h-7"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Accionar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No hay señales de revenue intelligence</p>
                  <p className="text-sm">Las señales se generarán automáticamente con la actividad</p>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
