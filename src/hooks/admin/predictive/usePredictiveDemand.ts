import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DemandPrediction {
  product_id: string;
  product_name: string;
  period: string;
  predicted_demand: number;
  confidence: number;
  confidence_low: number;
  confidence_high: number;
  seasonality_factor: number;
  trend_direction: 'up' | 'stable' | 'down';
  recommended_stock: number;
  reorder_point: number;
}

export interface InventoryOptimization {
  product_id: string;
  current_stock: number;
  optimal_stock: number;
  days_of_supply: number;
  stockout_risk: number;
  overstock_cost: number;
  recommended_action: 'order_now' | 'reduce_stock' | 'maintain' | 'urgent_order';
  order_quantity: number;
}

export interface DemandDriver {
  driver: string;
  correlation: number;
  lag_days: number;
  predictive_power: number;
  current_value: number;
  forecast_impact: 'positive' | 'neutral' | 'negative';
}

export interface SeasonalPattern {
  pattern_name: string;
  peak_months: number[];
  trough_months: number[];
  amplitude: number;
  confidence: number;
}

export function usePredictiveDemand() {
  const [predictions, setPredictions] = useState<DemandPrediction[]>([]);
  const [optimizations, setOptimizations] = useState<InventoryOptimization[]>([]);
  const [drivers, setDrivers] = useState<DemandDriver[]>([]);
  const [patterns, setPatterns] = useState<SeasonalPattern[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predictDemand = useCallback(async (productIds?: string[], days: number = 90) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-demand', {
        body: { action: 'forecast', product_ids: productIds, days }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setPredictions(data.predictions || []);
        setDrivers(data.drivers || []);
        setPatterns(data.patterns || []);
        return data;
      }

      throw new Error(data?.error || 'Demand forecast failed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error('Error en predicción de demanda');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const optimizeInventory = useCallback(async (productIds?: string[]) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-demand', {
        body: { action: 'optimize_inventory', product_ids: productIds }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setOptimizations(data.optimizations || []);
        return data.optimizations;
      }
      return null;
    } catch (err) {
      console.error('[usePredictiveDemand] optimizeInventory error:', err);
      return null;
    }
  }, []);

  const detectAnomalies = useCallback(async (productId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-demand', {
        body: { action: 'detect_anomalies', product_id: productId }
      });

      if (fnError) throw fnError;
      return data?.anomalies || [];
    } catch (err) {
      console.error('[usePredictiveDemand] detectAnomalies error:', err);
      return [];
    }
  }, []);

  return {
    predictions,
    optimizations,
    drivers,
    patterns,
    isLoading,
    error,
    predictDemand,
    optimizeInventory,
    detectAnomalies
  };
}

export default usePredictiveDemand;
