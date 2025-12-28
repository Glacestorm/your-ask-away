/**
 * useObelixiaAccountingAgent
 * Hook para el Motor de Contabilidad Autónoma
 * Fase 3: Autonomous Bookkeeping Engine
 * 
 * Funcionalidades:
 * - Clasificación automática de movimientos bancarios
 * - Generación autónoma de asientos contables
 * - Reconciliación predictiva
 * - Auto-corrección de errores
 * - Reglas de aprendizaje
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === TIPOS E INTERFACES ===

export type AutonomyLevel = 'suggestion' | 'auto_register' | 'full_autonomy';

export interface AgentConfig {
  autonomyLevel: AutonomyLevel;
  confidenceThreshold: number; // 0-100, umbral para auto-registro
  maxActionsPerHour: number;
  enabledCapabilities: string[];
  learningEnabled: boolean;
  notifyOnAction: boolean;
  requireApprovalBelow: number; // Umbral de confianza para requerir aprobación
}

export interface BankMovement {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  bankAccountId: string;
  rawData?: Record<string, unknown>;
  status: 'pending' | 'classified' | 'registered' | 'reconciled';
}

export interface ClassificationResult {
  movementId: string;
  suggestedCategory: string;
  suggestedAccount: string;
  suggestedCounterpart: string;
  confidence: number;
  reasoning: string;
  matchedPatterns: MatchedPattern[];
  suggestedEntryLines: SuggestedEntryLine[];
  isAutoApproved: boolean;
}

export interface MatchedPattern {
  patternId: string;
  patternName: string;
  matchScore: number;
  matchedFields: string[];
}

export interface SuggestedEntryLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

export interface LearningRule {
  id: string;
  ruleName: string;
  ruleType: 'pattern' | 'entity' | 'keyword' | 'amount_range' | 'frequency';
  conditions: RuleCondition[];
  actions: RuleAction[];
  confidence: number;
  timesApplied: number;
  lastApplied?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'range';
  value: string | number | [number, number];
}

export interface RuleAction {
  actionType: 'classify' | 'assign_account' | 'set_category' | 'create_entry' | 'flag_review';
  parameters: Record<string, unknown>;
}

export interface AgentDecision {
  id: string;
  timestamp: string;
  decisionType: 'classification' | 'entry_creation' | 'reconciliation' | 'error_correction';
  entityId: string;
  entityType: string;
  inputData: Record<string, unknown>;
  outputData: Record<string, unknown>;
  confidence: number;
  reasoning: string;
  wasAutoExecuted: boolean;
  wasApproved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  rulesApplied: string[];
  executionTimeMs: number;
}

export interface AgentMetrics {
  totalDecisions: number;
  autoApprovedDecisions: number;
  manualApprovedDecisions: number;
  rejectedDecisions: number;
  averageConfidence: number;
  accuracyRate: number;
  timeSavedMinutes: number;
  activeRules: number;
  lastActivityAt: string;
  decisionsToday: number;
  decisionsThisWeek: number;
}

export interface ReconciliationSuggestion {
  bankMovementId: string;
  matchedEntryId: string;
  matchType: 'exact' | 'fuzzy' | 'partial';
  matchScore: number;
  differences: ReconciliationDifference[];
  suggestedAction: 'reconcile' | 'adjust' | 'investigate';
}

export interface ReconciliationDifference {
  field: string;
  bankValue: unknown;
  entryValue: unknown;
  significance: 'low' | 'medium' | 'high';
}

// === HOOK PRINCIPAL ===

export function useObelixiaAccountingAgent() {
  // Estado del agente
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [config, setConfig] = useState<AgentConfig>({
    autonomyLevel: 'suggestion',
    confidenceThreshold: 85,
    maxActionsPerHour: 50,
    enabledCapabilities: ['classification', 'entry_generation', 'reconciliation'],
    learningEnabled: true,
    notifyOnAction: true,
    requireApprovalBelow: 70
  });

  // Datos del agente
  const [pendingMovements, setPendingMovements] = useState<BankMovement[]>([]);
  const [classificationResults, setClassificationResults] = useState<ClassificationResult[]>([]);
  const [learningRules, setLearningRules] = useState<LearningRule[]>([]);
  const [recentDecisions, setRecentDecisions] = useState<AgentDecision[]>([]);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [reconciliationSuggestions, setReconciliationSuggestions] = useState<ReconciliationSuggestion[]>([]);

  // Refs para control
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedRef = useRef<string | null>(null);

  // === FUNCIONES DE CONFIGURACIÓN ===

  const updateConfig = useCallback((updates: Partial<AgentConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    toast.success('Configuración del agente actualizada');
  }, []);

  const setAutonomyLevel = useCallback((level: AutonomyLevel) => {
    updateConfig({ autonomyLevel: level });
    
    const levelNames: Record<AutonomyLevel, string> = {
      'suggestion': 'Sugerencia',
      'auto_register': 'Auto-registro',
      'full_autonomy': 'Autonomía completa'
    };
    
    toast.info(`Nivel de autonomía: ${levelNames[level]}`);
  }, [updateConfig]);

  // === CLASIFICACIÓN AUTOMÁTICA ===

  const classifyMovements = useCallback(async (movements: BankMovement[]): Promise<ClassificationResult[]> => {
    if (movements.length === 0) return [];

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('obelixia-autonomous-agent', {
        body: {
          action: 'classify_movements',
          movements,
          config: {
            confidenceThreshold: config.confidenceThreshold,
            learningEnabled: config.learningEnabled,
            existingRules: learningRules.filter(r => r.isActive)
          }
        }
      });

      if (error) throw error;

      if (data?.success && data?.results) {
        const results: ClassificationResult[] = data.results.map((r: ClassificationResult) => ({
          ...r,
          isAutoApproved: r.confidence >= config.confidenceThreshold && 
                          config.autonomyLevel !== 'suggestion'
        }));

        setClassificationResults(prev => [...prev, ...results]);
        
        // Auto-ejecutar si está en modo auto o full
        if (config.autonomyLevel !== 'suggestion') {
          const autoApproved = results.filter(r => r.isAutoApproved);
          if (autoApproved.length > 0) {
            await executeClassifications(autoApproved);
          }
        }

        return results;
      }

      throw new Error('Respuesta inválida del agente');
    } catch (error) {
      console.error('[ObelixiaAgent] Classification error:', error);
      toast.error('Error al clasificar movimientos');
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, [config, learningRules]);

  // === GENERACIÓN DE ASIENTOS ===

  const generateEntries = useCallback(async (classifications: ClassificationResult[]): Promise<void> => {
    if (classifications.length === 0) return;

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('obelixia-autonomous-agent', {
        body: {
          action: 'generate_entries',
          classifications,
          config: {
            autonomyLevel: config.autonomyLevel,
            requireApprovalBelow: config.requireApprovalBelow
          }
        }
      });

      if (error) throw error;

      if (data?.success) {
        const { entriesCreated, entriesPending } = data;
        
        if (entriesCreated > 0) {
          toast.success(`${entriesCreated} asientos creados automáticamente`);
        }
        
        if (entriesPending > 0) {
          toast.info(`${entriesPending} asientos pendientes de aprobación`);
        }

        // Registrar decisiones
        if (data.decisions) {
          setRecentDecisions(prev => [...data.decisions, ...prev].slice(0, 100));
        }
      }
    } catch (error) {
      console.error('[ObelixiaAgent] Entry generation error:', error);
      toast.error('Error al generar asientos');
    } finally {
      setIsProcessing(false);
    }
  }, [config]);

  const executeClassifications = useCallback(async (classifications: ClassificationResult[]): Promise<void> => {
    await generateEntries(classifications);
  }, [generateEntries]);

  // === RECONCILIACIÓN PREDICTIVA ===

  const findReconciliationMatches = useCallback(async (
    movements: BankMovement[],
    entries: { id: string; date: string; amount: number; description: string }[]
  ): Promise<ReconciliationSuggestion[]> => {
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('obelixia-autonomous-agent', {
        body: {
          action: 'find_reconciliation_matches',
          movements,
          entries,
          config: {
            fuzzyMatchThreshold: 0.8,
            dateToleranceDays: 3,
            amountTolerancePercent: 1
          }
        }
      });

      if (error) throw error;

      if (data?.success && data?.suggestions) {
        setReconciliationSuggestions(data.suggestions);
        return data.suggestions;
      }

      return [];
    } catch (error) {
      console.error('[ObelixiaAgent] Reconciliation error:', error);
      toast.error('Error en reconciliación predictiva');
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const executeReconciliation = useCallback(async (suggestion: ReconciliationSuggestion): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('obelixia-autonomous-agent', {
        body: {
          action: 'execute_reconciliation',
          suggestion
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Reconciliación completada');
        setReconciliationSuggestions(prev => 
          prev.filter(s => s.bankMovementId !== suggestion.bankMovementId)
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('[ObelixiaAgent] Reconciliation execution error:', error);
      toast.error('Error al ejecutar reconciliación');
      return false;
    }
  }, []);

  // === REGLAS DE APRENDIZAJE ===

  const fetchLearningRules = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('obelixia-autonomous-agent', {
        body: { action: 'get_learning_rules' }
      });

      if (error) throw error;

      if (data?.rules) {
        setLearningRules(data.rules);
      }
    } catch (error) {
      console.error('[ObelixiaAgent] Error fetching rules:', error);
    }
  }, []);

  const createLearningRule = useCallback(async (rule: Omit<LearningRule, 'id' | 'createdAt' | 'updatedAt' | 'timesApplied'>): Promise<LearningRule | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('obelixia-autonomous-agent', {
        body: {
          action: 'create_learning_rule',
          rule
        }
      });

      if (error) throw error;

      if (data?.rule) {
        setLearningRules(prev => [...prev, data.rule]);
        toast.success('Regla de aprendizaje creada');
        return data.rule;
      }

      return null;
    } catch (error) {
      console.error('[ObelixiaAgent] Error creating rule:', error);
      toast.error('Error al crear regla');
      return null;
    }
  }, []);

  const updateLearningRule = useCallback(async (ruleId: string, updates: Partial<LearningRule>): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('obelixia-autonomous-agent', {
        body: {
          action: 'update_learning_rule',
          ruleId,
          updates
        }
      });

      if (error) throw error;

      if (data?.success) {
        setLearningRules(prev => 
          prev.map(r => r.id === ruleId ? { ...r, ...updates } : r)
        );
        toast.success('Regla actualizada');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[ObelixiaAgent] Error updating rule:', error);
      toast.error('Error al actualizar regla');
      return false;
    }
  }, []);

  const deleteLearningRule = useCallback(async (ruleId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('obelixia-autonomous-agent', {
        body: {
          action: 'delete_learning_rule',
          ruleId
        }
      });

      if (error) throw error;

      if (data?.success) {
        setLearningRules(prev => prev.filter(r => r.id !== ruleId));
        toast.success('Regla eliminada');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[ObelixiaAgent] Error deleting rule:', error);
      toast.error('Error al eliminar regla');
      return false;
    }
  }, []);

  // === APROBACIÓN/RECHAZO DE DECISIONES ===

  const approveDecision = useCallback(async (decisionId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('obelixia-autonomous-agent', {
        body: {
          action: 'approve_decision',
          decisionId
        }
      });

      if (error) throw error;

      if (data?.success) {
        setRecentDecisions(prev =>
          prev.map(d => d.id === decisionId ? { ...d, wasApproved: true } : d)
        );
        
        // Si el aprendizaje está activo, crear regla de los patrones
        if (config.learningEnabled && data.newRule) {
          setLearningRules(prev => [...prev, data.newRule]);
          toast.success('Decisión aprobada y regla creada');
        } else {
          toast.success('Decisión aprobada');
        }
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('[ObelixiaAgent] Error approving decision:', error);
      toast.error('Error al aprobar decisión');
      return false;
    }
  }, [config.learningEnabled]);

  const rejectDecision = useCallback(async (decisionId: string, reason?: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('obelixia-autonomous-agent', {
        body: {
          action: 'reject_decision',
          decisionId,
          reason
        }
      });

      if (error) throw error;

      if (data?.success) {
        setRecentDecisions(prev =>
          prev.map(d => d.id === decisionId ? { ...d, wasApproved: false } : d)
        );
        toast.info('Decisión rechazada');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[ObelixiaAgent] Error rejecting decision:', error);
      toast.error('Error al rechazar decisión');
      return false;
    }
  }, []);

  // === MÉTRICAS ===

  const fetchMetrics = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('obelixia-autonomous-agent', {
        body: { action: 'get_metrics' }
      });

      if (error) throw error;

      if (data?.metrics) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('[ObelixiaAgent] Error fetching metrics:', error);
    }
  }, []);

  // === CONTROL DEL AGENTE ===

  const startAgent = useCallback(() => {
    if (isActive) return;

    setIsActive(true);
    toast.success('Agente autónomo activado');

    // Iniciar procesamiento periódico
    processingIntervalRef.current = setInterval(async () => {
      if (pendingMovements.length > 0 && !isProcessing) {
        await classifyMovements(pendingMovements);
      }
    }, 30000); // Cada 30 segundos

  }, [isActive, pendingMovements, isProcessing, classifyMovements]);

  const stopAgent = useCallback(() => {
    if (!isActive) return;

    setIsActive(false);
    toast.info('Agente autónomo detenido');

    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
  }, [isActive]);

  const toggleAgent = useCallback(() => {
    if (isActive) {
      stopAgent();
    } else {
      startAgent();
    }
  }, [isActive, startAgent, stopAgent]);

  // === EFECTOS ===

  // Cargar datos iniciales
  useEffect(() => {
    fetchLearningRules();
    fetchMetrics();
  }, [fetchLearningRules, fetchMetrics]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, []);

  // === RETURN ===

  return {
    // Estado
    isActive,
    isProcessing,
    config,
    
    // Datos
    pendingMovements,
    classificationResults,
    learningRules,
    recentDecisions,
    metrics,
    reconciliationSuggestions,

    // Configuración
    updateConfig,
    setAutonomyLevel,

    // Clasificación
    classifyMovements,
    setPendingMovements,

    // Asientos
    generateEntries,
    executeClassifications,

    // Reconciliación
    findReconciliationMatches,
    executeReconciliation,

    // Reglas
    fetchLearningRules,
    createLearningRule,
    updateLearningRule,
    deleteLearningRule,

    // Decisiones
    approveDecision,
    rejectDecision,

    // Métricas
    fetchMetrics,

    // Control
    startAgent,
    stopAgent,
    toggleAgent
  };
}

export default useObelixiaAccountingAgent;
