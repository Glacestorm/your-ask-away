/**
 * ERPAgentsSupervisorPanel - Panel de supervisión de agentes AI ERP
 * Muestra el estado de todos los agentes y sus alertas con control de voz
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import {
  Activity,
  AlertTriangle,
  Bell,
  BellOff,
  Bot,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Loader2,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RefreshCw,
  Settings,
  Shield,
  Volume2,
  VolumeX,
  XCircle,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useERPAgentOrchestrator, ERPAgentType, ERPAgent, AgentAlert } from '@/hooks/erp/useERPAgentOrchestrator';

interface ERPAgentsSupervisorPanelProps {
  className?: string;
  defaultExpanded?: boolean;
  showOnlyActive?: boolean;
}

export function ERPAgentsSupervisorPanel({
  className,
  defaultExpanded = false,
  showOnlyActive = false
}: ERPAgentsSupervisorPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [activeTab, setActiveTab] = useState('agents');
  const [selectedAgent, setSelectedAgent] = useState<ERPAgentType | null>(null);

  const {
    agents,
    activeAgents,
    alerts,
    isOrchestrating,
    isSpeaking,
    audioEnabled,
    lastGlobalAnalysis,
    stats,
    toggleAgent,
    setAudioEnabled,
    stopSpeaking,
    repeatLastCriticalAlert,
    markAlertAsRead,
    markAgentAlertsAsRead,
    clearAlerts,
    getAlertsByAgent
  } = useERPAgentOrchestrator();

  // Agentes a mostrar
  const displayAgents = showOnlyActive ? activeAgents : agents;

  // Alertas filtradas por agente seleccionado
  const filteredAlerts = useMemo(() => {
    if (selectedAgent) {
      return getAlertsByAgent(selectedAgent);
    }
    return alerts;
  }, [selectedAgent, alerts, getAlertsByAgent]);

  // Icono de estado del agente
  const getStatusIcon = (status: ERPAgent['status']) => {
    switch (status) {
      case 'analyzing':
        return <Loader2 className="h-3 w-3 animate-spin text-primary" />;
      case 'alerting':
        return <AlertTriangle className="h-3 w-3 text-destructive animate-pulse" />;
      case 'error':
        return <XCircle className="h-3 w-3 text-destructive" />;
      default:
        return <CircleDot className="h-3 w-3 text-muted-foreground" />;
    }
  };

  // Color de severidad
  const getSeverityColor = (severity: AgentAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-destructive text-destructive-foreground';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Icono de tipo de alerta
  const getAlertTypeIcon = (type: AgentAlert['type']) => {
    switch (type) {
      case 'critical':
        return <XCircle className="h-4 w-4" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'recommendation':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden border-primary/20",
      isExpanded && "fixed inset-4 z-50 shadow-2xl",
      className
    )}>
      {/* Header */}
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Centro de Supervisión AI
                {isOrchestrating && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {stats.activeAgents} agentes activos • {stats.unreadAlerts} alertas pendientes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Control de audio */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setAudioEnabled(!audioEnabled)}
              title={audioEnabled ? 'Desactivar voz' : 'Activar voz'}
            >
              {audioEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>

            {/* Botón de detener audio */}
            {isSpeaking && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={stopSpeaking}
              >
                <Pause className="h-4 w-4" />
              </Button>
            )}

            {/* Botón de repetir alerta */}
            {stats.criticalAlerts > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={repeatLastCriticalAlert}
                title="Repetir última alerta crítica"
              >
                <Bell className="h-4 w-4 animate-pulse" />
              </Button>
            )}

            {/* Expandir/colapsar */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Badges de estado */}
        <div className="flex flex-wrap gap-1 mt-2">
          {stats.criticalAlerts > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {stats.criticalAlerts} Críticas
            </Badge>
          )}
          {stats.agentsByStatus.analyzing > 0 && (
            <Badge variant="secondary">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              {stats.agentsByStatus.analyzing} analizando
            </Badge>
          )}
          {stats.agentsByStatus.error > 0 && (
            <Badge variant="destructive">
              {stats.agentsByStatus.error} con error
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-120px)]" : "")}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="agents" className="text-xs gap-1">
              <Bot className="h-3 w-3" />
              Agentes
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs gap-1">
              <Bell className="h-3 w-3" />
              Alertas
              {stats.unreadAlerts > 0 && (
                <Badge variant="destructive" className="h-4 min-w-4 text-[10px] px-1">
                  {stats.unreadAlerts}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs gap-1">
              <Settings className="h-3 w-3" />
              Config
            </TabsTrigger>
          </TabsList>

          {/* Tab de Agentes */}
          <TabsContent value="agents" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[280px]"}>
              <div className="space-y-2">
                {displayAgents.map(agent => (
                  <Collapsible key={agent.id}>
                    <CollapsibleTrigger asChild>
                      <div
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border cursor-pointer",
                          "hover:bg-muted/50 transition-colors",
                          agent.isActive ? "bg-card" : "bg-muted/30 opacity-60",
                          selectedAgent === agent.type && "ring-2 ring-primary"
                        )}
                        onClick={() => setSelectedAgent(
                          selectedAgent === agent.type ? null : agent.type
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{agent.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{agent.name}</span>
                              {getStatusIcon(agent.status)}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {agent.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {agent.alertCount > 0 && (
                            <Badge variant="destructive" className="h-5 min-w-5 text-[10px]">
                              {agent.alertCount}
                            </Badge>
                          )}
                          <Switch
                            checked={agent.isActive}
                            onCheckedChange={() => toggleAgent(agent.type)}
                            onClick={e => e.stopPropagation()}
                          />
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-3 pt-2 space-y-2 bg-muted/20 rounded-b-lg -mt-1">
                        <div className="flex flex-wrap gap-1">
                          {agent.capabilities.slice(0, 3).map((cap, i) => (
                            <Badge key={i} variant="outline" className="text-[10px]">
                              {cap}
                            </Badge>
                          ))}
                          {agent.capabilities.length > 3 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{agent.capabilities.length - 3} más
                            </Badge>
                          )}
                        </div>
                        {agent.lastActivity && (
                          <p className="text-[10px] text-muted-foreground">
                            Última actividad: {formatDistanceToNow(agent.lastActivity, { 
                              addSuffix: true, 
                              locale: es 
                            })}
                          </p>
                        )}
                        {agent.alertCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => markAgentAlertsAsRead(agent.type)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Marcar leídas
                          </Button>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab de Alertas */}
          <TabsContent value="alerts" className="flex-1 mt-0">
            <div className="flex items-center justify-between mb-2">
              {selectedAgent && (
                <Badge variant="secondary" className="gap-1">
                  {agents.find(a => a.type === selectedAgent)?.icon}
                  {agents.find(a => a.type === selectedAgent)?.name}
                  <button
                    className="ml-1 hover:text-destructive"
                    onClick={() => setSelectedAgent(null)}
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filteredAlerts.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => clearAlerts(selectedAgent || undefined)}
                >
                  Limpiar
                </Button>
              )}
            </div>
            <ScrollArea className={isExpanded ? "h-[calc(100vh-320px)]" : "h-[240px]"}>
              {filteredAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <BellOff className="h-8 w-8 mb-2" />
                  <p className="text-sm">No hay alertas pendientes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className={cn(
                        "p-3 rounded-lg border transition-colors",
                        alert.isRead ? "bg-muted/20" : "bg-card",
                        alert.severity === 'critical' && !alert.isRead && "border-destructive animate-pulse"
                      )}
                      onClick={() => !alert.isRead && markAlertAsRead(alert.id)}
                    >
                      <div className="flex items-start gap-2">
                        <div className={cn(
                          "p-1.5 rounded-full mt-0.5",
                          getSeverityColor(alert.severity)
                        )}>
                          {getAlertTypeIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-sm">{alert.title}</span>
                            <Badge variant="outline" className="text-[10px] h-4">
                              {alert.agentName}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {alert.message}
                          </p>
                          {alert.recommendation && (
                            <p className="text-xs text-primary mt-1 flex items-start gap-1">
                              <Sparkles className="h-3 w-3 mt-0.5 shrink-0" />
                              {alert.recommendation}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {formatDistanceToNow(alert.timestamp, { addSuffix: true, locale: es })}
                            {alert.isSpoken && (
                              <span className="ml-2">
                                <Volume2 className="h-3 w-3 inline" /> Anunciado
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Tab de Configuración */}
          <TabsContent value="settings" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[280px]"}>
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Alertas por Voz</h4>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="audio-enabled" className="text-xs">
                      Activar alertas habladas
                    </Label>
                    <Switch
                      id="audio-enabled"
                      checked={audioEnabled}
                      onCheckedChange={setAudioEnabled}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Las alertas críticas y de alta prioridad se anunciarán por voz automáticamente.
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Agentes Activos</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {agents.map(agent => (
                      <div
                        key={agent.id}
                        className="flex items-center justify-between p-2 rounded border bg-muted/20"
                      >
                        <span className="text-xs flex items-center gap-1">
                          {agent.icon} {agent.name.replace('Agente ', '')}
                        </span>
                        <Switch
                          checked={agent.isActive}
                          onCheckedChange={() => toggleAgent(agent.type)}
                          disabled={agent.type === 'supervisor'}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Estadísticas</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-muted/30">
                      <p className="text-muted-foreground">Total Agentes</p>
                      <p className="font-bold text-lg">{stats.totalAgents}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <p className="text-muted-foreground">Activos</p>
                      <p className="font-bold text-lg text-green-500">{stats.activeAgents}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <p className="text-muted-foreground">Alertas Totales</p>
                      <p className="font-bold text-lg">{stats.totalAlerts}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <p className="text-muted-foreground">Sin Leer</p>
                      <p className="font-bold text-lg text-orange-500">{stats.unreadAlerts}</p>
                    </div>
                  </div>
                  {lastGlobalAnalysis && (
                    <p className="text-[10px] text-muted-foreground">
                      Último análisis global: {formatDistanceToNow(lastGlobalAnalysis, { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </p>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ERPAgentsSupervisorPanel;
