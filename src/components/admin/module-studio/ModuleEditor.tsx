/**
 * ModuleEditor - Editor visual completo para módulos
 */

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Save, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Plus,
  Trash2,
  Code,
  Settings,
  FileJson,
  Eye,
  History,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useModuleValidator, ValidationResult, ModuleState } from '@/hooks/admin/useModuleValidator';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type AppModule = Database['public']['Tables']['app_modules']['Row'];

interface ModuleEditorProps {
  module: AppModule;
  onSave?: (module: AppModule) => void;
  onCancel?: () => void;
  className?: string;
}

interface FeatureItem {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
}

export function ModuleEditor({ 
  module, 
  onSave, 
  onCancel,
  className 
}: ModuleEditorProps) {
  const [editedModule, setEditedModule] = useState<AppModule>(module);
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { validateModule, isValidating, lastResult } = useModuleValidator();

  // Initialize features and dependencies from module
  useEffect(() => {
    if (module.features && Array.isArray(module.features)) {
      setFeatures(module.features as unknown as FeatureItem[]);
    }
    if (module.dependencies && Array.isArray(module.dependencies)) {
      setDependencies(module.dependencies);
    }
    setEditedModule(module);
    setHasChanges(false);
  }, [module]);

  // Track changes
  useEffect(() => {
    const moduleChanged = JSON.stringify(editedModule) !== JSON.stringify(module);
    const featuresChanged = JSON.stringify(features) !== JSON.stringify(module.features || []);
    const depsChanged = JSON.stringify(dependencies) !== JSON.stringify(module.dependencies || []);
    setHasChanges(moduleChanged || featuresChanged || depsChanged);
  }, [editedModule, features, dependencies, module]);

  // Update module field
  const updateField = useCallback(<K extends keyof AppModule>(
    field: K, 
    value: AppModule[K]
  ) => {
    setEditedModule(prev => ({ ...prev, [field]: value }));
  }, []);

  // Add feature
  const addFeature = useCallback(() => {
    const newFeature: FeatureItem = {
      key: `feature_${Date.now()}`,
      name: 'Nueva Feature',
      description: '',
      enabled: true,
    };
    setFeatures(prev => [...prev, newFeature]);
  }, []);

  // Update feature
  const updateFeature = useCallback((index: number, updates: Partial<FeatureItem>) => {
    setFeatures(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
  }, []);

  // Remove feature
  const removeFeature = useCallback((index: number) => {
    setFeatures(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Validate before save
  const handleValidate = useCallback(async () => {
    const currentState: ModuleState = {
      module_key: module.module_key,
      module_name: module.module_name,
      description: module.description || undefined,
      features: module.features as unknown[] || [],
      dependencies: module.dependencies || [],
      version: module.version || undefined,
    };

    const proposedState: ModuleState = {
      module_key: editedModule.module_key,
      module_name: editedModule.module_name,
      description: editedModule.description || undefined,
      features: features,
      dependencies: dependencies,
      version: editedModule.version || undefined,
    };

    const result = await validateModule(currentState, proposedState);
    
    if (result.breaking.length > 0) {
      toast.error('Se detectaron cambios que rompen compatibilidad');
    } else if (result.warnings.length > 0) {
      toast.warning(`${result.warnings.length} advertencias encontradas`);
    } else {
      toast.success('Validación exitosa - Score: ' + result.score);
    }
    
    return result;
  }, [module, editedModule, features, dependencies, validateModule]);

  // Save module
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    
    try {
      // Validate first
      const validation = await handleValidate();
      
      if (!validation.canSave) {
        toast.error('No se puede guardar: hay errores críticos');
        return;
      }

      if (validation.requiresConfirmation && validation.breaking.length > 0) {
        const confirmed = window.confirm(
          `Este cambio afectará a ${validation.affectedModules.length} módulos. ¿Continuar?`
        );
        if (!confirmed) return;
      }

      // Prepare update data
      const updateData = {
        ...editedModule,
        features: features as unknown as Database['public']['Tables']['app_modules']['Update']['features'],
        dependencies: dependencies,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('app_modules')
        .update(updateData)
        .eq('id', module.id);

      if (error) throw error;

      toast.success('Módulo guardado correctamente');
      onSave?.(updateData as AppModule);
      setHasChanges(false);
    } catch (err) {
      console.error('Error saving module:', err);
      toast.error('Error al guardar el módulo');
    } finally {
      setIsSaving(false);
    }
  }, [module, editedModule, features, dependencies, handleValidate, onSave]);

  const getValidationIcon = (result: ValidationResult | null) => {
    if (!result) return null;
    if (result.breaking.length > 0) return <XCircle className="h-5 w-5 text-destructive" />;
    if (result.warnings.length > 0) return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">{editedModule.module_name}</h2>
          {hasChanges && <Badge variant="outline" className="text-amber-500">Sin guardar</Badge>}
          {lastResult && getValidationIcon(lastResult)}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowJson(!showJson)}
          >
            <FileJson className="h-4 w-4 mr-2" />
            {showJson ? 'Editor' : 'JSON'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleValidate}
            disabled={isValidating}
          >
            {isValidating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Validar
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {/* Validation alerts */}
      {lastResult && (lastResult.breaking.length > 0 || lastResult.warnings.length > 0) && (
        <Alert variant={lastResult.breaking.length > 0 ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {lastResult.breaking.length > 0 ? 'Cambios incompatibles' : 'Advertencias'}
          </AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {lastResult.breaking.map((issue, i) => (
                <li key={i} className="text-sm">{issue.message}</li>
              ))}
              {lastResult.warnings.map((issue, i) => (
                <li key={i} className="text-sm">{issue.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {showJson ? (
        /* JSON Editor */
        <Card>
          <CardHeader>
            <CardTitle>Editor JSON</CardTitle>
            <CardDescription>Edita directamente el JSON del módulo</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              className="font-mono text-sm h-96"
              value={JSON.stringify({ ...editedModule, features, dependencies }, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setEditedModule(parsed);
                  if (parsed.features) setFeatures(parsed.features);
                  if (parsed.dependencies) setDependencies(parsed.dependencies);
                } catch {
                  // Invalid JSON, ignore
                }
              }}
            />
          </CardContent>
        </Card>
      ) : (
        /* Visual Editor */
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">
              <Settings className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="features">
              <Sparkles className="h-4 w-4 mr-2" />
              Features ({features.length})
            </TabsTrigger>
            <TabsTrigger value="dependencies">
              <Code className="h-4 w-4 mr-2" />
              Dependencias ({dependencies.length})
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="module_key">Module Key</Label>
                    <Input
                      id="module_key"
                      value={editedModule.module_key}
                      onChange={(e) => updateField('module_key', e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="module_name">Nombre</Label>
                    <Input
                      id="module_name"
                      value={editedModule.module_name}
                      onChange={(e) => updateField('module_name', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={editedModule.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select
                      value={editedModule.category}
                      onValueChange={(v) => updateField('category', v as AppModule['category'])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="core">Core</SelectItem>
                        <SelectItem value="commercial">Comercial</SelectItem>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="ai">AI</SelectItem>
                        <SelectItem value="integration">Integración</SelectItem>
                        <SelectItem value="security">Seguridad</SelectItem>
                        <SelectItem value="addon">Add-on</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="version">Versión</Label>
                    <Input
                      id="version"
                      value={editedModule.version || ''}
                      onChange={(e) => updateField('version', e.target.value)}
                      placeholder="1.0.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="base_price">Precio Base (€)</Label>
                    <Input
                      id="base_price"
                      type="number"
                      value={editedModule.base_price || 0}
                      onChange={(e) => updateField('base_price', parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editedModule.is_core || false}
                      onCheckedChange={(v) => updateField('is_core', v)}
                    />
                    <Label>Es Core</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editedModule.is_required || false}
                      onCheckedChange={(v) => updateField('is_required', v)}
                    />
                    <Label>Es Requerido</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Features del Módulo</CardTitle>
                    <CardDescription>Funcionalidades incluidas en este módulo</CardDescription>
                  </div>
                  <Button size="sm" onClick={addFeature}>
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Feature
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {features.map((feature, index) => (
                      <div 
                        key={feature.key}
                        className="p-4 border rounded-lg space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Key</Label>
                              <Input
                                value={feature.key}
                                onChange={(e) => updateFeature(index, { key: e.target.value })}
                                className="font-mono text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Nombre</Label>
                              <Input
                                value={feature.name}
                                onChange={(e) => updateFeature(index, { name: e.target.value })}
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeFeature(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Descripción</Label>
                          <Input
                            value={feature.description || ''}
                            onChange={(e) => updateFeature(index, { description: e.target.value })}
                            placeholder="Descripción de la feature..."
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={feature.enabled}
                            onCheckedChange={(v) => updateFeature(index, { enabled: v })}
                          />
                          <Label className="text-sm">Habilitada</Label>
                        </div>
                      </div>
                    ))}
                    {features.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay features definidas. Haz clic en "Añadir Feature" para crear una.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dependencies */}
          <TabsContent value="dependencies">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Dependencias</CardTitle>
                    <CardDescription>Módulos requeridos para que este funcione</CardDescription>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setDependencies([...dependencies, ''])}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Dependencia
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dependencies.map((dep, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={dep}
                        onChange={(e) => {
                          const newDeps = [...dependencies];
                          newDeps[index] = e.target.value;
                          setDependencies(newDeps);
                        }}
                        placeholder="module_key"
                        className="font-mono"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setDependencies(dependencies.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {dependencies.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay dependencias definidas.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview */}
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa</CardTitle>
                <CardDescription>Así se verá el módulo en la tienda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-6 bg-gradient-to-br from-muted/20 to-muted/40">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                      <span className="text-2xl">{editedModule.module_icon || '📦'}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">{editedModule.module_name}</h3>
                        <Badge variant="secondary">v{editedModule.version || '1.0.0'}</Badge>
                        {editedModule.is_core && <Badge>Core</Badge>}
                      </div>
                      <p className="text-muted-foreground mb-4">{editedModule.description}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold">
                          {editedModule.base_price ? `${editedModule.base_price}€` : 'Gratis'}
                        </span>
                        <Badge variant="outline" className="capitalize">{editedModule.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div>
                    <h4 className="font-medium mb-2">Features ({features.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {features.filter(f => f.enabled).map(f => (
                        <Badge key={f.key} variant="outline">{f.name}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default ModuleEditor;
