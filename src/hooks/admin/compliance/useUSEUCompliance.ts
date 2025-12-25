import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface SOC2Config {
  enabled: boolean;
  lastAuditDate: string;
  nextAuditDate: string;
  trustServiceCriteria: string[];
  controlsImplemented: number;
  controlsTotal: number;
  auditorName: string;
}

export interface HIPAAConfig {
  enabled: boolean;
  coveredEntity: boolean;
  businessAssociate: boolean;
  privacyOfficer: string;
  securityOfficer: string;
  riskAssessmentDate: string;
  baaTemplateEnabled: boolean;
}

export interface SOXConfig {
  enabled: boolean;
  fiscalYearEnd: string;
  controlsDocumented: number;
  controlsTested: number;
  materialWeaknesses: number;
  significantDeficiencies: number;
}

export interface StateTaxConfig {
  enabled: boolean;
  nexusStates: string[];
  taxRates: Record<string, number>;
  autoCalculation: boolean;
  filingFrequency: Record<string, string>;
}

export interface GDPRConfig {
  enabled: boolean;
  dpoName: string;
  dpoEmail: string;
  dataProcessingAgreements: number;
  consentManagement: boolean;
  dsarAutomation: boolean;
  cookieConsent: boolean;
  dataRetentionDays: number;
}

export interface DORAConfig {
  enabled: boolean;
  ictRiskManagement: boolean;
  incidentReporting: boolean;
  digitalResilienceTesting: boolean;
  thirdPartyRiskManagement: boolean;
  informationSharing: boolean;
}

export interface PSD3Config {
  enabled: boolean;
  strongCustomerAuth: boolean;
  openBankingApi: boolean;
  fraudDetection: boolean;
  transactionMonitoring: boolean;
}

export interface AIActConfig {
  enabled: boolean;
  riskClassification: 'minimal' | 'limited' | 'high' | 'unacceptable';
  humanOversight: boolean;
  transparencyMeasures: boolean;
  technicalDocumentation: boolean;
  conformityAssessment: boolean;
}

export interface SEPAConfig {
  enabled: boolean;
  iban: string;
  bic: string;
  directDebitEnabled: boolean;
  instantPaymentsEnabled: boolean;
  mandateManagement: boolean;
}

export interface USConfig {
  soc2?: SOC2Config;
  hipaa?: HIPAAConfig;
  sox?: SOXConfig;
  stateTax?: StateTaxConfig;
}

export interface EUConfig {
  gdpr?: GDPRConfig;
  dora?: DORAConfig;
  psd3?: PSD3Config;
  aiAct?: AIActConfig;
  sepa?: SEPAConfig;
}

export interface USEUComplianceConfig {
  us?: USConfig;
  eu?: EUConfig;
}

export interface ComplianceCheck {
  id: string;
  regulation: string;
  category: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  lastChecked: string;
  details: string;
  remediation?: string;
}

// === HOOK ===
export function useUSEUCompliance() {
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<USEUComplianceConfig | null>(null);
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [error, setError] = useState<string | null>(null);

  // === FETCH CONFIG ===
  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('useu-compliance', {
        body: { action: 'get_config' }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        setConfig(data.config);
        return data.config;
      }
      throw new Error(data?.error || 'Error fetching config');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useUSEUCompliance] fetchConfig:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === UPDATE CONFIG ===
  const updateConfig = useCallback(async (region: 'us' | 'eu', regulation: string, regConfig: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('useu-compliance', {
        body: { action: 'update_config', region, regulation, config: regConfig }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        toast.success(`Configuración ${regulation.toUpperCase()} actualizada`);
        await fetchConfig();
        return true;
      }
      throw new Error(data?.error || 'Error updating config');
    } catch (err) {
      console.error('[useUSEUCompliance] updateConfig:', err);
      toast.error('Error al actualizar configuración');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchConfig]);

  // === RUN COMPLIANCE CHECKS ===
  const runComplianceChecks = useCallback(async (regulations?: string[]) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('useu-compliance', {
        body: { action: 'run_checks', regulations }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        setChecks(data.checks);
        toast.success('Verificación de cumplimiento completada');
        return data.checks;
      }
      throw new Error(data?.error || 'Error running checks');
    } catch (err) {
      console.error('[useUSEUCompliance] runComplianceChecks:', err);
      toast.error('Error al ejecutar verificación');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GDPR DSAR ===
  const processDSAR = useCallback(async (requestType: 'access' | 'erasure' | 'rectification' | 'portability', userId: string) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('useu-compliance', {
        body: { action: 'process_dsar', requestType, userId }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        toast.success(`Solicitud DSAR (${requestType}) procesada`);
        return data.result;
      }
      throw new Error(data?.error || 'Error processing DSAR');
    } catch (err) {
      console.error('[useUSEUCompliance] processDSAR:', err);
      toast.error('Error al procesar DSAR');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GENERATE REPORT ===
  const generateComplianceReport = useCallback(async (regulations: string[], format: 'pdf' | 'excel') => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('useu-compliance', {
        body: { action: 'generate_report', regulations, format }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Reporte de cumplimiento generado');
        return data.reportUrl;
      }
      throw new Error(data?.error || 'Error generating report');
    } catch (err) {
      console.error('[useUSEUCompliance] generateComplianceReport:', err);
      toast.error('Error al generar reporte');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CALCULATE STATE TAX ===
  const calculateStateTax = useCallback(async (state: string, amount: number, productType: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('useu-compliance', {
        body: { action: 'calculate_state_tax', state, amount, productType }
      });

      if (fnError) throw fnError;
      return data?.tax || null;
    } catch (err) {
      console.error('[useUSEUCompliance] calculateStateTax:', err);
      return null;
    }
  }, []);

  // === AI ACT ASSESSMENT ===
  const performAIActAssessment = useCallback(async (aiSystemDescription: string) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('useu-compliance', {
        body: { action: 'ai_act_assessment', description: aiSystemDescription }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        return data.assessment;
      }
      throw new Error(data?.error || 'Error performing assessment');
    } catch (err) {
      console.error('[useUSEUCompliance] performAIActAssessment:', err);
      toast.error('Error en evaluación AI Act');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    config,
    checks,
    error,
    fetchConfig,
    updateConfig,
    runComplianceChecks,
    processDSAR,
    generateComplianceReport,
    calculateStateTax,
    performAIActAssessment,
  };
}

export default useUSEUCompliance;
