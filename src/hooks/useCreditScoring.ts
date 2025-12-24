import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from './core';

export type CreditScoringError = KBError;

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
  const [result, setResult] = useState<CreditScoreResult | null>(null);
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
    setResult(null);
  }, []);

  const calculateScore = useCallback(async (companyId: string) => {
    const startTime = new Date();
    setStatus('loading');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('credit-scoring', {
        body: { companyId }
      });

      if (fnError) throw fnError;

      setResult(data);
      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setRetryCount(0);
      
      collectTelemetry({
        hookName: 'useCreditScoring',
        operationName: 'calculateScore',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'success',
        retryCount: 0
      });
      
      toast.success('Scoring creditici calculat correctament');
      return data;
    } catch (err) {
      const kbError = createKBError('CALCULATE_SCORE_ERROR', parseError(err).message, { originalError: err });
      setError(kbError);
      setStatus('error');
      
      collectTelemetry({
        hookName: 'useCreditScoring',
        operationName: 'calculateScore',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'error',
        error: kbError,
        retryCount
      });
      
      toast.error(kbError.message);
      return null;
    }
  }, [retryCount]);

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
    data: result,
    // === KB 2.0 RETURN ===
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    error,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
    reset,
    getRatingColor
  };
}

export default useCreditScoring;
