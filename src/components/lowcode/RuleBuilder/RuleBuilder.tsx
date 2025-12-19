import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TriggerEditor } from './TriggerEditor';
import { ConditionBuilder } from './ConditionBuilder';
import { ActionBuilder } from './ActionBuilder';
import { useLowCodeRules, useRuleExecutions } from '@/hooks/lowcode/useLowCodeRules';
import { LowCodeRule, RuleTrigger, RuleCondition, RuleAction } from '../types';
import { Save, Play, History, Settings, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface RuleBuilderProps {
  ruleId?: string;
  moduleId?: string;
  onSave?: (rule: LowCodeRule) => void;
  onClose?: () => void;
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({
  ruleId,
  moduleId,
  onSave,
  onClose,
}) => {
  const { rules, createRule, updateRule, executeRule } = useLowCodeRules(moduleId);
  const { data: executions } = useRuleExecutions(ruleId);
  
  const existingRule = rules.find(r => r.id === ruleId);
  
  const [ruleName, setRuleName] = useState('Nueva Regla');
  const [ruleKey, setRuleKey] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState(0);
  const [trigger, setTrigger] = useState<RuleTrigger>({ type: 'manual', config: {} });
  const [conditions, setConditions] = useState<RuleCondition[]>([]);
  const [actions, setActions] = useState<RuleAction[]>([]);

  useEffect(() => {
    if (existingRule) {
      setRuleName(existingRule.rule_name);
      setRuleKey(existingRule.rule_key);
      setDescription(existingRule.description || '');
      setIsActive(existingRule.is_active);
      setPriority(existingRule.priority);
      setTrigger(existingRule.trigger_config);
      setConditions(existingRule.conditions);
      setActions(existingRule.actions);
    } else {
      setRuleKey(`rule_${Date.now()}`);
    }
  }, [existingRule]);

  const handleSave = async () => {
    if (!ruleName.trim()) {
      toast.error('El nombre de la regla es requerido');
      return;
    }

    if (actions.length === 0) {
      toast.error('Debe definir al menos una acción');
      return;
    }

    const ruleData: Partial<LowCodeRule> = {
      rule_name: ruleName,
      rule_key: ruleKey,
      description,
      module_id: moduleId,
      trigger_type: trigger.type,
      trigger_config: trigger,
      conditions,
      actions,
      is_active: isActive,
      priority,
    };

    try {
      if (ruleId) {
        await updateRule.mutateAsync({ id: ruleId, ...ruleData });
      } else {
        await createRule.mutateAsync(ruleData);
      }
      onSave?.(ruleData as LowCodeRule);
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const handleTestRule = async () => {
    if (!ruleId) {
      toast.error('Guarda la regla primero para poder probarla');
      return;
    }
    
    executeRule.mutate({ ruleId, inputData: { test: true } });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-yellow-500" />
          <div>
            <h2 className="text-lg font-semibold">
              {ruleId ? 'Editar Regla' : 'Nueva Regla'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Constructor visual de automatizaciones
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ruleId && (
            <Button
              variant="outline"
              onClick={handleTestRule}
              disabled={executeRule.isPending}
            >
              <Play className="h-4 w-4 mr-2" />
              Probar
            </Button>
          )}
          <Button onClick={handleSave} disabled={createRule.isPending || updateRule.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="builder" className="h-full">
          <div className="border-b px-4">
            <TabsList className="h-10">
              <TabsTrigger value="builder" className="gap-2">
                <Zap className="h-4 w-4" />
                Constructor
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Configuración
              </TabsTrigger>
              {ruleId && (
                <TabsTrigger value="history" className="gap-2">
                  <History className="h-4 w-4" />
                  Historial
                  {executions && executions.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {executions.length}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="builder" className="p-4 space-y-4 m-0">
            {/* Trigger */}
            <TriggerEditor trigger={trigger} onChange={setTrigger} />

            {/* Conditions */}
            <ConditionBuilder conditions={conditions} onChange={setConditions} />

            {/* Actions */}
            <ActionBuilder actions={actions} onChange={setActions} />
          </TabsContent>

          <TabsContent value="settings" className="p-4 m-0">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de la Regla</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre de la Regla</Label>
                    <Input
                      value={ruleName}
                      onChange={(e) => setRuleName(e.target.value)}
                      placeholder="Mi regla de automatización"
                    />
                  </div>
                  <div>
                    <Label>Clave Única</Label>
                    <Input
                      value={ruleKey}
                      onChange={(e) => setRuleKey(e.target.value)}
                      placeholder="rule_key"
                      className="font-mono"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe qué hace esta regla..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Prioridad</Label>
                    <Input
                      type="number"
                      value={priority}
                      onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                      min={0}
                      max={100}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Mayor número = mayor prioridad
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Estado</Label>
                      <p className="text-sm text-muted-foreground">
                        {isActive ? 'Regla activa' : 'Regla inactiva'}
                      </p>
                    </div>
                    <Switch
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {ruleId && (
            <TabsContent value="history" className="p-4 m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Ejecuciones</CardTitle>
                </CardHeader>
                <CardContent>
                  {executions && executions.length > 0 ? (
                    <div className="space-y-2">
                      {executions.map((exec) => (
                        <div
                          key={exec.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={exec.status === 'success' ? 'default' : 'destructive'}
                            >
                              {exec.status}
                            </Badge>
                            <span className="text-sm">
                              {format(new Date(exec.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {exec.execution_time_ms && (
                              <span>{exec.execution_time_ms}ms</span>
                            )}
                            {exec.triggered_by && (
                              <span>por {exec.triggered_by}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      No hay ejecuciones registradas
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};
