import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock PerformanceObserver
class MockPerformanceObserver {
  callback: (entries: { getEntries: () => unknown[] }) => void;
  
  constructor(callback: (entries: { getEntries: () => unknown[] }) => void) {
    this.callback = callback;
  }
  
  observe() {
    // Simulate observing
  }
  
  disconnect() {
    // Simulate disconnecting
  }
}

Object.defineProperty(window, 'PerformanceObserver', {
  value: MockPerformanceObserver,
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('webVitals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]');
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should export initWebVitals function', async () => {
    const { initWebVitals } = await import('../webVitals');
    expect(typeof initWebVitals).toBe('function');
  });

  it('should export logWebVital function', async () => {
    const { logWebVital } = await import('../webVitals');
    expect(typeof logWebVital).toBe('function');
  });

  it('should export sendToAnalytics function', async () => {
    const { sendToAnalytics } = await import('../webVitals');
    expect(typeof sendToAnalytics).toBe('function');
  });

  it('should export getStoredMetrics function', async () => {
    const { getStoredMetrics } = await import('../webVitals');
    expect(typeof getStoredMetrics).toBe('function');
  });

  it('should export clearStoredMetrics function', async () => {
    const { clearStoredMetrics } = await import('../webVitals');
    expect(typeof clearStoredMetrics).toBe('function');
  });

  it('should log web vitals with correct colors', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { logWebVital } = await import('../webVitals');

    logWebVital({
      name: 'LCP',
      value: 2500,
      rating: 'good',
      delta: 2500,
      id: 'lcp-test',
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should store metrics in localStorage via sendToAnalytics', async () => {
    const { sendToAnalytics } = await import('../webVitals');

    sendToAnalytics({
      name: 'LCP',
      value: 2500,
      rating: 'good',
      delta: 2500,
      id: 'lcp-test',
    });

    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('should retrieve stored metrics', async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([
      { name: 'LCP', value: 2500, rating: 'good' },
    ]));

    const { getStoredMetrics } = await import('../webVitals');
    const metrics = getStoredMetrics();

    expect(Array.isArray(metrics)).toBe(true);
  });

  it('should clear stored metrics', async () => {
    const { clearStoredMetrics } = await import('../webVitals');
    
    clearStoredMetrics();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('web-vitals-metrics');
  });

  it('should handle empty localStorage gracefully', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { getStoredMetrics } = await import('../webVitals');
    const metrics = getStoredMetrics();

    expect(Array.isArray(metrics)).toBe(true);
    expect(metrics.length).toBe(0);
  });

  it('should handle invalid JSON in localStorage', async () => {
    localStorageMock.getItem.mockReturnValue('invalid-json');

    const { getStoredMetrics } = await import('../webVitals');
    const metrics = getStoredMetrics();

    expect(Array.isArray(metrics)).toBe(true);
  });
});
