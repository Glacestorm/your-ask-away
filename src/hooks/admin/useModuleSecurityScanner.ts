import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface Vulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  cwe_id?: string;
  cvss_score?: number;
  affected_file?: string;
  affected_line?: number;
  recommendation: string;
  status: 'open' | 'acknowledged' | 'fixed' | 'false_positive';
  detected_at: string;
}

export interface SecurityScan {
  id: string;
  module_key: string;
  scan_type: 'sast' | 'dast' | 'dependency' | 'secrets' | 'full';
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  vulnerabilities_found: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  security_score: number;
}

export interface ComplianceCheck {
  id: string;
  framework: string;
  control_id: string;
  control_name: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  evidence?: string;
  remediation?: string;
  last_checked: string;
}

export interface DependencyAudit {
  id: string;
  package_name: string;
  current_version: string;
  latest_version: string;
  vulnerabilities: Array<{
    id: string;
    severity: string;
    title: string;
    patched_version?: string;
  }>;
  license: string;
  is_outdated: boolean;
  risk_level: 'high' | 'medium' | 'low' | 'none';
}

export interface SecretsScan {
  id: string;
  file_path: string;
  line_number: number;
  secret_type: string;
  masked_value: string;
  severity: 'critical' | 'high';
  status: 'active' | 'revoked' | 'false_positive';
  detected_at: string;
}

// === HOOK ===
export function useModuleSecurityScanner() {
  const [isLoading, setIsLoading] = useState(false);
  const [scans, setScans] = useState<SecurityScan[]>([]);
  const [activeScan, setActiveScan] = useState<SecurityScan | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [dependencyAudit, setDependencyAudit] = useState<DependencyAudit[]>([]);
  const [secretsFindings, setSecretsFindings] = useState<SecretsScan[]>([]);
  const [error, setError] = useState<string | null>(null);

  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === START SECURITY SCAN ===
  const startSecurityScan = useCallback(async (
    moduleKey: string,
    scanType: 'sast' | 'dast' | 'dependency' | 'secrets' | 'full' = 'full'
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-security-scanner',
        {
          body: {
            action: 'start_scan',
            moduleKey,
            scanType
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.scan) {
        setActiveScan(data.scan);
        toast.success('Escaneo de seguridad iniciado');
        return data.scan;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error al iniciar escaneo');
      console.error('[useModuleSecurityScanner] startSecurityScan error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET SCAN RESULTS ===
  const getScanResults = useCallback(async (scanId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-security-scanner',
        {
          body: {
            action: 'get_scan_results',
            scanId
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        if (data.vulnerabilities) setVulnerabilities(data.vulnerabilities);
        if (data.scan) setActiveScan(data.scan);
        return data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useModuleSecurityScanner] getScanResults error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CHECK COMPLIANCE ===
  const checkCompliance = useCallback(async (
    moduleKey: string,
    framework: 'SOC2' | 'GDPR' | 'HIPAA' | 'PCI-DSS' | 'ISO27001'
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-security-scanner',
        {
          body: {
            action: 'check_compliance',
            moduleKey,
            framework
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.checks) {
        setComplianceChecks(data.checks);
        toast.success(`Verificación ${framework} completada`);
        return data.checks;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error en verificación de compliance');
      console.error('[useModuleSecurityScanner] checkCompliance error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === AUDIT DEPENDENCIES ===
  const auditDependencies = useCallback(async (moduleKey: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-security-scanner',
        {
          body: {
            action: 'audit_dependencies',
            moduleKey
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.dependencies) {
        setDependencyAudit(data.dependencies);
        toast.success('Auditoría de dependencias completada');
        return data.dependencies;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error en auditoría de dependencias');
      console.error('[useModuleSecurityScanner] auditDependencies error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === SCAN FOR SECRETS ===
  const scanForSecrets = useCallback(async (moduleKey: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-security-scanner',
        {
          body: {
            action: 'scan_secrets',
            moduleKey
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.findings) {
        setSecretsFindings(data.findings);
        const criticalCount = data.findings.filter((f: SecretsScan) => f.severity === 'critical').length;
        if (criticalCount > 0) {
          toast.error(`¡${criticalCount} secretos críticos detectados!`);
        } else {
          toast.success('Escaneo de secretos completado');
        }
        return data.findings;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error en escaneo de secretos');
      console.error('[useModuleSecurityScanner] scanForSecrets error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET SCAN HISTORY ===
  const getScanHistory = useCallback(async (moduleKey: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-security-scanner',
        {
          body: {
            action: 'get_scan_history',
            moduleKey
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.scans) {
        setScans(data.scans);
        return data.scans;
      }

      return null;
    } catch (err) {
      console.error('[useModuleSecurityScanner] getScanHistory error:', err);
      return null;
    }
  }, []);

  // === UPDATE VULNERABILITY STATUS ===
  const updateVulnerabilityStatus = useCallback(async (
    vulnId: string,
    status: 'acknowledged' | 'fixed' | 'false_positive'
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-security-scanner',
        {
          body: {
            action: 'update_vulnerability_status',
            vulnId,
            status
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setVulnerabilities(prev => 
          prev.map(v => v.id === vulnId ? { ...v, status } : v)
        );
        toast.success('Estado actualizado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useModuleSecurityScanner] updateVulnerabilityStatus error:', err);
      toast.error('Error al actualizar estado');
      return false;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((moduleKey: string, intervalMs = 60000) => {
    stopAutoRefresh();
    getScanHistory(moduleKey);
    autoRefreshInterval.current = setInterval(() => {
      getScanHistory(moduleKey);
    }, intervalMs);
  }, [getScanHistory]);

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
    scans,
    activeScan,
    vulnerabilities,
    complianceChecks,
    dependencyAudit,
    secretsFindings,
    error,
    startSecurityScan,
    getScanResults,
    checkCompliance,
    auditDependencies,
    scanForSecrets,
    getScanHistory,
    updateVulnerabilityStatus,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useModuleSecurityScanner;
