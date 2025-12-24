import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === ERROR TIPADO KB ===
export interface WinbackCampaignsError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface WinbackCampaign {
  id: string;
  name: string;
  description: string | null;
  target_segment: Record<string, any>;
  offer_type: 'discount' | 'free_trial' | 'feature_unlock' | 'custom' | null;
  offer_details: Record<string, any>;
  start_date: string | null;
  end_date: string | null;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  is_ab_test: boolean;
  ab_variants: any[];
  created_by: string | null;
  budget: number | null;
  created_at: string;
  updated_at: string;
  participants_count?: number;
  conversions_count?: number;
  conversion_rate?: number;
  total_recovered_mrr?: number;
}

export interface CampaignParticipant {
  id: string;
  campaign_id: string;
  company_id: string;
  contact_name: string | null;
  contact_email: string | null;
  ab_variant: string | null;
  status: 'enrolled' | 'contacted' | 'engaged' | 'converted' | 'declined' | 'unresponsive';
  enrolled_at: string;
  first_contact_at: string | null;
  last_contact_at: string | null;
  converted_at: string | null;
  conversion_value: number | null;
  touchpoints: number;
  response_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  company?: { id: string; name: string };
}

export interface WinbackConversion {
  id: string;
  campaign_id: string;
  participant_id: string;
  company_id: string;
  previous_mrr: number | null;
  recovered_mrr: number | null;
  offer_applied: Record<string, any> | null;
  conversion_date: string;
  retention_months: number;
  lifetime_value_recovered: number | null;
  notes: string | null;
  created_at: string;
}

export interface CampaignStats {
  totalParticipants: number;
  contacted: number;
  engaged: number;
  converted: number;
  declined: number;
  unresponsive: number;
  conversionRate: number;
  totalRecoveredMrr: number;
  avgTouchpoints: number;
}

