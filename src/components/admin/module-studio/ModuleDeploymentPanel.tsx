/**
 * ModuleDeploymentPanel - CI/CD Pipeline simplificado
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Rocket, Play, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';
import { useModuleDeploymentPipeline } from '@/hooks/admin/useModuleDeploymentPipeline';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ModuleDeploymentPanelProps {
  moduleKey?: string;
  className?: string;
}

export function ModuleDeploymentPanel({ moduleKey, className }: ModuleDeploymentPanelProps) {
  const { isLoading, pipelines, activePipeline, fetchPipelines, startPipeline, cancelPipeline } = useModuleDeploymentPipeline();

  useEffect(() => {
    if (moduleKey) fetchPipelines(moduleKey);
  }, [moduleKey, fetchPipelines]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (!moduleKey) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-12 text-center">
          <Rocket className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Selecciona un módulo para gestionar deployments</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Deployment Pipeline</CardTitle>
              <CardDescription className="text-xs">CI/CD y deploy progresivo</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => startPipeline(moduleKey)} disabled={!!activePipeline} className="gap-1">
              <Play className="h-4 w-4" /> Deploy
            </Button>
            <Button variant="ghost" size="icon" onClick={() => fetchPipelines(moduleKey)} disabled={isLoading} className="h-8 w-8">
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <ScrollArea className="h-[350px]">
          <div className="space-y-3">
            {pipelines.map(pipeline => (
              <div key={pipeline.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(pipeline.status)}
                    <span className="font-medium">{pipeline.name}</span>
                    <Badge variant="outline" className="text-xs">{pipeline.environment}</Badge>
                  </div>
                  <Badge variant={pipeline.status === 'success' ? 'default' : 'secondary'}>{pipeline.status}</Badge>
                </div>
                <div className="flex gap-2 flex-wrap mb-2">
                  {pipeline.stages.map(stage => (
                    <Badge key={stage.id} variant="outline" className="text-xs gap-1">
                      {getStatusIcon(stage.status)} {stage.name}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {pipeline.startedAt && formatDistanceToNow(new Date(pipeline.startedAt), { locale: es, addSuffix: true })}
                </p>
              </div>
            ))}
            {pipelines.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Rocket className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Sin pipelines ejecutados</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default ModuleDeploymentPanel;
