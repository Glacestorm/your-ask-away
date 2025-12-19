import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

describe('observability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]');
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should export initObservability function', async () => {
    const { initObservability } = await import('../observability');
    expect(typeof initObservability).toBe('function');
  });

  it('should export getObservability function', async () => {
    const { getObservability } = await import('../observability');
    expect(typeof getObservability).toBe('function');
  });

  it('should export observability object', async () => {
    const { observability } = await import('../observability');
    expect(observability).toBeDefined();
  });

  it('should initialize observability manager', async () => {
    const { initObservability } = await import('../observability');
    
    const manager = initObservability({
      serviceName: 'test-service',
      serviceVersion: '1.0.0',
    });

    expect(manager).toBeDefined();
  });

  it('should create and end spans', async () => {
    const { initObservability } = await import('../observability');
    
    const manager = initObservability({ serviceName: 'test' });
    const spanId = manager.startSpan('test-span');
    
    expect(spanId).toBeDefined();
    expect(typeof spanId).toBe('string');
    
    manager.endSpan(spanId);
  });

  it('should record counter metrics', async () => {
    const { initObservability } = await import('../observability');
    
    const manager = initObservability({ serviceName: 'test' });
    
    // Should not throw
    manager.recordCounter('test.counter', 1, { label: 'test' });
  });

  it('should record gauge metrics', async () => {
    const { initObservability } = await import('../observability');
    
    const manager = initObservability({ serviceName: 'test' });
    
    // Should not throw
    manager.recordGauge('test.gauge', 42, { label: 'test' });
  });

  it('should record histogram metrics', async () => {
    const { initObservability } = await import('../observability');
    
    const manager = initObservability({ serviceName: 'test' });
    
    // Should not throw
    manager.recordHistogram('test.histogram', 100, { label: 'test' });
  });

  it('should log messages at different levels', async () => {
    const { initObservability } = await import('../observability');
    
    const manager = initObservability({ serviceName: 'test' });
    
    // Should not throw
    manager.log('info', 'Test info message');
    manager.log('warn', 'Test warning message');
    manager.log('error', 'Test error message');
  });

  it('should provide convenience logging methods', async () => {
    const { initObservability } = await import('../observability');
    
    const manager = initObservability({ serviceName: 'test' });
    
    expect(typeof manager.info).toBe('function');
    expect(typeof manager.warn).toBe('function');
    expect(typeof manager.error).toBe('function');
    expect(typeof manager.debug).toBe('function');
  });

  it('should get trace context', async () => {
    const { initObservability } = await import('../observability');
    
    const manager = initObservability({ serviceName: 'test' });
    const context = manager.getTraceContext();
    
    expect(context).toBeDefined();
  });

  it('should get stored data', async () => {
    const { initObservability } = await import('../observability');
    
    const manager = initObservability({ serviceName: 'test' });
    const data = manager.getStoredData();
    
    expect(data).toBeDefined();
  });

  it('should clear stored data', async () => {
    const { initObservability } = await import('../observability');
    
    const manager = initObservability({ serviceName: 'test' });
    
    // Should not throw
    manager.clearStoredData();
  });

  it('should handle data operations', async () => {
    const { initObservability } = await import('../observability');
    
    const manager = initObservability({ serviceName: 'test' });
    
    // Record some data then get stored data
    manager.recordCounter('test.counter', 1);
    const data = manager.getStoredData();
    expect(data).toBeDefined();
  });

  it('should destroy manager', async () => {
    const { initObservability } = await import('../observability');
    
    const manager = initObservability({ serviceName: 'test' });
    
    // Should not throw
    manager.destroy();
  });
});
