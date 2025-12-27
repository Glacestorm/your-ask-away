/**
 * useModuleVersioning - Sistema de versionado semántico avanzado
 * Incluye changelog automático, tagging y comparación de versiones
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ModuleVersionInfo {
  id: string;
  moduleKey: string;
  version: string;
  tag: 'alpha' | 'beta' | 'rc' | 'stable';
  changelog: string[];
  releaseNotes: string;
  createdAt: string;
  createdBy: string;
  isLatest: boolean;
  downloadCount: number;
  compatibility: string[];
}

export interface VersionDiff {
  fromVersion: string;
  toVersion: string;
  addedFeatures: string[];
  removedFeatures: string[];
  modifiedFeatures: string[];
  breakingChanges: string[];
  migrationSteps: string[];
}

export interface VersioningState {
  versions: ModuleVersionInfo[];
  latestVersion: ModuleVersionInfo | null;
  selectedVersion: ModuleVersionInfo | null;
  diff: VersionDiff | null;
  isLoading: boolean;
  isGeneratingChangelog: boolean;
}

export function useModuleVersioning(moduleKey?: string) {
  const [state, setState] = useState<VersioningState>({
    versions: [],
    latestVersion: null,
    selectedVersion: null,
    diff: null,
    isLoading: false,
    isGeneratingChangelog: false
  });

  // Fetch all versions for a module
  const fetchVersions = useCallback(async (key?: string) => {
    const targetKey = key || moduleKey;
    if (!targetKey) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { data, error } = await supabase
        .from('module_versions')
        .select('*')
        .eq('module_key', targetKey)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const versions: ModuleVersionInfo[] = (data || []).map(v => ({
        id: v.id,
        moduleKey: v.module_key,
        version: v.version,
        tag: (v.is_stable ? 'stable' : 'beta') as 'alpha' | 'beta' | 'rc' | 'stable',
        changelog: [...(v.new_features || []), ...(v.bug_fixes || [])],
        releaseNotes: v.release_notes || '',
        createdAt: v.created_at,
        createdBy: v.published_by || 'system',
        isLatest: v.is_latest || false,
        downloadCount: 0,
        compatibility: []
      }));

      const latest = versions.find(v => v.isLatest) || versions[0] || null;

      setState(prev => ({
        ...prev,
        versions,
        latestVersion: latest,
        isLoading: false
      }));

      return versions;
    } catch (error) {
      console.error('[useModuleVersioning] fetchVersions error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return [];
    }
  }, [moduleKey]);

  // Generate changelog using AI
  const generateChangelog = useCallback(async (
    fromVersion: string,
    toVersion: string,
    changes: string[]
  ) => {
    setState(prev => ({ ...prev, isGeneratingChangelog: true }));

    try {
      const { data, error } = await supabase.functions.invoke('module-version-control', {
        body: {
          action: 'generate_changelog',
          moduleKey,
          fromVersion,
          toVersion,
          changes
        }
      });

      if (error) throw error;

      setState(prev => ({ ...prev, isGeneratingChangelog: false }));
      return data?.changelog || [];
    } catch (error) {
      console.error('[useModuleVersioning] generateChangelog error:', error);
      setState(prev => ({ ...prev, isGeneratingChangelog: false }));
      return changes;
    }
  }, [moduleKey]);

  // Create a new version
  const createVersion = useCallback(async (
    version: string,
    tag: 'alpha' | 'beta' | 'rc' | 'stable',
    changelog: string[],
    releaseNotes: string
  ) => {
    if (!moduleKey) {
      toast.error('No hay módulo seleccionado');
      return null;
    }

    try {
      // Mark previous versions as not latest
      await supabase
        .from('module_versions')
        .update({ is_latest: false })
        .eq('module_key', moduleKey);

      // Create new version - parse version parts
      const versionParts = version.split('.').map(Number);
      const { data, error } = await supabase
        .from('module_versions')
        .insert({
          module_key: moduleKey,
          version,
          version_major: versionParts[0] || 1,
          version_minor: versionParts[1] || 0,
          version_patch: versionParts[2] || 0,
          new_features: changelog.filter(c => c.startsWith('+')),
          bug_fixes: changelog.filter(c => c.startsWith('-') || c.startsWith('fix')),
          release_notes: releaseNotes,
          is_latest: true,
          is_stable: tag === 'stable',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Versión ${version} creada`);
      await fetchVersions();
      return data;
    } catch (error) {
      console.error('[useModuleVersioning] createVersion error:', error);
      toast.error('Error al crear versión');
      return null;
    }
  }, [moduleKey, fetchVersions]);

  // Compare two versions
  const compareVersions = useCallback(async (fromVersion: string, toVersion: string) => {
    if (!moduleKey) return null;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { data, error } = await supabase.functions.invoke('module-version-control', {
        body: {
          action: 'compare_versions',
          moduleKey,
          fromVersion,
          toVersion
        }
      });

      if (error) throw error;

      const diff: VersionDiff = {
        fromVersion,
        toVersion,
        addedFeatures: data?.added || [],
        removedFeatures: data?.removed || [],
        modifiedFeatures: data?.modified || [],
        breakingChanges: data?.breaking || [],
        migrationSteps: data?.migration || []
      };

      setState(prev => ({ ...prev, diff, isLoading: false }));
      return diff;
    } catch (error) {
      console.error('[useModuleVersioning] compareVersions error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return null;
    }
  }, [moduleKey]);

  // Suggest next version based on changes
  const suggestNextVersion = useCallback((
    currentVersion: string,
    changeType: 'patch' | 'minor' | 'major'
  ): string => {
    const parts = currentVersion.replace(/^v/, '').split('.').map(Number);
    const [major = 1, minor = 0, patch = 0] = parts;

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

  // Select a version for viewing
  const selectVersion = useCallback((version: ModuleVersionInfo | null) => {
    setState(prev => ({ ...prev, selectedVersion: version }));
  }, []);

  return {
    ...state,
    fetchVersions,
    generateChangelog,
    createVersion,
    compareVersions,
    suggestNextVersion,
    selectVersion
  };
}

export default useModuleVersioning;
