import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePLGSignals } from '@/hooks/usePLGSignals';
import { Zap, TrendingUp, Users, Activity, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const PLGSignalsTracker: React.FC = () => {
  const { 
    signals, 
    isLoading, 
    getActiveSignals, 
    getHighStrengthSignals,
    getSignalStats 
  } = usePLGSignals();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const activeSignals = getActiveSignals();
  const highStrengthSignals = getHighStrengthSignals(0.7);
  const stats = getSignalStats();

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'usage_spike': return Activity;
      case 'feature_adoption': return Zap;
      case 'seat_utilization': return Users;
      case 'api_growth': return TrendingUp;
      default: return Activity;
    }
  };

  const getSignalColor = (strength: number) => {
    if (strength >= 0.8) return 'text-chart-2 bg-chart-2/10';
    if (strength >= 0.6) return 'text-chart-1 bg-chart-1/10';
    if (strength >= 0.4) return 'text-chart-4 bg-chart-4/10';
    return 'text-muted-foreground bg-muted';
  };

  const getSignalLabel = (type: string) => {
    const labels: Record<string, string> = {
      usage_spike: 'Pico de Uso',
      feature_adoption: 'Adopción Feature',
      seat_utilization: 'Utilización Seats',
      api_growth: 'Crecimiento API',
      engagement_increase: 'Aumento Engagement'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-pulse">Cargando señales PLG...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-chart-4" />
              Señales PLG en Tiempo Real
            </CardTitle>
            <Badge variant="outline" className="gap-1">
              <span className="w-2 h-2 rounded-full bg-chart-2 animate-pulse" />
              {activeSignals.length} activas
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
              <p className="text-xs text-muted-foreground">Total Señales</p>
            </div>
            <div className="p-4 rounded-lg bg-chart-2/10 text-center">
              <p className="text-2xl font-bold text-chart-2">{stats?.active || 0}</p>
              <p className="text-xs text-muted-foreground">Activas</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 text-center">
              <p className="text-2xl font-bold text-primary">{stats?.converted || 0}</p>
              <p className="text-xs text-muted-foreground">Convertidas</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold">{formatCurrency(stats?.totalOpportunityValue || 0)}</p>
              <p className="text-xs text-muted-foreground">Valor Pipeline</p>
            </div>
          </div>

          {stats && stats.total > 0 && (
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Tasa de Conversión</span>
                <span className="text-sm font-semibold">{stats.conversionRate.toFixed(1)}%</span>
              </div>
              <Progress value={stats.conversionRate} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Señales de Alta Prioridad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {highStrengthSignals.slice(0, 6).map((signal) => {
              const Icon = getSignalIcon(signal.signal_type);
              const colorClass = getSignalColor(signal.signal_strength);
              
              return (
                <div 
                  key={signal.id} 
                  className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">{signal.company?.name || 'Empresa'}</p>
                      <Badge variant="secondary" className="text-xs">
                        {getSignalLabel(signal.signal_type)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +{((signal.metric_change_percentage || 0) * 100).toFixed(0)}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(signal.detected_at), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full bg-chart-2 rounded-full"
                          style={{ width: `${signal.signal_strength * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{(signal.signal_strength * 100).toFixed(0)}%</span>
                    </div>
                    {signal.expansion_opportunity_value && (
                      <p className="text-xs text-chart-2 font-medium flex items-center gap-1 justify-end">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(signal.expansion_opportunity_value)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            
            {highStrengthSignals.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay señales de alta prioridad</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PLGSignalsTracker;
