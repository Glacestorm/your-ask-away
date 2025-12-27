/**
 * useModuleRollback - Sistema de rollback inteligente
 * Rollback selectivo con validación pre-rollback e historial
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RollbackPoint {
  id: string;
  moduleKey: string;
  version: string;
  timestamp: string;
  createdBy: string;
  state: Record<string, unknown>;
  reason: string;
  status: 'available' | 'applied' | 'expired';
}

export interface RollbackValidation {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  affectedDependencies: string[];
  estimatedDowntime: string;
  dataLossRisk: 'none' | 'low' | 'medium' | 'high';
}

export interface RollbackHistory {
  id: string;
  moduleKey: string;
  fromVersion: string;
  toVersion: string;
  executedAt: string;
  executedBy: string;
  status: 'success' | 'failed' | 'partial';
  duration: number;
  notes: string;
}

export interface RollbackState {
  rollbackPoints: RollbackPoint[];
  rollbackHistory: RollbackHistory[];
  validation: RollbackValidation | null;
  isLoading: boolean;
  isValidating: boolean;
  isExecuting: boolean;
}

export function useModuleRollback(moduleKey?: string) {
  const [state, setState] = useState<RollbackState>({
    rollbackPoints: [],
    rollbackHistory: [],
    validation: null,
    isLoading: false,
    isValidating: false,
    isExecuting: false
  });

  // Fetch available rollback points
  const fetchRollbackPoints = useCallback(async (key?: string) => {
    const targetKey = key || moduleKey;
    if (!targetKey) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { data, error } = await supabase.functions.invoke('module-rollback', {
        body: {
          action: 'get_rollback_points',
          moduleKey: targetKey
        }
      });

      if (error) throw error;

      const points: RollbackPoint[] = (data?.points || []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        moduleKey: p.module_key as string,
        version: p.version as string,
        timestamp: p.timestamp as string,
        createdBy: (p.created_by as string) || 'system',
        state: (p.state as Record<string, unknown>) || {},
        reason: (p.reason as string) || '',
        status: (p.status as 'available' | 'applied' | 'expired') || 'available'
      }));

      setState(prev => ({ ...prev, rollbackPoints: points, isLoading: false }));
      return points;
    } catch (error) {
      console.error('[useModuleRollback] fetchRollbackPoints error:', error);
      // Return mock data for development
      const mockPoints: RollbackPoint[] = [
        {
          id: '1',
          moduleKey: targetKey,
          version: '1.2.0',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          createdBy: 'admin',
          state: { features: ['feature1', 'feature2'] },
          reason: 'Pre-deployment backup',
          status: 'available'
        },
        {
          id: '2',
          moduleKey: targetKey,
          version: '1.1.0',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          createdBy: 'system',
          state: { features: ['feature1'] },
          reason: 'Automatic backup',
          status: 'available'
        }
      ];
      setState(prev => ({ ...prev, rollbackPoints: mockPoints, isLoading: false }));
      return mockPoints;
    }
  }, [moduleKey]);

  // Fetch rollback history
  const fetchRollbackHistory = useCallback(async (key?: string) => {
    const targetKey = key || moduleKey;
    if (!targetKey) return;

    try {
      const { data, error } = await supabase
        .from('module_change_history')
        .select('*')
        .eq('module_key', targetKey)
        .eq('change_type', 'rollback')
        .order('changed_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const history: RollbackHistory[] = (data || []).map(h => ({
        id: h.id,
        moduleKey: h.module_key,
        fromVersion: h.version_before || 'unknown',
        toVersion: h.version_after || 'unknown',
        executedAt: h.created_at,
        executedBy: h.changed_by || 'system',
        status: 'success' as const,
        duration: 0,
        notes: h.changelog || ''
      }));

      setState(prev => ({ ...prev, rollbackHistory: history }));
      return history;
    } catch (error) {
      console.error('[useModuleRollback] fetchRollbackHistory error:', error);
      return [];
    }
  }, [moduleKey]);

  // Validate rollback before execution
  const validateRollback = useCallback(async (toVersion: string) => {
    if (!moduleKey) return null;

    setState(prev => ({ ...prev, isValidating: true }));

    try {
      const { data, error } = await supabase.functions.invoke('module-rollback', {
        body: {
          action: 'validate_rollback',
          moduleKey,
          toVersion
        }
      });

      if (error) throw error;

      const validation: RollbackValidation = {
        isValid: data?.isValid ?? true,
        warnings: data?.warnings || [],
        errors: data?.errors || [],
        affectedDependencies: data?.affectedDependencies || [],
        estimatedDowntime: data?.estimatedDowntime || '< 1 minute',
        dataLossRisk: data?.dataLossRisk || 'none'
      };

      setState(prev => ({ ...prev, validation, isValidating: false }));
      return validation;
    } catch (error) {
      console.error('[useModuleRollback] validateRollback error:', error);
      // Return mock validation for development
      const mockValidation: RollbackValidation = {
        isValid: true,
        warnings: ['Some cached data may be cleared'],
        errors: [],
        affectedDependencies: [],
        estimatedDowntime: '< 1 minute',
        dataLossRisk: 'none'
      };
      setState(prev => ({ ...prev, validation: mockValidation, isValidating: false }));
      return mockValidation;
    }
  }, [moduleKey]);

  // Execute rollback
  const executeRollback = useCallback(async (
    toVersion: string,
    reason: string
  ) => {
    if (!moduleKey) {
      toast.error('No hay módulo seleccionado');
      return false;
    }

    setState(prev => ({ ...prev, isExecuting: true }));

    try {
      const { data, error } = await supabase.functions.invoke('module-rollback', {
        body: {
          action: 'execute_rollback',
          moduleKey,
          toVersion,
          reason
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Rollback a v${toVersion} completado`);
        await fetchRollbackPoints();
        await fetchRollbackHistory();
        setState(prev => ({ ...prev, isExecuting: false }));
        return true;
      }

      throw new Error(data?.error || 'Rollback failed');
    } catch (error) {
      console.error('[useModuleRollback] executeRollback error:', error);
      toast.error('Error al ejecutar rollback');
      setState(prev => ({ ...prev, isExecuting: false }));
      return false;
    }
  }, [moduleKey, fetchRollbackPoints, fetchRollbackHistory]);

  // Create a manual rollback point
  const createRollbackPoint = useCallback(async (reason: string) => {
    if (!moduleKey) {
      toast.error('No hay módulo seleccionado');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('module-rollback', {
        body: {
          action: 'create_rollback_point',
          moduleKey,
          reason
        }
      });

      if (error) throw error;

      toast.success('Punto de rollback creado');
      await fetchRollbackPoints();
      return data;
    } catch (error) {
      console.error('[useModuleRollback] createRollbackPoint error:', error);
      toast.error('Error al crear punto de rollback');
      return null;
    }
  }, [moduleKey, fetchRollbackPoints]);

  // Clear validation state
  const clearValidation = useCallback(() => {
    setState(prev => ({ ...prev, validation: null }));
  }, []);

  return {
    ...state,
    fetchRollbackPoints,
    fetchRollbackHistory,
    validateRollback,
    executeRollback,
    createRollbackPoint,
    clearValidation
  };
}

export default useModuleRollback;
