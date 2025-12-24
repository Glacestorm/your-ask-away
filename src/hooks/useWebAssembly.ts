/**
 * useWebAssembly - Hook para integrar WebAssembly en componentes React
 * 
 * Proporciona:
 * - Inicialización automática del módulo WASM
 * - Estado de carga y disponibilidad
 * - Funciones de cálculo financiero optimizadas
 * - Fallback automático a JavaScript
 */

import { useState, useEffect, useCallback } from 'react';
import {
  initFinancialWasm,
  getWasmStatus,
  calculateZScoreOriginal,
  calculateZScorePrivate,
  calculateZScoreServices,
  calculateZmijewskiScore,
  runMonteCarloSimulation,
  calculateDCF,
  calculateAllRatios,
  calculateProbabilityOfDefault,
  calculateECL,
  benchmarkCalculations,
  isWasmSupported
} from '@/lib/wasm';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from '@/hooks/core';

interface UseWebAssemblyResult {
  // Status
  isSupported: boolean;
  isInitialized: boolean;
  isUsingWasm: boolean;
  
  // Financial calculations
  calculations: {
    zScoreOriginal: typeof calculateZScoreOriginal;
    zScorePrivate: typeof calculateZScorePrivate;
    zScoreServices: typeof calculateZScoreServices;
    zmijewskiScore: typeof calculateZmijewskiScore;
    monteCarloSimulation: typeof runMonteCarloSimulation;
    dcf: typeof calculateDCF;
    allRatios: typeof calculateAllRatios;
    probabilityOfDefault: typeof calculateProbabilityOfDefault;
    ecl: typeof calculateECL;
  };
  
  // Utilities
  benchmark: () => Promise<{ jsTime: number; wasmTime: number; speedup: number }>;
  reinitialize: () => Promise<void>;
  // === KB 2.0 STATE ===
  status: KBStatus;
  error: KBError | null;
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  lastRefresh: Date | null;
  lastSuccess: Date | null;
  retryCount: number;
  clearError: () => void;
}

export function useWebAssembly(): UseWebAssemblyResult {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isUsingWasm, setIsUsingWasm] = useState(false);
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED STATES ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // === KB 2.0 CLEAR ERROR ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const initialize = useCallback(async () => {
    const startTime = Date.now();
    setStatus('loading');
    setError(null);
    
    try {
      await initFinancialWasm();
      const wasmStatus = getWasmStatus();
      
      setIsInitialized(wasmStatus.initialized);
      setIsUsingWasm(wasmStatus.active);
      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setRetryCount(0);
      collectTelemetry('useWebAssembly', 'initialize', 'success', Date.now() - startTime);
    } catch (err) {
      const kbError = createKBError('WASM_INIT_ERROR', parseError(err), { originalError: String(err) });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useWebAssembly', 'initialize', 'error', Date.now() - startTime, kbError);
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const benchmark = useCallback(async () => {
    return benchmarkCalculations(10000);
  }, []);

  return {
    isSupported: isWasmSupported(),
    isInitialized,
    isUsingWasm,
    
    calculations: {
      zScoreOriginal: calculateZScoreOriginal,
      zScorePrivate: calculateZScorePrivate,
      zScoreServices: calculateZScoreServices,
      zmijewskiScore: calculateZmijewskiScore,
      monteCarloSimulation: runMonteCarloSimulation,
      dcf: calculateDCF,
      allRatios: calculateAllRatios,
      probabilityOfDefault: calculateProbabilityOfDefault,
      ecl: calculateECL
    },
    
    benchmark,
    reinitialize: initialize,
    // === KB 2.0 STATE ===
    status,
    error,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
  };
}

/**
 * useFinancialCalculation - Hook simplificado para cálculos específicos
 */
export function useFinancialCalculation<T, R>(
  calculationFn: (input: T) => R,
  input: T | null,
  dependencies: any[] = []
): {
  result: R | null;
  isCalculating: boolean;
  error: Error | null;
  recalculate: () => void;
} {
  const [result, setResult] = useState<R | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const calculate = useCallback(() => {
    if (input === null) {
      setResult(null);
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      // Use requestIdleCallback for non-blocking calculation
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          try {
            const calcResult = calculationFn(input);
            setResult(calcResult);
          } catch (err) {
            setError(err instanceof Error ? err : new Error('Calculation failed'));
          } finally {
            setIsCalculating(false);
          }
        }, { timeout: 1000 });
      } else {
        const calcResult = calculationFn(input);
        setResult(calcResult);
        setIsCalculating(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Calculation failed'));
      setIsCalculating(false);
    }
  }, [calculationFn, input, ...dependencies]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  return {
    result,
    isCalculating,
    error,
    recalculate: calculate
  };
}

/**
 * useBatchCalculations - Para múltiples cálculos en paralelo
 */
export function useBatchCalculations<T, R>(
  calculationFn: (input: T) => R,
  inputs: T[]
): {
  results: R[];
  isCalculating: boolean;
  progress: number;
  error: Error | null;
} {
  const [results, setResults] = useState<R[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (inputs.length === 0) {
      setResults([]);
      setProgress(100);
      return;
    }

    setIsCalculating(true);
    setError(null);
    setProgress(0);

    const calculateBatch = async () => {
      const batchResults: R[] = [];
      const batchSize = 100;

      try {
        for (let i = 0; i < inputs.length; i += batchSize) {
          const batch = inputs.slice(i, i + batchSize);
          
          // Process batch
          const batchResult = batch.map(input => calculationFn(input));
          batchResults.push(...batchResult);
          
          // Update progress
          setProgress(Math.round((batchResults.length / inputs.length) * 100));
          
          // Yield to main thread
          await new Promise(resolve => setTimeout(resolve, 0));
        }

        setResults(batchResults);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Batch calculation failed'));
      } finally {
        setIsCalculating(false);
        setProgress(100);
      }
    };

    calculateBatch();
  }, [calculationFn, inputs]);

  return { results, isCalculating, progress, error };
}
