import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RuleCondition, ConditionOperator } from '../types';
import { Plus, Trash2, GitBranch } from 'lucide-react';

interface ConditionBuilderProps {
  conditions: RuleCondition[];
  onChange: (conditions: RuleCondition[]) => void;
}

const OPERATORS = [
  { value: 'equals', label: 'Igual a' },
  { value: 'not_equals', label: 'Diferente de' },
  { value: 'contains', label: 'Contiene' },
  { value: 'not_contains', label: 'No contiene' },
  { value: 'starts_with', label: 'Empieza con' },
  { value: 'ends_with', label: 'Termina con' },
  { value: 'greater_than', label: 'Mayor que' },
  { value: 'less_than', label: 'Menor que' },
  { value: 'greater_or_equal', label: 'Mayor o igual' },
  { value: 'less_or_equal', label: 'Menor o igual' },
  { value: 'is_empty', label: 'Está vacío' },
  { value: 'is_not_empty', label: 'No está vacío' },
  { value: 'in', label: 'En lista' },
  { value: 'not_in', label: 'No en lista' },
  { value: 'regex', label: 'Expresión regular' },
];

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({ conditions, onChange }) => {
  const addCondition = () => {
    onChange([
      ...conditions,
      {
        id: `cond_${Date.now()}`,
        field: '',
        operator: 'equals',
        value: '',
        logic: conditions.length > 0 ? 'AND' : undefined,
      },
    ]);
  };

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates } as RuleCondition;
    onChange(newConditions);
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    // Actualizar la lógica del primer elemento
    if (newConditions.length > 0 && newConditions[0].logicalOperator) {
      newConditions[0] = { ...newConditions[0], logicalOperator: undefined };
    }
    onChange(newConditions);
  };

  const toggleLogic = (index: number) => {
    if (index === 0) return;
    const currentLogic = conditions[index].logicalOperator;
    updateCondition(index, { logicalOperator: currentLogic === 'AND' ? 'OR' : 'AND' });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-blue-500" />
            Condiciones (IF)
          </span>
          <Button size="sm" variant="outline" onClick={addCondition}>
            <Plus className="h-4 w-4 mr-1" />
            Añadir
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {conditions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">Sin condiciones - la regla siempre se ejecutará</p>
            <Button variant="link" onClick={addCondition} className="mt-2">
              Añadir condición
            </Button>
          </div>
        ) : (
          conditions.map((condition, index) => (
            <div key={condition.id} className="space-y-2">
              {/* Conector lógico */}
              {index > 0 && (
                <button
                  onClick={() => toggleLogic(index)}
                  className="mx-auto block px-3 py-1 text-xs font-medium rounded bg-muted hover:bg-muted/80 transition-colors"
                >
                  {condition.logicalOperator || 'AND'}
                </button>
              )}
              
              {/* Condición */}
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Campo (ej: data.prioridad)"
                    value={condition.field}
                    onChange={(e) => updateCondition(index, { field: e.target.value })}
                    className="text-sm"
                  />
                  
                  <Select
                    value={condition.operator}
                    onValueChange={(value) => updateCondition(index, { operator: value as RuleCondition['operator'] })}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                    <Input
                      placeholder="Valor"
                      value={typeof condition.value === 'string' ? condition.value : JSON.stringify(condition.value)}
                      onChange={(e) => updateCondition(index, { value: e.target.value })}
                      className="text-sm"
                    />
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCondition(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}

        {conditions.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              💡 Usa notación de punto para campos anidados: <code className="bg-muted px-1 rounded">data.campo</code>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
