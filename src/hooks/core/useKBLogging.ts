/**
 * KB 4.5 Logging & Monitoring System
 * Structured logging with levels, exporters, and external service integration
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { KBError, KBStatus, KBTelemetry } from './types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
  traceId?: string;
  spanId?: string;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface LogExporter {
  name: string;
  export: (entries: LogEntry[]) => Promise<void>;
  flush?: () => Promise<void>;
  shutdown?: () => Promise<void>;
}

export interface LoggerConfig {
  /** Minimum log level to capture */
  minLevel?: LogLevel;
  /** Maximum entries to buffer before flushing */
  maxBufferSize?: number;
  /** Auto-flush interval in ms */
  flushIntervalMs?: number;
  /** Include stack traces for errors */
  includeStackTraces?: boolean;
  /** Enable console output */
  consoleOutput?: boolean;
  /** Exporters to send logs to */
  exporters?: LogExporter[];
  /** Global context to include in all logs */
  globalContext?: Record<string, unknown>;
  /** Sampling rate (0-1) for non-error logs */
  samplingRate?: number;
  /** Redact sensitive fields */
  redactFields?: string[];
}

export interface LoggerMetrics {
  totalLogs: number;
  logsByLevel: Record<LogLevel, number>;
  errorsCount: number;
  lastFlush: Date | null;
  bufferSize: number;
  exportFailures: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const DEFAULT_LOGGER_CONFIG: Required<Omit<LoggerConfig, 'exporters' | 'globalContext' | 'redactFields'>> = {
  minLevel: 'info',
  maxBufferSize: 100,
  flushIntervalMs: 30000,
  includeStackTraces: true,
  consoleOutput: true,
  samplingRate: 1,
};

const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'apiKey', 'authorization', 'credit_card', 'ssn'];

// ============================================================================
// LOG EXPORTERS
// ============================================================================

/** Console Exporter - outputs to browser console */
export const consoleExporter: LogExporter = {
  name: 'console',
  async export(entries: LogEntry[]) {
    for (const entry of entries) {
      const args = [
        `[${entry.timestamp}] [${entry.level.toUpperCase()}]`,
        entry.context ? `[${entry.context}]` : '',
        entry.message,
        entry.data ? entry.data : '',
      ].filter(Boolean);

      switch (entry.level) {
        case 'debug':
          console.debug(...args);
          break;
        case 'info':
          console.info(...args);
          break;
        case 'warn':
          console.warn(...args);
          break;
        case 'error':
        case 'fatal':
          console.error(...args);
          break;
      }
    }
  },
};

/** LocalStorage Exporter - persists to localStorage */
export const localStorageExporter: LogExporter = {
  name: 'localStorage',
  async export(entries: LogEntry[]) {
    try {
      const existing = JSON.parse(localStorage.getItem('kb_logs') || '[]');
      const combined = [...existing, ...entries].slice(-500); // Keep last 500
      localStorage.setItem('kb_logs', JSON.stringify(combined));
    } catch (e) {
      console.error('[LocalStorageExporter] Failed to persist logs:', e);
    }
  },
  async flush() {
    // Already persists on each export
  },
};

/** HTTP Exporter - sends to external endpoint */
export function createHttpExporter(endpoint: string, headers?: Record<string, string>): LogExporter {
  return {
    name: 'http',
    async export(entries: LogEntry[]) {
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: JSON.stringify({ logs: entries }),
        });
      } catch (e) {
        console.error('[HttpExporter] Failed to send logs:', e);
      }
    },
  };
}

/** Batch Exporter - batches logs and sends periodically */
export function createBatchExporter(
  innerExporter: LogExporter,
  batchSize: number = 50,
  flushIntervalMs: number = 10000
): LogExporter {
  let buffer: LogEntry[] = [];
  let flushTimeout: NodeJS.Timeout | null = null;

  const flush = async () => {
    if (buffer.length === 0) return;
    const batch = [...buffer];
    buffer = [];
    await innerExporter.export(batch);
  };

  const scheduleFlush = () => {
    if (flushTimeout) clearTimeout(flushTimeout);
    flushTimeout = setTimeout(flush, flushIntervalMs);
  };

  return {
    name: `batch-${innerExporter.name}`,
    async export(entries: LogEntry[]) {
      buffer.push(...entries);
      if (buffer.length >= batchSize) {
        await flush();
      } else {
        scheduleFlush();
      }
    },
    async flush() {
      await flush();
    },
    async shutdown() {
      if (flushTimeout) clearTimeout(flushTimeout);
      await flush();
      await innerExporter.shutdown?.();
    },
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel];
}

function redactSensitiveData(data: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const redacted = { ...data };
  for (const key of Object.keys(redacted)) {
    if (fields.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveData(redacted[key] as Record<string, unknown>, fields);
    }
  }
  return redacted;
}

// ============================================================================
// GLOBAL LOGGER INSTANCE
// ============================================================================

