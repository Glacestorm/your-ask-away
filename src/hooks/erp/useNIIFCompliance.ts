/**
 * Hook: useNIIFCompliance
 * Motor de Cumplimiento NIIF/NIC para ERP Contable
 * Fase 1 del Plan Estratosférico
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface AccountingFramework {
  id: string;
  framework_code: string;
  framework_name: string;
  description?: string;
  version?: string;
  effective_date?: string;
  country_codes: string[];
  is_active: boolean;
  metadata?: Record<string, unknown>;
}

export interface AccountMapping {
  id: string;
  source_framework_id: string;
  target_framework_id: string;
  source_account_code: string;
  source_account_name?: string;
  target_account_code: string;
  target_account_name?: string;
  mapping_type: 'direct' | 'split' | 'aggregate' | 'custom';
  mapping_rules?: Record<string, unknown>;
  conversion_formula?: string;
  notes?: string;
  is_verified: boolean;
}

export interface ComplianceRule {
  id: string;
  framework_id: string;
  rule_code: string;
  rule_name: string;
  standard_reference?: string;
  description?: string;
  rule_type: 'validation' | 'disclosure' | 'measurement' | 'presentation';
  severity: 'info' | 'warning' | 'error' | 'critical';
  validation_logic?: Record<string, unknown>;
  error_message?: string;
  remediation_guidance?: string;
  applies_to: string[];
  is_active: boolean;
}

export interface ComplianceValidation {
  isValid: boolean;
  complianceScore: number;
  standardsApplied: string[];
  issues: Array<{
    severity: 'error' | 'warning' | 'info';
    standard: string;
    description: string;
    remediation: string;
  }>;
  recommendations: string[];
  pgcMapping?: {
    originalAccount: string;
    suggestedNIIF: string;
  };
}

export interface FrameworkReport {
  id: string;
  report_type: string;
  source_framework_id: string;
  target_framework_id: string;
  period_start: string;
  period_end: string;
  report_data: Record<string, unknown>;
  adjustments?: unknown[];
  reconciliation_notes?: string;
  compliance_status: 'pending' | 'compliant' | 'non_compliant' | 'review_required';
  compliance_issues?: unknown[];
}

export interface NIIFContext {
  framework: 'PGC_2007' | 'PGC_PYMES' | 'NIIF_FULL' | 'NIIF_PYMES' | 'US_GAAP';
  targetFramework?: string;
  periodStart?: string;
  periodEnd?: string;
  companyId?: string;
}

// === HOOK ===
export function useNIIFCompliance() {
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [frameworks, setFrameworks] = useState<AccountingFramework[]>([]);
  const [mappings, setMappings] = useState<AccountMapping[]>([]);
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [currentValidation, setCurrentValidation] = useState<ComplianceValidation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Refs
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH FRAMEWORKS ===
  const fetchFrameworks = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('accounting_frameworks')
        .select('*')
        .eq('is_active', true)
        .order('framework_code');

      if (fetchError) throw fetchError;
      setFrameworks((data || []) as AccountingFramework[]);
      return data;
    } catch (err) {
      console.error('[useNIIFCompliance] fetchFrameworks error:', err);
      return null;
    }
  }, []);

  // === FETCH MAPPINGS ===
  const fetchMappings = useCallback(async (sourceFrameworkId?: string, targetFrameworkId?: string) => {
    try {
      let query = supabase
        .from('account_mappings')
        .select('*');

      if (sourceFrameworkId) {
        query = query.eq('source_framework_id', sourceFrameworkId);
      }
      if (targetFrameworkId) {
        query = query.eq('target_framework_id', targetFrameworkId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setMappings((data || []) as AccountMapping[]);
      return data;
    } catch (err) {
      console.error('[useNIIFCompliance] fetchMappings error:', err);
      return null;
    }
  }, []);

  // === FETCH RULES ===
  const fetchRules = useCallback(async (frameworkId?: string) => {
    try {
      let query = supabase
        .from('compliance_rules')
        .select('*')
        .eq('is_active', true);

      if (frameworkId) {
        query = query.eq('framework_id', frameworkId);
      }

      const { data, error: fetchError } = await query.order('severity');

      if (fetchError) throw fetchError;
      setRules((data || []) as ComplianceRule[]);
      return data;
    } catch (err) {
      console.error('[useNIIFCompliance] fetchRules error:', err);
      return null;
    }
  }, []);

  // === VALIDATE ENTRY ===
  const validateEntry = useCallback(async (
    entry: Record<string, unknown>,
    context?: NIIFContext
  ): Promise<ComplianceValidation | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-niif-engine',
        {
          body: {
            action: 'validate_entry',
            params: entry,
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        const validation = data.data as ComplianceValidation;
        setCurrentValidation(validation);
        setLastRefresh(new Date());
        
        // Show toast based on result
        if (validation.isValid) {
          toast.success(`Validación NIIF: ${validation.complianceScore}% de cumplimiento`);
        } else {
          toast.warning(`Validación NIIF: ${validation.issues.length} problemas encontrados`);
        }
        
        return validation;
      }

      throw new Error('Invalid response from NIIF engine');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de validación NIIF';
      setError(message);
      toast.error(message);
      console.error('[useNIIFCompliance] validateEntry error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === MAP ACCOUNTS ===
  const mapAccounts = useCallback(async (
    accounts: Array<{ code: string; name: string; balance?: number }>,
    sourceFramework: string,
    targetFramework: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-niif-engine',
        {
          body: {
            action: 'map_accounts',
            params: {
              accounts,
              sourceFramework,
              targetFramework
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setLastRefresh(new Date());
        toast.success('Mapeo de cuentas completado');
        return data.data;
      }

      throw new Error('Invalid response from NIIF engine');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en mapeo de cuentas';
      setError(message);
      toast.error(message);
      console.error('[useNIIFCompliance] mapAccounts error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === ANALYZE COMPLIANCE ===
  const analyzeCompliance = useCallback(async (
    data: Record<string, unknown>,
    context?: NIIFContext
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke(
        'obelixia-niif-engine',
        {
          body: {
            action: 'analyze_compliance',
            context: data,
            params: {
              period: context?.periodStart ? `${context.periodStart} - ${context.periodEnd}` : 'actual',
              framework: context?.framework || 'NIIF_FULL'
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (result?.success && result?.data) {
        setLastRefresh(new Date());
        
        const riskLevel = result.data.riskLevel;
        if (riskLevel === 'critical' || riskLevel === 'high') {
          toast.error(`Cumplimiento: ${result.data.overallCompliance}% - Riesgo ${riskLevel}`);
        } else if (riskLevel === 'medium') {
          toast.warning(`Cumplimiento: ${result.data.overallCompliance}% - Riesgo ${riskLevel}`);
        } else {
          toast.success(`Cumplimiento: ${result.data.overallCompliance}% - Riesgo ${riskLevel}`);
        }
        
        return result.data;
      }

      throw new Error('Invalid response from NIIF engine');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en análisis de cumplimiento';
      setError(message);
      toast.error(message);
      console.error('[useNIIFCompliance] analyzeCompliance error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GENERATE REPORT ===
  const generateReport = useCallback(async (
    reportType: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'notes',
    data: Record<string, unknown>,
    context?: NIIFContext
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke(
        'obelixia-niif-engine',
        {
          body: {
            action: 'generate_report',
            context: data,
            params: {
              reportType,
              framework: context?.targetFramework || context?.framework || 'NIIF_FULL',
              periodStart: context?.periodStart,
              periodEnd: context?.periodEnd
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (result?.success && result?.data) {
        setLastRefresh(new Date());
        toast.success(`Informe ${reportType} generado correctamente`);
        return result.data;
      }

      throw new Error('Invalid response from NIIF engine');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generando informe';
      setError(message);
      toast.error(message);
      console.error('[useNIIFCompliance] generateReport error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET STANDARDS INFO ===
  const getStandardsInfo = useCallback(async (topic: string, includeDetails = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke(
        'obelixia-niif-engine',
        {
          body: {
            action: 'get_standards',
            params: { topic, includeDetails }
          }
        }
      );

      if (fnError) throw fnError;

      if (result?.success && result?.data) {
        return result.data;
      }

      throw new Error('Invalid response from NIIF engine');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error obteniendo información normativa';
      setError(message);
      console.error('[useNIIFCompliance] getStandardsInfo error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === SAVE REPORT ===
  const saveReport = useCallback(async (report: Omit<FrameworkReport, 'id'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('framework_reports')
        .insert([report as any])
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('Informe guardado correctamente');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error guardando informe';
      toast.error(message);
      console.error('[useNIIFCompliance] saveReport error:', err);
      return null;
    }
  }, []);

  // === INITIAL FETCH ===
  useEffect(() => {
    fetchFrameworks();
  }, [fetchFrameworks]);

  // === CLEANUP ===
  useEffect(() => {
    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, []);

  // === RETURN ===
  return {
    // Estado
    isLoading,
    frameworks,
    mappings,
    rules,
    currentValidation,
    error,
    lastRefresh,
    
    // Fetch data
    fetchFrameworks,
    fetchMappings,
    fetchRules,
    
    // NIIF Engine actions
    validateEntry,
    mapAccounts,
    analyzeCompliance,
    generateReport,
    getStandardsInfo,
    saveReport,
  };
}

export default useNIIFCompliance;
