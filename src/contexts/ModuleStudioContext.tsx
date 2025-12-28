/**
 * ModuleStudioContext - Estado compartido entre todas las páginas del Module Studio
 * Mantiene el módulo seleccionado, datos y navegación consistente
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useModuleDependencyGraph } from '@/hooks/admin/useModuleDependencyGraph';
import { useModuleChangeHistory } from '@/hooks/admin/useModuleChangeHistory';
import type { ModuleContext as CopilotContext } from '@/hooks/admin/useModuleCopilot';
import { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export interface ModuleData {
  id: string;
  module_key: string;
  module_name: string;
  description: string | null;
  features: Json;
  version: string | null;
  dependencies: string[] | null;
  category: string;
  base_price: number | null;
  sector: string | null;
  is_core: boolean | null;
  is_required: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ModuleStudioContextValue {
  // Módulo seleccionado
  selectedModuleKey: string | null;
  selectedModule: ModuleData | null;
  setSelectedModuleKey: (key: string | null) => void;
  
  // Lista de módulos
  modules: ModuleData[];
  isLoadingModules: boolean;
  refetchModules: () => Promise<void>;
  
  // Grafo de dependencias
  graph: ReturnType<typeof useModuleDependencyGraph>['graph'];
  dependencies: ReturnType<typeof useModuleDependencyGraph>['dependencies'];
  isLoadingGraph: boolean;
  refetchGraph: () => Promise<void>;
  
  // Historial de cambios
  history: ReturnType<typeof useModuleChangeHistory>['history'];
  versions: ReturnType<typeof useModuleChangeHistory>['versions'];
  refetchHistory: () => Promise<void>;
  
  // Contexto para copilot/agent
  copilotContext: CopilotContext | null;
  
  // Acciones globales
  refreshAll: () => Promise<void>;
  saveModule: (data: Partial<ModuleData>) => Promise<boolean>;
  
  // UI State
  showCopilot: boolean;
  setShowCopilot: (show: boolean) => void;
  showAgent: boolean;
  setShowAgent: (show: boolean) => void;
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
}

const ModuleStudioContext = createContext<ModuleStudioContextValue | null>(null);

export function ModuleStudioProvider({ children }: { children: React.ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedModuleKey, setSelectedModuleKeyState] = useState<string | null>(
    searchParams.get('module')
  );
  
  // UI State
  const [showCopilot, setShowCopilot] = useState(true);
  const [showAgent, setShowAgent] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch modules
  const { data: modules = [], isLoading: isLoadingModules, refetch: refetchModulesQuery } = useQuery({
    queryKey: ['module-studio-modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_modules')
        .select('*')
        .order('module_name');
      if (error) throw error;
      return data as ModuleData[];
    },
  });

  // Grafo de dependencias
  const { graph, dependencies, isLoading: isLoadingGraph, refetch: refetchGraphQuery } = useModuleDependencyGraph();

  // Historial de cambios
  const { history, versions, refetch: refetchHistoryQuery } = useModuleChangeHistory(selectedModuleKey || undefined);

  // Módulo seleccionado
  const selectedModule = useMemo(() => 
    modules.find(m => m.module_key === selectedModuleKey) || null,
    [modules, selectedModuleKey]
  );

  // Sincronizar URL con estado
  const setSelectedModuleKey = useCallback((key: string | null) => {
    setSelectedModuleKeyState(key);
    if (key) {
      setSearchParams(prev => {
        prev.set('module', key);
        return prev;
      });
    } else {
      setSearchParams(prev => {
        prev.delete('module');
        return prev;
      });
    }
  }, [setSearchParams]);

  // Sincronizar estado con URL al cargar
  useEffect(() => {
    const urlModule = searchParams.get('module');
    if (urlModule && urlModule !== selectedModuleKey) {
      setSelectedModuleKeyState(urlModule);
    }
  }, [searchParams, selectedModuleKey]);

  // Contexto para copilot/agent
  const copilotContext: CopilotContext | null = useMemo(() => {
    if (!selectedModule) return null;
    const node = graph.nodes.get(selectedModule.module_key);
    return {
      moduleKey: selectedModule.module_key,
      moduleName: selectedModule.module_name,
      currentState: {
        module_key: selectedModule.module_key,
        module_name: selectedModule.module_name,
        description: selectedModule.description,
        features: selectedModule.features,
        version: selectedModule.version,
        dependencies: selectedModule.dependencies,
        category: selectedModule.category,
        base_price: selectedModule.base_price,
        sector: selectedModule.sector,
        is_core: selectedModule.is_core,
        is_required: selectedModule.is_required,
      },
      dependencies: selectedModule.dependencies || [],
      dependents: node?.dependents || [],
    };
  }, [selectedModule, graph]);

  // Acciones
  const refetchModules = useCallback(async () => {
    await refetchModulesQuery();
  }, [refetchModulesQuery]);

  const refetchGraph = useCallback(async () => {
    await refetchGraphQuery();
  }, [refetchGraphQuery]);

  const refetchHistory = useCallback(async () => {
    await refetchHistoryQuery();
  }, [refetchHistoryQuery]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refetchModules(),
      refetchGraph(),
      refetchHistory()
    ]);
    toast.success('Datos actualizados');
  }, [refetchModules, refetchGraph, refetchHistory]);

  const saveModule = useCallback(async (data: Partial<ModuleData>): Promise<boolean> => {
    if (!selectedModuleKey) return false;
    
    try {
      const { error } = await supabase
        .from('app_modules')
        .update({
          module_name: data.module_name,
          description: data.description,
          features: data.features,
          version: data.version,
          dependencies: data.dependencies,
          base_price: data.base_price,
          updated_at: new Date().toISOString()
        })
        .eq('module_key', selectedModuleKey);
      
      if (error) throw error;
      
      await refetchModules();
      toast.success('Módulo actualizado correctamente');
      return true;
    } catch (error) {
      console.error('Error saving module:', error);
      toast.error('Error al guardar el módulo');
      return false;
    }
  }, [selectedModuleKey, refetchModules]);

  const value: ModuleStudioContextValue = {
    selectedModuleKey,
    selectedModule,
    setSelectedModuleKey,
    modules,
    isLoadingModules,
    refetchModules,
    graph,
    dependencies,
    isLoadingGraph,
    refetchGraph,
    history,
    versions,
    refetchHistory,
    copilotContext,
    refreshAll,
    saveModule,
    showCopilot,
    setShowCopilot,
    showAgent,
    setShowAgent,
    showPreview,
    setShowPreview,
  };

  return (
    <ModuleStudioContext.Provider value={value}>
      {children}
    </ModuleStudioContext.Provider>
  );
}

export function useModuleStudioContext() {
  const context = useContext(ModuleStudioContext);
  if (!context) {
    throw new Error('useModuleStudioContext must be used within a ModuleStudioProvider');
  }
  return context;
}

export default ModuleStudioContext;
