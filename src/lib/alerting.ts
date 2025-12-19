import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface AlertThreshold {
  metric: string;
  warningValue: number;
  criticalValue: number;
  comparison: 'gt' | 'lt' | 'gte' | 'lte';
}

export interface PerformanceAlert {
  id: string;
  alertType: string;
  metricName: string;
  thresholdValue: number;
  actualValue: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
}

// Default thresholds based on Core Web Vitals standards
export const DEFAULT_THRESHOLDS: AlertThreshold[] = [
  // LCP - Largest Contentful Paint
  { metric: 'LCP', warningValue: 2500, criticalValue: 4000, comparison: 'gt' },
  // CLS - Cumulative Layout Shift
  { metric: 'CLS', warningValue: 0.1, criticalValue: 0.25, comparison: 'gt' },
  // INP - Interaction to Next Paint
  { metric: 'INP', warningValue: 200, criticalValue: 500, comparison: 'gt' },
  // FID - First Input Delay
  { metric: 'FID', warningValue: 100, criticalValue: 300, comparison: 'gt' },
  // FCP - First Contentful Paint
  { metric: 'FCP', warningValue: 1800, criticalValue: 3000, comparison: 'gt' },
  // TTFB - Time to First Byte
  { metric: 'TTFB', warningValue: 800, criticalValue: 1800, comparison: 'gt' },
];

class AlertingSystem {
  private thresholds: AlertThreshold[];
  private recentAlerts: Map<string, number> = new Map();
  private alertCooldown = 60000; // 1 minute cooldown between same alerts

  constructor(thresholds: AlertThreshold[] = DEFAULT_THRESHOLDS) {
    this.thresholds = thresholds;
  }

  /**
   * Check if a metric value exceeds thresholds and trigger appropriate alerts
   */
  checkMetric(metricName: string, value: number): PerformanceAlert | null {
    const threshold = this.thresholds.find(t => t.metric === metricName);
    if (!threshold) return null;

    const exceedsThreshold = this.compareValue(value, threshold);
    if (!exceedsThreshold.exceeded) return null;

    // Check cooldown to avoid alert spam
    const alertKey = `${metricName}-${exceedsThreshold.severity}`;
    const lastAlert = this.recentAlerts.get(alertKey);
    if (lastAlert && Date.now() - lastAlert < this.alertCooldown) {
      return null;
    }

    const alert: PerformanceAlert = {
      id: crypto.randomUUID(),
      alertType: 'performance_threshold',
      metricName,
      thresholdValue: exceedsThreshold.severity === 'critical' 
        ? threshold.criticalValue 
        : threshold.warningValue,
      actualValue: value,
      severity: exceedsThreshold.severity,
      message: this.generateAlertMessage(metricName, value, exceedsThreshold.severity),
      timestamp: new Date(),
    };

    this.recentAlerts.set(alertKey, Date.now());
    return alert;
  }

  /**
   * Compare value against thresholds and determine severity
   */
  private compareValue(
    value: number, 
    threshold: AlertThreshold
  ): { exceeded: boolean; severity: 'warning' | 'critical' } {
    const compare = (v: number, t: number, op: string): boolean => {
      switch (op) {
        case 'gt': return v > t;
        case 'lt': return v < t;
        case 'gte': return v >= t;
        case 'lte': return v <= t;
        default: return false;
      }
    };

    if (compare(value, threshold.criticalValue, threshold.comparison)) {
      return { exceeded: true, severity: 'critical' };
    }
    if (compare(value, threshold.warningValue, threshold.comparison)) {
      return { exceeded: true, severity: 'warning' };
    }
    return { exceeded: false, severity: 'warning' };
  }

  /**
   * Generate human-readable alert message
   */
  private generateAlertMessage(
    metric: string, 
    value: number, 
    severity: 'warning' | 'critical'
  ): string {
    const metricLabels: Record<string, string> = {
      LCP: 'Largest Contentful Paint',
      CLS: 'Cumulative Layout Shift',
      INP: 'Interaction to Next Paint',
      FID: 'First Input Delay',
      FCP: 'First Contentful Paint',
      TTFB: 'Time to First Byte',
    };

    const units: Record<string, string> = {
      LCP: 'ms',
      CLS: '',
      INP: 'ms',
      FID: 'ms',
      FCP: 'ms',
      TTFB: 'ms',
    };

    const label = metricLabels[metric] || metric;
    const unit = units[metric] || '';
    const severityText = severity === 'critical' ? 'Critical' : 'Warning';

    return `${severityText}: ${label} is ${value}${unit}, which exceeds the ${severity} threshold.`;
  }

  /**
   * Display alert as toast notification
   */
  showToast(alert: PerformanceAlert): void {
    const toastFn = alert.severity === 'critical' ? toast.error : toast.warning;
    toastFn(alert.message, {
      duration: alert.severity === 'critical' ? 10000 : 5000,
      id: alert.id,
    });
  }

  /**
   * Store alert in database
   */
  async storeAlert(alert: PerformanceAlert): Promise<void> {
    try {
      await supabase.from('performance_alerts').insert({
        alert_type: alert.alertType,
        metric_name: alert.metricName,
        threshold_value: alert.thresholdValue,
        actual_value: alert.actualValue,
        severity: alert.severity,
        message: alert.message,
      });
    } catch (error) {
      console.error('[Alerting] Failed to store alert:', error);
    }
  }

  /**
   * Process a metric and trigger alerts if needed
   */
  async processMetric(
    metricName: string, 
    value: number, 
    options: { showToast?: boolean; store?: boolean } = {}
  ): Promise<PerformanceAlert | null> {
    const { showToast = true, store = true } = options;
    
    const alert = this.checkMetric(metricName, value);
    if (!alert) return null;

    console.log(`[Alerting] ${alert.severity.toUpperCase()}: ${alert.message}`);

    if (showToast) {
      this.showToast(alert);
    }

    if (store) {
      await this.storeAlert(alert);
    }

    return alert;
  }

  /**
   * Update thresholds dynamically
   */
  setThresholds(thresholds: AlertThreshold[]): void {
    this.thresholds = thresholds;
  }

  /**
   * Get current thresholds
   */
  getThresholds(): AlertThreshold[] {
    return [...this.thresholds];
  }

  /**
   * Clear alert cooldowns
   */
  clearCooldowns(): void {
    this.recentAlerts.clear();
  }
}

// Singleton instance
let alertingInstance: AlertingSystem | null = null;

export function initAlerting(thresholds?: AlertThreshold[]): AlertingSystem {
  if (!alertingInstance) {
    alertingInstance = new AlertingSystem(thresholds);
  }
  return alertingInstance;
}

export function getAlerting(): AlertingSystem {
  if (!alertingInstance) {
    return initAlerting();
  }
  return alertingInstance;
}

export const alerting = {
  processMetric: (metricName: string, value: number, options?: { showToast?: boolean; store?: boolean }) => 
    getAlerting().processMetric(metricName, value, options),
  checkMetric: (metricName: string, value: number) => 
    getAlerting().checkMetric(metricName, value),
  setThresholds: (thresholds: AlertThreshold[]) => 
    getAlerting().setThresholds(thresholds),
  getThresholds: () => 
    getAlerting().getThresholds(),
  clearCooldowns: () => 
    getAlerting().clearCooldowns(),
};

export default alerting;
