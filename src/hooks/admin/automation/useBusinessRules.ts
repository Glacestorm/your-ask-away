import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface BusinessRule {
  id: string;
  name: string;
  description?: string;
  category: 'validation' | 'calculation' | 'automation' | 'notification' | 'access';
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  is_active: boolean;
  effective_from?: string;
  effective_until?: string;
  created_at: string;
  updated_at: string;
}

export interface RuleCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'between';
  value: unknown;
  logical_operator?: 'AND' | 'OR';
}

export interface RuleAction {
  id: string;
  action_type: 'set_value' | 'send_notification' | 'trigger_workflow' | 'block' | 'approve' | 'escalate';
  config: Record<string, unknown>;
  order: number;
}

export interface RuleEvaluation {
  rule_id: string;
  rule_name: string;
  matched: boolean;
  conditions_evaluated: {
    condition_id: string;
    result: boolean;
    actual_value: unknown;
  }[];
  actions_executed?: string[];
  execution_time_ms: number;
}

export interface BusinessRulesContext {
  entityType?: string;
  category?: string;
}

// === HOOK ===
export function useBusinessRules() {
  const [isLoading, setIsLoading] = useState(false);
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [evaluations, setEvaluations] = useState<RuleEvaluation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH RULES ===
  const fetchRules = useCallback(async (context?: BusinessRulesContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'business-rules',
        {
          body: {
            action: 'list_rules',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.rules) {
        setRules(fnData.rules);
        setLastRefresh(new Date());
        return fnData.rules;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useBusinessRules] fetchRules error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CREATE RULE ===
  const createRule = useCallback(async (rule: Partial<BusinessRule>) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'business-rules',
        {
          body: {
            action: 'create_rule',
            rule
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Regla creada exitosamente');
        return fnData.rule;
      }

      return null;
    } catch (err) {
      console.error('[useBusinessRules] createRule error:', err);
      toast.error('Error al crear regla');
      return null;
    }
  }, []);

  // === EVALUATE RULES ===
  const evaluateRules = useCallback(async (
    entityType: string,
    entityData: Record<string, unknown>
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'business-rules',
        {
          body: {
            action: 'evaluate_rules',
            entityType,
            entityData
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.evaluations) {
        setEvaluations(fnData.evaluations);
        return fnData.evaluations;
      }

      return null;
    } catch (err) {
      console.error('[useBusinessRules] evaluateRules error:', err);
      return null;
    }
  }, []);

  // === UPDATE RULE ===
  const updateRule = useCallback(async (ruleId: string, updates: Partial<BusinessRule>) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'business-rules',
        {
          body: {
            action: 'update_rule',
            ruleId,
            updates
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Regla actualizada');
        return fnData.rule;
      }

      return null;
    } catch (err) {
      console.error('[useBusinessRules] updateRule error:', err);
      toast.error('Error al actualizar regla');
      return null;
    }
  }, []);

  // === DELETE RULE ===
  const deleteRule = useCallback(async (ruleId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'business-rules',
        {
          body: {
            action: 'delete_rule',
            ruleId
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Regla eliminada');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useBusinessRules] deleteRule error:', err);
      toast.error('Error al eliminar regla');
      return false;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: BusinessRulesContext, intervalMs = 60000) => {
    stopAutoRefresh();
    fetchRules(context);
    autoRefreshInterval.current = setInterval(() => {
      fetchRules(context);
    }, intervalMs);
  }, [fetchRules]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    isLoading,
    rules,
    evaluations,
    error,
    lastRefresh,
    fetchRules,
    createRule,
    evaluateRules,
    updateRule,
    deleteRule,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useBusinessRules;
