import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RuleAction } from '../types';
import { Plus, Trash2, Play, GripVertical, Mail, Bell, Database, Webhook, UserCheck, RefreshCw } from 'lucide-react';

interface ActionBuilderProps {
  actions: RuleAction[];
  onChange: (actions: RuleAction[]) => void;
}

const ACTION_TYPES = [
  { value: 'send_email', label: 'Enviar Email', icon: Mail },
  { value: 'send_notification', label: 'Enviar Notificación', icon: Bell },
  { value: 'create_record', label: 'Crear Registro', icon: Database },
  { value: 'update_record', label: 'Actualizar Registro', icon: RefreshCw },
  { value: 'call_webhook', label: 'Llamar Webhook', icon: Webhook },
  { value: 'assign_user', label: 'Asignar Usuario', icon: UserCheck },
  { value: 'execute_rule', label: 'Ejecutar Otra Regla', icon: Play },
];

export const ActionBuilder: React.FC<ActionBuilderProps> = ({ actions, onChange }) => {
  const addAction = (type: RuleAction['type']) => {
    onChange([
      ...actions,
      {
        id: `action_${Date.now()}`,
        type,
        config: {},
        order: actions.length,
      },
    ]);
  };

  const updateAction = (index: number, updates: Partial<RuleAction>) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    onChange(newActions);
  };

  const removeAction = (index: number) => {
    onChange(actions.filter((_, i) => i !== index));
  };

  const renderActionConfig = (action: RuleAction, index: number) => {
    switch (action.type) {
      case 'send_email':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Destinatario</Label>
              <Input
                placeholder="email@ejemplo.com o {{data.email}}"
                value={action.config?.to || ''}
                onChange={(e) => updateAction(index, { config: { ...action.config, to: e.target.value } })}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Asunto</Label>
              <Input
                placeholder="Asunto del email"
                value={action.config?.subject || ''}
                onChange={(e) => updateAction(index, { config: { ...action.config, subject: e.target.value } })}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Contenido</Label>
              <Textarea
                placeholder="Cuerpo del email. Usa {{campo}} para variables."
                value={action.config?.body || ''}
                onChange={(e) => updateAction(index, { config: { ...action.config, body: e.target.value } })}
                className="text-sm min-h-[80px]"
              />
            </div>
          </div>
        );

      case 'send_notification':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Usuario destinatario</Label>
              <Input
                placeholder="user_id o {{data.assigned_to}}"
                value={action.config?.user_id || ''}
                onChange={(e) => updateAction(index, { config: { ...action.config, user_id: e.target.value } })}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Título</Label>
              <Input
                placeholder="Título de la notificación"
                value={action.config?.title || ''}
                onChange={(e) => updateAction(index, { config: { ...action.config, title: e.target.value } })}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Mensaje</Label>
              <Textarea
                placeholder="Mensaje de la notificación"
                value={action.config?.message || ''}
                onChange={(e) => updateAction(index, { config: { ...action.config, message: e.target.value } })}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Severidad</Label>
              <Select
                value={action.config?.severity || 'info'}
                onValueChange={(value) => updateAction(index, { config: { ...action.config, severity: value } })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'create_record':
      case 'update_record':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Tabla</Label>
              <Select
                value={action.config?.table || ''}
                onValueChange={(value) => updateAction(index, { config: { ...action.config, table: value } })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Seleccionar tabla" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="companies">Empresas</SelectItem>
                  <SelectItem value="visits">Visitas</SelectItem>
                  <SelectItem value="notifications">Notificaciones</SelectItem>
                  <SelectItem value="ai_task_queue">Tareas IA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {action.type === 'update_record' && (
              <div>
                <Label className="text-xs">ID del Registro</Label>
                <Input
                  placeholder="{{data.id}} o ID específico"
                  value={action.config?.record_id || ''}
                  onChange={(e) => updateAction(index, { config: { ...action.config, record_id: e.target.value } })}
                  className="text-sm"
                />
              </div>
            )}
            <div>
              <Label className="text-xs">Datos (JSON)</Label>
              <Textarea
                placeholder='{"campo": "{{data.valor}}", "estado": "nuevo"}'
                value={action.config?.data || ''}
                onChange={(e) => updateAction(index, { config: { ...action.config, data: e.target.value } })}
                className="text-sm font-mono min-h-[80px]"
              />
            </div>
          </div>
        );

      case 'call_webhook':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">URL</Label>
              <Input
                placeholder="https://api.ejemplo.com/webhook"
                value={action.config?.url || ''}
                onChange={(e) => updateAction(index, { config: { ...action.config, url: e.target.value } })}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Método</Label>
              <Select
                value={action.config?.method || 'POST'}
                onValueChange={(value) => updateAction(index, { config: { ...action.config, method: value } })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Body (JSON)</Label>
              <Textarea
                placeholder='{"data": {{json_data}}}'
                value={action.config?.body || ''}
                onChange={(e) => updateAction(index, { config: { ...action.config, body: e.target.value } })}
                className="text-sm font-mono min-h-[60px]"
              />
            </div>
          </div>
        );

      case 'assign_user':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Tabla del Registro</Label>
              <Select
                value={action.config?.table || ''}
                onValueChange={(value) => updateAction(index, { config: { ...action.config, table: value } })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Seleccionar tabla" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="companies">Empresas</SelectItem>
                  <SelectItem value="visits">Visitas</SelectItem>
                  <SelectItem value="ai_task_queue">Tareas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">ID del Registro</Label>
              <Input
                placeholder="{{data.id}}"
                value={action.config?.record_id || ''}
                onChange={(e) => updateAction(index, { config: { ...action.config, record_id: e.target.value } })}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Campo de Usuario</Label>
              <Input
                placeholder="gestor_id, assigned_to, etc."
                value={action.config?.user_field || ''}
                onChange={(e) => updateAction(index, { config: { ...action.config, user_field: e.target.value } })}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Usuario a Asignar</Label>
              <Input
                placeholder="user_id o {{data.manager_id}}"
                value={action.config?.user_id || ''}
                onChange={(e) => updateAction(index, { config: { ...action.config, user_id: e.target.value } })}
                className="text-sm"
              />
            </div>
          </div>
        );

      case 'execute_rule':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">ID de la Regla</Label>
              <Input
                placeholder="rule_id o rule_key"
                value={action.config?.rule_id || ''}
                onChange={(e) => updateAction(index, { config: { ...action.config, rule_id: e.target.value } })}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Datos de Entrada (JSON)</Label>
              <Textarea
                placeholder='{"inherited": {{json_data}}}'
                value={action.config?.input_data || ''}
                onChange={(e) => updateAction(index, { config: { ...action.config, input_data: e.target.value } })}
                className="text-sm font-mono min-h-[60px]"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Play className="h-5 w-5 text-green-500" />
            Acciones (THEN)
          </span>
          <Select onValueChange={(value) => addAction(value as RuleAction['type'])}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Añadir acción" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {type.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">Sin acciones definidas</p>
            <p className="text-xs mt-1">Añade acciones que se ejecutarán cuando se cumplan las condiciones</p>
          </div>
        ) : (
          actions.map((action, index) => {
            const actionType = ACTION_TYPES.find(t => t.value === action.type);
            const Icon = actionType?.icon || Play;
            
            return (
              <div key={action.id} className="border rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 p-3 bg-muted/50 border-b">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm flex-1">{actionType?.label}</span>
                  <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAction(index)}
                    className="h-7 w-7 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-3">
                  {renderActionConfig(action, index)}
                </div>
              </div>
            );
          })
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            💡 Usa <code className="bg-muted px-1 rounded">{'{{campo}}'}</code> para insertar valores dinámicos del trigger
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
