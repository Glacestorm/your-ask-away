/**
 * useModulePublisher - Sistema de publicación de versiones de módulos
 * Permite incrementar versión, actualizar metadatos y publicar en tienda
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export interface ModuleMetadata {
  id: string;
  moduleKey: string;
  moduleName: string;
  description: string;
  version: string;
  features: string[];
  category: string;
  basePrice: number | null;
  isCore: boolean;
  isRequired: boolean;
  moduleIcon: string | null;
  sector: string | null;
  updatedAt: string;
}

export interface PublishOptions {
  version: string;
  versionType: 'patch' | 'minor' | 'major';
  description?: string;
  features?: string[];
  releaseNotes?: string;
  changelog?: string[];
  isStable?: boolean;
}

export interface PublishResult {
  success: boolean;
  moduleKey: string;
  oldVersion: string;
  newVersion: string;
  publishedAt: string;
  versionId?: string;
}

export function useModulePublisher() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [modules, setModules] = useState<ModuleMetadata[]>([]);
  const [selectedModule, setSelectedModule] = useState<ModuleMetadata | null>(null);
  const { user } = useAuth();

  // Fetch all modules from app_modules
  const fetchModules = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_modules')
        .select('*')
        .order('module_name', { ascending: true });

      if (error) throw error;

      const mapped: ModuleMetadata[] = (data || []).map(m => ({
        id: m.id,
        moduleKey: m.module_key,
        moduleName: m.module_name,
        description: m.description || '',
        version: m.version || '1.0.0',
        features: (m.features as string[]) || [],
        category: m.category || 'core',
        basePrice: m.base_price,
        isCore: m.is_core || false,
        isRequired: m.is_required || false,
        moduleIcon: m.module_icon,
        sector: m.sector,
        updatedAt: m.updated_at || m.created_at || new Date().toISOString()
      }));

      setModules(mapped);
      return mapped;
    } catch (error) {
      console.error('[useModulePublisher] fetchModules error:', error);
      toast.error('Error al cargar módulos');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get single module by key
  const getModule = useCallback(async (moduleKey: string) => {
    try {
      const { data, error } = await supabase
        .from('app_modules')
        .select('*')
        .eq('module_key', moduleKey)
        .single();

      if (error) throw error;

      const mapped: ModuleMetadata = {
        id: data.id,
        moduleKey: data.module_key,
        moduleName: data.module_name,
        description: data.description || '',
        version: data.version || '1.0.0',
        features: (data.features as string[]) || [],
        category: data.category || 'core',
        basePrice: data.base_price,
        isCore: data.is_core || false,
        isRequired: data.is_required || false,
        moduleIcon: data.module_icon,
        sector: data.sector,
        updatedAt: data.updated_at || data.created_at || new Date().toISOString()
      };

      setSelectedModule(mapped);
      return mapped;
    } catch (error) {
      console.error('[useModulePublisher] getModule error:', error);
      return null;
    }
  }, []);

  // Calculate next version based on type
  const calculateNextVersion = useCallback((currentVersion: string, type: 'patch' | 'minor' | 'major'): string => {
    const parts = currentVersion.replace(/^v/, '').split('.').map(Number);
    const [major = 1, minor = 0, patch = 0] = parts;

    switch (type) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
      default:
        return `${major}.${minor}.${patch + 1}`;
    }
  }, []);

  // Publish new version
  const publishVersion = useCallback(async (
    moduleKey: string,
    options: PublishOptions
  ): Promise<PublishResult | null> => {
    setIsPublishing(true);

    try {
      // Get current module
      const { data: currentModule, error: fetchError } = await supabase
        .from('app_modules')
        .select('*')
        .eq('module_key', moduleKey)
        .single();

      if (fetchError || !currentModule) {
        throw new Error('Módulo no encontrado');
      }

      const oldVersion = currentModule.version || '1.0.0';
      const newVersion = options.version || calculateNextVersion(oldVersion, options.versionType);

      // Update app_modules with new version and metadata
      const updateData: Record<string, unknown> = {
        version: newVersion,
        updated_at: new Date().toISOString()
      };

      if (options.description) {
        updateData.description = options.description;
      }

      if (options.features && options.features.length > 0) {
        updateData.features = options.features;
      }

      // Update changelog if provided
      if (options.changelog && options.changelog.length > 0) {
        const existingChangelog = (currentModule.changelog as Record<string, unknown>[]) || [];
        updateData.changelog = [
          {
            version: newVersion,
            date: new Date().toISOString(),
            changes: options.changelog
          },
          ...existingChangelog.slice(0, 9) // Keep last 10 versions
        ];
      }

      const { error: updateError } = await supabase
        .from('app_modules')
        .update(updateData)
        .eq('module_key', moduleKey);

      if (updateError) throw updateError;

      // Create version record in module_versions
      const versionParts = newVersion.split('.').map(Number);
      
      // Mark previous versions as not latest
      await supabase
        .from('module_versions')
        .update({ is_latest: false })
        .eq('module_key', moduleKey);

      // Insert new version
      const { data: versionData, error: versionError } = await supabase
        .from('module_versions')
        .insert({
          module_key: moduleKey,
          version: newVersion,
          version_major: versionParts[0] || 1,
          version_minor: versionParts[1] || 0,
          version_patch: versionParts[2] || 0,
          new_features: options.changelog?.filter(c => c.startsWith('+') || c.toLowerCase().includes('añadido') || c.toLowerCase().includes('nuevo')) || [],
          bug_fixes: options.changelog?.filter(c => c.startsWith('-') || c.toLowerCase().includes('fix') || c.toLowerCase().includes('corregido')) || [],
          release_notes: options.releaseNotes || `Versión ${newVersion} publicada`,
          is_latest: true,
          is_stable: options.isStable !== false,
          published_by: user?.id || 'system',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (versionError) {
        console.warn('[useModulePublisher] Version record warning:', versionError);
      }

      // Refresh module data
      await getModule(moduleKey);
      await fetchModules();

      const result: PublishResult = {
        success: true,
        moduleKey,
        oldVersion,
        newVersion,
        publishedAt: new Date().toISOString(),
        versionId: versionData?.id
      };

      toast.success(`Módulo ${moduleKey} actualizado a v${newVersion}`);
      return result;

    } catch (error) {
      console.error('[useModulePublisher] publishVersion error:', error);
      toast.error('Error al publicar versión');
      return null;
    } finally {
      setIsPublishing(false);
    }
  }, [user?.id, calculateNextVersion, getModule, fetchModules]);

  // Quick update (only metadata, no version bump)
  const updateMetadata = useCallback(async (
    moduleKey: string,
    updates: Partial<Pick<ModuleMetadata, 'description' | 'features' | 'moduleIcon' | 'basePrice'>>
  ) => {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.features !== undefined) updateData.features = updates.features;
      if (updates.moduleIcon !== undefined) updateData.module_icon = updates.moduleIcon;
      if (updates.basePrice !== undefined) updateData.base_price = updates.basePrice;

      const { error } = await supabase
        .from('app_modules')
        .update(updateData)
        .eq('module_key', moduleKey);

      if (error) throw error;

      await getModule(moduleKey);
      toast.success('Metadatos actualizados');
      return true;
    } catch (error) {
      console.error('[useModulePublisher] updateMetadata error:', error);
      toast.error('Error al actualizar metadatos');
      return false;
    }
  }, [getModule]);

  // Get version history
  const getVersionHistory = useCallback(async (moduleKey: string) => {
    try {
      const { data, error } = await supabase
        .from('module_versions')
        .select('*')
        .eq('module_key', moduleKey)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[useModulePublisher] getVersionHistory error:', error);
      return [];
    }
  }, []);

  return {
    // State
    isLoading,
    isPublishing,
    modules,
    selectedModule,
    // Actions
    fetchModules,
    getModule,
    publishVersion,
    updateMetadata,
    getVersionHistory,
    calculateNextVersion,
    setSelectedModule
  };
}

export default useModulePublisher;
