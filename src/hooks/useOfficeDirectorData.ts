import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useMemo } from 'react';

interface GestorDetail {
  name: string;
  totalVisits: number;
  successRate: number;
  companies: number;
}

interface MonthlyTrend {
  month: string;
  visits: number;
  successful: number;
}

interface ResultDistribution {
  name: string;
  value: number;
  color: string;
}

interface OfficeStats {
  totalVisits: number;
  avgSuccessRate: number;
  totalCompanies: number;
  activeGestores: number;
}

interface OfficeData {
  stats: OfficeStats;
  previousStats: OfficeStats | null;
  gestorRanking: { name: string; visits: number }[];
  gestorDetails: GestorDetail[];
  monthlyTrends: MonthlyTrend[];
  resultDistribution: ResultDistribution[];
}

const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

async function fetchOfficeData(
  oficina: string,
  fromDate: string,
  toDate: string,
  prevFromDate: string,
  prevToDate: string
): Promise<OfficeData> {
  // First get all gestores from this office
  const { data: officeProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('oficina', oficina);

  if (!officeProfiles || officeProfiles.length === 0) {
    throw new Error('No hay gestores en tu oficina');
  }

  const gestorIds = officeProfiles.map(p => p.id);

  // Fetch all data in parallel (6 queries instead of N+1)
  const [
    visitsResult,
    prevVisitsResult,
    companiesResult,
    companiesByGestorResult,
  ] = await Promise.all([
    // Current period visits
    supabase
      .from('visits')
      .select('id, result, gestor_id, visit_date')
      .in('gestor_id', gestorIds)
      .gte('visit_date', fromDate)
      .lte('visit_date', toDate),
    // Previous period visits
    supabase
      .from('visits')
      .select('id, result, gestor_id')
      .in('gestor_id', gestorIds)
      .gte('visit_date', prevFromDate)
      .lte('visit_date', prevToDate),
    // Total companies count for office
    supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .in('gestor_id', gestorIds),
    // Companies by gestor (single query to aggregate)
    supabase
      .from('companies')
      .select('gestor_id')
      .in('gestor_id', gestorIds),
  ]);

  const visits = visitsResult.data || [];
  const prevVisits = prevVisitsResult.data || [];
  const companiesCount = companiesResult.count || 0;
  const allCompanies = companiesByGestorResult.data || [];

  // Calculate current stats
  const totalVisits = visits.length;
  const successfulVisits = visits.filter(v => v.result === 'Exitosa').length;
  const avgSuccessRate = totalVisits > 0 
    ? Math.round((successfulVisits / totalVisits) * 100) 
    : 0;

  // Calculate previous stats
  const prevTotal = prevVisits.length;
  const prevSuccess = prevVisits.filter(v => v.result === 'Exitosa').length;

  // Monthly trends - aggregate client-side
  const monthlyMap = new Map<string, { visits: number; successful: number }>();
  visits.forEach(visit => {
    const monthKey = format(new Date(visit.visit_date), 'MMM');
    const data = monthlyMap.get(monthKey) || { visits: 0, successful: 0 };
    data.visits++;
    if (visit.result === 'Exitosa') data.successful++;
    monthlyMap.set(monthKey, data);
  });

  // Result distribution
  const resultsMap = new Map<string, number>();
  visits.forEach(visit => {
    const result = visit.result || 'Sin resultado';
    resultsMap.set(result, (resultsMap.get(result) || 0) + 1);
  });

  // Aggregate gestor stats from bulk data (no N+1!)
  const gestorVisitsMap = new Map<string, { total: number; success: number }>();
  const gestorCompaniesMap = new Map<string, number>();

  visits.forEach(v => {
    if (!v.gestor_id) return;
    const current = gestorVisitsMap.get(v.gestor_id) || { total: 0, success: 0 };
    current.total++;
    if (v.result === 'Exitosa') current.success++;
    gestorVisitsMap.set(v.gestor_id, current);
  });

  allCompanies.forEach(c => {
    if (!c.gestor_id) return;
    gestorCompaniesMap.set(c.gestor_id, (gestorCompaniesMap.get(c.gestor_id) || 0) + 1);
  });

  // Build gestor details
  const gestorDetails: GestorDetail[] = officeProfiles.map(profile => {
    const visitStats = gestorVisitsMap.get(profile.id) || { total: 0, success: 0 };
    const companies = gestorCompaniesMap.get(profile.id) || 0;
    const successRate = visitStats.total > 0 
      ? Math.round((visitStats.success / visitStats.total) * 100) 
      : 0;

    return {
      name: profile.full_name || profile.email?.split('@')[0] || 'Unknown',
      totalVisits: visitStats.total,
      successRate,
      companies,
    };
  }).sort((a, b) => b.totalVisits - a.totalVisits);

  const gestorRanking = gestorDetails.map(d => ({ name: d.name, visits: d.totalVisits }));

  return {
    stats: {
      totalVisits,
      avgSuccessRate,
      totalCompanies: companiesCount,
      activeGestores: officeProfiles.length,
    },
    previousStats: {
      totalVisits: prevTotal,
      avgSuccessRate: prevTotal > 0 ? Math.round((prevSuccess / prevTotal) * 100) : 0,
      totalCompanies: companiesCount,
      activeGestores: officeProfiles.length,
    },
    gestorRanking,
    gestorDetails,
    monthlyTrends: Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      visits: data.visits,
      successful: data.successful,
    })),
    resultDistribution: Array.from(resultsMap.entries()).map(([name, value], index) => ({
      name,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length],
    })),
  };
}

/**
 * Optimized Office Director Dashboard Hook
 * - Reduces queries from N+1 to 4 parallel queries
 * - Uses React Query for caching (5 min stale time)
 * - Fetches all gestor data in single bulk operation
 */
export function useOfficeDirectorData(dateRange: DateRange | undefined, oficina: string | null) {
  const { fromDate, toDate, prevFromDate, prevToDate, cacheKey } = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to || !oficina) {
      return { fromDate: '', toDate: '', prevFromDate: '', prevToDate: '', cacheKey: '' };
    }
    
    const from = format(dateRange.from, 'yyyy-MM-dd');
    const to = format(dateRange.to, 'yyyy-MM-dd');
    const prevFrom = format(subMonths(dateRange.from, 1), 'yyyy-MM-dd');
    const prevTo = format(subMonths(dateRange.to, 1), 'yyyy-MM-dd');
    
    return {
      fromDate: from,
      toDate: to,
      prevFromDate: prevFrom,
      prevToDate: prevTo,
      cacheKey: `office-${oficina}-${from}-${to}`,
    };
  }, [dateRange, oficina]);

  const query = useQuery({
    queryKey: ['dashboard', 'office', cacheKey],
    queryFn: () => fetchOfficeData(oficina!, fromDate, toDate, prevFromDate, prevToDate),
    enabled: !!cacheKey && !!oficina,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    data: query.data || null,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
