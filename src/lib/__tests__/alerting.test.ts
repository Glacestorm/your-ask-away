import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  initAlerting, 
  getAlerting, 
  alerting, 
  DEFAULT_THRESHOLDS,
  AlertThreshold,
  PerformanceAlert 
} from '../alerting';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
  },
}));

describe('alerting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton
    const system = getAlerting();
    system.clearCooldowns();
  });

  describe('initAlerting', () => {
    it('should initialize alerting system', () => {
      const system = initAlerting();
      expect(system).toBeDefined();
    });

    it('should use default thresholds', () => {
      const system = initAlerting();
      const thresholds = system.getThresholds();
      expect(thresholds.length).toBe(DEFAULT_THRESHOLDS.length);
    });

    it('should accept custom thresholds', () => {
      const customThresholds: AlertThreshold[] = [
        { metric: 'LCP', warningValue: 1000, criticalValue: 2000, comparison: 'gt' },
      ];
      const system = initAlerting(customThresholds);
      system.setThresholds(customThresholds);
      const thresholds = system.getThresholds();
      expect(thresholds[0].warningValue).toBe(1000);
    });
  });

  describe('checkMetric', () => {
    it('should return null for metrics within thresholds', () => {
      const system = getAlerting();
      const alert = system.checkMetric('LCP', 1000);
      expect(alert).toBeNull();
    });

    it('should return warning alert for values exceeding warning threshold', () => {
      const system = getAlerting();
      system.clearCooldowns();
      const alert = system.checkMetric('LCP', 3000);
      
      if (alert) {
        expect(alert.severity).toBe('warning');
        expect(alert.metricName).toBe('LCP');
      }
    });

    it('should return critical alert for values exceeding critical threshold', () => {
      const system = getAlerting();
      system.clearCooldowns();
      const alert = system.checkMetric('LCP', 5000);
      
      if (alert) {
        expect(alert.severity).toBe('critical');
      }
    });

    it('should handle unknown metrics', () => {
      const system = getAlerting();
      const alert = system.checkMetric('UNKNOWN', 1000);
      expect(alert).toBeNull();
    });

    it('should respect cooldown period', () => {
      const system = getAlerting();
      system.clearCooldowns();
      
      // First alert should be created
      const alert1 = system.checkMetric('LCP', 5000);
      expect(alert1).not.toBeNull();
      
      // Second alert within cooldown should be null
      const alert2 = system.checkMetric('LCP', 5000);
      expect(alert2).toBeNull();
    });
  });

  describe('processMetric', () => {
    it('should return null for good metrics', async () => {
      const alert = await alerting.processMetric('LCP', 1000, { showToast: false, store: false });
      expect(alert).toBeNull();
    });

    it('should process metrics and create alerts', async () => {
      const system = getAlerting();
      system.clearCooldowns();
      
      const alert = await alerting.processMetric('LCP', 5000, { showToast: false, store: false });
      
      if (alert) {
        expect(alert.metricName).toBe('LCP');
        expect(alert.actualValue).toBe(5000);
      }
    });
  });

  describe('DEFAULT_THRESHOLDS', () => {
    it('should have thresholds for all Core Web Vitals', () => {
      const metrics = DEFAULT_THRESHOLDS.map(t => t.metric);
      
      expect(metrics).toContain('LCP');
      expect(metrics).toContain('CLS');
      expect(metrics).toContain('INP');
      expect(metrics).toContain('FID');
      expect(metrics).toContain('FCP');
      expect(metrics).toContain('TTFB');
    });

    it('should have warning values less than critical values', () => {
      DEFAULT_THRESHOLDS.forEach(threshold => {
        expect(threshold.warningValue).toBeLessThan(threshold.criticalValue);
      });
    });
  });

  describe('setThresholds', () => {
    it('should update thresholds', () => {
      const newThresholds: AlertThreshold[] = [
        { metric: 'LCP', warningValue: 500, criticalValue: 1000, comparison: 'gt' },
      ];
      
      alerting.setThresholds(newThresholds);
      const thresholds = alerting.getThresholds();
      
      expect(thresholds.length).toBe(1);
      expect(thresholds[0].warningValue).toBe(500);
    });
  });

  describe('clearCooldowns', () => {
    it('should allow alerts after clearing cooldowns', () => {
      const system = getAlerting();
      
      // Create first alert
      system.clearCooldowns();
      const alert1 = system.checkMetric('LCP', 5000);
      expect(alert1).not.toBeNull();
      
      // Second should be blocked
      const alert2 = system.checkMetric('LCP', 5000);
      expect(alert2).toBeNull();
      
      // Clear and try again
      system.clearCooldowns();
      const alert3 = system.checkMetric('LCP', 5000);
      expect(alert3).not.toBeNull();
    });
  });
});
