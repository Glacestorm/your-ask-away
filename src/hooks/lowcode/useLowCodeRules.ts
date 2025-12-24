import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LowCodeRule, RuleTrigger, RuleCondition, RuleAction } from '@/components/lowcode/types';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

// === ERROR TIPADO KB ===
export interface LowCodeRulesError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export function useLowCodeRules(moduleId?: string) {
  const queryClient = useQueryClient();
  // === ESTADO KB ===
  const [kbError, setKbError] = useState<LowCodeRulesError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setKbError(null), []);

  const rulesQuery = useQuery({
    queryKey: ['lowcode-rules', moduleId],
    queryFn: async () => {
      let query = supabase
        .from('lowcode_rules')
        .select('*')
        .order('priority', { ascending: false });
      
      if (moduleId) {
        query = query.eq('module_id', moduleId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return data.map(rule => ({
        ...rule,
        trigger_config: (rule.trigger_config as unknown as RuleTrigger) || { type: 'manual', config: {} },
        conditions: (rule.conditions as unknown as RuleCondition[]) || [],
        actions: (rule.actions as unknown as RuleAction[]) || [],
      })) as LowCodeRule[];
    },
  });

  const createRule = useMutation({
    mutationFn: async (rule: Partial<LowCodeRule>) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('lowcode_rules')
        .insert({
          rule_name: rule.rule_name || 'Nueva Regla',
          rule_key: rule.rule_key || `rule_${Date.now()}`,
          description: rule.description,
          module_id: rule.module_id,
          trigger_type: rule.trigger_type || 'manual',
          trigger_config: JSON.parse(JSON.stringify(rule.trigger_config || {})),
          conditions: JSON.parse(JSON.stringify(rule.conditions || [])),
          actions: JSON.parse(JSON.stringify(rule.actions || [])),
          is_active: rule.is_active ?? true,
          priority: rule.priority || 0,
          created_by: user.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-rules'] });
      toast.success('Regla creada correctamente');
    },
    onError: (error) => {
      toast.error('Error al crear regla: ' + error.message);
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LowCodeRule> & { id: string }) => {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.rule_name) updateData.rule_name = updates.rule_name;
      if (updates.rule_key) updateData.rule_key = updates.rule_key;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.trigger_type) updateData.trigger_type = updates.trigger_type;
      if (updates.trigger_config) updateData.trigger_config = JSON.parse(JSON.stringify(updates.trigger_config));
      if (updates.conditions) updateData.conditions = JSON.parse(JSON.stringify(updates.conditions));
      if (updates.actions) updateData.actions = JSON.parse(JSON.stringify(updates.actions));
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.priority !== undefined) updateData.priority = updates.priority;

      const { data, error } = await supabase
        .from('lowcode_rules')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-rules'] });
      toast.success('Regla actualizada');
    },
    onError: (error) => {
      toast.error('Error al actualizar regla: ' + error.message);
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lowcode_rules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-rules'] });
      toast.success('Regla eliminada');
    },
    onError: (error) => {
      toast.error('Error al eliminar regla: ' + error.message);
    },
  });

  const executeRule = useMutation({
    mutationFn: async ({ ruleId, inputData }: { ruleId: string; inputData?: Record<string, unknown> }) => {
      const { data, error } = await supabase.functions.invoke('execute-lowcode-rule', {
        body: { ruleId, inputData },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Regla ejecutada correctamente');
    },
    onError: (error) => {
      toast.error('Error al ejecutar regla: ' + error.message);
    },
  });

  return {
    rules: rulesQuery.data || [],
    isLoading: rulesQuery.isLoading,
    error: rulesQuery.error,
    createRule,
    updateRule,
    deleteRule,
    executeRule,
    // === KB ADDITIONS ===
    kbError,
    lastRefresh,
    clearError,
  };
}

export function useRuleExecutions(ruleId?: string) {
  return useQuery({
    queryKey: ['rule-executions', ruleId],
    queryFn: async () => {
      let query = supabase
        .from('lowcode_rule_executions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (ruleId) {
        query = query.eq('rule_id', ruleId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!ruleId,
  });
}
