/**
 * ModuleDeploymentPanel - CI/CD Pipeline mejorado con visualización Kanban
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  Rocket, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity,
  GitBranch,
  Terminal,
  AlertTriangle,
  RotateCcw,
  ChevronRight,
  Pause,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useModuleDeploymentPipeline } from '@/hooks/admin/useModuleDeploymentPipeline';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface ModuleDeploymentPanelProps {
  moduleKey?: string;
  className?: string;
}

const mockLogs = [
  { time: '14:32:01', level: 'info', message: 'Iniciando build...' },
  { time: '14:32:05', level: 'info', message: 'Instalando dependencias...' },
  { time: '14:32:15', level: 'info', message: 'Compilando TypeScript...' },
  { time: '14:32:28', level: 'warn', message: 'Deprecation warning en lodash' },
  { time: '14:32:35', level: 'info', message: 'Ejecutando tests...' },
  { time: '14:32:48', level: 'info', message: '✓ 24/24 tests passed' },
  { time: '14:32:50', level: 'info', message: 'Generando bundle...' },
  { time: '14:33:02', level: 'info', message: 'Deploy completado exitosamente' },
];

export function ModuleDeploymentPanel({ moduleKey, className }: ModuleDeploymentPanelProps) {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const { isLoading, pipelines, activePipeline, fetchPipelines, startPipeline, cancelPipeline } = useModuleDeploymentPipeline();

  useEffect(() => {
    if (moduleKey) fetchPipelines(moduleKey);
  }, [moduleKey, fetchPipelines]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500/10 border-green-500/30';
      case 'failed': return 'bg-red-500/10 border-red-500/30';
      case 'running': return 'bg-blue-500/10 border-blue-500/30';
      default: return 'bg-yellow-500/10 border-yellow-500/30';
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
    <motion.div layout className={cn(isExpanded && "fixed inset-4 z-50")}>
      <Card className={cn("overflow-hidden h-full", className)}>
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
              <Button 
                size="sm" 
                onClick={() => startPipeline(moduleKey)} 
                disabled={!!activePipeline} 
                className="gap-1"
              >
                <Play className="h-4 w-4" /> Deploy
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8">
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => fetchPipelines(moduleKey)} disabled={isLoading} className="h-8 w-8">
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="pipeline" className="text-xs gap-1">
                <GitBranch className="h-3 w-3" /> Pipeline
              </TabsTrigger>
              <TabsTrigger value="logs" className="text-xs gap-1">
                <Terminal className="h-3 w-3" /> Logs
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs gap-1">
                <Clock className="h-3 w-3" /> Historial
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pipeline" className="mt-0">
              {/* Active Pipeline */}
              {activePipeline && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("p-4 rounded-lg border mb-4", getStatusColor(activePipeline.status))}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
                      <span className="font-medium">Pipeline en progreso</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => cancelPipeline(activePipeline.id)} className="gap-1">
                      <Pause className="h-3 w-3" /> Cancelar
                    </Button>
                  </div>
                  
                  {/* Pipeline Steps */}
                  <div className="flex items-center gap-1 mb-3">
                    {activePipeline.stages.map((stage, idx) => (
                      <div key={stage.id} className="flex items-center">
                        <div className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                          stage.status === 'success' && "bg-green-500/20 text-green-700",
                          stage.status === 'running' && "bg-blue-500/20 text-blue-700",
                          stage.status === 'pending' && "bg-muted text-muted-foreground",
                          stage.status === 'failed' && "bg-red-500/20 text-red-700"
                        )}>
                          {getStatusIcon(stage.status)}
                          {stage.name}
                        </div>
                        {idx < activePipeline.stages.length - 1 && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <Progress value={65} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    Estimado: 2 minutos restantes
                  </p>
                </motion.div>
              )}

              {/* Pipeline Visualization */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {['Build', 'Test', 'Stage', 'Prod'].map((stage, idx) => (
                  <motion.div
                    key={stage}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-3 rounded-lg border bg-card text-center"
                  >
                    <div className="h-8 w-8 rounded-full bg-muted mx-auto mb-2 flex items-center justify-center">
                      {idx < 3 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-xs font-medium">{stage}</p>
                    <p className="text-xs text-muted-foreground">
                      {idx < 3 ? 'Completado' : 'Pendiente'}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Recent Deployments */}
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {pipelines.slice(0, 5).map(pipeline => (
                    <motion.div 
                      key={pipeline.id} 
                      className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(pipeline.status)}
                          <span className="font-medium text-sm">{pipeline.name}</span>
                          <Badge variant="outline" className="text-xs">{pipeline.environment}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={pipeline.status === 'success' ? 'default' : 'secondary'} className="text-xs">
                            {pipeline.status}
                          </Badge>
                          {pipeline.status === 'success' && (
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {pipeline.startedAt && formatDistanceToNow(new Date(pipeline.startedAt), { locale: es, addSuffix: true })}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="logs" className="mt-0">
              <div className="bg-zinc-950 rounded-lg p-3 font-mono text-xs h-[350px] overflow-auto">
                {mockLogs.map((log, idx) => (
                  <div key={idx} className={cn(
                    "py-0.5",
                    log.level === 'error' && "text-red-400",
                    log.level === 'warn' && "text-yellow-400",
                    log.level === 'info' && "text-green-400"
                  )}>
                    <span className="text-zinc-500">[{log.time}]</span>{' '}
                    <span className={cn(
                      log.level === 'error' && "text-red-500",
                      log.level === 'warn' && "text-yellow-500",
                      log.level === 'info' && "text-blue-500"
                    )}>[{log.level.toUpperCase()}]</span>{' '}
                    {log.message}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <ScrollArea className="h-[350px]">
                <div className="space-y-2">
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default ModuleDeploymentPanel;
