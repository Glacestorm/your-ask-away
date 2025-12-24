/**
 * KB 4.5 - Phase 10: Feature Flags & A/B Testing
 * 
 * Features:
 * - Feature Flag Management
 * - A/B Testing Support
 * - Gradual Rollouts
 * - User Targeting
 * - Analytics Integration
 * - Remote Config Support
 * - Override Management
 * - Flag Dependencies
 */

import React, { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export type FlagValue = boolean | string | number | Record<string, unknown>;

export interface FeatureFlag<T extends FlagValue = boolean> {
  key: string;
  defaultValue: T;
  description?: string;
  enabled?: boolean;
  variants?: FlagVariant<T>[];
  targeting?: TargetingRule[];
  rollout?: RolloutConfig;
  dependencies?: string[];
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FlagVariant<T extends FlagValue = FlagValue> {
  key: string;
  value: T;
  weight: number;
  description?: string;
}

export interface TargetingRule {
  id: string;
  attribute: string;
  operator: TargetingOperator;
  value: unknown;
  flagValue?: FlagValue;
  variantKey?: string;
}

export type TargetingOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'in'
  | 'not_in'
  | 'regex'
  | 'semver_gt'
  | 'semver_lt'
  | 'semver_eq';

export interface RolloutConfig {
  percentage: number;
  sticky?: boolean;
  seed?: string;
}

export interface UserContext {
  id: string;
  email?: string;
  attributes?: Record<string, unknown>;
  groups?: string[];
  customData?: Record<string, unknown>;
}

export interface FlagEvaluation<T extends FlagValue = FlagValue> {
  flagKey: string;
  value: T;
  variant?: string;
  reason: EvaluationReason;
  ruleId?: string;
  timestamp: Date;
}

export type EvaluationReason = 
  | 'default'
  | 'targeting'
  | 'rollout'
  | 'override'
  | 'dependency_failed'
  | 'disabled'
  | 'error';

export interface ABTestConfig {
  experimentId: string;
  variants: ABVariant[];
  allocation?: number;
  startDate?: Date;
  endDate?: Date;
  targeting?: TargetingRule[];
  metrics?: string[];
}

export interface ABVariant {
  key: string;
  weight: number;
  payload?: Record<string, unknown>;
}

export interface ABExposure {
  experimentId: string;
  variantKey: string;
  userId: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

export interface FeatureFlagProviderProps {
  children: ReactNode;
  flags?: FeatureFlag[];
  userContext?: UserContext;
  onEvaluation?: (evaluation: FlagEvaluation) => void;
  onExposure?: (exposure: ABExposure) => void;
  remoteConfigUrl?: string;
  refreshInterval?: number;
  overrides?: Record<string, FlagValue>;
}

// ============================================================================
// Context
// ============================================================================

interface FeatureFlagContextValue {
  flags: Map<string, FeatureFlag>;
  userContext: UserContext | null;
  overrides: Map<string, FlagValue>;
  evaluations: Map<string, FlagEvaluation>;
  experiments: Map<string, ABTestConfig>;
  exposures: Map<string, ABExposure>;
  getFlag: <T extends FlagValue>(key: string) => T;
  isEnabled: (key: string) => boolean;
  getVariant: <T extends FlagValue>(key: string) => { value: T; variant?: string };
  setOverride: (key: string, value: FlagValue) => void;
  clearOverride: (key: string) => void;
  clearAllOverrides: () => void;
  registerFlag: (flag: FeatureFlag) => void;
  unregisterFlag: (key: string) => void;
  setUserContext: (context: UserContext) => void;
  refreshFlags: () => Promise<void>;
  getExperimentVariant: (experimentId: string) => ABVariant | null;
  trackExposure: (experimentId: string) => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

// ============================================================================
// Utilities
// ============================================================================

/**
 * Hash function for consistent bucketing
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Get bucket for rollout percentage
 */
function getBucket(userId: string, seed: string = ''): number {
  const hash = hashString(`${userId}:${seed}`);
  return (hash % 100) + 1;
}

/**
 * Evaluate targeting rule
 */
function evaluateRule(rule: TargetingRule, context: UserContext): boolean {
  const attributeValue = getAttributeValue(context, rule.attribute);
  
  switch (rule.operator) {
    case 'equals':
      return attributeValue === rule.value;
    case 'not_equals':
      return attributeValue !== rule.value;
    case 'contains':
      return String(attributeValue).includes(String(rule.value));
    case 'not_contains':
      return !String(attributeValue).includes(String(rule.value));
    case 'starts_with':
      return String(attributeValue).startsWith(String(rule.value));
    case 'ends_with':
      return String(attributeValue).endsWith(String(rule.value));
    case 'greater_than':
      return Number(attributeValue) > Number(rule.value);
    case 'less_than':
      return Number(attributeValue) < Number(rule.value);
    case 'in':
      return Array.isArray(rule.value) && rule.value.includes(attributeValue);
    case 'not_in':
      return Array.isArray(rule.value) && !rule.value.includes(attributeValue);
    case 'regex':
      try {
        return new RegExp(String(rule.value)).test(String(attributeValue));
      } catch {
        return false;
      }
    case 'semver_gt':
    case 'semver_lt':
    case 'semver_eq':
      return compareSemver(String(attributeValue), String(rule.value), rule.operator);
    default:
      return false;
  }
}

/**
 * Get attribute value from context
 */
function getAttributeValue(context: UserContext, attribute: string): unknown {
  if (attribute === 'id') return context.id;
  if (attribute === 'email') return context.email;
  if (attribute.startsWith('attributes.')) {
    return context.attributes?.[attribute.slice(11)];
  }
  if (attribute.startsWith('customData.')) {
    return context.customData?.[attribute.slice(11)];
  }
  if (attribute === 'groups') return context.groups;
  return context.attributes?.[attribute];
}

/**
 * Simple semver comparison
 */
function compareSemver(a: string, b: string, operator: string): boolean {
  const parseVersion = (v: string) => v.split('.').map(n => parseInt(n, 10) || 0);
  const va = parseVersion(a);
  const vb = parseVersion(b);
  
  for (let i = 0; i < Math.max(va.length, vb.length); i++) {
    const na = va[i] || 0;
    const nb = vb[i] || 0;
    if (na > nb) return operator === 'semver_gt';
    if (na < nb) return operator === 'semver_lt';
  }
  return operator === 'semver_eq';
}

/**
 * Select variant based on weights
 */
function selectVariant<T extends FlagValue>(
  variants: FlagVariant<T>[],
  userId: string,
  seed: string = ''
): FlagVariant<T> | null {
  if (!variants.length) return null;
  
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  const bucket = getBucket(userId, seed) / 100 * totalWeight;
  
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (bucket <= cumulative) {
      return variant;
    }
  }
  
  return variants[variants.length - 1];
}

// ============================================================================
// Provider Component
// ============================================================================

export function FeatureFlagProvider({
  children,
  flags: initialFlags = [],
  userContext: initialUserContext,
  onEvaluation,
  onExposure,
  remoteConfigUrl,
  refreshInterval = 60000,
  overrides: initialOverrides = {},
}: FeatureFlagProviderProps) {
  const [flags, setFlags] = useState<Map<string, FeatureFlag>>(() => {
    const map = new Map<string, FeatureFlag>();
    initialFlags.forEach(flag => map.set(flag.key, flag));
    return map;
  });
  
  const [userContext, setUserContext] = useState<UserContext | null>(initialUserContext || null);
  const [overrides, setOverrides] = useState<Map<string, FlagValue>>(() => new Map(Object.entries(initialOverrides)));
  const [evaluations] = useState<Map<string, FlagEvaluation>>(() => new Map());
  const [experiments] = useState<Map<string, ABTestConfig>>(() => new Map());
  const [exposures] = useState<Map<string, ABExposure>>(() => new Map());
  
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch remote flags
  const refreshFlags = useCallback(async () => {
    if (!remoteConfigUrl) return;
    
    try {
      const response = await fetch(remoteConfigUrl);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.flags)) {
          setFlags(prev => {
            const newMap = new Map(prev);
            data.flags.forEach((flag: FeatureFlag) => newMap.set(flag.key, flag));
            return newMap;
          });
        }
      }
    } catch (error) {
      console.error('[FeatureFlags] Failed to refresh flags:', error);
    }
  }, [remoteConfigUrl]);

  // Auto-refresh
  useEffect(() => {
    if (remoteConfigUrl && refreshInterval > 0) {
      refreshFlags();
      refreshTimeoutRef.current = setInterval(refreshFlags, refreshInterval);
      return () => {
        if (refreshTimeoutRef.current) {
          clearInterval(refreshTimeoutRef.current);
        }
      };
    }
  }, [remoteConfigUrl, refreshInterval, refreshFlags]);

  // Evaluate flag
  const evaluateFlag = useCallback(<T extends FlagValue>(
    flag: FeatureFlag<T>,
    context: UserContext | null
  ): FlagEvaluation<T> => {
    const evaluation: FlagEvaluation<T> = {
      flagKey: flag.key,
      value: flag.defaultValue,
      reason: 'default',
      timestamp: new Date(),
    };

    // Check override
    if (overrides.has(flag.key)) {
      evaluation.value = overrides.get(flag.key) as T;
      evaluation.reason = 'override';
      return evaluation;
    }

    // Check if disabled
    if (flag.enabled === false) {
      evaluation.reason = 'disabled';
      return evaluation;
    }

    // Check dependencies
    if (flag.dependencies?.length) {
      for (const depKey of flag.dependencies) {
        const depFlag = flags.get(depKey);
        if (depFlag && !evaluateFlag(depFlag as FeatureFlag<boolean>, context).value) {
          evaluation.reason = 'dependency_failed';
          return evaluation;
        }
      }
    }

    // Check targeting rules
    if (context && flag.targeting?.length) {
      for (const rule of flag.targeting) {
        if (evaluateRule(rule, context)) {
          if (rule.flagValue !== undefined) {
            evaluation.value = rule.flagValue as T;
          } else if (rule.variantKey && flag.variants) {
            const variant = flag.variants.find(v => v.key === rule.variantKey);
            if (variant) {
              evaluation.value = variant.value;
              evaluation.variant = variant.key;
            }
          }
          evaluation.reason = 'targeting';
          evaluation.ruleId = rule.id;
          return evaluation;
        }
      }
    }

    // Check rollout
    if (context && flag.rollout) {
      const bucket = getBucket(context.id, flag.rollout.seed || flag.key);
      if (bucket <= flag.rollout.percentage) {
        // User is in rollout
        if (flag.variants?.length) {
          const variant = selectVariant(flag.variants, context.id, flag.key);
          if (variant) {
            evaluation.value = variant.value;
            evaluation.variant = variant.key;
          }
        } else if (typeof flag.defaultValue === 'boolean') {
          evaluation.value = true as T;
        }
        evaluation.reason = 'rollout';
      }
    } else if (flag.variants?.length && context) {
      // Select variant even without rollout
      const variant = selectVariant(flag.variants, context.id, flag.key);
      if (variant) {
        evaluation.value = variant.value;
        evaluation.variant = variant.key;
        evaluation.reason = 'rollout';
      }
    }

    return evaluation;
  }, [flags, overrides]);

  // Get flag value
  const getFlag = useCallback(<T extends FlagValue>(key: string): T => {
    const flag = flags.get(key);
    if (!flag) {
      console.warn(`[FeatureFlags] Flag "${key}" not found`);
      return false as T;
    }

    const evaluation = evaluateFlag(flag as FeatureFlag<T>, userContext);
    evaluations.set(key, evaluation as FlagEvaluation);
    onEvaluation?.(evaluation as FlagEvaluation);
    
    return evaluation.value;
  }, [flags, userContext, evaluateFlag, evaluations, onEvaluation]);

  // Check if enabled
  const isEnabled = useCallback((key: string): boolean => {
    return getFlag<boolean>(key) === true;
  }, [getFlag]);

  // Get variant
  const getVariant = useCallback(<T extends FlagValue>(key: string): { value: T; variant?: string } => {
    const flag = flags.get(key);
    if (!flag) {
      return { value: false as T };
    }

    const evaluation = evaluateFlag(flag as FeatureFlag<T>, userContext);
    evaluations.set(key, evaluation as FlagEvaluation);
    onEvaluation?.(evaluation as FlagEvaluation);
    
    return { value: evaluation.value, variant: evaluation.variant };
  }, [flags, userContext, evaluateFlag, evaluations, onEvaluation]);

  // Override management
  const setOverride = useCallback((key: string, value: FlagValue) => {
    setOverrides(prev => new Map(prev).set(key, value));
  }, []);

  const clearOverride = useCallback((key: string) => {
    setOverrides(prev => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const clearAllOverrides = useCallback(() => {
    setOverrides(new Map());
  }, []);

  // Flag registration
  const registerFlag = useCallback((flag: FeatureFlag) => {
    setFlags(prev => new Map(prev).set(flag.key, flag));
  }, []);

  const unregisterFlag = useCallback((key: string) => {
    setFlags(prev => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  // A/B Testing
  const getExperimentVariant = useCallback((experimentId: string): ABVariant | null => {
    const experiment = experiments.get(experimentId);
    if (!experiment || !userContext) return null;

    // Check date range
    const now = new Date();
    if (experiment.startDate && now < experiment.startDate) return null;
    if (experiment.endDate && now > experiment.endDate) return null;

    // Check targeting
    if (experiment.targeting?.length) {
      const matches = experiment.targeting.every(rule => evaluateRule(rule, userContext));
      if (!matches) return null;
    }

    // Check allocation
    if (experiment.allocation !== undefined) {
      const bucket = getBucket(userContext.id, experimentId);
      if (bucket > experiment.allocation) return null;
    }

    // Select variant
    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
    const bucket = getBucket(userContext.id, `${experimentId}:variant`) / 100 * totalWeight;
    
    let cumulative = 0;
    for (const variant of experiment.variants) {
      cumulative += variant.weight;
      if (bucket <= cumulative) {
        return variant;
      }
    }

    return experiment.variants[experiment.variants.length - 1] || null;
  }, [experiments, userContext]);

  const trackExposure = useCallback((experimentId: string) => {
    if (!userContext) return;

    const variant = getExperimentVariant(experimentId);
    if (!variant) return;

    const exposure: ABExposure = {
      experimentId,
      variantKey: variant.key,
      userId: userContext.id,
      timestamp: new Date(),
      context: userContext.attributes,
    };

    exposures.set(`${experimentId}:${userContext.id}`, exposure);
    onExposure?.(exposure);
  }, [userContext, getExperimentVariant, exposures, onExposure]);

  const contextValue: FeatureFlagContextValue = {
    flags,
    userContext,
    overrides,
    evaluations,
    experiments,
    exposures,
    getFlag,
    isEnabled,
    getVariant,
    setOverride,
    clearOverride,
    clearAllOverrides,
    registerFlag,
    unregisterFlag,
    setUserContext,
    refreshFlags,
    getExperimentVariant,
    trackExposure,
  };

  return React.createElement(
    FeatureFlagContext.Provider,
    { value: contextValue },
    children
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Access feature flag context
 */
export function useFeatureFlagContext(): FeatureFlagContextValue {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlagContext must be used within a FeatureFlagProvider');
  }
  return context;
}

/**
 * Get a feature flag value
 */
export function useFeatureFlag<T extends FlagValue = boolean>(
  key: string,
  defaultValue?: T
): T {
  const context = useContext(FeatureFlagContext);
  
  if (!context) {
    console.warn('[FeatureFlags] No provider found, returning default');
    return (defaultValue ?? false) as T;
  }

  return context.getFlag<T>(key) ?? (defaultValue as T);
}

/**
 * Check if a feature is enabled
 */
export function useIsFeatureEnabled(key: string): boolean {
  return useFeatureFlag<boolean>(key, false);
}

/**
 * Get variant information
 */
export function useFeatureVariant<T extends FlagValue = FlagValue>(
  key: string
): { value: T; variant?: string; isLoading: boolean } {
  const context = useContext(FeatureFlagContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  if (!context) {
    return { value: false as T, isLoading };
  }

  const result = context.getVariant<T>(key);
  return { ...result, isLoading };
}

/**
 * A/B Test hook
 */
export interface UseABTestOptions {
  experimentId: string;
  trackOnMount?: boolean;
}

export interface UseABTestReturn<T = Record<string, unknown>> {
  variant: ABVariant | null;
  variantKey: string | null;
  payload: T | null;
  isInExperiment: boolean;
  trackExposure: () => void;
}

export function useABTest<T = Record<string, unknown>>(
  options: UseABTestOptions
): UseABTestReturn<T> {
  const { experimentId, trackOnMount = true } = options;
  const context = useContext(FeatureFlagContext);
  const hasTracked = useRef(false);

  const variant = useMemo(() => {
    return context?.getExperimentVariant(experimentId) || null;
  }, [context, experimentId]);

  const trackExposure = useCallback(() => {
    context?.trackExposure(experimentId);
  }, [context, experimentId]);

  useEffect(() => {
    if (trackOnMount && variant && !hasTracked.current) {
      hasTracked.current = true;
      trackExposure();
    }
  }, [trackOnMount, variant, trackExposure]);

  return {
    variant,
    variantKey: variant?.key || null,
    payload: (variant?.payload as T) || null,
    isInExperiment: variant !== null,
    trackExposure,
  };
}

/**
 * Feature gate component
 */
export interface FeatureGateProps {
  flag: string;
  children: ReactNode;
  fallback?: ReactNode;
  inverted?: boolean;
}

export function FeatureGate({ flag, children, fallback = null, inverted = false }: FeatureGateProps) {
  const isEnabledFlag = useIsFeatureEnabled(flag);
  const shouldShow = inverted ? !isEnabledFlag : isEnabledFlag;
  return React.createElement(React.Fragment, null, shouldShow ? children : fallback);
}

/**
 * Register flags at component level
 */
export function useRegisterFlags(flags: FeatureFlag[]): void {
  const context = useContext(FeatureFlagContext);

  useEffect(() => {
    if (!context) return;

    flags.forEach(flag => context.registerFlag(flag));

    return () => {
      flags.forEach(flag => context.unregisterFlag(flag.key));
    };
  }, [context, flags]);
}

/**
 * Override flags for development/testing
 */
export function useFeatureFlagOverrides(): {
  setOverride: (key: string, value: FlagValue) => void;
  clearOverride: (key: string) => void;
  clearAll: () => void;
  overrides: Map<string, FlagValue>;
} {
  const context = useContext(FeatureFlagContext);

  if (!context) {
    return {
      setOverride: () => {},
      clearOverride: () => {},
      clearAll: () => {},
      overrides: new Map(),
    };
  }

  return {
    setOverride: context.setOverride,
    clearOverride: context.clearOverride,
    clearAll: context.clearAllOverrides,
    overrides: context.overrides,
  };
}

// ============================================================================
// Global API (for non-React usage)
// ============================================================================

let globalFlags: Map<string, FeatureFlag> = new Map();
let globalUserContext: UserContext | null = null;
let globalOverrides: Map<string, FlagValue> = new Map();

export const KBFeatureFlags = {
  init: (flags: FeatureFlag[], userContext?: UserContext) => {
    globalFlags = new Map(flags.map(f => [f.key, f]));
    globalUserContext = userContext || null;
  },

  setUserContext: (context: UserContext) => {
    globalUserContext = context;
  },

  isEnabled: (key: string): boolean => {
    const flag = globalFlags.get(key);
    if (!flag) return false;
    if (globalOverrides.has(key)) {
      return globalOverrides.get(key) === true;
    }
    if (flag.enabled === false) return false;
    if (!globalUserContext || !flag.rollout) {
      return flag.defaultValue === true;
    }
    const bucket = getBucket(globalUserContext.id, flag.rollout.seed || flag.key);
    return bucket <= flag.rollout.percentage;
  },

  getValue: <T extends FlagValue>(key: string): T | undefined => {
    if (globalOverrides.has(key)) {
      return globalOverrides.get(key) as T;
    }
    return globalFlags.get(key)?.defaultValue as T;
  },

  setOverride: (key: string, value: FlagValue) => {
    globalOverrides.set(key, value);
  },

  clearOverride: (key: string) => {
    globalOverrides.delete(key);
  },

  clearAllOverrides: () => {
    globalOverrides.clear();
  },

  registerFlag: (flag: FeatureFlag) => {
    globalFlags.set(flag.key, flag);
  },

  getAllFlags: () => Array.from(globalFlags.values()),

  reset: () => {
    globalFlags.clear();
    globalUserContext = null;
    globalOverrides.clear();
  },
};

// ============================================================================
// Exports
// ============================================================================

export default useFeatureFlag;
