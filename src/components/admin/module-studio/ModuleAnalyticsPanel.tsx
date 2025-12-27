/**
 * ModuleAnalyticsPanel - Dashboard de métricas simplificado
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, BarChart3, TrendingUp, Users, Activity, Zap } from 'lucide-react';
import { useModuleAnalytics } from '@/hooks/admin/useModuleAnalytics';
import { cn } from '@/lib/utils';

interface ModuleAnalyticsPanelProps {
  moduleKey?: string;
  className?: string;
}

export function ModuleAnalyticsPanel({ moduleKey, className }: ModuleAnalyticsPanelProps) {
  const { isLoading, dashboardData, fetchDashboard, getTrendIcon } = useModuleAnalytics();

  useEffect(() => {
    if (moduleKey) fetchDashboard();
  }, [moduleKey, fetchDashboard]);

  if (!moduleKey) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Selecciona un módulo para ver analytics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Module Analytics</CardTitle>
              <CardDescription className="text-xs">Métricas de uso y rendimiento</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchDashboard} disabled={isLoading} className="h-8 w-8">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Usuarios</span>
            </div>
            <p className="text-xl font-bold">{dashboardData?.summary?.totalUsers || 0}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Módulos Activos</span>
            </div>
            <p className="text-xl font-bold">{dashboardData?.summary?.activeModules || 0}</p>
          </div>
        </div>

        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {dashboardData?.healthScores?.map(health => (
              <div key={health.moduleKey} className="p-3 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{health.moduleKey}</span>
                  <Badge variant={health.overallScore >= 80 ? "default" : "secondary"}>
                    {health.overallScore}
                  </Badge>
                </div>
                <Progress value={health.overallScore} className="h-2" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default ModuleAnalyticsPanel;
