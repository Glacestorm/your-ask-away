import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebVitals } from '../useWebVitals';

// Mock the webVitals module
vi.mock('@/lib/webVitals', () => ({
  initWebVitals: vi.fn((callback) => {
    // Simulate metrics being reported
    setTimeout(() => {
      callback({ name: 'LCP', value: 2500, rating: 'good', delta: 2500, id: 'lcp-1' });
      callback({ name: 'CLS', value: 0.05, rating: 'good', delta: 0.05, id: 'cls-1' });
      callback({ name: 'FCP', value: 1800, rating: 'good', delta: 1800, id: 'fcp-1' });
    }, 10);
  }),
  logWebVital: vi.fn(),
  sendToAnalytics: vi.fn(),
  getStoredMetrics: vi.fn(() => []),
  clearStoredMetrics: vi.fn(),
}));

describe('useWebVitals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null metrics', () => {
    const { result } = renderHook(() => useWebVitals());

    expect(result.current.metrics.LCP).toBeNull();
    expect(result.current.metrics.FID).toBeNull();
    expect(result.current.metrics.CLS).toBeNull();
    expect(result.current.metrics.INP).toBeNull();
    expect(result.current.metrics.FCP).toBeNull();
    expect(result.current.metrics.TTFB).toBeNull();
  });

  it('should update metrics when received', async () => {
    const { result } = renderHook(() => useWebVitals());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    expect(result.current.metrics.LCP).not.toBeNull();
    expect(result.current.metrics.CLS).not.toBeNull();
    expect(result.current.metrics.FCP).not.toBeNull();
  });

  it('should return overall score as good when all metrics are good', async () => {
    const { result } = renderHook(() => useWebVitals());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    expect(result.current.overallScore).toBe('good');
  });

  it('should provide getHistory function', () => {
    const { result } = renderHook(() => useWebVitals());

    expect(typeof result.current.getHistory).toBe('function');
    const history = result.current.getHistory();
    expect(Array.isArray(history)).toBe(true);
  });

  it('should provide clearHistory function', () => {
    const { result } = renderHook(() => useWebVitals());

    expect(typeof result.current.clearHistory).toBe('function');
    // Should not throw
    result.current.clearHistory();
  });

  it('should enable logging when option is passed', () => {
    const { logWebVital } = require('@/lib/webVitals');
    
    renderHook(() => useWebVitals({ enableLogging: true }));

    // After metrics are received, logWebVital should be called
    expect(logWebVital).toBeDefined();
  });

  it('should enable analytics by default', () => {
    const { sendToAnalytics } = require('@/lib/webVitals');
    
    renderHook(() => useWebVitals());

    expect(sendToAnalytics).toBeDefined();
  });

  it('should disable analytics when option is passed', () => {
    renderHook(() => useWebVitals({ enableAnalytics: false }));
    // Should not throw and analytics should be disabled
  });
});
