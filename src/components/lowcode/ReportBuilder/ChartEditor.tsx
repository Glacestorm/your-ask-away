import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ChartConfig } from '../types';
import { BarChart3, LineChart, PieChart, AreaChart } from 'lucide-react';

interface ChartEditorProps {
  config?: ChartConfig;
  onChange: (config: ChartConfig | undefined) => void;
  availableFields: { key: string; label: string; type: string }[];
}

const CHART_TYPES = [
  { value: 'bar', label: 'Barras', icon: BarChart3 },
  { value: 'line', label: 'Líneas', icon: LineChart },
  { value: 'pie', label: 'Circular', icon: PieChart },
  { value: 'area', label: 'Área', icon: AreaChart },
];

const AGGREGATIONS = [
  { value: 'count', label: 'Contar' },
  { value: 'sum', label: 'Sumar' },
  { value: 'avg', label: 'Promedio' },
  { value: 'min', label: 'Mínimo' },
  { value: 'max', label: 'Máximo' },
];

export function ChartEditor({ config, onChange, availableFields }: ChartEditorProps) {
  const [enabled, setEnabled] = React.useState(!!config);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (checked && !config) {
      onChange({
        type: 'bar',
        xAxis: '',
        yAxis: '',
        aggregation: 'count',
      });
    } else if (!checked) {
      onChange(undefined);
    }
  };

  const updateConfig = (updates: Partial<ChartConfig>) => {
    if (config) {
      onChange({ ...config, ...updates });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Gráfico</CardTitle>
        <Switch checked={enabled} onCheckedChange={handleToggle} />
      </CardHeader>
      {enabled && config && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Gráfico</Label>
            <div className="grid grid-cols-4 gap-2">
              {CHART_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.value}
                    variant={config.type === type.value ? 'default' : 'outline'}
                    className="flex flex-col h-auto py-3"
                    onClick={() => updateConfig({ type: type.value as ChartConfig['type'] })}
                  >
                    <Icon className="h-5 w-5 mb-1" />
                    <span className="text-xs">{type.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Eje X (Categoría)</Label>
              <Select
                value={config.xAxis}
                onValueChange={(value) => updateConfig({ xAxis: value })}
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>Eje Y (Valor)</Label>
              <Select
                value={config.yAxis}
                onValueChange={(value) => updateConfig({ yAxis: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar campo" />
                </SelectTrigger>
                <SelectContent>
                  {availableFields
                    .filter(f => f.type === 'number' || f.type === 'currency')
                    .map((field) => (
                      <SelectItem key={field.key} value={field.key}>
                        {field.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Agregación</Label>
              <Select
                value={config.aggregation}
                onValueChange={(value) => updateConfig({ aggregation: value as ChartConfig['aggregation'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGGREGATIONS.map((agg) => (
                    <SelectItem key={agg.value} value={agg.value}>
                      {agg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Agrupar por (opcional)</Label>
              <Select
                value={config.groupBy || ''}
                onValueChange={(value) => updateConfig({ groupBy: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin agrupación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin agrupación</SelectItem>
                  {availableFields.map((field) => (
                    <SelectItem key={field.key} value={field.key}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Título del Gráfico</Label>
            <Input
              value={config.title || ''}
              onChange={(e) => updateConfig({ title: e.target.value || undefined })}
              placeholder="Título opcional"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
