import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

export interface CSAlertThreshold {
  id: string;
  metric: string;
  condition: 'above' | 'below';
  value: number;
  severity: 'warning' | 'critical';
  enabled: boolean;
}

export interface CSAlert {
  id: string;
  threshold: CSAlertThreshold;
  currentValue: number;
  triggeredAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface CSMetricsData {
  churnRate: number;
  nps: number;
  nrr: number;
  grr: number;
  csat: number;
  healthScore: number;
  ces: number;
}

const DEFAULT_THRESHOLDS: CSAlertThreshold[] = [
  { id: 'churn-critical', metric: 'churnRate', condition: 'above', value: 10, severity: 'critical', enabled: true },
  { id: 'churn-warning', metric: 'churnRate', condition: 'above', value: 7, severity: 'warning', enabled: true },
  { id: 'nps-critical', metric: 'nps', condition: 'below', value: 0, severity: 'critical', enabled: true },
  { id: 'nps-warning', metric: 'nps', condition: 'below', value: 20, severity: 'warning', enabled: true },
  { id: 'nrr-critical', metric: 'nrr', condition: 'below', value: 100, severity: 'critical', enabled: true },
  { id: 'nrr-warning', metric: 'nrr', condition: 'below', value: 105, severity: 'warning', enabled: true },
  { id: 'grr-critical', metric: 'grr', condition: 'below', value: 85, severity: 'critical', enabled: true },
  { id: 'csat-warning', metric: 'csat', condition: 'below', value: 70, severity: 'warning', enabled: true },
  { id: 'health-critical', metric: 'healthScore', condition: 'below', value: 40, severity: 'critical', enabled: true },
  { id: 'health-warning', metric: 'healthScore', condition: 'below', value: 60, severity: 'warning', enabled: true },
];

const METRIC_LABELS: Record<string, string> = {
  churnRate: 'Tasa de Churn',
  nps: 'NPS',
  nrr: 'NRR',
  grr: 'GRR',
  csat: 'CSAT',
  healthScore: 'Health Score',
  ces: 'CES',
};

export function useCSMetricsAlerts(metrics: CSMetricsData) {
  const [thresholds, setThresholds] = useState<CSAlertThreshold[]>(() => {
    const saved = localStorage.getItem('cs-alert-thresholds');
    return saved ? JSON.parse(saved) : DEFAULT_THRESHOLDS;
  });
  
  const [alerts, setAlerts] = useState<CSAlert[]>([]);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Save thresholds to localStorage
  useEffect(() => {
    localStorage.setItem('cs-alert-thresholds', JSON.stringify(thresholds));
  }, [thresholds]);

  // Check metrics against thresholds
  const checkThresholds = useCallback(() => {
    const newAlerts: CSAlert[] = [];
    
    thresholds.forEach(threshold => {
      if (!threshold.enabled) return;
      
      const currentValue = metrics[threshold.metric as keyof CSMetricsData];
      if (currentValue === undefined) return;
      
      let triggered = false;
      if (threshold.condition === 'above' && currentValue > threshold.value) {
        triggered = true;
      } else if (threshold.condition === 'below' && currentValue < threshold.value) {
        triggered = true;
      }
      
      if (triggered) {
        const existingAlert = alerts.find(a => a.threshold.id === threshold.id && !a.acknowledged);
        
        if (!existingAlert) {
          const newAlert: CSAlert = {
            id: `${threshold.id}-${Date.now()}`,
            threshold,
            currentValue,
            triggeredAt: new Date().toISOString(),
            acknowledged: false,
          };
          newAlerts.push(newAlert);
          
          // Show toast notification
          const label = METRIC_LABELS[threshold.metric] || threshold.metric;
          const condition = threshold.condition === 'above' ? 'supera' : 'está por debajo de';
          
          if (threshold.severity === 'critical') {
            toast.error(`⚠️ Alerta Crítica: ${label}`, {
              description: `${label} (${currentValue.toFixed(1)}) ${condition} ${threshold.value}`,
              duration: 10000,
            });
          } else {
            toast.warning(`Alerta: ${label}`, {
              description: `${label} (${currentValue.toFixed(1)}) ${condition} ${threshold.value}`,
              duration: 7000,
            });
          }
        }
      }
    });
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts]);
    }
    
    setLastCheck(new Date());
  }, [metrics, thresholds, alerts]);

  // Auto-check on metrics change
  useEffect(() => {
    checkThresholds();
  }, [metrics.churnRate, metrics.nps, metrics.nrr]);

  // Periodic check every 5 minutes
  useEffect(() => {
    const interval = setInterval(checkThresholds, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkThresholds]);

  const acknowledgeAlert = useCallback((alertId: string, userId?: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { 
            ...alert, 
            acknowledged: true, 
            acknowledgedBy: userId,
            acknowledgedAt: new Date().toISOString()
          }
        : alert
    ));
    toast.success('Alerta reconocida');
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  const updateThreshold = useCallback((thresholdId: string, updates: Partial<CSAlertThreshold>) => {
    setThresholds(prev => prev.map(t => 
      t.id === thresholdId ? { ...t, ...updates } : t
    ));
    toast.success('Umbral actualizado');
  }, []);

  const addThreshold = useCallback((threshold: Omit<CSAlertThreshold, 'id'>) => {
    const newThreshold: CSAlertThreshold = {
      ...threshold,
      id: `custom-${Date.now()}`,
    };
    setThresholds(prev => [...prev, newThreshold]);
    toast.success('Umbral añadido');
  }, []);

  const removeThreshold = useCallback((thresholdId: string) => {
    setThresholds(prev => prev.filter(t => t.id !== thresholdId));
    toast.success('Umbral eliminado');
  }, []);

  const resetToDefaults = useCallback(() => {
    setThresholds(DEFAULT_THRESHOLDS);
    toast.success('Umbrales restablecidos');
  }, []);

  const activeAlerts = useMemo(() => 
    alerts.filter(a => !a.acknowledged), 
    [alerts]
  );

  const criticalAlertsCount = useMemo(() => 
    activeAlerts.filter(a => a.threshold.severity === 'critical').length,
    [activeAlerts]
  );

  return {
    thresholds,
    alerts,
    activeAlerts,
    criticalAlertsCount,
    lastCheck,
    acknowledgeAlert,
    dismissAlert,
    updateThreshold,
    addThreshold,
    removeThreshold,
    resetToDefaults,
    checkThresholds,
    METRIC_LABELS,
  };
}

export default useCSMetricsAlerts;
