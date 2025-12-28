// License Automation Rules - Phase 6
// Enterprise License System 2025

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  RefreshCw, 
  Zap, 
  Plus,
  Settings,
  Bell,
  Mail,
  AlertTriangle,
  Clock,
  Play,
  Pause,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Calendar,
  Activity
} from 'lucide-react';
import { useLicenseReporting, AutomationRule } from '@/hooks/admin/enterprise/useLicenseReporting';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const RULE_TYPES = [
  { value: 'renewal_reminder', label: 'Recordatorio de Renovación', icon: Calendar },
  { value: 'expiration_warning', label: 'Aviso de Expiración', icon: Clock },
  { value: 'usage_alert', label: 'Alerta de Uso', icon: Activity },
  { value: 'anomaly_response', label: 'Respuesta a Anomalías', icon: AlertTriangle },
  { value: 'auto_suspend', label: 'Suspensión Automática', icon: Pause }
] as const;

export function LicenseAutomation() {
  const [activeTab, setActiveTab] = useState('rules');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    ruleName: '',
    ruleType: 'renewal_reminder' as AutomationRule['ruleType'],
    daysBeforeExpiry: 30,
    usageThreshold: 80,
    triggerCount: 3,
    sendEmail: true,
    sendNotification: true,
    suspendLicense: false,
    createTask: true,
    webhookUrl: ''
  });

  const {
    automationRules,
    scheduledNotifications,
    createAutomationRule,
    updateAutomationRule,
    deleteAutomationRule,
    executeAutomationRules
  } = useLicenseReporting();

  // === HANDLERS ===
  const handleCreateRule = useCallback(async () => {
    const newRule = await createAutomationRule({
      ruleName: formData.ruleName,
      ruleType: formData.ruleType,
      isActive: true,
      conditions: {
        daysBeforeExpiry: formData.daysBeforeExpiry,
        usageThreshold: formData.usageThreshold,
        triggerCount: formData.triggerCount
      },
      actions: {
        sendEmail: formData.sendEmail,
        sendNotification: formData.sendNotification,
        suspendLicense: formData.suspendLicense,
        createTask: formData.createTask,
        webhookUrl: formData.webhookUrl || undefined
      }
    });

    if (newRule) {
      setIsCreateDialogOpen(false);
      resetForm();
    }
  }, [formData, createAutomationRule]);

  const handleUpdateRule = useCallback(async () => {
    if (!editingRule) return;

    await updateAutomationRule(editingRule.id, {
      ruleName: formData.ruleName,
      ruleType: formData.ruleType,
      conditions: {
        daysBeforeExpiry: formData.daysBeforeExpiry,
        usageThreshold: formData.usageThreshold,
        triggerCount: formData.triggerCount
      },
      actions: {
        sendEmail: formData.sendEmail,
        sendNotification: formData.sendNotification,
        suspendLicense: formData.suspendLicense,
        createTask: formData.createTask,
        webhookUrl: formData.webhookUrl || undefined
      }
    });

    setEditingRule(null);
    resetForm();
  }, [editingRule, formData, updateAutomationRule]);

  const handleToggleRule = useCallback(async (rule: AutomationRule) => {
    await updateAutomationRule(rule.id, { isActive: !rule.isActive });
  }, [updateAutomationRule]);

  const handleDeleteRule = useCallback(async (ruleId: string) => {
    await deleteAutomationRule(ruleId);
  }, [deleteAutomationRule]);

  const handleExecuteRules = useCallback(async () => {
    setIsExecuting(true);
    const triggeredCount = await executeAutomationRules();
    setIsExecuting(false);
    
    if (triggeredCount > 0) {
      toast.success(`${triggeredCount} regla(s) ejecutada(s)`);
    } else {
      toast.info('No se activaron reglas');
    }
  }, [executeAutomationRules]);

  const handleEditRule = useCallback((rule: AutomationRule) => {
    setEditingRule(rule);
    setFormData({
      ruleName: rule.ruleName,
      ruleType: rule.ruleType,
      daysBeforeExpiry: rule.conditions.daysBeforeExpiry || 30,
      usageThreshold: rule.conditions.usageThreshold || 80,
      triggerCount: rule.conditions.triggerCount || 3,
      sendEmail: rule.actions.sendEmail || false,
      sendNotification: rule.actions.sendNotification || false,
      suspendLicense: rule.actions.suspendLicense || false,
      createTask: rule.actions.createTask || false,
      webhookUrl: rule.actions.webhookUrl || ''
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      ruleName: '',
      ruleType: 'renewal_reminder',
      daysBeforeExpiry: 30,
      usageThreshold: 80,
      triggerCount: 3,
      sendEmail: true,
      sendNotification: true,
      suspendLicense: false,
      createTask: true,
      webhookUrl: ''
    });
  }, []);

  // === RULE TYPE ICON ===
  const getRuleTypeInfo = (type: AutomationRule['ruleType']) => {
    return RULE_TYPES.find(t => t.value === type) || RULE_TYPES[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Automatización
          </h2>
          <p className="text-muted-foreground">
            Reglas automáticas y notificaciones programadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={handleExecuteRules}
            disabled={isExecuting}
          >
            {isExecuting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Ejecutar Reglas
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Regla
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Regla de Automatización</DialogTitle>
                <DialogDescription>
                  Define condiciones y acciones automáticas
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre de la Regla</Label>
                  <Input
                    value={formData.ruleName}
                    onChange={(e) => setFormData(prev => ({ ...prev, ruleName: e.target.value }))}
                    placeholder="Ej: Recordatorio 30 días"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Regla</Label>
                  <Select 
                    value={formData.ruleType} 
                    onValueChange={(value: AutomationRule['ruleType']) => 
                      setFormData(prev => ({ ...prev, ruleType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RULE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Conditional Fields */}
                {(formData.ruleType === 'renewal_reminder' || formData.ruleType === 'expiration_warning') && (
                  <div className="space-y-2">
                    <Label>Días antes de expiración</Label>
                    <Input
                      type="number"
                      value={formData.daysBeforeExpiry}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        daysBeforeExpiry: parseInt(e.target.value) || 30 
                      }))}
                      min={1}
                      max={365}
                    />
                  </div>
                )}

                {formData.ruleType === 'usage_alert' && (
                  <div className="space-y-2">
                    <Label>Umbral de uso (%)</Label>
                    <Input
                      type="number"
                      value={formData.usageThreshold}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        usageThreshold: parseInt(e.target.value) || 80 
                      }))}
                      min={1}
                      max={100}
                    />
                  </div>
                )}

                {formData.ruleType === 'anomaly_response' && (
                  <div className="space-y-2">
                    <Label>Cantidad de anomalías para activar</Label>
                    <Input
                      type="number"
                      value={formData.triggerCount}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        triggerCount: parseInt(e.target.value) || 3 
                      }))}
                      min={1}
                      max={100}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3 pt-2 border-t">
                  <Label className="text-sm font-medium">Acciones</Label>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Enviar email</span>
                    </div>
                    <Switch
                      checked={formData.sendEmail}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, sendEmail: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Notificación in-app</span>
                    </div>
                    <Switch
                      checked={formData.sendNotification}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, sendNotification: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Pause className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Suspender licencia</span>
                    </div>
                    <Switch
                      checked={formData.suspendLicense}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, suspendLicense: checked }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Webhook URL (opcional)</Label>
                    <Input
                      value={formData.webhookUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateRule} disabled={!formData.ruleName}>
                  Crear Regla
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Reglas ({automationRules.length})
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificaciones ({scheduledNotifications.length})
          </TabsTrigger>
        </TabsList>

        {/* Automation Rules */}
        <TabsContent value="rules" className="mt-4">
          {automationRules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Zap className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Sin reglas de automatización</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Crea reglas para automatizar tareas de gestión de licencias
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Regla
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {automationRules.map((rule) => {
                const typeInfo = getRuleTypeInfo(rule.ruleType);
                const TypeIcon = typeInfo.icon;

                return (
                  <Card key={rule.id} className={cn(
                    "transition-all",
                    !rule.isActive && "opacity-60"
                  )}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            rule.isActive ? "bg-primary/10" : "bg-muted"
                          )}>
                            <TypeIcon className={cn(
                              "h-5 w-5",
                              rule.isActive ? "text-primary" : "text-muted-foreground"
                            )} />
                          </div>
                          <div>
                            <CardTitle className="text-base">{rule.ruleName}</CardTitle>
                            <CardDescription>{typeInfo.label}</CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={() => handleToggleRule(rule)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Conditions */}
                      <div className="mb-3 p-2 rounded bg-muted/50 text-sm">
                        <p className="font-medium text-xs text-muted-foreground mb-1">Condiciones:</p>
                        {rule.conditions.daysBeforeExpiry && (
                          <p>• {rule.conditions.daysBeforeExpiry} días antes de expirar</p>
                        )}
                        {rule.conditions.usageThreshold && (
                          <p>• Uso superior al {rule.conditions.usageThreshold}%</p>
                        )}
                        {rule.conditions.triggerCount && (
                          <p>• Después de {rule.conditions.triggerCount} ocurrencias</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {rule.actions.sendEmail && (
                          <Badge variant="secondary" className="text-xs">
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </Badge>
                        )}
                        {rule.actions.sendNotification && (
                          <Badge variant="secondary" className="text-xs">
                            <Bell className="h-3 w-3 mr-1" />
                            Notificación
                          </Badge>
                        )}
                        {rule.actions.suspendLicense && (
                          <Badge variant="destructive" className="text-xs">
                            <Pause className="h-3 w-3 mr-1" />
                            Suspender
                          </Badge>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Ejecutada {rule.triggerCount} veces
                        </span>
                        {rule.lastTriggered && (
                          <span>
                            Última: {formatDistanceToNow(new Date(rule.lastTriggered), { 
                              addSuffix: true, 
                              locale: es 
                            })}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditRule(rule)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Scheduled Notifications */}
        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones Programadas</CardTitle>
              <CardDescription>
                Historial de notificaciones enviadas y pendientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mb-3 opacity-50" />
                  <p>Sin notificaciones programadas</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {scheduledNotifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-full",
                            notification.status === 'sent' ? "bg-green-500/10" :
                            notification.status === 'failed' ? "bg-red-500/10" :
                            "bg-yellow-500/10"
                          )}>
                            {notification.status === 'sent' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : notification.status === 'failed' ? (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{notification.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              {notification.recipient}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            notification.status === 'sent' ? 'default' :
                            notification.status === 'failed' ? 'destructive' :
                            'secondary'
                          }>
                            {notification.status === 'sent' ? 'Enviada' :
                             notification.status === 'failed' ? 'Fallida' :
                             notification.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(notification.scheduledFor), 'dd MMM HH:mm', { locale: es })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Regla</DialogTitle>
            <DialogDescription>
              Modifica la configuración de la regla
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre de la Regla</Label>
              <Input
                value={formData.ruleName}
                onChange={(e) => setFormData(prev => ({ ...prev, ruleName: e.target.value }))}
              />
            </div>
            {/* Same fields as create dialog */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRule(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateRule}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LicenseAutomation;
