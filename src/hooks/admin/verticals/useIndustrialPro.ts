import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===

// Real Estate
export interface PropertyToken {
  id: string;
  property_id: string;
  total_tokens: number;
  available_tokens: number;
  price_per_token: number;
  currency: string;
  smart_contract_address: string;
  investors: Array<{ investor_id: string; tokens_owned: number }>;
}

export interface PropertyValuation {
  property_id: string;
  estimated_value: number;
  confidence_score: number;
  comparable_properties: Array<{
    address: string;
    price: number;
    similarity_score: number;
  }>;
  market_trends: Record<string, number>;
  recommendation: string;
}

// Manufacturing
export interface DigitalTwin {
  id: string;
  asset_id: string;
  asset_type: string;
  real_time_data: Record<string, number>;
  model_3d_url: string;
  sensors: Array<{ id: string; type: string; value: number; status: string }>;
  last_sync: string;
}

export interface PredictiveMaintenance {
  asset_id: string;
  failure_probability: number;
  predicted_failure_date: string;
  confidence: number;
  recommended_actions: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimated_cost: number;
    downtime_hours: number;
  }>;
  historical_failures: Array<{ date: string; type: string; cost: number }>;
}

export interface OEEMetrics {
  asset_id: string;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  target_oee: number;
  losses: Array<{ type: string; minutes: number; category: string }>;
  trends: Array<{ date: string; oee: number }>;
}

// Logistics
export interface FleetVehicle {
  id: string;
  vehicle_type: string;
  current_location: { lat: number; lng: number };
  status: 'available' | 'in_transit' | 'loading' | 'maintenance';
  driver_id?: string;
  current_route?: RouteOptimization;
  fuel_level: number;
  next_maintenance: string;
}

export interface RouteOptimization {
  route_id: string;
  stops: Array<{
    address: string;
    coordinates: { lat: number; lng: number };
    eta: string;
    type: 'pickup' | 'delivery';
    priority: number;
  }>;
  total_distance_km: number;
  estimated_time_hours: number;
  fuel_cost: number;
  carbon_footprint_kg: number;
  alternative_routes?: RouteOptimization[];
}

export interface SupplyChainBlock {
  transaction_id: string;
  product_id: string;
  events: Array<{
    event_type: string;
    actor: string;
    location: string;
    timestamp: string;
    verified: boolean;
    block_hash: string;
  }>;
  current_status: string;
  estimated_delivery: string;
}

// Energy
export interface SmartGridData {
  grid_id: string;
  total_generation_mw: number;
  total_consumption_mw: number;
  renewable_percentage: number;
  grid_frequency_hz: number;
  voltage_stability: number;
  active_alerts: string[];
  nodes: Array<{
    node_id: string;
    type: 'generation' | 'consumption' | 'storage';
    capacity_mw: number;
    current_mw: number;
    status: string;
  }>;
}

export interface CarbonTrading {
  account_id: string;
  credits_balance: number;
  credits_value: number;
  market_price: number;
  transactions: Array<{
    type: 'buy' | 'sell' | 'offset';
    quantity: number;
    price: number;
    date: string;
    counterparty?: string;
  }>;
  projected_needs: number;
}

export interface RenewableForecast {
  source_type: 'solar' | 'wind' | 'hydro';
  location: { lat: number; lng: number };
  forecasts: Array<{
    timestamp: string;
    generation_mw: number;
    confidence: number;
    weather_factors: Record<string, number>;
  }>;
  total_daily_mwh: number;
  optimal_storage_schedule: Array<{ hour: number; action: 'charge' | 'discharge'; mw: number }>;
}

// Construction
export interface BIMModel {
  project_id: string;
  model_url: string;
  version: string;
  elements: Array<{
    element_id: string;
    type: string;
    properties: Record<string, unknown>;
    status: 'planned' | 'in_progress' | 'completed';
  }>;
  clashes: Array<{ element1: string; element2: string; severity: string }>;
  last_updated: string;
}

export interface ConstructionDigitalTwin {
  project_id: string;
  progress_percentage: number;
  scan_3d_url: string;
  planned_vs_actual: Record<string, { planned: number; actual: number }>;
  safety_incidents: Array<{ date: string; type: string; severity: string }>;
  weather_delays_days: number;
  cost_variance: number;
}

export interface SafetyMonitor {
  site_id: string;
  active_workers: number;
  ppe_compliance: number;
  hazards_detected: Array<{
    type: string;
    location: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    detected_at: string;
    resolved: boolean;
  }>;
  safety_score: number;
  camera_feeds: Array<{ camera_id: string; url: string; zone: string }>;
}

