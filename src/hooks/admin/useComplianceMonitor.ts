/**
 * Hook: useComplianceMonitor
 * Sistema de Compliance Automático con IA Predictiva
 * Fase 11 - Enterprise SaaS 2025-2026 - KB 2.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from '@/hooks/core';

// === ERROR TIPADO KB 2.0 ===
export type ComplianceMonitorError = KBError;

// === INTERFACES ===
export interface ComplianceRule {
  id: string;
  code: string;
  name: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'compliant' | 'non_compliant' | 'warning' | 'pending';
  lastCheck: string;
  nextCheck: string;
  automatedFix: boolean;
}

export interface ComplianceViolation {
  id: string;
  ruleId: string;
  ruleName: string;
  description: string;
  detectedAt: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  suggestedAction: string;
  autoResolvable: boolean;
}

export interface ComplianceMetrics {
  overallScore: number;
  trend: 'improving' | 'stable' | 'declining';
  totalRules: number;
  compliantRules: number;
  violations: number;
  criticalViolations: number;
  lastFullScan: string;
  predictedRisks: PredictedRisk[];
}

export interface PredictedRisk {
  id: string;
  ruleCode: string;
  ruleName: string;
  probability: number;
  expectedDate: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  preventiveAction: string;
}

export interface ComplianceContext {
  sector: string;
  organizationId?: string;
  regulationCodes?: string[];
  scanDepth?: 'quick' | 'standard' | 'deep';
}

// === HOOK ===
export function useComplianceMonitor() {
  // Estado
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [predictedRisks, setPredictedRisks] = useState<PredictedRisk[]>([]);
  
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
  }, []);

  // Refs para auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === GET COMPLIANCE STATUS ===
  const getComplianceStatus = useCallback(async (context: ComplianceContext) => {
    const startTime = Date.now();
    setStatus('loading');
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'compliance-monitor',
        {
          body: {
            action: 'get_status',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setMetrics(fnData.data.metrics);
        setRules(fnData.data.rules || []);
        setViolations(fnData.data.violations || []);
        setPredictedRisks(fnData.data.predictedRisks || []);
        setStatus('success');
        setLastRefresh(new Date());
        setLastSuccess(new Date());
        setRetryCount(0);
        collectTelemetry('useComplianceMonitor', 'getComplianceStatus', 'success', Date.now() - startTime);
        return fnData.data;
      }

      throw new Error(fnData?.error || 'Error al obtener estado de compliance');
    } catch (err) {
      const parsedErr = parseError(err);
      const kbError = createKBError('COMPLIANCE_STATUS_ERROR', parsedErr.message, { originalError: String(err) });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useComplianceMonitor', 'getComplianceStatus', 'error', Date.now() - startTime, kbError);
      console.error('[useComplianceMonitor] getComplianceStatus error:', err);
      return null;
    }
  }, []);

  // === RUN COMPLIANCE SCAN ===
  const runComplianceScan = useCallback(async (context: ComplianceContext) => {
    const startTime = Date.now();
    setStatus('loading');
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'compliance-monitor',
        {
          body: {
            action: 'run_scan',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Escaneo de compliance completado');
        setMetrics(fnData.data.metrics);
        setViolations(fnData.data.violations || []);
        setStatus('success');
        setLastRefresh(new Date());
        setLastSuccess(new Date());
        setRetryCount(0);
        collectTelemetry('useComplianceMonitor', 'runComplianceScan', 'success', Date.now() - startTime);
        return fnData.data;
      }

      throw new Error(fnData?.error || 'Error en escaneo de compliance');
    } catch (err) {
      const parsedErr = parseError(err);
      const kbError = createKBError('COMPLIANCE_SCAN_ERROR', parsedErr.message, { originalError: String(err) });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useComplianceMonitor', 'runComplianceScan', 'error', Date.now() - startTime, kbError);
      toast.error('Error en escaneo de compliance');
      console.error('[useComplianceMonitor] runComplianceScan error:', err);
      return null;
    }
  }, []);

  // === PREDICT RISKS ===
  const predictRisks = useCallback(async (context: ComplianceContext) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'compliance-monitor',
        {
          body: {
            action: 'predict_risks',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data?.predictions) {
        setPredictedRisks(fnData.data.predictions);
        return fnData.data.predictions;
      }

      return [];
    } catch (err) {
      console.error('[useComplianceMonitor] predictRisks error:', err);
      return [];
    }
  }, []);

  // === RESOLVE VIOLATION ===
  const resolveViolation = useCallback(async (
    violationId: string,
    resolution: { action: string; notes?: string; autoApply?: boolean }
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'compliance-monitor',
        {
          body: {
            action: 'resolve_violation',
            params: { violationId, ...resolution }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setViolations(prev => prev.map(v => 
          v.id === violationId ? { ...v, status: 'resolved' as const } : v
        ));
        toast.success('Violación resuelta correctamente');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useComplianceMonitor] resolveViolation error:', err);
      toast.error('Error al resolver violación');
      return false;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: ComplianceContext, intervalMs = 120000) => {
    stopAutoRefresh();
    getComplianceStatus(context);
    autoRefreshInterval.current = setInterval(() => {
      getComplianceStatus(context);
    }, intervalMs);
  }, [getComplianceStatus]);

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
    metrics,
    rules,
    violations,
    predictedRisks,
    // Acciones
    getComplianceStatus,
    runComplianceScan,
    predictRisks,
    resolveViolation,
    startAutoRefresh,
    stopAutoRefresh,
    // === KB 2.0 STATE ===
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
  };
}

export default useComplianceMonitor;
