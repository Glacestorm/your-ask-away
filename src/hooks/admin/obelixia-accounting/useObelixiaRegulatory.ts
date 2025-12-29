/**
 * useObelixiaRegulatory Hook
 * Fase 13: Regulatory Compliance & Reporting
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RegulatoryStandard {
  id: string;
  code: string;
  name: string;
  category: 'financial_instruments' | 'revenue' | 'leases' | 'consolidation' | 'tax' | 'disclosure';
  status: 'applicable' | 'pending' | 'not_applicable';
  complianceLevel: number;
  lastReview: string;
  nextReview: string;
  requirements: string[];
  gaps: string[];
}

export interface ComplianceValidation {
  overallScore: number;
  status: 'compliant' | 'partial' | 'non_compliant';
  findings: Array<{
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    standard: string;
    description: string;
    impact: string;
    recommendation: string;
    deadline: string;
  }>;
  strengths: string[];
  improvements: string[];
}

export interface RegulatoryDeadline {
  id: string;
  title: string;
  type: 'tax' | 'regulatory' | 'audit' | 'disclosure';
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'critical' | 'high' | 'medium' | 'low';
  requirements: string[];
  estimatedEffort: string;
}

export interface RegulatoryContext {
  companyId: string;
  fiscalYear?: string;
  jurisdiction?: string;
}

export function useObelixiaRegulatory() {
  const [isLoading, setIsLoading] = useState(false);
  const [standards, setStandards] = useState<RegulatoryStandard[]>([]);
  const [deadlines, setDeadlines] = useState<RegulatoryDeadline[]>([]);
  const [overallCompliance, setOverallCompliance] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchStandards = useCallback(async (context?: RegulatoryContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('obelixia-regulatory', {
        body: { action: 'get_standards', context }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setStandards(data.data.standards || []);
        setOverallCompliance(data.data.overallCompliance || 0);
        return data.data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useObelixiaRegulatory] fetchStandards error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateReport = useCallback(async (
    reportType: 'ifrs' | 'gaap' | 'local' | 'tax' | 'audit',
    period: string
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('obelixia-regulatory', {
        body: { action: 'generate_report', params: { reportType, period } }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Reporte generado correctamente');
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaRegulatory] generateReport error:', err);
      toast.error('Error al generar reporte');
      return null;
    }
  }, []);

  const validateCompliance = useCallback(async (standardId?: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('obelixia-regulatory', {
        body: { action: 'validate_compliance', params: { standardId } }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Validación completada');
        return data.data as { validation: ComplianceValidation; actionPlan: unknown[] };
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaRegulatory] validateCompliance error:', err);
      toast.error('Error en validación');
      return null;
    }
  }, []);

  const fetchDeadlines = useCallback(async (context?: RegulatoryContext) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('obelixia-regulatory', {
        body: { action: 'get_deadlines', context }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setDeadlines(data.data.deadlines || []);
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaRegulatory] fetchDeadlines error:', err);
      return null;
    }
  }, []);

  const analyzeGaps = useCallback(async (standardId?: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('obelixia-regulatory', {
        body: { action: 'analyze_gaps', params: { standardId } }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaRegulatory] analyzeGaps error:', err);
      toast.error('Error en análisis de brechas');
      return null;
    }
  }, []);

  const startAutoRefresh = useCallback((context: RegulatoryContext, intervalMs = 120000) => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
    }
    fetchStandards(context);
    fetchDeadlines(context);
    autoRefreshInterval.current = setInterval(() => {
      fetchStandards(context);
      fetchDeadlines(context);
    }, intervalMs);
  }, [fetchStandards, fetchDeadlines]);

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
    standards,
    deadlines,
    overallCompliance,
    error,
    fetchStandards,
    generateReport,
    validateCompliance,
    fetchDeadlines,
    analyzeGaps,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useObelixiaRegulatory;