class KBLogger {
  private config: Required<Omit<LoggerConfig, 'exporters' | 'globalContext' | 'redactFields'>> & {
    exporters: LogExporter[];
    globalContext: Record<string, unknown>;
    redactFields: string[];
  };
  private buffer: LogEntry[] = [];
  private metrics: LoggerMetrics = {
    totalLogs: 0,
    logsByLevel: { debug: 0, info: 0, warn: 0, error: 0, fatal: 0 },
    errorsCount: 0,
    lastFlush: null,
    bufferSize: 0,
    exportFailures: 0,
  };
  private flushInterval: NodeJS.Timeout | null = null;
  private sessionId: string;

  constructor(config?: LoggerConfig) {
    this.config = {
      ...DEFAULT_LOGGER_CONFIG,
      exporters: config?.exporters || [consoleExporter],
      globalContext: config?.globalContext || {},
      redactFields: [...SENSITIVE_FIELDS, ...(config?.redactFields || [])],
      ...config,
    };
    this.sessionId = `session_${Date.now()}`;
    this.startAutoFlush();
  }

  private startAutoFlush(): void {
    if (this.flushInterval) clearInterval(this.flushInterval);
    this.flushInterval = setInterval(() => this.flush(), this.config.flushIntervalMs);
  }

  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.flushIntervalMs) {
      this.startAutoFlush();
    }
  }

  private createEntry(
    level: LogLevel,
    message: string,
    options?: {
      context?: string;
      data?: Record<string, unknown>;
      error?: Error;
      component?: string;
      action?: string;
      duration?: number;
    }
  ): LogEntry {
    const entry: LogEntry = {
      id: generateLogId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      context: options?.context,
      sessionId: this.sessionId,
      component: options?.component,
      action: options?.action,
      duration: options?.duration,
      metadata: this.config.globalContext,
    };

    if (options?.data) {
      entry.data = redactSensitiveData(options.data, this.config.redactFields);
    }

    if (options?.error) {
      entry.error = {
        name: options.error.name,
        message: options.error.message,
        stack: this.config.includeStackTraces ? options.error.stack : undefined,
        code: (options.error as KBError).code,
      };
    }

    return entry;
  }

  private async addEntry(entry: LogEntry): Promise<void> {
    // Apply sampling for non-error logs
    if (entry.level !== 'error' && entry.level !== 'fatal') {
      if (Math.random() > this.config.samplingRate) {
        return;
      }
    }

    // Check minimum level
    if (!shouldLog(entry.level, this.config.minLevel)) {
      return;
    }

    this.buffer.push(entry);
    this.metrics.totalLogs++;
    this.metrics.logsByLevel[entry.level]++;
    this.metrics.bufferSize = this.buffer.length;

    if (entry.level === 'error' || entry.level === 'fatal') {
      this.metrics.errorsCount++;
    }

    // Console output
    if (this.config.consoleOutput) {
      await consoleExporter.export([entry]);
    }

    // Auto-flush if buffer is full
    if (this.buffer.length >= this.config.maxBufferSize) {
      await this.flush();
    }
  }

  async log(level: LogLevel, message: string, options?: {
    context?: string;
    data?: Record<string, unknown>;
    error?: Error;
    component?: string;
    action?: string;
    duration?: number;
  }): Promise<void> {
    const entry = this.createEntry(level, message, options);
    await this.addEntry(entry);
  }

  debug(message: string, options?: { context?: string; data?: Record<string, unknown>; component?: string }): void {
    this.log('debug', message, options);
  }

  info(message: string, options?: { context?: string; data?: Record<string, unknown>; component?: string }): void {
    this.log('info', message, options);
  }

  warn(message: string, options?: { context?: string; data?: Record<string, unknown>; component?: string }): void {
    this.log('warn', message, options);
  }

  error(message: string, options?: { context?: string; data?: Record<string, unknown>; error?: Error; component?: string }): void {
    this.log('error', message, options);
  }

  fatal(message: string, options?: { context?: string; data?: Record<string, unknown>; error?: Error; component?: string }): void {
    this.log('fatal', message, options);
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entriesToFlush = [...this.buffer];
    this.buffer = [];
    this.metrics.bufferSize = 0;
    this.metrics.lastFlush = new Date();

    for (const exporter of this.config.exporters) {
      try {
        await exporter.export(entriesToFlush);
      } catch (e) {
        this.metrics.exportFailures++;
        console.error(`[KBLogger] Export failed for ${exporter.name}:`, e);
      }
    }
  }

  async shutdown(): Promise<void> {
    if (this.flushInterval) clearInterval(this.flushInterval);
    await this.flush();
    for (const exporter of this.config.exporters) {
      await exporter.shutdown?.();
    }
  }

  getMetrics(): LoggerMetrics {
    return { ...this.metrics };
  }

  getBuffer(): LogEntry[] {
    return [...this.buffer];
  }

  clearBuffer(): void {
    this.buffer = [];
    this.metrics.bufferSize = 0;
  }
}

// Global logger instance
export const kbLogger = new KBLogger();

