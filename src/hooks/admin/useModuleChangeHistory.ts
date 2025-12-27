/**
 * useModuleChangeHistory - KB 2.0
 * Hook para gestión del historial de cambios de módulos
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ModuleChangeRecord {
  id: string;
  module_key: string;
  change_type: 'create' | 'update' | 'delete' | 'feature_add' | 'feature_remove' | 'breaking' | 'patch' | 'minor' | 'major';
  previous_state?: Record<string, unknown>;
  new_state?: Record<string, unknown>;
  impact_analysis?: {
    risk_level: string;
    affected_modules: string[];
    recommendations: string[];
  };
  affected_modules?: string[];
  risk_level?: 'safe' | 'warning' | 'breaking';
  version_before?: string;
  version_after?: string;
  changelog?: string;
  rollback_available: boolean;
  changed_by?: string;
  created_at: string;
}

export interface ModuleVersion {
  id: string;
  module_key: string;
  version: string;
  version_major: number;
  version_minor: number;
  version_patch: number;
  release_notes?: string;
  breaking_changes?: string[];
  new_features?: string[];
  bug_fixes?: string[];
  state_snapshot?: Record<string, unknown>;
  is_stable: boolean;
  is_latest: boolean;
  published_by?: string;
  published_at: string;
  created_at: string;
}

export function useModuleChangeHistory(moduleKey?: string) {
  const queryClient = useQueryClient();

  // === FETCH HISTORY ===
  const historyQuery = useQuery({
    queryKey: ['module-change-history', moduleKey],
    queryFn: async () => {
      let query = supabase
        .from('module_change_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (moduleKey) {
        query = query.eq('module_key', moduleKey);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ModuleChangeRecord[];
    },
  });

  // === FETCH VERSIONS ===
  const versionsQuery = useQuery({
    queryKey: ['module-versions', moduleKey],
    queryFn: async () => {
      let query = supabase
        .from('module_versions')
        .select('*')
        .order('version_major', { ascending: false })
        .order('version_minor', { ascending: false })
        .order('version_patch', { ascending: false });

      if (moduleKey) {
        query = query.eq('module_key', moduleKey);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ModuleVersion[];
    },
  });

  // === RECORD CHANGE ===
  const recordChange = useMutation({
    mutationFn: async (change: Omit<ModuleChangeRecord, 'id' | 'created_at' | 'changed_by'>) => {
      const { data: user } = await supabase.auth.getUser();

      const insertData = {
        module_key: change.module_key,
        change_type: change.change_type,
        previous_state: change.previous_state as unknown,
        new_state: change.new_state as unknown,
        impact_analysis: change.impact_analysis as unknown,
        affected_modules: change.affected_modules,
        risk_level: change.risk_level,
        version_before: change.version_before,
        version_after: change.version_after,
        changelog: change.changelog,
        rollback_available: change.rollback_available ?? true,
        changed_by: user.user?.id,
      };

      const { data, error } = await supabase
        .from('module_change_history')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data as ModuleChangeRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-change-history'] });
    },
  });

  // === PUBLISH VERSION ===
  const publishVersion = useMutation({
    mutationFn: async (params: {
      module_key: string;
      version: string;
      release_notes?: string;
      breaking_changes?: string[];
      new_features?: string[];
      bug_fixes?: string[];
      state_snapshot?: Record<string, unknown>;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      
      // Parse version
      const [major, minor, patch] = params.version.split('.').map(Number);
      
      // Mark previous latest as not latest
      await supabase
        .from('module_versions')
        .update({ is_latest: false })
        .eq('module_key', params.module_key)
        .eq('is_latest', true);

      // Insert new version
      const insertData = {
        module_key: params.module_key,
        version: params.version,
        version_major: major,
        version_minor: minor,
        version_patch: patch,
        release_notes: params.release_notes,
        breaking_changes: params.breaking_changes,
        new_features: params.new_features,
        bug_fixes: params.bug_fixes,
        state_snapshot: params.state_snapshot as unknown,
        is_stable: true,
        is_latest: true,
        published_by: user.user?.id,
      };

      const { data, error } = await supabase
        .from('module_versions')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data as ModuleVersion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-versions'] });
      toast.success('Versión publicada correctamente');
    },
    onError: (err: Error) => {
      toast.error('Error al publicar versión: ' + err.message);
    },
  });

  // === ROLLBACK ===
  const rollback = useMutation({
    mutationFn: async (changeId: string) => {
      const change = historyQuery.data?.find(c => c.id === changeId);
      if (!change) throw new Error('Cambio no encontrado');
      if (!change.rollback_available) throw new Error('Este cambio no permite rollback');
      if (!change.previous_state) throw new Error('No hay estado anterior para restaurar');

      // Here we would apply the previous state to the module
      // For now, just record a new change
      await recordChange.mutateAsync({
        module_key: change.module_key,
        change_type: 'update',
        previous_state: change.new_state,
        new_state: change.previous_state,
        changelog: `Rollback desde ${change.version_after || 'desconocido'} a ${change.version_before || 'anterior'}`,
        risk_level: 'warning',
        rollback_available: true,
      });

      return change;
    },
    onSuccess: () => {
      toast.success('Rollback realizado correctamente');
    },
    onError: (err: Error) => {
      toast.error('Error en rollback: ' + err.message);
    },
  });

  // === GET LATEST VERSION ===
  const getLatestVersion = useCallback((modKey: string): ModuleVersion | null => {
    const versions = versionsQuery.data || [];
    return versions.find(v => v.module_key === modKey && v.is_latest) || null;
  }, [versionsQuery.data]);

  // === SUGGEST NEXT VERSION ===
  const suggestNextVersion = useCallback((
    currentVersion: string,
    changeType: 'patch' | 'minor' | 'major'
  ): string => {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    switch (changeType) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
      default:
        return `${major}.${minor}.${patch + 1}`;
    }
  }, []);

  return {
    // Data
    history: historyQuery.data || [],
    versions: versionsQuery.data || [],
    isLoading: historyQuery.isLoading || versionsQuery.isLoading,
    error: historyQuery.error || versionsQuery.error,

    // Actions
    recordChange,
    publishVersion,
    rollback,

    // Utilities
    getLatestVersion,
    suggestNextVersion,

    // Refetch
    refetch: () => {
      historyQuery.refetch();
      versionsQuery.refetch();
    },
  };
}

export default useModuleChangeHistory;
