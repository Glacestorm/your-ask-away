import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CreditScoreResult {
  score: number; // 0-1000
  rating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'CC' | 'C' | 'D';
  riskLevel: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
  probability_of_default: number;
  factors: CreditFactor[];
  recommendations: string[];
  explainability: ExplainabilityReport;
}

export interface CreditFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  value: number;
  benchmark: number;
  description: string;
}

export interface ExplainabilityReport {
  methodology: string;
  key_drivers: string[];
  model_confidence: number;
  data_quality_score: number;
  regulatory_compliance: string[];
}

export function useCreditScoring() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CreditScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateScore = useCallback(async (companyId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('credit-scoring', {
        body: { companyId }
      });

      if (fnError) throw fnError;

      setResult(data);
      toast.success('Scoring creditici calculat correctament');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error calculant scoring';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getRatingColor = useCallback((rating: CreditScoreResult['rating']): string => {
    const colors: Record<CreditScoreResult['rating'], string> = {
      'AAA': 'text-emerald-600',
      'AA': 'text-emerald-500',
      'A': 'text-green-500',
      'BBB': 'text-lime-500',
      'BB': 'text-yellow-500',
      'B': 'text-orange-500',
      'CCC': 'text-orange-600',
      'CC': 'text-red-500',
      'C': 'text-red-600',
      'D': 'text-red-700'
    };
    return colors[rating] || 'text-gray-500';
  }, []);

  return {
    calculateScore,
    result,
    isLoading,
    error,
    getRatingColor
  };
}

export default useCreditScoring;
