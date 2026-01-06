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
  const initializationAttempted = useRef(false);
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_INIT_RETRIES = 3;

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
    // Prevent infinite loops by checking retry count
    if (retryCount >= MAX_INIT_RETRIES) {
      console.warn(`[useWebAssembly] Max initialization retries (${MAX_INIT_RETRIES}) reached`);
      const kbError = createKBError('WASM_MAX_RETRIES', `Failed to initialize after ${MAX_INIT_RETRIES} attempts`);
      setError(kbError);
      setStatus('error');
      return;
    }

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
      const parsedErr = parseError(err);
      const kbError = createKBError('WASM_INIT_ERROR', parsedErr.message, { originalError: String(err) });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useWebAssembly', 'initialize', 'error', Date.now() - startTime, kbError);
    }
  }, [retryCount]);

  useEffect(() => {
    // Only initialize once to prevent dependency loops
    if (!initializationAttempted.current) {
      initializationAttempted.current = true;
      initialize();
    }
  }, []); // Empty dependency array - initialize only on mount

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
 * 
 * IMPORTANT: This hook intentionally does NOT include calculationFn in the dependency array
 * to prevent infinite loops. The calculationFn is typically defined inline by callers and
 * would change on every render, causing the callback to be recreated infinitely.
 * The throttling mechanism and dependencies array provide the necessary control.
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
  const lastCalculationTime = useRef<number>(0);
  const THROTTLE_MS = 100; // Minimum time between calculations

  const calculate = useCallback(() => {
    if (input === null) {
      setResult(null);
      return;
    }

    // Throttle calculations to prevent infinite loops
    const now = Date.now();
    if (now - lastCalculationTime.current < THROTTLE_MS) {
      console.debug('[useFinancialCalculation] Throttling calculation');
      return;
    }
    lastCalculationTime.current = now;

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
    // NOTE: calculationFn is intentionally excluded from deps to prevent infinite loops
    // as it's typically defined inline and changes on every render. The dependencies 
    // parameter gives callers explicit control over when to recalculate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, ...dependencies]);

  useEffect(() => {
    calculate();
    // NOTE: calculate is intentionally excluded here as it's already controlled by input
    // and dependencies. Including it would cause unnecessary re-renders. The throttling
    // mechanism provides additional protection against rapid recalculations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, ...dependencies]);

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
