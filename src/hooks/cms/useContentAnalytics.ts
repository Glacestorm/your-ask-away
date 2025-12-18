import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PageAnalytics {
  id: string;
  page_path: string;
  page_title: string | null;
  views: number;
  unique_visitors: number;
  avg_time_on_page: number;
  bounce_rate: number;
  conversions: number;
  conversion_rate: number;
  date: string;
}

export interface ContentEngagement {
  id: string;
  content_id: string;
  content_type: string;
  content_title: string | null;
  clicks: number;
  scroll_depth: number;
  shares: number;
  likes: number;
  comments_count: number;
  avg_read_time: number;
  date: string;
}

export interface RealtimeVisitor {
  id: string;
  session_id: string;
  page_path: string;
  page_title: string | null;
  device_type: string | null;
  country: string | null;
  city: string | null;
  is_active: boolean;
  last_activity: string;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalUniqueVisitors: number;
  avgTimeOnPage: number;
  avgBounceRate: number;
  totalConversions: number;
  avgConversionRate: number;
  viewsChange: number;
  visitorsChange: number;
  timeChange: number;
  bounceChange: number;
  conversionsChange: number;
}

export interface TrendData {
  date: string;
  views: number;
  unique_visitors: number;
  conversions: number;
}

export interface TopPage {
  page_path: string;
  page_title: string | null;
  total_views: number;
  total_visitors: number;
  avg_bounce_rate: number;
  avg_conversion_rate: number;
}

export interface EngagementSummary {
  content_title: string | null;
  total_clicks: number;
  avg_scroll_depth: number;
  total_shares: number;
  total_likes: number;
}

export interface FunnelStep {
  step: string;
  value: number;
  percentage: number;
}

