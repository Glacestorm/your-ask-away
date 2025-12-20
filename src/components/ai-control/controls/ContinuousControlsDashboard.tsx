import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileCheck
} from 'lucide-react';
import { useContinuousControls } from '@/hooks/useContinuousControls';

export function ContinuousControlsDashboard() {
  const {
    controls,
    stats,
    alerts,
    isLoading,
    isRunning,
    runControls,
    acknowledgeAlert,
    resolveAlert,
  } = useContinuousControls();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.passedControls || 0}</p>
                <p className="text-xs text-muted-foreground">Controls OK</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.failedControls || 0}</p>
                <p className="text-xs text-muted-foreground">Fallits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.openAlerts || 0}</p>
                <p className="text-xs text-muted-foreground">Alertes Obertes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileCheck className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.evidenceGenerated || 0}</p>
                <p className="text-xs text-muted-foreground">Evidències</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Controls Continus
          </CardTitle>
          <Button onClick={() => runControls(undefined)} disabled={isRunning} className="gap-2">
            {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Executar Tots
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {controls?.map((control) => (
                <div key={control.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {control.last_status === 'passed' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : control.last_status === 'failed' ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{control.control_name}</p>
                      <p className="text-xs text-muted-foreground">{control.control_category} • {control.check_frequency}</p>
                    </div>
                  </div>
                  <Badge variant={control.last_status === 'passed' ? 'default' : control.last_status === 'failed' ? 'destructive' : 'secondary'}>
                    {control.last_status || 'Pendent'}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alertes Actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg border-amber-500/30 bg-amber-500/5">
                  <div>
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => acknowledgeAlert(alert.id)}>
                      Reconèixer
                    </Button>
                    <Button size="sm" onClick={() => resolveAlert({ alertId: alert.id })}>
                      Resoldre
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
