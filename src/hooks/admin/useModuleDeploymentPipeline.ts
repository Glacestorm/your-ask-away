/**
 * useModuleDeploymentPipeline - Hook para CI/CD de módulos
 * Fase 5D: Staging, testing automático y deploy progresivo
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// === INTERFACES ===
export interface Pipeline {
  id: string;
  name: string;
  moduleKey: string;
  status: 'idle' | 'running' | 'success' | 'failed' | 'cancelled' | 'pending_approval';
  currentStage: string;
  stages: PipelineStage[];
  trigger: PipelineTrigger;
  environment: 'development' | 'staging' | 'production';
  version: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  triggeredBy: string;
  triggeredById: string;
  logs: PipelineLog[];
  artifacts: PipelineArtifact[];
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  type: 'build' | 'test' | 'security' | 'review' | 'staging' | 'canary' | 'production';
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'cancelled';
  order: number;
  config: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  logs: string[];
  outputs?: Record<string, unknown>;
  requiresApproval?: boolean;
  approvedBy?: string;
}

export interface PipelineTrigger {
  type: 'manual' | 'push' | 'merge' | 'schedule' | 'api';
  branch?: string;
  version?: string;
  schedule?: string;
}

export interface PipelineLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  stage: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface PipelineArtifact {
  id: string;
  name: string;
  type: 'build' | 'test-report' | 'coverage' | 'security-scan' | 'bundle';
  url: string;
  size: number;
  createdAt: string;
}

export interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  strategy: 'all-at-once' | 'rolling' | 'blue-green' | 'canary';
  canaryPercentage?: number;
  rollbackOnFailure: boolean;
  autoPromote: boolean;
  promotionDelay?: number;
  healthCheckUrl?: string;
  healthCheckInterval?: number;
  minHealthyInstances?: number;
}

export interface DeploymentStatus {
  pipelineId: string;
  environment: string;
  status: 'deploying' | 'deployed' | 'failed' | 'rolling-back' | 'rolled-back';
  version: string;
  previousVersion?: string;
  instances: {
    total: number;
    healthy: number;
    unhealthy: number;
    deploying: number;
  };
  metrics: {
    errorRate: number;
    latency: number;
    successRate: number;
  };
  startedAt: string;
  completedAt?: string;
}

export interface TestResult {
  suite: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  errorMessage?: string;
  stackTrace?: string;
}

// === HOOK ===
export function useModuleDeploymentPipeline(moduleKey?: string) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activePipeline, setActivePipeline] = useState<Pipeline | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [logs, setLogs] = useState<PipelineLog[]>([]);
  const [artifacts, setArtifacts] = useState<PipelineArtifact[]>([]);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // === FETCH PIPELINES ===
  const fetchPipelines = useCallback(async (key: string) => {
    setIsLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-deployment-pipeline',
        {
          body: {
            action: 'list_pipelines',
            moduleKey: key
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setPipelines(fnData.pipelines || []);
        return fnData.pipelines;
      }
    } catch (error) {
      console.error('[useModuleDeploymentPipeline] fetchPipelines error:', error);
      toast.error('Error al cargar pipelines');
    } finally {
      setIsLoading(false);
    }
    return [];
  }, []);

  // === CREATE PIPELINE ===
  const createPipeline = useCallback(async (
    key: string,
    version: string,
    environment: 'development' | 'staging' | 'production',
    config?: DeploymentConfig
  ) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    setIsLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-deployment-pipeline',
        {
          body: {
            action: 'create_pipeline',
            moduleKey: key,
            version,
            environment,
            config,
            triggeredById: user.id
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Pipeline creado');
        await fetchPipelines(key);
        return fnData.pipeline;
      }

      throw new Error(fnData?.error || 'Error al crear pipeline');
    } catch (error) {
      console.error('[useModuleDeploymentPipeline] createPipeline error:', error);
      toast.error('Error al crear pipeline');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, fetchPipelines]);

  // === START PIPELINE ===
  const startPipeline = useCallback(async (pipelineId: string) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return false;
    }

    setIsLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-deployment-pipeline',
        {
          body: {
            action: 'start_pipeline',
            pipelineId,
            triggeredById: user.id
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Pipeline iniciado');
        setActivePipeline(fnData.pipeline);
        startPolling(pipelineId);
        return true;
      }

      throw new Error(fnData?.error || 'Error al iniciar pipeline');
    } catch (error) {
      console.error('[useModuleDeploymentPipeline] startPipeline error:', error);
      toast.error('Error al iniciar pipeline');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // === CANCEL PIPELINE ===
  const cancelPipeline = useCallback(async (pipelineId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-deployment-pipeline',
        {
          body: {
            action: 'cancel_pipeline',
            pipelineId
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Pipeline cancelado');
        stopPolling();
        if (moduleKey) await fetchPipelines(moduleKey);
        return true;
      }
    } catch (error) {
      console.error('[useModuleDeploymentPipeline] cancelPipeline error:', error);
      toast.error('Error al cancelar pipeline');
    }
    return false;
  }, [moduleKey, fetchPipelines]);

  // === APPROVE STAGE ===
  const approveStage = useCallback(async (pipelineId: string, stageId: string) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return false;
    }

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-deployment-pipeline',
        {
          body: {
            action: 'approve_stage',
            pipelineId,
            stageId,
            approvedById: user.id
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Stage aprobado');
        return true;
      }
    } catch (error) {
      console.error('[useModuleDeploymentPipeline] approveStage error:', error);
      toast.error('Error al aprobar stage');
    }
    return false;
  }, [user?.id]);

  // === ROLLBACK ===
  const rollback = useCallback(async (pipelineId: string, targetVersion: string) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return false;
    }

    setIsLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-deployment-pipeline',
        {
          body: {
            action: 'rollback',
            pipelineId,
            targetVersion,
            triggeredById: user.id
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success(`Rollback a ${targetVersion} iniciado`);
        return true;
      }

      throw new Error(fnData?.error || 'Error en rollback');
    } catch (error) {
      console.error('[useModuleDeploymentPipeline] rollback error:', error);
      toast.error('Error al hacer rollback');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // === PROMOTE ===
  const promote = useCallback(async (
    pipelineId: string,
    fromEnvironment: string,
    toEnvironment: 'staging' | 'production'
  ) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return false;
    }

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-deployment-pipeline',
        {
          body: {
            action: 'promote',
            pipelineId,
            fromEnvironment,
            toEnvironment,
            promotedById: user.id
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success(`Promoción a ${toEnvironment} iniciada`);
        return true;
      }
    } catch (error) {
      console.error('[useModuleDeploymentPipeline] promote error:', error);
      toast.error('Error al promover');
    }
    return false;
  }, [user?.id]);

  // === GET PIPELINE DETAILS ===
  const getPipelineDetails = useCallback(async (pipelineId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-deployment-pipeline',
        {
          body: {
            action: 'get_pipeline',
            pipelineId
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setActivePipeline(fnData.pipeline);
        setLogs(fnData.pipeline.logs || []);
        setArtifacts(fnData.pipeline.artifacts || []);
        return fnData.pipeline;
      }
    } catch (error) {
      console.error('[useModuleDeploymentPipeline] getPipelineDetails error:', error);
    }
    return null;
  }, []);

  // === GET TEST RESULTS ===
  const getTestResults = useCallback(async (pipelineId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-deployment-pipeline',
        {
          body: {
            action: 'get_test_results',
            pipelineId
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setTestResults(fnData.results || []);
        return fnData.results;
      }
    } catch (error) {
      console.error('[useModuleDeploymentPipeline] getTestResults error:', error);
    }
    return [];
  }, []);

  // === GET DEPLOYMENT STATUS ===
  const getDeploymentStatus = useCallback(async (pipelineId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-deployment-pipeline',
        {
          body: {
            action: 'get_deployment_status',
            pipelineId
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setDeploymentStatus(fnData.status);
        return fnData.status;
      }
    } catch (error) {
      console.error('[useModuleDeploymentPipeline] getDeploymentStatus error:', error);
    }
    return null;
  }, []);

  // === POLLING ===
  const startPolling = useCallback((pipelineId: string, intervalMs = 3000) => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      const pipeline = await getPipelineDetails(pipelineId);
      if (pipeline && ['success', 'failed', 'cancelled'].includes(pipeline.status)) {
        stopPolling();
      }
    }, intervalMs);
  }, [getPipelineDetails]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // === STAGE HELPERS ===
  const getStageStatusColor = useCallback((status: PipelineStage['status']) => {
    switch (status) {
      case 'success': return 'text-green-500 bg-green-500/10';
      case 'failed': return 'text-red-500 bg-red-500/10';
      case 'running': return 'text-blue-500 bg-blue-500/10';
      case 'pending': return 'text-gray-500 bg-gray-500/10';
      case 'skipped': return 'text-yellow-500 bg-yellow-500/10';
      case 'cancelled': return 'text-orange-500 bg-orange-500/10';
      default: return 'text-muted-foreground';
    }
  }, []);

  const getEnvironmentColor = useCallback((env: string) => {
    switch (env) {
      case 'production': return 'text-red-500 bg-red-500/10';
      case 'staging': return 'text-yellow-500 bg-yellow-500/10';
      case 'development': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-muted-foreground';
    }
  }, []);

  // === INITIAL FETCH ===
  useEffect(() => {
    if (moduleKey) {
      fetchPipelines(moduleKey);
    }
  }, [moduleKey]);

  // === CLEANUP ===
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // === RETURN ===
  return {
    // Estado
    isLoading,
    pipelines,
    activePipeline,
    deploymentStatus,
    testResults,
    logs,
    artifacts,
    // Acciones
    fetchPipelines,
    createPipeline,
    startPipeline,
    cancelPipeline,
    approveStage,
    rollback,
    promote,
    getPipelineDetails,
    getTestResults,
    getDeploymentStatus,
    startPolling,
    stopPolling,
    // Helpers
    getStageStatusColor,
    getEnvironmentColor,
    isRunning: activePipeline?.status === 'running',
  };
}

export default useModuleDeploymentPipeline;
