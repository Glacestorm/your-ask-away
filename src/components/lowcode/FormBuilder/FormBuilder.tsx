import React, { useState, useCallback } from 'react';
import { DndContext, DragOverlay, closestCenter, DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FormDefinition, FormField, FieldType, FIELD_TYPES } from '../types';
import { FieldPalette } from './FieldPalette';
import { FieldEditor } from './FieldEditor';
import { FormCanvas } from './FormCanvas';
import { FormPreview } from './FormPreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Save, Eye, Settings, Undo, Redo, Play, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLowCodeForms } from '@/hooks/lowcode/useLowCodeForms';

import { toast } from 'sonner';

interface FormBuilderProps {
  formId?: string;
  initialData?: FormDefinition;
  onSave?: (form: FormDefinition) => void;
  onCancel?: () => void;
}

function generateId() {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function FormBuilder({ formId, initialData, onSave, onCancel }: FormBuilderProps) {
  const { createForm, updateForm, publishForm } = useLowCodeForms();
  
  const [formData, setFormData] = useState<Partial<FormDefinition>>(initialData || {
    form_key: `form_${Date.now()}`,
    form_name: 'Nuevo Formulario',
    description: '',
    fields: [],
    validations: {},
    permissions: {},
    settings: {
      submitButtonText: 'Enviar',
      successMessage: 'Formulario enviado correctamente',
      allowMultipleSubmissions: true,
      requireAuthentication: false,
    },
    status: 'draft',
    version: 1,
  });

  const [fields, setFields] = useState<FormField[]>(initialData?.fields || []);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('editor');
  const [history, setHistory] = useState<FormField[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveToHistory = useCallback((newFields: FormField[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newFields]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setFields([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setFields([...history[historyIndex + 1]]);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    // Check if dragging from palette
    if (active.id.toString().startsWith('palette-')) {
      const fieldType = active.data.current?.type as FieldType;
      const fieldConfig = FIELD_TYPES.find(f => f.type === fieldType);
      
      const newField: FormField = {
        id: generateId(),
        type: fieldType,
        name: `${fieldType}_${fields.length + 1}`,
        label: fieldConfig?.label || 'Nuevo Campo',
        validation: {},
        order: fields.length,
      };

      const newFields = [...fields, newField];
      setFields(newFields);
      saveToHistory(newFields);
      setSelectedField(newField);
    } else if (active.id !== over.id) {
      // Reordering existing fields
      const oldIndex = fields.findIndex(f => f.id === active.id);
      const newIndex = fields.findIndex(f => f.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newFields = arrayMove(fields, oldIndex, newIndex).map((f, i) => ({
          ...f,
          order: i,
        }));
        setFields(newFields);
        saveToHistory(newFields);
      }
    }

    setActiveId(null);
  };

  const handleFieldUpdate = (updatedField: FormField) => {
    const newFields = fields.map(f => f.id === updatedField.id ? updatedField : f);
    setFields(newFields);
    saveToHistory(newFields);
    setSelectedField(null);
  };

  const handleFieldDelete = (fieldId: string) => {
    const newFields = fields.filter(f => f.id !== fieldId).map((f, i) => ({
      ...f,
      order: i,
    }));
    setFields(newFields);
    saveToHistory(newFields);
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };

  const handleFieldDuplicate = (field: FormField) => {
    const duplicatedField: FormField = {
      ...field,
      id: generateId(),
      name: `${field.name}_copy`,
      label: `${field.label} (Copia)`,
      order: fields.length,
    };
    const newFields = [...fields, duplicatedField];
    setFields(newFields);
    saveToHistory(newFields);
    setSelectedField(duplicatedField);
  };

  const handleSave = async () => {
    const formToSave: Partial<FormDefinition> = {
      ...formData,
      fields,
    };

    try {
      if (formId) {
        await updateForm.mutateAsync({ id: formId, ...formToSave });
      } else {
        await createForm.mutateAsync(formToSave);
      }
      onSave?.(formToSave as FormDefinition);
    } catch (error) {
      toast.error('Error al guardar el formulario');
    }
  };

  const handlePublish = async () => {
    if (formId) {
      await publishForm.mutateAsync(formId);
    } else {
      await handleSave();
      // After save, we'd need to publish the newly created form
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Input
              value={formData.form_name || ''}
              onChange={(e) => setFormData({ ...formData, form_name: e.target.value })}
              className="text-lg font-semibold border-none bg-transparent px-0 focus-visible:ring-0 max-w-md"
              placeholder="Nombre del formulario"
            />
            <Badge variant={formData.status === 'published' ? 'default' : 'secondary'}>
              {formData.status === 'published' ? 'Publicado' : 'Borrador'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={undo} disabled={historyIndex <= 0}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
            <Button onClick={handlePublish}>
              <Play className="h-4 w-4 mr-2" />
              Publicar
            </Button>
          </div>
        </div>
        <Textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descripción del formulario (opcional)"
          className="resize-none h-10 border-none bg-transparent px-0 focus-visible:ring-0"
          rows={1}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="h-12 bg-transparent">
            <TabsTrigger value="editor" className="data-[state=active]:bg-muted">
              Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-muted">
              <Eye className="h-4 w-4 mr-2" />
              Vista Previa
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-muted">
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="editor" className="flex-1 m-0 p-0">
          <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex h-full">
              {/* Left Palette */}
              <div className="w-64 border-r p-4 overflow-y-auto">
                <FieldPalette />
              </div>

              {/* Canvas */}
              <div className="flex-1 p-6 overflow-y-auto bg-muted/30">
                <FormCanvas
                  fields={fields}
                  selectedFieldId={selectedField?.id || null}
                  onFieldEdit={setSelectedField}
                  onFieldDelete={handleFieldDelete}
                  onFieldDuplicate={handleFieldDuplicate}
                />
              </div>

              {/* Right Editor */}
              {selectedField && (
                <div className="w-80 border-l p-4 overflow-y-auto">
                  <FieldEditor
                    field={selectedField}
                    onUpdate={handleFieldUpdate}
                    onClose={() => setSelectedField(null)}
                  />
                </div>
              )}
            </div>
          </DndContext>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 m-0 p-6 overflow-y-auto bg-muted/30">
          <FormPreview
            formName={formData.form_name || 'Formulario'}
            formDescription={formData.description}
            fields={fields}
            settings={formData.settings}
          />
        </TabsContent>

        <TabsContent value="settings" className="flex-1 m-0 p-6 overflow-y-auto">
          <div className="max-w-2xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Clave del Formulario</Label>
                  <Input
                    value={formData.form_key || ''}
                    onChange={(e) => setFormData({ ...formData, form_key: e.target.value })}
                    placeholder="form_key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Identificador único para el formulario
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Texto del Botón</Label>
                  <Input
                    value={formData.settings?.submitButtonText || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, submitButtonText: e.target.value },
                    })}
                    placeholder="Enviar"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mensaje de Éxito</Label>
                  <Textarea
                    value={formData.settings?.successMessage || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, successMessage: e.target.value },
                    })}
                    placeholder="Formulario enviado correctamente"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permitir múltiples envíos</Label>
                    <p className="text-xs text-muted-foreground">
                      El usuario puede enviar más de una vez
                    </p>
                  </div>
                  <Switch
                    checked={formData.settings?.allowMultipleSubmissions ?? true}
                    onCheckedChange={(v) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, allowMultipleSubmissions: v },
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Requiere autenticación</Label>
                    <p className="text-xs text-muted-foreground">
                      Solo usuarios logueados pueden enviar
                    </p>
                  </div>
                  <Switch
                    checked={formData.settings?.requireAuthentication ?? false}
                    onCheckedChange={(v) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, requireAuthentication: v },
                    })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>URL de Redirección</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={formData.settings?.redirectUrl || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, redirectUrl: e.target.value },
                  })}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Dejar vacío para mostrar mensaje de éxito
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
