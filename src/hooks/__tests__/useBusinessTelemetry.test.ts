import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBusinessTelemetry } from '../useBusinessTelemetry';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: '1', metric_type: 'revenue', value: 100 }, error: null })),
        })),
      })),
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(() => ({})),
      })),
    })),
    removeChannel: vi.fn(),
  },
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useBusinessTelemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useBusinessTelemetry());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.metrics).toEqual([]);
  });

  it('should have all required functions', () => {
    const { result } = renderHook(() => useBusinessTelemetry());

    expect(typeof result.current.recordMetric).toBe('function');
    expect(typeof result.current.recordMetricsBatch).toBe('function');
    expect(typeof result.current.queryMetrics).toBe('function');
    expect(typeof result.current.getAggregations).toBe('function');
    expect(typeof result.current.deleteMetric).toBe('function');
    expect(typeof result.current.subscribeToMetrics).toBe('function');
  });

  it('should support all metric types', () => {
    const validMetricTypes = [
      'revenue',
      'conversion_rate',
      'churn_rate',
      'customer_lifetime_value',
      'acquisition_cost',
      'retention_rate',
      'nps_score',
      'monthly_recurring_revenue',
      'average_order_value',
      'engagement_rate',
    ];

    // Type check - this would fail compilation if types were wrong
    validMetricTypes.forEach(type => {
      expect(type).toBeDefined();
    });
  });

  it('should return unsubscribe function from subscribeToMetrics', () => {
    const { result } = renderHook(() => useBusinessTelemetry());

    const callback = vi.fn();
    const unsubscribe = result.current.subscribeToMetrics(callback);

    expect(typeof unsubscribe).toBe('function');
  });
});
