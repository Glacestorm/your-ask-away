import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RevenueAttribution {
  id: string;
  company_id: string;
  revenue_event_id: string | null;
  attribution_date: string;
  attribution_model: string;
  channel: string;
  source: string;
  campaign: string | null;
  medium: string | null;
  content: string | null;
  attributed_revenue: number;
  attribution_weight: number | null;
  touchpoint_order: number | null;
  total_touchpoints: number | null;
  days_to_conversion: number | null;
  revenue_type: string | null;
  customer_journey: Record<string, unknown> | null;
  created_at: string;
  company?: { name: string };
}

export const useRevenueAttribution = () => {
  const { data: attributions, isLoading, refetch } = useQuery({
    queryKey: ['revenue-attributions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenue_attributions')
        .select(`
          *,
          company:companies(name)
        `)
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (error) throw error;
      return data as RevenueAttribution[];
    }
  });

  const getAttributionByChannel = () => {
    if (!attributions) return [];
    const channels: Record<string, { revenue: number; count: number }> = {};
    
    attributions.forEach(a => {
      if (!channels[a.channel]) {
        channels[a.channel] = { revenue: 0, count: 0 };
      }
      channels[a.channel].revenue += a.attributed_revenue;
      channels[a.channel].count++;
    });

    return Object.entries(channels)
      .map(([channel, data]) => ({ channel, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  };

  const getAttributionBySource = () => {
    if (!attributions) return [];
    const sources: Record<string, { revenue: number; count: number }> = {};
    
    attributions.forEach(a => {
      if (!sources[a.source]) {
        sources[a.source] = { revenue: 0, count: 0 };
      }
      sources[a.source].revenue += a.attributed_revenue;
      sources[a.source].count++;
    });

    return Object.entries(sources)
      .map(([source, data]) => ({ source, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  };

  const getAttributionByCampaign = () => {
    if (!attributions) return [];
    const campaigns: Record<string, { revenue: number; count: number }> = {};
    
    attributions.forEach(a => {
      const campaign = a.campaign || 'Sin campaña';
      if (!campaigns[campaign]) {
        campaigns[campaign] = { revenue: 0, count: 0 };
      }
      campaigns[campaign].revenue += a.attributed_revenue;
      campaigns[campaign].count++;
    });

    return Object.entries(campaigns)
      .map(([campaign, data]) => ({ campaign, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  };

  const getAttributionByModel = (model: string) => {
    return attributions?.filter(a => a.attribution_model === model) || [];
  };

  const getTotalAttributedRevenue = () => {
    if (!attributions) return 0;
    return attributions.reduce((sum, a) => sum + a.attributed_revenue, 0);
  };

  const getCustomerJourney = (companyId: string) => {
    return attributions
      ?.filter(a => a.company_id === companyId)
      .sort((a, b) => (a.touchpoint_order || 0) - (b.touchpoint_order || 0)) || [];
  };

  const getChannelROI = (channelCosts: Record<string, number>) => {
    const byChannel = getAttributionByChannel();
    return byChannel.map(ch => ({
      ...ch,
      cost: channelCosts[ch.channel] || 0,
      roi: channelCosts[ch.channel] 
        ? ((ch.revenue - channelCosts[ch.channel]) / channelCosts[ch.channel]) * 100 
        : 0
    }));
  };

  const getAverageConversionTime = () => {
    const withDays = attributions?.filter(a => a.days_to_conversion !== null) || [];
    if (withDays.length === 0) return 0;
    return withDays.reduce((sum, a) => sum + (a.days_to_conversion || 0), 0) / withDays.length;
  };

  return {
    attributions,
    isLoading,
    refetch,
    getAttributionByChannel,
    getAttributionBySource,
    getAttributionByCampaign,
    getAttributionByModel,
    getTotalAttributedRevenue,
    getCustomerJourney,
    getChannelROI,
    getAverageConversionTime
  };
};
