import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColumnEditor } from './ColumnEditor';
import { FilterEditor } from './FilterEditor';
import { ChartEditor } from './ChartEditor';
import { LowCodeReport } from '../types';
import { useLowCodeReports } from '@/hooks/lowcode/useLowCodeReports';
import { Save, Eye, Play, Download } from 'lucide-react';

interface ReportBuilderProps {
  report?: LowCodeReport;
  moduleId?: string;
  onSave?: (report: LowCodeReport) => void;
}

// Campos disponibles según la fuente de datos
const DATA_SOURCES = {
  companies: {
    label: 'Empresas',
    fields: [
      { key: 'name', label: 'Nombre', type: 'text' },
      { key: 'cif', label: 'CIF', type: 'text' },
      { key: 'sector', label: 'Sector', type: 'text' },
      { key: 'facturacion_anual', label: 'Facturación Anual', type: 'currency' },
      { key: 'empleados', label: 'Empleados', type: 'number' },
      { key: 'ciudad', label: 'Ciudad', type: 'text' },
      { key: 'provincia', label: 'Provincia', type: 'text' },
      { key: 'created_at', label: 'Fecha Creación', type: 'date' },
    ],
  },
  visits: {
    label: 'Visitas',
    fields: [
      { key: 'date', label: 'Fecha', type: 'date' },
      { key: 'result', label: 'Resultado', type: 'text' },
      { key: 'duration', label: 'Duración', type: 'number' },
      { key: 'type', label: 'Tipo', type: 'text' },
      { key: 'notes', label: 'Notas', type: 'text' },
    ],
  },
  products: {
    label: 'Productos',
    fields: [
      { key: 'name', label: 'Nombre', type: 'text' },
      { key: 'category', label: 'Categoría', type: 'text' },
      { key: 'price', label: 'Precio', type: 'currency' },
      { key: 'active', label: 'Activo', type: 'boolean' },
    ],
  },
};

export function ReportBuilder({ report, moduleId, onSave }: ReportBuilderProps) {
  const { createReport, updateReport } = useLowCodeReports(moduleId);

  const [formData, setFormData] = useState<Partial<LowCodeReport>>({
    report_name: report?.report_name || '',
    report_key: report?.report_key || '',
    description: report?.description || '',
    module_id: report?.module_id || moduleId,
    data_source: report?.data_source || 'companies',
    columns: report?.columns || [],
    filters: report?.filters || [],
    grouping: report?.grouping || [],
    sorting: report?.sorting || [],
    chart_config: report?.chart_config,
    is_public: report?.is_public || false,
  });

  const [activeTab, setActiveTab] = useState('general');

  const availableFields = DATA_SOURCES[formData.data_source as keyof typeof DATA_SOURCES]?.fields || [];

  const handleSave = async () => {
    if (report?.id) {
      await updateReport.mutateAsync({ id: report.id, ...formData });
    } else {
      await createReport.mutateAsync(formData);
    }
    onSave?.(formData as LowCodeReport);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {report ? 'Editar Reporte' : 'Nuevo Reporte'}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            Vista Previa
          </Button>
          <Button variant="outline" size="sm">
            <Play className="h-4 w-4 mr-1" />
            Ejecutar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
          <Button onClick={handleSave} size="sm">
            <Save className="h-4 w-4 mr-1" />
            Guardar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="columns">Columnas</TabsTrigger>
          <TabsTrigger value="filters">Filtros</TabsTrigger>
          <TabsTrigger value="chart">Gráfico</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Reporte</Label>
                  <Input
                    value={formData.report_name}
                    onChange={(e) => setFormData({ ...formData, report_name: e.target.value })}
                    placeholder="Mi Reporte"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Clave Única</Label>
                  <Input
                    value={formData.report_key}
                    onChange={(e) => setFormData({ ...formData, report_key: e.target.value })}
                    placeholder="mi_reporte"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del reporte..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fuente de Datos</Label>
                  <Select
                    value={formData.data_source}
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      data_source: value,
                      columns: [],
                      filters: [],
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DATA_SOURCES).map(([key, source]) => (
                        <SelectItem key={key} value={key}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={formData.is_public}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                  />
                  <Label>Reporte Público</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="columns">
          <ColumnEditor
            columns={formData.columns || []}
            onChange={(columns) => setFormData({ ...formData, columns })}
            availableFields={availableFields}
          />
        </TabsContent>

        <TabsContent value="filters">
          <FilterEditor
            filters={formData.filters || []}
            onChange={(filters) => setFormData({ ...formData, filters })}
            availableFields={availableFields}
          />
        </TabsContent>

        <TabsContent value="chart">
          <ChartEditor
            config={formData.chart_config}
            onChange={(chart_config) => setFormData({ ...formData, chart_config })}
            availableFields={availableFields}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
