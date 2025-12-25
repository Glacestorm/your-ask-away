import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface ComplianceCheck {
  id: string;
  regulation: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  evidence?: string;
  last_checked: string;
  next_review: string;
  risk_level: 'high' | 'medium' | 'low';
}

export interface ComplianceReport {
  id: string;
  regulation: string;
  overall_score: number;
  checks: ComplianceCheck[];
  gaps: Array<{ requirement: string; recommendation: string }>;
  generated_at: string;
}

export interface ComplianceAlert {
  id: string;
  type: 'deadline' | 'violation' | 'change' | 'audit';
  title: string;
  description: string;
  regulation: string;
  due_date?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface RegulationSummary {
  regulation: string;
  compliance_score: number;
  checks_total: number;
  checks_passed: number;
  last_audit: string;
}

// === HOOK ===
export function useComplianceIA() {
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [summary, setSummary] = useState<RegulationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === RUN COMPLIANCE CHECK ===
  const runComplianceCheck = useCallback(async (regulation: string): Promise<ComplianceReport | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('compliance-ia', {
        body: { action: 'run_check', regulation }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.report) {
        setReports(prev => [data.report, ...prev]);
        toast.success('Verificación completada');
        return data.report;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error running compliance check';
      setError(message);
      console.error('[useComplianceIA] runComplianceCheck error:', err);
      toast.error('Error en verificación');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET COMPLIANCE SUMMARY ===
  const fetchSummary = useCallback(async (): Promise<RegulationSummary[]> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('compliance-ia', {
        body: { action: 'get_summary' }
      });

      if (fnError) throw fnError;

      if (data?.summary) {
        setSummary(data.summary);
        return data.summary;
      }

      return [];
    } catch (err) {
      console.error('[useComplianceIA] fetchSummary error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET ALERTS ===
  const fetchAlerts = useCallback(async (): Promise<ComplianceAlert[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('compliance-ia', {
        body: { action: 'get_alerts' }
      });

      if (fnError) throw fnError;

      if (data?.alerts) {
        setAlerts(data.alerts);
        return data.alerts;
      }

      return [];
    } catch (err) {
      console.error('[useComplianceIA] fetchAlerts error:', err);
      return [];
    }
  }, []);

  // === ANALYZE DOCUMENT FOR COMPLIANCE ===
  const analyzeDocument = useCallback(async (
    documentContent: string,
    regulation: string
  ): Promise<{
    findings: Array<{ issue: string; severity: string; recommendation: string }>;
    score: number;
  } | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('compliance-ia', {
        body: { action: 'analyze_document', documentContent, regulation }
      });

      if (fnError) throw fnError;

      return data?.analysis || null;
    } catch (err) {
      console.error('[useComplianceIA] analyzeDocument error:', err);
      toast.error('Error al analizar documento');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GENERATE REMEDIATION PLAN ===
  const generateRemediationPlan = useCallback(async (checkIds: string[]): Promise<{
    steps: Array<{ order: number; action: string; responsible: string; deadline: string }>;
    estimated_time: string;
    resources_needed: string[];
  } | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('compliance-ia', {
        body: { action: 'generate_remediation', checkIds }
      });

      if (fnError) throw fnError;

      if (data?.plan) {
        toast.success('Plan de remediación generado');
        return data.plan;
      }

      return null;
    } catch (err) {
      console.error('[useComplianceIA] generateRemediationPlan error:', err);
      return null;
    }
  }, []);

  // === UPDATE CHECK STATUS ===
  const updateCheckStatus = useCallback(async (
    checkId: string,
    status: ComplianceCheck['status'],
    evidence?: string
  ): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('compliance-ia', {
        body: { action: 'update_check', checkId, status, evidence }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setChecks(prev => prev.map(c => c.id === checkId ? { ...c, status, evidence } : c));
        toast.success('Estado actualizado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useComplianceIA] updateCheckStatus error:', err);
      return false;
    }
  }, []);

  // === GET STATUS COLOR ===
  const getStatusColor = useCallback((status: string): string => {
    const colors: Record<string, string> = {
      compliant: 'text-green-500',
      non_compliant: 'text-red-500',
      partial: 'text-yellow-500',
      not_applicable: 'text-muted-foreground'
    };
    return colors[status] || 'text-muted-foreground';
  }, []);

  // === GET SEVERITY COLOR ===
  const getSeverityColor = useCallback((severity: string): string => {
    const colors: Record<string, string> = {
      critical: 'text-red-600',
      high: 'text-red-500',
      medium: 'text-yellow-500',
      low: 'text-green-500'
    };
    return colors[severity] || 'text-muted-foreground';
  }, []);

  return {
    checks,
    reports,
    alerts,
    summary,
    isLoading,
    error,
    runComplianceCheck,
    fetchSummary,
    fetchAlerts,
    analyzeDocument,
    generateRemediationPlan,
    updateCheckStatus,
    getStatusColor,
    getSeverityColor,
  };
}

export default useComplianceIA;
