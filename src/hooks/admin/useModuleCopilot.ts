/**
 * useModuleCopilot - AI Copilot for Module Studio
 * Provides AI-powered analysis, suggestions, auto-fix, and natural language editing
 * 
 * @version 2.0.0
 * @category KB 4.0 Pattern
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from '@/hooks/core';

// === TYPES ===

export type CopilotAction = 
  | 'analyze'
  | 'suggest_improvements'
  | 'auto_fix'
  | 'generate_docs'
  | 'predict_conflicts'
  | 'natural_language_edit'
  | 'explain_module'
  | 'compare_versions'
  | 'optimize_dependencies';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  action?: CopilotAction;
  metadata?: {
    moduleKey?: string;
    affectedModules?: string[];
    suggestions?: CopilotSuggestion[];
    fixes?: CopilotFix[];
    analysis?: ModuleAnalysis;
  };
}

export interface CopilotSuggestion {
  id: string;
  type: 'improvement' | 'optimization' | 'security' | 'compatibility' | 'performance';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  priority: number;
  autoApplicable: boolean;
  code?: string;
}

export interface CopilotFix {
  id: string;
  issue: string;
  solution: string;
  field?: string;
  oldValue?: unknown;
  newValue?: unknown;
  applied: boolean;
  riskLevel: 'safe' | 'moderate' | 'risky';
}

export interface ModuleAnalysis {
  overallScore: number;
  categories: {
    architecture: number;
    dependencies: number;
    documentation: number;
    security: number;
    performance: number;
    maintainability: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  conflictRisks: ConflictRisk[];
}

export interface ConflictRisk {
  targetModule: string;
  probability: number;
  description: string;
  preventionSteps: string[];
}

export interface ModuleContext {
  moduleKey: string;
  moduleName: string;
  currentState: Record<string, unknown>;
  dependencies: string[];
  dependents: string[];
  recentChanges?: Array<{
    field: string;
    timestamp: string;
    oldValue?: unknown;
    newValue?: unknown;
  }>;
}

export interface CopilotConfig {
  maxMessages?: number;
  autoRefreshInterval?: number;
  enableStreaming?: boolean;
}

// === HOOK ===

export function useModuleCopilot(config: CopilotConfig = {}) {
  const {
    maxMessages = 50,
    autoRefreshInterval = 0,
    enableStreaming = false
  } = config;

  // State
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<ModuleAnalysis | null>(null);
  const [activeSuggestions, setActiveSuggestions] = useState<CopilotSuggestion[]>([]);
  const [pendingFixes, setPendingFixes] = useState<CopilotFix[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [moduleContext, setModuleContext] = useState<ModuleContext | null>(null);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Computed states
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // === CORE METHODS ===

  const addMessage = useCallback((message: Omit<CopilotMessage, 'id' | 'timestamp'>) => {
    const newMessage: CopilotMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    
    setMessages(prev => {
      const updated = [...prev, newMessage];
      return updated.slice(-maxMessages);
    });
    
    return newMessage;
  }, [maxMessages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setMessages([]);
    setCurrentAnalysis(null);
    setActiveSuggestions([]);
    setPendingFixes([]);
    setModuleContext(null);
  }, []);

  // === AI OPERATIONS ===

  const sendToAI = useCallback(async (
    action: CopilotAction,
    params: Record<string, unknown> = {},
    userMessage?: string
  ): Promise<CopilotMessage | null> => {
    const startTime = Date.now();
    setIsProcessing(true);
    setStatus('loading');
    setError(null);

    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // Add user message if provided
      if (userMessage) {
        addMessage({ role: 'user', content: userMessage, action });
      }

      // Call edge function
      const { data, error: fnError } = await supabase.functions.invoke('module-copilot', {
        body: {
          action,
          params: {
            ...params,
            moduleContext,
          },
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        },
      });

      if (fnError) throw fnError;

      if (!data?.success) {
        throw new Error(data?.error || 'Unknown AI error');
      }

      // Process response based on action
      const responseContent = data.content || data.response || '';
      const metadata: CopilotMessage['metadata'] = {
        moduleKey: moduleContext?.moduleKey,
      };

      // Handle different action types
      if (data.analysis) {
        setCurrentAnalysis(data.analysis);
        metadata.analysis = data.analysis;
      }

      if (data.suggestions) {
        setActiveSuggestions(data.suggestions);
        metadata.suggestions = data.suggestions;
      }

      if (data.fixes) {
        setPendingFixes(data.fixes);
        metadata.fixes = data.fixes;
      }

      if (data.affectedModules) {
        metadata.affectedModules = data.affectedModules;
      }

      // Add assistant response
      const assistantMessage = addMessage({
        role: 'assistant',
        content: responseContent,
        action,
        metadata,
      });

      setStatus('success');
      setLastRefresh(new Date());
      collectTelemetry('useModuleCopilot', action, 'success', Date.now() - startTime);

      return assistantMessage;

    } catch (err) {
      const parsedErr = parseError(err);
      const kbError = createKBError('COPILOT_ERROR', parsedErr.message, { 
        originalError: String(err),
      });
      
      setError(kbError);
      setStatus('error');
      collectTelemetry('useModuleCopilot', action, 'error', Date.now() - startTime, kbError);
      
      // Add error message to chat
      addMessage({
        role: 'system',
        content: `Error: ${kbError.message}`,
      });

      toast.error('Error del Copilot IA');
      return null;

    } finally {
      setIsProcessing(false);
    }
  }, [moduleContext, messages, addMessage]);

  // === SPECIFIC ACTIONS ===

  const analyzeModule = useCallback(async () => {
    if (!moduleContext) {
      toast.error('No hay módulo seleccionado');
      return null;
    }
    
    return sendToAI('analyze', {
      depth: 'full',
      includeRecommendations: true,
    }, `Analiza el módulo "${moduleContext.moduleName}" en profundidad`);
  }, [moduleContext, sendToAI]);

  const suggestImprovements = useCallback(async (focusAreas?: string[]) => {
    if (!moduleContext) {
      toast.error('No hay módulo seleccionado');
      return null;
    }

    return sendToAI('suggest_improvements', {
      focusAreas: focusAreas || ['all'],
      maxSuggestions: 5,
    }, `Sugiere mejoras para el módulo "${moduleContext.moduleName}"`);
  }, [moduleContext, sendToAI]);

  const autoFix = useCallback(async (issueIds?: string[]) => {
    if (!moduleContext) {
      toast.error('No hay módulo seleccionado');
      return null;
    }

    return sendToAI('auto_fix', {
      issueIds,
      safeOnly: true,
    }, 'Aplica correcciones automáticas seguras');
  }, [moduleContext, sendToAI]);

  const generateDocumentation = useCallback(async (format: 'readme' | 'api' | 'changelog' = 'readme') => {
    if (!moduleContext) {
      toast.error('No hay módulo seleccionado');
      return null;
    }

    return sendToAI('generate_docs', {
      format,
      includeExamples: true,
    }, `Genera documentación ${format.toUpperCase()} para "${moduleContext.moduleName}"`);
  }, [moduleContext, sendToAI]);

  const predictConflicts = useCallback(async () => {
    if (!moduleContext) {
      toast.error('No hay módulo seleccionado');
      return null;
    }

    return sendToAI('predict_conflicts', {
      timeHorizon: '30d',
      includePreventionSteps: true,
    }, 'Predice conflictos potenciales con otros módulos');
  }, [moduleContext, sendToAI]);

  const naturalLanguageEdit = useCallback(async (instruction: string) => {
    if (!moduleContext) {
      toast.error('No hay módulo seleccionado');
      return null;
    }

    return sendToAI('natural_language_edit', {
      instruction,
      preview: true,
    }, instruction);
  }, [moduleContext, sendToAI]);

  const explainModule = useCallback(async () => {
    if (!moduleContext) {
      toast.error('No hay módulo seleccionado');
      return null;
    }

    return sendToAI('explain_module', {
      audience: 'technical',
      includeArchitecture: true,
    }, `Explica cómo funciona el módulo "${moduleContext.moduleName}"`);
  }, [moduleContext, sendToAI]);

  const optimizeDependencies = useCallback(async () => {
    if (!moduleContext) {
      toast.error('No hay módulo seleccionado');
      return null;
    }

    return sendToAI('optimize_dependencies', {
      removeUnused: true,
      suggestAlternatives: true,
    }, 'Optimiza las dependencias del módulo');
  }, [moduleContext, sendToAI]);

  // === SUGGESTION/FIX ACTIONS ===

  const applySuggestion = useCallback(async (suggestionId: string) => {
    const suggestion = activeSuggestions.find(s => s.id === suggestionId);
    if (!suggestion) {
      toast.error('Sugerencia no encontrada');
      return false;
    }

    if (!suggestion.autoApplicable) {
      toast.warning('Esta sugerencia requiere aplicación manual');
      return false;
    }

    const result = await sendToAI('auto_fix', {
      suggestionId,
      force: false,
    }, `Aplica la sugerencia: "${suggestion.title}"`);

    if (result) {
      setActiveSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      toast.success('Sugerencia aplicada');
      return true;
    }

    return false;
  }, [activeSuggestions, sendToAI]);

  const applyFix = useCallback(async (fixId: string) => {
    const fix = pendingFixes.find(f => f.id === fixId);
    if (!fix) {
      toast.error('Corrección no encontrada');
      return false;
    }

    const result = await sendToAI('auto_fix', {
      fixId,
      force: false,
    }, `Aplica la corrección: "${fix.issue}"`);

    if (result) {
      setPendingFixes(prev => prev.map(f => 
        f.id === fixId ? { ...f, applied: true } : f
      ));
      toast.success('Corrección aplicada');
      return true;
    }

    return false;
  }, [pendingFixes, sendToAI]);

  const dismissSuggestion = useCallback((suggestionId: string) => {
    setActiveSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  const dismissFix = useCallback((fixId: string) => {
    setPendingFixes(prev => prev.filter(f => f.id !== fixId));
  }, []);

  // === CONTEXT MANAGEMENT ===

  const setContext = useCallback((context: ModuleContext | null) => {
    setModuleContext(context);
    if (context) {
      // Add system message when context changes
      addMessage({
        role: 'system',
        content: `Contexto actualizado: Módulo "${context.moduleName}" (${context.moduleKey}) seleccionado.`,
      });
    }
  }, [addMessage]);

  // === AUTO-REFRESH ===

  const startAutoRefresh = useCallback((interval: number = autoRefreshInterval) => {
    if (interval <= 0) return;
    
    stopAutoRefresh();
    
    autoRefreshIntervalRef.current = setInterval(() => {
      if (moduleContext && !isProcessing) {
        analyzeModule();
      }
    }, interval);
  }, [autoRefreshInterval, moduleContext, isProcessing, analyzeModule]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
  }, []);

  // === CLEANUP ===

  useEffect(() => {
    return () => {
      stopAutoRefresh();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [stopAutoRefresh]);

  // === CANCEL ===

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsProcessing(false);
    setStatus('idle');
  }, []);

  // === QUICK ACTIONS ===

  const quickActions = [
    { id: 'analyze', label: 'Analizar', icon: 'Brain', action: analyzeModule },
    { id: 'suggest', label: 'Sugerir Mejoras', icon: 'Lightbulb', action: suggestImprovements },
    { id: 'autofix', label: 'Auto-fix', icon: 'Wrench', action: autoFix },
    { id: 'docs', label: 'Generar Docs', icon: 'FileText', action: generateDocumentation },
    { id: 'conflicts', label: 'Predecir Conflictos', icon: 'AlertTriangle', action: predictConflicts },
    { id: 'optimize', label: 'Optimizar Deps', icon: 'Zap', action: optimizeDependencies },
  ];

  // === RETURN ===

  return {
    // State
    messages,
    isProcessing,
    status,
    error,
    currentAnalysis,
    activeSuggestions,
    pendingFixes,
    lastRefresh,
    moduleContext,
    quickActions,

    // Computed
    isIdle,
    isLoading,
    isSuccess,
    isError,

    // Core Methods
    addMessage,
    clearMessages,
    clearError,
    reset,
    cancel,
    setContext,

    // AI Operations
    sendToAI,
    analyzeModule,
    suggestImprovements,
    autoFix,
    generateDocumentation,
    predictConflicts,
    naturalLanguageEdit,
    explainModule,
    optimizeDependencies,

    // Suggestion/Fix Actions
    applySuggestion,
    applyFix,
    dismissSuggestion,
    dismissFix,

    // Auto-Refresh
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useModuleCopilot;
