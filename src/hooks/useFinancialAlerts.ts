import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RatioThreshold {
  ratio_name: string;
  min_value: number;
  max_value: number;
  optimal_value: number;
  warning_below?: number;
  warning_above?: number;
  critical_below?: number;
  critical_above?: number;
}

export interface FinancialAlert {
  id: string;
  plan_id: string;
  ratio_name: string;
  current_value: number;
  threshold_min: number;
  threshold_max: number;
  optimal_value: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  recommendation: string;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

// Sector optimal ranges
const SECTOR_RATIO_THRESHOLDS: Record<string, RatioThreshold[]> = {
  general: [
    { ratio_name: 'current_ratio', min_value: 1.0, max_value: 3.0, optimal_value: 1.5, warning_below: 1.2, critical_below: 1.0 },
    { ratio_name: 'debt_to_equity', min_value: 0, max_value: 2.0, optimal_value: 0.8, warning_above: 1.5, critical_above: 2.0 },
    { ratio_name: 'gross_margin', min_value: 0.2, max_value: 0.8, optimal_value: 0.4, warning_below: 0.25, critical_below: 0.15 },
    { ratio_name: 'net_margin', min_value: 0.02, max_value: 0.3, optimal_value: 0.1, warning_below: 0.05, critical_below: 0.02 },
    { ratio_name: 'roa', min_value: 0.02, max_value: 0.25, optimal_value: 0.08, warning_below: 0.04, critical_below: 0.02 },
    { ratio_name: 'roe', min_value: 0.05, max_value: 0.35, optimal_value: 0.15, warning_below: 0.08, critical_below: 0.05 },
  ],
  retail: [
    { ratio_name: 'current_ratio', min_value: 1.2, max_value: 2.5, optimal_value: 1.8, warning_below: 1.4, critical_below: 1.2 },
    { ratio_name: 'inventory_turnover', min_value: 4, max_value: 12, optimal_value: 8, warning_below: 5, critical_below: 4 },
    { ratio_name: 'gross_margin', min_value: 0.25, max_value: 0.5, optimal_value: 0.35, warning_below: 0.28, critical_below: 0.2 },
  ],
  tecnologia: [
    { ratio_name: 'current_ratio', min_value: 1.5, max_value: 4.0, optimal_value: 2.5, warning_below: 1.8, critical_below: 1.5 },
    { ratio_name: 'gross_margin', min_value: 0.5, max_value: 0.9, optimal_value: 0.7, warning_below: 0.55, critical_below: 0.45 },
    { ratio_name: 'r_d_ratio', min_value: 0.1, max_value: 0.4, optimal_value: 0.2, warning_below: 0.12, critical_below: 0.08 },
  ],
  hosteleria: [
    { ratio_name: 'current_ratio', min_value: 0.8, max_value: 1.5, optimal_value: 1.1, warning_below: 0.9, critical_below: 0.8 },
    { ratio_name: 'occupancy_rate', min_value: 0.5, max_value: 0.95, optimal_value: 0.75, warning_below: 0.6, critical_below: 0.5 },
    { ratio_name: 'food_cost_ratio', min_value: 0.25, max_value: 0.38, optimal_value: 0.3, warning_above: 0.35, critical_above: 0.4 },
  ]
};

const RATIO_LABELS: Record<string, string> = {
  current_ratio: 'Ratio de Liquidez',
  debt_to_equity: 'Ratio Deuda/Capital',
  gross_margin: 'Margen Bruto',
  net_margin: 'Margen Neto',
  roa: 'ROA',
  roe: 'ROE',
  inventory_turnover: 'Rotación de Inventario',
  r_d_ratio: 'Ratio I+D',
  occupancy_rate: 'Tasa de Ocupación',
  food_cost_ratio: 'Ratio Coste Alimentación'
};

export function useFinancialAlerts() {
  const [alerts, setAlerts] = useState<FinancialAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [thresholds, setThresholds] = useState<RatioThreshold[]>([]);

  const loadThresholds = useCallback((sectorKey: string) => {
    const sectorThresholds = SECTOR_RATIO_THRESHOLDS[sectorKey] || SECTOR_RATIO_THRESHOLDS.general;
    setThresholds(sectorThresholds);
    return sectorThresholds;
  }, []);

  const checkRatios = useCallback((
    planId: string,
    sectorKey: string,
    ratios: Record<string, number>
  ): FinancialAlert[] => {
    const sectorThresholds = loadThresholds(sectorKey);
    const newAlerts: FinancialAlert[] = [];

    for (const threshold of sectorThresholds) {
      const value = ratios[threshold.ratio_name];
      if (value === undefined) continue;

      let severity: FinancialAlert['severity'] = 'info';
      let message = '';
      let recommendation = '';

      // Check critical thresholds
      if (threshold.critical_below !== undefined && value < threshold.critical_below) {
        severity = 'critical';
        message = `${RATIO_LABELS[threshold.ratio_name] || threshold.ratio_name} (${(value * 100).toFixed(1)}%) está muy por debajo del mínimo crítico (${(threshold.critical_below * 100).toFixed(1)}%)`;
        recommendation = `Acción urgente: Revisar estructura financiera. Objetivo: alcanzar al menos ${(threshold.min_value * 100).toFixed(1)}%`;
      } else if (threshold.critical_above !== undefined && value > threshold.critical_above) {
        severity = 'critical';
        message = `${RATIO_LABELS[threshold.ratio_name] || threshold.ratio_name} (${(value * 100).toFixed(1)}%) supera el umbral crítico (${(threshold.critical_above * 100).toFixed(1)}%)`;
        recommendation = `Acción urgente: Reducir hasta el rango óptimo de ${(threshold.optimal_value * 100).toFixed(1)}%`;
      }
      // Check warning thresholds
      else if (threshold.warning_below !== undefined && value < threshold.warning_below) {
        severity = 'warning';
        message = `${RATIO_LABELS[threshold.ratio_name] || threshold.ratio_name} (${(value * 100).toFixed(1)}%) está por debajo del nivel recomendado (${(threshold.warning_below * 100).toFixed(1)}%)`;
        recommendation = `Revisar y planificar mejoras. Objetivo: ${(threshold.optimal_value * 100).toFixed(1)}%`;
      } else if (threshold.warning_above !== undefined && value > threshold.warning_above) {
        severity = 'warning';
        message = `${RATIO_LABELS[threshold.ratio_name] || threshold.ratio_name} (${(value * 100).toFixed(1)}%) supera el nivel recomendado (${(threshold.warning_above * 100).toFixed(1)}%)`;
        recommendation = `Considerar optimización. Objetivo: ${(threshold.optimal_value * 100).toFixed(1)}%`;
      }

      if (severity !== 'info') {
        newAlerts.push({
          id: `${planId}-${threshold.ratio_name}-${Date.now()}`,
          plan_id: planId,
          ratio_name: threshold.ratio_name,
          current_value: value,
          threshold_min: threshold.min_value,
          threshold_max: threshold.max_value,
          optimal_value: threshold.optimal_value,
          severity,
          message,
          recommendation,
          created_at: new Date().toISOString()
        });
      }
    }

    setAlerts(newAlerts);
    
    if (newAlerts.filter(a => a.severity === 'critical').length > 0) {
      toast.error(`${newAlerts.filter(a => a.severity === 'critical').length} alertas críticas detectadas`);
    } else if (newAlerts.length > 0) {
      toast.warning(`${newAlerts.length} alertas de ratios financieros`);
    }

    return newAlerts;
  }, [loadThresholds]);

  const resolveAlert = useCallback(async (alertId: string) => {
    const { data: user } = await supabase.auth.getUser();
    setAlerts(prev => prev.map(a => 
      a.id === alertId 
        ? { ...a, resolved_at: new Date().toISOString(), resolved_by: user?.user?.id }
        : a
    ));
    toast.success('Alerta marcada como resuelta');
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  return {
    alerts,
    thresholds,
    isLoading,
    loadThresholds,
    checkRatios,
    resolveAlert,
    dismissAlert,
    criticalCount: alerts.filter(a => a.severity === 'critical').length,
    warningCount: alerts.filter(a => a.severity === 'warning').length
  };
}
