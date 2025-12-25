import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  AlertOctagon, 
  Zap,
  TrendingUp,
  TrendingDown,
  Shield,
  Activity,
  Eye,
  CheckCircle
} from 'lucide-react';
import { usePredictiveAnomalies } from '@/hooks/admin/predictive';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function AnomalyDetectionPanel() {
  const [activeTab, setActiveTab] = useState('active');
  const { anomalies, stats, patterns, isLoading, detectAnomalies, updateAnomalyStatus, getPatterns } = usePredictiveAnomalies();

  useEffect(() => {
    detectAnomalies();
    getPatterns();
  }, [detectAnomalies, getPatterns]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'revenue': return <TrendingDown className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'performance': return <Zap className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const activeAnomalies = anomalies.filter(a => a.status === 'new' || a.status === 'investigating');
  const resolvedAnomalies = anomalies.filter(a => a.status === 'resolved' || a.status === 'false_positive');

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 bg-gradient-to-r from-red-500/10 via-pink-500/10 to-rose-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-pink-500">
              <AlertOctagon className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Detección de Anomalías</CardTitle>
              <p className="text-xs text-muted-foreground">Monitoreo inteligente en tiempo real</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => detectAnomalies()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-3">
        {stats && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="p-2 rounded border bg-card text-center">
              <p className="text-lg font-bold">{stats.total_detected}</p>
              <p className="text-xs text-muted-foreground">Detectadas</p>
            </div>
            <div className="p-2 rounded border bg-card text-center">
              <p className="text-lg font-bold text-destructive">{stats.by_severity?.critical || 0}</p>
              <p className="text-xs text-muted-foreground">Críticas</p>
            </div>
            <div className="p-2 rounded border bg-card text-center">
              <p className="text-lg font-bold text-orange-500">{stats.by_severity?.high || 0}</p>
              <p className="text-xs text-muted-foreground">Altas</p>
            </div>
            <div className="p-2 rounded border bg-card text-center">
              <p className="text-lg font-bold">{stats.avg_resolution_time_hours?.toFixed(1)}h</p>
              <p className="text-xs text-muted-foreground">Resolución</p>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="active" className="text-xs">
              Activas ({activeAnomalies.length})
            </TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs">Resueltas</TabsTrigger>
            <TabsTrigger value="patterns" className="text-xs">Patrones</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-0">
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {activeAnomalies.map((anomaly) => (
                  <div key={anomaly.id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(anomaly.anomaly_type)}
                        <span className="font-medium text-sm">{anomaly.entity_name}</span>
                      </div>
                      <Badge className={getSeverityColor(anomaly.severity)}>{anomaly.severity}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{anomaly.metric_name}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span>Esperado: {anomaly.expected_value?.toFixed(0)}</span>
                      <span className="text-destructive">Real: {anomaly.actual_value?.toFixed(0)}</span>
                      <span className="text-muted-foreground">
                        ({anomaly.deviation_percentage > 0 ? '+' : ''}{anomaly.deviation_percentage?.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-6 text-xs"
                        onClick={() => updateAnomalyStatus(anomaly.id, 'investigating')}
                      >
                        <Eye className="h-3 w-3 mr-1" /> Investigar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-6 text-xs"
                        onClick={() => updateAnomalyStatus(anomaly.id, 'resolved')}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" /> Resolver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="resolved" className="mt-0">
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {resolvedAnomalies.map((anomaly) => (
                  <div key={anomaly.id} className="p-3 rounded-lg border bg-card opacity-70">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(anomaly.anomaly_type)}
                        <span className="text-sm">{anomaly.entity_name}</span>
                      </div>
                      <Badge variant="secondary">{anomaly.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{anomaly.metric_name}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="patterns" className="mt-0">
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {patterns.map((pattern) => (
                  <div key={pattern.pattern_id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{pattern.pattern_name}</span>
                      <Badge variant="outline">{pattern.frequency}x</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Severidad típica: {pattern.typical_severity}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {pattern.common_causes?.slice(0, 3).map((cause, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {cause}
                        </Badge>
                      ))}
                    </div>
                    {pattern.auto_resolution_possible && (
                      <p className="text-xs text-green-500 mt-2">✓ Auto-resolución posible</p>
                    )}
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

export default AnomalyDetectionPanel;
