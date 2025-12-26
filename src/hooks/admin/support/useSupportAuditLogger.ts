// Support Audit Logger Hook - Phase 6A: Security and Audit System
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface AuditEntry {
  id: string;
  timestamp: string;
  entity_type: string;
  entity_id?: string;
  action_type: string;
  user_id?: string;
  severity: 'info' | 'warning' | 'critical';
  details?: Record<string, unknown>;
}

export interface SecurityAnalysis {
  security_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  threats_detected: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
  }>;
  anomalies: Array<{
    pattern: string;
    occurrences: number;
    risk_assessment: string;
  }>;
  compliance_issues: Array<{
    standard: string;
    issue: string;
    remediation: string;
  }>;
  recommendations: string[];
}

export interface AccessHistoryEntry {
  id: string;
  user_id?: string;
  access_type: string;
  timestamp: string;
  ip_address: string;
  location: string;
  device: string;
  success: boolean;
  resource?: string;
  failure_reason?: string;
}

export interface UserPermissions {
  user_id?: string;
  role: string;
  permissions: Array<{
    resource: string;
    actions: string[];
  }>;
  restrictions: Array<{
    type: string;
    rule: string;
    active: boolean;
  }>;
  last_permission_review: string;
  next_review_due: string;
}

export interface ComplianceReport {
  report_id: string;
  generated_at: string;
  period: { start: string; end: string };
  overall_compliance_score: number;
  frameworks: Array<{
    name: string;
    compliance_level: number;
    status: 'compliant' | 'partial' | 'non_compliant';
    findings: Array<{
      control_id: string;
      description: string;
      status: 'pass' | 'fail' | 'warning';
      evidence: string;
      remediation: string;
    }>;
  }>;
  executive_summary: string;
  risk_assessment: {
    high_risks: number;
    medium_risks: number;
    low_risks: number;
  };
  recommendations: string[];
}

// === HOOK ===
export function useSupportAuditLogger() {
  const [isLoading, setIsLoading] = useState(false);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [securityAnalysis, setSecurityAnalysis] = useState<SecurityAnalysis | null>(null);
  const [accessHistory, setAccessHistory] = useState<AccessHistoryEntry[]>([]);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // === LOG ACTION ===
  const logAction = useCallback(async (params: {
    entity_type: string;
    entity_id?: string;
    action_type: string;
    action_details?: Record<string, unknown>;
    severity?: 'info' | 'warning' | 'critical';
  }) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-audit-logger', {
        body: { action: 'log_action', params }
      });

      if (fnError) throw fnError;
      
      if (data?.success) {
        console.log('[AuditLogger] Action logged:', data.data);
        return data.data;
      }
      
      return null;
    } catch (err) {
      console.error('[useSupportAuditLogger] logAction error:', err);
      return null;
    }
  }, []);

  // === GET AUDIT TRAIL ===
  const getAuditTrail = useCallback(async (params?: {
    entity_type?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-audit-logger', {
        body: { action: 'get_audit_trail', params }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setAuditTrail(data.data.entries || []);
        return data.data;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching audit trail';
      setError(message);
      toast.error('Error al obtener historial de auditoría');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === ANALYZE SECURITY ===
  const analyzeSecurity = useCallback(async (params?: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-audit-logger', {
        body: { action: 'analyze_security', params }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setSecurityAnalysis(data.data);
        return data.data;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error analyzing security';
      setError(message);
      toast.error('Error al analizar seguridad');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET ACCESS HISTORY ===
  const getAccessHistory = useCallback(async (userId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-audit-logger', {
        body: { action: 'get_access_history', params: { user_id: userId } }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setAccessHistory(data.data.history || []);
        return data.data;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching access history';
      setError(message);
      toast.error('Error al obtener historial de accesos');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CHECK PERMISSIONS ===
  const checkPermissions = useCallback(async (userId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-audit-logger', {
        body: { action: 'check_permissions', params: { user_id: userId } }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setPermissions(data.data);
        return data.data;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error checking permissions';
      setError(message);
      toast.error('Error al verificar permisos');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GENERATE COMPLIANCE REPORT ===
  const generateComplianceReport = useCallback(async (params?: {
    start_date?: string;
    end_date?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-audit-logger', {
        body: { action: 'generate_compliance_report', params }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setComplianceReport(data.data);
        toast.success('Informe de compliance generado');
        return data.data;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generating compliance report';
      setError(message);
      toast.error('Error al generar informe de compliance');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CLEAR STATE ===
  const clearError = useCallback(() => setError(null), []);
  
  const reset = useCallback(() => {
    setAuditTrail([]);
    setSecurityAnalysis(null);
    setAccessHistory([]);
    setPermissions(null);
    setComplianceReport(null);
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    auditTrail,
    securityAnalysis,
    accessHistory,
    permissions,
    complianceReport,
    error,
    // Actions
    logAction,
    getAuditTrail,
    analyzeSecurity,
    getAccessHistory,
    checkPermissions,
    generateComplianceReport,
    clearError,
    reset
  };
}

export default useSupportAuditLogger;
