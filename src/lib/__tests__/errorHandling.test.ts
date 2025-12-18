import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createAppError,
  getErrorSeverity,
  safeAsync,
  withRetry,
  classifyNetworkError,
  createValidationError,
} from '../errorHandling';

describe('errorHandling utilities', () => {
  describe('createAppError', () => {
    it('creates an error with required fields', () => {
      const error = createAppError('TEST_ERROR', 'Test message');
      
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test message');
      expect(error.timestamp).toBeDefined();
      expect(error.recoverable).toBe(true);
    });

    it('creates an error with custom options', () => {
      const error = createAppError('CUSTOM_ERROR', 'Custom message', {
        details: { field: 'value' },
        recoverable: false,
      });
      
      expect(error.details).toEqual({ field: 'value' });
      expect(error.recoverable).toBe(false);
    });

    it('sets timestamp in ISO format', () => {
      const before = new Date().toISOString();
      const error = createAppError('TIME_ERROR', 'Timestamp test');
      const after = new Date().toISOString();
      
      expect(error.timestamp >= before).toBe(true);
      expect(error.timestamp <= after).toBe(true);
    });
  });

  describe('getErrorSeverity', () => {
    it('returns critical for critical error codes', () => {
      expect(getErrorSeverity('AUTH_FAILED')).toBe('critical');
      expect(getErrorSeverity('DATA_CORRUPTION')).toBe('critical');
      expect(getErrorSeverity('SECURITY_BREACH')).toBe('critical');
    });

    it('returns high for high severity codes', () => {
      expect(getErrorSeverity('NETWORK_ERROR')).toBe('high');
      expect(getErrorSeverity('DB_ERROR')).toBe('high');
      expect(getErrorSeverity('VALIDATION_FAILED')).toBe('high');
    });

    it('returns medium for medium severity codes', () => {
      expect(getErrorSeverity('TIMEOUT')).toBe('medium');
      expect(getErrorSeverity('RATE_LIMITED')).toBe('medium');
      expect(getErrorSeverity('RESOURCE_NOT_FOUND')).toBe('medium');
    });

    it('returns low for unknown codes', () => {
      expect(getErrorSeverity('UNKNOWN_CODE')).toBe('low');
      expect(getErrorSeverity('RANDOM_ERROR')).toBe('low');
    });
  });

  describe('safeAsync', () => {
    it('returns result on success', async () => {
      const promise = Promise.resolve('success');
      const [result, error] = await safeAsync(promise);
      
      expect(result).toBe('success');
      expect(error).toBeNull();
    });

    it('returns error on failure', async () => {
      const promise = Promise.reject(new Error('failure'));
      const [result, error] = await safeAsync(promise);
      
      expect(result).toBeNull();
      expect(error).not.toBeNull();
      expect(error?.message).toBe('failure');
    });

    it('handles non-Error rejections', async () => {
      const promise = Promise.reject('string error');
      const [result, error] = await safeAsync(promise);
      
      expect(result).toBeNull();
      expect(error?.message).toBe('string error');
    });

    it('includes context in error details', async () => {
      const promise = Promise.reject(new Error('context test'));
      const [, error] = await safeAsync(promise, { component: 'TestComponent' });
      
      expect(error?.details?.component).toBe('TestComponent');
    });
  });

  describe('withRetry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns result on first success', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      
      const resultPromise = withRetry(fn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and succeeds', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockResolvedValue('success');
      
      const resultPromise = withRetry(fn, { maxAttempts: 3, delayMs: 100 });
      await vi.runAllTimersAsync();
      const result = await resultPromise;
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('throws after max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fails'));
      
      const resultPromise = withRetry(fn, { maxAttempts: 3, delayMs: 100 });
      await vi.runAllTimersAsync();
      
      await expect(resultPromise).rejects.toThrow('always fails');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('calls onRetry callback', async () => {
      const onRetry = vi.fn();
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('retry error'))
        .mockResolvedValue('success');
      
      const resultPromise = withRetry(fn, { maxAttempts: 3, delayMs: 100, onRetry });
      await vi.runAllTimersAsync();
      await resultPromise;
      
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });
  });

  describe('classifyNetworkError', () => {
    const originalNavigator = global.navigator;

    afterEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    });

    it('detects offline state', () => {
      Object.defineProperty(global, 'navigator', {
        value: { onLine: false },
        writable: true,
      });
      
      const result = classifyNetworkError(new Error('any error'));
      
      expect(result.type).toBe('offline');
      expect(result.retryable).toBe(true);
    });

    it('detects timeout errors', () => {
      Object.defineProperty(global, 'navigator', {
        value: { onLine: true },
        writable: true,
      });
      
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';
      const result = classifyNetworkError(abortError);
      
      expect(result.type).toBe('timeout');
      expect(result.retryable).toBe(true);
    });

    it('detects server errors', () => {
      Object.defineProperty(global, 'navigator', {
        value: { onLine: true },
        writable: true,
      });
      
      const result = classifyNetworkError(new Error('fetch failed'));
      
      expect(result.type).toBe('server');
      expect(result.retryable).toBe(true);
    });

    it('returns unknown for unrecognized errors', () => {
      Object.defineProperty(global, 'navigator', {
        value: { onLine: true },
        writable: true,
      });
      
      const result = classifyNetworkError(new Error('random error'));
      
      expect(result.type).toBe('unknown');
      expect(result.retryable).toBe(false);
    });
  });

  describe('createValidationError', () => {
    it('creates a validation error with field info', () => {
      const error = createValidationError('email', 'Email inválido', 'bad@');
      
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Email inválido');
      expect(error.details?.field).toBe('email');
      expect(error.details?.value).toBe('bad@');
      expect(error.recoverable).toBe(true);
    });
  });
});