export const useContentAnalytics = (dateRange: number = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);
  const startDateStr = startDate.toISOString().split('T')[0];

  // Fetch page analytics
  const pageAnalyticsQuery = useQuery({
    queryKey: ['cms-page-analytics', dateRange],
    queryFn: async (): Promise<PageAnalytics[]> => {
      const { data, error } = await supabase
        .from('cms_page_analytics')
        .select('*')
        .gte('date', startDateStr)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });

  // Fetch content engagement
  const engagementQuery = useQuery({
    queryKey: ['cms-content-engagement', dateRange],
    queryFn: async (): Promise<ContentEngagement[]> => {
      const { data, error } = await supabase
        .from('cms_content_engagement')
        .select('*')
        .gte('date', startDateStr)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });

  // Fetch realtime visitors
  const realtimeQuery = useQuery({
    queryKey: ['cms-realtime-visitors'],
    queryFn: async (): Promise<RealtimeVisitor[]> => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('cms_realtime_visitors')
        .select('*')
        .eq('is_active', true)
        .gte('last_activity', fiveMinutesAgo)
        .order('last_activity', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });

  // Calculate summary
  const getSummary = (): AnalyticsSummary => {
    const data = pageAnalyticsQuery.data || [];
    if (data.length === 0) {
      return {
        totalViews: 0,
        totalUniqueVisitors: 0,
        avgTimeOnPage: 0,
        avgBounceRate: 0,
        totalConversions: 0,
        avgConversionRate: 0,
        viewsChange: 0,
        visitorsChange: 0,
        timeChange: 0,
        bounceChange: 0,
        conversionsChange: 0,
      };
    }

    const halfPoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, halfPoint);
    const secondHalf = data.slice(halfPoint);

    const sumFirstHalf = firstHalf.reduce(
      (acc, curr) => ({
        views: acc.views + curr.views,
        visitors: acc.visitors + curr.unique_visitors,
        time: acc.time + curr.avg_time_on_page,
        bounce: acc.bounce + curr.bounce_rate,
        conversions: acc.conversions + curr.conversions,
      }),
      { views: 0, visitors: 0, time: 0, bounce: 0, conversions: 0 }
    );

    const sumSecondHalf = secondHalf.reduce(
      (acc, curr) => ({
        views: acc.views + curr.views,
        visitors: acc.visitors + curr.unique_visitors,
        time: acc.time + curr.avg_time_on_page,
        bounce: acc.bounce + curr.bounce_rate,
        conversions: acc.conversions + curr.conversions,
      }),
      { views: 0, visitors: 0, time: 0, bounce: 0, conversions: 0 }
    );

    const totalViews = data.reduce((sum, item) => sum + item.views, 0);
    const totalUniqueVisitors = data.reduce((sum, item) => sum + item.unique_visitors, 0);
    const avgTimeOnPage = data.reduce((sum, item) => sum + item.avg_time_on_page, 0) / data.length;
    const avgBounceRate = data.reduce((sum, item) => sum + item.bounce_rate, 0) / data.length;
    const totalConversions = data.reduce((sum, item) => sum + item.conversions, 0);
    const avgConversionRate = data.reduce((sum, item) => sum + item.conversion_rate, 0) / data.length;

    const calcChange = (first: number, second: number) => {
      if (first === 0) return second > 0 ? 100 : 0;
      return ((second - first) / first) * 100;
    };

    return {
      totalViews,
      totalUniqueVisitors,
      avgTimeOnPage,
      avgBounceRate,
      totalConversions,
      avgConversionRate,
      viewsChange: calcChange(sumFirstHalf.views, sumSecondHalf.views),
      visitorsChange: calcChange(sumFirstHalf.visitors, sumSecondHalf.visitors),
      timeChange: calcChange(sumFirstHalf.time / (firstHalf.length || 1), sumSecondHalf.time / (secondHalf.length || 1)),
      bounceChange: calcChange(sumFirstHalf.bounce / (firstHalf.length || 1), sumSecondHalf.bounce / (secondHalf.length || 1)),
      conversionsChange: calcChange(sumFirstHalf.conversions, sumSecondHalf.conversions),
    };
  };

  // Get trend data
  const getTrends = (): TrendData[] => {
    const data = pageAnalyticsQuery.data || [];
    const grouped: { [key: string]: TrendData } = {};

    data.forEach((item) => {
      if (!grouped[item.date]) {
        grouped[item.date] = {
          date: item.date,
          views: 0,
          unique_visitors: 0,
          conversions: 0,
        };
      }
      grouped[item.date].views += item.views;
      grouped[item.date].unique_visitors += item.unique_visitors;
      grouped[item.date].conversions += item.conversions;
    });

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  };

  // Get top pages
  const getTopPages = (limit: number = 10): TopPage[] => {
    const data = pageAnalyticsQuery.data || [];
    const grouped: { [key: string]: { views: number; visitors: number; bounce: number[]; conversion: number[]; title: string | null } } = {};

    data.forEach((item) => {
      if (!grouped[item.page_path]) {
        grouped[item.page_path] = { views: 0, visitors: 0, bounce: [], conversion: [], title: item.page_title };
      }
      grouped[item.page_path].views += item.views;
      grouped[item.page_path].visitors += item.unique_visitors;
      grouped[item.page_path].bounce.push(item.bounce_rate);
      grouped[item.page_path].conversion.push(item.conversion_rate);
    });

    return Object.entries(grouped)
      .map(([path, stats]) => ({
        page_path: path,
        page_title: stats.title,
        total_views: stats.views,
        total_visitors: stats.visitors,
        avg_bounce_rate: stats.bounce.reduce((a, b) => a + b, 0) / stats.bounce.length,
        avg_conversion_rate: stats.conversion.reduce((a, b) => a + b, 0) / stats.conversion.length,
      }))
      .sort((a, b) => b.total_views - a.total_views)
      .slice(0, limit);
  };

  // Get engagement summary
  const getEngagementSummary = (): EngagementSummary[] => {
    const data = engagementQuery.data || [];
    const grouped: { [key: string]: { clicks: number; scroll: number[]; shares: number; likes: number; title: string | null } } = {};

    data.forEach((item) => {
      const key = item.content_title || item.content_id;
      if (!grouped[key]) {
        grouped[key] = { clicks: 0, scroll: [], shares: 0, likes: 0, title: item.content_title };
      }
      grouped[key].clicks += item.clicks;
      grouped[key].scroll.push(item.scroll_depth);
      grouped[key].shares += item.shares;
      grouped[key].likes += item.likes;
    });

    return Object.values(grouped)
      .map((stats) => ({
        content_title: stats.title,
        total_clicks: stats.clicks,
        avg_scroll_depth: stats.scroll.reduce((a, b) => a + b, 0) / stats.scroll.length,
        total_shares: stats.shares,
        total_likes: stats.likes,
      }))
      .sort((a, b) => b.total_clicks - a.total_clicks)
      .slice(0, 8);
  };

  // Get conversion funnel
  const getConversionFunnel = (): FunnelStep[] => {
    const summary = getSummary();
    const visitors = summary.totalUniqueVisitors;
    const engaged = Math.floor(visitors * 0.65);
    const interested = Math.floor(engaged * 0.45);
    const converted = summary.totalConversions;

    const steps = [
      { step: 'Visitantes', value: visitors, percentage: 100 },
      { step: 'Engaged', value: engaged, percentage: visitors > 0 ? (engaged / visitors) * 100 : 0 },
      { step: 'Interesados', value: interested, percentage: visitors > 0 ? (interested / visitors) * 100 : 0 },
      { step: 'Conversiones', value: converted, percentage: visitors > 0 ? (converted / visitors) * 100 : 0 },
    ];

    return steps;
  };

  return {
    pageAnalytics: pageAnalyticsQuery.data || [],
    engagement: engagementQuery.data || [],
    realtimeVisitors: realtimeQuery.data || [],
    isLoading: pageAnalyticsQuery.isLoading || engagementQuery.isLoading,
    isRealtimeLoading: realtimeQuery.isLoading,
    error: pageAnalyticsQuery.error || engagementQuery.error,
    summary: getSummary(),
    trends: getTrends(),
    topPages: getTopPages(),
    engagementSummary: getEngagementSummary(),
    conversionFunnel: getConversionFunnel(),
    refetchRealtime: realtimeQuery.refetch,
  };
};
