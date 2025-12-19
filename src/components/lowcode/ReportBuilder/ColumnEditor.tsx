import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ReportColumn } from '../types';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface ColumnEditorProps {
  columns: ReportColumn[];
  onChange: (columns: ReportColumn[]) => void;
  availableFields: { key: string; label: string; type: string }[];
}

export function ColumnEditor({ columns, onChange, availableFields }: ColumnEditorProps) {
  const addColumn = () => {
    const newColumn: ReportColumn = {
      id: `col_${Date.now()}`,
      field: '',
      label: 'Nueva Columna',
      type: 'text',
      visible: true,
      sortable: true,
      filterable: true,
    };
    onChange([...columns, newColumn]);
  };

  const updateColumn = (index: number, updates: Partial<ReportColumn>) => {
    const updated = [...columns];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeColumn = (index: number) => {
    onChange(columns.filter((_, i) => i !== index));
  };

  const handleFieldSelect = (index: number, fieldKey: string) => {
    const field = availableFields.find(f => f.key === fieldKey);
    if (field) {
      updateColumn(index, {
        field: fieldKey,
        label: field.label,
        type: field.type as ReportColumn['type'],
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Columnas</CardTitle>
        <Button onClick={addColumn} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {columns.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay columnas configuradas
          </p>
        ) : (
          columns.map((column, index) => (
            <div
              key={column.id}
              className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
              
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Campo</Label>
                  <Select
                    value={column.field}
                    onValueChange={(value) => handleFieldSelect(index, value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Seleccionar campo" />
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
                  <Label className="text-xs">Etiqueta</Label>
                  <Input
                    value={column.label}
                    onChange={(e) => updateColumn(index, { label: e.target.value })}
                    className="h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Tipo</Label>
                  <Select
                    value={column.type}
                    onValueChange={(value) => updateColumn(index, { type: value as ReportColumn['type'] })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="number">Número</SelectItem>
                      <SelectItem value="currency">Moneda</SelectItem>
                      <SelectItem value="date">Fecha</SelectItem>
                      <SelectItem value="boolean">Sí/No</SelectItem>
                      <SelectItem value="badge">Etiqueta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Formato</Label>
                  <Input
                    value={column.format || ''}
                    onChange={(e) => updateColumn(index, { format: e.target.value || undefined })}
                    placeholder="ej: €0,0.00"
                    className="h-8"
                  />
                </div>

                <div className="col-span-2 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={column.visible}
                      onCheckedChange={(checked) => updateColumn(index, { visible: checked })}
                    />
                    <Label className="text-xs">Visible</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={column.sortable}
                      onCheckedChange={(checked) => updateColumn(index, { sortable: checked })}
                    />
                    <Label className="text-xs">Ordenable</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={column.filterable}
                      onCheckedChange={(checked) => updateColumn(index, { filterable: checked })}
                    />
                    <Label className="text-xs">Filtrable</Label>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeColumn(index)}
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
