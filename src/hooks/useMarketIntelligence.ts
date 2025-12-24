import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MarketDataSource {
  source: 'statista' | 'ine' | 'eurostat' | 'ai_enriched';
  name: string;
  icon: string;
}

export interface MarketInsight {
  id: string;
  source: MarketDataSource['source'];
  category: 'strengths' | 'weaknesses' | 'opportunities' | 'threats';
  title: string;
  description: string;
  value?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  confidence: number;
  reference_url?: string;
  fetched_at: string;
}

export interface SectorMarketData {
  sector_key: string;
  market_size: number;
  growth_rate: number;
  competition_level: 'low' | 'medium' | 'high';
  avg_margin: number;
  regulatory_risk: 'low' | 'medium' | 'high';
  insights: MarketInsight[];
}

const MARKET_SOURCES: MarketDataSource[] = [
  { source: 'statista', name: 'Statista', icon: '📊' },
  { source: 'ine', name: 'INE España', icon: '🇪🇸' },
  { source: 'eurostat', name: 'Eurostat', icon: '🇪🇺' },
  { source: 'ai_enriched', name: 'IA Enriquecida', icon: '🤖' }
];

export function useMarketIntelligence() {
  const [isLoading, setIsLoading] = useState(false);
  const [marketData, setMarketData] = useState<SectorMarketData | null>(null);
  const [insights, setInsights] = useState<MarketInsight[]>([]);

  const fetchMarketIntelligence = useCallback(async (
    sectorKey: string,
    projectDescription: string,
    existingDafoItems?: { category: string; description: string }[]
  ): Promise<MarketInsight[]> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('market-intelligence', {
        body: {
          action: 'fetch_market_data',
          sector_key: sectorKey,
          project_description: projectDescription,
          existing_items: existingDafoItems || [],
          sources: ['statista', 'ine', 'eurostat']
        }
      });

      if (error) throw error;

      const enrichedInsights = data?.insights || [];
      setInsights(enrichedInsights);
      setMarketData(data?.market_data || null);
      
      toast.success(`${enrichedInsights.length} insights de mercado obtenidos`);
      return enrichedInsights;
    } catch (err) {
      console.error('Market intelligence error:', err);
      toast.error('Error al obtener datos de mercado');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const enrichDafoWithMarketData = useCallback(async (
    analysisId: string,
    sectorKey: string,
    description: string
  ): Promise<MarketInsight[]> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('market-intelligence', {
        body: {
          action: 'enrich_dafo',
          analysis_id: analysisId,
          sector_key: sectorKey,
          description
        }
      });

      if (error) throw error;

      const enrichments = data?.enrichments || [];
      setInsights(prev => [...prev, ...enrichments]);
      
      toast.success(`DAFO enriquecido con ${enrichments.length} datos externos`);
      return enrichments;
    } catch (err) {
      console.error('DAFO enrichment error:', err);
      toast.error('Error al enriquecer DAFO');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSectorBenchmarks = useCallback(async (sectorKey: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('market-intelligence', {
        body: {
          action: 'get_benchmarks',
          sector_key: sectorKey
        }
      });

      if (error) throw error;
      return data?.benchmarks || null;
    } catch (err) {
      console.error('Benchmark fetch error:', err);
      return null;
    }
  }, []);

  return {
    isLoading,
    marketData,
    insights,
    sources: MARKET_SOURCES,
    fetchMarketIntelligence,
    enrichDafoWithMarketData,
    getSectorBenchmarks
  };
}
