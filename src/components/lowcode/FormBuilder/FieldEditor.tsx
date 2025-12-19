import React from 'react';
import { FormField, FieldOption, AVAILABLE_ROLES } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FieldEditorProps {
  field: FormField;
  onUpdate: (field: FormField) => void;
  onClose: () => void;
}

export function FieldEditor({ field, onUpdate, onClose }: FieldEditorProps) {
  const [localField, setLocalField] = React.useState<FormField>(field);

  const handleChange = <K extends keyof FormField>(key: K, value: FormField[K]) => {
    setLocalField(prev => ({ ...prev, [key]: value }));
  };

  const handleValidationChange = <K extends keyof FormField['validation']>(
    key: K, 
    value: FormField['validation'][K]
  ) => {
    setLocalField(prev => ({
      ...prev,
      validation: { ...prev.validation, [key]: value },
    }));
  };

  const handleSave = () => {
    onUpdate(localField);
    onClose();
  };

  const addOption = () => {
    const newOptions = [...(localField.options || []), { label: '', value: '' }];
    handleChange('options', newOptions);
  };

  const updateOption = (index: number, key: keyof FieldOption, value: string) => {
    const newOptions = [...(localField.options || [])];
    newOptions[index] = { ...newOptions[index], [key]: value };
    handleChange('options', newOptions);
  };

  const removeOption = (index: number) => {
    const newOptions = localField.options?.filter((_, i) => i !== index);
    handleChange('options', newOptions);
  };

  const needsOptions = ['select', 'multiselect', 'radio'].includes(localField.type);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium">Editar Campo</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-300px)]">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="validation">Validación</TabsTrigger>
              <TabsTrigger value="permissions">Permisos</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nombre del Campo</Label>
                <Input
                  value={localField.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="nombre_campo"
                />
              </div>

              <div className="space-y-2">
                <Label>Etiqueta</Label>
                <Input
                  value={localField.label}
                  onChange={(e) => handleChange('label', e.target.value)}
                  placeholder="Etiqueta visible"
                />
              </div>

              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input
                  value={localField.placeholder || ''}
                  onChange={(e) => handleChange('placeholder', e.target.value)}
                  placeholder="Texto de ayuda..."
                />
              </div>

              <div className="space-y-2">
                <Label>Valor por Defecto</Label>
                <Input
                  value={localField.defaultValue || ''}
                  onChange={(e) => handleChange('defaultValue', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Texto de Ayuda</Label>
                <Textarea
                  value={localField.helpText || ''}
                  onChange={(e) => handleChange('helpText', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Ancho</Label>
                <Select
                  value={localField.width || 'full'}
                  onValueChange={(v) => handleChange('width', v as FormField['width'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Completo</SelectItem>
                    <SelectItem value="half">Mitad</SelectItem>
                    <SelectItem value="third">Tercio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Solo Lectura</Label>
                <Switch
                  checked={localField.readOnly || false}
                  onCheckedChange={(v) => handleChange('readOnly', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Oculto</Label>
                <Switch
                  checked={localField.hidden || false}
                  onCheckedChange={(v) => handleChange('hidden', v)}
                />
              </div>

              {needsOptions && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label>Opciones</Label>
                    <Button size="sm" variant="outline" onClick={addOption}>
                      <Plus className="h-4 w-4 mr-1" />
                      Añadir
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {localField.options?.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Etiqueta"
                          value={option.label}
                          onChange={(e) => updateOption(index, 'label', e.target.value)}
                        />
                        <Input
                          placeholder="Valor"
                          value={option.value}
                          onChange={(e) => updateOption(index, 'value', e.target.value)}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeOption(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="validation" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label>Requerido</Label>
                <Switch
                  checked={localField.validation.required || false}
                  onCheckedChange={(v) => handleValidationChange('required', v)}
                />
              </div>

              {['text', 'textarea', 'richtext', 'email', 'phone'].includes(localField.type) && (
                <>
                  <div className="space-y-2">
                    <Label>Longitud Mínima</Label>
                    <Input
                      type="number"
                      value={localField.validation.minLength || ''}
                      onChange={(e) => handleValidationChange('minLength', parseInt(e.target.value) || undefined)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Longitud Máxima</Label>
                    <Input
                      type="number"
                      value={localField.validation.maxLength || ''}
                      onChange={(e) => handleValidationChange('maxLength', parseInt(e.target.value) || undefined)}
                    />
                  </div>
                </>
              )}

              {localField.type === 'number' && (
                <>
                  <div className="space-y-2">
                    <Label>Valor Mínimo</Label>
                    <Input
                      type="number"
                      value={localField.validation.min ?? ''}
                      onChange={(e) => handleValidationChange('min', parseFloat(e.target.value) || undefined)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Máximo</Label>
                    <Input
                      type="number"
                      value={localField.validation.max ?? ''}
                      onChange={(e) => handleValidationChange('max', parseFloat(e.target.value) || undefined)}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Patrón (Regex)</Label>
                <Input
                  value={localField.validation.pattern || ''}
                  onChange={(e) => handleValidationChange('pattern', e.target.value)}
                  placeholder="^[a-zA-Z]+$"
                />
              </div>

              <div className="space-y-2">
                <Label>Mensaje de Error del Patrón</Label>
                <Input
                  value={localField.validation.patternMessage || ''}
                  onChange={(e) => handleValidationChange('patternMessage', e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Valor Único</Label>
                <Switch
                  checked={localField.validation.unique || false}
                  onCheckedChange={(v) => handleValidationChange('unique', v)}
                />
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Roles que pueden ver</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[60px]">
                  {AVAILABLE_ROLES.map((role) => (
                    <Badge
                      key={role.value}
                      variant={localField.permissions?.viewRoles?.includes(role.value) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const current = localField.permissions?.viewRoles || [];
                        const newRoles = current.includes(role.value)
                          ? current.filter(r => r !== role.value)
                          : [...current, role.value];
                        handleChange('permissions', {
                          ...localField.permissions,
                          viewRoles: newRoles,
                        });
                      }}
                    >
                      {role.label}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Vacío = visible para todos
                </p>
              </div>

              <div className="space-y-2">
                <Label>Roles que pueden editar</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[60px]">
                  {AVAILABLE_ROLES.map((role) => (
                    <Badge
                      key={role.value}
                      variant={localField.permissions?.editRoles?.includes(role.value) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const current = localField.permissions?.editRoles || [];
                        const newRoles = current.includes(role.value)
                          ? current.filter(r => r !== role.value)
                          : [...current, role.value];
                        handleChange('permissions', {
                          ...localField.permissions,
                          editRoles: newRoles,
                        });
                      }}
                    >
                      {role.label}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Vacío = editable por todos
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
