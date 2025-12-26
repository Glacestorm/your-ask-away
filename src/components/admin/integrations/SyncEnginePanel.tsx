import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, RefreshCw, Play, Square } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useSyncEngine } from '@/hooks/admin/integrations';
import { useEffect } from 'react';

export default function SyncEnginePanel() {
  const { configs, stats, activeJob, isLoading, fetchConfigs, fetchStats, startSync, cancelSync } = useSyncEngine();

  useEffect(() => { 
    fetchConfigs(); 
    fetchStats(); 
  }, [fetchConfigs, fetchStats]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-primary" />
          Motor de Sincronización
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => { fetchConfigs(); fetchStats(); }} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {stats && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-muted/50 rounded">
              <p className="text-muted-foreground">Sincronizaciones</p>
              <p className="font-medium">{stats.total_syncs}</p>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <p className="text-muted-foreground">Tasa éxito</p>
              <p className="font-medium">
                {stats.total_syncs > 0 
                  ? ((stats.successful_syncs / stats.total_syncs) * 100).toFixed(1) 
                  : 0}%
              </p>
            </div>
          </div>
        )}

        {activeJob && (
          <div className="p-2 border rounded-lg bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Sync en progreso</span>
              <Button size="sm" variant="ghost" onClick={() => cancelSync(activeJob.id)}>
                <Square className="h-3 w-3" />
              </Button>
            </div>
            <Progress value={activeJob.progress_percentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {activeJob.records_processed} registros procesados
            </p>
          </div>
        )}

        <div className="space-y-2">
          {configs.slice(0, 3).map((config) => (
            <div key={config.id} className="flex items-center justify-between p-2 border rounded-lg">
              <div>
                <p className="font-medium text-sm">{config.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{config.source_system} → {config.target_system}</span>
                  <Badge variant="outline" className="text-xs">{config.sync_type}</Badge>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => startSync(config.id)}
                disabled={!!activeJob}
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
