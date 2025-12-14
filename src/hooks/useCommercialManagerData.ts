import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useMemo } from 'react';

interface GestorDetail {
  name: string;
  oficina: string;
  totalVisits: number;
  successRate: number;
  companies: number;
}

interface ValidationMetrics {
  avgValidationTimeHours: number;
  approvalRate: number;
  totalValidated: number;
  approved: number;
  rejected: number;
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

interface ManagerStats {
  totalVisits: number;
  avgSuccessRate: number;
  totalCompanies: number;
  activeGestores: number;
}

interface ManagerData {
  stats: ManagerStats;
  previousStats: ManagerStats | null;
  gestorRanking: { name: string; visits: number }[];
  gestorDetails: GestorDetail[];
  validationMetrics: ValidationMetrics;
  monthlyTrends: MonthlyTrend[];
  resultDistribution: ResultDistribution[];
}

const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

async function fetchManagerData(
  fromDate: string,
  toDate: string,
  prevFromDate: string,
  prevToDate: string
): Promise<ManagerData> {
  // Fetch all data in parallel (7 queries)
  const [
    visitsResult,
    prevVisitsResult,
    companiesCountResult,
    companiesResult,
    profilesResult,
    validatedSheetsResult,
  ] = await Promise.all([
    // Current period visits
    supabase
      .from('visits')
      .select('id, result, gestor_id, visit_date')
      .gte('visit_date', fromDate)
      .lte('visit_date', toDate),
    // Previous period visits
    supabase
      .from('visits')
      .select('id, result')
      .gte('visit_date', prevFromDate)
      .lte('visit_date', prevToDate),
    // Companies count
    supabase
      .from('companies')
      .select('*', { count: 'exact', head: true }),
    // Companies by gestor
    supabase
      .from('companies')
      .select('gestor_id'),
    // All profiles
    supabase
      .from('profiles')
      .select('id, full_name, email, oficina'),
    // Validated sheets for metrics
    supabase
      .from('visit_sheets')
      .select('created_at, validated_at, validation_status')
      .not('validation_status', 'is', null)
      .gte('validated_at', `${fromDate}T00:00:00`)
      .lte('validated_at', `${toDate}T23:59:59`),
  ]);

  const visits = visitsResult.data || [];
  const prevVisits = prevVisitsResult.data || [];
  const companiesCount = companiesCountResult.count || 0;
  const companies = companiesResult.data || [];
  const profiles = profilesResult.data || [];
  const validatedSheets = validatedSheetsResult.data || [];

  // Calculate current stats
  const totalVisits = visits.length;
  const successfulVisits = visits.filter(v => v.result === 'Exitosa').length;
  const avgSuccessRate = totalVisits > 0 
    ? Math.round((successfulVisits / totalVisits) * 100) 
    : 0;

  // Calculate previous stats
  const prevTotal = prevVisits.length;
  const prevSuccess = prevVisits.filter(v => v.result === 'Exitosa').length;

  // Monthly trends
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

  // Validation metrics
  let validationMetrics: ValidationMetrics = {
    avgValidationTimeHours: 0,
    approvalRate: 0,
    totalValidated: 0,
    approved: 0,
    rejected: 0,
  };

  if (validatedSheets.length > 0) {
    const approved = validatedSheets.filter(s => s.validation_status === 'approved').length;
    const rejected = validatedSheets.filter(s => s.validation_status === 'rejected').length;
    const totalValidated = approved + rejected;
    
    let totalHours = 0;
    let validCount = 0;
    validatedSheets.forEach(s => {
      if (s.created_at && s.validated_at) {
        const created = new Date(s.created_at).getTime();
        const validated = new Date(s.validated_at).getTime();
        const hours = (validated - created) / (1000 * 60 * 60);
        if (hours >= 0 && hours < 720) {
          totalHours += hours;
          validCount++;
        }
      }
    });
    
    validationMetrics = {
      avgValidationTimeHours: validCount > 0 ? Math.round(totalHours / validCount * 10) / 10 : 0,
      approvalRate: totalValidated > 0 ? Math.round((approved / totalValidated) * 100) : 0,
      totalValidated,
      approved,
      rejected,
    };
  }

  // Aggregate gestor stats
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
    const companiesOwned = gestorCompaniesMap.get(profile.id) || 0;
    const successRate = visitStats.total > 0 
      ? Math.round((visitStats.success / visitStats.total) * 100) 
      : 0;

    return {
      name: profile.full_name || profile.email?.split('@')[0] || 'Unknown',
      oficina: profile.oficina || 'Sin asignar',
      totalVisits: visitStats.total,
      successRate,
      companies: companiesOwned,
    };
  }).sort((a, b) => b.totalVisits - a.totalVisits);

  const gestorRanking = gestorDetails
    .filter(d => d.totalVisits > 0)
    .slice(0, 10)
    .map(d => ({ name: d.name, visits: d.totalVisits }));

  return {
    stats: {
      totalVisits,
      avgSuccessRate,
      totalCompanies: companiesCount,
      activeGestores: profiles.length,
    },
    previousStats: {
      totalVisits: prevTotal,
      avgSuccessRate: prevTotal > 0 ? Math.round((prevSuccess / prevTotal) * 100) : 0,
      totalCompanies: companiesCount,
      activeGestores: profiles.length,
    },
    gestorRanking,
    gestorDetails,
    validationMetrics,
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
 * Optimized Commercial Manager Dashboard Hook
 * - Reduces queries from sequential to 6 parallel queries
 * - Uses React Query for caching (5 min stale time)
 * - Includes validation metrics
 */
export function useCommercialManagerData(dateRange: DateRange | undefined) {
  const { fromDate, toDate, prevFromDate, prevToDate, cacheKey } = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) {
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
      cacheKey: `manager-${from}-${to}`,
    };
  }, [dateRange]);

  const query = useQuery({
    queryKey: ['dashboard', 'manager', cacheKey],
    queryFn: () => fetchManagerData(fromDate, toDate, prevFromDate, prevToDate),
    enabled: !!cacheKey,
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
