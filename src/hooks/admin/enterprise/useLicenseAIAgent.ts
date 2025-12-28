/**
 * useLicenseAIAgent - Hook de Agente IA Autónomo para Licencias
 * Enterprise SaaS 2025-2026
 * 
 * Capacidades:
 * - Análisis predictivo (renovaciones, churn, forecast)
 * - Detección de anomalías y fraude
 * - Automatización inteligente
 * - Consultas en lenguaje natural
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===

export type AgentAutonomyLevel = 'suggestions_only' | 'semi_autonomous' | 'fully_autonomous';
export type AgentActionStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AgentConfig {
  autonomyLevel: AgentAutonomyLevel;
  enablePredictions: boolean;
  enableAnomalyDetection: boolean;
  enableAutomation: boolean;
  enableNaturalLanguage: boolean;
  confidenceThreshold: number; // 0-100
  maxActionsPerHour: number;
  notifyOnHighRisk: boolean;
  autoRenewThreshold: number; // días antes de expiración
}

export interface LicensePrediction {
  licenseId: string;
  licenseKey: string;
  companyName?: string;
  predictionType: 'renewal' | 'churn' | 'upgrade' | 'downgrade';
  probability: number; // 0-100
  predictedDate?: string;
  confidence: number; // 0-100
  factors: PredictionFactor[];
  suggestedAction?: string;
  estimatedValue?: number;
}

export interface PredictionFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface LicenseAnomaly {
  id: string;
  licenseId: string;
  licenseKey: string;
  anomalyType: 'usage_spike' | 'geographic' | 'device_proliferation' | 'pattern_break' | 'suspicious_timing';
  severity: RiskLevel;
  description: string;
  detectedAt: string;
  evidence: AnomalyEvidence[];
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
  suggestedAction?: string;
}

export interface AnomalyEvidence {
  type: string;
  value: string;
  expected?: string;
  deviation?: number;
}

export interface AgentAction {
  id: string;
  actionType: 'renew' | 'suspend' | 'notify' | 'upgrade' | 'investigate' | 'block_device';
  targetLicenseId: string;
  targetLicenseKey?: string;
  reason: string;
  aiReasoning: string;
  confidence: number;
  riskLevel: RiskLevel;
  status: AgentActionStatus;
  createdAt: string;
  executedAt?: string;
  executedBy?: string;
  result?: string;
  requiresApproval: boolean;
}

export interface AgentInsight {
  id: string;
  category: 'revenue' | 'risk' | 'optimization' | 'trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  metric?: string;
  metricValue?: number;
  metricChange?: number;
  actionable: boolean;
  suggestedAction?: string;
  createdAt: string;
}

export interface AgentMetrics {
  totalPredictions: number;
  accuracyRate: number;
  anomaliesDetected: number;
  actionsExecuted: number;
  valueGenerated: number;
  activeAlerts: number;
  lastAnalysisAt?: string;
}

export interface NLQueryResult {
  query: string;
  interpretation: string;
  answer: string;
  data?: unknown;
  suggestedFollowUps?: string[];
  confidence: number;
}

// === DEFAULT CONFIG ===
const DEFAULT_CONFIG: AgentConfig = {
  autonomyLevel: 'semi_autonomous',
  enablePredictions: true,
  enableAnomalyDetection: true,
  enableAutomation: true,
  enableNaturalLanguage: true,
  confidenceThreshold: 75,
  maxActionsPerHour: 10,
  notifyOnHighRisk: true,
  autoRenewThreshold: 30,
};

// === HOOK ===
export function useLicenseAIAgent() {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_CONFIG);
  const [predictions, setPredictions] = useState<LicensePrediction[]>([]);
  const [anomalies, setAnomalies] = useState<LicenseAnomaly[]>([]);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [insights, setInsights] = useState<AgentInsight[]>([]);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Refs
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);

  // === ANÁLISIS COMPLETO ===
  const runFullAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('license-ai-agent', {
        body: {
          action: 'full_analysis',
          config
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setPredictions(data.predictions || []);
        setAnomalies(data.anomalies || []);
        setInsights(data.insights || []);
        setMetrics(data.metrics || null);
        setLastRefresh(new Date());
        toast.success('Análisis IA completado');
        return data;
      }

      throw new Error(data?.error || 'Error en análisis');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error en análisis IA');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [config]);

  // === PREDICCIONES ===
  const getPredictions = useCallback(async (licenseIds?: string[]) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('license-ai-agent', {
        body: {
          action: 'predict',
          licenseIds,
          config
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.predictions) {
        setPredictions(data.predictions);
        return data.predictions;
      }

      return [];
    } catch (err) {
      console.error('[LicenseAIAgent] getPredictions error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  // === DETECCIÓN DE ANOMALÍAS ===
  const detectAnomalies = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('license-ai-agent', {
        body: {
          action: 'detect_anomalies',
          config
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.anomalies) {
        setAnomalies(data.anomalies);
        
        // Notificar si hay anomalías de alto riesgo
        const criticalAnomalies = data.anomalies.filter(
          (a: LicenseAnomaly) => a.severity === 'critical' || a.severity === 'high'
        );
        
        if (criticalAnomalies.length > 0 && config.notifyOnHighRisk) {
          toast.warning(`${criticalAnomalies.length} anomalías de alto riesgo detectadas`);
        }
        
        return data.anomalies;
      }

      return [];
    } catch (err) {
      console.error('[LicenseAIAgent] detectAnomalies error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  // === CONSULTA EN LENGUAJE NATURAL ===
  const queryNaturalLanguage = useCallback(async (query: string): Promise<NLQueryResult | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('license-ai-agent', {
        body: {
          action: 'natural_language_query',
          query
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        return {
          query,
          interpretation: data.interpretation || '',
          answer: data.answer || '',
          data: data.data,
          suggestedFollowUps: data.suggestedFollowUps || [],
          confidence: data.confidence || 0
        };
      }

      return null;
    } catch (err) {
      console.error('[LicenseAIAgent] queryNaturalLanguage error:', err);
      toast.error('Error al procesar consulta');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === EJECUTAR ACCIÓN ===
  const executeAction = useCallback(async (actionId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('license-ai-agent', {
        body: {
          action: 'execute_action',
          actionId
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setActions(prev => prev.map(a => 
          a.id === actionId ? { ...a, status: 'executed', executedAt: new Date().toISOString() } : a
        ));
        toast.success('Acción ejecutada correctamente');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[LicenseAIAgent] executeAction error:', err);
      toast.error('Error al ejecutar acción');
      return false;
    }
  }, []);

  // === APROBAR ACCIÓN ===
  const approveAction = useCallback(async (actionId: string) => {
    setActions(prev => prev.map(a => 
      a.id === actionId ? { ...a, status: 'approved' } : a
    ));
    
    // Si es semi-autónomo o autónomo, ejecutar inmediatamente
    if (config.autonomyLevel !== 'suggestions_only') {
      return executeAction(actionId);
    }
    
    toast.success('Acción aprobada');
    return true;
  }, [config.autonomyLevel, executeAction]);

  // === RECHAZAR ACCIÓN ===
  const rejectAction = useCallback(async (actionId: string, reason?: string) => {
    setActions(prev => prev.map(a => 
      a.id === actionId ? { ...a, status: 'rejected', result: reason } : a
    ));
    toast.info('Acción rechazada');
    return true;
  }, []);

  // === RESOLVER ANOMALÍA ===
  const resolveAnomaly = useCallback(async (anomalyId: string, resolution: 'resolved' | 'false_positive') => {
    setAnomalies(prev => prev.map(a => 
      a.id === anomalyId ? { ...a, status: resolution } : a
    ));
    toast.success(`Anomalía marcada como ${resolution === 'resolved' ? 'resuelta' : 'falso positivo'}`);
    return true;
  }, []);

  // === OBTENER SUGERENCIAS ===
  const getSuggestions = useCallback(async (context?: Record<string, unknown>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('license-ai-agent', {
        body: {
          action: 'get_suggestions',
          context,
          config
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.actions) {
        setActions(data.actions);
        return data.actions;
      }

      return [];
    } catch (err) {
      console.error('[LicenseAIAgent] getSuggestions error:', err);
      return [];
    }
  }, [config]);

  // === ACTUALIZAR CONFIGURACIÓN ===
  const updateConfig = useCallback((updates: Partial<AgentConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    toast.success('Configuración actualizada');
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 60000) => {
    stopAutoRefresh();
    runFullAnalysis();
    autoRefreshInterval.current = setInterval(() => {
      runFullAnalysis();
    }, intervalMs);
  }, [runFullAnalysis]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  // === MONITOREO CONTINUO ===
  const startMonitoring = useCallback((intervalMs = 300000) => { // 5 min default
    stopMonitoring();
    monitoringInterval.current = setInterval(() => {
      if (config.enableAnomalyDetection) {
        detectAnomalies();
      }
      if (config.enableAutomation) {
        getSuggestions();
      }
    }, intervalMs);
  }, [config, detectAnomalies, getSuggestions]);

  const stopMonitoring = useCallback(() => {
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => {
      stopAutoRefresh();
      stopMonitoring();
    };
  }, [stopAutoRefresh, stopMonitoring]);

  // === COMPUTED VALUES ===
  const pendingActions = actions.filter(a => a.status === 'pending');
  const activeAnomalies = anomalies.filter(a => a.status === 'new' || a.status === 'investigating');
  const highRiskItems = [
    ...predictions.filter(p => p.predictionType === 'churn' && p.probability > 70),
    ...anomalies.filter(a => a.severity === 'critical' || a.severity === 'high')
  ];

  return {
    // State
    isLoading,
    isAnalyzing,
    config,
    predictions,
    anomalies,
    actions,
    insights,
    metrics,
    error,
    lastRefresh,
    
    // Computed
    pendingActions,
    activeAnomalies,
    highRiskItems,
    
    // Actions
    runFullAnalysis,
    getPredictions,
    detectAnomalies,
    queryNaturalLanguage,
    executeAction,
    approveAction,
    rejectAction,
    resolveAnomaly,
    getSuggestions,
    updateConfig,
    
    // Control
    startAutoRefresh,
    stopAutoRefresh,
    startMonitoring,
    stopMonitoring,
  };
}

export default useLicenseAIAgent;
