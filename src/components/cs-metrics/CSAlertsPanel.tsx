import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, Bell, BellOff, CheckCircle, Settings, 
  RefreshCw, Clock, TrendingDown, TrendingUp, X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCSMetricsAlerts, CSMetricsData, CSAlertThreshold } from '@/hooks/useCSMetricsAlerts';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface CSAlertsPanelProps {
  metrics: CSMetricsData;
  className?: string;
}

export function CSAlertsPanel({ metrics, className }: CSAlertsPanelProps) {
  const [activeTab, setActiveTab] = useState('alerts');
  const {
    thresholds,
    activeAlerts,
    criticalAlertsCount,
    lastCheck,
    acknowledgeAlert,
    dismissAlert,
    updateThreshold,
    resetToDefaults,
    checkThresholds,
    METRIC_LABELS,
  } = useCSMetricsAlerts(metrics);

  const getSeverityStyles = (severity: 'warning' | 'critical') => {
    return severity === 'critical' 
      ? 'bg-destructive/10 border-destructive/30 text-destructive'
      : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400';
  };

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              criticalAlertsCount > 0 
                ? "bg-destructive/20 animate-pulse" 
                : "bg-primary/20"
            )}>
              {criticalAlertsCount > 0 ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <Bell className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Alertas CS
                {activeAlerts.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {activeAlerts.length}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Monitoreo automático de umbrales críticos
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={checkThresholds}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
            <TabsTrigger value="alerts" className="relative">
              Alertas Activas
              {activeAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="thresholds">
              <Settings className="h-3 w-3 mr-1" />
              Umbrales
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="m-0 p-4">
            <ScrollArea className="h-[300px]">
              {activeAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                  <p className="font-medium text-foreground">Todo bajo control</p>
                  <p className="text-sm text-muted-foreground">
                    No hay alertas activas en este momento
                  </p>
                  {lastCheck && (
                    <p className="text-xs text-muted-foreground mt-2">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Última verificación: {formatDistanceToNow(lastCheck, { locale: es, addSuffix: true })}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAlerts.map(alert => (
                    <div 
                      key={alert.id}
                      className={cn(
                        "p-3 rounded-lg border transition-all",
                        getSeverityStyles(alert.threshold.severity)
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          {alert.threshold.severity === 'critical' ? (
                            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                          ) : (
                            <Bell className="h-4 w-4 mt-0.5 shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              {METRIC_LABELS[alert.threshold.metric]}
                            </p>
                            <p className="text-xs opacity-80 mt-0.5">
                              Valor actual: <strong>{alert.currentValue.toFixed(1)}</strong>
                              {alert.threshold.condition === 'above' ? (
                                <TrendingUp className="h-3 w-3 inline ml-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 inline ml-1" />
                              )}
                              {' '}Umbral: {alert.threshold.value}
                            </p>
                            <p className="text-xs opacity-60 mt-1">
                              {formatDistanceToNow(new Date(alert.triggeredAt), { locale: es, addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="h-7 text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Reconocer
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => dismissAlert(alert.id)}
                            className="h-7 w-7"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="thresholds" className="m-0 p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Configura los umbrales de alerta
              </p>
              <Button variant="outline" size="sm" onClick={resetToDefaults}>
                Restablecer
              </Button>
            </div>
            <ScrollArea className="h-[280px]">
              <div className="space-y-3">
                {thresholds.map(threshold => (
                  <ThresholdEditor 
                    key={threshold.id}
                    threshold={threshold}
                    metricLabel={METRIC_LABELS[threshold.metric]}
                    currentValue={metrics[threshold.metric as keyof CSMetricsData]}
                    onUpdate={updateThreshold}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface ThresholdEditorProps {
  threshold: CSAlertThreshold;
  metricLabel: string;
  currentValue: number;
  onUpdate: (id: string, updates: Partial<CSAlertThreshold>) => void;
}

function ThresholdEditor({ threshold, metricLabel, currentValue, onUpdate }: ThresholdEditorProps) {
  const [value, setValue] = useState(threshold.value.toString());
  
  const handleValueChange = () => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onUpdate(threshold.id, { value: numValue });
    }
  };

  const isTriggered = threshold.condition === 'above' 
    ? currentValue > threshold.value 
    : currentValue < threshold.value;

  return (
    <div className={cn(
      "p-3 rounded-lg border border-border/50 transition-colors",
      !threshold.enabled && "opacity-50",
      isTriggered && threshold.enabled && "border-destructive/30 bg-destructive/5"
    )}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Switch 
            checked={threshold.enabled}
            onCheckedChange={(enabled) => onUpdate(threshold.id, { enabled })}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{metricLabel}</span>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  threshold.severity === 'critical' 
                    ? "text-destructive border-destructive/30" 
                    : "text-yellow-600 border-yellow-500/30"
                )}
              >
                {threshold.severity}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {threshold.condition === 'above' ? '>' : '<'} {threshold.value} 
              <span className="mx-2">|</span>
              Actual: <strong className={isTriggered ? 'text-destructive' : ''}>{currentValue.toFixed(1)}</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`threshold-${threshold.id}`} className="sr-only">
            Valor umbral
          </Label>
          <Input
            id={`threshold-${threshold.id}`}
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleValueChange}
            className="w-20 h-8 text-sm"
            disabled={!threshold.enabled}
          />
        </div>
      </div>
    </div>
  );
}

export default CSAlertsPanel;
