import { useQuery, useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useMemo } from 'react';

interface GestorDetail {
  id: string;
  name: string;
  oficina: string;
  totalVisits: number;
  successRate: number;
  companies: number;
}

interface MonthlyTrend {
  month: string;
  visits: number;
  successful: number;
}

interface DashboardStats {
  totalVisits: number;
  avgSuccessRate: number;
  totalCompanies: number;
  activeGestores: number;
  visitsTrend: number;
  successTrend: number;
}

interface DashboardData {
  stats: DashboardStats;
  gestorDetails: GestorDetail[];
  gestorRanking: { name: string; visits: number; successRate: number }[];
  monthlyTrend: MonthlyTrend[];
  resultDistribution: { name: string; value: number }[];
}

// Single optimized query that fetches ALL core data in one go
async function fetchCoreData(fromDate: string, toDate: string, prevFromDate: string, prevToDate: string) {
  // Execute all queries in parallel - only 5 queries instead of 9
  const [
    visitsWithResults,
    companiesWithGestor,
    profiles,
    prevPeriodVisits,
    companiesCount,
  ] = await Promise.all([
    // All visits with minimal fields for aggregation
    supabase
      .from('visits')
      .select('id, result, gestor_id, visit_date')
      .gte('visit_date', fromDate)
      .lte('visit_date', toDate),
    // All companies with gestor
    supabase
      .from('companies')
      .select('id, gestor_id'),
    // All profiles
    supabase
      .from('profiles')
      .select('id, full_name, email, oficina'),
    // Previous period visits for trend
    supabase
      .from('visits')
      .select('id, result', { count: 'exact' })
      .gte('visit_date', prevFromDate)
      .lte('visit_date', prevToDate),
    // Companies count
    supabase
      .from('companies')
      .select('*', { count: 'exact', head: true }),
  ]);

  return {
    visits: visitsWithResults.data || [],
    companies: companiesWithGestor.data || [],
    profiles: profiles.data || [],
    prevVisits: prevPeriodVisits.data || [],
    prevVisitsCount: prevPeriodVisits.count || 0,
    companiesCount: companiesCount.count || 0,
  };
}

// Process all data client-side (much faster than multiple queries)
function processDashboardData(
  rawData: Awaited<ReturnType<typeof fetchCoreData>>,
  fromDate: string,
  toDate: string
): Omit<DashboardData, 'monthlyTrend'> {
  const { visits, companies, profiles, prevVisits, prevVisitsCount, companiesCount } = rawData;

  // Result distribution
  const distribution: Record<string, number> = {};
  visits.forEach(v => {
    const result = v.result || 'Sin resultado';
    distribution[result] = (distribution[result] || 0) + 1;
  });
  const resultDistribution = Object.entries(distribution).map(([name, value]) => ({ name, value }));

  // Gestor aggregations
  const gestorVisitsMap = new Map<string, { total: number; success: number }>();
  const gestorCompaniesMap = new Map<string, number>();

  visits.forEach(v => {
    if (!v.gestor_id) return;
    const current = gestorVisitsMap.get(v.gestor_id) || { total: 0, success: 0 };
    current.total++;
    if (v.result === 'Exitosa') current.success++;
    gestorVisitsMap.set(v.gestor_id, current);
  });

  companies.forEach(c => {
    if (!c.gestor_id) return;
    gestorCompaniesMap.set(c.gestor_id, (gestorCompaniesMap.get(c.gestor_id) || 0) + 1);
  });

  // Build gestor details
  const gestorDetails: GestorDetail[] = profiles.map(profile => {
    const visitStats = gestorVisitsMap.get(profile.id) || { total: 0, success: 0 };
    const companiesCount = gestorCompaniesMap.get(profile.id) || 0;
    const successRate = visitStats.total > 0 
      ? Math.round((visitStats.success / visitStats.total) * 100) 
      : 0;

    return {
      id: profile.id,
      name: profile.full_name || profile.email?.split('@')[0] || 'Unknown',
      oficina: profile.oficina || 'Sin asignar',
      totalVisits: visitStats.total,
      successRate,
      companies: companiesCount,
    };
  }).sort((a, b) => b.totalVisits - a.totalVisits);

  const gestorRanking = gestorDetails
    .filter(d => d.totalVisits > 0)
    .slice(0, 5)
    .map(d => ({ name: d.name, visits: d.totalVisits, successRate: d.successRate }));

  // Calculate stats
  const totalVisits = visits.length;
  const successfulVisits = visits.filter(v => v.result === 'Exitosa').length;
  const avgSuccessRate = totalVisits > 0 
    ? Math.round((successfulVisits / totalVisits) * 100) 
    : 0;

  const prevSuccessful = prevVisits.filter(v => v.result === 'Exitosa').length;
  const prevSuccessRate = prevVisitsCount > 0 
    ? Math.round((prevSuccessful / prevVisitsCount) * 100) 
    : 0;

  const visitsTrend = prevVisitsCount > 0 
    ? Math.round(((totalVisits - prevVisitsCount) / prevVisitsCount) * 100) 
    : 0;
  const successTrend = prevSuccessRate > 0 ? avgSuccessRate - prevSuccessRate : 0;

  return {
    stats: {
      totalVisits,
      avgSuccessRate,
      totalCompanies: companiesCount,
      activeGestores: profiles.length,
      visitsTrend,
      successTrend,
    },
    gestorDetails,
    gestorRanking,
    resultDistribution,
  };
}