export function useWinbackCampaigns() {
  const queryClient = useQueryClient();
  // === ESTADO KB ===
  const [error, setError] = useState<WinbackCampaignsError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  // Fetch campaigns with stats
  const { data: campaigns = [], isLoading, refetch } = useQuery({
    queryKey: ['winback-campaigns'],
    queryFn: async () => {
      const { data: campaignsData, error: fetchError } = await supabase
        .from('winback_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError({
          code: 'FETCH_CAMPAIGNS_ERROR',
          message: fetchError.message,
          details: { originalError: String(fetchError) }
        });
        throw fetchError;
      }
      setLastRefresh(new Date());

      // Get stats for each campaign
      const campaignsWithStats = await Promise.all(
        campaignsData.map(async (campaign) => {
          const { data: participants } = await supabase
            .from('winback_campaign_participants')
            .select('status, conversion_value')
            .eq('campaign_id', campaign.id);

          const { data: conversions } = await supabase
            .from('winback_conversions')
            .select('recovered_mrr')
            .eq('campaign_id', campaign.id);

          const participantsCount = participants?.length || 0;
          const conversionsCount = conversions?.length || 0;
          const conversionRate = participantsCount > 0 
            ? (conversionsCount / participantsCount) * 100 
            : 0;
          const totalRecoveredMrr = conversions?.reduce((sum, c) => sum + (c.recovered_mrr || 0), 0) || 0;

          return {
            ...campaign,
            participants_count: participantsCount,
            conversions_count: conversionsCount,
            conversion_rate: conversionRate,
            total_recovered_mrr: totalRecoveredMrr
          };
        })
      );

      return campaignsWithStats as WinbackCampaign[];
    }
  });

  // Create campaign
  const createCampaignMutation = useMutation({
    mutationFn: async (campaign: Partial<WinbackCampaign>) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('winback_campaigns')
        .insert({
          name: campaign.name || 'Nueva Campaña',
          description: campaign.description,
          offer_type: campaign.offer_type,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          is_ab_test: campaign.is_ab_test,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['winback-campaigns'] });
      toast.success('Campaña creada correctamente');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  // Update campaign
  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WinbackCampaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('winback_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['winback-campaigns'] });
      toast.success('Campaña actualizada');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  // Add participants to campaign
  const addParticipantsMutation = useMutation({
    mutationFn: async ({ 
      campaignId, 
      companies 
    }: { 
      campaignId: string; 
      companies: Array<{ companyId: string; contactName?: string; contactEmail?: string; abVariant?: string }>;
    }) => {
      const participants = companies.map(c => ({
        campaign_id: campaignId,
        company_id: c.companyId,
        contact_name: c.contactName,
        contact_email: c.contactEmail,
        ab_variant: c.abVariant
      }));

      const { data, error } = await supabase
        .from('winback_campaign_participants')
        .insert(participants)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { companies }) => {
      queryClient.invalidateQueries({ queryKey: ['winback-campaigns'] });
      toast.success(`${companies.length} participantes añadidos`);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  // Update participant status
  const updateParticipantMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      responseData 
    }: { 
      id: string; 
      status: CampaignParticipant['status']; 
      responseData?: Record<string, any>;
    }) => {
      const updates: Record<string, any> = { 
        status,
        last_contact_at: new Date().toISOString()
      };

      if (status === 'contacted') {
        updates.first_contact_at = new Date().toISOString();
      }

      if (status === 'converted') {
        updates.converted_at = new Date().toISOString();
      }

      if (responseData) {
        updates.response_data = responseData;
      }

      const { data, error } = await supabase
        .from('winback_campaign_participants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['winback-campaigns'] });
      toast.success('Participante actualizado');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  // Record conversion
  const recordConversionMutation = useMutation({
    mutationFn: async ({
      participantId,
      campaignId,
      companyId,
      previousMrr,
      recoveredMrr,
      offerApplied,
      notes
    }: {
      participantId: string;
      campaignId: string;
      companyId: string;
      previousMrr?: number;
      recoveredMrr: number;
      offerApplied?: Record<string, any>;
      notes?: string;
    }) => {
      // Create conversion record
      const { data: conversion, error: convError } = await supabase
        .from('winback_conversions')
        .insert({
          campaign_id: campaignId,
          participant_id: participantId,
          company_id: companyId,
          previous_mrr: previousMrr,
          recovered_mrr: recoveredMrr,
          offer_applied: offerApplied,
          notes,
          lifetime_value_recovered: recoveredMrr * 12 // Estimate 12 months LTV
        })
        .select()
        .single();

      if (convError) throw convError;

      // Update participant status
      await supabase
        .from('winback_campaign_participants')
        .update({
          status: 'converted',
          converted_at: new Date().toISOString(),
          conversion_value: recoveredMrr
        })
        .eq('id', participantId);

      return conversion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['winback-campaigns'] });
      toast.success('Conversión registrada');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  // Fetch campaign participants
  const fetchParticipants = async (campaignId: string): Promise<CampaignParticipant[]> => {
    const { data, error } = await supabase
      .from('winback_campaign_participants')
      .select(`
        *,
        companies:company_id (id, name)
      `)
      .eq('campaign_id', campaignId)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;
    return data.map(p => ({
      ...p,
      company: p.companies
    })) as CampaignParticipant[];
  };

  // Get campaign stats
  const getCampaignStats = async (campaignId: string): Promise<CampaignStats> => {
    const participants = await fetchParticipants(campaignId);
    const { data: conversions } = await supabase
      .from('winback_conversions')
      .select('recovered_mrr')
      .eq('campaign_id', campaignId);

    const stats: CampaignStats = {
      totalParticipants: participants.length,
      contacted: participants.filter(p => p.status !== 'enrolled').length,
      engaged: participants.filter(p => p.status === 'engaged').length,
      converted: participants.filter(p => p.status === 'converted').length,
      declined: participants.filter(p => p.status === 'declined').length,
      unresponsive: participants.filter(p => p.status === 'unresponsive').length,
      conversionRate: participants.length > 0 
        ? (participants.filter(p => p.status === 'converted').length / participants.length) * 100 
        : 0,
      totalRecoveredMrr: conversions?.reduce((sum, c) => sum + (c.recovered_mrr || 0), 0) || 0,
      avgTouchpoints: participants.length > 0
        ? participants.reduce((sum, p) => sum + p.touchpoints, 0) / participants.length
        : 0
    };

    return stats;
  };

  // Get A/B test results
  const getABTestResults = async (campaignId: string) => {
    const participants = await fetchParticipants(campaignId);
    
    const variants = [...new Set(participants.map(p => p.ab_variant).filter(Boolean))];
    
    return variants.map(variant => {
      const variantParticipants = participants.filter(p => p.ab_variant === variant);
      const converted = variantParticipants.filter(p => p.status === 'converted');
      
      return {
        variant,
        participants: variantParticipants.length,
        conversions: converted.length,
        conversionRate: variantParticipants.length > 0 
          ? (converted.length / variantParticipants.length) * 100 
          : 0,
        totalValue: converted.reduce((sum, p) => sum + (p.conversion_value || 0), 0)
      };
    });
  };

  // Find churned companies for targeting
  const findChurnedCompanies = async (): Promise<any[]> => {
    const query = supabase
      .from('companies' as any)
      .select('id, name, segment, facturacion_anual')
      .eq('segment', 'Lost')
      .limit(100);

    const { data, error } = await query;
    if (error) throw error;
    return (data as any[]) || [];
  };

  return {
    campaigns,
    isLoading,
    refetch,
    createCampaign: createCampaignMutation.mutateAsync,
    updateCampaign: updateCampaignMutation.mutateAsync,
    addParticipants: addParticipantsMutation.mutateAsync,
    updateParticipant: updateParticipantMutation.mutateAsync,
    recordConversion: recordConversionMutation.mutateAsync,
    fetchParticipants,
    getCampaignStats,
    getABTestResults,
    findChurnedCompanies,
    isCreating: createCampaignMutation.isPending,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError,
  };
}

export default useWinbackCampaigns;
