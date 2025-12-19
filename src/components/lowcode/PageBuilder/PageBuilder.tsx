import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ComponentPalette } from './ComponentPalette';
import { ComponentEditor } from './ComponentEditor';
import { PageCanvas } from './PageCanvas';
import { LowCodePage, PageComponent } from '../types';
import { useLowCodePages } from '@/hooks/lowcode/useLowCodePages';
import { Save, Eye, Settings } from 'lucide-react';

interface PageBuilderProps {
  page?: LowCodePage;
  moduleId?: string;
  onSave?: (page: LowCodePage) => void;
}

export function PageBuilder({ page, moduleId, onSave }: PageBuilderProps) {
  const { createPage, updatePage } = useLowCodePages(moduleId);

  const [formData, setFormData] = useState<Partial<LowCodePage>>({
    page_name: page?.page_name || '',
    page_key: page?.page_key || '',
    description: page?.description || '',
    module_id: page?.module_id || moduleId,
    layout: page?.layout || 'single',
    components: page?.components || [],
    route_path: page?.route_path || '',
    is_public: page?.is_public || false,
    permissions: page?.permissions || { roles: [], users: [] },
  });

  const [selectedComponentId, setSelectedComponentId] = useState<string>();
  const [showSettings, setShowSettings] = useState(false);

  const selectedComponent = formData.components?.find(c => c.id === selectedComponentId);

  const handleAddComponent = (type: string) => {
    const newComponent: PageComponent = {
      id: `comp_${Date.now()}`,
      type,
      props: {},
      styles: {},
    };
    setFormData({
      ...formData,
      components: [...(formData.components || []), newComponent],
    });
    setSelectedComponentId(newComponent.id);
  };

  const handleUpdateComponent = (updated: PageComponent) => {
    setFormData({
      ...formData,
      components: formData.components?.map(c => 
        c.id === updated.id ? updated : c
      ),
    });
  };

  const handleDeleteComponent = () => {
    setFormData({
      ...formData,
      components: formData.components?.filter(c => c.id !== selectedComponentId),
    });
    setSelectedComponentId(undefined);
  };

  const handleDuplicateComponent = () => {
    if (!selectedComponent) return;
    const duplicated: PageComponent = {
      ...selectedComponent,
      id: `comp_${Date.now()}`,
    };
    setFormData({
      ...formData,
      components: [...(formData.components || []), duplicated],
    });
    setSelectedComponentId(duplicated.id);
  };

  const handleSave = async () => {
    if (page?.id) {
      await updatePage.mutateAsync({ id: page.id, ...formData });
    } else {
      await createPage.mutateAsync(formData);
    }
    onSave?.(formData as LowCodePage);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {page ? 'Editar Página' : 'Nueva Página'}
        </h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Config
          </Button>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            Vista Previa
          </Button>
          <Button onClick={handleSave} size="sm">
            <Save className="h-4 w-4 mr-1" />
            Guardar
          </Button>
        </div>
      </div>

      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Configuración de Página</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={formData.page_name}
                  onChange={(e) => setFormData({ ...formData, page_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Clave</Label>
                <Input
                  value={formData.page_key}
                  onChange={(e) => setFormData({ ...formData, page_key: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ruta</Label>
                <Input
                  value={formData.route_path}
                  onChange={(e) => setFormData({ ...formData, route_path: e.target.value })}
                  placeholder="/custom/mi-pagina"
                />
              </div>
              <div className="space-y-2">
                <Label>Layout</Label>
                <Select
                  value={formData.layout}
                  onValueChange={(value) => setFormData({ ...formData, layout: value as LowCodePage['layout'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Una Columna</SelectItem>
                    <SelectItem value="two-column">Dos Columnas</SelectItem>
                    <SelectItem value="three-column">Tres Columnas</SelectItem>
                    <SelectItem value="sidebar-left">Sidebar Izquierda</SelectItem>
                    <SelectItem value="sidebar-right">Sidebar Derecha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Switch
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
              />
              <Label>Página Pública</Label>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-[200px_1fr_280px] gap-4">
        <ComponentPalette onAddComponent={handleAddComponent} />
        
        <PageCanvas
          components={formData.components || []}
          selectedId={selectedComponentId}
          onSelect={setSelectedComponentId}
          onReorder={(components) => setFormData({ ...formData, components })}
          layout={formData.layout || 'single'}
        />

        {selectedComponent ? (
          <ComponentEditor
            component={selectedComponent}
            onChange={handleUpdateComponent}
            onDelete={handleDeleteComponent}
            onDuplicate={handleDuplicateComponent}
          />
        ) : (
          <Card className="h-full">
            <CardContent className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-sm text-center">
                Selecciona un componente para editar sus propiedades
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
