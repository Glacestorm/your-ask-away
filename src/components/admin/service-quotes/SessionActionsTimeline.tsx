/**
 * Session Actions Timeline Component
 * Displays a timeline of all actions performed during a remote session
 */

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, Database, FileText, Shield, Wrench, Search, 
  Upload, Key, Play, Square, Camera, Terminal, AlertTriangle,
  AlertCircle, MousePointer, CheckCircle, Clock
} from 'lucide-react';
import { useSessionActionLogger, SessionAction, ActionType, RiskLevel } from '@/hooks/admin/useSessionActionLogger';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SessionActionsTimelineProps {
  sessionId?: string | null;
  showSummary?: boolean;
}

const ACTION_ICONS: Record<ActionType, React.ElementType> = {
  config_change: Settings,
  module_update: Database,
  data_access: FileText,
  data_modification: Database,
  system_repair: Wrench,
  diagnostic_run: Search,
  file_transfer: Upload,
  permission_change: Key,
  session_start: Play,
  session_end: Square,
  screenshot_capture: Camera,
  command_execution: Terminal,
  error_occurred: AlertTriangle,
  warning_raised: AlertCircle,
  user_interaction: MousePointer,
  system_check: CheckCircle,
};

const ACTION_LABELS: Record<ActionType, string> = {
  config_change: 'Cambio de configuración',
  module_update: 'Actualización de módulo',
  data_access: 'Acceso a datos',
  data_modification: 'Modificación de datos',
  system_repair: 'Reparación de sistema',
  diagnostic_run: 'Diagnóstico',
  file_transfer: 'Transferencia de archivo',
  permission_change: 'Cambio de permisos',
  session_start: 'Inicio de sesión',
  session_end: 'Fin de sesión',
  screenshot_capture: 'Captura de pantalla',
  command_execution: 'Ejecución de comando',
  error_occurred: 'Error detectado',
  warning_raised: 'Advertencia',
  user_interaction: 'Interacción de usuario',
  system_check: 'Verificación de sistema',
};

const RISK_COLORS: Record<RiskLevel, string> = {
  low: 'bg-green-500/20 text-green-700 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
  high: 'bg-orange-500/20 text-orange-700 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-700 border-red-500/30',
};

const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Bajo',
  medium: 'Medio',
  high: 'Alto',
  critical: 'Crítico',
};

export function SessionActionsTimeline({ sessionId, showSummary = true }: SessionActionsTimelineProps) {
  const { actions, loading, fetchActions, getSessionSummary } = useSessionActionLogger(sessionId);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const summary = getSessionSummary();

  const formatTime = (date: string) => {
    return format(new Date(date), 'HH:mm:ss', { locale: es });
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {showSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Terminal className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.totalActions}</p>
                <p className="text-xs text-muted-foreground">Acciones totales</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.totalDurationFormatted}</p>
                <p className="text-xs text-muted-foreground">Duración total</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.highRiskActions}</p>
                <p className="text-xs text-muted-foreground">Acciones alto riesgo</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Shield className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.pendingApprovals}</p>
                <p className="text-xs text-muted-foreground">Pendientes aprobación</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline de Acciones</CardTitle>
          <CardDescription>
            Registro cronológico de todas las acciones realizadas durante la sesión
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
            <div className="text-center py-8">
              <Terminal className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay acciones registradas</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
                
                {actions.map((action, index) => {
                  const Icon = ACTION_ICONS[action.action_type] || Terminal;
                  const isFirst = index === 0;
                  const isLast = index === actions.length - 1;
                  
                  return (
                    <div key={action.id} className="relative pl-12 pb-6">
                      {/* Timeline dot */}
                      <div 
                        className={`absolute left-0 w-10 h-10 rounded-full flex items-center justify-center border-2 bg-background ${
                          action.risk_level === 'critical' ? 'border-red-500' :
                          action.risk_level === 'high' ? 'border-orange-500' :
                          action.risk_level === 'medium' ? 'border-yellow-500' :
                          'border-muted'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${
                          action.risk_level === 'critical' ? 'text-red-500' :
                          action.risk_level === 'high' ? 'text-orange-500' :
                          action.risk_level === 'medium' ? 'text-yellow-500' :
                          'text-muted-foreground'
                        }`} />
                      </div>
                      
                      {/* Content */}
                      <Card className="border shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">
                                  {ACTION_LABELS[action.action_type]}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={RISK_COLORS[action.risk_level]}
                                >
                                  {RISK_LABELS[action.risk_level]}
                                </Badge>
                                {action.requires_approval && !action.approved_at && (
                                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-700">
                                    Pendiente aprobación
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {action.description}
                              </p>
                              {action.component_affected && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Componente: <code className="bg-muted px-1 rounded">{action.component_affected}</code>
                                </p>
                              )}
                              {(action.before_state || action.after_state) && (
                                <div className="mt-2 text-xs">
                                  {action.before_state && (
                                    <details className="mb-1">
                                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                        Estado anterior
                                      </summary>
                                      <pre className="mt-1 p-2 rounded bg-muted overflow-auto text-xs">
                                        {JSON.stringify(action.before_state, null, 2)}
                                      </pre>
                                    </details>
                                  )}
                                  {action.after_state && (
                                    <details>
                                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                        Estado posterior
                                      </summary>
                                      <pre className="mt-1 p-2 rounded bg-muted overflow-auto text-xs">
                                        {JSON.stringify(action.after_state, null, 2)}
                                      </pre>
                                    </details>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-right text-sm">
                              <p className="font-mono text-muted-foreground">
                                {formatTime(action.created_at)}
                              </p>
                              {action.duration_ms && (
                                <p className="text-xs text-muted-foreground">
                                  {formatDuration(action.duration_ms)}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
