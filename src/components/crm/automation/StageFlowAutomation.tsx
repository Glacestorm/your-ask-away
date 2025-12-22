import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Zap, 
  ArrowRight, 
  Mail, 
  MessageSquare, 
  UserPlus, 
  Clock, 
  Bell,
  Plus,
  Trash2,
  Settings,
  Play,
  Pause
} from 'lucide-react';

export interface StageFlow {
  id: string;
  name: string;
  fromStage: string;
  toStage: string;
  actions: FlowAction[];
  conditions: FlowCondition[];
  isActive: boolean;
  executionCount: number;
  lastExecuted?: string;
}

export interface FlowAction {
  id: string;
  type: 'email' | 'whatsapp' | 'notification' | 'assign' | 'delay' | 'webhook';
  config: Record<string, any>;
}

export interface FlowCondition {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less';
  value: string;
}

interface StageFlowAutomationProps {
  stages: { id: string; name: string; color: string }[];
  flows: StageFlow[];
  onCreateFlow?: (flow: Omit<StageFlow, 'id' | 'executionCount'>) => void;
  onUpdateFlow?: (id: string, updates: Partial<StageFlow>) => void;
  onDeleteFlow?: (id: string) => void;
  onToggleFlow?: (id: string, isActive: boolean) => void;
}

const actionIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  whatsapp: <MessageSquare className="h-4 w-4" />,
  notification: <Bell className="h-4 w-4" />,
  assign: <UserPlus className="h-4 w-4" />,
  delay: <Clock className="h-4 w-4" />,
  webhook: <Zap className="h-4 w-4" />
};

const actionLabels: Record<string, string> = {
  email: 'Enviar Email',
  whatsapp: 'Enviar WhatsApp',
  notification: 'Notificación',
  assign: 'Reasignar',
  delay: 'Esperar',
  webhook: 'Webhook'
};

export const StageFlowAutomation: React.FC<StageFlowAutomationProps> = ({
  stages,
  flows,
  onCreateFlow,
  onUpdateFlow,
  onDeleteFlow,
  onToggleFlow
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFlow, setNewFlow] = useState<Partial<StageFlow>>({
    name: '',
    fromStage: '',
    toStage: '',
    actions: [],
    conditions: [],
    isActive: true
  });

  const handleAddAction = (type: FlowAction['type']) => {
    const action: FlowAction = {
      id: `action-${Date.now()}`,
      type,
      config: {}
    };
    setNewFlow(prev => ({
      ...prev,
      actions: [...(prev.actions || []), action]
    }));
  };

  const handleRemoveAction = (actionId: string) => {
    setNewFlow(prev => ({
      ...prev,
      actions: (prev.actions || []).filter(a => a.id !== actionId)
    }));
  };

  const handleCreateFlow = () => {
    if (newFlow.name && newFlow.fromStage && newFlow.toStage && onCreateFlow) {
      onCreateFlow({
        name: newFlow.name,
        fromStage: newFlow.fromStage,
        toStage: newFlow.toStage,
        actions: newFlow.actions || [],
        conditions: newFlow.conditions || [],
        isActive: true
      });
      setNewFlow({
        name: '',
        fromStage: '',
        toStage: '',
        actions: [],
        conditions: [],
        isActive: true
      });
      setIsCreating(false);
    }
  };

  const getStageById = (id: string) => stages.find(s => s.id === id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Flujos Automáticos</h2>
          <p className="text-muted-foreground">
            Automatiza acciones cuando los leads cambian de etapa
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Flujo
        </Button>
      </div>

      {/* Create Flow Form */}
      {isCreating && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Crear Nuevo Flujo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Flujo</Label>
                <Input
                  placeholder="Ej: Bienvenida a Calificados"
                  value={newFlow.name}
                  onChange={(e) => setNewFlow(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Desde Etapa</Label>
                <Select
                  value={newFlow.fromStage}
                  onValueChange={(v) => setNewFlow(prev => ({ ...prev, fromStage: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map(stage => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hacia Etapa</Label>
                <Select
                  value={newFlow.toStage}
                  onValueChange={(v) => setNewFlow(prev => ({ ...prev, toStage: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map(stage => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Label>Acciones a Ejecutar</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(actionLabels).map(([type, label]) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddAction(type as FlowAction['type'])}
                    className="gap-2"
                  >
                    {actionIcons[type]}
                    {label}
                  </Button>
                ))}
              </div>
              
              {/* Selected Actions */}
              {newFlow.actions && newFlow.actions.length > 0 && (
                <div className="space-y-2 mt-4">
                  {newFlow.actions.map((action, index) => (
                    <div 
                      key={action.id}
                      className="flex items-center gap-3 p-3 bg-background rounded-lg border"
                    >
                      <span className="text-sm text-muted-foreground">{index + 1}.</span>
                      <div className="flex items-center gap-2 flex-1">
                        {actionIcons[action.type]}
                        <span className="font-medium">{actionLabels[action.type]}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAction(action.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateFlow} disabled={!newFlow.name || !newFlow.fromStage || !newFlow.toStage}>
                Crear Flujo
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Flows */}
      <div className="grid gap-4">
        {flows.map(flow => {
          const fromStage = getStageById(flow.fromStage);
          const toStage = getStageById(flow.toStage);
          
          return (
            <Card key={flow.id} className={!flow.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{flow.name}</h3>
                        <Badge variant={flow.isActive ? 'default' : 'secondary'}>
                          {flow.isActive ? 'Activo' : 'Pausado'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        {fromStage && (
                          <Badge 
                            variant="outline" 
                            style={{ borderColor: fromStage.color, color: fromStage.color }}
                          >
                            {fromStage.name}
                          </Badge>
                        )}
                        <ArrowRight className="h-4 w-4" />
                        {toStage && (
                          <Badge 
                            variant="outline"
                            style={{ borderColor: toStage.color, color: toStage.color }}
                          >
                            {toStage.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Actions Preview */}
                    <div className="flex items-center gap-1">
                      {flow.actions.map((action, idx) => (
                        <div 
                          key={action.id}
                          className="p-1.5 rounded bg-muted"
                          title={actionLabels[action.type]}
                        >
                          {actionIcons[action.type]}
                        </div>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="text-right text-sm">
                      <div className="font-medium">{flow.executionCount} ejecuciones</div>
                      {flow.lastExecuted && (
                        <div className="text-muted-foreground">
                          Última: {new Date(flow.lastExecuted).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={flow.isActive}
                        onCheckedChange={(checked) => onToggleFlow?.(flow.id, checked)}
                      />
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => onDeleteFlow?.(flow.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {flows.length === 0 && !isCreating && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Sin flujos automáticos</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primer flujo para automatizar acciones cuando los leads cambien de etapa
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Flujo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
