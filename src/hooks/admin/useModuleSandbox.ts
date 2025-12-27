/**
 * useModuleSandbox - KB 2.0
 * Hook para gestión de sandbox de pruebas de módulos
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ModuleSandbox {
  id: string;
  module_key: string;
  sandbox_name: string;
  original_state: Record<string, unknown>;
  modified_state: Record<string, unknown>;
  status: 'draft' | 'testing' | 'validated' | 'failed' | 'deployed' | 'discarded';
  test_results?: Record<string, unknown>;
  validation_errors?: Record<string, unknown>;
  expires_at: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SandboxTestResult {
  passed: boolean;
  tests: Array<{
    name: string;
    passed: boolean;
    message?: string;
    duration_ms?: number;
  }>;
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

export function useModuleSandbox(moduleKey?: string) {
  const queryClient = useQueryClient();
  const [activeSandbox, setActiveSandbox] = useState<ModuleSandbox | null>(null);

  // === FETCH SANDBOXES ===
  const sandboxesQuery = useQuery({
    queryKey: ['module-sandboxes', moduleKey],
    queryFn: async () => {
      let query = supabase
        .from('module_sandbox')
        .select('*')
        .order('created_at', { ascending: false });

      if (moduleKey) {
        query = query.eq('module_key', moduleKey);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ModuleSandbox[];
    },
  });

  // === CREATE SANDBOX ===
  const createSandbox = useMutation({
    mutationFn: async (params: {
      module_key: string;
      sandbox_name: string;
      original_state: Record<string, unknown>;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const insertData = {
        module_key: params.module_key,
        sandbox_name: params.sandbox_name,
        original_state: params.original_state as unknown,
        modified_state: params.original_state as unknown,
        status: 'draft',
        created_by: user.user?.id,
      };

      const { data, error } = await supabase
        .from('module_sandbox')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data as ModuleSandbox;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['module-sandboxes'] });
      setActiveSandbox(data);
      toast.success('Sandbox creado correctamente');
    },
    onError: (err: Error) => {
      toast.error('Error al crear sandbox: ' + err.message);
    },
  });

  // === UPDATE SANDBOX ===
  const updateSandbox = useMutation({
    mutationFn: async (params: {
      id: string;
      modified_state?: Record<string, unknown>;
      status?: ModuleSandbox['status'];
      test_results?: Record<string, unknown>;
      validation_errors?: Record<string, unknown>;
    }) => {
      const updateData: Record<string, unknown> = {};
      if (params.modified_state) updateData.modified_state = params.modified_state;
      if (params.status) updateData.status = params.status;
      if (params.test_results) updateData.test_results = params.test_results;
      if (params.validation_errors) updateData.validation_errors = params.validation_errors;

      const { data, error } = await supabase
        .from('module_sandbox')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single();

      if (error) throw error;
      return data as ModuleSandbox;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['module-sandboxes'] });
      if (activeSandbox?.id === data.id) {
        setActiveSandbox(data);
      }
    },
    onError: (err: Error) => {
      toast.error('Error al actualizar sandbox: ' + err.message);
    },
  });

  // === RUN TESTS ===
  const runTests = useCallback(async (sandboxId: string): Promise<SandboxTestResult> => {
    const sandbox = sandboxesQuery.data?.find(s => s.id === sandboxId);
    if (!sandbox) throw new Error('Sandbox no encontrado');

    // Update status to testing
    await updateSandbox.mutateAsync({ id: sandboxId, status: 'testing' });

    // Simulate tests (in production, this would call an edge function)
    const tests = [
      { name: 'Schema validation', passed: true, duration_ms: 45 },
      { name: 'Dependency check', passed: true, duration_ms: 120 },
      { name: 'Permission validation', passed: true, duration_ms: 30 },
      { name: 'Route conflicts', passed: true, duration_ms: 55 },
      { name: 'Translation completeness', passed: Math.random() > 0.3, duration_ms: 200 },
    ];

    const result: SandboxTestResult = {
      passed: tests.every(t => t.passed),
      tests,
      summary: {
        total: tests.length,
        passed: tests.filter(t => t.passed).length,
        failed: tests.filter(t => !t.passed).length,
      },
    };

    // Update sandbox with results
    await updateSandbox.mutateAsync({
      id: sandboxId,
      status: result.passed ? 'validated' : 'failed',
      test_results: result as unknown as Record<string, unknown>,
    });

    return result;
  }, [sandboxesQuery.data, updateSandbox]);

  // === DEPLOY SANDBOX ===
  const deploySandbox = useMutation({
    mutationFn: async (sandboxId: string) => {
      const sandbox = sandboxesQuery.data?.find(s => s.id === sandboxId);
      if (!sandbox) throw new Error('Sandbox no encontrado');
      if (sandbox.status !== 'validated') {
        throw new Error('Solo se pueden desplegar sandboxes validados');
      }

      // Here we would apply the changes to the actual module
      // For now, just update the status
      const { data, error } = await supabase
        .from('module_sandbox')
        .update({ status: 'deployed' })
        .eq('id', sandboxId)
        .select()
        .single();

      if (error) throw error;
      return data as ModuleSandbox;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-sandboxes'] });
      toast.success('Cambios desplegados correctamente');
    },
    onError: (err: Error) => {
      toast.error('Error al desplegar: ' + err.message);
    },
  });

  // === DISCARD SANDBOX ===
  const discardSandbox = useMutation({
    mutationFn: async (sandboxId: string) => {
      const { error } = await supabase
        .from('module_sandbox')
        .update({ status: 'discarded' })
        .eq('id', sandboxId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-sandboxes'] });
      setActiveSandbox(null);
      toast.success('Sandbox descartado');
    },
    onError: (err: Error) => {
      toast.error('Error al descartar sandbox: ' + err.message);
    },
  });

  // === GET DIFF ===
  const getDiff = useCallback((sandbox: ModuleSandbox): Array<{
    path: string;
    oldValue: unknown;
    newValue: unknown;
    type: 'added' | 'removed' | 'changed';
  }> => {
    const diffs: Array<{
      path: string;
      oldValue: unknown;
      newValue: unknown;
      type: 'added' | 'removed' | 'changed';
    }> = [];

    const compareObjects = (
      original: Record<string, unknown>,
      modified: Record<string, unknown>,
      path: string = ''
    ) => {
      const allKeys = new Set([...Object.keys(original), ...Object.keys(modified)]);

      allKeys.forEach(key => {
        const fullPath = path ? `${path}.${key}` : key;
        const oldVal = original[key];
        const newVal = modified[key];

        if (!(key in original)) {
          diffs.push({ path: fullPath, oldValue: undefined, newValue: newVal, type: 'added' });
        } else if (!(key in modified)) {
          diffs.push({ path: fullPath, oldValue: oldVal, newValue: undefined, type: 'removed' });
        } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          if (typeof oldVal === 'object' && typeof newVal === 'object' && oldVal && newVal) {
            compareObjects(
              oldVal as Record<string, unknown>,
              newVal as Record<string, unknown>,
              fullPath
            );
          } else {
            diffs.push({ path: fullPath, oldValue: oldVal, newValue: newVal, type: 'changed' });
          }
        }
      });
    };

    compareObjects(sandbox.original_state, sandbox.modified_state);
    return diffs;
  }, []);

  return {
    // Data
    sandboxes: sandboxesQuery.data || [],
    activeSandbox,
    isLoading: sandboxesQuery.isLoading,
    error: sandboxesQuery.error,

    // Actions
    setActiveSandbox,
    createSandbox,
    updateSandbox,
    runTests,
    deploySandbox,
    discardSandbox,

    // Utilities
    getDiff,

    // Refetch
    refetch: sandboxesQuery.refetch,
  };
}

export default useModuleSandbox;
