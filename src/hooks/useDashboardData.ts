import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';

// === ERROR TIPADO KB ===
export interface DashboardDataError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
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

const CACHE_DURATION = 60000; // 1 minute cache

export function useDashboardData(dateRange: DateRange | undefined) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  // === ESTADO KB ===
  const [error, setError] = useState<DashboardDataError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);
  
  const cacheRef = useRef<{ data: DashboardData; timestamp: number; key: string } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    const cacheKey = `${format(dateRange.from, 'yyyy-MM-dd')}-${format(dateRange.to, 'yyyy-MM-dd')}`;
    
    // Check cache
    if (cacheRef.current && 
        cacheRef.current.key === cacheKey && 
        Date.now() - cacheRef.current.timestamp < CACHE_DURATION) {
      setData(cacheRef.current.data);
      setLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);

      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');
      const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      const prevFromDate = format(subDays(dateRange.from, daysDiff), 'yyyy-MM-dd');
      const prevToDate = format(subDays(dateRange.from, 1), 'yyyy-MM-dd');

      // Execute ALL queries in parallel - this is the key optimization
      const [
        visitsResult,
        prevVisitsResult,
        successResult,
        prevSuccessResult,
        visitsDataResult,
        companiesResult,
        profilesResult,
        allVisitsResult,
        allCompaniesResult,
      ] = await Promise.all([
        // Current period visits count
        supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .gte('visit_date', fromDate)
          .lte('visit_date', toDate),
        // Previous period visits count
        supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .gte('visit_date', prevFromDate)
          .lte('visit_date', prevToDate),
        // Success count current
        supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('result', 'Exitosa')
          .gte('visit_date', fromDate)
          .lte('visit_date', toDate),
        // Success count previous
        supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('result', 'Exitosa')
          .gte('visit_date', prevFromDate)
          .lte('visit_date', prevToDate),
        // All visits data for distribution (just result field)
        supabase
          .from('visits')
          .select('result, gestor_id')
          .gte('visit_date', fromDate)
          .lte('visit_date', toDate),
        // Companies count
        supabase
          .from('companies')
          .select('*', { count: 'exact', head: true }),
        // Profiles
        supabase
          .from('profiles')
          .select('id, full_name, email, oficina'),
        // All visits with gestor_id for aggregation
        supabase
          .from('visits')
          .select('gestor_id, result')
          .gte('visit_date', fromDate)
          .lte('visit_date', toDate),
        // All companies with gestor_id for aggregation
        supabase
          .from('companies')
          .select('gestor_id'),
      ]);

      // Process result distribution
      const distribution: Record<string, number> = {};
      if (visitsDataResult.data) {
        visitsDataResult.data.forEach(v => {
          const result = v.result || 'Sin resultado';
          distribution[result] = (distribution[result] || 0) + 1;
        });
      }
      const resultDistribution = Object.entries(distribution).map(([name, value]) => ({ name, value }));

      // Aggregate gestor stats from bulk data (no N+1 queries!)
      const gestorVisitsMap = new Map<string, { total: number; success: number }>();
      const gestorCompaniesMap = new Map<string, number>();

      if (allVisitsResult.data) {
        allVisitsResult.data.forEach(v => {
          if (!v.gestor_id) return;
          const current = gestorVisitsMap.get(v.gestor_id) || { total: 0, success: 0 };
          current.total++;
          if (v.result === 'Exitosa') current.success++;
          gestorVisitsMap.set(v.gestor_id, current);
        });
      }

      if (allCompaniesResult.data) {
        allCompaniesResult.data.forEach(c => {
          if (!c.gestor_id) return;
          gestorCompaniesMap.set(c.gestor_id, (gestorCompaniesMap.get(c.gestor_id) || 0) + 1);
        });
      }

      // Build gestor details from aggregated data
      const gestorDetails: GestorDetail[] = (profilesResult.data || []).map(profile => {
        const visitStats = gestorVisitsMap.get(profile.id) || { total: 0, success: 0 };
        const companies = gestorCompaniesMap.get(profile.id) || 0;
        const successRate = visitStats.total > 0 
          ? Math.round((visitStats.success / visitStats.total) * 100) 
          : 0;

        return {
          id: profile.id,
          name: profile.full_name || profile.email?.split('@')[0] || 'Unknown',
          oficina: profile.oficina || 'Sin asignar',
          totalVisits: visitStats.total,
          successRate,
          companies,
        };
      }).sort((a, b) => b.totalVisits - a.totalVisits);

      const gestorRanking = gestorDetails
        .filter(d => d.totalVisits > 0)
        .slice(0, 5)
        .map(d => ({ name: d.name, visits: d.totalVisits, successRate: d.successRate }));

      // Monthly trend - parallel queries for all 6 months
      const monthlyPromises = Array.from({ length: 6 }, (_, i) => {
        const monthStart = startOfMonth(subMonths(new Date(), 5 - i));
        const monthEnd = endOfMonth(subMonths(new Date(), 5 - i));
        const monthFromDate = format(monthStart, 'yyyy-MM-dd');
        const monthToDate = format(monthEnd, 'yyyy-MM-dd');

        return Promise.all([
          supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .gte('visit_date', monthFromDate)
            .lte('visit_date', monthToDate),
          supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('result', 'Exitosa')
            .gte('visit_date', monthFromDate)
            .lte('visit_date', monthToDate),
        ]).then(([visitsRes, successRes]) => ({
          month: format(monthStart, 'MMM'),
          visits: visitsRes.count || 0,
          successful: successRes.count || 0,
        }));
      });

      const monthlyTrend = await Promise.all(monthlyPromises);

      // Calculate stats
      const totalVisits = visitsResult.count || 0;
      const successfulVisits = successResult.count || 0;
      const avgSuccessRate = totalVisits > 0 
        ? Math.round((successfulVisits / totalVisits) * 100) 
        : 0;

      const prevTotal = prevVisitsResult.count || 0;
      const prevSuccess = prevSuccessResult.count || 0;
      const prevSuccessRate = prevTotal > 0 ? Math.round((prevSuccess / prevTotal) * 100) : 0;

      const visitsTrend = prevTotal > 0 ? Math.round(((totalVisits - prevTotal) / prevTotal) * 100) : 0;
      const successTrend = prevSuccessRate > 0 ? avgSuccessRate - prevSuccessRate : 0;

      const dashboardData: DashboardData = {
        stats: {
          totalVisits,
          avgSuccessRate,
          totalCompanies: companiesResult.count || 0,
          activeGestores: profilesResult.data?.length || 0,
          visitsTrend,
          successTrend,
        },
        gestorDetails,
        gestorRanking,
        monthlyTrend,
        resultDistribution,
      };

      // Update cache
      cacheRef.current = {
        data: dashboardData,
        timestamp: Date.now(),
        key: cacheKey,
      };

      setData(dashboardData);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError({
          code: 'FETCH_DASHBOARD_ERROR',
          message: err.message,
          details: { originalError: String(err) }
        });
        console.error('Error fetching dashboard data:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    cacheRef.current = null;
    fetchData();
  }, [fetchData]);

  return { 
    data, 
    loading, 
    // === KB ADDITIONS ===
    error, 
    lastRefresh,
    clearError,
    refetch 
  };
}
