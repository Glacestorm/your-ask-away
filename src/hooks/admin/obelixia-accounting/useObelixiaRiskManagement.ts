/**
 * useObelixiaRiskManagement Hook
 * Fase 13: Financial Risk Management
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FinancialRisk {
  id: string;
  name: string;
  category: 'credit' | 'market' | 'liquidity' | 'operational' | 'compliance' | 'strategic';
  description: string;
  probability: 'high' | 'medium' | 'low';
  impact: 'critical' | 'high' | 'medium' | 'low';
  riskScore: number;
  status: 'active' | 'mitigated' | 'accepted' | 'transferred';
  owner: string;
  mitigations: unknown[];
  kris: KRI[];
  lastAssessment: string;
}

export interface KRI {
  id: string;
  name: string;
  category: string;
  currentValue: number;
  threshold: {
    green: number;
    yellow: number;
    red: number;
  };
  status: 'green' | 'yellow' | 'red';
  trend: 'improving' | 'stable' | 'worsening';
  trendPercentage: number;
  lastUpdated: string;
  history: unknown[];
  alerts: unknown[];
}

export interface RiskAssessment {
  riskId: string;
  assessmentDate: string;
  methodology: string;
  inherentRisk: {
    probability: number;
    impact: number;
    score: number;
    category: string;
  };
  residualRisk: {
    probability: number;
    impact: number;
    score: number;
    category: string;
  };
  controls: unknown[];
  quantification: {
    expectedLoss: number;
    worstCase: number;
    var95: number;
    var99: number;
  };
}

export interface RiskContext {
  companyId: string;
  fiscalYear?: string;
  riskCategory?: string;
}

export function useObelixiaRiskManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const [risks, setRisks] = useState<FinancialRisk[]>([]);
  const [kris, setKRIs] = useState<KRI[]>([]);
  const [overallExposure, setOverallExposure] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);
  const MAX_RETRIES = 3;
  const MAX_AUTO_REFRESH_DURATION = 3600000; // 1 hour max auto-refresh
  const autoRefreshStartTime = useRef<number | null>(null);

  const fetchRisks = useCallback(async (context?: RiskContext) => {
    // Check retry limit
    if (retryCountRef.current >= MAX_RETRIES) {
      const errorMsg = `Maximum retry limit (${MAX_RETRIES}) reached for fetchRisks`;
      setError(errorMsg);
      console.error('[useObelixiaRiskManagement] fetchRisks:', errorMsg);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('obelixia-risk-management', {
        body: { action: 'get_risks', context }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setRisks(data.data.risks || []);
        setOverallExposure(data.data.summary?.overallExposure || 0);
        retryCountRef.current = 0; // Reset on success
        return data.data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      retryCountRef.current += 1;
      console.error('[useObelixiaRiskManagement] fetchRisks error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const assessRisk = useCallback(async (riskId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('obelixia-risk-management', {
        body: { action: 'assess_risk', params: { riskId } }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Evaluación completada');
        return data.data as { assessment: RiskAssessment; recommendations: unknown[] };
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaRiskManagement] assessRisk error:', err);
      toast.error('Error en evaluación de riesgo');
      return null;
    }
  }, []);

  const createMitigation = useCallback(async (riskId: string, strategy: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('obelixia-risk-management', {
        body: { action: 'create_mitigation', params: { riskId, strategy } }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Plan de mitigación creado');
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaRiskManagement] createMitigation error:', err);
      toast.error('Error al crear plan de mitigación');
      return null;
    }
  }, []);

  const monitorKRIs = useCallback(async (context?: RiskContext) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('obelixia-risk-management', {
        body: { action: 'monitor_kris', context }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setKRIs(data.data.kris || []);
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaRiskManagement] monitorKRIs error:', err);
      return null;
    }
  }, []);

  const runStressTest = useCallback(async (scenarioType: string, severity: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('obelixia-risk-management', {
        body: { action: 'stress_test', params: { scenarioType, severity } }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Prueba de estrés completada');
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaRiskManagement] runStressTest error:', err);
      toast.error('Error en prueba de estrés');
      return null;
    }
  }, []);

  const startAutoRefresh = useCallback((context: RiskContext, intervalMs = 60000) => {
    // Stop any existing refresh
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
    }
    
    // Set start time for timeout check
    autoRefreshStartTime.current = Date.now();
    retryCountRef.current = 0; // Reset retry count on new auto-refresh
    
    // Initial fetch
    fetchRisks(context);
    monitorKRIs(context);
    
    autoRefreshInterval.current = setInterval(() => {
      // Check if max duration exceeded
      if (autoRefreshStartTime.current && 
          Date.now() - autoRefreshStartTime.current > MAX_AUTO_REFRESH_DURATION) {
        console.warn('[useObelixiaRiskManagement] Max auto-refresh duration reached, stopping');
        stopAutoRefresh();
        return;
      }
      
      // Check retry count before making calls
      if (retryCountRef.current >= MAX_RETRIES) {
        console.warn('[useObelixiaRiskManagement] Max retries reached in auto-refresh, stopping');
        stopAutoRefresh();
        return;
      }
      
      fetchRisks(context);
      monitorKRIs(context);
    }, intervalMs);
  }, [fetchRisks, monitorKRIs]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
    autoRefreshStartTime.current = null;
    retryCountRef.current = 0;
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    isLoading,
    risks,
    kris,
    overallExposure,
    error,
    fetchRisks,
    assessRisk,
    createMitigation,
    monitorKRIs,
    runStressTest,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useObelixiaRiskManagement;
