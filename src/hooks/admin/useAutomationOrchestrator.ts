import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'loop' | 'parallel' | 'wait' | 'subprocess';
  config: {
    action: string;
    params: Record<string, unknown>;
    timeout: number;
    retries: number;
  };
  connections: {
    onSuccess: string;
    onFailure: string;
    conditions: Array<{ when: string; goto: string }>;
  };
  position: { x: number; y: number };
}

export interface WorkflowTrigger {
  id: string;
  type: 'schedule' | 'event' | 'webhook' | 'condition' | 'manual';
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface Workflow {
  workflow: {
    id: string;
    name: string;
    description: string;
    version: string;
    status: 'draft' | 'active' | 'paused';
    category: string;
  };
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  variables: Array<{ name: string; type: string; defaultValue: unknown }>;
  errorHandling: {
    strategy: 'retry' | 'skip' | 'abort' | 'fallback';
    maxRetries: number;
    notifyOnError: boolean;
  };
  metadata: {
    createdBy: string;
    estimatedDuration: string;
    complexity: 'low' | 'medium' | 'high';
  };
}

export interface StepResult {
  stepId: string;
  stepName: string;
  status: 'completed' | 'failed' | 'skipped';
  output: Record<string, unknown>;
  duration: number;
  logs: string[];
}

export interface ExecutionError {
  stepId: string;
  error: string;
  recoverable: boolean;
  suggestion: string;
}

export interface WorkflowExecution {
  execution: {
    id: string;
    workflowId: string;
    status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
    startedAt: string;
    completedAt: string;
    duration: number;
  };
  currentStep: {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  };
  stepResults: StepResult[];
  variables: Record<string, unknown>;
  progress: {
    completedSteps: number;
    totalSteps: number;
    percentage: number;
  };
  errors: ExecutionError[];
  nextActions: string[];
}

export interface ScheduleConfig {
  schedule: {
    id: string;
    name: string;
    workflowId: string;
    status: 'active' | 'paused' | 'completed';
  };
  timing: {
    type: 'once' | 'recurring' | 'event-driven';
    cronExpression: string;
    timezone: string;
    nextRun: string;
    lastRun: string;
  };
  recurrence: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
    interval: number;
    daysOfWeek: number[];
    endDate: string;
    maxExecutions: number;
  };
  conditions: Array<{
    type: 'time_window' | 'resource_availability' | 'dependency';
    config: Record<string, unknown>;
  }>;
  executionHistory: Array<{
    runId: string;
    startedAt: string;
    status: 'success' | 'failed';
    duration: number;
  }>;
  optimization: {
    suggestedTime: string;
    reason: string;
    resourceUsage: 'low' | 'medium' | 'high';
  };
}

export interface TriggerCondition {
  name: string;
  expression: string;
  currentValue: unknown;
  threshold: unknown;
  met: boolean;
}

export interface TriggerEvent {
  type: string;
  source: string;
  timestamp: string;
  relevance: number;
  data: Record<string, unknown>;
}

