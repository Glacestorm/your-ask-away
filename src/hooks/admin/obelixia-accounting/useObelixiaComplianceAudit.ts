/**
 * useObelixiaComplianceAudit
 * Fase 5: Compliance & Audit AI
 * Motor de cumplimiento normativo y auditoría automatizada
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface ComplianceRule {
  id: string;
  rule_code: string;
  rule_name: string;
  description: string;
  category: 'fiscal' | 'contable' | 'laboral' | 'rgpd' | 'blanqueo' | 'societario';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  regulation_reference: string;
  is_active: boolean;
  check_frequency: 'realtime' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  last_checked?: string;
}

export interface ComplianceCheck {
  id: string;
  rule_id: string;
  rule_code: string;
  rule_name: string;
  status: 'passed' | 'failed' | 'warning' | 'pending' | 'not_applicable';
  severity: ComplianceRule['severity'];
  category: ComplianceRule['category'];
  message: string;
  details?: string;
  affected_entities?: Array<{
    type: string;
    id: string;
    name: string;
  }>;
  recommendations?: string[];
  checked_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface AuditTrail {
  id: string;
  action_type: 'create' | 'update' | 'delete' | 'view' | 'export' | 'approve' | 'submit';
  entity_type: string;
  entity_id: string;
  entity_name?: string;
  user_id: string;
  user_name: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  risk_score?: number;
}

export interface AuditReport {
  id: string;
  report_type: 'compliance' | 'financial' | 'operational' | 'security' | 'custom';
  title: string;
  period_start: string;
  period_end: string;
  status: 'draft' | 'in_progress' | 'completed' | 'reviewed' | 'archived';
  findings: AuditFinding[];
  summary: {
    total_checks: number;
    passed: number;
    failed: number;
    warnings: number;
    compliance_score: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
  };
  generated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface AuditFinding {
  id: string;
  finding_type: 'observation' | 'non_conformity' | 'critical_issue' | 'improvement';
  title: string;
  description: string;
  evidence: string[];
  impact: string;
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
  priority: 'critical' | 'high' | 'medium' | 'low';
  due_date?: string;
  assigned_to?: string;
}

export interface RiskAssessment {
  overall_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  categories: Array<{
    category: string;
    score: number;
    issues_count: number;
    trend: 'improving' | 'stable' | 'worsening';
  }>;
  top_risks: Array<{
    title: string;
    description: string;
    probability: number;
    impact: number;
    mitigation: string;
  }>;
  recommendations: string[];
}

export interface ComplianceContext {
  fiscalConfigId?: string;
  periodStart?: string;
  periodEnd?: string;
  categories?: ComplianceRule['category'][];
}

// === HOOK ===
export function useObelixiaComplianceAudit() {
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditTrail[]>([]);
  const [currentReport, setCurrentReport] = useState<AuditReport | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Refs para auto-refresh
  const autoCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH COMPLIANCE RULES ===
  const fetchRules = useCallback(async (category?: ComplianceRule['category']) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-compliance-audit',
        {
          body: {
            action: 'get_rules',
            params: { category }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data?.rules) {
        setRules(fnData.data.rules);
        return fnData.data.rules;
      }

      // Fallback: reglas predefinidas
      const defaultRules: ComplianceRule[] = [
        {
          id: '1',
          rule_code: 'FISC-001',
          rule_name: 'Cuadre IVA Trimestral',
          description: 'Verificar que el IVA repercutido menos soportado cuadra con las declaraciones',
          category: 'fiscal',
          severity: 'critical',
          regulation_reference: 'Ley 37/1992 del IVA',
          is_active: true,
          check_frequency: 'quarterly'
        },
        {
          id: '2',
          rule_code: 'FISC-002',
          rule_name: 'Retenciones IRPF',
          description: 'Verificar aplicación correcta de tipos de retención',
          category: 'fiscal',
          severity: 'high',
          regulation_reference: 'Ley 35/2006 del IRPF',
          is_active: true,
          check_frequency: 'monthly'
        },
        {
          id: '3',
          rule_code: 'CONT-001',
          rule_name: 'Balance Cuadrado',
          description: 'Activo debe igualar Pasivo + Patrimonio Neto',
          category: 'contable',
          severity: 'critical',
          regulation_reference: 'PGC 2007',
          is_active: true,
          check_frequency: 'daily'
        },
        {
          id: '4',
          rule_code: 'CONT-002',
          rule_name: 'Asientos Balanceados',
          description: 'Debe = Haber en cada asiento contable',
          category: 'contable',
          severity: 'critical',
          regulation_reference: 'PGC 2007',
          is_active: true,
          check_frequency: 'realtime'
        },
        {
          id: '5',
          rule_code: 'BLANQ-001',
          rule_name: 'Operaciones Sospechosas',
          description: 'Detectar operaciones que superen umbrales de prevención de blanqueo',
          category: 'blanqueo',
          severity: 'critical',
          regulation_reference: 'Ley 10/2010',
          is_active: true,
          check_frequency: 'realtime'
        },
        {
          id: '6',
          rule_code: 'RGPD-001',
          rule_name: 'Consentimiento Datos',
          description: 'Verificar consentimiento para tratamiento de datos personales',
          category: 'rgpd',
          severity: 'high',
          regulation_reference: 'RGPD Art. 6',
          is_active: true,
          check_frequency: 'weekly'
        }
      ];
      
      setRules(defaultRules);
      return defaultRules;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useObelixiaComplianceAudit] fetchRules error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === RUN COMPLIANCE CHECK ===
  const runComplianceCheck = useCallback(async (context?: ComplianceContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-compliance-audit',
        {
          body: {
            action: 'run_compliance_check',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data?.checks) {
        setChecks(fnData.data.checks);
        setLastCheck(new Date());
        
        const failedCount = fnData.data.checks.filter((c: ComplianceCheck) => c.status === 'failed').length;
        if (failedCount > 0) {
          toast.warning(`Se encontraron ${failedCount} incumplimientos`);
        } else {
          toast.success('Verificación de cumplimiento completada');
        }
        
        return fnData.data.checks;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useObelixiaComplianceAudit] runComplianceCheck error:', err);
      toast.error('Error al ejecutar verificación de cumplimiento');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === RESOLVE COMPLIANCE ISSUE ===
  const resolveComplianceIssue = useCallback(async (
    checkId: string,
    resolution: string,
    resolvedBy: string
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-compliance-audit',
        {
          body: {
            action: 'resolve_issue',
            params: { checkId, resolution, resolvedBy }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setChecks(prev => prev.map(c => 
          c.id === checkId 
            ? { ...c, status: 'passed' as const, resolved_at: new Date().toISOString(), resolved_by: resolvedBy }
            : c
        ));
        toast.success('Incumplimiento marcado como resuelto');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useObelixiaComplianceAudit] resolveComplianceIssue error:', err);
      toast.error('Error al resolver incumplimiento');
      return false;
    }
  }, []);

  // === FETCH AUDIT TRAIL ===
  const fetchAuditTrail = useCallback(async (
    entityType?: string,
    entityId?: string,
    limit = 100
  ) => {
    setIsLoading(true);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-compliance-audit',
        {
          body: {
            action: 'get_audit_trail',
            params: { entityType, entityId, limit }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data?.trail) {
        setAuditTrail(fnData.data.trail);
        return fnData.data.trail;
      }

      return [];
    } catch (err) {
      console.error('[useObelixiaComplianceAudit] fetchAuditTrail error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GENERATE AUDIT REPORT ===
  const generateAuditReport = useCallback(async (
    reportType: AuditReport['report_type'],
    periodStart: string,
    periodEnd: string,
    title?: string
  ) => {
    setIsLoading(true);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-compliance-audit',
        {
          body: {
            action: 'generate_audit_report',
            params: { reportType, periodStart, periodEnd, title }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data?.report) {
        setCurrentReport(fnData.data.report);
        toast.success('Informe de auditoría generado');
        return fnData.data.report;
      }

      throw new Error('Invalid response');
    } catch (err) {
      console.error('[useObelixiaComplianceAudit] generateAuditReport error:', err);
      toast.error('Error al generar informe');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET RISK ASSESSMENT ===
  const getRiskAssessment = useCallback(async (context?: ComplianceContext) => {
    setIsLoading(true);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-compliance-audit',
        {
          body: {
            action: 'get_risk_assessment',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data?.assessment) {
        setRiskAssessment(fnData.data.assessment);
        return fnData.data.assessment;
      }

      throw new Error('Invalid response');
    } catch (err) {
      console.error('[useObelixiaComplianceAudit] getRiskAssessment error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === DETECT ANOMALIES ===
  const detectAnomalies = useCallback(async (
    transactionIds?: string[],
    threshold = 0.8
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-compliance-audit',
        {
          body: {
            action: 'detect_anomalies',
            params: { transactionIds, threshold }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data?.anomalies) {
        if (fnData.data.anomalies.length > 0) {
          toast.warning(`Detectadas ${fnData.data.anomalies.length} anomalías`);
        }
        return fnData.data.anomalies;
      }

      return [];
    } catch (err) {
      console.error('[useObelixiaComplianceAudit] detectAnomalies error:', err);
      return [];
    }
  }, []);

  // === EXPORT REPORT ===
  const exportReport = useCallback(async (
    reportId: string,
    format: 'pdf' | 'excel' | 'json' = 'pdf'
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-compliance-audit',
        {
          body: {
            action: 'export_report',
            params: { reportId, format }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data?.downloadUrl) {
        window.open(fnData.data.downloadUrl, '_blank');
        toast.success(`Informe exportado en formato ${format.toUpperCase()}`);
        return fnData.data.downloadUrl;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaComplianceAudit] exportReport error:', err);
      toast.error('Error al exportar informe');
      return null;
    }
  }, []);

  // === GET COMPLIANCE METRICS ===
  const getComplianceMetrics = useCallback(() => {
    const totalChecks = checks.length;
    const passed = checks.filter(c => c.status === 'passed').length;
    const failed = checks.filter(c => c.status === 'failed').length;
    const warnings = checks.filter(c => c.status === 'warning').length;
    const pending = checks.filter(c => c.status === 'pending').length;

    const criticalFailed = checks.filter(c => c.status === 'failed' && c.severity === 'critical').length;
    const highFailed = checks.filter(c => c.status === 'failed' && c.severity === 'high').length;

    const complianceScore = totalChecks > 0 
      ? Math.round((passed / totalChecks) * 100) 
      : 100;

    const riskLevel: 'low' | 'medium' | 'high' | 'critical' = 
      criticalFailed > 0 ? 'critical' :
      highFailed > 2 ? 'high' :
      failed > 5 ? 'medium' : 'low';

    return {
      totalChecks,
      passed,
      failed,
      warnings,
      pending,
      criticalFailed,
      highFailed,
      complianceScore,
      riskLevel,
      lastCheck
    };
  }, [checks, lastCheck]);

  // === AUTO CHECK ===
  const startAutoCheck = useCallback((context: ComplianceContext, intervalMs = 300000) => {
    stopAutoCheck();
    runComplianceCheck(context);
    autoCheckInterval.current = setInterval(() => {
      runComplianceCheck(context);
    }, intervalMs);
  }, [runComplianceCheck]);

  const stopAutoCheck = useCallback(() => {
    if (autoCheckInterval.current) {
      clearInterval(autoCheckInterval.current);
      autoCheckInterval.current = null;
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => stopAutoCheck();
  }, [stopAutoCheck]);

  // === RETURN ===
  return {
    // Estado
    isLoading,
    rules,
    checks,
    auditTrail,
    currentReport,
    riskAssessment,
    error,
    lastCheck,
    // Acciones
    fetchRules,
    runComplianceCheck,
    resolveComplianceIssue,
    fetchAuditTrail,
    generateAuditReport,
    getRiskAssessment,
    detectAnomalies,
    exportReport,
    getComplianceMetrics,
    startAutoCheck,
    stopAutoCheck,
    setCurrentReport,
  };
}

export default useObelixiaComplianceAudit;
