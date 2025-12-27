/**
 * useModuleDependencyGraph - KB 2.0
 * Hook para gestionar el grafo de dependencias entre módulos
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ModuleDependency {
  id: string;
  module_key: string;
  depends_on: string;
  dependency_type: 'required' | 'optional' | 'peer' | 'dev';
  min_version?: string;
  max_version?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModuleCompatibility {
  id: string;
  module_a: string;
  module_b: string;
  compatibility_status: 'compatible' | 'partial' | 'incompatible' | 'unknown' | 'testing';
  compatibility_score?: number;
  notes?: string;
  known_issues?: Record<string, unknown>;
  workarounds?: Record<string, unknown>;
}

export interface DependencyNode {
  id: string;
  module_key: string;
  dependencies: string[];
  dependents: string[];
  level: number;
  isCore: boolean;
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  edges: Array<{ from: string; to: string; type: string }>;
  levels: Map<number, string[]>;
  hasCycles: boolean;
  cycles: string[][];
}

export function useModuleDependencyGraph() {
  const queryClient = useQueryClient();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  // === FETCH DEPENDENCIES ===
  const dependenciesQuery = useQuery({
    queryKey: ['module-dependencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('module_dependencies')
        .select('*')
        .eq('is_active', true)
        .order('module_key');

      if (error) throw error;
      return data as ModuleDependency[];
    },
  });

  // === FETCH COMPATIBILITY ===
  const compatibilityQuery = useQuery({
    queryKey: ['module-compatibility'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('module_compatibility')
        .select('*')
        .order('module_a');

      if (error) throw error;
      return data as ModuleCompatibility[];
    },
  });

  // === BUILD DEPENDENCY GRAPH ===
  const dependencyGraph = useMemo((): DependencyGraph => {
    const dependencies = dependenciesQuery.data || [];
    const nodes = new Map<string, DependencyNode>();
    const edges: Array<{ from: string; to: string; type: string }> = [];
    const levels = new Map<number, string[]>();

    // Collect all unique module keys
    const allModules = new Set<string>();
    dependencies.forEach(dep => {
      allModules.add(dep.module_key);
      allModules.add(dep.depends_on);
    });

    // Initialize nodes
    allModules.forEach(moduleKey => {
      nodes.set(moduleKey, {
        id: moduleKey,
        module_key: moduleKey,
        dependencies: [],
        dependents: [],
        level: 0,
        isCore: moduleKey === 'core',
      });
    });

    // Build edges and relationships
    dependencies.forEach(dep => {
      const node = nodes.get(dep.module_key);
      const dependsOnNode = nodes.get(dep.depends_on);

      if (node) {
        node.dependencies.push(dep.depends_on);
      }
      if (dependsOnNode) {
        dependsOnNode.dependents.push(dep.module_key);
      }

      edges.push({
        from: dep.module_key,
        to: dep.depends_on,
        type: dep.dependency_type,
      });
    });

    // Calculate levels (topological sort)
    const calculateLevels = () => {
      const visited = new Set<string>();
      const inStack = new Set<string>();
      const cycles: string[][] = [];
      let hasCycles = false;

      const dfs = (nodeKey: string, path: string[]): number => {
        if (inStack.has(nodeKey)) {
          hasCycles = true;
          const cycleStart = path.indexOf(nodeKey);
          cycles.push(path.slice(cycleStart));
          return 0;
        }
        if (visited.has(nodeKey)) {
          return nodes.get(nodeKey)?.level || 0;
        }

        visited.add(nodeKey);
        inStack.add(nodeKey);

        const node = nodes.get(nodeKey);
        if (!node) return 0;

        let maxLevel = 0;
        for (const dep of node.dependencies) {
          maxLevel = Math.max(maxLevel, dfs(dep, [...path, nodeKey]) + 1);
        }

        node.level = maxLevel;
        inStack.delete(nodeKey);
        return maxLevel;
      };

      nodes.forEach((_, key) => {
        if (!visited.has(key)) {
          dfs(key, []);
        }
      });

      // Group by levels
      nodes.forEach((node, key) => {
        const levelNodes = levels.get(node.level) || [];
        levelNodes.push(key);
        levels.set(node.level, levelNodes);
      });

      return { hasCycles, cycles };
    };

    const { hasCycles, cycles } = calculateLevels();

    return { nodes, edges, levels, hasCycles, cycles };
  }, [dependenciesQuery.data]);

  // === GET MODULE DEPENDENCIES ===
  const getModuleDependencies = useCallback((moduleKey: string): string[] => {
    const node = dependencyGraph.nodes.get(moduleKey);
    if (!node) return [];

    const allDeps = new Set<string>();
    const collectDeps = (key: string) => {
      const n = dependencyGraph.nodes.get(key);
      if (!n) return;
      n.dependencies.forEach(dep => {
        if (!allDeps.has(dep)) {
          allDeps.add(dep);
          collectDeps(dep);
        }
      });
    };

    collectDeps(moduleKey);
    return Array.from(allDeps);
  }, [dependencyGraph]);

  // === GET MODULE DEPENDENTS ===
  const getModuleDependents = useCallback((moduleKey: string): string[] => {
    const node = dependencyGraph.nodes.get(moduleKey);
    if (!node) return [];

    const allDependents = new Set<string>();
    const collectDependents = (key: string) => {
      const n = dependencyGraph.nodes.get(key);
      if (!n) return;
      n.dependents.forEach(dep => {
        if (!allDependents.has(dep)) {
          allDependents.add(dep);
          collectDependents(dep);
        }
      });
    };

    collectDependents(moduleKey);
    return Array.from(allDependents);
  }, [dependencyGraph]);

  // === CHECK COMPATIBILITY ===
  const checkCompatibility = useCallback((moduleA: string, moduleB: string): ModuleCompatibility | null => {
    const compatibilities = compatibilityQuery.data || [];
    return compatibilities.find(
      c => (c.module_a === moduleA && c.module_b === moduleB) ||
           (c.module_a === moduleB && c.module_b === moduleA)
    ) || null;
  }, [compatibilityQuery.data]);

  // === ADD DEPENDENCY ===
  const addDependency = useMutation({
    mutationFn: async (dep: Partial<ModuleDependency>) => {
      const { data, error } = await supabase
        .from('module_dependencies')
        .insert({
          module_key: dep.module_key!,
          depends_on: dep.depends_on!,
          dependency_type: dep.dependency_type || 'required',
          min_version: dep.min_version,
          max_version: dep.max_version,
          description: dep.description,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-dependencies'] });
      toast.success('Dependencia añadida');
    },
    onError: (err: Error) => {
      toast.error('Error al añadir dependencia: ' + err.message);
    },
  });

  // === REMOVE DEPENDENCY ===
  const removeDependency = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('module_dependencies')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-dependencies'] });
      toast.success('Dependencia eliminada');
    },
    onError: (err: Error) => {
      toast.error('Error al eliminar dependencia: ' + err.message);
    },
  });

  // === UPDATE COMPATIBILITY ===
  const updateCompatibility = useMutation({
    mutationFn: async (data: Partial<ModuleCompatibility> & { module_a: string; module_b: string }) => {
      const { data: result, error } = await supabase
        .from('module_compatibility')
        .upsert({
          module_a: data.module_a,
          module_b: data.module_b,
          compatibility_status: data.compatibility_status || 'unknown',
          compatibility_score: data.compatibility_score,
          notes: data.notes,
          tested_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-compatibility'] });
      toast.success('Compatibilidad actualizada');
    },
    onError: (err: Error) => {
      toast.error('Error al actualizar compatibilidad: ' + err.message);
    },
  });

  // === VALIDATE INSTALLATION ORDER ===
  const getInstallationOrder = useCallback((modules: string[]): string[] => {
    const order: string[] = [];
    const visited = new Set<string>();

    const visit = (moduleKey: string) => {
      if (visited.has(moduleKey)) return;
      visited.add(moduleKey);

      const deps = getModuleDependencies(moduleKey);
      deps.forEach(dep => {
        if (modules.includes(dep)) {
          visit(dep);
        }
      });

      if (modules.includes(moduleKey)) {
        order.push(moduleKey);
      }
    };

    modules.forEach(m => visit(m));
    return order;
  }, [getModuleDependencies]);

  return {
    // Data
    dependencies: dependenciesQuery.data || [],
    compatibilities: compatibilityQuery.data || [],
    graph: dependencyGraph,
    isLoading: dependenciesQuery.isLoading || compatibilityQuery.isLoading,
    error: dependenciesQuery.error || compatibilityQuery.error,

    // Selection
    selectedModule,
    setSelectedModule,

    // Computed
    getModuleDependencies,
    getModuleDependents,
    checkCompatibility,
    getInstallationOrder,

    // Mutations
    addDependency,
    removeDependency,
    updateCompatibility,

    // Refetch
    refetch: () => {
      dependenciesQuery.refetch();
      compatibilityQuery.refetch();
    },
  };
}

export default useModuleDependencyGraph;
