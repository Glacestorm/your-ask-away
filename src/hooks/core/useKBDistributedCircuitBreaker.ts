/**
 * KB 4.5 - Distributed Circuit Breaker Hook (Phase 17)
 * Coordinated circuit breaker across multiple nodes
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  name: string;
  failureThreshold: number;
  successThreshold: number;
  timeout: number; // ms to wait before transitioning from OPEN to HALF_OPEN
  halfOpenMaxCalls: number;
  windowSize: number; // time window for failure counting
  slowCallThreshold?: number; // ms
  slowCallRateThreshold?: number; // percentage
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
  onFailure?: (error: Error, count: number) => void;
  onSuccess?: (duration: number) => void;
}

export interface CircuitStats {
  state: CircuitState;
  failures: number;
  successes: number;
  totalCalls: number;
  lastFailure?: Date;
  lastSuccess?: Date;
  lastStateChange: Date;
  halfOpenCalls: number;
  slowCalls: number;
  averageResponseTime: number;
}

export interface CircuitBreakerReturn<T> {
  // State
  state: CircuitState;
  stats: CircuitStats;
  isOpen: boolean;
  isClosed: boolean;
  isHalfOpen: boolean;
  
  // Actions
  execute: <R>(fn: () => Promise<R>) => Promise<R>;
  forceOpen: () => void;
  forceClose: () => void;
  reset: () => void;
  getHealth: () => CircuitHealth;
}

export interface CircuitHealth {
  healthy: boolean;
  state: CircuitState;
  failureRate: number;
  slowCallRate: number;
  lastError?: Error;
}

// ============================================================================
// CIRCUIT BREAKER IMPLEMENTATION
// ============================================================================

class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures: number = 0;
  private successes: number = 0;
  private halfOpenCalls: number = 0;
  private slowCalls: number = 0;
  private totalCalls: number = 0;
  private responseTimes: number[] = [];
  private lastFailure?: Date;
  private lastSuccess?: Date;
  private lastStateChange: Date = new Date();
  private openedAt?: Date;
  private lastError?: Error;
  private callTimestamps: number[] = [];

  constructor(private config: CircuitBreakerConfig) {}

  private cleanOldCalls(): void {
    const cutoff = Date.now() - this.config.windowSize;
    this.callTimestamps = this.callTimestamps.filter(t => t > cutoff);
  }

  private setState(newState: CircuitState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.lastStateChange = new Date();
      
      if (newState === 'OPEN') {
        this.openedAt = new Date();
      } else if (newState === 'HALF_OPEN') {
        this.halfOpenCalls = 0;
      } else if (newState === 'CLOSED') {
        this.failures = 0;
        this.slowCalls = 0;
      }

      this.config.onStateChange?.(oldState, newState);
    }
  }

  private checkTimeoutExpired(): boolean {
    if (this.state !== 'OPEN' || !this.openedAt) return false;
    return Date.now() - this.openedAt.getTime() >= this.config.timeout;
  }

  async execute<R>(fn: () => Promise<R>): Promise<R> {
    // Check if we should transition from OPEN to HALF_OPEN
    if (this.state === 'OPEN' && this.checkTimeoutExpired()) {
      this.setState('HALF_OPEN');
    }

    // Reject if open
    if (this.state === 'OPEN') {
      throw new CircuitOpenError(
        `Circuit breaker '${this.config.name}' is OPEN`,
        this.config.name,
        this.lastError
      );
    }

    // Check half-open limit
    if (this.state === 'HALF_OPEN' && this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
      throw new CircuitOpenError(
        `Circuit breaker '${this.config.name}' half-open limit reached`,
        this.config.name
      );
    }

    this.cleanOldCalls();
    this.callTimestamps.push(Date.now());
    this.totalCalls++;

    if (this.state === 'HALF_OPEN') {
      this.halfOpenCalls++;
    }

    const startTime = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.recordSuccess(duration);
      return result;
    } catch (error) {
      this.recordFailure(error as Error);
      throw error;
    }
  }

  private recordSuccess(duration: number): void {
    this.successes++;
    this.lastSuccess = new Date();
    this.responseTimes.push(duration);
    
    // Keep only last 100 response times
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }

    // Check for slow call
    if (this.config.slowCallThreshold && duration > this.config.slowCallThreshold) {
      this.slowCalls++;
    }

    this.config.onSuccess?.(duration);

    if (this.state === 'HALF_OPEN') {
      if (this.successes >= this.config.successThreshold) {
        this.setState('CLOSED');
      }
    }
  }

  private recordFailure(error: Error): void {
    this.failures++;
    this.lastFailure = new Date();
    this.lastError = error;
    
    this.config.onFailure?.(error, this.failures);

    if (this.state === 'HALF_OPEN') {
      this.setState('OPEN');
    } else if (this.failures >= this.config.failureThreshold) {
      this.setState('OPEN');
    }
  }

  getState(): CircuitState {
    if (this.state === 'OPEN' && this.checkTimeoutExpired()) {
      this.setState('HALF_OPEN');
    }
    return this.state;
  }

  getStats(): CircuitStats {
    const avgResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      : 0;

    return {
      state: this.getState(),
      failures: this.failures,
      successes: this.successes,
      totalCalls: this.totalCalls,
      lastFailure: this.lastFailure,
      lastSuccess: this.lastSuccess,
      lastStateChange: this.lastStateChange,
      halfOpenCalls: this.halfOpenCalls,
      slowCalls: this.slowCalls,
      averageResponseTime: avgResponseTime,
    };
  }

  getHealth(): CircuitHealth {
    this.cleanOldCalls();
    const windowCalls = this.callTimestamps.length;
    const failureRate = windowCalls > 0 ? this.failures / windowCalls : 0;
    const slowCallRate = windowCalls > 0 ? this.slowCalls / windowCalls : 0;

    return {
      healthy: this.getState() === 'CLOSED',
      state: this.getState(),
      failureRate,
      slowCallRate,
      lastError: this.lastError,
    };
  }

  forceOpen(): void {
    this.setState('OPEN');
    this.openedAt = new Date();
  }

  forceClose(): void {
    this.setState('CLOSED');
  }

  reset(): void {
    this.setState('CLOSED');
    this.failures = 0;
    this.successes = 0;
    this.halfOpenCalls = 0;
    this.slowCalls = 0;
    this.totalCalls = 0;
    this.responseTimes = [];
    this.callTimestamps = [];
    this.lastError = undefined;
    this.openedAt = undefined;
  }
}

// ============================================================================
// CUSTOM ERROR
// ============================================================================

export class CircuitOpenError extends Error {
  constructor(
    message: string,
    public readonly circuitName: string,
    public readonly lastError?: Error
  ) {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

// ============================================================================
// CIRCUIT REGISTRY
// ============================================================================

const circuitRegistry = new Map<string, CircuitBreaker>();

function getOrCreateCircuit(config: CircuitBreakerConfig): CircuitBreaker {
  let circuit = circuitRegistry.get(config.name);
  if (!circuit) {
    circuit = new CircuitBreaker(config);
    circuitRegistry.set(config.name, circuit);
  }
  return circuit;
}

export function getCircuit(name: string): CircuitBreaker | undefined {
  return circuitRegistry.get(name);
}

export function getAllCircuits(): Map<string, CircuitStats> {
  const result = new Map<string, CircuitStats>();
  circuitRegistry.forEach((circuit, name) => {
    result.set(name, circuit.getStats());
  });
  return result;
}

export function resetAllCircuits(): void {
  circuitRegistry.forEach(circuit => circuit.reset());
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useKBDistributedCircuitBreaker<T = unknown>(
  config: CircuitBreakerConfig
): CircuitBreakerReturn<T> {
  const [, forceUpdate] = useState(0);
  const circuit = useMemo(() => getOrCreateCircuit(config), [config]);

  // Polling for state updates
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(c => c + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const execute = useCallback(async <R,>(fn: () => Promise<R>): Promise<R> => {
    try {
      const result = await circuit.execute(fn);
      forceUpdate(c => c + 1);
      return result;
    } catch (error) {
      forceUpdate(c => c + 1);
      throw error;
    }
  }, [circuit]);

  const forceOpen = useCallback(() => {
    circuit.forceOpen();
    forceUpdate(c => c + 1);
  }, [circuit]);

  const forceClose = useCallback(() => {
    circuit.forceClose();
    forceUpdate(c => c + 1);
  }, [circuit]);

  const reset = useCallback(() => {
    circuit.reset();
    forceUpdate(c => c + 1);
  }, [circuit]);

  const getHealth = useCallback(() => circuit.getHealth(), [circuit]);

  const state = circuit.getState();
  const stats = circuit.getStats();

  return {
    state,
    stats,
    isOpen: state === 'OPEN',
    isClosed: state === 'CLOSED',
    isHalfOpen: state === 'HALF_OPEN',
    execute,
    forceOpen,
    forceClose,
    reset,
    getHealth,
  };
}

// ============================================================================
// CIRCUIT BREAKER GROUP
// ============================================================================

export interface CircuitGroupConfig {
  name: string;
  circuits: CircuitBreakerConfig[];
  fallbackCircuit?: string;
  loadBalancing?: 'round-robin' | 'least-failures' | 'random';
}

export function useKBCircuitBreakerGroup(config: CircuitGroupConfig): {
  execute: <R>(fn: (circuitName: string) => Promise<R>) => Promise<R>;
  getGroupHealth: () => Record<string, CircuitHealth>;
  getActiveCircuits: () => string[];
} {
  const circuits = useMemo(() => {
    return config.circuits.map(c => ({
      name: c.name,
      breaker: getOrCreateCircuit(c),
    }));
  }, [config.circuits]);

  const roundRobinIndex = useRef(0);

  const selectCircuit = useCallback((): CircuitBreaker | null => {
    const available = circuits.filter(c => c.breaker.getState() !== 'OPEN');
    
    if (available.length === 0) {
      if (config.fallbackCircuit) {
        return getCircuit(config.fallbackCircuit) || null;
      }
      return null;
    }

    switch (config.loadBalancing) {
      case 'round-robin':
        roundRobinIndex.current = (roundRobinIndex.current + 1) % available.length;
        return available[roundRobinIndex.current].breaker;
      
      case 'least-failures':
        return available.reduce((best, current) => 
          current.breaker.getStats().failures < best.breaker.getStats().failures 
            ? current : best
        ).breaker;
      
      case 'random':
      default:
        return available[Math.floor(Math.random() * available.length)].breaker;
    }
  }, [circuits, config.fallbackCircuit, config.loadBalancing]);

  const execute = useCallback(async <R,>(fn: (circuitName: string) => Promise<R>): Promise<R> => {
    const circuit = selectCircuit();
    if (!circuit) {
      throw new Error('All circuits are open');
    }

    const circuitConfig = circuits.find(c => c.breaker === circuit);
    return circuit.execute(() => fn(circuitConfig?.name || 'unknown'));
  }, [selectCircuit, circuits]);

  const getGroupHealth = useCallback((): Record<string, CircuitHealth> => {
    const result: Record<string, CircuitHealth> = {};
    circuits.forEach(({ name, breaker }) => {
      result[name] = breaker.getHealth();
    });
    return result;
  }, [circuits]);

  const getActiveCircuits = useCallback((): string[] => {
    return circuits
      .filter(c => c.breaker.getState() !== 'OPEN')
      .map(c => c.name);
  }, [circuits]);

  return {
    execute,
    getGroupHealth,
    getActiveCircuits,
  };
}

// ============================================================================
// DECORATOR
// ============================================================================

export function withCircuitBreaker<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  config: CircuitBreakerConfig
): T {
  const circuit = getOrCreateCircuit(config);
  
  return (async (...args: Parameters<T>) => {
    return circuit.execute(() => fn(...args));
  }) as T;
}

export default useKBDistributedCircuitBreaker;
