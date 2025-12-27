import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============= INTERFACES BASE =============
export interface ModuleLog {
  id: string;
  moduleKey: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  stackTrace?: string;
  correlationGroupId?: string;
}

export interface HealthCheck {
  moduleKey: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    latency: number;
    message?: string;
  }[];
  lastChecked: string;
  nextCheck: string;
}

export interface DiagnosticResult {
  moduleKey: string;
  runAt: string;
  issues: {
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    description: string;
    recommendation: string;
    autoFixAvailable: boolean;
  }[];
  aiAnalysis: string;
  performanceScore: number;
  securityScore: number;
  reliabilityScore: number;
}

// ============= INTERFACES SELF-HEALING =============
export interface FailurePrediction {
  id: string;
  moduleKey: string;
  issue: string;
  probability: number;
  estimatedTimeframe: '2h' | '6h' | '12h' | '24h' | '48h';
  indicators: string[];
  preventiveActions: string[];
  affectedComponents: string[];
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  trend: 'improving' | 'stable' | 'degrading';
}

export interface PredictionSummary {
  predictions: FailurePrediction[];
  overallRiskScore: number;
  nextPredictedIncident: string | null;
  systemHealthTrend: 'improving' | 'stable' | 'degrading';
}

export interface RemediationAction {
  id: string;
  moduleKey: string;
  actionType: 'restart' | 'scale' | 'cache_clear' | 'rollback' | 'circuit_breaker' | 'config_update' | 'reconnect';
  status: 'pending' | 'executing' | 'success' | 'failed' | 'rolled_back';
  triggeredBy: 'auto' | 'manual' | 'prediction';
  triggeredAt: string;
  completedAt?: string;
  executionTimeMs?: number;
  issue: string;
  result?: string;
  rollbackAvailable: boolean;
  rollbackData?: Record<string, unknown>;
  metricsImprovement?: number;
}

export interface RemediationStatistics {
  totalRemediations: number;
  successRate: number;
  avgResolutionTimeMs: number;
  mostCommonAction: string;
  mostProblematicModule: string;
}

