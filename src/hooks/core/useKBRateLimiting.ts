/**
 * KB 4.5 - Advanced Rate Limiting Hook (Phase 17)
 * Token Bucket, Sliding Window, Leaky Bucket algorithms
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type RateLimitAlgorithm = 'token-bucket' | 'sliding-window' | 'leaky-bucket' | 'fixed-window';

export interface RateLimitConfig {
  algorithm: RateLimitAlgorithm;
  maxRequests: number;
  windowMs: number;
  burstLimit?: number;
  refillRate?: number; // tokens per second
  queueEnabled?: boolean;
  maxQueueSize?: number;
  retryAfterMs?: number;
  onLimitReached?: (info: RateLimitInfo) => void;
  onQuotaWarning?: (remaining: number, total: number) => void;
  warningThreshold?: number; // percentage
}

export interface RateLimitInfo {
  remaining: number;
  total: number;
  resetTime: Date;
  retryAfter?: number;
  isLimited: boolean;
}

export interface RateLimitState {
  tokens: number;
  requestCount: number;
  windowStart: number;
  queue: Array<{ resolve: () => void; reject: (error: Error) => void; timestamp: number }>;
  lastRefill: number;
  bucketLevel: number; // for leaky bucket
}

export interface UseKBRateLimitReturn {
  // State
  info: RateLimitInfo;
  isLimited: boolean;
  queueSize: number;
  
  // Actions
  acquire: () => Promise<boolean>;
  tryAcquire: () => boolean;
  reset: () => void;
  getStats: () => RateLimitStats;
  
  // Config
  updateConfig: (config: Partial<RateLimitConfig>) => void;
}

export interface RateLimitStats {
  totalRequests: number;
  blockedRequests: number;
  queuedRequests: number;
  averageWaitTime: number;
  peakQueueSize: number;
  windowResets: number;
}

// ============================================================================
// TOKEN BUCKET IMPLEMENTATION
// ============================================================================

class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per ms

  constructor(maxTokens: number, refillRatePerSecond: number) {
    this.tokens = maxTokens;
    this.maxTokens = maxTokens;
    this.refillRate = refillRatePerSecond / 1000;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = elapsed * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  tryConsume(tokens: number = 1): boolean {
    this.refill();
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }

  getTokens(): number {
    this.refill();
    return this.tokens;
  }

  getResetTime(): Date {
    const tokensNeeded = this.maxTokens - this.tokens;
    const msNeeded = tokensNeeded / this.refillRate;
    return new Date(Date.now() + msNeeded);
  }

  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }
}

// ============================================================================
// SLIDING WINDOW IMPLEMENTATION
// ============================================================================

class SlidingWindow {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.windowMs;
    this.requests = this.requests.filter(t => t > cutoff);
  }

  tryConsume(): boolean {
    this.cleanup();
    if (this.requests.length < this.maxRequests) {
      this.requests.push(Date.now());
      return true;
    }
    return false;
  }

  getRemaining(): number {
    this.cleanup();
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  getResetTime(): Date {
    this.cleanup();
    if (this.requests.length === 0) {
      return new Date();
    }
    const oldestRequest = Math.min(...this.requests);
    return new Date(oldestRequest + this.windowMs);
  }

  reset(): void {
    this.requests = [];
  }
}

// ============================================================================
// LEAKY BUCKET IMPLEMENTATION
// ============================================================================

class LeakyBucket {
  private level: number = 0;
  private lastLeak: number;
  private readonly capacity: number;
  private readonly leakRate: number; // units per ms

  constructor(capacity: number, leakRatePerSecond: number) {
    this.capacity = capacity;
    this.leakRate = leakRatePerSecond / 1000;
    this.lastLeak = Date.now();
  }

  private leak(): void {
    const now = Date.now();
    const elapsed = now - this.lastLeak;
    const leaked = elapsed * this.leakRate;
    this.level = Math.max(0, this.level - leaked);
    this.lastLeak = now;
  }

  tryAdd(amount: number = 1): boolean {
    this.leak();
    if (this.level + amount <= this.capacity) {
      this.level += amount;
      return true;
    }
    return false;
  }

  getLevel(): number {
    this.leak();
    return this.level;
  }

  getRemaining(): number {
    this.leak();
    return this.capacity - this.level;
  }

  getResetTime(): Date {
    const msToEmpty = this.level / this.leakRate;
    return new Date(Date.now() + msToEmpty);
  }

  reset(): void {
    this.level = 0;
    this.lastLeak = Date.now();
  }
}

// ============================================================================
// FIXED WINDOW IMPLEMENTATION
// ============================================================================

class FixedWindow {
  private count: number = 0;
  private windowStart: number;
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.windowStart = Date.now();
  }

  private checkWindow(): void {
    const now = Date.now();
    if (now - this.windowStart >= this.windowMs) {
      this.count = 0;
      this.windowStart = now;
    }
  }

  tryConsume(): boolean {
    this.checkWindow();
    if (this.count < this.maxRequests) {
      this.count++;
      return true;
    }
    return false;
  }

  getRemaining(): number {
    this.checkWindow();
    return Math.max(0, this.maxRequests - this.count);
  }

  getResetTime(): Date {
    this.checkWindow();
    return new Date(this.windowStart + this.windowMs);
  }

  reset(): void {
    this.count = 0;
    this.windowStart = Date.now();
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useKBRateLimiting(config: RateLimitConfig): UseKBRateLimitReturn {
  const [, forceUpdate] = useState(0);
  const configRef = useRef(config);
  
  const statsRef = useRef<RateLimitStats>({
    totalRequests: 0,
    blockedRequests: 0,
    queuedRequests: 0,
    averageWaitTime: 0,
    peakQueueSize: 0,
    windowResets: 0,
  });

  const queueRef = useRef<Array<{
    resolve: () => void;
    reject: (error: Error) => void;
    timestamp: number;
  }>>([]);

  // Create rate limiter based on algorithm
  const limiter = useMemo(() => {
    const { algorithm, maxRequests, windowMs, refillRate = maxRequests } = configRef.current;
    
    switch (algorithm) {
      case 'token-bucket':
        return new TokenBucket(maxRequests, refillRate);
      case 'sliding-window':
        return new SlidingWindow(maxRequests, windowMs);
      case 'leaky-bucket':
        return new LeakyBucket(maxRequests, refillRate);
      case 'fixed-window':
      default:
        return new FixedWindow(maxRequests, windowMs);
    }
  }, []);

  // Process queue
  const processQueue = useCallback(() => {
    while (queueRef.current.length > 0) {
      const canProcess = (limiter as TokenBucket | SlidingWindow | LeakyBucket | FixedWindow)
        .tryConsume ? 
        (limiter as SlidingWindow | FixedWindow).tryConsume() :
        (limiter as TokenBucket).tryConsume();
        
      if (!canProcess) break;

      const item = queueRef.current.shift();
      if (item) {
        const waitTime = Date.now() - item.timestamp;
        statsRef.current.averageWaitTime = 
          (statsRef.current.averageWaitTime + waitTime) / 2;
        item.resolve();
      }
    }
    forceUpdate(c => c + 1);
  }, [limiter]);

  // Queue processing interval
  useEffect(() => {
    const interval = setInterval(processQueue, 100);
    return () => clearInterval(interval);
  }, [processQueue]);

  // Get current info
  const getInfo = useCallback((): RateLimitInfo => {
    const { maxRequests } = configRef.current;
    let remaining: number;
    let resetTime: Date;

    if ('getTokens' in limiter) {
      remaining = Math.floor((limiter as TokenBucket).getTokens());
      resetTime = (limiter as TokenBucket).getResetTime();
    } else if ('getRemaining' in limiter) {
      remaining = (limiter as SlidingWindow | LeakyBucket | FixedWindow).getRemaining();
      resetTime = (limiter as SlidingWindow | LeakyBucket | FixedWindow).getResetTime();
    } else {
      remaining = maxRequests;
      resetTime = new Date();
    }

    const retryAfter = remaining === 0 ? 
      Math.max(0, resetTime.getTime() - Date.now()) : undefined;

    return {
      remaining,
      total: maxRequests,
      resetTime,
      retryAfter,
      isLimited: remaining === 0,
    };
  }, [limiter]);

  // Try to acquire a token (non-blocking)
  const tryAcquire = useCallback((): boolean => {
    statsRef.current.totalRequests++;

    let acquired: boolean;
    if ('tryConsume' in limiter) {
      acquired = (limiter as SlidingWindow | FixedWindow).tryConsume();
    } else if ('tryAdd' in limiter) {
      acquired = (limiter as LeakyBucket).tryAdd();
    } else {
      acquired = (limiter as TokenBucket).tryConsume();
    }

    if (!acquired) {
      statsRef.current.blockedRequests++;
      const info = getInfo();
      configRef.current.onLimitReached?.(info);
    } else {
      // Check warning threshold
      const { warningThreshold = 0.2, onQuotaWarning, maxRequests } = configRef.current;
      const info = getInfo();
      if (info.remaining / maxRequests <= warningThreshold) {
        onQuotaWarning?.(info.remaining, maxRequests);
      }
    }

    forceUpdate(c => c + 1);
    return acquired;
  }, [limiter, getInfo]);

  // Acquire with queueing
  const acquire = useCallback(async (): Promise<boolean> => {
    if (tryAcquire()) {
      return true;
    }

    const { queueEnabled, maxQueueSize = 100, retryAfterMs = 1000 } = configRef.current;
    
    if (!queueEnabled) {
      return false;
    }

    if (queueRef.current.length >= maxQueueSize) {
      return false;
    }

    statsRef.current.queuedRequests++;
    statsRef.current.peakQueueSize = Math.max(
      statsRef.current.peakQueueSize,
      queueRef.current.length + 1
    );

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const index = queueRef.current.findIndex(
          item => item.resolve === resolveWrapper
        );
        if (index !== -1) {
          queueRef.current.splice(index, 1);
          reject(new Error('Queue timeout'));
        }
      }, retryAfterMs * 10);

      const resolveWrapper = () => {
        clearTimeout(timeoutId);
        resolve(true);
      };

      queueRef.current.push({
        resolve: resolveWrapper,
        reject,
        timestamp: Date.now(),
      });
      forceUpdate(c => c + 1);
    });
  }, [tryAcquire]);

  // Reset limiter
  const reset = useCallback(() => {
    if ('reset' in limiter) {
      (limiter as TokenBucket | SlidingWindow | LeakyBucket | FixedWindow).reset();
    }
    queueRef.current.forEach(item => item.reject(new Error('Rate limiter reset')));
    queueRef.current = [];
    statsRef.current.windowResets++;
    forceUpdate(c => c + 1);
  }, [limiter]);

  // Update config
  const updateConfig = useCallback((newConfig: Partial<RateLimitConfig>) => {
    configRef.current = { ...configRef.current, ...newConfig };
  }, []);

  // Get stats
  const getStats = useCallback((): RateLimitStats => ({ ...statsRef.current }), []);

  const info = getInfo();

  return {
    info,
    isLimited: info.isLimited,
    queueSize: queueRef.current.length,
    acquire,
    tryAcquire,
    reset,
    getStats,
    updateConfig,
  };
}

// ============================================================================
// DISTRIBUTED RATE LIMITING (with Redis-like backend)
// ============================================================================

export interface DistributedRateLimitConfig extends RateLimitConfig {
  nodeId: string;
  syncFn?: (state: RateLimitState) => Promise<RateLimitState>;
  syncInterval?: number;
}

export function useKBDistributedRateLimiting(
  config: DistributedRateLimitConfig
): UseKBRateLimitReturn & { sync: () => Promise<void> } {
  const baseRateLimiter = useKBRateLimiting(config);
  const syncInProgress = useRef(false);

  const sync = useCallback(async () => {
    if (!config.syncFn || syncInProgress.current) return;
    
    syncInProgress.current = true;
    try {
      // Sync with distributed store
      await config.syncFn({
        tokens: baseRateLimiter.info.remaining,
        requestCount: config.maxRequests - baseRateLimiter.info.remaining,
        windowStart: Date.now() - config.windowMs,
        queue: [],
        lastRefill: Date.now(),
        bucketLevel: 0,
      });
    } finally {
      syncInProgress.current = false;
    }
  }, [config, baseRateLimiter.info]);

  // Periodic sync
  useEffect(() => {
    if (!config.syncFn) return;
    
    const interval = setInterval(sync, config.syncInterval || 5000);
    return () => clearInterval(interval);
  }, [sync, config.syncInterval, config.syncFn]);

  return {
    ...baseRateLimiter,
    sync,
  };
}

// ============================================================================
// QUOTA MANAGEMENT
// ============================================================================

export interface QuotaConfig {
  daily?: number;
  hourly?: number;
  perMinute?: number;
  perSecond?: number;
}

export interface QuotaState {
  daily: { used: number; resetAt: Date };
  hourly: { used: number; resetAt: Date };
  perMinute: { used: number; resetAt: Date };
  perSecond: { used: number; resetAt: Date };
}

export function useKBQuotaManagement(config: QuotaConfig): {
  quota: QuotaState;
  checkQuota: () => boolean;
  consumeQuota: () => boolean;
  getQuotaInfo: () => Record<string, RateLimitInfo>;
  resetQuota: (level?: keyof QuotaConfig) => void;
} {
  const limiters = useMemo(() => ({
    daily: config.daily ? new FixedWindow(config.daily, 24 * 60 * 60 * 1000) : null,
    hourly: config.hourly ? new FixedWindow(config.hourly, 60 * 60 * 1000) : null,
    perMinute: config.perMinute ? new FixedWindow(config.perMinute, 60 * 1000) : null,
    perSecond: config.perSecond ? new FixedWindow(config.perSecond, 1000) : null,
  }), [config.daily, config.hourly, config.perMinute, config.perSecond]);

  const [, forceUpdate] = useState(0);

  const checkQuota = useCallback((): boolean => {
    return Object.values(limiters).every(
      limiter => !limiter || limiter.getRemaining() > 0
    );
  }, [limiters]);

  const consumeQuota = useCallback((): boolean => {
    if (!checkQuota()) return false;

    Object.values(limiters).forEach(limiter => {
      if (limiter && 'tryConsume' in limiter) {
        (limiter as FixedWindow).tryConsume();
      }
    });

    forceUpdate(c => c + 1);
    return true;
  }, [checkQuota, limiters]);

  const getQuotaInfo = useCallback((): Record<string, RateLimitInfo> => {
    const result: Record<string, RateLimitInfo> = {};
    
    Object.entries(limiters).forEach(([key, limiter]) => {
      if (limiter) {
        const configKey = key as keyof QuotaConfig;
        const total = config[configKey] || 0;
        const remaining = limiter.getRemaining();
        result[key] = {
          remaining,
          total,
          resetTime: limiter.getResetTime(),
          isLimited: remaining === 0,
        };
      }
    });

    return result;
  }, [limiters, config]);

  const resetQuota = useCallback((level?: keyof QuotaConfig) => {
    if (level && limiters[level]) {
      limiters[level]?.reset();
    } else {
      Object.values(limiters).forEach(limiter => limiter?.reset());
    }
    forceUpdate(c => c + 1);
  }, [limiters]);

  const quota = useMemo((): QuotaState => {
    const info = getQuotaInfo();
    return {
      daily: { 
        used: (config.daily || 0) - (info.daily?.remaining || 0), 
        resetAt: info.daily?.resetTime || new Date() 
      },
      hourly: { 
        used: (config.hourly || 0) - (info.hourly?.remaining || 0), 
        resetAt: info.hourly?.resetTime || new Date() 
      },
      perMinute: { 
        used: (config.perMinute || 0) - (info.perMinute?.remaining || 0), 
        resetAt: info.perMinute?.resetTime || new Date() 
      },
      perSecond: { 
        used: (config.perSecond || 0) - (info.perSecond?.remaining || 0), 
        resetAt: info.perSecond?.resetTime || new Date() 
      },
    };
  }, [getQuotaInfo, config]);

  return {
    quota,
    checkQuota,
    consumeQuota,
    getQuotaInfo,
    resetQuota,
  };
}

export default useKBRateLimiting;
