/**
 * useModuleSandbox - Fase 4
 * Hook para gestión de sandbox de pruebas con IA
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ModuleSandbox {
  id: string;
  module_key: string;
  sandbox_name: string;
  original_state: Record<string, unknown>;
  modified_state: Record<string, unknown>;
  status: 'active' | 'testing' | 'validated' | 'failed' | 'deployed' | 'discarded';
  test_results?: SandboxTestResult;
  validation_errors?: ValidationError[];
  expires_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SandboxTestResult {
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration_ms: number;
  };
  tests: TestItem[];
  coverage?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
}

export interface TestItem {
  id: string;
  name: string;
  category: 'unit' | 'integration' | 'validation' | 'security' | 'performance';
  passed: boolean;
  message?: string;
  duration_ms: number;
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export interface SandboxComparison {
  field: string;
  original: unknown;
  modified: unknown;
  change_type: 'added' | 'removed' | 'modified' | 'unchanged';
  impact_level: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

export function useModuleSandbox(moduleKey?: string) {
  const queryClient = useQueryClient();
  const [activeSandboxId, setActiveSandboxId] = useState<string | null>(null);

  // === FETCH SANDBOXES VIA EDGE FUNCTION ===
  const sandboxesQuery = useQuery({
    queryKey: ['module-sandboxes', moduleKey],
    queryFn: async () => {
      if (!moduleKey) return [];
      
      const { data, error } = await supabase.functions.invoke('module-sandbox', {
        body: { action: 'list', moduleKey }
      });

      if (error) throw error;
      return (data?.sandboxes || []) as ModuleSandbox[];
    },
    enabled: !!moduleKey,
  });

  // Get active sandbox
  const activeSandbox = sandboxesQuery.data?.find(s => 
    s.id === activeSandboxId || s.status === 'active' || s.status === 'testing'
  ) || null;

  // === CREATE SANDBOX ===
  const createSandbox = useMutation({
    mutationFn: async (params: {
      module_key: string;
      sandbox_name: string;
      original_state: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase.functions.invoke('module-sandbox', {
        body: { 
          action: 'create',
          moduleKey: params.module_key,
          sandbox_name: params.sandbox_name,
          original_state: params.original_state,
          modified_state: params.original_state
        }
      });

      if (error) throw error;
      return data?.sandbox as ModuleSandbox;
    },
    onSuccess: (sandbox) => {
      setActiveSandboxId(sandbox.id);
      queryClient.invalidateQueries({ queryKey: ['module-sandboxes', moduleKey] });
      toast.success('Sandbox creado correctamente');
    },
    onError: (err: Error) => {
      toast.error('Error al crear sandbox: ' + err.message);
    },
  });

  // === UPDATE SANDBOX STATE ===
  const updateSandbox = useMutation({
    mutationFn: async (params: {
      id: string;
      modified_state?: Record<string, unknown>;
      status?: ModuleSandbox['status'];
    }) => {
      const { data, error } = await supabase.functions.invoke('module-sandbox', {
        body: { 
          action: 'update_state',
          sandboxId: params.id,
          modifiedState: params.modified_state
        }
      });

      if (error) throw error;
      return data?.sandbox as ModuleSandbox;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-sandboxes', moduleKey] });
    },
    onError: (err: Error) => {
      toast.error('Error al actualizar sandbox: ' + err.message);
    },
  });

  // === RUN TESTS WITH AI ===
  const runTests = useCallback(async (sandboxId: string): Promise<SandboxTestResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('module-sandbox', {
        body: { action: 'run_tests', sandboxId }
      });

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['module-sandboxes', moduleKey] });
      return data?.testResults as SandboxTestResult;
    } catch (err) {
      console.error('[useModuleSandbox] runTests error:', err);
      toast.error('Error al ejecutar tests');
      return null;
    }
  }, [moduleKey, queryClient]);

  // === VALIDATE SANDBOX WITH AI ===
  const validateSandbox = useCallback(async (sandboxId: string): Promise<ValidationError[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('module-sandbox', {
        body: { action: 'validate', sandboxId }
      });

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['module-sandboxes', moduleKey] });
      return data?.validationErrors || [];
    } catch (err) {
      console.error('[useModuleSandbox] validateSandbox error:', err);
      toast.error('Error en validación');
      return [];
    }
  }, [moduleKey, queryClient]);

  // === COMPARE SANDBOX ===
  const compareSandbox = useCallback(async (sandboxId: string): Promise<SandboxComparison[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('module-sandbox', {
        body: { action: 'compare', sandboxId }
      });

      if (error) throw error;
      return data?.comparison || [];
    } catch (err) {
      console.error('[useModuleSandbox] compareSandbox error:', err);
      return [];
    }
  }, []);

  // === DEPLOY SANDBOX ===
  const deploySandbox = useMutation({
    mutationFn: async (sandboxId: string) => {
      const { data, error } = await supabase.functions.invoke('module-sandbox', {
        body: { action: 'deploy', sandboxId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setActiveSandboxId(null);
      queryClient.invalidateQueries({ queryKey: ['module-sandboxes', moduleKey] });
      queryClient.invalidateQueries({ queryKey: ['app-modules-studio'] });
      toast.success('Cambios desplegados a producción');
    },
    onError: (err: Error) => {
      toast.error('Error al desplegar: ' + err.message);
    },
  });

  // === DISCARD SANDBOX ===
  const discardSandbox = useMutation({
    mutationFn: async (sandboxId: string) => {
      const { data, error } = await supabase.functions.invoke('module-sandbox', {
        body: { action: 'discard', sandboxId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setActiveSandboxId(null);
      queryClient.invalidateQueries({ queryKey: ['module-sandboxes', moduleKey] });
      toast.success('Sandbox descartado');
    },
    onError: (err: Error) => {
      toast.error('Error al descartar: ' + err.message);
    },
  });

  // === ROLLBACK ===
  const rollbackToSandbox = useCallback(async (sandboxId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('module-sandbox', {
        body: { action: 'rollback', sandboxId }
      });

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['module-sandboxes', moduleKey] });
      queryClient.invalidateQueries({ queryKey: ['app-modules-studio'] });
      toast.success('Rollback completado');
      return true;
    } catch (err) {
      console.error('[useModuleSandbox] rollbackToSandbox error:', err);
      toast.error('Error en rollback');
      return false;
    }
  }, [moduleKey, queryClient]);

  // === CLONE SANDBOX ===
  const cloneSandbox = useCallback(async (sandboxId: string, newName: string): Promise<ModuleSandbox | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('module-sandbox', {
        body: { action: 'clone', sandboxId, newName }
      });

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['module-sandboxes', moduleKey] });
      toast.success('Sandbox clonado');
      return data?.sandbox as ModuleSandbox;
    } catch (err) {
      console.error('[useModuleSandbox] cloneSandbox error:', err);
      toast.error('Error al clonar sandbox');
      return null;
    }
  }, [moduleKey, queryClient]);

  // Auto-select active sandbox
  useEffect(() => {
    if (sandboxesQuery.data && !activeSandboxId) {
      const active = sandboxesQuery.data.find(s => s.status === 'active' || s.status === 'testing');
      if (active) {
        setActiveSandboxId(active.id);
      }
    }
  }, [sandboxesQuery.data, activeSandboxId]);

  return {
    // Data
    sandboxes: sandboxesQuery.data || [],
    activeSandbox,
    isLoading: sandboxesQuery.isLoading,
    error: sandboxesQuery.error,

    // Mutations
    createSandbox,
    updateSandbox,
    deploySandbox,
    discardSandbox,

    // AI Actions
    runTests,
    validateSandbox,
    compareSandbox,
    rollbackToSandbox,
    cloneSandbox,

    // State
    setActiveSandboxId,
    refetch: sandboxesQuery.refetch,
  };
}

export default useModuleSandbox;
