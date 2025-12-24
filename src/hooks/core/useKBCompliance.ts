/**
 * KB 4.5 - Compliance Hook (Phase 18)
 * GDPR, HIPAA, SOX, PCI-DSS compliance patterns
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type ComplianceFramework = 'gdpr' | 'hipaa' | 'sox' | 'pci-dss' | 'ccpa' | 'iso27001';
export type ConsentType = 'analytics' | 'marketing' | 'personalization' | 'essential' | 'third-party';
export type DataCategory = 'personal' | 'sensitive' | 'health' | 'financial' | 'biometric';
export type LawfulBasis = 'consent' | 'contract' | 'legal-obligation' | 'vital-interests' | 'public-task' | 'legitimate-interests';

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  grantedAt?: number;
  withdrawnAt?: number;
  expiresAt?: number;
  version: string;
  source: 'explicit' | 'implicit' | 'opt-out';
  metadata?: Record<string, unknown>;
}

export interface DataSubjectRequest {
  id: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  subjectId: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: number;
  completedAt?: number;
  response?: unknown;
  notes?: string;
}

export interface DataProcessingRecord {
  id: string;
  purpose: string;
  lawfulBasis: LawfulBasis;
  dataCategories: DataCategory[];
  recipients?: string[];
  retentionPeriod?: string;
  internationalTransfers?: boolean;
  automatedDecisionMaking?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PrivacyPolicy {
  version: string;
  effectiveDate: number;
  sections: PrivacyPolicySection[];
  languages: string[];
}

export interface PrivacyPolicySection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface ComplianceConfig {
  frameworks: ComplianceFramework[];
  dataRetentionDays?: number;
  consentExpirationDays?: number;
  autoAnonymizeAfterDays?: number;
  onConsentChange?: (consent: ConsentRecord) => void;
  onDataRequest?: (request: DataSubjectRequest) => void;
}

export interface ComplianceStatus {
  framework: ComplianceFramework;
  compliant: boolean;
  issues: ComplianceIssue[];
  lastAudit: number;
  score: number; // 0-100
}

export interface ComplianceIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  recommendation: string;
  deadline?: number;
}

// ============================================================================
// UTILITIES
// ============================================================================

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// ============================================================================
// CONSENT MANAGEMENT HOOK
// ============================================================================

export function useKBConsentManagement(config: ComplianceConfig): {
  // State
  consents: ConsentRecord[];
  isLoading: boolean;
  
  // Consent Actions
  grantConsent: (userId: string, consentType: ConsentType, metadata?: Record<string, unknown>) => Promise<ConsentRecord>;
  withdrawConsent: (userId: string, consentType: ConsentType) => Promise<void>;
  hasConsent: (userId: string, consentType: ConsentType) => boolean;
  getConsents: (userId: string) => ConsentRecord[];
  
  // Bulk Operations
  grantAllConsents: (userId: string, consentTypes: ConsentType[]) => Promise<void>;
  withdrawAllConsents: (userId: string) => Promise<void>;
  
  // Preferences
  getConsentPreferences: (userId: string) => Record<ConsentType, boolean>;
  updateConsentPreferences: (userId: string, preferences: Partial<Record<ConsentType, boolean>>) => Promise<void>;
} {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const configRef = useRef(config);
  configRef.current = config;

  // Load from storage
  useEffect(() => {
    const stored = localStorage.getItem('kb_consents');
    if (stored) {
      setConsents(JSON.parse(stored));
    }
  }, []);

  // Save to storage
  useEffect(() => {
    localStorage.setItem('kb_consents', JSON.stringify(consents));
  }, [consents]);

  const grantConsent = useCallback(async (
    userId: string,
    consentType: ConsentType,
    metadata?: Record<string, unknown>
  ): Promise<ConsentRecord> => {
    const expirationDays = configRef.current.consentExpirationDays ?? 365;
    
    const consent: ConsentRecord = {
      id: generateId(),
      userId,
      consentType,
      granted: true,
      grantedAt: Date.now(),
      expiresAt: Date.now() + expirationDays * 24 * 60 * 60 * 1000,
      version: '1.0',
      source: 'explicit',
      metadata,
    };

    setConsents(prev => {
      // Remove existing consent of same type
      const filtered = prev.filter(c => !(c.userId === userId && c.consentType === consentType));
      return [...filtered, consent];
    });

    configRef.current.onConsentChange?.(consent);
    return consent;
  }, []);

  const withdrawConsent = useCallback(async (userId: string, consentType: ConsentType) => {
    setConsents(prev => prev.map(c => {
      if (c.userId === userId && c.consentType === consentType) {
        const updated = { ...c, granted: false, withdrawnAt: Date.now() };
        configRef.current.onConsentChange?.(updated);
        return updated;
      }
      return c;
    }));
  }, []);

  const hasConsent = useCallback((userId: string, consentType: ConsentType): boolean => {
    const consent = consents.find(c => 
      c.userId === userId && 
      c.consentType === consentType && 
      c.granted
    );
    
    if (!consent) return false;
    if (consent.expiresAt && consent.expiresAt < Date.now()) return false;
    
    return true;
  }, [consents]);

  const getConsents = useCallback((userId: string): ConsentRecord[] => {
    return consents.filter(c => c.userId === userId);
  }, [consents]);

  const grantAllConsents = useCallback(async (userId: string, consentTypes: ConsentType[]) => {
    await Promise.all(consentTypes.map(type => grantConsent(userId, type)));
  }, [grantConsent]);

  const withdrawAllConsents = useCallback(async (userId: string) => {
    const userConsents = getConsents(userId);
    await Promise.all(userConsents.map(c => withdrawConsent(userId, c.consentType)));
  }, [getConsents, withdrawConsent]);

  const getConsentPreferences = useCallback((userId: string): Record<ConsentType, boolean> => {
    const prefs: Record<ConsentType, boolean> = {
      analytics: false,
      marketing: false,
      personalization: false,
      essential: true, // Essential is always true
      'third-party': false,
    };

    getConsents(userId).forEach(c => {
      if (c.granted && (!c.expiresAt || c.expiresAt > Date.now())) {
        prefs[c.consentType] = true;
      }
    });

    return prefs;
  }, [getConsents]);

  const updateConsentPreferences = useCallback(async (
    userId: string,
    preferences: Partial<Record<ConsentType, boolean>>
  ) => {
    for (const [type, granted] of Object.entries(preferences)) {
      if (granted) {
        await grantConsent(userId, type as ConsentType);
      } else {
        await withdrawConsent(userId, type as ConsentType);
      }
    }
  }, [grantConsent, withdrawConsent]);

  return {
    consents,
    isLoading,
    grantConsent,
    withdrawConsent,
    hasConsent,
    getConsents,
    grantAllConsents,
    withdrawAllConsents,
    getConsentPreferences,
    updateConsentPreferences,
  };
}

// ============================================================================
// DATA SUBJECT RIGHTS HOOK
// ============================================================================

export function useKBDataSubjectRights(config: ComplianceConfig): {
  // Requests
  requests: DataSubjectRequest[];
  submitRequest: (type: DataSubjectRequest['type'], subjectId: string) => Promise<DataSubjectRequest>;
  getRequestStatus: (requestId: string) => DataSubjectRequest | null;
  
  // Right to Access
  exportData: (subjectId: string) => Promise<unknown>;
  
  // Right to Erasure
  eraseData: (subjectId: string) => Promise<void>;
  
  // Right to Rectification
  rectifyData: (subjectId: string, corrections: Record<string, unknown>) => Promise<void>;
  
  // Right to Portability
  portData: (subjectId: string, format: 'json' | 'csv') => Promise<string>;
  
  // Processing
  processRequest: (requestId: string) => Promise<void>;
  completeRequest: (requestId: string, response?: unknown) => Promise<void>;
  rejectRequest: (requestId: string, reason: string) => Promise<void>;
} {
  const [requests, setRequests] = useState<DataSubjectRequest[]>([]);
  const configRef = useRef(config);
  configRef.current = config;

  const submitRequest = useCallback(async (
    type: DataSubjectRequest['type'],
    subjectId: string
  ): Promise<DataSubjectRequest> => {
    const request: DataSubjectRequest = {
      id: generateId(),
      type,
      subjectId,
      status: 'pending',
      requestedAt: Date.now(),
    };

    setRequests(prev => [...prev, request]);
    configRef.current.onDataRequest?.(request);
    
    return request;
  }, []);

  const getRequestStatus = useCallback((requestId: string): DataSubjectRequest | null => {
    return requests.find(r => r.id === requestId) ?? null;
  }, [requests]);

  const exportData = useCallback(async (subjectId: string): Promise<unknown> => {
    await submitRequest('access', subjectId);
    
    // Simulate data export (in real app, this would fetch from backend)
    return {
      subjectId,
      exportedAt: new Date().toISOString(),
      data: {
        profile: { id: subjectId },
        consents: [],
        activities: [],
      },
    };
  }, [submitRequest]);

  const eraseData = useCallback(async (subjectId: string): Promise<void> => {
    await submitRequest('erasure', subjectId);
    
    // In real app, this would delete user data
    console.log(`[GDPR] Erasing data for subject: ${subjectId}`);
  }, [submitRequest]);

  const rectifyData = useCallback(async (
    subjectId: string,
    corrections: Record<string, unknown>
  ): Promise<void> => {
    const request = await submitRequest('rectification', subjectId);
    
    // In real app, this would update user data
    console.log(`[GDPR] Rectifying data for subject: ${subjectId}`, corrections);
    
    setRequests(prev => prev.map(r => 
      r.id === request.id 
        ? { ...r, status: 'completed', completedAt: Date.now() }
        : r
    ));
  }, [submitRequest]);

  const portData = useCallback(async (
    subjectId: string,
    format: 'json' | 'csv'
  ): Promise<string> => {
    await submitRequest('portability', subjectId);
    
    const data = await exportData(subjectId);
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    // Simple CSV conversion
    return 'id,type,value\n' + Object.entries(data as Record<string, unknown>)
      .map(([k, v]) => `${subjectId},${k},${JSON.stringify(v)}`)
      .join('\n');
  }, [submitRequest, exportData]);

  const processRequest = useCallback(async (requestId: string) => {
    setRequests(prev => prev.map(r => 
      r.id === requestId ? { ...r, status: 'processing' } : r
    ));
  }, []);

  const completeRequest = useCallback(async (requestId: string, response?: unknown) => {
    setRequests(prev => prev.map(r => 
      r.id === requestId 
        ? { ...r, status: 'completed', completedAt: Date.now(), response }
        : r
    ));
  }, []);

  const rejectRequest = useCallback(async (requestId: string, reason: string) => {
    setRequests(prev => prev.map(r => 
      r.id === requestId 
        ? { ...r, status: 'rejected', notes: reason }
        : r
    ));
  }, []);

  return {
    requests,
    submitRequest,
    getRequestStatus,
    exportData,
    eraseData,
    rectifyData,
    portData,
    processRequest,
    completeRequest,
    rejectRequest,
  };
}

// ============================================================================
// COMPLIANCE CHECKER HOOK
// ============================================================================

export function useKBComplianceChecker(config: ComplianceConfig): {
  // Status
  status: ComplianceStatus[];
  overallScore: number;
  
  // Checks
  runAudit: () => Promise<void>;
  checkFramework: (framework: ComplianceFramework) => Promise<ComplianceStatus>;
  
  // Issues
  issues: ComplianceIssue[];
  resolveIssue: (issueId: string) => void;
  
  // Reports
  generateReport: () => Promise<unknown>;
} {
  const [status, setStatus] = useState<ComplianceStatus[]>([]);
  const [issues, setIssues] = useState<ComplianceIssue[]>([]);
  const configRef = useRef(config);

  const overallScore = useMemo(() => {
    if (status.length === 0) return 0;
    return Math.round(status.reduce((acc, s) => acc + s.score, 0) / status.length);
  }, [status]);

  const checkFramework = useCallback(async (framework: ComplianceFramework): Promise<ComplianceStatus> => {
    const frameworkIssues: ComplianceIssue[] = [];
    let score = 100;

    // Framework-specific checks
    switch (framework) {
      case 'gdpr':
        // Check consent management
        if (!localStorage.getItem('kb_consents')) {
          frameworkIssues.push({
            id: generateId(),
            severity: 'high',
            category: 'consent',
            description: 'No consent records found',
            recommendation: 'Implement consent management for all users',
          });
          score -= 20;
        }
        
        // Check data retention
        if (!configRef.current.dataRetentionDays) {
          frameworkIssues.push({
            id: generateId(),
            severity: 'medium',
            category: 'retention',
            description: 'Data retention policy not configured',
            recommendation: 'Set data retention period',
          });
          score -= 10;
        }
        break;

      case 'hipaa':
        // Check encryption
        frameworkIssues.push({
          id: generateId(),
          severity: 'low',
          category: 'encryption',
          description: 'Verify PHI encryption at rest',
          recommendation: 'Enable field-level encryption for PHI',
        });
        break;

      case 'pci-dss':
        // Check card data handling
        frameworkIssues.push({
          id: generateId(),
          severity: 'medium',
          category: 'card-data',
          description: 'Review card data handling procedures',
          recommendation: 'Use tokenization for card data',
        });
        score -= 5;
        break;
    }

    setIssues(prev => [...prev.filter(i => !i.id.startsWith(framework)), ...frameworkIssues]);

    return {
      framework,
      compliant: score >= 80,
      issues: frameworkIssues,
      lastAudit: Date.now(),
      score: Math.max(0, score),
    };
  }, []);

  const runAudit = useCallback(async () => {
    const results = await Promise.all(
      configRef.current.frameworks.map(f => checkFramework(f))
    );
    setStatus(results);
  }, [checkFramework]);

  const resolveIssue = useCallback((issueId: string) => {
    setIssues(prev => prev.filter(i => i.id !== issueId));
  }, []);

  const generateReport = useCallback(async (): Promise<unknown> => {
    await runAudit();
    
    return {
      generatedAt: new Date().toISOString(),
      frameworks: configRef.current.frameworks,
      overallScore,
      status,
      issues,
      recommendations: issues
        .sort((a, b) => {
          const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        })
        .slice(0, 5)
        .map(i => i.recommendation),
    };
  }, [runAudit, overallScore, status, issues]);

  // Run initial audit
  useEffect(() => {
    runAudit();
  }, [runAudit]);

  return {
    status,
    overallScore,
    runAudit,
    checkFramework,
    issues,
    resolveIssue,
    generateReport,
  };
}

// ============================================================================
// DATA ANONYMIZATION HOOK
// ============================================================================

export function useKBDataAnonymization(): {
  anonymize: <T extends Record<string, unknown>>(data: T, fields: string[]) => T;
  pseudonymize: <T extends Record<string, unknown>>(data: T, fields: string[], salt: string) => T;
  generalize: (value: number, granularity: number) => number;
  suppress: <T extends Record<string, unknown>>(data: T, fields: string[]) => T;
  addNoise: (value: number, epsilon: number) => number;
} {
  const anonymize = useCallback(<T extends Record<string, unknown>>(data: T, fields: string[]): T => {
    const result = { ...data };
    
    for (const field of fields) {
      if (field in result) {
        (result as Record<string, unknown>)[field] = '[ANONYMIZED]';
      }
    }
    
    return result;
  }, []);

  const pseudonymize = useCallback(<T extends Record<string, unknown>>(
    data: T,
    fields: string[],
    salt: string
  ): T => {
    const result = { ...data };
    
    for (const field of fields) {
      const value = result[field];
      if (value !== undefined) {
        // Simple hash-based pseudonymization
        const hash = btoa(`${String(value)}:${salt}`).slice(0, 16);
        (result as Record<string, unknown>)[field] = `pseudo_${hash}`;
      }
    }
    
    return result;
  }, []);

  const generalize = useCallback((value: number, granularity: number): number => {
    return Math.floor(value / granularity) * granularity;
  }, []);

  const suppress = useCallback(<T extends Record<string, unknown>>(data: T, fields: string[]): T => {
    const result = { ...data };
    
    for (const field of fields) {
      delete (result as Record<string, unknown>)[field];
    }
    
    return result;
  }, []);

  // Differential privacy noise (Laplace mechanism)
  const addNoise = useCallback((value: number, epsilon: number): number => {
    const u = Math.random() - 0.5;
    const noise = -Math.sign(u) * Math.log(1 - 2 * Math.abs(u)) / epsilon;
    return value + noise;
  }, []);

  return {
    anonymize,
    pseudonymize,
    generalize,
    suppress,
    addNoise,
  };
}

export default useKBConsentManagement;
