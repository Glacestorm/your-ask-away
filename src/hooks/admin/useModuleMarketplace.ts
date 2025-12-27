/**
 * useModuleMarketplace - Hook para gestión del marketplace de módulos
 * Fase 5A: Catálogo, instalación, publicación, ratings y reviews
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// === INTERFACES ===
export interface MarketplaceModule {
  id: string;
  module_key: string;
  module_name: string;
  description: string | null;
  category: string;
  version: string;
  author: string;
  author_id?: string;
  downloads: number;
  rating: number;
  reviews_count: number;
  price: number;
  is_free: boolean;
  is_featured: boolean;
  is_verified: boolean;
  tags: string[];
  screenshots: string[];
  changelog: string[];
  created_at: string;
  updated_at: string;
  installed?: boolean;
}

export interface ModuleReview {
  id: string;
  module_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  title: string;
  content: string;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceFilters {
  category?: string;
  search?: string;
  priceRange?: 'free' | 'paid' | 'all';
  minRating?: number;
  sortBy?: 'popular' | 'newest' | 'rating' | 'downloads';
  tags?: string[];
}

export interface PublishModuleData {
  module_key: string;
  module_name: string;
  description: string;
  category: string;
  version: string;
  price: number;
  tags: string[];
  screenshots: string[];
  changelog: string;
}

// === HOOK ===
export function useModuleMarketplace() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [modules, setModules] = useState<MarketplaceModule[]>([]);
  const [featuredModules, setFeaturedModules] = useState<MarketplaceModule[]>([]);
  const [installedModules, setInstalledModules] = useState<string[]>([]);
  const [reviews, setReviews] = useState<ModuleReview[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [filters, setFilters] = useState<MarketplaceFilters>({
    sortBy: 'popular',
    priceRange: 'all'
  });

  // === FETCH MARKETPLACE MODULES ===
  const fetchModules = useCallback(async (customFilters?: MarketplaceFilters) => {
    setIsLoading(true);
    try {
      const activeFilters = customFilters || filters;

      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-marketplace',
        {
          body: {
            action: 'list_modules',
            filters: activeFilters
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setModules(fnData.modules || []);
        setFeaturedModules(fnData.featured || []);
        setCategories(fnData.categories || []);
        setPopularTags(fnData.tags || []);
      }
    } catch (error) {
      console.error('[useModuleMarketplace] fetchModules error:', error);
      toast.error('Error al cargar el marketplace');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // === FETCH INSTALLED MODULES ===
  const fetchInstalledModules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('installed_modules')
        .select('module_id, app_modules(module_key)')
        .eq('is_active', true);

      if (error) throw error;

      const keys = data?.map((im: any) => im.app_modules?.module_key).filter(Boolean) || [];
      setInstalledModules(keys);
    } catch (error) {
      console.error('[useModuleMarketplace] fetchInstalledModules error:', error);
    }
  }, []);

  // === INSTALL MODULE ===
  const installModule = useCallback(async (moduleId: string) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return false;
    }

    setIsLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-marketplace',
        {
          body: {
            action: 'install_module',
            moduleId,
            userId: user.id
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Módulo instalado correctamente');
        await fetchInstalledModules();
        return true;
      }

      throw new Error(fnData?.error || 'Error al instalar');
    } catch (error) {
      console.error('[useModuleMarketplace] installModule error:', error);
      toast.error('Error al instalar el módulo');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, fetchInstalledModules]);

  // === UNINSTALL MODULE ===
  const uninstallModule = useCallback(async (moduleId: string) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return false;
    }

    setIsLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-marketplace',
        {
          body: {
            action: 'uninstall_module',
            moduleId,
            userId: user.id
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Módulo desinstalado');
        await fetchInstalledModules();
        return true;
      }

      throw new Error(fnData?.error || 'Error al desinstalar');
    } catch (error) {
      console.error('[useModuleMarketplace] uninstallModule error:', error);
      toast.error('Error al desinstalar el módulo');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, fetchInstalledModules]);

  // === PUBLISH MODULE ===
  const publishModule = useCallback(async (data: PublishModuleData) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    setIsLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-marketplace',
        {
          body: {
            action: 'publish_module',
            moduleData: data,
            authorId: user.id
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Módulo publicado en el marketplace');
        await fetchModules();
        return fnData.module;
      }

      throw new Error(fnData?.error || 'Error al publicar');
    } catch (error) {
      console.error('[useModuleMarketplace] publishModule error:', error);
      toast.error('Error al publicar el módulo');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, fetchModules]);

  // === FETCH REVIEWS ===
  const fetchReviews = useCallback(async (moduleId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-marketplace',
        {
          body: {
            action: 'get_reviews',
            moduleId
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setReviews(fnData.reviews || []);
      }
    } catch (error) {
      console.error('[useModuleMarketplace] fetchReviews error:', error);
    }
  }, []);

  // === SUBMIT REVIEW ===
  const submitReview = useCallback(async (
    moduleId: string,
    rating: number,
    title: string,
    content: string
  ) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return false;
    }

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-marketplace',
        {
          body: {
            action: 'submit_review',
            moduleId,
            userId: user.id,
            rating,
            title,
            content
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Reseña publicada');
        await fetchReviews(moduleId);
        return true;
      }

      throw new Error(fnData?.error || 'Error al enviar');
    } catch (error) {
      console.error('[useModuleMarketplace] submitReview error:', error);
      toast.error('Error al enviar la reseña');
      return false;
    }
  }, [user?.id, fetchReviews]);

  // === GET MODULE DETAILS ===
  const getModuleDetails = useCallback(async (moduleKey: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-marketplace',
        {
          body: {
            action: 'get_module_details',
            moduleKey
          }
        }
      );

      if (fnError) throw fnError;

      return fnData?.module || null;
    } catch (error) {
      console.error('[useModuleMarketplace] getModuleDetails error:', error);
      return null;
    }
  }, []);

  // === INITIAL FETCH ===
  useEffect(() => {
    fetchModules();
    fetchInstalledModules();
  }, []);

  // === RETURN ===
  return {
    // Estado
    isLoading,
    modules,
    featuredModules,
    installedModules,
    reviews,
    categories,
    popularTags,
    filters,
    // Acciones
    setFilters,
    fetchModules,
    fetchInstalledModules,
    installModule,
    uninstallModule,
    publishModule,
    fetchReviews,
    submitReview,
    getModuleDetails,
    // Helpers
    isInstalled: (moduleKey: string) => installedModules.includes(moduleKey),
  };
}

export default useModuleMarketplace;
