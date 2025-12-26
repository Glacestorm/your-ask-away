/**
 * RealTimeAlertsPanel
 * Panel de alertas en tiempo real con notificaciones y acciones rápidas
 * Fase 11 - Enterprise SaaS 2025-2026
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell,
  BellOff,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUp,
  Volume2,
  VolumeX,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface RealTimeAlert {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  autoResolve?: boolean;
  ttlMinutes?: number;
  actions?: AlertAction[];
  metadata?: Record<string, unknown>;
}

interface AlertAction {
  id: string;
  label: string;
  type: 'acknowledge' | 'resolve' | 'escalate' | 'investigate' | 'custom';
  icon?: string;
}

interface RealTimeAlertsPanelProps {
  alerts?: RealTimeAlert[];
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  onEscalate?: (alertId: string) => void;
  maxAlerts?: number;
  soundEnabled?: boolean;
  className?: string;
}

const defaultAlerts: RealTimeAlert[] = [
  {
    id: '1',
    title: 'Alto uso de CPU detectado',
    description: 'El servidor principal está al 92% de capacidad de CPU',
    severity: 'critical',
    source: 'Infrastructure Monitor',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    acknowledged: false,
    actions: [
      { id: 'ack', label: 'Reconocer', type: 'acknowledge' },
      { id: 'esc', label: 'Escalar', type: 'escalate' }
    ]
  },
  {
    id: '2',
    title: 'Violación de compliance detectada',
    description: 'Regla GDPR-003: Retención de datos excedida en tabla customers_old',
    severity: 'error',
    source: 'Compliance Monitor',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    acknowledged: false,
    actions: [
      { id: 'ack', label: 'Reconocer', type: 'acknowledge' },
      { id: 'inv', label: 'Investigar', type: 'investigate' }
    ]
  },
  {
    id: '3',
    title: 'Cliente en riesgo de churn',
    description: 'TechCorp S.L. - Health Score bajó a 45%',
    severity: 'warning',
    source: 'Customer Success AI',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    acknowledged: true,
    acknowledgedBy: 'María García',
    acknowledgedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    actions: [
      { id: 'res', label: 'Resolver', type: 'resolve' }
    ]
  },
  {
    id: '4',
    title: 'Nuevo workflow completado',
    description: 'Onboarding automatizado para 12 nuevos usuarios',
    severity: 'info',
    source: 'Workflow Engine',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    acknowledged: true
  }
];

const severityConfig = {
  critical: {
    icon: AlertOctagon,
    bgClass: 'bg-destructive/10 border-destructive/30',
    textClass: 'text-destructive',
    badgeClass: 'bg-destructive text-destructive-foreground',
    pulseClass: 'animate-pulse'
  },
  error: {
    icon: XCircle,
    bgClass: 'bg-orange-500/10 border-orange-500/30',
    textClass: 'text-orange-600',
    badgeClass: 'bg-orange-500 text-white',
    pulseClass: ''
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-yellow-500/10 border-yellow-500/30',
    textClass: 'text-yellow-600',
    badgeClass: 'bg-yellow-500 text-black',
    pulseClass: ''
  },
  info: {
    icon: Info,
    bgClass: 'bg-blue-500/10 border-blue-500/30',
    textClass: 'text-blue-600',
    badgeClass: 'bg-blue-500 text-white',
    pulseClass: ''
  }
};

export function RealTimeAlertsPanel({ 
  alerts = defaultAlerts,
  onAcknowledge,
  onResolve,
  onEscalate,
  maxAlerts = 10,
  soundEnabled: initialSoundEnabled = true,
  className 
}: RealTimeAlertsPanelProps) {
  const [soundEnabled, setSoundEnabled] = useState(initialSoundEnabled);
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);
  const [localAlerts, setLocalAlerts] = useState(alerts);

  useEffect(() => {
    setLocalAlerts(alerts);
  }, [alerts]);

  const filteredAlerts = filterSeverity 
    ? localAlerts.filter(a => a.severity === filterSeverity)
    : localAlerts;

  const unacknowledgedCount = localAlerts.filter(a => !a.acknowledged).length;
  const criticalCount = localAlerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;

  const handleAcknowledge = useCallback((alertId: string) => {
    if (onAcknowledge) {
      onAcknowledge(alertId);
    }
    setLocalAlerts(prev => prev.map(a => 
      a.id === alertId ? { 
        ...a, 
        acknowledged: true, 
        acknowledgedAt: new Date().toISOString() 
      } : a
    ));
    toast.success('Alerta reconocida');
  }, [onAcknowledge]);

  const handleResolve = useCallback((alertId: string) => {
    if (onResolve) {
      onResolve(alertId);
    }
    setLocalAlerts(prev => prev.filter(a => a.id !== alertId));
    toast.success('Alerta resuelta');
  }, [onResolve]);

  const handleEscalate = useCallback((alertId: string) => {
    if (onEscalate) {
      onEscalate(alertId);
    }
    toast.info('Alerta escalada al siguiente nivel');
  }, [onEscalate]);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-600",
              criticalCount > 0 && "animate-pulse"
            )}>
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Alertas en Tiempo Real
                {unacknowledgedCount > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {unacknowledgedCount}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {criticalCount > 0 
                  ? `${criticalCount} alerta(s) crítica(s) pendiente(s)`
                  : 'Sin alertas críticas'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterSeverity(null)}>
                  Todas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterSeverity('critical')}>
                  Solo críticas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterSeverity('error')}>
                  Solo errores
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterSeverity('warning')}>
                  Solo advertencias
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-8 w-8"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground p-4">
              <BellOff className="h-8 w-8 mb-2" />
              <p className="text-sm">No hay alertas activas</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredAlerts.slice(0, maxAlerts).map((alert) => {
                const config = severityConfig[alert.severity];
                const Icon = config.icon;
                
                return (
                  <div 
                    key={alert.id} 
                    className={cn(
                      "p-3 border-l-4 transition-colors hover:bg-muted/30",
                      config.bgClass,
                      !alert.acknowledged && config.pulseClass
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", config.textClass)} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{alert.title}</span>
                            <Badge className={cn("text-xs", config.badgeClass)}>
                              {alert.severity}
                            </Badge>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!alert.acknowledged && (
                                <DropdownMenuItem onClick={() => handleAcknowledge(alert.id)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Reconocer
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleResolve(alert.id)}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Resolver
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEscalate(alert.id)}>
                                <ArrowUp className="h-4 w-4 mr-2" />
                                Escalar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-2">
                          {alert.description}
                        </p>
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(alert.timestamp), { 
                              locale: es, 
                              addSuffix: true 
                            })}
                          </span>
                          <span>•</span>
                          <span>{alert.source}</span>
                          {alert.acknowledged && alert.acknowledgedBy && (
                            <>
                              <span>•</span>
                              <span className="text-green-600">
                                ✓ {alert.acknowledgedBy}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Quick Actions */}
                        {!alert.acknowledged && alert.actions && alert.actions.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            {alert.actions.slice(0, 2).map((action) => (
                              <Button
                                key={action.id}
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => {
                                  if (action.type === 'acknowledge') handleAcknowledge(alert.id);
                                  else if (action.type === 'resolve') handleResolve(alert.id);
                                  else if (action.type === 'escalate') handleEscalate(alert.id);
                                }}
                              >
                                {action.type === 'acknowledge' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {action.type === 'escalate' && <ArrowUp className="h-3 w-3 mr-1" />}
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default RealTimeAlertsPanel;
