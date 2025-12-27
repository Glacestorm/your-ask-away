import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === THREAT DETECTION ===
export interface ThreatSource {
  ip: string;
  geo: string;
  reputation: string;
}

export interface MitreAttack {
  tactic: string;
  technique: string;
  id: string;
}

export interface Threat {
  id: string;
  type: 'malware' | 'intrusion' | 'data_exfiltration' | 'dos' | 'insider_threat' | 'apt' | 'ransomware' | 'phishing';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  confidence: number;
  source: ThreatSource;
  target: { asset: string; data: string };
  indicators: string[];
  mitre_attack: MitreAttack;
  timeline: Array<{ timestamp: string; event: string }>;
  recommended_actions: string[];
}

export interface ThreatDetectionResult {
  threats: Threat[];
  risk_score: number;
  active_attacks: number;
  blocked_attempts: number;
  summary: string;
}

// === VULNERABILITY SCAN ===
export interface VulnerabilityRemediation {
  priority: 'immediate' | 'short_term' | 'medium_term';
  steps: string[];
  estimated_effort: string;
  patch_available: boolean;
}

export interface Vulnerability {
  id: string;
  cve_id: string | null;
  cvss_score: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'code' | 'config' | 'dependency' | 'infrastructure' | 'api';
  affected_asset: string;
  description: string;
  exploitation_difficulty: 'trivial' | 'low' | 'medium' | 'high';
  exploit_available: boolean;
  remediation: VulnerabilityRemediation;
  references: string[];
}

export interface VulnerabilityScanResult {
  vulnerabilities: Vulnerability[];
  scan_coverage: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  risk_score: number;
  next_scan_recommended: string;
}

// === INCIDENT RESPONSE ===
export interface Incident {
  id: string;
  classification: 'security_breach' | 'data_leak' | 'malware' | 'unauthorized_access' | 'dos' | 'insider';
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'detected' | 'analyzing' | 'containing' | 'eradicating' | 'recovering' | 'closed';
  timeline: Array<{ timestamp: string; action: string; result: string }>;
}

export interface ContainmentAction {
  action: string;
  target: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  automated: boolean;
  reversible: boolean;
}

export interface IncidentResponseResult {
  incident: Incident;
  containment_actions: ContainmentAction[];
  affected_assets: string[];
  affected_users: number;
  data_at_risk: { type: string; sensitivity: string; records: number };
  playbook_executed: string;
  escalation: { required: boolean; level: string; notified: string[] };
  recovery_plan: { steps: string[]; estimated_time: string; rollback_available: boolean };
  post_incident: { lessons_learned: string[]; improvements: string[] };
}

// === ACCESS ANALYSIS ===
export interface AccessAnomaly {
  type: 'unusual_time' | 'unusual_location' | 'privilege_escalation' | 'lateral_movement';
  description: string;
  confidence: number;
}

export interface AccessPattern {
  user_id: string;
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  anomalies: AccessAnomaly[];
  privileged_access: boolean;
  last_activity: string;
  session_risk: number;
}

export interface PrivilegeIssue {
  user_id: string;
  issue: 'excessive_privileges' | 'unused_privileges' | 'role_conflict' | 'orphaned_account';
  recommendation: string;
  risk_impact: string;
}

export interface AccessAnalysisResult {
  access_patterns: AccessPattern[];
  privilege_issues: PrivilegeIssue[];
  compromised_indicators: Array<{
    user_id: string;
    indicators: string[];
    confidence: number;
    recommended_action: string;
  }>;
  statistics: {
    total_users: number;
    active_sessions: number;
    high_risk_sessions: number;
    privileged_users: number;
  };
  recommendations: string[];
}

// === COMPLIANCE CHECK ===
export interface ComplianceControl {
  control_id: string;
  category: string;
  status: 'implemented' | 'partial' | 'not_implemented' | 'not_applicable';
  evidence: string[];
  gaps: string[];
  remediation_priority: 'critical' | 'high' | 'medium' | 'low';
  remediation_steps: string[];
}

export interface AuditFinding {
  finding_id: string;
  severity: 'major' | 'minor' | 'observation';
  description: string;
  affected_controls: string[];
  recommendation: string;
  due_date: string;
}

export interface ComplianceCheckResult {
  compliance_status: {
    framework: string;
    version: string;
    overall_score: number;
    status: 'compliant' | 'partially_compliant' | 'non_compliant';
  };
  controls: ComplianceControl[];
  audit_findings: AuditFinding[];
  documentation_gaps: string[];
  next_audit_date: string;
  certification_status: {
    certified: boolean;
    expiration: string | null;
    renewal_required: boolean;
  };
}

