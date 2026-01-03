/**
 * AccountingSupervisorPanel - Panel del Agente Supervisor de Contabilidad
 * Ahora integrado con el Orquestador Multi-Agente para supervisión coordinada
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Shield,
  Volume2,
  VolumeX,
  Bot,
  Sparkles,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Trash2,
  Bell,
  BellOff,
  Play,
  Square,
  Eye,
  EyeOff,
  Mic,
  Users,
  Zap
} from 'lucide-react';
import { useAccountingSupervisorAgent, SupervisorAlert, AccountingValidation, SupervisorContext } from '@/hooks/erp/useAccountingSupervisorAgent';
import { useERPAgentOrchestrator, AgentAnalysisRequest } from '@/hooks/erp/useERPAgentOrchestrator';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface AccountingSupervisorPanelProps {
  context: SupervisorContext | null;
  onValidationChange?: (isValid: boolean) => void;
  className?: string;
  defaultExpanded?: boolean;
  enableMultiAgent?: boolean; // Nuevo: activar supervisión multi-agente
}

export function AccountingSupervisorPanel({
  context,
  onValidationChange,
  className,
  defaultExpanded = true,
  enableMultiAgent = true
}: AccountingSupervisorPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [useMultiAgent, setUseMultiAgent] = useState(enableMultiAgent);

  // Hook original de supervisor contable
  const {
    isActive,
    isAnalyzing,
    isSpeaking: isSpeakingLegacy,
    alerts: legacyAlerts,
    validations,
    lastAnalysis,
    audioEnabled,
    toggleActive,
    setAudioEnabled,
    supervise,
    markAlertAsRead: markLegacyAlertAsRead,
    clearAlerts: clearLegacyAlerts,
    stopSpeaking: stopSpeakingLegacy,
    repeatLastCriticalAlert: repeatLegacyCriticalAlert,
    unreadCount: legacyUnreadCount,
    criticalCount: legacyCriticalCount,
    hasErrors
  } = useAccountingSupervisorAgent();

  // Nuevo orquestador multi-agente
  const {
    agents,
    alerts: orchestratorAlerts,
    isOrchestrating,
    isSpeaking: isSpeakingOrchestrator,
    audioEnabled: orchestratorAudioEnabled,
    stats,
    toggleAgent,
    setAudioEnabled: setOrchestratorAudioEnabled,
    stopSpeaking: stopOrchestratorSpeaking,
    repeatLastCriticalAlert: repeatOrchestratorCriticalAlert,
    markAlertAsRead: markOrchestratorAlertAsRead,
    clearAlerts: clearOrchestratorAlerts,
    requestAnalysis,
    supervisorAnalysis,
    getAgentByType
  } = useERPAgentOrchestrator();

  // Seleccionar alertas según modo
  const alerts = useMultiAgent 
    ? orchestratorAlerts.filter(a => ['accounting', 'trade_finance', 'compliance', 'supervisor'].includes(a.agentType))
    : legacyAlerts;
  
  const isSpeaking = useMultiAgent ? isSpeakingOrchestrator : isSpeakingLegacy;
  const unreadCount = useMultiAgent ? stats.unreadAlerts : legacyUnreadCount;
  const criticalCount = useMultiAgent ? stats.criticalAlerts : legacyCriticalCount;

  // Supervisar con multi-agente cuando cambia el contexto
  useEffect(() => {
    if (!context || !isActive) return;

    if (useMultiAgent) {
      // Análisis coordinado con múltiples agentes
      const requests: AgentAnalysisRequest[] = [
        {
          agentType: 'accounting',
          module: 'trade_finance',
          action: 'validate_entries',
          data: {
            operationType: context.operationType,
            entries: context.entries,
            operationData: context.operationData
          },
          priority: 'high'
        },
        {
          agentType: 'trade_finance',
          module: 'operations',
          action: 'validate_operation',
          data: {
            operationType: context.operationType,
            operationData: context.operationData
          },
          priority: 'normal'
        },
        {
          agentType: 'compliance',
          module: 'accounting',
          action: 'check_compliance',
          data: {
            framework: 'PGC',
            entries: context.entries
          },
          priority: 'normal'
        }
      ];

      // Solo ejecutar si hay agentes activos
      const activeRequests = requests.filter(r => 
        getAgentByType(r.agentType)?.isActive
      );

      if (activeRequests.length > 0) {
        supervisorAnalysis(activeRequests);
      }
    } else {
      // Supervisión legacy
      supervise(context);
    }
  }, [context, isActive, useMultiAgent]);

  // Notificar cambios de validación
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(!hasErrors);
    }
  }, [hasErrors, onValidationChange]);

  // Handlers unificados
  const handleStopSpeaking = useCallback(() => {
    if (useMultiAgent) {
      stopOrchestratorSpeaking();
    } else {
      stopSpeakingLegacy();
    }
  }, [useMultiAgent, stopOrchestratorSpeaking, stopSpeakingLegacy]);

  const handleRepeatAlert = useCallback(() => {
    if (useMultiAgent) {
      repeatOrchestratorCriticalAlert();
    } else {
      repeatLegacyCriticalAlert();
    }
  }, [useMultiAgent, repeatOrchestratorCriticalAlert, repeatLegacyCriticalAlert]);

  const handleClearAlerts = useCallback(() => {
    if (useMultiAgent) {
      clearOrchestratorAlerts();
    } else {
      clearLegacyAlerts();
    }
  }, [useMultiAgent, clearOrchestratorAlerts, clearLegacyAlerts]);

  const handleAudioToggle = useCallback((enabled: boolean) => {
    if (useMultiAgent) {
      setOrchestratorAudioEnabled(enabled);
    }
    setAudioEnabled(enabled);
  }, [useMultiAgent, setOrchestratorAudioEnabled, setAudioEnabled]);

  // Obtener icono según severidad
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600 animate-pulse" />;
      case 'high':
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
      case 'warning':
        return <Info className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  // Obtener estilo según severidad
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200';
      case 'high':
      case 'error':
        return 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-200';
      case 'medium':
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-200';
      default:
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-200';
    }
  };

  // Agentes relevantes para contabilidad
  const relevantAgents = agents.filter(a => 
    ['accounting', 'trade_finance', 'compliance', 'supervisor'].includes(a.type)
  );

  // Alertas a mostrar
  const displayedAlerts = showAllAlerts ? alerts : alerts.slice(0, 5);

  return (
    <Card className={cn(
      'border-2 transition-all duration-300',
      isActive ? 'border-primary/50' : 'border-dashed border-muted-foreground/30',
      criticalCount > 0 && 'border-red-300 shadow-red-100 dark:border-red-700',
      className
    )}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <div className={cn(
                  "p-1.5 rounded-lg",
                  isActive ? "bg-gradient-to-br from-primary to-blue-600" : "bg-muted"
                )}>
                  {useMultiAgent ? (
                    <Users className={cn("h-4 w-4", isActive ? "text-white" : "text-muted-foreground")} />
                  ) : (
                    <Shield className={cn("h-4 w-4", isActive ? "text-white" : "text-muted-foreground")} />
                  )}
                </div>
                <div>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {useMultiAgent ? 'Supervisión Multi-Agente' : 'Supervisor Contable AI'}
                    {isActive && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-700">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Activo
                      </Badge>
                    )}
                    {(isAnalyzing || isOrchestrating) && (
                      <Badge variant="outline" className="text-xs">
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Analizando
                      </Badge>
                    )}
                  </CardTitle>
                  {useMultiAgent ? (
                    <p className="text-xs text-muted-foreground">
                      {stats.activeAgents} agentes activos • {unreadCount} alertas pendientes
                    </p>
                  ) : lastAnalysis ? (
                    <p className="text-xs text-muted-foreground">
                      Último análisis: {formatDistanceToNow(lastAnalysis, { addSuffix: true, locale: es })}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Badge variant={criticalCount > 0 ? "destructive" : "default"} className="text-xs">
                    {unreadCount} {criticalCount > 0 && `(${criticalCount} crítico)`}
                  </Badge>
                )}
                {isSpeaking && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300">
                    <Volume2 className="h-3 w-3 mr-1 animate-pulse" />
                    Hablando
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Controles principales */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch
                    id="supervisor-active"
                    checked={isActive}
                    onCheckedChange={toggleActive}
                  />
                  <Label htmlFor="supervisor-active" className="text-sm font-medium cursor-pointer">
                    {isActive ? 'Supervisión activa' : 'Supervisión inactiva'}
                  </Label>
                </div>

                <Separator orientation="vertical" className="h-6 hidden sm:block" />

                {/* Toggle Multi-Agente */}
                {enableMultiAgent && (
                  <div className="flex items-center gap-2">
                    <Switch
                      id="multi-agent"
                      checked={useMultiAgent}
                      onCheckedChange={setUseMultiAgent}
                      disabled={!isActive}
                    />
                    <Label htmlFor="multi-agent" className="text-sm cursor-pointer flex items-center gap-1">
                      {useMultiAgent ? (
                        <>
                          <Zap className="h-4 w-4 text-primary" />
                          <span>Multi-Agente</span>
                        </>
                      ) : (
                        <>
                          <Bot className="h-4 w-4 text-muted-foreground" />
                          <span>Agente único</span>
                        </>
                      )}
                    </Label>
                  </div>
                )}

                <Separator orientation="vertical" className="h-6 hidden sm:block" />

                <div className="flex items-center gap-2">
                  <Switch
                    id="audio-enabled"
                    checked={audioEnabled}
                    onCheckedChange={handleAudioToggle}
                    disabled={!isActive}
                  />
                  <Label htmlFor="audio-enabled" className="text-sm cursor-pointer flex items-center gap-1">
                    {audioEnabled ? (
                      <>
                        <Volume2 className="h-4 w-4 text-primary" />
                        <span>Alertas orales</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="h-4 w-4 text-muted-foreground" />
                        <span>Solo escrito</span>
                      </>
                    )}
                  </Label>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {isSpeaking ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={handleStopSpeaking}>
                          <Square className="h-4 w-4 mr-1" />
                          Detener
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Detener alerta de voz</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleRepeatAlert}
                          disabled={alerts.length === 0 || !audioEnabled}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Repetir
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Repetir última alerta crítica</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleClearAlerts}
                        disabled={alerts.length === 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Limpiar alertas</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Agentes activos (modo multi-agente) */}
            {useMultiAgent && isActive && (
              <div className="flex flex-wrap gap-2">
                {relevantAgents.map(agent => (
                  <Badge
                    key={agent.id}
                    variant={agent.isActive ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all",
                      agent.isActive && "bg-primary/80",
                      agent.status === 'analyzing' && "animate-pulse"
                    )}
                    onClick={() => toggleAgent(agent.type)}
                  >
                    <span className="mr-1">{agent.icon}</span>
                    {agent.name.replace('Agente ', '')}
                    {agent.alertCount > 0 && (
                      <span className="ml-1 px-1 bg-destructive text-destructive-foreground rounded-full text-[10px]">
                        {agent.alertCount}
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            )}

            {/* Resumen de validaciones */}
            {validations.length > 0 && !useMultiAgent && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Validaciones
                </h4>
                <div className="grid gap-2">
                  {validations.map((validation, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-start gap-2 p-2 rounded-lg border text-sm",
                        getSeverityStyle(validation.severity)
                      )}
                    >
                      {getSeverityIcon(validation.severity)}
                      <div className="flex-1">
                        <p className="font-medium">{validation.message}</p>
                        {validation.recommendation && (
                          <p className="text-xs opacity-75 mt-1">
                            💡 {validation.recommendation}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {validation.code}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de alertas */}
            {alerts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Alertas ({alerts.length})
                  </h4>
                  {alerts.length > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllAlerts(!showAllAlerts)}
                    >
                      {showAllAlerts ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Mostrar menos
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver todas
                        </>
                      )}
                    </Button>
                  )}
                </div>

                <ScrollArea className="max-h-[250px]">
                  <div className="space-y-2">
                    {displayedAlerts.map((alert: any) => (
                      <div
                        key={alert.id}
                        className={cn(
                          "p-3 rounded-lg border transition-all cursor-pointer",
                          getSeverityStyle(alert.severity),
                          !alert.isRead && "ring-2 ring-primary/20"
                        )}
                        onClick={() => {
                          if (useMultiAgent) {
                            markOrchestratorAlertAsRead(alert.id);
                          } else {
                            markLegacyAlertAsRead(alert.id);
                          }
                        }}
                      >
                        <div className="flex items-start gap-2">
                          {getSeverityIcon(alert.severity)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{alert.title}</span>
                              {useMultiAgent && alert.agentName && (
                                <Badge variant="outline" className="text-[10px]">
                                  {alert.agentName}
                                </Badge>
                              )}
                              {alert.isSpoken && (
                                <Mic className="h-3 w-3 text-muted-foreground" />
                              )}
                              {!alert.isRead && (
                                <Badge variant="secondary" className="text-xs">Nueva</Badge>
                              )}
                            </div>
                            <p className="text-sm mt-1">{alert.message}</p>
                            {alert.recommendation && (
                              <p className="text-xs mt-2 p-2 bg-background/50 rounded border">
                                💡 <strong>Recomendación:</strong> {alert.recommendation}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true, locale: es })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Estado sin alertas */}
            {alerts.length === 0 && validations.length === 0 && isActive && (
              <div className="text-center py-6 text-muted-foreground">
                {useMultiAgent ? (
                  <>
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Los agentes están vigilando las operaciones</p>
                    <p className="text-xs">Las alertas de todos los agentes aparecerán aquí</p>
                  </>
                ) : (
                  <>
                    <Bot className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">El supervisor está vigilando las partidas</p>
                    <p className="text-xs">Las alertas aparecerán aquí cuando se detecten incidencias</p>
                  </>
                )}
              </div>
            )}

            {/* Estado inactivo */}
            {!isActive && (
              <div className="text-center py-6 text-muted-foreground">
                <Shield className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Supervisor inactivo</p>
                <p className="text-xs">Active el supervisor para recibir alertas y recomendaciones</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default AccountingSupervisorPanel;
