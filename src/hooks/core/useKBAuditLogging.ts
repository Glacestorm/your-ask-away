/**
 * KB 4.5 - Audit Logging Hook (Phase 18)
 * Enterprise audit trail with compliance support
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type AuditLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
export type AuditCategory = 'auth' | 'data' | 'access' | 'admin' | 'security' | 'compliance' | 'system';

export interface AuditEntry {
  id: string;
  timestamp: number;
  level: AuditLevel;
  category: AuditCategory;
  action: string;
  actor: AuditActor;
  resource: AuditResource;
  outcome: 'success' | 'failure' | 'partial';
  details?: Record<string, unknown>;
  metadata?: AuditMetadata;
  correlationId?: string;
  sessionId?: string;
  requestId?: string;
}

export interface AuditActor {
  type: 'user' | 'system' | 'service' | 'api';
  id: string;
  name?: string;
  email?: string;
  role?: string;
  ip?: string;
  userAgent?: string;
}

export interface AuditResource {
  type: string;
  id: string;
  name?: string;
  path?: string;
  before?: unknown;
  after?: unknown;
}

export interface AuditMetadata {
  environment?: string;
  version?: string;
  region?: string;
  tenant?: string;
  duration?: number;
  tags?: string[];
}

export interface AuditFilter {
  level?: AuditLevel[];
  category?: AuditCategory[];
  action?: string[];
  actorId?: string;
  resourceType?: string;
  resourceId?: string;
  outcome?: AuditEntry['outcome'][];
  startTime?: number;
  endTime?: number;
  correlationId?: string;
  searchText?: string;
}

export interface AuditExporter {
  name: string;
  export: (entries: AuditEntry[]) => Promise<void>;
}

export interface AuditConfig {
  serviceName: string;
  environment?: string;
  exporters?: AuditExporter[];
  bufferSize?: number;
  flushInterval?: number;
  retentionDays?: number;
  sensitiveFields?: string[];
  enrichers?: AuditEnricher[];
  filters?: AuditFilter;
}

export interface AuditEnricher {
  name: string;
  enrich: (entry: AuditEntry) => AuditEntry;
}

export interface AuditStats {
  totalEntries: number;
  entriesByLevel: Record<AuditLevel, number>;
  entriesByCategory: Record<AuditCategory, number>;
  successRate: number;
  averageEntriesPerMinute: number;
}

// ============================================================================
// UTILITIES
// ============================================================================

function generateId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function maskSensitiveData(
  data: Record<string, unknown>,
  sensitiveFields: string[]
): Record<string, unknown> {
  const masked = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in masked) {
      const value = masked[field];
      if (typeof value === 'string') {
        masked[field] = value.length > 4 
          ? '*'.repeat(value.length - 4) + value.slice(-4)
          : '****';
      } else {
        masked[field] = '[REDACTED]';
      }
    }
  }
  
  return masked;
}

function matchesFilter(entry: AuditEntry, filter: AuditFilter): boolean {
  if (filter.level && !filter.level.includes(entry.level)) return false;
  if (filter.category && !filter.category.includes(entry.category)) return false;
  if (filter.action && !filter.action.includes(entry.action)) return false;
  if (filter.actorId && entry.actor.id !== filter.actorId) return false;
  if (filter.resourceType && entry.resource.type !== filter.resourceType) return false;
  if (filter.resourceId && entry.resource.id !== filter.resourceId) return false;
  if (filter.outcome && !filter.outcome.includes(entry.outcome)) return false;
  if (filter.startTime && entry.timestamp < filter.startTime) return false;
  if (filter.endTime && entry.timestamp > filter.endTime) return false;
  if (filter.correlationId && entry.correlationId !== filter.correlationId) return false;
  if (filter.searchText) {
    const searchLower = filter.searchText.toLowerCase();
    const matchesAction = entry.action.toLowerCase().includes(searchLower);
    const matchesResource = entry.resource.name?.toLowerCase().includes(searchLower);
    const matchesActor = entry.actor.name?.toLowerCase().includes(searchLower);
    if (!matchesAction && !matchesResource && !matchesActor) return false;
  }
  return true;
}

// ============================================================================
// EXPORTERS
// ============================================================================

export const consoleAuditExporter: AuditExporter = {
  name: 'console',
  export: async (entries: AuditEntry[]) => {
    entries.forEach(entry => {
      const levelColors: Record<AuditLevel, string> = {
        debug: '\x1b[90m',
        info: '\x1b[36m',
        warn: '\x1b[33m',
        error: '\x1b[31m',
        critical: '\x1b[35m',
      };
      const reset = '\x1b[0m';
      const color = levelColors[entry.level];
      
      console.log(
        `${color}[AUDIT:${entry.level.toUpperCase()}]${reset}`,
        `[${entry.category}]`,
        entry.action,
        `- Actor: ${entry.actor.name || entry.actor.id}`,
        `- Resource: ${entry.resource.type}/${entry.resource.id}`,
        `- Outcome: ${entry.outcome}`
      );
    });
  },
};

export function createLocalStorageAuditExporter(key: string): AuditExporter {
  return {
    name: 'localStorage',
    export: async (entries: AuditEntry[]) => {
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = [...existing, ...entries].slice(-10000); // Keep last 10k
      localStorage.setItem(key, JSON.stringify(updated));
    },
  };
}

export function createHTTPAuditExporter(url: string, options?: RequestInit): AuditExporter {
  return {
    name: 'http',
    export: async (entries: AuditEntry[]) => {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: JSON.stringify({ entries }),
        ...options,
      });
    },
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useKBAuditLogging(config: AuditConfig): {
  // Logging
  log: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  logAuth: (action: string, actor: AuditActor, outcome: AuditEntry['outcome'], details?: Record<string, unknown>) => void;
  logData: (action: string, actor: AuditActor, resource: AuditResource, outcome: AuditEntry['outcome']) => void;
  logAccess: (action: string, actor: AuditActor, resource: AuditResource, outcome: AuditEntry['outcome']) => void;
  logAdmin: (action: string, actor: AuditActor, details?: Record<string, unknown>) => void;
  logSecurity: (action: string, actor: AuditActor, level: AuditLevel, details?: Record<string, unknown>) => void;
  
  // Querying
  getEntries: (filter?: AuditFilter) => AuditEntry[];
  search: (query: string) => AuditEntry[];
  getByCorrelation: (correlationId: string) => AuditEntry[];
  
  // Stats
  stats: AuditStats;
  
  // Management
  flush: () => Promise<void>;
  clear: () => void;
  export: (filter?: AuditFilter) => Promise<string>;
} {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const bufferRef = useRef<AuditEntry[]>([]);
  const configRef = useRef(config);
  configRef.current = config;

  // Calculate stats
  const stats = useMemo((): AuditStats => {
    const entriesByLevel: Record<AuditLevel, number> = {
      debug: 0, info: 0, warn: 0, error: 0, critical: 0
    };
    const entriesByCategory: Record<AuditCategory, number> = {
      auth: 0, data: 0, access: 0, admin: 0, security: 0, compliance: 0, system: 0
    };
    
    let successCount = 0;
    entries.forEach(e => {
      entriesByLevel[e.level]++;
      entriesByCategory[e.category]++;
      if (e.outcome === 'success') successCount++;
    });

    const timeRange = entries.length > 1 
      ? (entries[entries.length - 1].timestamp - entries[0].timestamp) / 60000
      : 1;

    return {
      totalEntries: entries.length,
      entriesByLevel,
      entriesByCategory,
      successRate: entries.length > 0 ? successCount / entries.length : 1,
      averageEntriesPerMinute: entries.length / Math.max(timeRange, 1),
    };
  }, [entries]);

  // Core log function
  const log = useCallback((entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    const { sensitiveFields = [], enrichers = [], filters } = configRef.current;
    
    let fullEntry: AuditEntry = {
      ...entry,
      id: generateId(),
      timestamp: Date.now(),
      details: entry.details 
        ? maskSensitiveData(entry.details, sensitiveFields)
        : undefined,
      metadata: {
        ...entry.metadata,
        environment: configRef.current.environment,
      },
    };

    // Apply enrichers
    for (const enricher of enrichers) {
      fullEntry = enricher.enrich(fullEntry);
    }

    // Check filters
    if (filters && !matchesFilter(fullEntry, filters)) {
      return;
    }

    // Add to entries
    setEntries(prev => [...prev, fullEntry].slice(-10000));
    bufferRef.current.push(fullEntry);

    // Auto-flush if buffer is full
    const bufferSize = configRef.current.bufferSize ?? 100;
    if (bufferRef.current.length >= bufferSize) {
      flush();
    }
  }, []);

  // Convenience logging methods
  const logAuth = useCallback((
    action: string,
    actor: AuditActor,
    outcome: AuditEntry['outcome'],
    details?: Record<string, unknown>
  ) => {
    log({
      level: outcome === 'failure' ? 'warn' : 'info',
      category: 'auth',
      action,
      actor,
      resource: { type: 'auth', id: 'session' },
      outcome,
      details,
    });
  }, [log]);

  const logData = useCallback((
    action: string,
    actor: AuditActor,
    resource: AuditResource,
    outcome: AuditEntry['outcome']
  ) => {
    log({
      level: 'info',
      category: 'data',
      action,
      actor,
      resource,
      outcome,
    });
  }, [log]);

  const logAccess = useCallback((
    action: string,
    actor: AuditActor,
    resource: AuditResource,
    outcome: AuditEntry['outcome']
  ) => {
    log({
      level: outcome === 'failure' ? 'warn' : 'info',
      category: 'access',
      action,
      actor,
      resource,
      outcome,
    });
  }, [log]);

  const logAdmin = useCallback((
    action: string,
    actor: AuditActor,
    details?: Record<string, unknown>
  ) => {
    log({
      level: 'info',
      category: 'admin',
      action,
      actor,
      resource: { type: 'admin', id: 'system' },
      outcome: 'success',
      details,
    });
  }, [log]);

  const logSecurity = useCallback((
    action: string,
    actor: AuditActor,
    level: AuditLevel,
    details?: Record<string, unknown>
  ) => {
    log({
      level,
      category: 'security',
      action,
      actor,
      resource: { type: 'security', id: 'event' },
      outcome: level === 'error' || level === 'critical' ? 'failure' : 'success',
      details,
    });
  }, [log]);

  // Query functions
  const getEntries = useCallback((filter?: AuditFilter): AuditEntry[] => {
    if (!filter) return entries;
    return entries.filter(e => matchesFilter(e, filter));
  }, [entries]);

  const search = useCallback((query: string): AuditEntry[] => {
    return getEntries({ searchText: query });
  }, [getEntries]);

  const getByCorrelation = useCallback((correlationId: string): AuditEntry[] => {
    return getEntries({ correlationId });
  }, [getEntries]);

  // Flush buffer to exporters
  const flush = useCallback(async () => {
    const toExport = [...bufferRef.current];
    bufferRef.current = [];

    const exporters = configRef.current.exporters ?? [consoleAuditExporter];
    await Promise.all(exporters.map(e => e.export(toExport).catch(console.error)));
  }, []);

  // Clear all entries
  const clear = useCallback(() => {
    setEntries([]);
    bufferRef.current = [];
  }, []);

  // Export to JSON
  const exportFn = useCallback(async (filter?: AuditFilter): Promise<string> => {
    const filtered = getEntries(filter);
    return JSON.stringify(filtered, null, 2);
  }, [getEntries]);

  // Auto-flush interval
  useEffect(() => {
    const interval = configRef.current.flushInterval ?? 30000;
    const timer = setInterval(flush, interval);
    return () => clearInterval(timer);
  }, [flush]);

  // Cleanup old entries
  useEffect(() => {
    const retentionDays = configRef.current.retentionDays ?? 30;
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - retentionMs;
    
    setEntries(prev => prev.filter(e => e.timestamp >= cutoff));
  }, []);

  return {
    log,
    logAuth,
    logData,
    logAccess,
    logAdmin,
    logSecurity,
    getEntries,
    search,
    getByCorrelation,
    stats,
    flush,
    clear,
    export: exportFn,
  };
}

// ============================================================================
// COMPLIANCE AUDIT HOOK
// ============================================================================

export function useKBComplianceAudit(config: AuditConfig & {
  complianceFrameworks?: ('gdpr' | 'hipaa' | 'sox' | 'pci-dss')[];
}): ReturnType<typeof useKBAuditLogging> & {
  logDataAccess: (actor: AuditActor, dataType: string, purpose: string, lawfulBasis?: string) => void;
  logDataExport: (actor: AuditActor, dataType: string, destination: string) => void;
  logDataDeletion: (actor: AuditActor, dataType: string, subjectId: string) => void;
  logConsentChange: (actor: AuditActor, consentType: string, granted: boolean) => void;
  generateComplianceReport: (framework: string, startDate: Date, endDate: Date) => Promise<unknown>;
} {
  const baseAudit = useKBAuditLogging(config);

  const logDataAccess = useCallback((
    actor: AuditActor,
    dataType: string,
    purpose: string,
    lawfulBasis?: string
  ) => {
    baseAudit.log({
      level: 'info',
      category: 'compliance',
      action: 'data_access',
      actor,
      resource: { type: 'personal_data', id: dataType },
      outcome: 'success',
      details: { purpose, lawfulBasis },
      metadata: { tags: ['gdpr', 'data-access'] },
    });
  }, [baseAudit]);

  const logDataExport = useCallback((
    actor: AuditActor,
    dataType: string,
    destination: string
  ) => {
    baseAudit.log({
      level: 'info',
      category: 'compliance',
      action: 'data_export',
      actor,
      resource: { type: 'personal_data', id: dataType },
      outcome: 'success',
      details: { destination },
      metadata: { tags: ['gdpr', 'data-portability'] },
    });
  }, [baseAudit]);

  const logDataDeletion = useCallback((
    actor: AuditActor,
    dataType: string,
    subjectId: string
  ) => {
    baseAudit.log({
      level: 'warn',
      category: 'compliance',
      action: 'data_deletion',
      actor,
      resource: { type: 'personal_data', id: dataType },
      outcome: 'success',
      details: { subjectId },
      metadata: { tags: ['gdpr', 'right-to-erasure'] },
    });
  }, [baseAudit]);

  const logConsentChange = useCallback((
    actor: AuditActor,
    consentType: string,
    granted: boolean
  ) => {
    baseAudit.log({
      level: 'info',
      category: 'compliance',
      action: granted ? 'consent_granted' : 'consent_withdrawn',
      actor,
      resource: { type: 'consent', id: consentType },
      outcome: 'success',
      details: { granted },
      metadata: { tags: ['gdpr', 'consent'] },
    });
  }, [baseAudit]);

  const generateComplianceReport = useCallback(async (
    framework: string,
    startDate: Date,
    endDate: Date
  ): Promise<unknown> => {
    const entries = baseAudit.getEntries({
      category: ['compliance', 'data', 'access', 'security'],
      startTime: startDate.getTime(),
      endTime: endDate.getTime(),
    });

    return {
      framework,
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      totalEvents: entries.length,
      summary: {
        dataAccessEvents: entries.filter(e => e.action === 'data_access').length,
        dataExportEvents: entries.filter(e => e.action === 'data_export').length,
        dataDeletionEvents: entries.filter(e => e.action === 'data_deletion').length,
        consentEvents: entries.filter(e => e.action.includes('consent')).length,
        securityEvents: entries.filter(e => e.category === 'security').length,
      },
      entries,
    };
  }, [baseAudit]);

  return {
    ...baseAudit,
    logDataAccess,
    logDataExport,
    logDataDeletion,
    logConsentChange,
    generateComplianceReport,
  };
}

export default useKBAuditLogging;
