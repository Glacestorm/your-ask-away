/**
 * ModuleAlertsConfigPanel - Sistema de alertas configurables
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Bell, 
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle,
  Mail,
  MessageSquare,
  Webhook,
  Activity,
  Clock,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ModuleAlertsConfigPanelProps {
  className?: string;
}

interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  metric: 'health' | 'response_time' | 'error_rate' | 'cpu' | 'memory';
  condition: 'above' | 'below' | 'equals';
  threshold: number;
  duration: number; // minutes
  severity: 'info' | 'warning' | 'critical';
  channels: ('email' | 'slack' | 'webhook')[];
  moduleKey?: string; // null = all modules
  lastTriggered?: string;
  triggeredCount: number;
}

const defaultRules: AlertRule[] = [
  {
    id: '1',
    name: 'Health Crítico',
    enabled: true,
    metric: 'health',
    condition: 'below',
    threshold: 80,
    duration: 5,
    severity: 'critical',
    channels: ['email', 'slack'],
    triggeredCount: 2,
    lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    name: 'Response Time Alto',
    enabled: true,
    metric: 'response_time',
    condition: 'above',
    threshold: 500,
    duration: 3,
    severity: 'warning',
    channels: ['slack'],
    triggeredCount: 5,
    lastTriggered: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    name: 'Error Rate Elevado',
    enabled: true,
    metric: 'error_rate',
    condition: 'above',
    threshold: 5,
    duration: 5,
    severity: 'critical',
    channels: ['email', 'slack', 'webhook'],
    triggeredCount: 0
  },
  {
    id: '4',
    name: 'CPU Alto',
    enabled: false,
    metric: 'cpu',
    condition: 'above',
    threshold: 80,
    duration: 10,
    severity: 'warning',
    channels: ['slack'],
    triggeredCount: 12,
    lastTriggered: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];

const metricLabels: Record<AlertRule['metric'], string> = {
  health: 'Health (%)',
  response_time: 'Response Time (ms)',
  error_rate: 'Error Rate (%)',
  cpu: 'CPU (%)',
  memory: 'Memory (%)'
};

const conditionLabels: Record<AlertRule['condition'], string> = {
  above: 'Mayor que',
  below: 'Menor que',
  equals: 'Igual a'
};

export function ModuleAlertsConfigPanel({ className }: ModuleAlertsConfigPanelProps) {
  const [rules, setRules] = useState<AlertRule[]>(defaultRules);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [formData, setFormData] = useState<Partial<AlertRule>>({
    name: '',
    enabled: true,
    metric: 'health',
    condition: 'below',
    threshold: 80,
    duration: 5,
    severity: 'warning',
    channels: ['email']
  });

  const handleSaveRule = () => {
    if (editingRule) {
      setRules(prev => prev.map(r => 
        r.id === editingRule.id 
          ? { ...r, ...formData } as AlertRule
          : r
      ));
      toast.success('Regla actualizada');
    } else {
      const newRule: AlertRule = {
        id: Date.now().toString(),
        name: formData.name || 'Nueva Regla',
        enabled: formData.enabled ?? true,
        metric: formData.metric || 'health',
        condition: formData.condition || 'below',
        threshold: formData.threshold || 80,
        duration: formData.duration || 5,
        severity: formData.severity || 'warning',
        channels: formData.channels || ['email'],
        triggeredCount: 0
      };
      setRules(prev => [...prev, newRule]);
      toast.success('Regla creada');
    }
    resetForm();
  };

  const handleDeleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success('Regla eliminada');
  };

  const handleToggleRule = (id: string) => {
    setRules(prev => prev.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      enabled: true,
      metric: 'health',
      condition: 'below',
      threshold: 80,
      duration: 5,
      severity: 'warning',
      channels: ['email']
    });
    setEditingRule(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (rule: AlertRule) => {
    setEditingRule(rule);
    setFormData(rule);
    setIsDialogOpen(true);
  };

  const getSeverityColor = (severity: AlertRule['severity']) => {
    switch (severity) {
      case 'info': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-destructive';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-3 w-3" />;
      case 'slack': return <MessageSquare className="h-3 w-3" />;
      case 'webhook': return <Webhook className="h-3 w-3" />;
      default: return null;
    }
  };

  const toggleChannel = (channel: 'email' | 'slack' | 'webhook') => {
    const current = formData.channels || [];
    if (current.includes(channel)) {
      setFormData({ ...formData, channels: current.filter(c => c !== channel) });
    } else {
      setFormData({ ...formData, channels: [...current, channel] });
    }
  };

  const activeRules = rules.filter(r => r.enabled).length;
  const recentTriggers = rules.filter(r => r.lastTriggered).length;

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-amber-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Sistema de Alertas</CardTitle>
              <p className="text-xs text-muted-foreground">
                {activeRules} reglas activas • {recentTriggers} disparadas recientemente
              </p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nueva Regla
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingRule ? 'Editar Regla' : 'Nueva Regla de Alerta'}</DialogTitle>
                <DialogDescription>
                  Configura cuándo y cómo recibir notificaciones
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre de la Regla</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Health Crítico"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Métrica</Label>
                    <Select
                      value={formData.metric}
                      onValueChange={(v) => setFormData({ ...formData, metric: v as AlertRule['metric'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="health">Health (%)</SelectItem>
                        <SelectItem value="response_time">Response Time (ms)</SelectItem>
                        <SelectItem value="error_rate">Error Rate (%)</SelectItem>
                        <SelectItem value="cpu">CPU (%)</SelectItem>
                        <SelectItem value="memory">Memory (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Condición</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(v) => setFormData({ ...formData, condition: v as AlertRule['condition'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="above">Mayor que</SelectItem>
                        <SelectItem value="below">Menor que</SelectItem>
                        <SelectItem value="equals">Igual a</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Umbral</Label>
                    <Input
                      type="number"
                      value={formData.threshold}
                      onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Duración (min)</Label>
                    <Input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })}
                      min={1}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Severidad</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(v) => setFormData({ ...formData, severity: v as AlertRule['severity'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Canales de Notificación</Label>
                  <div className="flex gap-2">
                    {(['email', 'slack', 'webhook'] as const).map((channel) => (
                      <Button
                        key={channel}
                        variant={formData.channels?.includes(channel) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleChannel(channel)}
                        className="flex-1"
                      >
                        {getChannelIcon(channel)}
                        <span className="ml-1 capitalize">{channel}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Label>Regla Activa</Label>
                  <Switch
                    checked={formData.enabled}
                    onCheckedChange={(v) => setFormData({ ...formData, enabled: v })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button onClick={handleSaveRule}>
                  {editingRule ? 'Guardar Cambios' : 'Crear Regla'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {rules.map((rule) => (
              <div 
                key={rule.id}
                className={cn(
                  "p-4 rounded-lg border bg-card transition-colors",
                  !rule.enabled && "opacity-50"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => handleToggleRule(rule.id)}
                    />
                    <span className="font-medium">{rule.name}</span>
                    <Badge className={cn("text-xs text-white", getSeverityColor(rule.severity))}>
                      {rule.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(rule)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {metricLabels[rule.metric]}
                  </span>
                  <span>{conditionLabels[rule.condition]} {rule.threshold}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {rule.duration} min
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {rule.channels.map((channel) => (
                      <Badge key={channel} variant="outline" className="text-xs">
                        {getChannelIcon(channel)}
                        <span className="ml-1 capitalize">{channel}</span>
                      </Badge>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {rule.triggeredCount > 0 ? (
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        {rule.triggeredCount} veces
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-500">
                        <CheckCircle className="h-3 w-3" />
                        Sin disparos
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default ModuleAlertsConfigPanel;
