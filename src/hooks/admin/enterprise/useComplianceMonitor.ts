/**
 * useComplianceMonitor Hook
 * Fase 11 - Enterprise SaaS 2025-2026
 * Monitor de cumplimiento normativo con IA
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface ComplianceItem {
  id: string;
  framework: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'in_progress' | 'not_applicable';
  evidence_count: number;
  last_audit: string;
  next_review: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  owner: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  total_requirements: number;
  compliant_count: number;
  in_progress_count: number;
  non_compliant_count: number;
  compliance_percentage: number;
}

export interface ComplianceContext {
  organizationId?: string;
  frameworks?: string[];
  dateRange?: { start: string; end: string };
}

export interface ComplianceAnalysis {
  overallScore: number;
  riskAreas: Array<{
    area: string;
    severity: string;
    recommendation: string;
  }>;
  upcomingDeadlines: Array<{
    requirement: string;
    deadline: string;
    daysRemaining: number;
  }>;
  recommendations: string[];
}

// === HOOK ===
export function useComplianceMonitor() {
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [analysis, setAnalysis] = useState<ComplianceAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH COMPLIANCE DATA ===
  const fetchComplianceData = useCallback(async (context?: ComplianceContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'compliance-monitor',
        {
          body: {
            action: 'get_compliance_status',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setItems(fnData.data?.items || []);
        setFrameworks(fnData.data?.frameworks || []);
        setAnalysis(fnData.data?.analysis || null);
        setLastRefresh(new Date());
        return fnData.data;
      }

      throw new Error('Invalid response from compliance monitor');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useComplianceMonitor] fetchComplianceData error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === RUN COMPLIANCE AUDIT ===
  const runAudit = useCallback(async (frameworkId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'compliance-monitor',
        {
          body: {
            action: 'run_audit',
            params: { frameworkId }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Auditoría iniciada correctamente');
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useComplianceMonitor] runAudit error:', err);
      toast.error('Error al iniciar auditoría');
      return null;
    }
  }, []);

  // === UPDATE COMPLIANCE ITEM ===
  const updateComplianceItem = useCallback(async (
    itemId: string, 
    updates: Partial<ComplianceItem>
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'compliance-monitor',
        {
          body: {
            action: 'update_item',
            params: { itemId, updates }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, ...updates } : item
        ));
        toast.success('Requisito actualizado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useComplianceMonitor] updateComplianceItem error:', err);
      toast.error('Error al actualizar requisito');
      return false;
    }
  }, []);

  // === GENERATE COMPLIANCE REPORT ===
  const generateReport = useCallback(async (frameworkId?: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'compliance-monitor',
        {
          body: {
            action: 'generate_report',
            params: { frameworkId }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Reporte generado');
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useComplianceMonitor] generateReport error:', err);
      toast.error('Error al generar reporte');
      return null;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: ComplianceContext, intervalMs = 120000) => {
    stopAutoRefresh();
    fetchComplianceData(context);
    autoRefreshInterval.current = setInterval(() => {
      fetchComplianceData(context);
    }, intervalMs);
  }, [fetchComplianceData]);

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

  return {
    isLoading,
    items,
    frameworks,
    analysis,
    error,
    lastRefresh,
    fetchComplianceData,
    runAudit,
    updateComplianceItem,
    generateReport,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useComplianceMonitor;