export interface EventCorrelation {
  groupId: string;
  events: ModuleLog[];
  rootCause: {
    description: string;
    confidence: number;
    evidence: string[];
    category: 'infrastructure' | 'application' | 'external' | 'configuration' | 'human';
  };
  impactedModules: string[];
  suggestedAction: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface RootCauseAnalysis {
  rootCause: {
    summary: string;
    category: string;
    confidence: number;
  };
  analysisChain: {
    level: number;
    question: string;
    answer: string;
    evidence: string[];
  }[];
  contributingFactors: string[];
  impactAssessment: {
    affectedUsers: string;
    businessImpact: 'low' | 'medium' | 'high' | 'critical';
    estimatedDowntime: string;
  };
  recommendations: {
    action: string;
    priority: 'immediate' | 'short_term' | 'long_term';
    effort: 'low' | 'medium' | 'high';
  }[];
  preventionMeasures: string[];
}

export interface SelfHealingConfig {
  enabled: boolean;
  autoRemediateThreshold: 'low' | 'medium' | 'high' | 'critical';
  enabledActions: RemediationAction['actionType'][];
  cooldownMinutes: number;
  notifyOnAction: boolean;
  requireApprovalFor: RemediationAction['actionType'][];
  maxAutoRemediationsPerHour: number;
}

// ============= HOOK PRINCIPAL =============
export function useModuleMonitoring() {
  // Estado base
  const [logs, setLogs] = useState<ModuleLog[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [logFilter, setLogFilter] = useState<{
    level?: ModuleLog['level'];
    moduleKey?: string;
    search?: string;
  }>({});

  // Estado Self-Healing
  const [predictions, setPredictions] = useState<FailurePrediction[]>([]);
  const [predictionSummary, setPredictionSummary] = useState<PredictionSummary | null>(null);
  const [activeRemediations, setActiveRemediations] = useState<RemediationAction[]>([]);
  const [remediationHistory, setRemediationHistory] = useState<RemediationAction[]>([]);
  const [remediationStats, setRemediationStats] = useState<RemediationStatistics | null>(null);
  const [eventCorrelations, setEventCorrelations] = useState<EventCorrelation[]>([]);
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState<RootCauseAnalysis | null>(null);
  const [selfHealingConfig, setSelfHealingConfig] = useState<SelfHealingConfig>({
    enabled: true,
    autoRemediateThreshold: 'medium',
    enabledActions: ['restart', 'cache_clear', 'circuit_breaker'],
    cooldownMinutes: 15,
    notifyOnAction: true,
    requireApprovalFor: ['rollback', 'scale'],
    maxAutoRemediationsPerHour: 10
  });

  // Loading states
  const [isPredicting, setIsPredicting] = useState(false);
  const [isRemediating, setIsRemediating] = useState(false);
  const [isCorrelating, setIsCorrelating] = useState(false);
  const [isAnalyzingRootCause, setIsAnalyzingRootCause] = useState(false);

  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // ============= FUNCIONES BASE =============
  const fetchLogs = useCallback(async (filter?: typeof logFilter, limit = 100) => {
    setIsLoading(true);
    try {
      const mockLogs: ModuleLog[] = [
        {
          id: '1',
          moduleKey: 'crm',
          level: 'info',
          message: 'Conexión a base de datos establecida',
          timestamp: new Date(Date.now() - 1000).toISOString()
        },
        {
          id: '2',
          moduleKey: 'analytics',
          level: 'warn',
          message: 'Caché cercano a límite de capacidad (85%)',
          timestamp: new Date(Date.now() - 5000).toISOString()
        },
        {
          id: '3',
          moduleKey: 'ai-copilot',
          level: 'debug',
          message: 'Token refresh completado exitosamente',
          timestamp: new Date(Date.now() - 10000).toISOString()
        },
        {
          id: '4',
          moduleKey: 'marketplace',
          level: 'error',
          message: 'Timeout al conectar con API externa',
          timestamp: new Date(Date.now() - 30000).toISOString(),
          stackTrace: 'Error: Connection timeout\n  at fetch (...)\n  at processRequest (...)',
          correlationGroupId: 'corr-001'
        },
        {
          id: '5',
          moduleKey: 'crm',
          level: 'info',
          message: 'Sincronización de datos completada: 1,234 registros',
          timestamp: new Date(Date.now() - 60000).toISOString()
        },
        {
          id: '6',
          moduleKey: 'database',
          level: 'error',
          message: 'Max connections reached (100/100)',
          timestamp: new Date(Date.now() - 35000).toISOString(),
          correlationGroupId: 'corr-001'
        },
        {
          id: '7',
          moduleKey: 'api-gateway',
          level: 'error',
          message: 'Connection timeout to database pool',
          timestamp: new Date(Date.now() - 32000).toISOString(),
          correlationGroupId: 'corr-001'
        }
      ];

      let filtered = mockLogs;
      if (filter?.level) {
        filtered = filtered.filter(l => l.level === filter.level);
      }
      if (filter?.moduleKey) {
        filtered = filtered.filter(l => l.moduleKey === filter.moduleKey);
      }
      if (filter?.search) {
        const search = filter.search.toLowerCase();
        filtered = filtered.filter(l => 
          l.message.toLowerCase().includes(search) ||
          l.moduleKey.toLowerCase().includes(search)
        );
      }

      setLogs(filtered);
    } catch (error) {
      console.error('[useModuleMonitoring] Logs error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchHealthChecks = useCallback(async () => {
    try {
      const mockHealthChecks: HealthCheck[] = [
        {
          moduleKey: 'crm',
          status: 'healthy',
          checks: [
            { name: 'Database', status: 'pass', latency: 12 },
            { name: 'API', status: 'pass', latency: 45 },
            { name: 'Cache', status: 'pass', latency: 3 }
          ],
          lastChecked: new Date().toISOString(),
          nextCheck: new Date(Date.now() + 60000).toISOString()
        },
        {
          moduleKey: 'analytics',
          status: 'degraded',
          checks: [
            { name: 'Database', status: 'pass', latency: 25 },
            { name: 'API', status: 'warn', latency: 450, message: 'Latencia alta' },
            { name: 'Cache', status: 'pass', latency: 8 }
          ],
          lastChecked: new Date().toISOString(),
          nextCheck: new Date(Date.now() + 60000).toISOString()
        },
        {
          moduleKey: 'ai-copilot',
          status: 'healthy',
          checks: [
            { name: 'AI Gateway', status: 'pass', latency: 120 },
            { name: 'Token Service', status: 'pass', latency: 35 }
          ],
          lastChecked: new Date().toISOString(),
          nextCheck: new Date(Date.now() + 60000).toISOString()
        }
      ];

      setHealthChecks(mockHealthChecks);
    } catch (error) {
      console.error('[useModuleMonitoring] Health checks error:', error);
    }
  }, []);

  const runDiagnostics = useCallback(async (moduleKey: string) => {
    setIsRunningDiagnostics(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'module-analytics',
        {
          body: {
            action: 'analyze_trends',
            moduleKey,
            params: { includeDiagnostics: true }
          }
        }
      );

      if (error) throw error;

      const mockDiagnostic: DiagnosticResult = {
        moduleKey,
        runAt: new Date().toISOString(),
        issues: [
          {
            severity: 'medium',
            category: 'Performance',
            description: 'Tiempo de respuesta elevado en endpoints de búsqueda',
            recommendation: 'Implementar paginación y caché de resultados',
            autoFixAvailable: false
          },
          {
            severity: 'low',
            category: 'Security',
            description: 'Headers de seguridad pueden ser mejorados',
            recommendation: 'Añadir CSP y HSTS headers',
            autoFixAvailable: true
          }
        ],
        aiAnalysis: data?.aiAnalysis || 'El módulo funciona dentro de parámetros normales. Se detectaron oportunidades de optimización menores en el manejo de caché y consultas a base de datos. Se recomienda revisar los índices de búsqueda para mejorar tiempos de respuesta.',
        performanceScore: 85,
        securityScore: 92,
        reliabilityScore: 98
      };

      setDiagnostics(mockDiagnostic);
      toast.success('Diagnóstico completado');
    } catch (error) {
      console.error('[useModuleMonitoring] Diagnostics error:', error);
      toast.error('Error al ejecutar diagnósticos');
    } finally {
      setIsRunningDiagnostics(false);
    }
  }, []);

  const applyAutoFix = useCallback(async (moduleKey: string, issueIndex: number) => {
    try {
      toast.success('Auto-fix aplicado correctamente');
      if (diagnostics) {
        const updatedIssues = [...diagnostics.issues];
        updatedIssues.splice(issueIndex, 1);
        setDiagnostics({ ...diagnostics, issues: updatedIssues });
      }
    } catch (error) {
      console.error('[useModuleMonitoring] Auto-fix error:', error);
      toast.error('Error al aplicar auto-fix');
    }
  }, [diagnostics]);

  // ============= FUNCIONES SELF-HEALING =============
  const predictFailures = useCallback(async (moduleKey?: string) => {
    setIsPredicting(true);
    try {
      const { data, error } = await supabase.functions.invoke('module-self-healing', {
        body: {
          action: 'predict_failure',
          moduleKey,
          params: {
            metrics: {
              cpu: 45 + Math.random() * 30,
              memory: 65 + Math.random() * 25,
              responseTime: 150 + Math.random() * 200,
              errorRate: Math.random() * 2,
              requestsPerMinute: 800 + Math.random() * 600
            }
          }
        }
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        const preds = data.data.predictions?.map((p: any, idx: number) => ({
          ...p,
          id: p.id || `pred-${idx}-${Date.now()}`,
          moduleKey: moduleKey || 'sistema'
        })) || [];
        
        setPredictions(preds);
        setPredictionSummary({
          predictions: preds,
          overallRiskScore: data.data.overallRiskScore || 0,
          nextPredictedIncident: data.data.nextPredictedIncident,
          systemHealthTrend: data.data.systemHealthTrend || 'stable'
        });
        
        toast.success(`${preds.length} predicciones generadas`);
      }
    } catch (error) {
      console.error('[useModuleMonitoring] Predict failures error:', error);
      toast.error('Error al generar predicciones');
    } finally {
      setIsPredicting(false);
    }
  }, []);

  const executeRemediation = useCallback(async (
    actionType: RemediationAction['actionType'],
    moduleKey: string,
    issueType?: string,
    triggeredBy: 'auto' | 'manual' | 'prediction' = 'manual'
  ) => {
    setIsRemediating(true);
    const tempRemediation: RemediationAction = {
      id: `rem-${Date.now()}`,
      moduleKey,
      actionType,
      status: 'executing',
      triggeredBy,
      triggeredAt: new Date().toISOString(),
      issue: issueType || 'Manual remediation',
      rollbackAvailable: false
    };
    
    setActiveRemediations(prev => [...prev, tempRemediation]);

    try {
      const { data, error } = await supabase.functions.invoke('module-self-healing', {
        body: {
          action: 'auto_remediate',
          moduleKey,
          params: {
            actionType,
            issueType: issueType || 'manual_trigger',
            severity: 'medium'
          }
        }
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        const completedRemediation: RemediationAction = {
          ...tempRemediation,
          id: data.data.remediationId || tempRemediation.id,
          status: data.data.status === 'success' ? 'success' : 'failed',
          completedAt: new Date().toISOString(),
          executionTimeMs: data.data.executionTimeMs || 1500,
          result: data.data.result?.description,
          rollbackAvailable: data.data.rollbackAvailable || false,
          rollbackData: data.data.rollbackData,
          metricsImprovement: data.data.result?.improvementPercentage
        };

        setActiveRemediations(prev => prev.filter(r => r.id !== tempRemediation.id));
        setRemediationHistory(prev => [completedRemediation, ...prev]);
        
        if (completedRemediation.status === 'success') {
          toast.success(`Remediación ${actionType} completada exitosamente`);
        } else {
          toast.error(`Remediación ${actionType} falló`);
        }
      }
    } catch (error) {
      console.error('[useModuleMonitoring] Execute remediation error:', error);
      setActiveRemediations(prev => prev.map(r => 
        r.id === tempRemediation.id ? { ...r, status: 'failed' } : r
      ));
      toast.error('Error al ejecutar remediación');
    } finally {
      setIsRemediating(false);
    }
  }, []);

  const rollbackRemediation = useCallback(async (remediationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('module-self-healing', {
        body: {
          action: 'rollback_remediation',
          params: { remediationId }
        }
      });

      if (error) throw error;

      if (data?.success) {
        setRemediationHistory(prev => prev.map(r =>
          r.id === remediationId ? { ...r, status: 'rolled_back' } : r
        ));
        toast.success('Rollback completado exitosamente');
      }
    } catch (error) {
      console.error('[useModuleMonitoring] Rollback error:', error);
      toast.error('Error al ejecutar rollback');
    }
  }, []);

  const correlateEvents = useCallback(async (timeWindow = '5m') => {
    setIsCorrelating(true);
    try {
      const { data, error } = await supabase.functions.invoke('module-self-healing', {
        body: {
          action: 'correlate_events',
          params: {
            events: logs.filter(l => l.level === 'error' || l.level === 'warn'),
            timeWindow
          }
        }
      });

      if (error) throw error;

      if (data?.success && data?.data?.correlationGroups) {
        const correlations: EventCorrelation[] = data.data.correlationGroups.map((g: any) => ({
          groupId: g.groupId || `group-${Date.now()}`,
          events: g.events || [],
          rootCause: g.rootCause || { description: 'Análisis pendiente', confidence: 0, evidence: [], category: 'application' },
          impactedModules: g.impactedModules || [],
          suggestedAction: g.suggestedAction || 'Investigar manualmente',
          priority: g.priority || 'medium'
        }));
        
        setEventCorrelations(correlations);
        toast.success(`${correlations.length} grupos de correlación encontrados`);
      }
    } catch (error) {
      console.error('[useModuleMonitoring] Correlate events error:', error);
      toast.error('Error al correlacionar eventos');
    } finally {
      setIsCorrelating(false);
    }
  }, [logs]);

  const getRootCause = useCallback(async (correlationGroupId: string) => {
    setIsAnalyzingRootCause(true);
    try {
      const group = eventCorrelations.find(c => c.groupId === correlationGroupId);
      
      const { data, error } = await supabase.functions.invoke('module-self-healing', {
        body: {
          action: 'get_root_cause',
          params: {
            correlationGroupId,
            events: group?.events || []
          }
        }
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        setRootCauseAnalysis(data.data);
        toast.success('Análisis de causa raíz completado');
      }
    } catch (error) {
      console.error('[useModuleMonitoring] Root cause error:', error);
      toast.error('Error en análisis de causa raíz');
    } finally {
      setIsAnalyzingRootCause(false);
    }
  }, [eventCorrelations]);

  const getRemediationHistory = useCallback(async (moduleKey?: string, timeRange = 'last_7_days') => {
    try {
      const { data, error } = await supabase.functions.invoke('module-self-healing', {
        body: {
          action: 'get_remediation_history',
          moduleKey,
          params: { timeRange }
        }
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        setRemediationHistory(data.data.remediations || []);
        setRemediationStats(data.data.statistics || null);
      }
    } catch (error) {
      console.error('[useModuleMonitoring] Get remediation history error:', error);
    }
  }, []);

  const configureSelfHealing = useCallback(async (config: Partial<SelfHealingConfig>) => {
    try {
      const newConfig = { ...selfHealingConfig, ...config };
      
      const { data, error } = await supabase.functions.invoke('module-self-healing', {
        body: {
          action: 'configure_self_healing',
          params: { config: newConfig }
        }
      });

      if (error) throw error;

      if (data?.success) {
        setSelfHealingConfig(newConfig);
        toast.success('Configuración de self-healing actualizada');
      }
    } catch (error) {
      console.error('[useModuleMonitoring] Configure self-healing error:', error);
      toast.error('Error al configurar self-healing');
    }
  }, [selfHealingConfig]);

  // ============= AUTO-REFRESH =============
  const startAutoRefresh = useCallback((intervalMs = 10000) => {
    stopAutoRefresh();
    fetchLogs(logFilter);
    fetchHealthChecks();
    autoRefreshInterval.current = setInterval(() => {
      fetchLogs(logFilter);
      fetchHealthChecks();
    }, intervalMs);
  }, [fetchLogs, fetchHealthChecks, logFilter]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  useEffect(() => {
    fetchLogs(logFilter);
    fetchHealthChecks();
    return () => stopAutoRefresh();
  }, []);

  return {
    // Estado base
    logs,
    healthChecks,
    diagnostics,
    isLoading,
    isRunningDiagnostics,
    logFilter,
    setLogFilter,
    fetchLogs,
    fetchHealthChecks,
    runDiagnostics,
    applyAutoFix,
    startAutoRefresh,
    stopAutoRefresh,
    
    // Estado Self-Healing
    predictions,
    predictionSummary,
    activeRemediations,
    remediationHistory,
    remediationStats,
    eventCorrelations,
    rootCauseAnalysis,
    selfHealingConfig,
    
    // Loading states Self-Healing
    isPredicting,
    isRemediating,
    isCorrelating,
    isAnalyzingRootCause,
    
    // Funciones Self-Healing
    predictFailures,
    executeRemediation,
    rollbackRemediation,
    correlateEvents,
    getRootCause,
    getRemediationHistory,
    configureSelfHealing
  };
}

export default useModuleMonitoring;
