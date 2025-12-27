/**
 * useModuleVersionControl - Hook para control de versiones de módulos
 * Fase 5C: Versionado avanzado, branches, merge y rollback
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// === INTERFACES ===
export interface ModuleVersion {
  id: string;
  moduleKey: string;
  version: string;
  semver: { major: number; minor: number; patch: number };
  branchName: string;
  commitHash: string;
  commitMessage: string;
  author: string;
  authorId: string;
  changes: VersionChange[];
  state: Record<string, unknown>;
  parentVersion?: string;
  isLatest: boolean;
  isStable: boolean;
  tags: string[];
  createdAt: string;
}

export interface VersionChange {
  type: 'added' | 'modified' | 'removed';
  field: string;
  oldValue?: unknown;
  newValue?: unknown;
  description?: string;
}

export interface ModuleBranch {
  id: string;
  name: string;
  moduleKey: string;
  headVersion: string;
  baseBranch?: string;
  baseVersion?: string;
  author: string;
  authorId: string;
  description?: string;
  status: 'active' | 'merged' | 'abandoned';
  isProtected: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MergeRequest {
  id: string;
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  moduleKey: string;
  author: string;
  authorId: string;
  status: 'open' | 'approved' | 'rejected' | 'merged' | 'conflict';
  reviewers: string[];
  approvals: string[];
  conflicts: MergeConflict[];
  changes: VersionChange[];
  createdAt: string;
  updatedAt: string;
}

export interface MergeConflict {
  field: string;
  sourceValue: unknown;
  targetValue: unknown;
  resolution?: 'source' | 'target' | 'custom';
  customValue?: unknown;
}

export interface VersionDiff {
  added: VersionChange[];
  modified: VersionChange[];
  removed: VersionChange[];
  totalChanges: number;
}

// === HOOK ===
export function useModuleVersionControl(moduleKey?: string) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [versions, setVersions] = useState<ModuleVersion[]>([]);
  const [branches, setBranches] = useState<ModuleBranch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<ModuleBranch | null>(null);
  const [mergeRequests, setMergeRequests] = useState<MergeRequest[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ModuleVersion | null>(null);
  const [compareVersions, setCompareVersions] = useState<{ v1: string; v2: string } | null>(null);
  const [diff, setDiff] = useState<VersionDiff | null>(null);

  // === FETCH VERSIONS ===
  const fetchVersions = useCallback(async (key: string, branch?: string) => {
    setIsLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-version-control',
        {
          body: {
            action: 'list_versions',
            moduleKey: key,
            branch: branch || 'main'
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setVersions(fnData.versions || []);
        return fnData.versions;
      }
    } catch (error) {
      console.error('[useModuleVersionControl] fetchVersions error:', error);
      toast.error('Error al cargar versiones');
    } finally {
      setIsLoading(false);
    }
    return [];
  }, []);

  // === FETCH BRANCHES ===
  const fetchBranches = useCallback(async (key: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-version-control',
        {
          body: {
            action: 'list_branches',
            moduleKey: key
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setBranches(fnData.branches || []);
        const defaultBranch = fnData.branches?.find((b: ModuleBranch) => b.isDefault);
        if (defaultBranch) setCurrentBranch(defaultBranch);
        return fnData.branches;
      }
    } catch (error) {
      console.error('[useModuleVersionControl] fetchBranches error:', error);
    }
    return [];
  }, []);

  // === CREATE VERSION (COMMIT) ===
  const createVersion = useCallback(async (
    key: string,
    commitMessage: string,
    changes: VersionChange[],
    newState: Record<string, unknown>,
    versionBump: 'major' | 'minor' | 'patch' = 'patch'
  ) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    setIsLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-version-control',
        {
          body: {
            action: 'create_version',
            moduleKey: key,
            commitMessage,
            changes,
            newState,
            versionBump,
            branch: currentBranch?.name || 'main',
            authorId: user.id
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success(`Versión ${fnData.version.version} creada`);
        await fetchVersions(key, currentBranch?.name);
        return fnData.version;
      }

      throw new Error(fnData?.error || 'Error al crear versión');
    } catch (error) {
      console.error('[useModuleVersionControl] createVersion error:', error);
      toast.error('Error al crear versión');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, currentBranch, fetchVersions]);

  // === CREATE BRANCH ===
  const createBranch = useCallback(async (
    key: string,
    branchName: string,
    description?: string,
    fromVersion?: string
  ) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-version-control',
        {
          body: {
            action: 'create_branch',
            moduleKey: key,
            branchName,
            description,
            fromVersion,
            baseBranch: currentBranch?.name || 'main',
            authorId: user.id
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success(`Rama '${branchName}' creada`);
        await fetchBranches(key);
        return fnData.branch;
      }

      throw new Error(fnData?.error || 'Error al crear rama');
    } catch (error) {
      console.error('[useModuleVersionControl] createBranch error:', error);
      toast.error('Error al crear rama');
      return null;
    }
  }, [user?.id, currentBranch, fetchBranches]);

  // === SWITCH BRANCH ===
  const switchBranch = useCallback(async (branchName: string) => {
    const branch = branches.find(b => b.name === branchName);
    if (branch) {
      setCurrentBranch(branch);
      if (moduleKey) {
        await fetchVersions(moduleKey, branchName);
      }
      toast.success(`Cambiado a rama '${branchName}'`);
    }
  }, [branches, moduleKey, fetchVersions]);

  // === CREATE MERGE REQUEST ===
  const createMergeRequest = useCallback(async (
    key: string,
    title: string,
    description: string,
    sourceBranch: string,
    targetBranch: string,
    reviewers: string[] = []
  ) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-version-control',
        {
          body: {
            action: 'create_merge_request',
            moduleKey: key,
            title,
            description,
            sourceBranch,
            targetBranch,
            reviewers,
            authorId: user.id
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Merge request creado');
        await fetchMergeRequests(key);
        return fnData.mergeRequest;
      }

      throw new Error(fnData?.error || 'Error al crear merge request');
    } catch (error) {
      console.error('[useModuleVersionControl] createMergeRequest error:', error);
      toast.error('Error al crear merge request');
      return null;
    }
  }, [user?.id]);

  // === FETCH MERGE REQUESTS ===
  const fetchMergeRequests = useCallback(async (key: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-version-control',
        {
          body: {
            action: 'list_merge_requests',
            moduleKey: key
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setMergeRequests(fnData.mergeRequests || []);
        return fnData.mergeRequests;
      }
    } catch (error) {
      console.error('[useModuleVersionControl] fetchMergeRequests error:', error);
    }
    return [];
  }, []);

  // === MERGE ===
  const merge = useCallback(async (mergeRequestId: string, conflictResolutions?: MergeConflict[]) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return false;
    }

    setIsLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-version-control',
        {
          body: {
            action: 'merge',
            mergeRequestId,
            conflictResolutions,
            mergedById: user.id
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Merge completado');
        if (moduleKey) {
          await fetchVersions(moduleKey, currentBranch?.name);
          await fetchMergeRequests(moduleKey);
        }
        return true;
      }

      if (fnData?.conflicts) {
        toast.error('Hay conflictos que resolver');
        return false;
      }

      throw new Error(fnData?.error || 'Error en merge');
    } catch (error) {
      console.error('[useModuleVersionControl] merge error:', error);
      toast.error('Error al hacer merge');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, moduleKey, currentBranch, fetchVersions, fetchMergeRequests]);

  // === ROLLBACK ===
  const rollback = useCallback(async (key: string, targetVersion: string, reason: string) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return false;
    }

    setIsLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-version-control',
        {
          body: {
            action: 'rollback',
            moduleKey: key,
            targetVersion,
            reason,
            authorId: user.id
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success(`Rollback a ${targetVersion} completado`);
        await fetchVersions(key, currentBranch?.name);
        return true;
      }

      throw new Error(fnData?.error || 'Error en rollback');
    } catch (error) {
      console.error('[useModuleVersionControl] rollback error:', error);
      toast.error('Error al hacer rollback');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, currentBranch, fetchVersions]);

  // === COMPARE VERSIONS ===
  const compareVersionsFn = useCallback(async (v1: string, v2: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-version-control',
        {
          body: {
            action: 'compare',
            version1: v1,
            version2: v2
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setDiff(fnData.diff);
        setCompareVersions({ v1, v2 });
        return fnData.diff;
      }
    } catch (error) {
      console.error('[useModuleVersionControl] compareVersions error:', error);
    }
    return null;
  }, []);

  // === TAG VERSION ===
  const tagVersion = useCallback(async (versionId: string, tag: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-version-control',
        {
          body: {
            action: 'tag_version',
            versionId,
            tag
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success(`Tag '${tag}' añadido`);
        if (moduleKey) await fetchVersions(moduleKey, currentBranch?.name);
        return true;
      }
    } catch (error) {
      console.error('[useModuleVersionControl] tagVersion error:', error);
      toast.error('Error al añadir tag');
    }
    return false;
  }, [moduleKey, currentBranch, fetchVersions]);

  // === INITIAL FETCH ===
  useEffect(() => {
    if (moduleKey) {
      fetchBranches(moduleKey);
      fetchVersions(moduleKey);
      fetchMergeRequests(moduleKey);
    }
  }, [moduleKey]);

  // === RETURN ===
  return {
    // Estado
    isLoading,
    versions,
    branches,
    currentBranch,
    mergeRequests,
    selectedVersion,
    versionComparison: compareVersions,
    diff,
    // Setters
    setSelectedVersion,
    setCurrentBranch,
    // Acciones
    fetchVersions,
    fetchBranches,
    createVersion,
    createBranch,
    switchBranch,
    createMergeRequest,
    fetchMergeRequests,
    merge,
    rollback,
    compareVersions: compareVersionsFn,
    tagVersion,
    // Helpers
    getLatestVersion: () => versions.find(v => v.isLatest),
    getStableVersion: () => versions.find(v => v.isStable),
  };
}

export default useModuleVersionControl;
