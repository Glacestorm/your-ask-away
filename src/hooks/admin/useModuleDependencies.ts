/**
 * useModuleDependencies - Gestión de dependencias entre módulos
 * Árbol de dependencias, conflictos, actualizaciones
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ModuleDependency {
  id: string;
  moduleKey: string;
  moduleName: string;
  version: string;
  requiredVersion: string;
  status: 'satisfied' | 'outdated' | 'missing' | 'conflict';
  isRequired: boolean;
  isDev: boolean;
  size: number;
  lastUpdated: string;
}

export interface DependencyConflict {
  id: string;
  type: 'version' | 'circular' | 'missing' | 'incompatible';
  severity: 'error' | 'warning' | 'info';
  moduleA: string;
  moduleB?: string;
  description: string;
  resolution?: string;
  autoResolvable: boolean;
}

export interface DependencyUpdate {
  moduleKey: string;
  currentVersion: string;
  latestVersion: string;
  updateType: 'patch' | 'minor' | 'major';
  breakingChanges: boolean;
  changelog: string[];
  releaseDate: string;
}

export interface DependencyTree {
  root: string;
  nodes: DependencyNode[];
  depth: number;
  totalDependencies: number;
}

export interface DependencyNode {
  id: string;
  moduleKey: string;
  moduleName: string;
  version: string;
  level: number;
  children: string[];
  status: 'ok' | 'warning' | 'error';
}

interface DependenciesState {
  dependencies: ModuleDependency[];
  conflicts: DependencyConflict[];
  updates: DependencyUpdate[];
  tree: DependencyTree | null;
  isLoading: boolean;
  isResolving: boolean;
  isUpdating: boolean;
}

export function useModuleDependencies(moduleKey?: string) {
  const [state, setState] = useState<DependenciesState>({
    dependencies: [],
    conflicts: [],
    updates: [],
    tree: null,
    isLoading: false,
    isResolving: false,
    isUpdating: false
  });

  const fetchDependencies = useCallback(async () => {
    if (!moduleKey) return;
    
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { data, error } = await supabase.functions.invoke('module-copilot', {
        body: {
          action: 'get_dependencies',
          moduleKey
        }
      });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        dependencies: data?.dependencies || generateMockDependencies(),
        conflicts: data?.conflicts || [],
        updates: data?.updates || generateMockUpdates(),
        tree: data?.tree || generateMockTree(moduleKey),
        isLoading: false
      }));
    } catch (error) {
      console.error('[useModuleDependencies] fetchDependencies error:', error);
      setState(prev => ({
        ...prev,
        dependencies: generateMockDependencies(),
        conflicts: generateMockConflicts(),
        updates: generateMockUpdates(),
        tree: generateMockTree(moduleKey),
        isLoading: false
      }));
    }
  }, [moduleKey]);

  const resolveConflict = useCallback(async (conflictId: string) => {
    setState(prev => ({ ...prev, isResolving: true }));

    try {
      const { data, error } = await supabase.functions.invoke('module-copilot', {
        body: {
          action: 'resolve_conflict',
          conflictId,
          moduleKey
        }
      });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        conflicts: prev.conflicts.filter(c => c.id !== conflictId),
        isResolving: false
      }));

      toast.success('Conflicto resuelto');
      return true;
    } catch (error) {
      console.error('[useModuleDependencies] resolveConflict error:', error);
      setState(prev => ({ ...prev, isResolving: false }));
      toast.error('Error al resolver conflicto');
      return false;
    }
  }, [moduleKey]);

  const updateDependency = useCallback(async (depModuleKey: string, targetVersion: string) => {
    setState(prev => ({ ...prev, isUpdating: true }));

    try {
      const { data, error } = await supabase.functions.invoke('module-copilot', {
        body: {
          action: 'update_dependency',
          moduleKey,
          dependencyKey: depModuleKey,
          targetVersion
        }
      });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        dependencies: prev.dependencies.map(d => 
          d.moduleKey === depModuleKey 
            ? { ...d, version: targetVersion, status: 'satisfied' as const }
            : d
        ),
        updates: prev.updates.filter(u => u.moduleKey !== depModuleKey),
        isUpdating: false
      }));

      toast.success(`${depModuleKey} actualizado a v${targetVersion}`);
      return true;
    } catch (error) {
      console.error('[useModuleDependencies] updateDependency error:', error);
      setState(prev => ({ ...prev, isUpdating: false }));
      toast.error('Error al actualizar dependencia');
      return false;
    }
  }, [moduleKey]);

  const updateAllDependencies = useCallback(async () => {
    setState(prev => ({ ...prev, isUpdating: true }));

    try {
      for (const update of state.updates) {
        if (!update.breakingChanges) {
          await updateDependency(update.moduleKey, update.latestVersion);
        }
      }
      
      toast.success('Dependencias actualizadas');
      return true;
    } catch (error) {
      console.error('[useModuleDependencies] updateAllDependencies error:', error);
      toast.error('Error al actualizar dependencias');
      return false;
    } finally {
      setState(prev => ({ ...prev, isUpdating: false }));
    }
  }, [state.updates, updateDependency]);

  const addDependency = useCallback(async (depModuleKey: string, version: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const newDep: ModuleDependency = {
        id: `dep_${Date.now()}`,
        moduleKey: depModuleKey,
        moduleName: depModuleKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        version,
        requiredVersion: `^${version}`,
        status: 'satisfied',
        isRequired: true,
        isDev: false,
        size: Math.floor(Math.random() * 500) + 50,
        lastUpdated: new Date().toISOString()
      };

      setState(prev => ({
        ...prev,
        dependencies: [...prev.dependencies, newDep],
        isLoading: false
      }));

      toast.success(`Dependencia ${depModuleKey} añadida`);
      return true;
    } catch (error) {
      console.error('[useModuleDependencies] addDependency error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      toast.error('Error al añadir dependencia');
      return false;
    }
  }, []);

  const removeDependency = useCallback(async (depModuleKey: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      setState(prev => ({
        ...prev,
        dependencies: prev.dependencies.filter(d => d.moduleKey !== depModuleKey),
        isLoading: false
      }));

      toast.success(`Dependencia ${depModuleKey} eliminada`);
      return true;
    } catch (error) {
      console.error('[useModuleDependencies] removeDependency error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      toast.error('Error al eliminar dependencia');
      return false;
    }
  }, []);

  return {
    ...state,
    fetchDependencies,
    resolveConflict,
    updateDependency,
    updateAllDependencies,
    addDependency,
    removeDependency
  };
}

// Mock data generators
function generateMockDependencies(): ModuleDependency[] {
  return [
    { id: '1', moduleKey: 'auth-core', moduleName: 'Auth Core', version: '2.1.0', requiredVersion: '^2.0.0', status: 'satisfied', isRequired: true, isDev: false, size: 245, lastUpdated: '2024-01-15' },
    { id: '2', moduleKey: 'ui-components', moduleName: 'UI Components', version: '3.2.1', requiredVersion: '^3.0.0', status: 'satisfied', isRequired: true, isDev: false, size: 890, lastUpdated: '2024-01-10' },
    { id: '3', moduleKey: 'analytics', moduleName: 'Analytics', version: '1.5.0', requiredVersion: '^1.6.0', status: 'outdated', isRequired: false, isDev: false, size: 156, lastUpdated: '2023-12-20' },
    { id: '4', moduleKey: 'testing-utils', moduleName: 'Testing Utils', version: '4.0.0', requiredVersion: '^4.0.0', status: 'satisfied', isRequired: false, isDev: true, size: 432, lastUpdated: '2024-01-12' }
  ];
}

function generateMockConflicts(): DependencyConflict[] {
  return [
    { 
      id: 'c1', 
      type: 'version', 
      severity: 'warning', 
      moduleA: 'auth-core', 
      moduleB: 'user-management',
      description: 'auth-core@2.1.0 requiere user-management@^3.0.0 pero está instalada v2.8.0',
      resolution: 'Actualizar user-management a v3.0.0',
      autoResolvable: true
    }
  ];
}

function generateMockUpdates(): DependencyUpdate[] {
  return [
    { moduleKey: 'analytics', currentVersion: '1.5.0', latestVersion: '1.8.0', updateType: 'minor', breakingChanges: false, changelog: ['Nuevas métricas', 'Mejor rendimiento'], releaseDate: '2024-01-20' },
    { moduleKey: 'ui-components', currentVersion: '3.2.1', latestVersion: '4.0.0', updateType: 'major', breakingChanges: true, changelog: ['Nueva API de componentes', 'Theming mejorado'], releaseDate: '2024-01-18' }
  ];
}

function generateMockTree(rootKey?: string): DependencyTree {
  return {
    root: rootKey || 'main-module',
    nodes: [
      { id: 'n1', moduleKey: rootKey || 'main-module', moduleName: 'Main Module', version: '1.0.0', level: 0, children: ['n2', 'n3', 'n4'], status: 'ok' },
      { id: 'n2', moduleKey: 'auth-core', moduleName: 'Auth Core', version: '2.1.0', level: 1, children: ['n5'], status: 'ok' },
      { id: 'n3', moduleKey: 'ui-components', moduleName: 'UI Components', version: '3.2.1', level: 1, children: [], status: 'ok' },
      { id: 'n4', moduleKey: 'analytics', moduleName: 'Analytics', version: '1.5.0', level: 1, children: [], status: 'warning' },
      { id: 'n5', moduleKey: 'crypto-utils', moduleName: 'Crypto Utils', version: '1.0.0', level: 2, children: [], status: 'ok' }
    ],
    depth: 2,
    totalDependencies: 4
  };
}

export default useModuleDependencies;
