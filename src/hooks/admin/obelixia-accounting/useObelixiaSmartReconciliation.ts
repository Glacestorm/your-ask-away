/**
 * useObelixiaSmartReconciliation - Fase 7: Automated Reconciliation & Smart Matching
 * Hook para conciliación automática con IA
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface ReconciliationMatch {
  id: string;
  sourceType: 'bank' | 'invoice' | 'payment' | 'journal';
  sourceId: string;
  sourceDescription: string;
  sourceAmount: number;
  sourceDate: string;
  targetType: 'bank' | 'invoice' | 'payment' | 'journal';
  targetId: string;
  targetDescription: string;
  targetAmount: number;
  targetDate: string;
  matchConfidence: number;
  matchReason: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'auto_matched';
  differenceAmount: number;
  suggestedAction?: string;
}

export interface ReconciliationRule {
  id: string;
  ruleName: string;
  ruleType: 'exact' | 'fuzzy' | 'pattern' | 'ai_learned';
  sourceField: string;
  targetField: string;
  matchCriteria: Record<string, unknown>;
  confidenceThreshold: number;
  autoApply: boolean;
  isActive: boolean;
  matchCount: number;
  createdAt: string;
}

export interface ReconciliationSession {
  id: string;
  sessionType: 'bank' | 'ar' | 'ap' | 'intercompany';
  status: 'in_progress' | 'completed' | 'paused';
  totalItems: number;
  matchedItems: number;
  unmatchedItems: number;
  autoMatchedItems: number;
  manualMatchedItems: number;
  startedAt: string;
  completedAt?: string;
  summary?: Record<string, unknown>;
}

export interface ReconciliationStats {
  totalReconciliations: number;
  autoMatchRate: number;
  avgConfidence: number;
  pendingMatches: number;
  savedHours: number;
  accuracy: number;
  trendsWeekly: Array<{
    week: string;
    autoMatched: number;
    manualMatched: number;
  }>;
}

export interface SmartReconciliationContext {
  sessionId?: string;
  reconciliationType: 'bank' | 'ar' | 'ap' | 'intercompany';
  dateRange: { start: string; end: string };
  accountIds?: string[];
  partnerIds?: string[];
}

// === HOOK ===
export function useObelixiaSmartReconciliation() {
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState<ReconciliationMatch[]>([]);
  const [rules, setRules] = useState<ReconciliationRule[]>([]);
  const [currentSession, setCurrentSession] = useState<ReconciliationSession | null>(null);
  const [stats, setStats] = useState<ReconciliationStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Refs para auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === INICIAR SESIÓN DE CONCILIACIÓN ===
  const startReconciliation = useCallback(async (context: SmartReconciliationContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-smart-reconciliation',
        {
          body: {
            action: 'start_reconciliation',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setCurrentSession(data.session);
        setMatches(data.matches || []);
        setLastRefresh(new Date());
        toast.success(`Conciliación iniciada: ${data.matches?.length || 0} matches encontrados`);
        return data;
      }

      throw new Error(data?.error || 'Error al iniciar conciliación');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useObelixiaSmartReconciliation] startReconciliation error:', err);
      toast.error('Error al iniciar conciliación');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === OBTENER MATCHES SUGERIDOS ===
  const getSuggestedMatches = useCallback(async (context: SmartReconciliationContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-smart-reconciliation',
        {
          body: {
            action: 'get_suggested_matches',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.matches) {
        setMatches(data.matches);
        setLastRefresh(new Date());
        return data.matches;
      }

      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useObelixiaSmartReconciliation] getSuggestedMatches error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CONFIRMAR MATCH ===
  const confirmMatch = useCallback(async (matchId: string, notes?: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-smart-reconciliation',
        {
          body: {
            action: 'confirm_match',
            params: { matchId, notes }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setMatches(prev => prev.map(m => 
          m.id === matchId ? { ...m, status: 'confirmed' as const } : m
        ));
        toast.success('Match confirmado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useObelixiaSmartReconciliation] confirmMatch error:', err);
      toast.error('Error al confirmar match');
      return false;
    }
  }, []);

  // === RECHAZAR MATCH ===
  const rejectMatch = useCallback(async (matchId: string, reason?: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-smart-reconciliation',
        {
          body: {
            action: 'reject_match',
            params: { matchId, reason }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setMatches(prev => prev.map(m => 
          m.id === matchId ? { ...m, status: 'rejected' as const } : m
        ));
        toast.success('Match rechazado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useObelixiaSmartReconciliation] rejectMatch error:', err);
      toast.error('Error al rechazar match');
      return false;
    }
  }, []);

  // === AUTO-MATCH BATCH ===
  const autoMatchBatch = useCallback(async (confidenceThreshold: number = 0.95) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-smart-reconciliation',
        {
          body: {
            action: 'auto_match_batch',
            params: { confidenceThreshold }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        const autoMatched = data.autoMatchedCount || 0;
        setMatches(prev => prev.map(m => 
          m.matchConfidence >= confidenceThreshold && m.status === 'pending'
            ? { ...m, status: 'auto_matched' as const }
            : m
        ));
        toast.success(`${autoMatched} matches aplicados automáticamente`);
        return data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaSmartReconciliation] autoMatchBatch error:', err);
      toast.error('Error en auto-match');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === OBTENER REGLAS ===
  const fetchRules = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-smart-reconciliation',
        {
          body: { action: 'get_rules' }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.rules) {
        setRules(data.rules);
        return data.rules;
      }

      return [];
    } catch (err) {
      console.error('[useObelixiaSmartReconciliation] fetchRules error:', err);
      return [];
    }
  }, []);

  // === CREAR REGLA ===
  const createRule = useCallback(async (rule: Partial<ReconciliationRule>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-smart-reconciliation',
        {
          body: {
            action: 'create_rule',
            params: { rule }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.rule) {
        setRules(prev => [...prev, data.rule]);
        toast.success('Regla creada');
        return data.rule;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaSmartReconciliation] createRule error:', err);
      toast.error('Error al crear regla');
      return null;
    }
  }, []);

  // === OBTENER ESTADÍSTICAS ===
  const fetchStats = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-smart-reconciliation',
        {
          body: { action: 'get_stats' }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.stats) {
        setStats(data.stats);
        return data.stats;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaSmartReconciliation] fetchStats error:', err);
      return null;
    }
  }, []);

  // === APRENDER DE MATCH MANUAL ===
  const learnFromMatch = useCallback(async (matchId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-smart-reconciliation',
        {
          body: {
            action: 'learn_from_match',
            params: { matchId }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Patrón aprendido para futuros matches');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useObelixiaSmartReconciliation] learnFromMatch error:', err);
      return false;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: SmartReconciliationContext, intervalMs = 60000) => {
    stopAutoRefresh();
    getSuggestedMatches(context);
    autoRefreshInterval.current = setInterval(() => {
      getSuggestedMatches(context);
    }, intervalMs);
  }, [getSuggestedMatches]);

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
    matches,
    rules,
    currentSession,
    stats,
    error,
    lastRefresh,
    // Acciones principales
    startReconciliation,
    getSuggestedMatches,
    confirmMatch,
    rejectMatch,
    autoMatchBatch,
    // Reglas
    fetchRules,
    createRule,
    // Estadísticas
    fetchStats,
    // Aprendizaje
    learnFromMatch,
    // Auto-refresh
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useObelixiaSmartReconciliation;
