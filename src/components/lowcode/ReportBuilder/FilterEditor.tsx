import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReportFilter, ConditionOperator } from '../types';
import { Plus, Trash2 } from 'lucide-react';

interface FilterEditorProps {
  filters: ReportFilter[];
  onChange: (filters: ReportFilter[]) => void;
  availableFields: { key: string; label: string; type: string }[];
}

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'equals', label: 'Igual a' },
  { value: 'not_equals', label: 'Diferente de' },
  { value: 'contains', label: 'Contiene' },
  { value: 'starts_with', label: 'Empieza con' },
  { value: 'ends_with', label: 'Termina con' },
  { value: 'greater_than', label: 'Mayor que' },
  { value: 'less_than', label: 'Menor que' },
  { value: 'between', label: 'Entre' },
  { value: 'in', label: 'En lista' },
  { value: 'is_null', label: 'Es nulo' },
  { value: 'is_not_null', label: 'No es nulo' },
];

export function FilterEditor({ filters, onChange, availableFields }: FilterEditorProps) {
  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: `filter_${Date.now()}`,
      field: '',
      operator: 'equals',
      value: '',
      isUserInput: false,
    };
    onChange([...filters, newFilter]);
  };

  const updateFilter = (index: number, updates: Partial<ReportFilter>) => {
    const updated = [...filters];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Filtros</CardTitle>
        <Button onClick={addFilter} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {filters.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay filtros configurados
          </p>
        ) : (
          filters.map((filter, index) => (
            <div
              key={filter.id}
              className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30"
            >
              <div className="flex-1 grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Campo</Label>
                  <Select
                    value={filter.field}
                    onValueChange={(value) => updateFilter(index, { field: value })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Campo" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map((field) => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Operador</Label>
                  <Select
                    value={filter.operator}
                    onValueChange={(value) => updateFilter(index, { operator: value as ConditionOperator })}
                  >
                    <SelectTrigger className="h-8">
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
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Valor</Label>
                  <Input
                    value={String(filter.value || '')}
                    onChange={(e) => updateFilter(index, { value: e.target.value })}
                    placeholder="Valor"
                    className="h-8"
                    disabled={filter.operator === 'is_null' || filter.operator === 'is_not_null'}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Etiqueta</Label>
                  <Input
                    value={filter.label || ''}
                    onChange={(e) => updateFilter(index, { label: e.target.value || undefined })}
                    placeholder="Etiqueta visible"
                    className="h-8"
                  />
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFilter(index)}
                className="h-8 w-8 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
