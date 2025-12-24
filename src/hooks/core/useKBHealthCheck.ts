/**
 * KB 4.5 - Health Check & Application Monitoring
 * 
 * Comprehensive health monitoring for applications.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  message?: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface HealthCheck {
  name: string;
  check: () => Promise<boolean | HealthCheckResult>;
  timeout?: number;
  critical?: boolean;
  interval?: number;
  tags?: string[];
}

export interface HealthReport {
  status: HealthStatus;
  checks: HealthCheckResult[];
  timestamp: number;
  version?: string;
  uptime: number;
}

export interface HealthCheckConfig {
  /** Default check interval in ms */
  interval?: number;
  /** Default timeout per check in ms */
  timeout?: number;
  /** Application version */
  version?: string;
  /** Enable automatic checks */
  autoCheck?: boolean;
  /** Callback on status change */
  onStatusChange?: (status: HealthStatus, report: HealthReport) => void;
  /** Enable logging */
  logging?: boolean;
}

export interface LivenessProbe {
  isAlive: boolean;
  lastCheck: number;
  consecutiveFailures: number;
}

export interface ReadinessProbe {
  isReady: boolean;
  reason?: string;
  lastCheck: number;
}

export interface StartupProbe {
  isStarted: boolean;
  startTime: number;
  duration: number;
}

// ============================================================================
// HEALTH CHECKER
// ============================================================================

class HealthChecker {
  private checks: Map<string, HealthCheck> = new Map();
  private results: Map<string, HealthCheckResult> = new Map();
  private config: Required<HealthCheckConfig>;
  private startTime: number;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private lastStatus: HealthStatus = 'unknown';
  private consecutiveFailures = 0;

  constructor(config: HealthCheckConfig = {}) {
    this.config = {
      interval: config.interval ?? 30000,
      timeout: config.timeout ?? 5000,
      version: config.version ?? '1.0.0',
      autoCheck: config.autoCheck ?? true,
      onStatusChange: config.onStatusChange ?? (() => {}),
      logging: config.logging ?? false,
    };
    this.startTime = Date.now();
  }

  register(check: HealthCheck): void {
    this.checks.set(check.name, check);

    if (this.config.autoCheck) {
      this.startCheck(check);
    }
  }

