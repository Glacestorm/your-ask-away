import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageComponent } from '../types';
import { Trash2, Copy } from 'lucide-react';

interface ComponentEditorProps {
  component: PageComponent;
  onChange: (component: PageComponent) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function ComponentEditor({ component, onChange, onDelete, onDuplicate }: ComponentEditorProps) {
  const updateProps = (updates: Record<string, unknown>) => {
    onChange({
      ...component,
      props: { ...component.props, ...updates },
    });
  };

  const updateStyles = (updates: Record<string, string>) => {
    onChange({
      ...component,
      styles: { ...component.styles, ...updates },
    });
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm">Propiedades</CardTitle>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDuplicate}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="content">
          <TabsList className="w-full">
            <TabsTrigger value="content" className="flex-1">Contenido</TabsTrigger>
            <TabsTrigger value="style" className="flex-1">Estilo</TabsTrigger>
            <TabsTrigger value="data" className="flex-1">Datos</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 mt-4">
            {renderContentFields(component, updateProps)}
          </TabsContent>

          <TabsContent value="style" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Ancho</Label>
              <Select
                value={component.styles?.width || 'full'}
                onValueChange={(value) => updateStyles({ width: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="full">100%</SelectItem>
                  <SelectItem value="1/2">50%</SelectItem>
                  <SelectItem value="1/3">33%</SelectItem>
                  <SelectItem value="1/4">25%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Padding</Label>
              <Select
                value={component.styles?.padding || 'md'}
                onValueChange={(value) => updateStyles({ padding: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  <SelectItem value="sm">Pequeño</SelectItem>
                  <SelectItem value="md">Mediano</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Margen</Label>
              <Select
                value={component.styles?.margin || 'md'}
                onValueChange={(value) => updateStyles({ margin: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  <SelectItem value="sm">Pequeño</SelectItem>
                  <SelectItem value="md">Mediano</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fondo</Label>
              <Select
                value={component.styles?.background || 'transparent'}
                onValueChange={(value) => updateStyles({ background: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transparent">Transparente</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="muted">Atenuado</SelectItem>
                  <SelectItem value="primary">Primario</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={component.styles?.shadow === 'true'}
                onCheckedChange={(checked) => updateStyles({ shadow: checked ? 'true' : 'false' })}
              />
              <Label>Sombra</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={component.styles?.rounded === 'true'}
                onCheckedChange={(checked) => updateStyles({ rounded: checked ? 'true' : 'false' })}
              />
              <Label>Bordes redondeados</Label>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Fuente de Datos</Label>
              <Select
                value={(component.props?.dataSource as string) || '__none__'}
                onValueChange={(value) => updateProps({ dataSource: value === '__none__' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Ninguna</SelectItem>
                  <SelectItem value="companies">Empresas</SelectItem>
                  <SelectItem value="visits">Visitas</SelectItem>
                  <SelectItem value="products">Productos</SelectItem>
                  <SelectItem value="custom">Personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Filtro (JSON)</Label>
              <Textarea
                value={JSON.stringify(component.props?.filter || {}, null, 2)}
                onChange={(e) => {
                  try {
                    updateProps({ filter: JSON.parse(e.target.value) });
                  } catch {}
                }}
                rows={4}
                className="font-mono text-xs"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function renderContentFields(
  component: PageComponent, 
  updateProps: (updates: Record<string, unknown>) => void
) {
  switch (component.type) {
    case 'heading':
      return (
        <>
          <div className="space-y-2">
            <Label>Texto</Label>
            <Input
              value={(component.props?.text as string) || ''}
              onChange={(e) => updateProps({ text: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Nivel</Label>
            <Select
              value={(component.props?.level as string) || 'h2'}
              onValueChange={(value) => updateProps({ level: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="h1">H1</SelectItem>
                <SelectItem value="h2">H2</SelectItem>
                <SelectItem value="h3">H3</SelectItem>
                <SelectItem value="h4">H4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      );

    case 'text':
      return (
        <div className="space-y-2">
          <Label>Contenido</Label>
          <Textarea
            value={(component.props?.content as string) || ''}
            onChange={(e) => updateProps({ content: e.target.value })}
            rows={4}
          />
        </div>
      );

    case 'card':
      return (
        <>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={(component.props?.title as string) || ''}
              onChange={(e) => updateProps({ title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={(component.props?.description as string) || ''}
              onChange={(e) => updateProps({ description: e.target.value })}
              rows={3}
            />
          </div>
        </>
      );

    case 'kpi':
      return (
        <>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={(component.props?.title as string) || ''}
              onChange={(e) => updateProps({ title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Valor</Label>
            <Input
              value={(component.props?.value as string) || ''}
              onChange={(e) => updateProps({ value: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Icono</Label>
            <Input
              value={(component.props?.icon as string) || ''}
              onChange={(e) => updateProps({ icon: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Tendencia (%)</Label>
            <Input
              type="number"
              value={(component.props?.trend as number) || 0}
              onChange={(e) => updateProps({ trend: parseFloat(e.target.value) })}
            />
          </div>
        </>
      );

    case 'image':
      return (
        <>
          <div className="space-y-2">
            <Label>URL de Imagen</Label>
            <Input
              value={(component.props?.src as string) || ''}
              onChange={(e) => updateProps({ src: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Texto Alternativo</Label>
            <Input
              value={(component.props?.alt as string) || ''}
              onChange={(e) => updateProps({ alt: e.target.value })}
            />
          </div>
        </>
      );

    case 'form':
      return (
        <div className="space-y-2">
          <Label>ID del Formulario</Label>
          <Input
            value={(component.props?.formId as string) || ''}
            onChange={(e) => updateProps({ formId: e.target.value })}
            placeholder="ID del formulario low-code"
          />
        </div>
      );

    default:
      return (
        <p className="text-sm text-muted-foreground">
          Configura las propiedades del componente "{component.type}"
        </p>
      );
  }
}
