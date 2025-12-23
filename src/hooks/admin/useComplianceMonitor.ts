/**
 * Hook: useComplianceMonitor
 * Sistema de Compliance Automático con IA Predictiva
 * Fase 11 - Enterprise SaaS 2025-2026
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [predictedRisks, setPredictedRisks] = useState<PredictedRisk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Refs para auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === GET COMPLIANCE STATUS ===
  const getComplianceStatus = useCallback(async (context: ComplianceContext) => {
    setIsLoading(true);
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
        setLastRefresh(new Date());
        return fnData.data;
      }

      throw new Error(fnData?.error || 'Error al obtener estado de compliance');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useComplianceMonitor] getComplianceStatus error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === RUN COMPLIANCE SCAN ===
  const runComplianceScan = useCallback(async (context: ComplianceContext) => {
    setIsLoading(true);
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
        setLastRefresh(new Date());
        return fnData.data;
      }

      throw new Error(fnData?.error || 'Error en escaneo de compliance');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error en escaneo de compliance');
      console.error('[useComplianceMonitor] runComplianceScan error:', err);
      return null;
    } finally {
      setIsLoading(false);
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
    isLoading,
    metrics,
    rules,
    violations,
    predictedRisks,
    error,
    lastRefresh,
    // Acciones
    getComplianceStatus,
    runComplianceScan,
    predictRisks,
    resolveViolation,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useComplianceMonitor;