export interface TriggerAnalysis {
  analysis: {
    triggerId: string;
    shouldFire: boolean;
    confidence: number;
    reason: string;
  };
  conditions: TriggerCondition[];
  events: TriggerEvent[];
  patterns: Array<{
    name: string;
    detected: boolean;
    frequency: string;
    lastOccurrence: string;
  }>;
  recommendations: Array<{
    action: 'fire' | 'wait' | 'modify' | 'disable';
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  relatedTriggers: Array<{
    triggerId: string;
    relationship: 'dependent' | 'conflicting' | 'complementary';
  }>;
}

export interface ProcessOptimization {
  id: string;
  type: 'parallelization' | 'caching' | 'batching' | 'elimination' | 'reordering';
  target: string;
  description: string;
  expectedImprovement: {
    duration: number;
    resources: number;
    reliability: number;
  };
  effort: 'low' | 'medium' | 'high';
  priority: number;
}

export interface OptimizationResult {
  currentState: {
    avgDuration: number;
    successRate: number;
    resourceUsage: number;
    bottlenecks: string[];
  };
  optimizations: ProcessOptimization[];
  projectedState: {
    avgDuration: number;
    successRate: number;
    resourceUsage: number;
    improvement: number;
  };
  implementationPlan: Array<{
    step: number;
    optimization: string;
    action: string;
    dependencies: string[];
  }>;
  risks: Array<{
    description: string;
    probability: number;
    mitigation: string;
  }>;
}

export interface DataMapping {
  sourceField: string;
  targetField: string;
  transformation: string;
  required: boolean;
}

export interface Integration {
  integration: {
    id: string;
    name: string;
    sourceSystem: string;
    targetSystem: string;
    type: 'sync' | 'async' | 'streaming' | 'batch';
  };
  connection: {
    source: {
      type: 'rest' | 'graphql' | 'database' | 'file' | 'queue';
      endpoint: string;
      authentication: {
        type: 'oauth2' | 'apiKey' | 'basic' | 'jwt';
        config: Record<string, unknown>;
      };
    };
    target: {
      type: 'rest' | 'graphql' | 'database' | 'file' | 'queue';
      endpoint: string;
      authentication: Record<string, unknown>;
    };
  };
  dataMapping: DataMapping[];
  syncConfig: {
    frequency: string;
    mode: 'full' | 'incremental' | 'realtime';
    conflictResolution: 'source_wins' | 'target_wins' | 'manual';
  };
  errorHandling: {
    retryPolicy: Record<string, unknown>;
    deadLetterQueue: string;
    alerting: Record<string, unknown>;
  };
  codeSnippets: {
    source: string;
    transform: string;
    target: string;
  };
}

export interface AutomationStatus {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'inactive';
  lastRun: string;
  nextRun: string;
  successRate: number;
  avgDuration: number;
  trend: 'improving' | 'stable' | 'degrading';
}

export interface MonitoringAlert {
  id: string;
  automationId: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface MonitoringOverview {
  overview: {
    totalAutomations: number;
    activeExecutions: number;
    successRate24h: number;
    avgDuration: number;
    healthScore: number;
  };
  automations: AutomationStatus[];
  alerts: MonitoringAlert[];
  metrics: {
    executionsPerHour: number[];
    errorRate: number[];
    latency: number[];
  };
  recommendations: Array<{
    type: 'optimization' | 'maintenance' | 'scaling';
    target: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface ExceptionHandling {
  exception: {
    id: string;
    type: string;
    message: string;
    source: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  diagnosis: {
    rootCause: string;
    affectedComponents: string[];
    impact: string;
    frequency: 'isolated' | 'recurring' | 'pattern';
  };
  resolution: {
    automatic: boolean;
    action: 'retry' | 'skip' | 'rollback' | 'manual' | 'escalate';
    steps: string[];
    estimatedTime: string;
  };
  recovery: {
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    result: Record<string, unknown>;
    rollbackAvailable: boolean;
  };
  prevention: {
    suggestions: string[];
    configChanges: Record<string, unknown>;
    monitoring: string[];
  };
  escalation: {
    required: boolean;
    level: number;
    notifyUsers: string[];
    deadline: string;
  };
}

export interface BatchOperation {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  duration: number;
}

export interface BatchResult {
  batch: {
    id: string;
    name: string;
    status: 'queued' | 'processing' | 'completed' | 'failed' | 'partial';
    priority: number;
  };
  operations: BatchOperation[];
  progress: {
    total: number;
    completed: number;
    failed: number;
    remaining: number;
    percentage: number;
    eta: string;
  };
  performance: {
    throughput: number;
    avgOperationTime: number;
    parallelism: number;
    memoryUsage: number;
  };
  errors: Array<{
    operationId: string;
    error: string;
    retryable: boolean;
  }>;
  checkpoints: Array<{
    position: number;
    timestamp: string;
    state: Record<string, unknown>;
  }>;
}

export interface RoutingCandidate {
  id: string;
  name: string;
  type: 'user' | 'team' | 'system' | 'queue';
  score: number;
  availability: number;
  skills: string[];
  currentLoad: number;
  avgResponseTime: number;
}

export interface RoutingResult {
  routing: {
    taskId: string;
    taskType: string;
    assignedTo: string;
    confidence: number;
    reason: string;
  };
  candidates: RoutingCandidate[];
  factors: Array<{
    name: string;
    weight: number;
    value: number;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  sla: {
    target: string;
    probability: number;
    risk: 'low' | 'medium' | 'high';
  };
  alternatives: Array<{
    assignee: string;
    tradeoffs: string;
  }>;
  loadBalancing: {
    currentDistribution: Record<string, number>;
    recommendedDistribution: Record<string, number>;
    rebalanceNeeded: boolean;
  };
}

export interface AutomationContext {
  entityId?: string;
  entityType?: string;
  department?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

// === HOOK ===

export function useAutomationOrchestrator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeExecutions, setActiveExecutions] = useState<Map<string, WorkflowExecution>>(new Map());
  
  // Polling para ejecuciones activas
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // === FUNCIÓN BASE ===
  const invokeAutomation = useCallback(async <T>(
    action: string,
    params: Record<string, unknown>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'automation-orchestrator',
        { body: { action, ...params } }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        return data.data as T;
      }

      throw new Error(data?.error || 'Error en automatización');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error(`[useAutomationOrchestrator] ${action} error:`, err);
      toast.error(`Error: ${message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CREAR WORKFLOW ===
  const createWorkflow = useCallback(async (
    context: AutomationContext,
    requirements?: Record<string, unknown>
  ): Promise<Workflow | null> => {
    const result = await invokeAutomation<Workflow>('create_workflow', { 
      context, 
      params: requirements 
    });
    if (result) {
      toast.success(`Workflow "${result.workflow.name}" creado`);
    }
    return result;
  }, [invokeAutomation]);

  // === EJECUTAR WORKFLOW ===
  const executeWorkflow = useCallback(async (
    workflowId: string,
    context: AutomationContext,
    inputParams?: Record<string, unknown>
  ): Promise<WorkflowExecution | null> => {
    const result = await invokeAutomation<WorkflowExecution>('execute_workflow', {
      workflowId,
      context,
      params: inputParams
    });
    if (result) {
      setActiveExecutions(prev => new Map(prev).set(result.execution.id, result));
    }
    return result;
  }, [invokeAutomation]);

  // === PROGRAMAR AUTOMATIZACIÓN ===
  const scheduleAutomation = useCallback(async (
    context: AutomationContext,
    scheduleConfig: Record<string, unknown>
  ): Promise<ScheduleConfig | null> => {
    const result = await invokeAutomation<ScheduleConfig>('schedule_automation', {
      context,
      params: scheduleConfig
    });
    if (result) {
      toast.success(`Automatización programada: ${result.timing.nextRun}`);
    }
    return result;
  }, [invokeAutomation]);

  // === ANALIZAR TRIGGERS ===
  const analyzeTriggers = useCallback(async (
    triggers: Array<Record<string, unknown>>,
    context: AutomationContext,
    events?: Array<Record<string, unknown>>
  ): Promise<TriggerAnalysis | null> => {
    return invokeAutomation<TriggerAnalysis>('trigger_analysis', {
      triggers,
      context,
      params: { events }
    });
  }, [invokeAutomation]);

  // === OPTIMIZAR PROCESO ===
  const optimizeProcess = useCallback(async (
    workflowId: string,
    currentMetrics: Record<string, number>,
    objectives?: string[]
  ): Promise<OptimizationResult | null> => {
    return invokeAutomation<OptimizationResult>('optimize_process', {
      workflowId,
      context: currentMetrics,
      params: { objectives }
    });
  }, [invokeAutomation]);

  // === GENERAR INTEGRACIÓN ===
  const generateIntegration = useCallback(async (
    context: AutomationContext,
    systems: { source: string; target: string },
    requirements?: Record<string, unknown>
  ): Promise<Integration | null> => {
    return invokeAutomation<Integration>('generate_integration', {
      context,
      params: { systems, requirements }
    });
  }, [invokeAutomation]);

  // === MONITOREAR AUTOMATIZACIONES ===
  const monitorAutomations = useCallback(async (
    context?: AutomationContext,
    period?: string,
    filters?: Record<string, unknown>
  ): Promise<MonitoringOverview | null> => {
    return invokeAutomation<MonitoringOverview>('monitor_automations', {
      context,
      params: { period, filters }
    });
  }, [invokeAutomation]);

  // === MANEJAR EXCEPCIÓN ===
  const handleException = useCallback(async (
    context: AutomationContext,
    errorDetails: Record<string, unknown>,
    history?: Array<Record<string, unknown>>
  ): Promise<ExceptionHandling | null> => {
    return invokeAutomation<ExceptionHandling>('handle_exception', {
      context,
      params: { error: errorDetails, history }
    });
  }, [invokeAutomation]);

  // === OPERACIONES BATCH ===
  const processBatch = useCallback(async (
    context: AutomationContext,
    operations: Array<Record<string, unknown>>,
    config?: Record<string, unknown>
  ): Promise<BatchResult | null> => {
    return invokeAutomation<BatchResult>('batch_operations', {
      context,
      params: { operations, config }
    });
  }, [invokeAutomation]);

  // === ROUTING INTELIGENTE ===
  const routeTask = useCallback(async (
    context: AutomationContext,
    resources: Array<Record<string, unknown>>,
    criteria?: Record<string, unknown>
  ): Promise<RoutingResult | null> => {
    return invokeAutomation<RoutingResult>('intelligent_routing', {
      context,
      params: { resources, criteria }
    });
  }, [invokeAutomation]);

  // === POLLING DE EJECUCIONES ===
  const startExecutionPolling = useCallback((executionId: string, intervalMs = 5000) => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
    
    pollingInterval.current = setInterval(async () => {
      // Aquí iría la lógica de polling real
      const execution = activeExecutions.get(executionId);
      if (execution?.execution.status === 'completed' || execution?.execution.status === 'failed') {
        stopExecutionPolling();
      }
    }, intervalMs);
  }, [activeExecutions]);

  const stopExecutionPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => {
      stopExecutionPolling();
    };
  }, [stopExecutionPolling]);

  return {
    // Estado
    isLoading,
    error,
    activeExecutions: Array.from(activeExecutions.values()),
    
    // Workflows
    createWorkflow,
    executeWorkflow,
    scheduleAutomation,
    
    // Análisis
    analyzeTriggers,
    optimizeProcess,
    monitorAutomations,
    
    // Integración
    generateIntegration,
    
    // Operaciones
    handleException,
    processBatch,
    routeTask,
    
    // Utilidades
    startExecutionPolling,
    stopExecutionPolling,
  };
}

export default useAutomationOrchestrator;