// === BEHAVIORAL ANALYTICS ===
export interface UserProfile {
  user_id: string;
  risk_score: number;
  risk_trend: 'increasing' | 'stable' | 'decreasing';
  behavioral_baseline: {
    typical_hours: string;
    typical_locations: string[];
    typical_resources: string[];
    data_volume_normal: string;
  };
  current_deviations: Array<{
    type: string;
    deviation_score: number;
    description: string;
    timestamp: string;
  }>;
  insider_threat_indicators: {
    score: number;
    factors: string[];
  };
}

export interface BehavioralAnalyticsResult {
  user_profiles: UserProfile[];
  entity_analytics: Array<{
    entity_type: 'device' | 'application' | 'network_segment';
    entity_id: string;
    anomaly_score: number;
    anomalies: string[];
  }>;
  peer_group_analysis: {
    outliers: string[];
    common_patterns: string[];
  };
  alerts: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    description: string;
    affected_entities: string[];
  }>;
}

// === THREAT HUNTING ===
export interface HuntingFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'ioc_match' | 'behavioral_anomaly' | 'lateral_movement' | 'persistence_mechanism' | 'exfiltration';
  description: string;
  evidence: Array<{
    type: 'log' | 'network' | 'file' | 'registry' | 'memory';
    data: string;
    timestamp: string;
  }>;
  affected_assets: string[];
  kill_chain_phase: string;
  attribution: {
    threat_actor: string | null;
    confidence: number;
    campaign: string | null;
  };
}

export interface ThreatHuntingResult {
  hunting_campaign: {
    id: string;
    hypothesis: string;
    status: 'active' | 'completed' | 'findings_detected';
    started_at: string;
    scope: string[];
  };
  findings: HuntingFinding[];
  iocs_detected: Array<{
    type: 'ip' | 'domain' | 'hash' | 'email' | 'url';
    value: string;
    threat_intel_source: string;
    last_seen: string;
  }>;
  recommended_hunts: Array<{
    hypothesis: string;
    priority: 'high' | 'medium' | 'low';
    data_sources_needed: string[];
  }>;
  statistics: {
    events_analyzed: number;
    assets_scanned: number;
    time_range: string;
  };
}

// === FORENSIC ANALYSIS ===
export interface ForensicEvidence {
  id: string;
  type: 'disk_image' | 'memory_dump' | 'network_capture' | 'logs' | 'registry';
  source: string;
  hash: { md5: string; sha256: string };
  chain_of_custody: Array<{
    action: string;
    by: string;
    timestamp: string;
  }>;
  analysis_status: 'pending' | 'analyzing' | 'completed';
}

export interface ForensicAnalysisResult {
  investigation: {
    case_id: string;
    status: 'in_progress' | 'completed' | 'requires_escalation';
    type: 'breach' | 'malware' | 'insider' | 'fraud' | 'data_theft';
    started_at: string;
    analyst_notes: string;
  };
  evidence_collected: ForensicEvidence[];
  timeline: Array<{
    timestamp: string;
    event_type: string;
    description: string;
    source: string;
    significance: 'critical' | 'important' | 'informational';
    related_iocs: string[];
  }>;
  malware_analysis: {
    detected: boolean;
    samples: Array<{
      hash: string;
      family: string;
      capabilities: string[];
      c2_servers: string[];
      persistence_mechanisms: string[];
    }>;
  };
  attack_narrative: string;
  root_cause: string;
  recommendations: string[];
  legal_hold_required: boolean;
}

// === SECURITY POSTURE ===
export interface SecurityDomain {
  domain: 'identity' | 'network' | 'endpoint' | 'data' | 'cloud' | 'application';
  score: number;
  strengths: string[];
  weaknesses: string[];
  priority_improvements: string[];
}

export interface SecurityPostureResult {
  overall_posture: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    trend: 'improving' | 'stable' | 'declining';
    maturity_level: 'initial' | 'developing' | 'defined' | 'managed' | 'optimizing';
  };
  domains: SecurityDomain[];
  risk_exposure: {
    overall_risk: 'critical' | 'high' | 'medium' | 'low';
    top_risks: Array<{
      risk: string;
      likelihood: string;
      impact: string;
      mitigation_status: string;
    }>;
  };
  security_investments: {
    current_spend: number;
    recommended_spend: number;
    roi_opportunities: string[];
  };
  benchmark_comparison: {
    industry_average: number;
    percentile: number;
    gap_to_leader: number;
  };
  improvement_roadmap: Array<{
    phase: string;
    initiatives: Array<{
      title: string;
      impact: string;
      effort: string;
      cost_estimate: string;
    }>;
  }>;
}

// === ZERO TRUST ===
export interface ZeroTrustPillar {
  pillar: 'identity' | 'devices' | 'network' | 'applications' | 'data' | 'infrastructure' | 'visibility';
  score: number;
  current_state: string;
  target_state: string;
  gap_analysis: string[];
  implementation_status: 'not_started' | 'in_progress' | 'partial' | 'complete';
}

