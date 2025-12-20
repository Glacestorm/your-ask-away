import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { 
  PartnerApplication, 
  MarketplaceReview, 
  MarketplaceInstallation,
  PremiumIntegration 
} from '@/types/marketplace';

export function useMarketplaceApps(category?: string, featured?: boolean) {
  return useQuery({
    queryKey: ['marketplace-apps', category, featured],
    queryFn: async () => {
      let query = supabase
        .from('partner_applications')
        .select('*, partner_company:partner_companies(*)')
        .eq('status', 'published')
        .order('install_count', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }
      if (featured) {
        query = query.eq('is_featured', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as PartnerApplication[];
    },
  });
}

export function useMarketplaceApp(appKey: string) {
  return useQuery({
    queryKey: ['marketplace-app', appKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_applications')
        .select('*, partner_company:partner_companies(*)')
        .eq('app_key', appKey)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      return data as unknown as PartnerApplication;
    },
    enabled: !!appKey,
  });
}

export function useAppReviews(applicationId: string) {
  return useQuery({
    queryKey: ['app-reviews', applicationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_reviews')
        .select('*')
        .eq('application_id', applicationId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as MarketplaceReview[];
    },
    enabled: !!applicationId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (review: {
      application_id: string;
      rating: number;
      title?: string;
      review_text?: string;
      pros?: string;
      cons?: string;
    }) => {
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('marketplace_reviews')
        .insert({
          ...review,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['app-reviews', variables.application_id] });
      toast.success('Reseña publicada correctamente');
    },
    onError: (error) => {
      toast.error('Error al publicar la reseña: ' + error.message);
    },
  });
}

export function useMyInstallations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-installations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('marketplace_installations')
        .select('*, application:partner_applications(*)')
        .eq('installed_by', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as MarketplaceInstallation[];
    },
    enabled: !!user,
  });
}

export function useInstallApp() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (applicationId: string) => {
      if (!user) throw new Error('Usuario no autenticado');

      // Check if already installed
      const { data: existing } = await supabase
        .from('marketplace_installations')
        .select('id')
        .eq('application_id', applicationId)
        .eq('installed_by', user.id)
        .eq('is_active', true)
        .single();

      if (existing) {
        throw new Error('Esta aplicación ya está instalada');
      }

      const { data, error } = await supabase
        .from('marketplace_installations')
        .insert({
          application_id: applicationId,
          organization_id: user.id, // In a real app, this would be the org ID
          installed_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Increment install count directly
      await supabase
        .from('partner_applications')
        .update({ install_count: (await supabase.from('partner_applications').select('install_count').eq('id', applicationId).single()).data?.install_count + 1 || 1 })
        .eq('id', applicationId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-installations'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-apps'] });
      toast.success('Aplicación instalada correctamente');
    },
    onError: (error) => {
      toast.error('Error al instalar: ' + error.message);
    },
  });
}

export function useUninstallApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ installationId, reason }: { installationId: string; reason?: string }) => {
      const { error } = await supabase
        .from('marketplace_installations')
        .update({
          is_active: false,
          uninstalled_at: new Date().toISOString(),
          uninstall_reason: reason,
        })
        .eq('id', installationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-installations'] });
      toast.success('Aplicación desinstalada');
    },
    onError: (error) => {
      toast.error('Error al desinstalar: ' + error.message);
    },
  });
}

export function usePremiumIntegrations(category?: string) {
  return useQuery({
    queryKey: ['premium-integrations', category],
    queryFn: async () => {
      let query = supabase
        .from('premium_integrations')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('install_count', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as PremiumIntegration[];
    },
  });
}

export function useMarketplaceStats() {
  return useQuery({
    queryKey: ['marketplace-stats'],
    queryFn: async () => {
      const [appsResult, integrationsResult, partnersResult] = await Promise.all([
        supabase.from('partner_applications').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('premium_integrations').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('partner_companies').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ]);

      return {
        totalApps: appsResult.count || 0,
        totalIntegrations: integrationsResult.count || 0,
        totalPartners: partnersResult.count || 0,
      };
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useCategoryCounts() {
  return useQuery({
    queryKey: ['category-counts'],
    queryFn: async () => {
      // Use the same query as useMarketplaceApps to ensure consistency
      const { data, error } = await supabase
        .from('partner_applications')
        .select('id, category, status')
        .eq('status', 'published');

      if (error) {
        console.error('Error fetching category counts:', error);
        return {};
      }

      const counts: Record<string, number> = {};
      if (data && Array.isArray(data)) {
        data.forEach((app: { id: string; category: string; status: string }) => {
          if (app.category) {
            counts[app.category] = (counts[app.category] || 0) + 1;
          }
        });
      }

      return counts;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
