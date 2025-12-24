/**
 * KB 4.5 - Enterprise Integration Hooks
 * Fase 11 - Enterprise SaaS 2025-2026
 * 
 * Hooks especializados para paneles enterprise con:
 * - Compliance Monitor Integration
 * - Command Center Integration
 * - Workflow Engine Integration
 * - Business Intelligence Integration
 * - Real-time sync con KB core
 * - Telemetría avanzada
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createKBError, collectTelemetry } from './useKBBase';
import { useIsFeatureEnabled } from './useKBFeatureFlags';
import type { KBError, KBStatus } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface EnterpriseContext {
  organizationId: string;
  tenantId?: string;
  userId?: string;
  sector?: string;
  permissions?: string[];
  metadata?: Record<string, unknown>;
}

export interface ComplianceMetrics {
  overallScore: number;
  totalRules: number;
  compliantRules: number;
  violations: number;
  criticalViolations: number;
  trend: 'improving' | 'declining' | 'stable';
  lastFullScan?: string;
}

export interface ComplianceViolation {
  id: string;
  ruleName: string;
  ruleCode: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  suggestedAction: string;
  autoResolvable: boolean;
  detectedAt: string;
  affectedEntities?: string[];
}

export interface PredictedRisk {
  id: string;
  ruleName: string;
  probability: number;
  expectedDate: string;
  preventiveAction: string;
  impact: 'high' | 'medium' | 'low';
}

export interface SystemHealthMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  threshold?: number;
}

export interface SystemHealth {
  overall: number;
  status: 'healthy' | 'degraded' | 'critical';
  components: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'critical';
    latency?: number;
    uptime?: number;
  }>;
  lastCheck: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface LiveActivity {
  id: string;
  action: string;
  target: string;
  actor?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft' | 'archived';
  trigger?: {
    type: string;
    config: Record<string, unknown>;
  };
  steps: Array<{
    id: string;
    type: string;
    config: Record<string, unknown>;
  }>;
  executionCount: number;
  lastExecutedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  error?: string;
  steps: Array<{
    stepId: string;
    status: string;
    output?: unknown;
  }>;
}

export interface AutomationRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
  priority: number;
  executionCount: number;
}

export interface KPI {
  id: string;
  name: string;
  value: number | string;
  unit?: string;
  trend: 'up' | 'down' | 'stable';
  change?: number;
  target?: number;
  category?: string;
}

export interface BIInsight {
  id: string;
  type: 'anomaly' | 'trend' | 'correlation' | 'recommendation';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  confidence: number;
  suggestedActions?: string[];
  relatedKPIs?: string[];
  generatedAt: string;
}

export interface Prediction {
  id: string;
  metric: string;
  confidence: number;
  horizon: string;
  scenarios?: Array<{
    name: string;
    value: string;
    probability: number;
  }>;
  factors?: string[];
}

export interface Correlation {
  id: string;
  metrics: [string, string];
  coefficient: number;
  significance: number;
  description: string;
}

// ============================================================================
// ENTERPRISE BASE HOOK
// ============================================================================

export interface UseKBEnterpriseBaseOptions<T> {
  context: EnterpriseContext;
  fetchFn: (ctx: EnterpriseContext) => Promise<T>;
  refreshInterval?: number;
  enableTelemetry?: boolean;
  featureFlag?: string;
  cacheKey?: string;
  cacheTTL?: number;
}

export interface UseKBEnterpriseBaseReturn<T> {
  data: T | null;
  status: KBStatus;
  error: KBError | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  refresh: () => Promise<T | void>;
  startAutoRefresh: (intervalMs?: number) => void;
  stopAutoRefresh: () => void;
  isAutoRefreshing: boolean;
}

export function useKBEnterpriseBase<T>({
  context,
  fetchFn,
  refreshInterval = 60000,
  enableTelemetry = true,
  featureFlag,
  cacheKey,
  cacheTTL = 30000,
}: UseKBEnterpriseBaseOptions<T>): UseKBEnterpriseBaseReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  const isEnabled = featureFlag ? useIsFeatureEnabled(featureFlag) : true;
  const cacheRef = useRef<{ data: T; timestamp: number } | null>(null);

  const refresh = useCallback(async (): Promise<T | null> => {
    if (!isEnabled) return null;

    if (cacheRef.current && cacheKey) {
      const age = Date.now() - cacheRef.current.timestamp;
      if (age < cacheTTL) {
        setData(cacheRef.current.data);
        return cacheRef.current.data;
      }
    }

    try {
      const result = await fetchFn(context);
      if (result) {
        setData(result);
        setLastRefresh(new Date());
        if (cacheKey) {
          cacheRef.current = { data: result, timestamp: Date.now() };
        }
      }
      return result;
    } catch (error) {
      console.error('[useKBEnterpriseBase] Error:', error);
      return null;
    }
  }, [context, fetchFn, isEnabled, cacheKey, cacheTTL]);

  const startAutoRefresh = useCallback((intervalMs = refreshInterval) => {
    stopAutoRefresh();
    setIsAutoRefreshing(true);
    refresh();
    autoRefreshRef.current = setInterval(() => refresh(), intervalMs);
  }, [refresh, refreshInterval]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }
    setIsAutoRefreshing(false);
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    data,
    status: 'idle' as KBStatus,
    error: null,
    isLoading: false,
    isSuccess: data !== null,
    isError: false,
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
    isAutoRefreshing,
  };
}

// ============================================================================
// COMPLIANCE MONITOR HOOK
// ============================================================================

export interface UseKBComplianceOptions {
  context: EnterpriseContext;
  sector?: string;
  scanDepth?: 'quick' | 'standard' | 'deep';
  enablePredictions?: boolean;
  autoRefreshInterval?: number;
}

export interface UseKBComplianceReturn {
  // State
  isLoading: boolean;
  error: KBError | null;
  lastRefresh: Date | null;
  
  // Data
  metrics: ComplianceMetrics | null;
  violations: ComplianceViolation[];
  predictedRisks: PredictedRisk[];
  rules: Array<{
    id: string;
    name: string;
    code: string;
    category: string;
    status: 'compliant' | 'non_compliant' | 'warning' | 'pending';
  }>;
  
  // Actions
  refresh: () => Promise<void>;
  runScan: (depth?: 'quick' | 'standard' | 'deep') => Promise<void>;
  resolveViolation: (violationId: string, resolution: Record<string, unknown>) => Promise<boolean>;
  startAutoRefresh: (intervalMs?: number) => void;
  stopAutoRefresh: () => void;
}

export function useKBCompliance({
  context,
  sector = 'general',
  scanDepth = 'standard',
  enablePredictions = true,
  autoRefreshInterval = 120000,
}: UseKBComplianceOptions): UseKBComplianceReturn {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [predictedRisks, setPredictedRisks] = useState<PredictedRisk[]>([]);
  const [rules, setRules] = useState<Array<{
    id: string;
    name: string;
    code: string;
    category: string;
    status: 'compliant' | 'non_compliant' | 'warning' | 'pending';
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  const fetchComplianceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulated API call - replace with actual implementation
      const mockMetrics: ComplianceMetrics = {
        overallScore: 87,
        totalRules: 45,
        compliantRules: 39,
        violations: 4,
        criticalViolations: 1,
        trend: 'improving',
        lastFullScan: new Date().toISOString(),
      };

      const mockViolations: ComplianceViolation[] = [
        {
          id: 'v1',
          ruleName: 'GDPR Art. 17',
          ruleCode: 'GDPR-17',
          severity: 'high',
          description: 'Datos personales sin política de retención definida',
          suggestedAction: 'Configurar política de retención de datos',
          autoResolvable: false,
          detectedAt: new Date().toISOString(),
        },
      ];

      const mockRisks: PredictedRisk[] = enablePredictions ? [
        {
          id: 'r1',
          ruleName: 'PCI-DSS 3.4',
          probability: 0.72,
          expectedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          preventiveAction: 'Renovar certificado de encriptación antes de vencimiento',
          impact: 'high',
        },
      ] : [];

      const mockRules = Array.from({ length: 10 }, (_, i) => ({
        id: `rule-${i}`,
        name: `Regla de Compliance ${i + 1}`,
        code: `RC-${String(i + 1).padStart(3, '0')}`,
        category: ['GDPR', 'PCI-DSS', 'SOX', 'HIPAA'][i % 4],
        status: (['compliant', 'compliant', 'compliant', 'warning', 'non_compliant'] as const)[i % 5],
      }));

      setMetrics(mockMetrics);
      setViolations(mockViolations);
      setPredictedRisks(mockRisks);
      setRules(mockRules);
      setLastRefresh(new Date());

      collectTelemetry({
        hookName: 'useKBCompliance',
        operationName: 'compliance-fetch',
        startTime: new Date(),
        durationMs: 0,
        status: 'success',
        retryCount: 0,
        metadata: { sector, scanDepth },
      });
    } catch (err) {
      const kbError = createKBError(
        'FETCH_ERROR',
        err instanceof Error ? err.message : 'Error fetching compliance data',
        { retryable: true }
      );
      setError(kbError);
    } finally {
      setIsLoading(false);
    }
  }, [sector, scanDepth, enablePredictions]);

  const runScan = useCallback(async (depth: 'quick' | 'standard' | 'deep' = scanDepth) => {
    setIsLoading(true);
    try {
      // Simulate scan
      await new Promise(resolve => setTimeout(resolve, 2000));
      await fetchComplianceData();
    } finally {
      setIsLoading(false);
    }
  }, [scanDepth, fetchComplianceData]);

  const resolveViolation = useCallback(async (
    violationId: string,
    resolution: Record<string, unknown>
  ): Promise<boolean> => {
    try {
      // Simulate resolution
      setViolations(prev => prev.filter(v => v.id !== violationId));
      return true;
    } catch {
      return false;
    }
  }, []);

  const startAutoRefresh = useCallback((intervalMs = autoRefreshInterval) => {
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
    }
    fetchComplianceData();
    autoRefreshRef.current = setInterval(fetchComplianceData, intervalMs);
  }, [fetchComplianceData, autoRefreshInterval]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    isLoading,
    error,
    lastRefresh,
    metrics,
    violations,
    predictedRisks,
    rules,
    refresh: fetchComplianceData,
    runScan,
    resolveViolation,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

// ============================================================================
// COMMAND CENTER HOOK
// ============================================================================

export interface UseKBCommandCenterOptions {
  context: EnterpriseContext;
  includeMetrics?: boolean;
  includeAlerts?: boolean;
  includeLiveActivity?: boolean;
  autoRefreshInterval?: number;
}

export interface UseKBCommandCenterReturn {
  isLoading: boolean;
  error: KBError | null;
  lastRefresh: Date | null;
  
  systemHealth: SystemHealth | null;
  metrics: SystemHealthMetric[];
  alerts: Alert[];
  liveActivity: LiveActivity[];
  
  refresh: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<boolean>;
  escalateAlert: (alertId: string, level?: number) => Promise<boolean>;
  startAutoRefresh: (intervalMs?: number) => void;
  stopAutoRefresh: () => void;
}

export function useKBCommandCenter({
  context,
  includeMetrics = true,
  includeAlerts = true,
  includeLiveActivity = true,
  autoRefreshInterval = 30000,
}: UseKBCommandCenterOptions): UseKBCommandCenterReturn {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<SystemHealthMetric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [liveActivity, setLiveActivity] = useState<LiveActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const mockHealth: SystemHealth = {
        overall: 94,
        status: 'healthy',
        components: [
          { name: 'Database', status: 'healthy', latency: 12, uptime: 99.99 },
          { name: 'API', status: 'healthy', latency: 45, uptime: 99.95 },
          { name: 'Cache', status: 'healthy', latency: 2, uptime: 100 },
          { name: 'Queue', status: 'degraded', latency: 150, uptime: 99.5 },
        ],
        lastCheck: new Date().toISOString(),
      };

      const mockMetrics: SystemHealthMetric[] = includeMetrics ? [
        { name: 'CPU Usage', value: 42, unit: '%', status: 'healthy', threshold: 80 },
        { name: 'Memory', value: 67, unit: '%', status: 'healthy', threshold: 85 },
        { name: 'API Latency', value: 45, unit: 'ms', status: 'healthy', threshold: 200 },
        { name: 'Active Users', value: 1234, unit: '', status: 'healthy' },
      ] : [];

      const mockAlerts: Alert[] = includeAlerts ? [
        {
          id: 'a1',
          title: 'Queue Processing Delayed',
          description: 'Job queue processing time exceeded 5 minutes',
          severity: 'medium',
          source: 'queue-monitor',
          acknowledged: false,
          createdAt: new Date(Date.now() - 300000).toISOString(),
        },
      ] : [];

      const mockActivity: LiveActivity[] = includeLiveActivity ? [
        { id: 'act1', action: 'User Login', target: 'admin@company.com', timestamp: new Date().toISOString() },
        { id: 'act2', action: 'Report Generated', target: 'Monthly Sales', timestamp: new Date(Date.now() - 60000).toISOString() },
        { id: 'act3', action: 'Config Updated', target: 'Email Settings', timestamp: new Date(Date.now() - 120000).toISOString() },
      ] : [];

      setSystemHealth(mockHealth);
      setMetrics(mockMetrics);
      setAlerts(mockAlerts);
      setLiveActivity(mockActivity);
      setLastRefresh(new Date());
    } catch (err) {
      setError(createKBError('FETCH_ERROR', 'Error fetching command center data'));
    } finally {
      setIsLoading(false);
    }
  }, [includeMetrics, includeAlerts, includeLiveActivity]);

  const acknowledgeAlert = useCallback(async (alertId: string): Promise<boolean> => {
    try {
      setAlerts(prev => prev.map(a => 
        a.id === alertId 
          ? { ...a, acknowledged: true, acknowledgedAt: new Date().toISOString() }
          : a
      ));
      return true;
    } catch {
      return false;
    }
  }, []);

  const escalateAlert = useCallback(async (alertId: string, level = 1): Promise<boolean> => {
    try {
      // Simulate escalation
      console.log(`Alert ${alertId} escalated to level ${level}`);
      return true;
    } catch {
      return false;
    }
  }, []);

  const startAutoRefresh = useCallback((intervalMs = autoRefreshInterval) => {
    if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    fetchDashboardData();
    autoRefreshRef.current = setInterval(fetchDashboardData, intervalMs);
  }, [fetchDashboardData, autoRefreshInterval]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    isLoading,
    error,
    lastRefresh,
    systemHealth,
    metrics,
    alerts,
    liveActivity,
    refresh: fetchDashboardData,
    acknowledgeAlert,
    escalateAlert,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

// ============================================================================
// WORKFLOW ENGINE HOOK
// ============================================================================

export interface UseKBWorkflowEngineOptions {
  context: EnterpriseContext;
  enableAIGeneration?: boolean;
  autoRefreshInterval?: number;
}

export interface UseKBWorkflowEngineReturn {
  isLoading: boolean;
  error: KBError | null;
  lastRefresh: Date | null;
  
  workflows: Workflow[];
  executions: WorkflowExecution[];
  rules: AutomationRule[];
  
  refresh: () => Promise<void>;
  executeWorkflow: (workflowId: string, input?: Record<string, unknown>) => Promise<string | null>;
  toggleWorkflow: (workflowId: string, action: 'pause' | 'resume') => Promise<boolean>;
  generateWorkflow: (prompt: string, context?: Record<string, unknown>) => Promise<Workflow | null>;
  startAutoRefresh: (intervalMs?: number) => void;
  stopAutoRefresh: () => void;
}

export function useKBWorkflowEngine({
  context,
  enableAIGeneration = true,
  autoRefreshInterval = 60000,
}: UseKBWorkflowEngineOptions): UseKBWorkflowEngineReturn {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  const fetchWorkflowData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const mockWorkflows: Workflow[] = [
        {
          id: 'wf1',
          name: 'Onboarding Cliente',
          description: 'Proceso automático de alta de cliente',
          status: 'active',
          trigger: { type: 'event', config: { event: 'client.created' } },
          steps: [
            { id: 's1', type: 'email', config: { template: 'welcome' } },
            { id: 's2', type: 'task', config: { assignee: 'gestor' } },
          ],
          executionCount: 156,
          lastExecutedAt: new Date(Date.now() - 3600000).toISOString(),
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'wf2',
          name: 'Recordatorio Pagos',
          description: 'Envío automático de recordatorios',
          status: 'active',
          trigger: { type: 'schedule', config: { cron: '0 9 * * *' } },
          steps: [
            { id: 's1', type: 'query', config: { filter: 'overdue' } },
            { id: 's2', type: 'email', config: { template: 'reminder' } },
          ],
          executionCount: 42,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const mockExecutions: WorkflowExecution[] = [
        {
          id: 'ex1',
          workflowId: 'wf1',
          status: 'completed',
          startedAt: new Date(Date.now() - 3600000).toISOString(),
          completedAt: new Date(Date.now() - 3595000).toISOString(),
          duration: 5000,
          steps: [],
        },
        {
          id: 'ex2',
          workflowId: 'wf2',
          status: 'running',
          startedAt: new Date(Date.now() - 30000).toISOString(),
          steps: [],
        },
      ];

      const mockRules: AutomationRule[] = [
        { id: 'r1', name: 'Auto-asignar gestor', condition: 'company.sector = "banca"', action: 'assign_to_team("banca")', enabled: true, priority: 1, executionCount: 234 },
        { id: 'r2', name: 'Alerta VIP', condition: 'company.tier = "enterprise"', action: 'notify_manager()', enabled: true, priority: 2, executionCount: 56 },
      ];

      setWorkflows(mockWorkflows);
      setExecutions(mockExecutions);
      setRules(mockRules);
      setLastRefresh(new Date());
    } catch (err) {
      setError(createKBError('FETCH_ERROR', 'Error fetching workflow data'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const executeWorkflow = useCallback(async (
    workflowId: string,
    input?: Record<string, unknown>
  ): Promise<string | null> => {
    try {
      const executionId = `ex-${Date.now()}`;
      const newExecution: WorkflowExecution = {
        id: executionId,
        workflowId,
        status: 'running',
        startedAt: new Date().toISOString(),
        steps: [],
      };
      setExecutions(prev => [newExecution, ...prev]);
      return executionId;
    } catch {
      return null;
    }
  }, []);

  const toggleWorkflow = useCallback(async (
    workflowId: string,
    action: 'pause' | 'resume'
  ): Promise<boolean> => {
    try {
      setWorkflows(prev => prev.map(w =>
        w.id === workflowId
          ? { ...w, status: action === 'pause' ? 'paused' : 'active' }
          : w
      ));
      return true;
    } catch {
      return false;
    }
  }, []);

  const generateWorkflow = useCallback(async (
    prompt: string,
    ctx?: Record<string, unknown>
  ): Promise<Workflow | null> => {
    if (!enableAIGeneration) return null;

    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newWorkflow: Workflow = {
        id: `wf-${Date.now()}`,
        name: `Workflow Generado: ${prompt.slice(0, 30)}...`,
        description: prompt,
        status: 'draft',
        trigger: { type: 'manual', config: {} },
        steps: [
          { id: 's1', type: 'condition', config: { expression: 'generated' } },
          { id: 's2', type: 'action', config: { type: 'notify' } },
        ],
        executionCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setWorkflows(prev => [newWorkflow, ...prev]);
      return newWorkflow;
    } catch {
      return null;
    }
  }, [enableAIGeneration]);

  const startAutoRefresh = useCallback((intervalMs = autoRefreshInterval) => {
    if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    fetchWorkflowData();
    autoRefreshRef.current = setInterval(fetchWorkflowData, intervalMs);
  }, [fetchWorkflowData, autoRefreshInterval]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    isLoading,
    error,
    lastRefresh,
    workflows,
    executions,
    rules,
    refresh: fetchWorkflowData,
    executeWorkflow,
    toggleWorkflow,
    generateWorkflow,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

// ============================================================================
// BUSINESS INTELLIGENCE HOOK
// ============================================================================

export interface UseKBBusinessIntelligenceOptions {
  context: EnterpriseContext;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  enableInsights?: boolean;
  enablePredictions?: boolean;
  autoRefreshInterval?: number;
}

export interface UseKBBusinessIntelligenceReturn {
  isLoading: boolean;
  error: KBError | null;
  lastRefresh: Date | null;
  
  kpis: KPI[];
  insights: BIInsight[];
  predictions: Prediction[];
  correlations: Correlation[];
  
  refresh: () => Promise<void>;
  generateInsights: () => Promise<BIInsight[]>;
  askQuestion: (question: string) => Promise<string | null>;
  exportData: (format: 'csv' | 'json' | 'excel') => Promise<void>;
  startAutoRefresh: (intervalMs?: number) => void;
  stopAutoRefresh: () => void;
}

export function useKBBusinessIntelligence({
  context,
  timeRange = '30d',
  enableInsights = true,
  enablePredictions = true,
  autoRefreshInterval = 90000,
}: UseKBBusinessIntelligenceOptions): UseKBBusinessIntelligenceReturn {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [insights, setInsights] = useState<BIInsight[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  const fetchBIData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const mockKpis: KPI[] = [
        { id: 'kpi1', name: 'Revenue', value: 1250000, unit: '€', trend: 'up', change: 12.5, target: 1500000 },
        { id: 'kpi2', name: 'Active Clients', value: 456, trend: 'up', change: 8.2 },
        { id: 'kpi3', name: 'Churn Rate', value: 2.3, unit: '%', trend: 'down', change: -0.5 },
        { id: 'kpi4', name: 'NPS Score', value: 72, trend: 'stable', change: 0 },
        { id: 'kpi5', name: 'Avg. Deal Size', value: 45000, unit: '€', trend: 'up', change: 5.1 },
        { id: 'kpi6', name: 'Conversion Rate', value: 23.5, unit: '%', trend: 'up', change: 2.3 },
      ];

      const mockInsights: BIInsight[] = enableInsights ? [
        {
          id: 'ins1',
          type: 'anomaly',
          title: 'Pico inusual de registros',
          description: 'Se detectó un aumento del 340% en registros el día 15',
          severity: 'medium',
          confidence: 0.92,
          suggestedActions: ['Verificar fuente de tráfico', 'Analizar calidad de leads'],
          generatedAt: new Date().toISOString(),
        },
        {
          id: 'ins2',
          type: 'trend',
          title: 'Tendencia positiva en sector tech',
          description: 'Los clientes del sector tecnológico muestran 25% más engagement',
          severity: 'low',
          confidence: 0.87,
          suggestedActions: ['Considerar campaña específica para tech'],
          generatedAt: new Date().toISOString(),
        },
      ] : [];

      const mockPredictions: Prediction[] = enablePredictions ? [
        {
          id: 'pred1',
          metric: 'Revenue Q1 2025',
          confidence: 0.85,
          horizon: '3 months',
          scenarios: [
            { name: 'Optimista', value: '€1.8M', probability: 0.25 },
            { name: 'Base', value: '€1.5M', probability: 0.55 },
            { name: 'Pesimista', value: '€1.2M', probability: 0.20 },
          ],
        },
        {
          id: 'pred2',
          metric: 'Churn Rate',
          confidence: 0.78,
          horizon: '6 months',
          scenarios: [
            { name: 'Best', value: '1.8%', probability: 0.30 },
            { name: 'Expected', value: '2.5%', probability: 0.50 },
            { name: 'Worst', value: '3.5%', probability: 0.20 },
          ],
        },
      ] : [];

      const mockCorrelations: Correlation[] = [
        { id: 'corr1', metrics: ['NPS', 'Revenue'], coefficient: 0.72, significance: 0.001, description: 'Fuerte correlación positiva' },
        { id: 'corr2', metrics: ['Response Time', 'Churn'], coefficient: 0.58, significance: 0.01, description: 'Correlación moderada' },
      ];

      setKpis(mockKpis);
      setInsights(mockInsights);
      setPredictions(mockPredictions);
      setCorrelations(mockCorrelations);
      setLastRefresh(new Date());
    } catch (err) {
      setError(createKBError('FETCH_ERROR', 'Error fetching BI data'));
    } finally {
      setIsLoading(false);
    }
  }, [enableInsights, enablePredictions]);

  const generateInsights = useCallback(async (): Promise<BIInsight[]> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const newInsight: BIInsight = {
        id: `ins-${Date.now()}`,
        type: 'recommendation',
        title: 'Insight Generado por IA',
        description: 'Basado en los patrones recientes, se recomienda optimizar el proceso de onboarding',
        severity: 'medium',
        confidence: 0.82,
        suggestedActions: ['Reducir pasos de registro', 'Añadir tutorial interactivo'],
        generatedAt: new Date().toISOString(),
      };
      setInsights(prev => [newInsight, ...prev]);
      return [newInsight];
    } catch {
      return [];
    }
  }, []);

  const askQuestion = useCallback(async (question: string): Promise<string | null> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return `Basado en el análisis de datos de ${timeRange}:\n\nLa respuesta a "${question}" indica que los principales indicadores muestran una tendencia positiva con un crecimiento del 12.5% en revenue y una mejora del NPS en 3 puntos.`;
    } catch {
      return null;
    }
  }, [timeRange]);

  const exportData = useCallback(async (format: 'csv' | 'json' | 'excel') => {
    console.log(`Exporting data in ${format} format`);
  }, []);

  const startAutoRefresh = useCallback((intervalMs = autoRefreshInterval) => {
    if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    fetchBIData();
    autoRefreshRef.current = setInterval(fetchBIData, intervalMs);
  }, [fetchBIData, autoRefreshInterval]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    isLoading,
    error,
    lastRefresh,
    kpis,
    insights,
    predictions,
    correlations,
    refresh: fetchBIData,
    generateInsights,
    askQuestion,
    exportData,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

// ============================================================================
// UNIFIED ENTERPRISE HOOK
// ============================================================================

export interface UseKBEnterpriseAllOptions {
  context: EnterpriseContext;
  enableCompliance?: boolean;
  enableCommandCenter?: boolean;
  enableWorkflows?: boolean;
  enableBI?: boolean;
}

export interface UseKBEnterpriseAllReturn {
  compliance: UseKBComplianceReturn | null;
  commandCenter: UseKBCommandCenterReturn | null;
  workflowEngine: UseKBWorkflowEngineReturn | null;
  businessIntelligence: UseKBBusinessIntelligenceReturn | null;
  refreshAll: () => Promise<void>;
  isLoading: boolean;
}

export function useKBEnterpriseAll({
  context,
  enableCompliance = true,
  enableCommandCenter = true,
  enableWorkflows = true,
  enableBI = true,
}: UseKBEnterpriseAllOptions): UseKBEnterpriseAllReturn {
  const compliance = enableCompliance ? useKBCompliance({ context }) : null;
  const commandCenter = enableCommandCenter ? useKBCommandCenter({ context }) : null;
  const workflowEngine = enableWorkflows ? useKBWorkflowEngine({ context }) : null;
  const businessIntelligence = enableBI ? useKBBusinessIntelligence({ context }) : null;

  const refreshAll = useCallback(async () => {
    await Promise.all([
      compliance?.refresh(),
      commandCenter?.refresh(),
      workflowEngine?.refresh(),
      businessIntelligence?.refresh(),
    ]);
  }, [compliance, commandCenter, workflowEngine, businessIntelligence]);

  const isLoading = useMemo(() => {
    return (compliance?.isLoading || false) ||
           (commandCenter?.isLoading || false) ||
           (workflowEngine?.isLoading || false) ||
           (businessIntelligence?.isLoading || false);
  }, [compliance?.isLoading, commandCenter?.isLoading, workflowEngine?.isLoading, businessIntelligence?.isLoading]);

  return {
    compliance,
    commandCenter,
    workflowEngine,
    businessIntelligence,
    refreshAll,
    isLoading,
  };
}

export default useKBEnterpriseBase;