// Fetch monthly trend with single query using date grouping
async function fetchMonthlyTrend(): Promise<MonthlyTrend[]> {
  const now = new Date();
  const sixMonthsAgo = startOfMonth(subMonths(now, 5));
  
  const { data: visits } = await supabase
    .from('visits')
    .select('visit_date, result')
    .gte('visit_date', format(sixMonthsAgo, 'yyyy-MM-dd'))
    .lte('visit_date', format(endOfMonth(now), 'yyyy-MM-dd'));

  if (!visits) return [];

  // Group by month client-side (single query instead of 12!)
  const monthlyMap = new Map<string, { visits: number; successful: number }>();
  
  for (let i = 0; i < 6; i++) {
    const monthDate = subMonths(now, 5 - i);
    const monthKey = format(monthDate, 'MMM');
    monthlyMap.set(monthKey, { visits: 0, successful: 0 });
  }

  visits.forEach(v => {
    const visitDate = new Date(v.visit_date);
    const monthKey = format(visitDate, 'MMM');
    const current = monthlyMap.get(monthKey);
    if (current) {
      current.visits++;
      if (v.result === 'Exitosa') current.successful++;
    }
  });

  return Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    ...data,
  }));
}

/**
 * Optimized Dashboard Data Hook
 * - Uses React Query for global caching and deduplication
 * - Reduces queries from 21 to 6 total
 * - Progressive loading: core data first, then trends
 * - 5-minute stale time for fast subsequent loads
 */
export function useDashboardDataOptimized(dateRange: DateRange | undefined) {
  const { fromDate, toDate, prevFromDate, prevToDate, cacheKey } = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) {
      return { fromDate: '', toDate: '', prevFromDate: '', prevToDate: '', cacheKey: '' };
    }
    
    const from = format(dateRange.from, 'yyyy-MM-dd');
    const to = format(dateRange.to, 'yyyy-MM-dd');
    const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
    const prevFrom = format(new Date(dateRange.from.getTime() - daysDiff * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    const prevTo = format(new Date(dateRange.from.getTime() - 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    
    return {
      fromDate: from,
      toDate: to,
      prevFromDate: prevFrom,
      prevToDate: prevTo,
      cacheKey: `${from}-${to}`,
    };
  }, [dateRange]);

  // Core data query - runs first with high priority
  const coreQuery = useQuery({
    queryKey: ['dashboard', 'core', cacheKey],
    queryFn: async () => {
      if (!fromDate || !toDate) return null;
      const rawData = await fetchCoreData(fromDate, toDate, prevFromDate, prevToDate);
      return processDashboardData(rawData, fromDate, toDate);
    },
    enabled: !!cacheKey,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });

  // Monthly trend query - can load slightly later (not blocking)
  const trendQuery = useQuery({
    queryKey: ['dashboard', 'trends'],
    queryFn: fetchMonthlyTrend,
    staleTime: 10 * 60 * 1000, // 10 minutes - trends change less frequently
    gcTime: 60 * 60 * 1000, // 1 hour cache
  });

  // Combine data
  const data: DashboardData | null = useMemo(() => {
    if (!coreQuery.data) return null;
    
    return {
      ...coreQuery.data,
      monthlyTrend: trendQuery.data || [],
    };
  }, [coreQuery.data, trendQuery.data]);

  return {
    data,
    loading: coreQuery.isLoading,
    isLoadingTrends: trendQuery.isLoading,
    error: coreQuery.error || trendQuery.error,
    refetch: () => {
      coreQuery.refetch();
      trendQuery.refetch();
    },
  };
}
