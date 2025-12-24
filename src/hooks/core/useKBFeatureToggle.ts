/**
 * KB 4.5 - Enterprise Feature Toggle Hook (Phase 17)
 * Advanced feature flags with targeting, rollout, and analytics
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type FeatureValue = boolean | string | number | Record<string, unknown>;

export interface FeatureToggle {
  key: string;
  name: string;
  description?: string;
  defaultValue: FeatureValue;
  enabled: boolean;
  targeting?: TargetingRules;
  rollout?: RolloutConfig;
  variants?: FeatureVariant[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface FeatureVariant {
  key: string;
  name: string;
  value: FeatureValue;
  weight: number;
  description?: string;
}

export interface TargetingRules {
  rules: TargetingRule[];
  defaultVariant?: string;
}

export interface TargetingRule {
  id: string;
  name?: string;
  conditions: TargetingCondition[];
  variant: string;
  priority: number;
}

export interface TargetingCondition {
  attribute: string;
  operator: ConditionOperator;
  value: unknown;
}

export type ConditionOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'in'
  | 'not_in'
  | 'matches_regex'
  | 'semver_equals'
  | 'semver_greater_than'
  | 'semver_less_than';

export interface RolloutConfig {
  type: 'percentage' | 'gradual' | 'scheduled';
  percentage?: number;
  schedule?: {
    startDate: Date;
    endDate?: Date;
    targetPercentage: number;
  };
  segments?: RolloutSegment[];
}

export interface RolloutSegment {
  name: string;
  percentage: number;
  attributes?: Record<string, unknown>;
}

export interface UserContext {
  userId: string;
  email?: string;
  attributes?: Record<string, unknown>;
  groups?: string[];
  permissions?: string[];
}

export interface FeatureEvaluation {
  key: string;
  value: FeatureValue;
  variant?: string;
  reason: EvaluationReason;
  ruleId?: string;
}

export type EvaluationReason = 
  | 'DEFAULT'
  | 'TARGETING_MATCH'
  | 'ROLLOUT'
  | 'OVERRIDE'
  | 'DISABLED'
  | 'ERROR'
  | 'NOT_FOUND';

export interface FeatureAnalytics {
  evaluations: number;
  variants: Record<string, number>;
  errors: number;
  lastEvaluated: Date;
}

// ============================================================================
// CONTEXT
// ============================================================================

interface FeatureToggleContextValue {
  features: Map<string, FeatureToggle>;
  userContext: UserContext | null;
  overrides: Map<string, FeatureValue>;
  analytics: Map<string, FeatureAnalytics>;
  evaluate: (key: string) => FeatureEvaluation;
  setOverride: (key: string, value: FeatureValue) => void;
  clearOverride: (key: string) => void;
  setUserContext: (context: UserContext | null) => void;
  refreshFeatures: () => Promise<void>;
}

const FeatureToggleContext = createContext<FeatureToggleContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export interface FeatureToggleProviderProps {
  children: React.ReactNode;
  features?: FeatureToggle[];
  userContext?: UserContext;
  fetchFeatures?: () => Promise<FeatureToggle[]>;
  onEvaluation?: (evaluation: FeatureEvaluation, context: UserContext | null) => void;
  refreshInterval?: number;
}

export function FeatureToggleProvider({
  children,
  features: initialFeatures = [],
  userContext: initialUserContext = null,
  fetchFeatures,
  onEvaluation,
  refreshInterval,
}: FeatureToggleProviderProps): React.ReactElement {
  const [features, setFeatures] = useState<Map<string, FeatureToggle>>(
    new Map(initialFeatures.map(f => [f.key, f]))
  );
  const [userContext, setUserContext] = useState<UserContext | null>(initialUserContext);
  const [overrides, setOverrides] = useState<Map<string, FeatureValue>>(new Map());
  const analyticsRef = useRef<Map<string, FeatureAnalytics>>(new Map());

  // Fetch features
  const refreshFeatures = useCallback(async () => {
    if (!fetchFeatures) return;
    
    try {
      const fetchedFeatures = await fetchFeatures();
      setFeatures(new Map(fetchedFeatures.map(f => [f.key, f])));
    } catch (error) {
      console.error('[FeatureToggle] Failed to fetch features:', error);
    }
  }, [fetchFeatures]);

  // Auto-refresh
  useEffect(() => {
    if (fetchFeatures && refreshInterval) {
      const interval = setInterval(refreshFeatures, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchFeatures, refreshInterval, refreshFeatures]);

  // Evaluate targeting conditions
  const evaluateCondition = useCallback((
    condition: TargetingCondition,
    context: UserContext | null
  ): boolean => {
    if (!context) return false;

    const value = condition.attribute === 'userId' 
      ? context.userId
      : condition.attribute === 'email'
        ? context.email
        : context.attributes?.[condition.attribute];

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'not_contains':
        return !String(value).includes(String(condition.value));
      case 'starts_with':
        return String(value).startsWith(String(condition.value));
      case 'ends_with':
        return String(value).endsWith(String(condition.value));
      case 'greater_than':
        return Number(value) > Number(condition.value);
      case 'less_than':
        return Number(value) < Number(condition.value);
      case 'greater_than_or_equal':
        return Number(value) >= Number(condition.value);
      case 'less_than_or_equal':
        return Number(value) <= Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      case 'matches_regex':
        try {
          return new RegExp(String(condition.value)).test(String(value));
        } catch {
          return false;
        }
      default:
        return false;
    }
  }, []);

  // Evaluate rollout
  const evaluateRollout = useCallback((
    rollout: RolloutConfig,
    context: UserContext | null
  ): boolean => {
    if (rollout.type === 'percentage' && rollout.percentage !== undefined) {
      // Use consistent hashing based on user ID
      const hash = context?.userId 
        ? hashString(context.userId) % 100 
        : Math.random() * 100;
      return hash < rollout.percentage;
    }

    if (rollout.type === 'scheduled' && rollout.schedule) {
      const now = new Date();
      if (now < rollout.schedule.startDate) return false;
      if (rollout.schedule.endDate && now > rollout.schedule.endDate) return true;
      
      // Calculate gradual rollout progress
      const totalDuration = (rollout.schedule.endDate?.getTime() || now.getTime()) - 
        rollout.schedule.startDate.getTime();
      const elapsed = now.getTime() - rollout.schedule.startDate.getTime();
      const progress = elapsed / totalDuration;
      const currentPercentage = progress * rollout.schedule.targetPercentage;
      
      const hash = context?.userId 
        ? hashString(context.userId) % 100 
        : Math.random() * 100;
      return hash < currentPercentage;
    }

    return true;
  }, []);

  // Main evaluation function
  const evaluate = useCallback((key: string): FeatureEvaluation => {
    // Check override first
    if (overrides.has(key)) {
      return {
        key,
        value: overrides.get(key)!,
        reason: 'OVERRIDE',
      };
    }

    const feature = features.get(key);
    if (!feature) {
      return {
        key,
        value: false,
        reason: 'NOT_FOUND',
      };
    }

    // Check if feature is disabled
    if (!feature.enabled) {
      return {
        key,
        value: feature.defaultValue,
        reason: 'DISABLED',
      };
    }

    // Check expiration
    if (feature.expiresAt && new Date() > feature.expiresAt) {
      return {
        key,
        value: feature.defaultValue,
        reason: 'DISABLED',
      };
    }

    // Evaluate targeting rules
    if (feature.targeting) {
      const sortedRules = [...feature.targeting.rules].sort(
        (a, b) => b.priority - a.priority
      );

      for (const rule of sortedRules) {
        const matches = rule.conditions.every(cond => 
          evaluateCondition(cond, userContext)
        );

        if (matches) {
          const variant = feature.variants?.find(v => v.key === rule.variant);
          const result: FeatureEvaluation = {
            key,
            value: variant?.value ?? true,
            variant: rule.variant,
            reason: 'TARGETING_MATCH',
            ruleId: rule.id,
          };

          // Track analytics
          trackEvaluation(key, result);
          onEvaluation?.(result, userContext);
          return result;
        }
      }
    }

    // Evaluate rollout
    if (feature.rollout) {
      if (!evaluateRollout(feature.rollout, userContext)) {
        return {
          key,
          value: feature.defaultValue,
          reason: 'ROLLOUT',
        };
      }
    }

    // Select variant by weight
    if (feature.variants && feature.variants.length > 0) {
      const variant = selectVariantByWeight(feature.variants, userContext?.userId);
      const result: FeatureEvaluation = {
        key,
        value: variant.value,
        variant: variant.key,
        reason: 'DEFAULT',
      };

      trackEvaluation(key, result);
      onEvaluation?.(result, userContext);
      return result;
    }

    const result: FeatureEvaluation = {
      key,
      value: true,
      reason: 'DEFAULT',
    };

    trackEvaluation(key, result);
    onEvaluation?.(result, userContext);
    return result;
  }, [features, userContext, overrides, evaluateCondition, evaluateRollout, onEvaluation]);

  // Track evaluation for analytics
  const trackEvaluation = useCallback((key: string, evaluation: FeatureEvaluation) => {
    const current = analyticsRef.current.get(key) || {
      evaluations: 0,
      variants: {},
      errors: 0,
      lastEvaluated: new Date(),
    };

    current.evaluations++;
    current.lastEvaluated = new Date();
    
    if (evaluation.variant) {
      current.variants[evaluation.variant] = (current.variants[evaluation.variant] || 0) + 1;
    }
    
    if (evaluation.reason === 'ERROR') {
      current.errors++;
    }

    analyticsRef.current.set(key, current);
  }, []);

  const setOverride = useCallback((key: string, value: FeatureValue) => {
    setOverrides(prev => new Map(prev).set(key, value));
  }, []);

  const clearOverride = useCallback((key: string) => {
    setOverrides(prev => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const contextValue = useMemo((): FeatureToggleContextValue => ({
    features,
    userContext,
    overrides,
    analytics: analyticsRef.current,
    evaluate,
    setOverride,
    clearOverride,
    setUserContext,
    refreshFeatures,
  }), [features, userContext, overrides, evaluate, setOverride, clearOverride, refreshFeatures]);

  return React.createElement(
    FeatureToggleContext.Provider,
    { value: contextValue },
    children
  );
}

// ============================================================================
// HOOKS
// ============================================================================

export function useFeatureToggle(key: string): FeatureEvaluation {
  const context = useContext(FeatureToggleContext);
  if (!context) {
    throw new Error('useFeatureToggle must be used within FeatureToggleProvider');
  }
  return context.evaluate(key);
}

export function useFeatureEnabled(key: string): boolean {
  const evaluation = useFeatureToggle(key);
  return Boolean(evaluation.value);
}

export function useFeatureValue<T extends FeatureValue>(key: string, defaultValue: T): T {
  const evaluation = useFeatureToggle(key);
  return (evaluation.value as T) ?? defaultValue;
}

export function useFeatureVariant(key: string): string | undefined {
  const evaluation = useFeatureToggle(key);
  return evaluation.variant;
}

export function useFeatureOverride(): {
  setOverride: (key: string, value: FeatureValue) => void;
  clearOverride: (key: string) => void;
  clearAllOverrides: () => void;
} {
  const context = useContext(FeatureToggleContext);
  if (!context) {
    throw new Error('useFeatureOverride must be used within FeatureToggleProvider');
  }

  const clearAllOverrides = useCallback(() => {
    // Clear all overrides by setting empty map
    // This is a workaround since we don't have direct access to setOverrides
    context.overrides.forEach((_, key) => context.clearOverride(key));
  }, [context]);

  return {
    setOverride: context.setOverride,
    clearOverride: context.clearOverride,
    clearAllOverrides,
  };
}

export function useFeatureAnalytics(key: string): FeatureAnalytics | null {
  const context = useContext(FeatureToggleContext);
  if (!context) {
    throw new Error('useFeatureAnalytics must be used within FeatureToggleProvider');
  }
  return context.analytics.get(key) || null;
}

// ============================================================================
// COMPONENTS
// ============================================================================

export interface FeatureGateComponentProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGateComponent({
  feature,
  children,
  fallback = null,
}: FeatureGateComponentProps): React.ReactElement | null {
  const isEnabled = useFeatureEnabled(feature);
  return React.createElement(React.Fragment, null, isEnabled ? children : fallback);
}

// ============================================================================
// UTILITIES
// ============================================================================

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function selectVariantByWeight(variants: FeatureVariant[], userId?: string): FeatureVariant {
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  const hash = userId ? hashString(userId) % totalWeight : Math.random() * totalWeight;
  
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (hash < cumulative) {
      return variant;
    }
  }
  
  return variants[0];
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createFeatureToggle(
  key: string,
  options: Partial<FeatureToggle> = {}
): FeatureToggle {
  return {
    key,
    name: options.name || key,
    description: options.description,
    defaultValue: options.defaultValue ?? false,
    enabled: options.enabled ?? true,
    targeting: options.targeting,
    rollout: options.rollout,
    variants: options.variants,
    metadata: options.metadata,
    createdAt: options.createdAt || new Date(),
    updatedAt: options.updatedAt || new Date(),
    expiresAt: options.expiresAt,
  };
}

export function createTargetingRule(
  id: string,
  conditions: TargetingCondition[],
  variant: string,
  priority: number = 0
): TargetingRule {
  return { id, conditions, variant, priority };
}

export default useFeatureToggle;