// === HOOK ===
export function useIndustrialPro() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === REAL ESTATE ===
  const tokenizeProperty = useCallback(async (
    propertyId: string,
    totalTokens: number,
    pricePerToken: number
  ): Promise<PropertyToken | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('industrial-pro', {
        body: {
          action: 'tokenize_property',
          params: { propertyId, totalTokens, pricePerToken }
        }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Propiedad tokenizada');
        return data.data;
      }
      return null;
    } catch (err) {
      toast.error('Error al tokenizar propiedad');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPropertyValuation = useCallback(async (
    propertyId: string
  ): Promise<PropertyValuation | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('industrial-pro', {
        body: {
          action: 'get_property_valuation',
          params: { propertyId }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error getting valuation:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === MANUFACTURING ===
  const getDigitalTwin = useCallback(async (
    assetId: string
  ): Promise<DigitalTwin | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('industrial-pro', {
        body: {
          action: 'get_digital_twin',
          params: { assetId }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error fetching digital twin:', err);
      return null;
    }
  }, []);

  const getPredictiveMaintenance = useCallback(async (
    assetId: string
  ): Promise<PredictiveMaintenance | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('industrial-pro', {
        body: {
          action: 'get_predictive_maintenance',
          params: { assetId }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error getting maintenance prediction:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getOEEMetrics = useCallback(async (
    assetId: string,
    dateRange?: { start: string; end: string }
  ): Promise<OEEMetrics | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('industrial-pro', {
        body: {
          action: 'get_oee_metrics',
          params: { assetId, dateRange }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error fetching OEE:', err);
      return null;
    }
  }, []);

  // === LOGISTICS ===
  const getFleetStatus = useCallback(async (): Promise<FleetVehicle[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('industrial-pro', {
        body: { action: 'get_fleet_status' }
      });

      if (fnError) throw fnError;
      return data?.data || [];
    } catch (err) {
      console.error('Error fetching fleet:', err);
      return [];
    }
  }, []);

  const optimizeRoute = useCallback(async (
    vehicleId: string,
    stops: Array<{ address: string; type: 'pickup' | 'delivery' }>
  ): Promise<RouteOptimization | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('industrial-pro', {
        body: {
          action: 'optimize_route',
          params: { vehicleId, stops }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error optimizing route:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSupplyChainTrace = useCallback(async (
    productId: string
  ): Promise<SupplyChainBlock | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('industrial-pro', {
        body: {
          action: 'get_supply_chain_trace',
          params: { productId }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error fetching supply chain:', err);
      return null;
    }
  }, []);

  // === ENERGY ===
  const getSmartGridData = useCallback(async (
    gridId: string
  ): Promise<SmartGridData | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('industrial-pro', {
        body: {
          action: 'get_smart_grid_data',
          params: { gridId }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error fetching grid data:', err);
      return null;
    }
  }, []);

  const getCarbonTrading = useCallback(async (
    accountId: string
  ): Promise<CarbonTrading | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('industrial-pro', {
        body: {
          action: 'get_carbon_trading',
          params: { accountId }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error fetching carbon data:', err);
      return null;
    }
  }, []);

  const getRenewableForecast = useCallback(async (
    sourceType: 'solar' | 'wind' | 'hydro',
    location: { lat: number; lng: number }
  ): Promise<RenewableForecast | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('industrial-pro', {
        body: {
          action: 'get_renewable_forecast',
          params: { sourceType, location }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error fetching forecast:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CONSTRUCTION ===
  const getBIMModel = useCallback(async (
    projectId: string
  ): Promise<BIMModel | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('industrial-pro', {
        body: {
          action: 'get_bim_model',
          params: { projectId }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error fetching BIM:', err);
      return null;
    }
  }, []);

  const getConstructionTwin = useCallback(async (
    projectId: string
  ): Promise<ConstructionDigitalTwin | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('industrial-pro', {
        body: {
          action: 'get_construction_twin',
          params: { projectId }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error fetching construction twin:', err);
      return null;
    }
  }, []);

  const getSafetyMonitor = useCallback(async (
    siteId: string
  ): Promise<SafetyMonitor | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('industrial-pro', {
        body: {
          action: 'get_safety_monitor',
          params: { siteId }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error fetching safety data:', err);
      return null;
    }
  }, []);

  return {
    isLoading,
    error,
    // Real Estate
    tokenizeProperty,
    getPropertyValuation,
    // Manufacturing
    getDigitalTwin,
    getPredictiveMaintenance,
    getOEEMetrics,
    // Logistics
    getFleetStatus,
    optimizeRoute,
    getSupplyChainTrace,
    // Energy
    getSmartGridData,
    getCarbonTrading,
    getRenewableForecast,
    // Construction
    getBIMModel,
    getConstructionTwin,
    getSafetyMonitor,
  };
}

export default useIndustrialPro;