export interface ZeroTrustEvaluationResult {
  zero_trust_score: number;
  maturity_level: 'traditional' | 'hybrid' | 'advanced' | 'optimal';
  pillars: ZeroTrustPillar[];
  policy_evaluation: {
    least_privilege_compliance: number;
    mfa_coverage: number;
    microsegmentation_coverage: number;
    encryption_coverage: number;
    continuous_monitoring: number;
  };
  architecture_recommendations: Array<{
    area: string;
    current_gap: string;
    recommendation: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    technologies: string[];
    estimated_implementation: string;
  }>;
  quick_wins: string[];
  transformation_roadmap: {
    phases: Array<{
      phase: number;
      focus_areas: string[];
      key_milestones: string[];
      timeline: string;
    }>;
    total_timeline: string;
    investment_required: string;
  };
}

// === CONTEXT ===
export interface SecurityContext {
  organizationId?: string;
  scope?: 'full' | 'partial' | 'targeted';
  assets?: string[];
  timeRange?: { start: string; end: string };
  frameworks?: string[];
  riskTolerance?: 'low' | 'medium' | 'high';
}

// === HOOK ===
export function useSecurityIntelligence() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Results cache
  const [threatDetection, setThreatDetection] = useState<ThreatDetectionResult | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityScanResult | null>(null);
  const [incidentResponse, setIncidentResponse] = useState<IncidentResponseResult | null>(null);
  const [accessAnalysis, setAccessAnalysis] = useState<AccessAnalysisResult | null>(null);
  const [complianceCheck, setComplianceCheck] = useState<ComplianceCheckResult | null>(null);
  const [behavioralAnalytics, setBehavioralAnalytics] = useState<BehavioralAnalyticsResult | null>(null);
  const [threatHunting, setThreatHunting] = useState<ThreatHuntingResult | null>(null);
  const [forensicAnalysis, setForensicAnalysis] = useState<ForensicAnalysisResult | null>(null);
  const [securityPosture, setSecurityPosture] = useState<SecurityPostureResult | null>(null);
  const [zeroTrustEvaluation, setZeroTrustEvaluation] = useState<ZeroTrustEvaluationResult | null>(null);

  // Auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === GENERIC INVOKE ===
  const invokeSecurityAction = useCallback(async <T>(
    action: string,
    context?: SecurityContext,
    params?: Record<string, unknown>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('security-intelligence', {
        body: { action, context, params }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setLastRefresh(new Date());
        return data.data as T;
      }

      throw new Error(data?.error || 'Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error(`[useSecurityIntelligence] ${action} error:`, err);
      toast.error(`Error en ${action}: ${message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === THREAT DETECTION ===
  const detectThreats = useCallback(async (context?: SecurityContext) => {
    const result = await invokeSecurityAction<ThreatDetectionResult>('threat_detection', context);
    if (result) {
      setThreatDetection(result);
      if (result.active_attacks > 0) {
        toast.warning(`${result.active_attacks} ataques activos detectados`);
      }
    }
    return result;
  }, [invokeSecurityAction]);

  // === VULNERABILITY SCAN ===
  const scanVulnerabilities = useCallback(async (
    context?: SecurityContext,
    params?: { scanType?: 'full' | 'quick' | 'targeted'; assets?: string[] }
  ) => {
    const result = await invokeSecurityAction<VulnerabilityScanResult>('vulnerability_scan', context, params);
    if (result) {
      setVulnerabilities(result);
      if (result.critical_count > 0) {
        toast.error(`${result.critical_count} vulnerabilidades críticas encontradas`);
      }
    }
    return result;
  }, [invokeSecurityAction]);

  // === INCIDENT RESPONSE ===
  const handleIncident = useCallback(async (
    context?: SecurityContext,
    params?: { incidentId?: string; action?: 'analyze' | 'contain' | 'eradicate' | 'recover' }
  ) => {
    const result = await invokeSecurityAction<IncidentResponseResult>('incident_response', context, params);
    if (result) {
      setIncidentResponse(result);
      toast.info(`Incidente ${result.incident.id}: ${result.incident.status}`);
    }
    return result;
  }, [invokeSecurityAction]);

  // === ACCESS ANALYSIS ===
  const analyzeAccess = useCallback(async (
    context?: SecurityContext,
    params?: { userId?: string; includePrivileged?: boolean }
  ) => {
    const result = await invokeSecurityAction<AccessAnalysisResult>('access_analysis', context, params);
    if (result) {
      setAccessAnalysis(result);
      if (result.statistics.high_risk_sessions > 0) {
        toast.warning(`${result.statistics.high_risk_sessions} sesiones de alto riesgo`);
      }
    }
    return result;
  }, [invokeSecurityAction]);

  // === COMPLIANCE CHECK ===
  const checkCompliance = useCallback(async (
    context?: SecurityContext,
    params?: { framework?: string; controls?: string[] }
  ) => {
    const result = await invokeSecurityAction<ComplianceCheckResult>('compliance_check', context, params);
    if (result) {
      setComplianceCheck(result);
      toast.success(`Cumplimiento ${result.compliance_status.framework}: ${result.compliance_status.overall_score}%`);
    }
    return result;
  }, [invokeSecurityAction]);

  // === BEHAVIORAL ANALYTICS ===
  const analyzeBehavior = useCallback(async (
    context?: SecurityContext,
    params?: { userIds?: string[]; timeRange?: string }
  ) => {
    const result = await invokeSecurityAction<BehavioralAnalyticsResult>('behavioral_analytics', context, params);
    if (result) {
      setBehavioralAnalytics(result);
      const highRiskUsers = result.user_profiles.filter(u => u.risk_score > 70).length;
      if (highRiskUsers > 0) {
        toast.warning(`${highRiskUsers} usuarios con comportamiento de alto riesgo`);
      }
    }
    return result;
  }, [invokeSecurityAction]);

  // === THREAT HUNTING ===
  const huntThreats = useCallback(async (
    context?: SecurityContext,
    params?: { hypothesis?: string; scope?: string[]; iocs?: string[] }
  ) => {
    const result = await invokeSecurityAction<ThreatHuntingResult>('threat_hunting', context, params);
    if (result) {
      setThreatHunting(result);
      if (result.findings.length > 0) {
        toast.warning(`${result.findings.length} hallazgos en threat hunting`);
      }
    }
    return result;
  }, [invokeSecurityAction]);

  // === FORENSIC ANALYSIS ===
  const analyzeForensics = useCallback(async (
    context?: SecurityContext,
    params?: { caseId?: string; evidenceIds?: string[] }
  ) => {
    const result = await invokeSecurityAction<ForensicAnalysisResult>('forensic_analysis', context, params);
    if (result) {
      setForensicAnalysis(result);
      toast.info(`Análisis forense: ${result.investigation.status}`);
    }
    return result;
  }, [invokeSecurityAction]);

  // === SECURITY POSTURE ===
  const evaluatePosture = useCallback(async (context?: SecurityContext) => {
    const result = await invokeSecurityAction<SecurityPostureResult>('security_posture', context);
    if (result) {
      setSecurityPosture(result);
      toast.success(`Postura de seguridad: ${result.overall_posture.grade} (${result.overall_posture.score}%)`);
    }
    return result;
  }, [invokeSecurityAction]);

  // === ZERO TRUST EVALUATION ===
  const evaluateZeroTrust = useCallback(async (context?: SecurityContext) => {
    const result = await invokeSecurityAction<ZeroTrustEvaluationResult>('zero_trust_evaluation', context);
    if (result) {
      setZeroTrustEvaluation(result);
      toast.info(`Zero Trust Score: ${result.zero_trust_score}% (${result.maturity_level})`);
    }
    return result;
  }, [invokeSecurityAction]);

  // === FULL SECURITY ASSESSMENT ===
  const runFullAssessment = useCallback(async (context?: SecurityContext) => {
    setIsLoading(true);
    toast.info('Iniciando evaluación completa de seguridad...');

    try {
      await Promise.all([
        detectThreats(context),
        scanVulnerabilities(context),
        analyzeAccess(context),
        evaluatePosture(context),
        evaluateZeroTrust(context)
      ]);

      toast.success('Evaluación de seguridad completa');
    } catch (err) {
      console.error('[useSecurityIntelligence] Full assessment error:', err);
      toast.error('Error en evaluación completa');
    } finally {
      setIsLoading(false);
    }
  }, [detectThreats, scanVulnerabilities, analyzeAccess, evaluatePosture, evaluateZeroTrust]);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: SecurityContext, intervalMs = 60000) => {
    stopAutoRefresh();
    detectThreats(context);
    autoRefreshInterval.current = setInterval(() => {
      detectThreats(context);
    }, intervalMs);
  }, [detectThreats]);

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
    error,
    lastRefresh,
    
    // Resultados cacheados
    threatDetection,
    vulnerabilities,
    incidentResponse,
    accessAnalysis,
    complianceCheck,
    behavioralAnalytics,
    threatHunting,
    forensicAnalysis,
    securityPosture,
    zeroTrustEvaluation,
    
    // Acciones
    detectThreats,
    scanVulnerabilities,
    handleIncident,
    analyzeAccess,
    checkCompliance,
    analyzeBehavior,
    huntThreats,
    analyzeForensics,
    evaluatePosture,
    evaluateZeroTrust,
    runFullAssessment,
    
    // Auto-refresh
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useSecurityIntelligence;
