/**
 * CopilotAutomationsPanel - Panel de Automatizaciones 2026
 * Gestión de reglas de automatización, workflows y ahorro de tiempo
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  Zap, 
  Clock, 
  PlayCircle,
  PauseCircle,
  Settings,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Mail,
  Calendar,
  Bell,
  FileText,
  Users,
  RefreshCw,
  TrendingUp,
  Sparkles,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AutomationRule, CopilotMetrics2026 } from '@/hooks/useRoleCopilot2026';

interface CopilotAutomationsPanelProps {
  automationRules?: AutomationRule[];
  metrics?: CopilotMetrics2026 | null;
  onToggleRule?: (ruleId: string, enabled: boolean) => void;
  onDeleteRule?: (ruleId: string) => void;
  onCreateRule?: () => void;
  isLoading?: boolean;
}

// Mock automation rules
const MOCK_RULES: AutomationRule[] = [
  { 
    id: '1', 
    trigger: 'Cliente sin contacto > 30 días', 
    action: 'Enviar email de seguimiento',
    isActive: true,
    executionCount: 145,
  },
  { 
    id: '2', 
    trigger: 'Nueva oportunidad > €10k', 
    action: 'Crear tarea de llamada prioritaria',
    isActive: true,
    executionCount: 38,
  },
  { 
    id: '3', 
    trigger: 'Propuesta sin respuesta > 5 días', 
    action: 'Enviar recordatorio automático',
    isActive: true,
    executionCount: 67,
  },
  { 
    id: '4', 
    trigger: 'Churn score > 70%', 
    action: 'Alertar y programar visita retención',
    isActive: true,
    executionCount: 23,
  },
  { 
    id: '5', 
    trigger: 'Cierre de oportunidad', 
    action: 'Actualizar pipeline y notificar equipo',
    isActive: false,
    executionCount: 89,
  },
];

// Mock suggested automations
const SUGGESTED_AUTOMATIONS = [
  {
    id: 'sug-1',
    name: 'Follow-up post-reunión',
    description: 'Enviar resumen y siguientes pasos automáticamente después de cada reunión',
    timeSaved: 15,
    confidence: 92,
  },
  {
    id: 'sug-2',
    name: 'Calificación automática leads',
    description: 'Asignar score a nuevos leads basado en criterios definidos',
    timeSaved: 20,
    confidence: 88,
  },
  {
    id: 'sug-3',
    name: 'Informe semanal automático',
    description: 'Generar y enviar resumen de actividad cada viernes',
    timeSaved: 30,
    confidence: 95,
  },
];

// Mock execution history
const EXECUTION_HISTORY = [
  { 
    id: '1', 
    ruleName: 'Email seguimiento', 
    entity: 'TechCorp S.L.', 
    executedAt: '2026-01-26T10:30:00', 
    status: 'success' 
  },
  { 
    id: '2', 
    ruleName: 'Tarea prioritaria', 
    entity: 'InnovateLabs', 
    executedAt: '2026-01-26T09:15:00', 
    status: 'success' 
  },
  { 
    id: '3', 
    ruleName: 'Recordatorio propuesta', 
    entity: 'GlobalServices', 
    executedAt: '2026-01-26T08:00:00', 
    status: 'success' 
  },
  { 
    id: '4', 
    ruleName: 'Alerta churn', 
    entity: 'RetailMax', 
    executedAt: '2026-01-25T16:45:00', 
    status: 'success' 
  },
];

export function CopilotAutomationsPanel({
  automationRules = MOCK_RULES,
  metrics,
  onToggleRule,
  onDeleteRule,
  onCreateRule,
  isLoading,
}: CopilotAutomationsPanelProps) {
  const [showHistory, setShowHistory] = useState(false);

  const totalExecutions = automationRules.reduce((sum, r) => sum + r.executionCount, 0);
  const activeRules = automationRules.filter(r => r.isActive).length;
  const estimatedTimeSaved = metrics?.timeSavedMinutes || totalExecutions * 5;

  const getActionIcon = (action: string) => {
    if (action.toLowerCase().includes('email')) return Mail;
    if (action.toLowerCase().includes('tarea') || action.toLowerCase().includes('llamada')) return Calendar;
    if (action.toLowerCase().includes('alerta') || action.toLowerCase().includes('notificar')) return Bell;
    if (action.toLowerCase().includes('actualizar')) return RefreshCw;
    return Zap;
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-[400px] bg-muted/50" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Bot className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeRules}</p>
                <p className="text-xs text-muted-foreground">Reglas activas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalExecutions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Ejecuciones totales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(estimatedTimeSaved / 60)}h</p>
                <p className="text-xs text-muted-foreground">Tiempo ahorrado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">+{metrics?.productivityGain || 23}%</p>
                <p className="text-xs text-muted-foreground">Productividad</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Rules */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Reglas de Automatización
              </CardTitle>
              <Button size="sm" onClick={onCreateRule} className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Regla
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px]">
              <div className="space-y-3">
                {automationRules.map((rule) => {
                  const ActionIcon = getActionIcon(rule.action);
                  return (
                    <div 
                      key={rule.id}
                      className={cn(
                        "p-4 rounded-lg border transition-all",
                        rule.isActive ? "bg-card" : "bg-muted/30 opacity-60"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={cn(
                            "p-2 rounded-lg",
                            rule.isActive ? "bg-primary/10" : "bg-muted"
                          )}>
                            <ActionIcon className={cn(
                              "h-5 w-5",
                              rule.isActive ? "text-primary" : "text-muted-foreground"
                            )} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{rule.trigger}</span>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{rule.action}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                {rule.executionCount} ejecuciones
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                ~{rule.executionCount * 5} min ahorrados
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={(checked) => onToggleRule?.(rule.id, checked)}
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => onDeleteRule?.(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Suggested Automations */}
          <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Sugerencias IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[180px]">
                <div className="space-y-3">
                  {SUGGESTED_AUTOMATIONS.map((suggestion) => (
                    <div 
                      key={suggestion.id}
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{suggestion.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {suggestion.description}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs ml-2">
                          {suggestion.confidence}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          ~{suggestion.timeSaved} min/día
                        </span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          Activar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Executions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Ejecuciones Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[140px]">
                <div className="space-y-2">
                  {EXECUTION_HISTORY.map((execution) => (
                    <div 
                      key={execution.id}
                      className="flex items-center gap-2 py-2 border-b last:border-0"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                          <span className="font-medium">{execution.ruleName}</span>
                          <span className="text-muted-foreground"> → {execution.entity}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(execution.executedAt), { locale: es, addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Productivity Impact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Impacto en Productividad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tareas automatizadas</span>
                <span className="font-medium">{totalExecutions} / {totalExecutions + 200}</span>
              </div>
              <Progress value={(totalExecutions / (totalExecutions + 200)) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Potencial de automatización restante: ~200 tareas/mes
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tiempo recuperado</span>
                <span className="font-medium">{Math.round(estimatedTimeSaved / 60)}h / 40h potencial</span>
              </div>
              <Progress value={(estimatedTimeSaved / 60 / 40) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Equivalente a {Math.round(estimatedTimeSaved / 60 / 8)} días laborables
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ROI automatización</span>
                <span className="font-medium text-green-600">€{(estimatedTimeSaved * 0.5).toLocaleString()}</span>
              </div>
              <Progress value={75} className="h-2 bg-green-500/20 [&>div]:bg-green-500" />
              <p className="text-xs text-muted-foreground">
                Basado en coste hora €30
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CopilotAutomationsPanel;
