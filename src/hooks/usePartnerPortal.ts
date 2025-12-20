import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { 
  PartnerCompany, 
  PartnerApplication, 
  PartnerRevenueTransaction,
  DeveloperApiKey,
  PartnerWebhook 
} from '@/types/marketplace';

export function useMyPartnerCompany() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-partner-company', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: partnerUser } = await supabase
        .from('partner_users')
        .select('partner_company_id, role')
        .eq('user_id', user.id)
        .single();

      if (!partnerUser) return null;

      const { data, error } = await supabase
        .from('partner_companies')
        .select('*')
        .eq('id', partnerUser.partner_company_id)
        .single();

      if (error) throw error;
      return { company: data as unknown as PartnerCompany, role: partnerUser.role };
    },
    enabled: !!user,
  });
}

export function usePartnerApplications(partnerCompanyId?: string) {
  return useQuery({
    queryKey: ['partner-applications', partnerCompanyId],
    queryFn: async () => {
      if (!partnerCompanyId) return [];

      const { data, error } = await supabase
        .from('partner_applications')
        .select('*')
        .eq('partner_company_id', partnerCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as PartnerApplication[];
    },
    enabled: !!partnerCompanyId,
  });
}

export function useCreatePartnerApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (app: Partial<PartnerApplication>) => {
      const { data, error } = await supabase
        .from('partner_applications')
        .insert(app as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-applications'] });
      toast.success('Aplicación creada correctamente');
    },
    onError: (error) => {
      toast.error('Error al crear la aplicación: ' + error.message);
    },
  });
}

export function useUpdatePartnerApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<PartnerApplication>) => {
      const { data, error } = await supabase
        .from('partner_applications')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-applications'] });
      toast.success('Aplicación actualizada');
    },
    onError: (error) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });
}

export function useSubmitAppForReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appId: string) => {
      const { error } = await supabase
        .from('partner_applications')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', appId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-applications'] });
      toast.success('Aplicación enviada para revisión');
    },
    onError: (error) => {
      toast.error('Error al enviar: ' + error.message);
    },
  });
}

export function usePartnerRevenue(partnerCompanyId?: string) {
  return useQuery({
    queryKey: ['partner-revenue', partnerCompanyId],
    queryFn: async () => {
      if (!partnerCompanyId) return [];

      const { data, error } = await supabase
        .from('partner_revenue_transactions')
        .select('*, application:partner_applications(app_name)')
        .eq('partner_company_id', partnerCompanyId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as unknown as (PartnerRevenueTransaction & { application: { app_name: string } })[];
    },
    enabled: !!partnerCompanyId,
  });
}

export function usePartnerApiKeys(partnerCompanyId?: string) {
  return useQuery({
    queryKey: ['partner-api-keys', partnerCompanyId],
    queryFn: async () => {
      if (!partnerCompanyId) return [];

      const { data, error } = await supabase
        .from('developer_api_keys')
        .select('*')
        .eq('partner_company_id', partnerCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as DeveloperApiKey[];
    },
    enabled: !!partnerCompanyId,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      partnerCompanyId, 
      keyName, 
      environment, 
      scopes 
    }: { 
      partnerCompanyId: string; 
      keyName: string; 
      environment: 'sandbox' | 'production';
      scopes: string[];
    }) => {
      if (!user) throw new Error('Usuario no autenticado');

      // Generate a random API key
      const apiKey = `obx_${environment === 'production' ? 'live' : 'test'}_${crypto.randomUUID().replace(/-/g, '')}`;
      const keyPrefix = apiKey.substring(0, 12);
      
      // In production, we'd hash this properly
      const apiKeyHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(apiKey))
        .then(hash => Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join(''));

      const { data, error } = await supabase
        .from('developer_api_keys')
        .insert({
          partner_company_id: partnerCompanyId,
          user_id: user.id,
          key_name: keyName,
          api_key_hash: apiKeyHash,
          key_prefix: keyPrefix,
          environment,
          scopes,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Return the full API key (only shown once)
      return { ...data, api_key: apiKey };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-api-keys'] });
      toast.success('API Key creada. ¡Guárdala, no se mostrará de nuevo!');
    },
    onError: (error) => {
      toast.error('Error al crear API Key: ' + error.message);
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ keyId, reason }: { keyId: string; reason?: string }) => {
      const { error } = await supabase
        .from('developer_api_keys')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_reason: reason,
        })
        .eq('id', keyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-api-keys'] });
      toast.success('API Key revocada');
    },
    onError: (error) => {
      toast.error('Error al revocar: ' + error.message);
    },
  });
}

export function usePartnerWebhooks(partnerCompanyId?: string) {
  return useQuery({
    queryKey: ['partner-webhooks', partnerCompanyId],
    queryFn: async () => {
      if (!partnerCompanyId) return [];

      const { data, error } = await supabase
        .from('partner_webhooks')
        .select('*')
        .eq('partner_company_id', partnerCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as PartnerWebhook[];
    },
    enabled: !!partnerCompanyId,
  });
}

export function useApplyForPartnership() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (application: {
      company_name: string;
      legal_name?: string;
      tax_id?: string;
      contact_email: string;
      contact_phone?: string;
      website?: string;
      description?: string;
    }) => {
      if (!user) throw new Error('Usuario no autenticado');

      // Create partner company
      const { data: company, error: companyError } = await supabase
        .from('partner_companies')
        .insert({
          ...application,
          status: 'pending',
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Add user as owner
      const { error: userError } = await supabase
        .from('partner_users')
        .insert({
          partner_company_id: company.id,
          user_id: user.id,
          role: 'owner',
          is_primary_contact: true,
        });

      if (userError) throw userError;

      return company;
    },
    onSuccess: () => {
      toast.success('Solicitud enviada. Revisaremos tu aplicación pronto.');
    },
    onError: (error) => {
      toast.error('Error al enviar solicitud: ' + error.message);
    },
  });
}
