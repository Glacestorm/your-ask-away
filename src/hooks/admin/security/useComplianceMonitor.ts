import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  description: string;
  total_controls: number;
  compliant_controls: number;
  non_compliant_controls: number;
  not_applicable_controls: number;
  compliance_percentage: number;
  last_assessment: string;
  next_assessment: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_assessed';
}

export interface ComplianceControl {
  id: string;
  framework_id: string;
  control_id: string;
  control_name: string;
  description: string;
  category: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  evidence_required: boolean;
  evidence_status: 'complete' | 'partial' | 'missing';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  remediation_steps?: string[];
  last_reviewed: string;
  reviewer?: string;
}

export interface ComplianceReport {
  id: string;
  framework_id: string;
  report_type: 'assessment' | 'gap_analysis' | 'remediation';
  generated_at: string;
  period_start: string;
  period_end: string;
  overall_score: number;
  findings: Array<{
    control_id: string;
    finding: string;
    severity: string;
    recommendation: string;
  }>;
  executive_summary: string;
}

export function useComplianceMonitor() {
  const [isLoading, setIsLoading] = useState(false);
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [controls, setControls] = useState<ComplianceControl[]>([]);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchComplianceStatus = useCallback(async (frameworkId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'compliance-monitor',
        {
          body: {
            action: 'get_status',
            frameworkId
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setFrameworks(data.frameworks || []);
        setControls(data.controls || []);
        setLastRefresh(new Date());
        return data;
      }

      throw new Error(data?.error || 'Error fetching compliance status');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useComplianceMonitor] fetchComplianceStatus error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runAssessment = useCallback(async (frameworkId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'compliance-monitor',
        {
          body: {
            action: 'run_assessment',
            frameworkId
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Evaluación de compliance completada');
        await fetchComplianceStatus(frameworkId);
        return data.assessment;
      }

      return null;
    } catch (err) {
      console.error('[useComplianceMonitor] runAssessment error:', err);
      toast.error('Error en evaluación de compliance');
      return null;
    }
  }, [fetchComplianceStatus]);

  const generateReport = useCallback(async (
    frameworkId: string,
    reportType: 'assessment' | 'gap_analysis' | 'remediation'
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'compliance-monitor',
        {
          body: {
            action: 'generate_report',
            frameworkId,
            reportType
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Informe generado correctamente');
        return data.report;
      }

      return null;
    } catch (err) {
      console.error('[useComplianceMonitor] generateReport error:', err);
      toast.error('Error al generar informe');
      return null;
    }
  }, []);

  const updateControlStatus = useCallback(async (
    controlId: string,
    status: ComplianceControl['status'],
    evidence?: string
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'compliance-monitor',
        {
          body: {
            action: 'update_control',
            controlId,
            status,
            evidence
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Control actualizado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useComplianceMonitor] updateControlStatus error:', err);
      toast.error('Error al actualizar control');
      return false;
    }
  }, []);

  const startAutoRefresh = useCallback((intervalMs = 300000) => {
    stopAutoRefresh();
    fetchComplianceStatus();
    autoRefreshInterval.current = setInterval(() => {
      fetchComplianceStatus();
    }, intervalMs);
  }, [fetchComplianceStatus]);

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
    frameworks,
    controls,
    reports,
    error,
    lastRefresh,
    fetchComplianceStatus,
    runAssessment,
    generateReport,
    updateControlStatus,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useComplianceMonitor;
