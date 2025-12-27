import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface TestCase {
  id: string;
  name: string;
  description: string;
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration_ms?: number;
  error_message?: string;
  assertions: number;
  assertions_passed: number;
  created_at: string;
}

export interface TestSuite {
  id: string;
  name: string;
  module_key: string;
  test_cases: TestCase[];
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  skipped_tests: number;
  coverage_percentage: number;
  last_run_at?: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

export interface CoverageReport {
  module_key: string;
  lines_total: number;
  lines_covered: number;
  lines_percentage: number;
  branches_total: number;
  branches_covered: number;
  branches_percentage: number;
  functions_total: number;
  functions_covered: number;
  functions_percentage: number;
  uncovered_lines: number[];
  files: Array<{
    path: string;
    coverage: number;
    lines: number;
    covered: number;
  }>;
}

export interface ValidationResult {
  id: string;
  module_key: string;
  validation_type: 'schema' | 'dependency' | 'compatibility' | 'performance';
  status: 'valid' | 'warning' | 'invalid';
  message: string;
  details?: Record<string, unknown>;
  validated_at: string;
}

export interface TestRunHistory {
  id: string;
  suite_id: string;
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  total_tests: number;
  passed: number;
  failed: number;
  duration_ms: number;
  triggered_by: string;
}

// === HOOK ===
export function useModuleTestingFramework() {
  const [isLoading, setIsLoading] = useState(false);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [activeTestRun, setActiveTestRun] = useState<TestSuite | null>(null);
  const [coverageReport, setCoverageReport] = useState<CoverageReport | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [testHistory, setTestHistory] = useState<TestRunHistory[]>([]);
  const [error, setError] = useState<string | null>(null);

  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH TEST SUITES ===
  const fetchTestSuites = useCallback(async (moduleKey?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-testing-framework',
        {
          body: {
            action: 'get_test_suites',
            moduleKey
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.suites) {
        setTestSuites(data.suites);
        return data.suites;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useModuleTestingFramework] fetchTestSuites error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === RUN TESTS ===
  const runTests = useCallback(async (
    moduleKey: string,
    testType?: 'unit' | 'integration' | 'e2e' | 'all'
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-testing-framework',
        {
          body: {
            action: 'run_tests',
            moduleKey,
            testType: testType || 'all'
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.testRun) {
        setActiveTestRun(data.testRun);
        toast.success('Tests ejecutándose');
        return data.testRun;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error al ejecutar tests');
      console.error('[useModuleTestingFramework] runTests error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET COVERAGE ===
  const getCoverage = useCallback(async (moduleKey: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-testing-framework',
        {
          body: {
            action: 'get_coverage',
            moduleKey
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.coverage) {
        setCoverageReport(data.coverage);
        return data.coverage;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useModuleTestingFramework] getCoverage error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === VALIDATE MODULE ===
  const validateModule = useCallback(async (moduleKey: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-testing-framework',
        {
          body: {
            action: 'validate_module',
            moduleKey
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.validations) {
        setValidationResults(data.validations);
        toast.success('Validación completada');
        return data.validations;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error en validación');
      console.error('[useModuleTestingFramework] validateModule error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET TEST HISTORY ===
  const getTestHistory = useCallback(async (moduleKey: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-testing-framework',
        {
          body: {
            action: 'get_test_history',
            moduleKey
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.history) {
        setTestHistory(data.history);
        return data.history;
      }

      return null;
    } catch (err) {
      console.error('[useModuleTestingFramework] getTestHistory error:', err);
      return null;
    }
  }, []);

  // === CANCEL TEST RUN ===
  const cancelTestRun = useCallback(async (runId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-testing-framework',
        {
          body: {
            action: 'cancel_test_run',
            runId
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setActiveTestRun(null);
        toast.info('Ejecución de tests cancelada');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useModuleTestingFramework] cancelTestRun error:', err);
      toast.error('Error al cancelar');
      return false;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((moduleKey: string, intervalMs = 30000) => {
    stopAutoRefresh();
    fetchTestSuites(moduleKey);
    autoRefreshInterval.current = setInterval(() => {
      fetchTestSuites(moduleKey);
    }, intervalMs);
  }, [fetchTestSuites]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    isLoading,
    testSuites,
    activeTestRun,
    coverageReport,
    validationResults,
    testHistory,
    error,
    fetchTestSuites,
    runTests,
    getCoverage,
    validateModule,
    getTestHistory,
    cancelTestRun,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useModuleTestingFramework;
