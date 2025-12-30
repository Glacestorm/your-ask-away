/**
 * ModuleDependencyDetailDialog - Vista detallada de dependencias de un módulo
 * Muestra todas las dependencias directas, transitivas y dependientes
 */

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  GitBranch,
  ArrowDown,
  ArrowUp,
  Package,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Info,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleData {
  module_key: string;
  module_name: string;
  description?: string | null;
  dependencies?: string[] | null;
  version?: string | null;
  is_core?: boolean | null;
}

interface ModuleDependencyDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: ModuleData | null;
  allModules: ModuleData[];
  onNavigateToModule?: (moduleKey: string) => void;
}

export function ModuleDependencyDetailDialog({
  open,
  onOpenChange,
  module,
  allModules,
  onNavigateToModule,
}: ModuleDependencyDetailDialogProps) {
  // Build dependency map from all modules
  const dependencyMap = useMemo(() => {
    const map: Record<string, { module: ModuleData; directDeps: string[]; dependents: string[] }> = {};
    
    allModules.forEach(m => {
      map[m.module_key] = {
        module: m,
        directDeps: m.dependencies || [],
        dependents: [],
      };
    });

    // Calculate dependents
    allModules.forEach(m => {
      (m.dependencies || []).forEach(depKey => {
        if (map[depKey]) {
          map[depKey].dependents.push(m.module_key);
        }
      });
    });

    return map;
  }, [allModules]);

  // Get transitive dependencies (all deps of deps recursively)
  const getTransitiveDeps = (moduleKey: string, visited = new Set<string>()): string[] => {
    if (visited.has(moduleKey)) return [];
    visited.add(moduleKey);

    const entry = dependencyMap[moduleKey];
    if (!entry) return [];

    const allDeps: string[] = [];
    entry.directDeps.forEach(depKey => {
      if (!visited.has(depKey)) {
        allDeps.push(depKey);
        allDeps.push(...getTransitiveDeps(depKey, visited));
      }
    });

    return allDeps;
  };

  // Get transitive dependents (all modules that depend on this, recursively)
  const getTransitiveDependents = (moduleKey: string, visited = new Set<string>()): string[] => {
    if (visited.has(moduleKey)) return [];
    visited.add(moduleKey);

    const entry = dependencyMap[moduleKey];
    if (!entry) return [];

    const allDependents: string[] = [];
    entry.dependents.forEach(depKey => {
      if (!visited.has(depKey)) {
        allDependents.push(depKey);
        allDependents.push(...getTransitiveDependents(depKey, visited));
      }
    });

    return allDependents;
  };

  const directDeps = module ? (dependencyMap[module.module_key]?.directDeps || []) : [];
  const transitiveDeps = module ? getTransitiveDeps(module.module_key).filter(d => !directDeps.includes(d)) : [];
  const directDependents = module ? (dependencyMap[module.module_key]?.dependents || []) : [];
  const transitiveDependents = module ? getTransitiveDependents(module.module_key).filter(d => !directDependents.includes(d)) : [];

  const getModuleByKey = (key: string) => allModules.find(m => m.module_key === key);

  const renderModuleCard = (moduleKey: string, type: 'dependency' | 'dependent', isDirect: boolean) => {
    const mod = getModuleByKey(moduleKey);
    if (!mod) {
      return (
        <div
          key={moduleKey}
          className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5"
        >
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium">{moduleKey}</span>
          <Badge variant="destructive" className="text-[10px]">No encontrado</Badge>
        </div>
      );
    }

    return (
      <button
        key={moduleKey}
        onClick={() => {
          onNavigateToModule?.(moduleKey);
          onOpenChange(false);
        }}
        className={cn(
          'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
          'hover:bg-muted/50 hover:border-primary/30',
          isDirect ? 'border-border' : 'border-dashed border-muted-foreground/30'
        )}
      >
        <div className={cn(
          'p-2 rounded-lg',
          type === 'dependency' ? 'bg-info/10' : 'bg-warning/10'
        )}>
          {type === 'dependency' ? (
            <ArrowDown className="h-4 w-4 text-info" />
          ) : (
            <ArrowUp className="h-4 w-4 text-warning" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{mod.module_name}</span>
            {mod.is_core && <Badge variant="secondary" className="text-[9px] px-1">Core</Badge>}
            {!isDirect && <Badge variant="outline" className="text-[9px] px-1">Transitiva</Badge>}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {mod.description || mod.module_key}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Badge variant="outline" className="text-[10px]">v{mod.version || '1.0.0'}</Badge>
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </div>
      </button>
    );
  };

  if (!module) return null;

  const totalDeps = directDeps.length + transitiveDeps.length;
  const totalDependents = directDependents.length + transitiveDependents.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Dependencias de {module.module_name}
          </DialogTitle>
          <DialogDescription>
            Vista detallada del árbol de dependencias y módulos dependientes
          </DialogDescription>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="bg-info/5 border-info/20">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-info">{directDeps.length}</div>
              <div className="text-[10px] text-muted-foreground">Deps Directas</div>
            </CardContent>
          </Card>
          <Card className="bg-info/5 border-info/20">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-info">{transitiveDeps.length}</div>
              <div className="text-[10px] text-muted-foreground">Transitivas</div>
            </CardContent>
          </Card>
          <Card className="bg-warning/5 border-warning/20">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-warning">{directDependents.length}</div>
              <div className="text-[10px] text-muted-foreground">Dependientes</div>
            </CardContent>
          </Card>
          <Card className="bg-warning/5 border-warning/20">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-warning">{transitiveDependents.length}</div>
              <div className="text-[10px] text-muted-foreground">Indirectos</div>
            </CardContent>
          </Card>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {/* Dependencies Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ArrowDown className="h-4 w-4 text-info" />
                <h3 className="font-semibold text-sm">Dependencias ({totalDeps})</h3>
                <Info className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Módulos que este necesita</span>
              </div>

              {totalDeps === 0 ? (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/30 text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm">Este módulo no tiene dependencias</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {directDeps.length > 0 && (
                    <>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Directas ({directDeps.length})
                      </div>
                      {directDeps.map(depKey => renderModuleCard(depKey, 'dependency', true))}
                    </>
                  )}

                  {transitiveDeps.length > 0 && (
                    <>
                      <Separator className="my-3" />
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        Transitivas ({transitiveDeps.length})
                      </div>
                      {transitiveDeps.map(depKey => renderModuleCard(depKey, 'dependency', false))}
                    </>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Dependents Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ArrowUp className="h-4 w-4 text-warning" />
                <h3 className="font-semibold text-sm">Dependientes ({totalDependents})</h3>
                <Info className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Módulos que dependen de este</span>
              </div>

              {totalDependents === 0 ? (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/30 text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span className="text-sm">Ningún módulo depende de este</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {directDependents.length > 0 && (
                    <>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Directos ({directDependents.length})
                      </div>
                      {directDependents.map(depKey => renderModuleCard(depKey, 'dependent', true))}
                    </>
                  )}

                  {transitiveDependents.length > 0 && (
                    <>
                      <Separator className="my-3" />
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        Indirectos ({transitiveDependents.length})
                      </div>
                      {transitiveDependents.map(depKey => renderModuleCard(depKey, 'dependent', false))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default ModuleDependencyDetailDialog;
