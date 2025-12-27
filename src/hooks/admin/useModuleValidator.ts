/**
 * useModuleValidator - KB 2.0
 * Hook para validación pre-save de módulos
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useModuleDependencyGraph } from './useModuleDependencyGraph';

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  field?: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: ValidationIssue[];
  breaking: ValidationIssue[];
  warnings: ValidationIssue[];
  suggestions: ValidationIssue[];
  affectedModules: string[];
  canSave: boolean;
  requiresConfirmation: boolean;
}

export interface ModuleState {
  module_key: string;
  module_name: string;
  description?: string;
  features?: unknown[];
  dependencies?: string[];
  version?: string;
  [key: string]: unknown;
}

export function useModuleValidator() {
  const [isValidating, setIsValidating] = useState(false);
  const [lastResult, setLastResult] = useState<ValidationResult | null>(null);
  const { getModuleDependents, dependencies, checkCompatibility } = useModuleDependencyGraph();

  // === VALIDATE MODULE ===
  const validateModule = useCallback(async (
    currentState: ModuleState,
    proposedState: ModuleState
  ): Promise<ValidationResult> => {
    setIsValidating(true);
    
    const issues: ValidationIssue[] = [];
    const breaking: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const suggestions: ValidationIssue[] = [];
    const affectedModules: string[] = [];

    try {
      // 1. Validate required fields
      if (!proposedState.module_key) {
        issues.push({
          type: 'error',
          code: 'MISSING_KEY',
          message: 'El module_key es requerido',
          field: 'module_key',
        });
      }

      if (!proposedState.module_name) {
        issues.push({
          type: 'error',
          code: 'MISSING_NAME',
          message: 'El nombre del módulo es requerido',
          field: 'module_name',
        });
      }

      // 2. Check for breaking changes
      if (currentState.module_key && currentState.module_key !== proposedState.module_key) {
        const dependents = getModuleDependents(currentState.module_key);
        if (dependents.length > 0) {
          breaking.push({
            type: 'error',
            code: 'KEY_CHANGE_BREAKING',
            message: `Cambiar module_key romperá ${dependents.length} módulos dependientes`,
            field: 'module_key',
            suggestion: 'Considere mantener el key original o migrar los dependientes primero',
          });
          affectedModules.push(...dependents);
        }
      }

      // 3. Check removed features
      const currentFeatures = (currentState.features as Array<{ key?: string }>) || [];
      const proposedFeatures = (proposedState.features as Array<{ key?: string }>) || [];
      
      const currentFeatureKeys = new Set(currentFeatures.map(f => f.key).filter(Boolean));
      const proposedFeatureKeys = new Set(proposedFeatures.map(f => f.key).filter(Boolean));
      
      currentFeatureKeys.forEach(key => {
        if (key && !proposedFeatureKeys.has(key)) {
          warnings.push({
            type: 'warning',
            code: 'FEATURE_REMOVED',
            message: `Feature "${key}" eliminada`,
            field: 'features',
            suggestion: 'Verificar que ningún módulo depende de esta feature',
          });
        }
      });

      // 4. Check dependency conflicts
      const moduleDeps = proposedState.dependencies || [];
      for (const dep of moduleDeps) {
        const depExists = dependencies.some(d => d.module_key === dep || d.depends_on === dep);
        if (!depExists && dep !== 'core') {
          warnings.push({
            type: 'warning',
            code: 'UNKNOWN_DEPENDENCY',
            message: `Dependencia "${dep}" no encontrada en el sistema`,
            field: 'dependencies',
          });
        }
      }

      // 5. Check circular dependencies
      if (moduleDeps.includes(proposedState.module_key)) {
        issues.push({
          type: 'error',
          code: 'CIRCULAR_DEPENDENCY',
          message: 'Un módulo no puede depender de sí mismo',
          field: 'dependencies',
        });
      }

      // 6. Version validation
      if (proposedState.version) {
        const versionRegex = /^\d+\.\d+\.\d+$/;
        if (!versionRegex.test(proposedState.version)) {
          warnings.push({
            type: 'warning',
            code: 'INVALID_VERSION',
            message: 'La versión debe seguir el formato semántico (X.Y.Z)',
            field: 'version',
            suggestion: 'Ejemplo: 1.0.0, 2.1.3',
          });
        }
      }

      // 7. Check compatibility with installed modules
      const dependents = getModuleDependents(proposedState.module_key);
      for (const dependent of dependents) {
        const compat = checkCompatibility(proposedState.module_key, dependent);
        if (compat && compat.compatibility_status === 'incompatible') {
          warnings.push({
            type: 'warning',
            code: 'COMPATIBILITY_ISSUE',
            message: `Posible incompatibilidad con "${dependent}"`,
            suggestion: compat.notes || 'Revisar matriz de compatibilidad',
          });
        }
      }

      // 8. Suggestions
      if (!proposedState.description || proposedState.description.length < 20) {
        suggestions.push({
          type: 'info',
          code: 'SHORT_DESCRIPTION',
          message: 'La descripción es corta o está vacía',
          field: 'description',
          suggestion: 'Una buena descripción ayuda a los usuarios a entender el módulo',
        });
      }

      if (proposedFeatures.length === 0) {
        suggestions.push({
          type: 'info',
          code: 'NO_FEATURES',
          message: 'El módulo no tiene features definidas',
          field: 'features',
          suggestion: 'Definir features ayuda a documentar las capacidades del módulo',
        });
      }

      // Calculate validation score
      const errorCount = issues.filter(i => i.type === 'error').length + breaking.length;
      const warningCount = warnings.length;
      let score = 100 - (errorCount * 20) - (warningCount * 5);
      score = Math.max(0, Math.min(100, score));

      const result: ValidationResult = {
        isValid: issues.filter(i => i.type === 'error').length === 0 && breaking.length === 0,
        score,
        issues: [...issues, ...breaking, ...warnings, ...suggestions],
        breaking,
        warnings,
        suggestions,
        affectedModules: [...new Set(affectedModules)],
        canSave: issues.filter(i => i.type === 'error').length === 0,
        requiresConfirmation: breaking.length > 0 || warnings.length > 0,
      };

      setLastResult(result);
      return result;
    } finally {
      setIsValidating(false);
    }
  }, [dependencies, getModuleDependents, checkCompatibility]);

  // === VALIDATE QUICK ===
  const validateQuick = useCallback((state: ModuleState): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    if (!state.module_key) {
      issues.push({ type: 'error', code: 'MISSING_KEY', message: 'module_key requerido' });
    }
    if (!state.module_name) {
      issues.push({ type: 'error', code: 'MISSING_NAME', message: 'module_name requerido' });
    }

    return issues;
  }, []);

  // === RESET ===
  const reset = useCallback(() => {
    setLastResult(null);
  }, []);

  return {
    validateModule,
    validateQuick,
    isValidating,
    lastResult,
    reset,
  };
}

export default useModuleValidator;
