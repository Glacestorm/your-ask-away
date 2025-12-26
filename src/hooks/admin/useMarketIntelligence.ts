/**
 * Market Intelligence Hook
 * Análisis de competencia, tendencias y noticias del mercado
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface Competitor {
  name: string;
  category: 'direct' | 'indirect' | 'emerging';
  strengths: string[];
  weaknesses: string[];
  recentMoves: string[];
  threatLevel: 'low' | 'medium' | 'high';
  marketShare: number;
  pricing: { model: string; range: string };
  keyDifferentiators: string[];
}

export interface MarketTrend {
  name: string;
  category: 'technology' | 'market' | 'regulatory' | 'consumer';
  description: string;
  maturityLevel: 'emerging' | 'growing' | 'mainstream' | 'declining';
  impactScore: number;
  timeframe: 'short' | 'medium' | 'long';
  relevance: 'high' | 'medium' | 'low';
  actionItems: string[];
  sources: string[];
}

export interface MarketNews {
  title: string;
  summary: string;
  category: 'funding' | 'product' | 'partnership' | 'acquisition' | 'regulatory' | 'market';
  impact: 'positive' | 'neutral' | 'negative';
  relevance: 'high' | 'medium' | 'low';
  entities: string[];
  date: string;
  actionRequired: boolean;
  suggestedAction?: string;
}

export interface MarketAlert {
  type: 'competitor_move' | 'market_shift' | 'opportunity' | 'threat';
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

export interface StrategicInsight {
  title: string;
  type: 'opportunity' | 'risk' | 'improvement' | 'innovation';
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  priority: number;
  metrics: string[];
  nextSteps: string[];
}

export interface Benchmark {
  metric: string;
  category: 'financial' | 'operational' | 'product' | 'customer';
  currentValue: number;
  industryAverage: number;
  topPerformer: number;
  percentile: number;
  trend: 'improving' | 'stable' | 'declining';
  gap: number;
  recommendation: string;
}

export interface CompetitorAnalysis {
  competitors: Competitor[];
  marketOverview: {
    totalSize: string;
    growthRate: number;
    keyTrends: string[];
  };
  competitivePosition: {
    strengths: string[];
    opportunities: string[];
    threats: string[];
  };
}

export interface TrendAnalysis {
  trends: MarketTrend[];
  megatrends: string[];
  disruptors: string[];
  recommendations: string[];
}

export interface NewsAnalysis {
  news: MarketNews[];
  alerts: MarketAlert[];
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative';
    score: number;
  };
}

export interface InsightsAnalysis {
  insights: StrategicInsight[];
  quickWins: string[];
  strategicPriorities: string[];
  risksMitigations: { risk: string; mitigation: string }[];
}

export interface BenchmarkAnalysis {
  benchmarks: Benchmark[];
  overallScore: number;
  strengths: string[];
  improvementAreas: string[];
  competitiveAdvantages: string[];
}

// === HOOK ===
export function useMarketIntelligence() {
  const [isLoading, setIsLoading] = useState(false);
  const [competitors, setCompetitors] = useState<CompetitorAnalysis | null>(null);
  const [trends, setTrends] = useState<TrendAnalysis | null>(null);
  const [news, setNews] = useState<NewsAnalysis | null>(null);
  const [insights, setInsights] = useState<InsightsAnalysis | null>(null);
  const [benchmarks, setBenchmarks] = useState<BenchmarkAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === ANALYZE COMPETITORS ===
  const analyzeCompetitors = useCallback(async (params?: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'market-intelligence',
        {
          body: {
            action: 'analyze_competitors',
            params
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        setCompetitors(fnData.data);
        setLastRefresh(new Date());
        return fnData.data as CompetitorAnalysis;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error analyzing competitors';
      setError(message);
      console.error('[useMarketIntelligence] analyzeCompetitors error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === DETECT TRENDS ===
  const detectTrends = useCallback(async (params?: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'market-intelligence',
        {
          body: {
            action: 'detect_trends',
            params
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        setTrends(fnData.data);
        setLastRefresh(new Date());
        return fnData.data as TrendAnalysis;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error detecting trends';
      setError(message);
      console.error('[useMarketIntelligence] detectTrends error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === MONITOR NEWS ===
  const monitorNews = useCallback(async (params?: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'market-intelligence',
        {
          body: {
            action: 'monitor_news',
            params
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        setNews(fnData.data);
        setLastRefresh(new Date());
        return fnData.data as NewsAnalysis;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error monitoring news';
      setError(message);
      console.error('[useMarketIntelligence] monitorNews error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET INSIGHTS ===
  const getInsights = useCallback(async (params?: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'market-intelligence',
        {
          body: {
            action: 'get_insights',
            params
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        setInsights(fnData.data);
        setLastRefresh(new Date());
        return fnData.data as InsightsAnalysis;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error getting insights';
      setError(message);
      console.error('[useMarketIntelligence] getInsights error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === BENCHMARK ===
  const runBenchmark = useCallback(async (params?: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'market-intelligence',
        {
          body: {
            action: 'benchmark',
            params
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        setBenchmarks(fnData.data);
        setLastRefresh(new Date());
        return fnData.data as BenchmarkAnalysis;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error running benchmark';
      setError(message);
      console.error('[useMarketIntelligence] runBenchmark error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FULL ANALYSIS ===
  const runFullAnalysis = useCallback(async () => {
    setIsLoading(true);
    toast.info('Iniciando análisis completo de mercado...');

    try {
      await Promise.all([
        analyzeCompetitors(),
        detectTrends(),
        monitorNews(),
        getInsights()
      ]);

      toast.success('Análisis de mercado completado');
      setLastRefresh(new Date());
    } catch (err) {
      toast.error('Error en análisis de mercado');
    } finally {
      setIsLoading(false);
    }
  }, [analyzeCompetitors, detectTrends, monitorNews, getInsights]);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 300000) => {
    stopAutoRefresh();
    runFullAnalysis();
    autoRefreshInterval.current = setInterval(() => {
      runFullAnalysis();
    }, intervalMs);
  }, [runFullAnalysis]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  // === RETURN ===
  return {
    // Estado
    isLoading,
    competitors,
    trends,
    news,
    insights,
    benchmarks,
    error,
    lastRefresh,
    // Acciones
    analyzeCompetitors,
    detectTrends,
    monitorNews,
    getInsights,
    runBenchmark,
    runFullAnalysis,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useMarketIntelligence;
