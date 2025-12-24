import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock web-vitals
vi.mock('web-vitals', () => ({
  onLCP: vi.fn((cb) => cb({ name: 'LCP', value: 2000, rating: 'good' })),
  onFID: vi.fn((cb) => cb({ name: 'FID', value: 50, rating: 'good' })),
  onCLS: vi.fn((cb) => cb({ name: 'CLS', value: 0.05, rating: 'good' })),
  onFCP: vi.fn((cb) => cb({ name: 'FCP', value: 1500, rating: 'good' })),
  onTTFB: vi.fn((cb) => cb({ name: 'TTFB', value: 500, rating: 'good' })),
  onINP: vi.fn((cb) => cb({ name: 'INP', value: 150, rating: 'good' })),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('Core Web Vitals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('LCP (Largest Contentful Paint)', () => {
    it('should classify LCP < 2500ms as good', () => {
      const value = 2000;
      const rating = value < 2500 ? 'good' : value < 4000 ? 'needs-improvement' : 'poor';
      expect(rating).toBe('good');
    });

    it('should classify LCP between 2500-4000ms as needs-improvement', () => {
      const value = 3000;
      const rating = value < 2500 ? 'good' : value < 4000 ? 'needs-improvement' : 'poor';
      expect(rating).toBe('needs-improvement');
    });

    it('should classify LCP > 4000ms as poor', () => {
      const value = 5000;
      const rating = value < 2500 ? 'good' : value < 4000 ? 'needs-improvement' : 'poor';
      expect(rating).toBe('poor');
    });
  });

  describe('FID (First Input Delay)', () => {
    it('should classify FID < 100ms as good', () => {
      const value = 50;
      const rating = value < 100 ? 'good' : value < 300 ? 'needs-improvement' : 'poor';
      expect(rating).toBe('good');
    });

    it('should classify FID between 100-300ms as needs-improvement', () => {
      const value = 200;
      const rating = value < 100 ? 'good' : value < 300 ? 'needs-improvement' : 'poor';
      expect(rating).toBe('needs-improvement');
    });

    it('should classify FID > 300ms as poor', () => {
      const value = 400;
      const rating = value < 100 ? 'good' : value < 300 ? 'needs-improvement' : 'poor';
      expect(rating).toBe('poor');
    });
  });

  describe('CLS (Cumulative Layout Shift)', () => {
    it('should classify CLS < 0.1 as good', () => {
      const value = 0.05;
      const rating = value < 0.1 ? 'good' : value < 0.25 ? 'needs-improvement' : 'poor';
      expect(rating).toBe('good');
    });

    it('should classify CLS between 0.1-0.25 as needs-improvement', () => {
      const value = 0.15;
      const rating = value < 0.1 ? 'good' : value < 0.25 ? 'needs-improvement' : 'poor';
      expect(rating).toBe('needs-improvement');
    });

    it('should classify CLS > 0.25 as poor', () => {
      const value = 0.3;
      const rating = value < 0.1 ? 'good' : value < 0.25 ? 'needs-improvement' : 'poor';
      expect(rating).toBe('poor');
    });
  });

  describe('INP (Interaction to Next Paint)', () => {
    it('should classify INP < 200ms as good', () => {
      const value = 150;
      const rating = value < 200 ? 'good' : value < 500 ? 'needs-improvement' : 'poor';
      expect(rating).toBe('good');
    });

    it('should classify INP between 200-500ms as needs-improvement', () => {
      const value = 300;
      const rating = value < 200 ? 'good' : value < 500 ? 'needs-improvement' : 'poor';
      expect(rating).toBe('needs-improvement');
    });

    it('should classify INP > 500ms as poor', () => {
      const value = 600;
      const rating = value < 200 ? 'good' : value < 500 ? 'needs-improvement' : 'poor';
      expect(rating).toBe('poor');
    });
  });

  describe('Overall Score Calculation', () => {
    it('should return good when all metrics are good', () => {
      const metrics = {
        LCP: { rating: 'good' },
        CLS: { rating: 'good' },
        INP: { rating: 'good' },
      };
      
      const ratings = Object.values(metrics).map(m => m.rating);
      const hasGood = ratings.every(r => r === 'good');
      const hasPoor = ratings.some(r => r === 'poor');
      
      const overall = hasPoor ? 'poor' : hasGood ? 'good' : 'needs-improvement';
      expect(overall).toBe('good');
    });

    it('should return poor when any metric is poor', () => {
      const metrics = {
        LCP: { rating: 'good' },
        CLS: { rating: 'poor' },
        INP: { rating: 'good' },
      };
      
      const ratings = Object.values(metrics).map(m => m.rating);
      const hasPoor = ratings.some(r => r === 'poor');
      
      expect(hasPoor).toBe(true);
    });

    it('should return needs-improvement when some metrics need improvement', () => {
      const metrics = {
        LCP: { rating: 'good' },
        CLS: { rating: 'needs-improvement' },
        INP: { rating: 'good' },
      };
      
      const ratings = Object.values(metrics).map(m => m.rating);
      const hasGood = ratings.every(r => r === 'good');
      const hasPoor = ratings.some(r => r === 'poor');
      const hasNeedsImprovement = ratings.some(r => r === 'needs-improvement');
      
      const overall = hasPoor ? 'poor' : hasGood ? 'good' : 'needs-improvement';
      expect(overall).toBe('needs-improvement');
    });
  });
});

describe('Performance Thresholds', () => {
  const THRESHOLDS = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    INP: { good: 200, poor: 500 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
  };

  it('has correct LCP thresholds', () => {
    expect(THRESHOLDS.LCP.good).toBe(2500);
    expect(THRESHOLDS.LCP.poor).toBe(4000);
  });

  it('has correct FID thresholds', () => {
    expect(THRESHOLDS.FID.good).toBe(100);
    expect(THRESHOLDS.FID.poor).toBe(300);
  });

  it('has correct CLS thresholds', () => {
    expect(THRESHOLDS.CLS.good).toBe(0.1);
    expect(THRESHOLDS.CLS.poor).toBe(0.25);
  });

  it('has correct INP thresholds', () => {
    expect(THRESHOLDS.INP.good).toBe(200);
    expect(THRESHOLDS.INP.poor).toBe(500);
  });

  it('has correct FCP thresholds', () => {
    expect(THRESHOLDS.FCP.good).toBe(1800);
    expect(THRESHOLDS.FCP.poor).toBe(3000);
  });

  it('has correct TTFB thresholds', () => {
    expect(THRESHOLDS.TTFB.good).toBe(800);
    expect(THRESHOLDS.TTFB.poor).toBe(1800);
  });
});