  unregister(name: string): void {
    this.checks.delete(name);
    this.results.delete(name);
    
    const timer = this.timers.get(name);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(name);
    }
  }

  private startCheck(check: HealthCheck): void {
    const interval = check.interval ?? this.config.interval;
    
    // Run immediately
    this.runCheck(check);

    // Schedule periodic checks
    const timer = setInterval(() => {
      this.runCheck(check);
    }, interval);

    this.timers.set(check.name, timer);
  }

  private async runCheck(check: HealthCheck): Promise<HealthCheckResult> {
    const start = Date.now();
    const timeout = check.timeout ?? this.config.timeout;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), timeout);
      });

      const result = await Promise.race([check.check(), timeoutPromise]);

      const duration = Date.now() - start;

      let checkResult: HealthCheckResult;

      if (typeof result === 'boolean') {
        checkResult = {
          name: check.name,
          status: result ? 'healthy' : 'unhealthy',
          duration,
          timestamp: Date.now(),
        };
      } else {
        checkResult = {
          ...result,
          duration,
          timestamp: Date.now(),
        };
      }

      this.results.set(check.name, checkResult);

      if (this.config.logging) {
        console.log(`[HealthCheck] ${check.name}: ${checkResult.status} (${duration}ms)`);
      }

      this.updateOverallStatus();
      return checkResult;
    } catch (error) {
      const duration = Date.now() - start;
      const checkResult: HealthCheckResult = {
        name: check.name,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : String(error),
        duration,
        timestamp: Date.now(),
      };

      this.results.set(check.name, checkResult);

      if (this.config.logging) {
        console.error(`[HealthCheck] ${check.name} failed:`, error);
      }

      this.updateOverallStatus();
      return checkResult;
    }
  }

  private updateOverallStatus(): void {
    const newStatus = this.calculateOverallStatus();
    
    if (newStatus !== this.lastStatus) {
      this.lastStatus = newStatus;
      this.config.onStatusChange(newStatus, this.getReport());
    }

    if (newStatus === 'unhealthy') {
      this.consecutiveFailures++;
    } else {
      this.consecutiveFailures = 0;
    }
  }

  private calculateOverallStatus(): HealthStatus {
    const results = Array.from(this.results.values());
    
    if (results.length === 0) return 'unknown';

    const criticalChecks = Array.from(this.checks.entries())
      .filter(([, check]) => check.critical)
      .map(([name]) => name);

    // Check critical services first
    for (const name of criticalChecks) {
      const result = this.results.get(name);
      if (result?.status === 'unhealthy') {
        return 'unhealthy';
      }
    }

    const unhealthyCount = results.filter((r) => r.status === 'unhealthy').length;
    const degradedCount = results.filter((r) => r.status === 'degraded').length;

    if (unhealthyCount > 0) {
      return 'degraded';
    }

    if (degradedCount > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  async runAllChecks(): Promise<HealthReport> {
    const promises = Array.from(this.checks.values()).map((check) => 
      this.runCheck(check)
    );

    await Promise.all(promises);
    return this.getReport();
  }

  getReport(): HealthReport {
    return {
      status: this.calculateOverallStatus(),
      checks: Array.from(this.results.values()),
      timestamp: Date.now(),
      version: this.config.version,
      uptime: Date.now() - this.startTime,
    };
  }

  getCheck(name: string): HealthCheckResult | undefined {
    return this.results.get(name);
  }

  getUptime(): number {
    return Date.now() - this.startTime;
  }

  destroy(): void {
    this.timers.forEach((timer) => clearInterval(timer));
    this.timers.clear();
    this.checks.clear();
    this.results.clear();
  }
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Main Health Check Hook
 */
export function useKBHealthCheck(config: HealthCheckConfig = {}) {
  const [report, setReport] = useState<HealthReport>({
    status: 'unknown',
    checks: [],
    timestamp: Date.now(),
    version: config.version,
    uptime: 0,
  });

  const checkerRef = useRef<HealthChecker | null>(null);

  // Initialize checker
  useMemo(() => {
    if (!checkerRef.current) {
      checkerRef.current = new HealthChecker({
        ...config,
        onStatusChange: (status, report) => {
          setReport(report);
          config.onStatusChange?.(status, report);
        },
      });
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      checkerRef.current?.destroy();
    };
  }, []);

  const register = useCallback((check: HealthCheck) => {
    checkerRef.current?.register(check);
  }, []);

  const unregister = useCallback((name: string) => {
    checkerRef.current?.unregister(name);
  }, []);

  const runAll = useCallback(async (): Promise<HealthReport> => {
    if (!checkerRef.current) return report;
    const newReport = await checkerRef.current.runAllChecks();
    setReport(newReport);
    return newReport;
  }, [report]);

  const getCheck = useCallback((name: string) => {
    return checkerRef.current?.getCheck(name);
  }, []);

  return {
    report,
    status: report.status,
    checks: report.checks,
    uptime: report.uptime,
    isHealthy: report.status === 'healthy',
    isDegraded: report.status === 'degraded',
    isUnhealthy: report.status === 'unhealthy',
    register,
    unregister,
    runAll,
    getCheck,
  };
}

/**
 * Liveness Probe Hook
 */
export function useKBLivenessProbe(config: {
  interval?: number;
  maxFailures?: number;
  onDead?: () => void;
} = {}) {
  const [probe, setProbe] = useState<LivenessProbe>({
    isAlive: true,
    lastCheck: Date.now(),
    consecutiveFailures: 0,
  });

  const interval = config.interval ?? 10000;
  const maxFailures = config.maxFailures ?? 3;
  const checkFnRef = useRef<(() => boolean | Promise<boolean>) | null>(null);

  const setCheck = useCallback((fn: () => boolean | Promise<boolean>) => {
    checkFnRef.current = fn;
  }, []);

  useEffect(() => {
    const timer = setInterval(async () => {
      if (!checkFnRef.current) {
        setProbe((prev) => ({
          ...prev,
          isAlive: true,
          lastCheck: Date.now(),
          consecutiveFailures: 0,
        }));
        return;
      }

      try {
        const isAlive = await checkFnRef.current();
        
        setProbe((prev) => {
          const newFailures = isAlive ? 0 : prev.consecutiveFailures + 1;
          const isDead = newFailures >= maxFailures;
          
          if (isDead && prev.isAlive) {
            config.onDead?.();
          }

          return {
            isAlive: !isDead,
            lastCheck: Date.now(),
            consecutiveFailures: newFailures,
          };
        });
      } catch {
        setProbe((prev) => {
          const newFailures = prev.consecutiveFailures + 1;
          const isDead = newFailures >= maxFailures;
          
          if (isDead && prev.isAlive) {
            config.onDead?.();
          }

          return {
            isAlive: !isDead,
            lastCheck: Date.now(),
            consecutiveFailures: newFailures,
          };
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [interval, maxFailures, config.onDead]);

  return {
    ...probe,
    setCheck,
  };
}

/**
 * Readiness Probe Hook
 */
export function useKBReadinessProbe(config: {
  checks?: Array<() => boolean | Promise<boolean>>;
} = {}) {
  const [probe, setProbe] = useState<ReadinessProbe>({
    isReady: false,
    lastCheck: Date.now(),
  });

  const checksRef = useRef<Array<() => boolean | Promise<boolean>>>(config.checks ?? []);

  const addCheck = useCallback((check: () => boolean | Promise<boolean>) => {
    checksRef.current.push(check);
  }, []);

  const removeCheck = useCallback((check: () => boolean | Promise<boolean>) => {
    checksRef.current = checksRef.current.filter((c) => c !== check);
  }, []);

  const checkReadiness = useCallback(async (): Promise<boolean> => {
    if (checksRef.current.length === 0) {
      setProbe({ isReady: true, lastCheck: Date.now() });
      return true;
    }

    try {
      const results = await Promise.all(checksRef.current.map((check) => check()));
      const isReady = results.every((r) => r === true);
      
      setProbe({
        isReady,
        reason: isReady ? undefined : 'One or more checks failed',
        lastCheck: Date.now(),
      });

      return isReady;
    } catch (error) {
      setProbe({
        isReady: false,
        reason: error instanceof Error ? error.message : String(error),
        lastCheck: Date.now(),
      });
      return false;
    }
  }, []);

  return {
    ...probe,
    addCheck,
    removeCheck,
    checkReadiness,
  };
}

/**
 * Startup Probe Hook
 */
export function useKBStartupProbe(config: {
  initTasks?: Array<() => Promise<void>>;
  timeout?: number;
  onComplete?: () => void;
  onError?: (error: Error) => void;
} = {}) {
  const [probe, setProbe] = useState<StartupProbe>({
    isStarted: false,
    startTime: Date.now(),
    duration: 0,
  });

  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const tasks = config.initTasks ?? [];
    const startTime = Date.now();
    let isCancelled = false;

    const run = async () => {
      if (tasks.length === 0) {
        setProbe({
          isStarted: true,
          startTime,
          duration: 0,
        });
        config.onComplete?.();
        return;
      }

      try {
        for (let i = 0; i < tasks.length; i++) {
          if (isCancelled) return;
          
          await tasks[i]();
          setProgress(((i + 1) / tasks.length) * 100);
        }

        if (!isCancelled) {
          const duration = Date.now() - startTime;
          setProbe({
            isStarted: true,
            startTime,
            duration,
          });
          config.onComplete?.();
        }
      } catch (err) {
        if (!isCancelled) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          config.onError?.(error);
        }
      }
    };

    run();

    return () => {
      isCancelled = true;
    };
  }, []);

  return {
    ...probe,
    error,
    progress,
  };
}

/**
 * Dependency Health Hook
 */
export function useKBDependencyHealth(dependencies: Record<string, () => Promise<boolean>>) {
  const [health, setHealth] = useState<Record<string, HealthStatus>>({});
  const [isChecking, setIsChecking] = useState(false);

  const checkAll = useCallback(async () => {
    setIsChecking(true);
    const results: Record<string, HealthStatus> = {};

    await Promise.all(
      Object.entries(dependencies).map(async ([name, check]) => {
        try {
          const isHealthy = await check();
          results[name] = isHealthy ? 'healthy' : 'unhealthy';
        } catch {
          results[name] = 'unhealthy';
        }
      })
    );

    setHealth(results);
    setIsChecking(false);
    return results;
  }, [dependencies]);

  const checkOne = useCallback(async (name: string): Promise<HealthStatus> => {
    const check = dependencies[name];
    if (!check) return 'unknown';

    try {
      const isHealthy = await check();
      const status = isHealthy ? 'healthy' : 'unhealthy';
      setHealth((prev) => ({ ...prev, [name]: status }));
      return status;
    } catch {
      setHealth((prev) => ({ ...prev, [name]: 'unhealthy' }));
      return 'unhealthy';
    }
  }, [dependencies]);

  const allHealthy = useMemo(() => 
    Object.values(health).every((s) => s === 'healthy'),
    [health]
  );

  return {
    health,
    isChecking,
    allHealthy,
    checkAll,
    checkOne,
  };
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createHealthCheck(
  name: string,
  check: () => Promise<boolean | HealthCheckResult>,
  options?: Partial<Omit<HealthCheck, 'name' | 'check'>>
): HealthCheck {
  return {
    name,
    check,
    ...options,
  };
}

// Pre-built health checks
export const CommonHealthChecks = {
  /** Check if browser is online */
  network: createHealthCheck('network', async () => {
    return navigator.onLine;
  }),

  /** Check local storage availability */
  localStorage: createHealthCheck('localStorage', async () => {
    try {
      const key = '__health_check__';
      localStorage.setItem(key, 'test');
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }),

  /** Check memory usage */
  memory: createHealthCheck('memory', async () => {
    if ('memory' in performance) {
      const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      if (memory) {
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        return {
          name: 'memory',
          status: usagePercent < 80 ? 'healthy' : usagePercent < 90 ? 'degraded' : 'unhealthy',
          message: `Memory usage: ${usagePercent.toFixed(1)}%`,
          duration: 0,
          timestamp: Date.now(),
          metadata: {
            usedJSHeapSize: memory.usedJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
            usagePercent,
          },
        };
      }
    }
    return true;
  }),

  /** Check API endpoint */
  createApiCheck: (name: string, url: string, timeout = 5000): HealthCheck => 
    createHealthCheck(name, async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
        });
        return response.ok;
      } finally {
        clearTimeout(timeoutId);
      }
    }, { timeout }),
};

export default useKBHealthCheck;
