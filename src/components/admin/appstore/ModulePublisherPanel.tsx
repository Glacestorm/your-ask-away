/**
 * ModulePublisherPanel - Panel de publicación de versiones de módulos
 * Permite incrementar versión, actualizar descripción/features y publicar
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Upload,
  Package,
  Tag,
  FileText,
  CheckCircle,
  Clock,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  History,
  Rocket,
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useModulePublisher, ModuleMetadata, PublishOptions } from '@/hooks/admin/useModulePublisher';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface ModulePublisherPanelProps {
  className?: string;
  initialModuleKey?: string;
}

export function ModulePublisherPanel({ className, initialModuleKey }: ModulePublisherPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('modules');
  
  // Publish form state
  const [versionType, setVersionType] = useState<'patch' | 'minor' | 'major'>('patch');
  const [customVersion, setCustomVersion] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newFeatures, setNewFeatures] = useState<string[]>([]);
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [changelog, setChangelog] = useState('');
  const [isStable, setIsStable] = useState(true);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);

  const {
    isLoading,
    isPublishing,
    modules,
    selectedModule,
    fetchModules,
    getModule,
    publishVersion,
    updateMetadata,
    getVersionHistory,
    calculateNextVersion,
    setSelectedModule
  } = useModulePublisher();

  // Initial fetch
  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // Load initial module if provided
  useEffect(() => {
    if (initialModuleKey) {
      getModule(initialModuleKey);
    }
  }, [initialModuleKey, getModule]);

  // Load version history when module selected
  useEffect(() => {
    if (selectedModule) {
      getVersionHistory(selectedModule.moduleKey).then(setVersionHistory);
    }
  }, [selectedModule, getVersionHistory]);

  // Prepare form when opening publish dialog
  const handleOpenPublish = () => {
    if (selectedModule) {
      setNewDescription(selectedModule.description);
      setNewFeatures([...selectedModule.features]);
      setReleaseNotes('');
      setChangelog('');
      setCustomVersion('');
      setVersionType('patch');
      setIsStable(true);
      setShowPublishDialog(true);
    }
  };

  // Add feature to list
  const handleAddFeature = () => {
    if (newFeatureInput.trim() && !newFeatures.includes(newFeatureInput.trim())) {
      setNewFeatures([...newFeatures, newFeatureInput.trim()]);
      setNewFeatureInput('');
    }
  };

  // Remove feature
  const handleRemoveFeature = (feature: string) => {
    setNewFeatures(newFeatures.filter(f => f !== feature));
  };

  // Publish version
  const handlePublish = async () => {
    if (!selectedModule) return;

    const options: PublishOptions = {
      version: customVersion || calculateNextVersion(selectedModule.version, versionType),
      versionType,
      description: newDescription !== selectedModule.description ? newDescription : undefined,
      features: JSON.stringify(newFeatures) !== JSON.stringify(selectedModule.features) ? newFeatures : undefined,
      releaseNotes: releaseNotes || undefined,
      changelog: changelog.split('\n').filter(l => l.trim()),
      isStable
    };

    const result = await publishVersion(selectedModule.moduleKey, options);
    
    if (result?.success) {
      setShowPublishDialog(false);
      // Refresh history
      const history = await getVersionHistory(selectedModule.moduleKey);
      setVersionHistory(history);
    }
  };

  // Filter modules
  const filteredModules = modules.filter(m =>
    m.moduleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.moduleKey.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get calculated next version
  const nextVersion = selectedModule 
    ? customVersion || calculateNextVersion(selectedModule.version, versionType)
    : '';

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-4", className)}>
      {/* Module List */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Módulos</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => fetchModules()} 
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar módulo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-[500px]">
            <div className="space-y-1">
              {filteredModules.map((module) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-all hover:bg-muted/50",
                    selectedModule?.moduleKey === module.moduleKey && "bg-primary/10 ring-1 ring-primary/30"
                  )}
                  onClick={() => {
                    setSelectedModule(module);
                    getModule(module.moduleKey);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{module.moduleName}</span>
                    <Badge variant="outline" className="text-xs">
                      v{module.version}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {module.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {module.category}
                    </Badge>
                    {module.isCore && (
                      <Badge className="text-xs bg-amber-500/20 text-amber-600 border-amber-500/30">
                        Core
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Module Details & Actions */}
      <Card className="lg:col-span-2">
        {selectedModule ? (
          <>
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {selectedModule.moduleName}
                    <Badge variant="outline" className="ml-2">v{selectedModule.version}</Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {selectedModule.moduleKey}
                  </CardDescription>
                </div>
                <Button 
                  onClick={handleOpenPublish}
                  className="gap-2"
                  disabled={isPublishing}
                >
                  <Rocket className="h-4 w-4" />
                  Publicar Versión
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="details" className="text-xs">Detalles</TabsTrigger>
                  <TabsTrigger value="features" className="text-xs">Features</TabsTrigger>
                  <TabsTrigger value="history" className="text-xs">Historial</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Versión Actual</Label>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-lg font-bold">v{selectedModule.version}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Última Actualización</Label>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(selectedModule.updatedAt), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                      {selectedModule.description || 'Sin descripción'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Categoría</Label>
                      <Badge variant="secondary">{selectedModule.category}</Badge>
                    </div>
                    <div className="space-y-2">
                      <Label>Sector</Label>
                      <Badge variant="outline">{selectedModule.sector || 'General'}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {selectedModule.isCore && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-amber-500" />
                        <span className="text-sm">Módulo Core</span>
                      </div>
                    )}
                    {selectedModule.isRequired && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm">Requerido</span>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="features" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Features ({selectedModule.features.length})</Label>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {selectedModule.features.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            Sin features registradas
                          </p>
                        ) : (
                          selectedModule.features.map((feature, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                            >
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Historial de Versiones</Label>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {versionHistory.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            Sin historial de versiones
                          </p>
                        ) : (
                          versionHistory.map((version, idx) => (
                            <div 
                              key={version.id}
                              className={cn(
                                "p-3 rounded-lg border bg-card",
                                version.is_latest && "ring-2 ring-primary"
                              )}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">v{version.version}</span>
                                  {version.is_latest && (
                                    <Badge className="text-xs">Latest</Badge>
                                  )}
                                  {version.is_stable && (
                                    <Badge variant="outline" className="text-xs text-green-600">
                                      Stable
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(version.created_at), "dd MMM yyyy", { locale: es })}
                                </span>
                              </div>
                              {version.release_notes && (
                                <p className="text-xs text-muted-foreground">
                                  {version.release_notes}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </>
        ) : (
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">
              Selecciona un módulo para ver sus detalles y publicar versiones
            </p>
          </CardContent>
        )}
      </Card>

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              Publicar Nueva Versión
            </DialogTitle>
            <DialogDescription>
              {selectedModule?.moduleName} - v{selectedModule?.version} → v{nextVersion}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Version Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tipo de Versión</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={versionType === 'patch' ? 'default' : 'outline'}
                  onClick={() => { setVersionType('patch'); setCustomVersion(''); }}
                  className="flex-col h-auto py-3"
                >
                  <ArrowUp className="h-4 w-4 mb-1" />
                  <span className="font-bold">Patch</span>
                  <span className="text-xs opacity-70">
                    {selectedModule && calculateNextVersion(selectedModule.version, 'patch')}
                  </span>
                </Button>
                <Button
                  variant={versionType === 'minor' ? 'default' : 'outline'}
                  onClick={() => { setVersionType('minor'); setCustomVersion(''); }}
                  className="flex-col h-auto py-3"
                >
                  <ArrowRight className="h-4 w-4 mb-1" />
                  <span className="font-bold">Minor</span>
                  <span className="text-xs opacity-70">
                    {selectedModule && calculateNextVersion(selectedModule.version, 'minor')}
                  </span>
                </Button>
                <Button
                  variant={versionType === 'major' ? 'default' : 'outline'}
                  onClick={() => { setVersionType('major'); setCustomVersion(''); }}
                  className="flex-col h-auto py-3"
                >
                  <Sparkles className="h-4 w-4 mb-1" />
                  <span className="font-bold">Major</span>
                  <span className="text-xs opacity-70">
                    {selectedModule && calculateNextVersion(selectedModule.version, 'major')}
                  </span>
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="O introduce versión personalizada (ej: 2.5.0)"
                  value={customVersion}
                  onChange={(e) => setCustomVersion(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Descripción del módulo..."
                rows={3}
              />
            </div>

            {/* Features */}
            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Añadir nueva feature..."
                  value={newFeatureInput}
                  onChange={(e) => setNewFeatureInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                />
                <Button onClick={handleAddFeature} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="h-[120px]">
                <div className="space-y-1">
                  {newFeatures.map((feature, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-muted/50"
                    >
                      <span className="text-sm">{feature}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveFeature(feature)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <Separator />

            {/* Changelog */}
            <div className="space-y-2">
              <Label>Changelog (uno por línea)</Label>
              <Textarea
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                placeholder="+ Nueva funcionalidad&#10;- Bug corregido&#10;* Mejora de rendimiento"
                rows={4}
              />
            </div>

            {/* Release Notes */}
            <div className="space-y-2">
              <Label>Release Notes</Label>
              <Textarea
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                placeholder="Notas de la versión para los usuarios..."
                rows={2}
              />
            </div>

            {/* Stable Switch */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <Label>Versión Estable</Label>
                <p className="text-xs text-muted-foreground">
                  Marcar como versión estable para producción
                </p>
              </div>
              <Switch checked={isStable} onCheckedChange={setIsStable} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handlePublish} 
              disabled={isPublishing}
              className="gap-2"
            >
              {isPublishing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Publicar v{nextVersion}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ModulePublisherPanel;
