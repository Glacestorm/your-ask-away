import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UnifiedMarketplaceStats {
  totalSolutions: number;
  totalApps: number;
  totalModules: number;
  totalIntegrations: number;
  totalPartners: number;
}

export interface ModuleItem {
  id: string;
  module_key: string;
  module_name: string;
  description: string | null;
  category: string;
  base_price: number | null;
  module_icon: string | null;
  is_core: boolean | null;
  sector: string | null;
  features: unknown;
}

export function useUnifiedMarketplaceStats() {
  return useQuery({
    queryKey: ['unified-marketplace-stats'],
    queryFn: async () => {
      const [appsResult, modulesResult, integrationsResult, partnersResult] = await Promise.all([
        supabase.from('partner_applications').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('app_modules').select('id', { count: 'exact', head: true }),
        supabase.from('premium_integrations').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('partner_companies').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ]);

      const totalApps = appsResult.count || 0;
      const totalModules = modulesResult.count || 0;

      return {
        totalSolutions: totalApps + totalModules,
        totalApps,
        totalModules,
        totalIntegrations: integrationsResult.count || 0,
        totalPartners: partnersResult.count || 0,
      } as UnifiedMarketplaceStats;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useSystemModules(category?: string, limit?: number) {
  return useQuery({
    queryKey: ['system-modules', category, limit],
    queryFn: async () => {
      let query = supabase
        .from('app_modules')
        .select('*')
        .order('module_name', { ascending: true });

      if (category) {
        query = query.eq('category', category as 'core' | 'vertical' | 'addon' | 'horizontal');
      }
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ModuleItem[];
    },
  });
}

export function useModuleCategoryCounts() {
  return useQuery({
    queryKey: ['module-category-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_modules')
        .select('id, category');

      if (error) {
        console.error('Error fetching module category counts:', error);
        return {};
      }

      const counts: Record<string, number> = {};
      if (data && Array.isArray(data)) {
        data.forEach((module) => {
          if (module.category) {
            counts[module.category] = (counts[module.category] || 0) + 1;
          }
        });
      }

      return counts;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
