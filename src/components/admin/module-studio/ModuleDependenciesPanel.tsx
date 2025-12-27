/**
 * ModuleDependenciesPanel - Gestión de dependencias entre módulos
 * Árbol visual, conflictos, actualizaciones
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  RefreshCw, 
  GitFork,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUp,
  Plus,
  Trash2,
  Link as LinkIcon
} from 'lucide-react';
import { useModuleDependencies, ModuleDependency } from '@/hooks/admin/useModuleDependencies';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ModuleDependenciesPanelProps {
  moduleKey?: string;
  className?: string;
}

export function ModuleDependenciesPanel({ moduleKey, className }: ModuleDependenciesPanelProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDepKey, setNewDepKey] = useState('');
  const [newDepVersion, setNewDepVersion] = useState('');

  const {
    dependencies,
    conflicts,
    updates,
    tree,
    isLoading,
    isResolving,
    isUpdating,
    fetchDependencies,
    resolveConflict,
    updateDependency,
    updateAllDependencies,
    addDependency,
    removeDependency
  } = useModuleDependencies(moduleKey);

  useEffect(() => {
    if (moduleKey) fetchDependencies();
  }, [moduleKey, fetchDependencies]);

  const getStatusIcon = (status: ModuleDependency['status']) => {
    switch (status) {
      case 'satisfied': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'outdated': return <ArrowUp className="h-4 w-4 text-yellow-500" />;
      case 'missing': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'conflict': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'satisfied': return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'outdated': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
      case 'missing': return 'bg-red-500/10 text-red-600 border-red-500/30';
      case 'conflict': return 'bg-orange-500/10 text-orange-600 border-orange-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleAddDependency = async () => {
    if (newDepKey && newDepVersion) {
      await addDependency(newDepKey, newDepVersion);
      setShowAddDialog(false);
      setNewDepKey('');
      setNewDepVersion('');
    }
  };

  if (!moduleKey) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-12 text-center">
          <GitFork className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Selecciona un módulo para gestionar dependencias</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <GitFork className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Dependencias</CardTitle>
              <CardDescription className="text-xs">
                {dependencies.length} dependencias · {conflicts.length} conflictos · {updates.length} actualizaciones
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1">
                  <Plus className="h-4 w-4" /> Añadir
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Añadir Dependencia</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-sm font-medium">Módulo</label>
                    <Input 
                      placeholder="nombre-del-modulo" 
                      value={newDepKey}
                      onChange={(e) => setNewDepKey(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Versión</label>
                    <Input 
                      placeholder="1.0.0" 
                      value={newDepVersion}
                      onChange={(e) => setNewDepVersion(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddDependency} className="w-full">
                    <Package className="h-4 w-4 mr-2" /> Añadir Dependencia
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" onClick={() => fetchDependencies()} disabled={isLoading} className="h-8 w-8">
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Conflicts */}
        {conflicts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-4 w-4" /> Conflictos ({conflicts.length})
            </h4>
            {conflicts.map((conflict) => (
              <motion.div
                key={conflict.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs text-orange-600 border-orange-500/30">
                    {conflict.type}
                  </Badge>
                  <Badge className={cn("text-xs", 
                    conflict.severity === 'error' ? 'bg-red-500' : 
                    conflict.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  )}>
                    {conflict.severity}
                  </Badge>
                </div>
                <p className="text-xs text-orange-600/80 mb-2">{conflict.description}</p>
                {conflict.resolution && (
                  <p className="text-xs text-muted-foreground mb-2">
                    <strong>Solución:</strong> {conflict.resolution}
                  </p>
                )}
                {conflict.autoResolvable && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => resolveConflict(conflict.id)}
                    disabled={isResolving}
                  >
                    {isResolving ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Resolver Automáticamente'}
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Updates Available */}
        {updates.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2 text-blue-600">
                <ArrowUp className="h-4 w-4" /> Actualizaciones ({updates.length})
              </h4>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={updateAllDependencies}
                disabled={isUpdating}
              >
                Actualizar Todo
              </Button>
            </div>
            <div className="space-y-2">
              {updates.map((update) => (
                <div key={update.moduleKey} className="flex items-center justify-between p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">{update.moduleKey}</span>
                    <span className="text-xs text-muted-foreground">
                      v{update.currentVersion} → v{update.latestVersion}
                    </span>
                    {update.breakingChanges && (
                      <Badge variant="destructive" className="text-xs">Breaking</Badge>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => updateDependency(update.moduleKey, update.latestVersion)}
                    disabled={isUpdating}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dependencies List */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Package className="h-4 w-4" /> Dependencias Instaladas
          </h4>
          <ScrollArea className="h-[250px]">
            <div className="space-y-2">
              {dependencies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Sin dependencias</p>
                </div>
              ) : (
                dependencies.map((dep) => (
                  <motion.div
                    key={dep.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(dep.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{dep.moduleName}</span>
                          {dep.isDev && <Badge variant="outline" className="text-xs">dev</Badge>}
                          {dep.isRequired && <Badge variant="secondary" className="text-xs">required</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>v{dep.version}</span>
                          <span>•</span>
                          <span>{dep.requiredVersion}</span>
                          <span>•</span>
                          <span>{dep.size}KB</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-xs", getStatusColor(dep.status))}>
                        {dep.status}
                      </Badge>
                      {!dep.isRequired && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeDependency(dep.moduleKey)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Dependency Tree Preview */}
        {tree && (
          <div className="p-3 rounded-lg border bg-muted/30">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <LinkIcon className="h-4 w-4" /> Árbol de Dependencias
            </h4>
            <div className="text-xs space-y-1">
              <p>Profundidad: {tree.depth} niveles</p>
              <p>Total: {tree.totalDependencies} dependencias</p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {tree.nodes.slice(0, 5).map(node => (
                  <Badge key={node.id} variant="outline" className={cn("text-xs",
                    node.status === 'ok' ? 'border-green-500/30' :
                    node.status === 'warning' ? 'border-yellow-500/30' : 'border-red-500/30'
                  )}>
                    {node.moduleName}
                  </Badge>
                ))}
                {tree.nodes.length > 5 && (
                  <Badge variant="outline" className="text-xs">+{tree.nodes.length - 5} más</Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ModuleDependenciesPanel;