// ============================================================================
// HOOK: useKBLogging
// ============================================================================

export interface UseKBLoggingOptions {
  /** Component name for context */
  component?: string;
  /** Default context for all logs */
  defaultContext?: string;
  /** Auto-log component lifecycle */
  logLifecycle?: boolean;
}

export interface UseKBLoggingReturn {
  /** Log a debug message */
  debug: (message: string, data?: Record<string, unknown>) => void;
  /** Log an info message */
  info: (message: string, data?: Record<string, unknown>) => void;
  /** Log a warning message */
  warn: (message: string, data?: Record<string, unknown>) => void;
  /** Log an error message */
  error: (message: string, error?: Error, data?: Record<string, unknown>) => void;
  /** Log a fatal error */
  fatal: (message: string, error?: Error, data?: Record<string, unknown>) => void;
  /** Log with timing */
  timed: <T>(message: string, operation: () => Promise<T>) => Promise<T>;
  /** Create a child logger with additional context */
  child: (context: string) => UseKBLoggingReturn;
  /** Flush logs immediately */
  flush: () => Promise<void>;
  /** Get current metrics */
  getMetrics: () => LoggerMetrics;
}

export function useKBLogging(options?: UseKBLoggingOptions): UseKBLoggingReturn {
  const { component, defaultContext, logLifecycle = false } = options || {};
  const mountedRef = useRef(true);

  // Log lifecycle
  useEffect(() => {
    if (logLifecycle && component) {
      kbLogger.debug(`Component mounted: ${component}`, { component });
    }
    return () => {
      mountedRef.current = false;
      if (logLifecycle && component) {
        kbLogger.debug(`Component unmounted: ${component}`, { component });
      }
    };
  }, [component, logLifecycle]);

  const createLogger = useCallback((context?: string): UseKBLoggingReturn => {
    const ctx = context || defaultContext;

    return {
      debug: (message, data) => {
        kbLogger.debug(message, { context: ctx, data, component });
      },
      info: (message, data) => {
        kbLogger.info(message, { context: ctx, data, component });
      },
      warn: (message, data) => {
        kbLogger.warn(message, { context: ctx, data, component });
      },
      error: (message, error, data) => {
        kbLogger.error(message, { context: ctx, data, error, component });
      },
      fatal: (message, error, data) => {
        kbLogger.fatal(message, { context: ctx, data, error, component });
      },
      timed: async <T>(message: string, operation: () => Promise<T>): Promise<T> => {
        const start = performance.now();
        try {
          const result = await operation();
          const duration = performance.now() - start;
          kbLogger.info(`${message} completed`, { context: ctx, component, duration });
          return result;
        } catch (e) {
          const duration = performance.now() - start;
          kbLogger.error(`${message} failed`, { 
            context: ctx, 
            component, 
            duration,
            error: e instanceof Error ? e : new Error(String(e))
          });
          throw e;
        }
      },
      child: (childContext: string) => createLogger(`${ctx ? ctx + '.' : ''}${childContext}`),
      flush: () => kbLogger.flush(),
      getMetrics: () => kbLogger.getMetrics(),
    };
  }, [component, defaultContext]);

  return createLogger();
}

// ============================================================================
// HOOK: useKBPerformanceLogging
// ============================================================================

export interface PerformanceLogEntry {
  name: string;
  duration: number;
  startTime: number;
  metadata?: Record<string, unknown>;
}

export function useKBPerformanceLogging(component: string) {
  const [logs, setLogs] = useState<PerformanceLogEntry[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const startTimer = useCallback((name: string) => {
    timersRef.current.set(name, performance.now());
  }, []);

  const endTimer = useCallback((name: string, metadata?: Record<string, unknown>) => {
    const startTime = timersRef.current.get(name);
    if (startTime === undefined) {
      console.warn(`[PerformanceLogging] Timer "${name}" was not started`);
      return null;
    }

    const duration = performance.now() - startTime;
    timersRef.current.delete(name);

    const entry: PerformanceLogEntry = {
      name,
      duration,
      startTime,
      metadata,
    };

    setLogs(prev => [...prev, entry]);
    kbLogger.info(`Performance: ${name}`, { 
      component, 
      duration,
      data: metadata 
    });

    return entry;
  }, [component]);

  const measure = useCallback(async <T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> => {
    startTimer(name);
    try {
      const result = await operation();
      endTimer(name, { ...metadata, success: true });
      return result;
    } catch (e) {
      endTimer(name, { ...metadata, success: false, error: String(e) });
      throw e;
    }
  }, [startTimer, endTimer]);

  const getAverageTime = useCallback((name: string): number | null => {
    const relevant = logs.filter(l => l.name === name);
    if (relevant.length === 0) return null;
    return relevant.reduce((sum, l) => sum + l.duration, 0) / relevant.length;
  }, [logs]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    startTimer,
    endTimer,
    measure,
    logs,
    getAverageTime,
    clearLogs,
  };
}

export default useKBLogging;
