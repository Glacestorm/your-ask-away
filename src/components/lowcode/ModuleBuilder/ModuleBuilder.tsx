import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LowCodeModule } from '../types';
import { useLowCodeModules } from '@/hooks/lowcode/useLowCodeModules';
import { useLowCodeForms } from '@/hooks/lowcode/useLowCodeForms';
import { useLowCodeRules } from '@/hooks/lowcode/useLowCodeRules';
import { useLowCodeReports } from '@/hooks/lowcode/useLowCodeReports';
import { useLowCodePages } from '@/hooks/lowcode/useLowCodePages';
import { 
  Save, Plus, FileText, GitBranch, BarChart3, Layout, 
  Box, Palette, Settings, Trash2, Play, Eye
} from 'lucide-react';

interface ModuleBuilderProps {
  module?: LowCodeModule;
  onSave?: (module: LowCodeModule) => void;
}

const ICONS = [
  'Box', 'Package', 'Briefcase', 'Building', 'Users', 'ShoppingCart',
  'CreditCard', 'FileText', 'Calendar', 'Map', 'Settings', 'Database'
];

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export function ModuleBuilder({ module, onSave }: ModuleBuilderProps) {
  const { createModule, updateModule } = useLowCodeModules();
  const { forms } = useLowCodeForms(module?.id);
  const { rules } = useLowCodeRules(module?.id);
  const { reports } = useLowCodeReports(module?.id);
  const { pages } = useLowCodePages(module?.id);

  const [formData, setFormData] = useState<Partial<LowCodeModule>>({
    module_name: module?.module_name || '',
    module_key: module?.module_key || '',
    description: module?.description || '',
    icon: module?.icon || 'Box',
    color: module?.color || '#3b82f6',
    version: module?.version || '1.0.0',
    is_active: module?.is_active ?? true,
    settings: module?.settings || {},
    dependencies: module?.dependencies || [],
  });

  const [activeTab, setActiveTab] = useState('general');

  const handleSave = async () => {
    if (module?.id) {
      await updateModule.mutateAsync({ id: module.id, ...formData });
    } else {
      await createModule.mutateAsync(formData);
    }
    onSave?.(formData as LowCodeModule);
  };

  const stats = {
    forms: forms.length,
    rules: rules.length,
    reports: reports.length,
    pages: pages.length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="h-10 w-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: formData.color }}
          >
            <Box className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {module ? formData.module_name || 'Módulo' : 'Nuevo Módulo'}
            </h2>
            <p className="text-sm text-muted-foreground">v{formData.version}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            Vista Previa
          </Button>
          <Button variant="outline" size="sm">
            <Play className="h-4 w-4 mr-1" />
            Probar
          </Button>
          <Button onClick={handleSave} size="sm">
            <Save className="h-4 w-4 mr-1" />
            Guardar
          </Button>
        </div>
      </div>

      {module && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.forms}</span>
              </div>
              <p className="text-xs text-muted-foreground">Formularios</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.rules}</span>
              </div>
              <p className="text-xs text-muted-foreground">Reglas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.reports}</span>
              </div>
              <p className="text-xs text-muted-foreground">Reportes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Layout className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.pages}</span>
              </div>
              <p className="text-xs text-muted-foreground">Páginas</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-1" />
            General
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-1" />
            Apariencia
          </TabsTrigger>
          <TabsTrigger value="forms">
            <FileText className="h-4 w-4 mr-1" />
            Formularios
          </TabsTrigger>
          <TabsTrigger value="rules">
            <GitBranch className="h-4 w-4 mr-1" />
            Reglas
          </TabsTrigger>
          <TabsTrigger value="reports">
            <BarChart3 className="h-4 w-4 mr-1" />
            Reportes
          </TabsTrigger>
          <TabsTrigger value="pages">
            <Layout className="h-4 w-4 mr-1" />
            Páginas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del Módulo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Módulo</Label>
                  <Input
                    value={formData.module_name}
                    onChange={(e) => setFormData({ ...formData, module_name: e.target.value })}
                    placeholder="Mi Módulo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Clave Única</Label>
                  <Input
                    value={formData.module_key}
                    onChange={(e) => setFormData({ ...formData, module_key: e.target.value })}
                    placeholder="mi_modulo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Versión</Label>
                  <Input
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Módulo Activo</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Apariencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Icono</Label>
                <div className="grid grid-cols-6 gap-2">
                  {ICONS.map((icon) => (
                    <Button
                      key={icon}
                      variant={formData.icon === icon ? 'default' : 'outline'}
                      className="h-10"
                      onClick={() => setFormData({ ...formData, icon })}
                    >
                      <Box className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${
                        formData.color === color ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Formularios</CardTitle>
                <CardDescription>Formularios asociados a este módulo</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nuevo Formulario
              </Button>
            </CardHeader>
            <CardContent>
              {forms.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay formularios en este módulo
                </p>
              ) : (
                <div className="space-y-2">
                  {forms.map((form) => (
                    <div key={form.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{form.form_name}</p>
                        <p className="text-xs text-muted-foreground">{form.form_key}</p>
                      </div>
                      <Badge variant={form.is_active ? 'default' : 'secondary'}>
                        {form.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Reglas de Negocio</CardTitle>
                <CardDescription>Automatizaciones y reglas del módulo</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nueva Regla
              </Button>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay reglas en este módulo
                </p>
              ) : (
                <div className="space-y-2">
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{rule.rule_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Trigger: {rule.trigger_type}
                        </p>
                      </div>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Reportes</CardTitle>
                <CardDescription>Reportes y dashboards del módulo</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nuevo Reporte
              </Button>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay reportes en este módulo
                </p>
              ) : (
                <div className="space-y-2">
                  {reports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{report.report_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Fuente: {report.data_source}
                        </p>
                      </div>
                      <Badge variant={report.is_public ? 'default' : 'outline'}>
                        {report.is_public ? 'Público' : 'Privado'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Páginas</CardTitle>
                <CardDescription>Interfaces de usuario del módulo</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nueva Página
              </Button>
            </CardHeader>
            <CardContent>
              {pages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay páginas en este módulo
                </p>
              ) : (
                <div className="space-y-2">
                  {pages.map((page) => (
                    <div key={page.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{page.page_name}</p>
                        <p className="text-xs text-muted-foreground">{page.route_path}</p>
                      </div>
                      <Badge variant={page.is_public ? 'default' : 'outline'}>
                        {page.is_public ? 'Pública' : 'Privada'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
