import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface PrecisionFarmingData {
  field_id: string;
  coordinates: { lat: number; lng: number }[];
  ndvi_index: number;
  soil_moisture: number;
  crop_health_score: number;
  satellite_image_url?: string;
  last_updated: string;
}

export interface IoTSensorReading {
  sensor_id: string;
  sensor_type: 'soil_moisture' | 'temperature' | 'humidity' | 'ph' | 'light' | 'wind';
  value: number;
  unit: string;
  battery_level: number;
  signal_strength: number;
  timestamp: string;
  location: { lat: number; lng: number };
}

export interface WeatherPrediction {
  date: string;
  temperature: { min: number; max: number };
  humidity: number;
  precipitation_probability: number;
  precipitation_mm: number;
  wind_speed: number;
  uv_index: number;
  agricultural_advice: string[];
  frost_risk: boolean;
  disease_risk: string[];
}

export interface FieldNotebookEntry {
  id: string;
  field_id: string;
  entry_type: 'treatment' | 'fertilization' | 'harvest' | 'planting' | 'observation';
  date: string;
  products_used?: Array<{
    name: string;
    quantity: number;
    unit: string;
    lot_number?: string;
  }>;
  notes: string;
  operator_id: string;
  compliant: boolean;
}

export interface BlockchainTrace {
  product_id: string;
  chain_of_custody: Array<{
    actor: string;
    action: string;
    location: string;
    timestamp: string;
    verified: boolean;
    hash: string;
  }>;
  certifications: string[];
  qr_code: string;
}

export interface IrrigationPlan {
  field_id: string;
  zones: Array<{
    zone_id: string;
    water_need_mm: number;
    scheduled_time: string;
    duration_minutes: number;
    priority: number;
  }>;
  total_water_m3: number;
  cost_estimate: number;
  water_savings_percent: number;
}

export interface CropHealthAnalysis {
  field_id: string;
  image_url: string;
  detected_issues: Array<{
    issue_type: 'disease' | 'pest' | 'nutrient_deficiency' | 'water_stress';
    name: string;
    confidence: number;
    affected_area_percent: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    treatment_recommendations: string[];
  }>;
  overall_health: number;
  yield_prediction: number;
}

// === HOOK ===
export function useAgriculturePro() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === PRECISION FARMING ===
  const getPrecisionFarmingData = useCallback(async (
    fieldId: string
  ): Promise<PrecisionFarmingData | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('agriculture-pro', {
        body: {
          action: 'get_precision_data',
          params: { fieldId }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error fetching precision data:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSatelliteImagery = useCallback(async (
    fieldId: string,
    imageType: 'ndvi' | 'rgb' | 'thermal' | 'moisture'
  ): Promise<string | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('agriculture-pro', {
        body: {
          action: 'get_satellite_imagery',
          params: { fieldId, imageType }
        }
      });

      if (fnError) throw fnError;
      return data?.data?.url || null;
    } catch (err) {
      console.error('Error fetching imagery:', err);
      return null;
    }
  }, []);

  // === IOT SENSORS ===
  const getSensorReadings = useCallback(async (
    fieldId: string,
    sensorTypes?: string[]
  ): Promise<IoTSensorReading[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('agriculture-pro', {
        body: {
          action: 'get_sensor_readings',
          params: { fieldId, sensorTypes }
        }
      });

      if (fnError) throw fnError;
      return data?.data || [];
    } catch (err) {
      console.error('Error fetching sensor data:', err);
      return [];
    }
  }, []);

  const configureSensorAlert = useCallback(async (
    sensorId: string,
    alertType: string,
    thresholds: { min?: number; max?: number }
  ): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('agriculture-pro', {
        body: {
          action: 'configure_sensor_alert',
          params: { sensorId, alertType, thresholds }
        }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Alerta de sensor configurada');
        return true;
      }
      return false;
    } catch (err) {
      toast.error('Error al configurar alerta');
      return false;
    }
  }, []);

  // === WEATHER AI ===
  const getWeatherPredictions = useCallback(async (
    location: { lat: number; lng: number },
    days: number = 7
  ): Promise<WeatherPrediction[]> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('agriculture-pro', {
        body: {
          action: 'get_weather_predictions',
          params: { location, days }
        }
      });

      if (fnError) throw fnError;
      return data?.data || [];
    } catch (err) {
      console.error('Error fetching weather:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CUADERNO DE CAMPO ===
  const addFieldNotebookEntry = useCallback(async (
    entry: Omit<FieldNotebookEntry, 'id' | 'compliant'>
  ): Promise<FieldNotebookEntry | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('agriculture-pro', {
        body: {
          action: 'add_notebook_entry',
          params: { entry }
        }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Entrada añadida al cuaderno de campo');
        return data.data;
      }
      return null;
    } catch (err) {
      toast.error('Error al añadir entrada');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getFieldNotebookEntries = useCallback(async (
    fieldId: string,
    dateRange?: { start: string; end: string }
  ): Promise<FieldNotebookEntry[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('agriculture-pro', {
        body: {
          action: 'get_notebook_entries',
          params: { fieldId, dateRange }
        }
      });

      if (fnError) throw fnError;
      return data?.data || [];
    } catch (err) {
      console.error('Error fetching entries:', err);
      return [];
    }
  }, []);

  // === BLOCKCHAIN TRACEABILITY ===
  const getProductTrace = useCallback(async (
    productId: string
  ): Promise<BlockchainTrace | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('agriculture-pro', {
        body: {
          action: 'get_product_trace',
          params: { productId }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error fetching trace:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addTraceEvent = useCallback(async (
    productId: string,
    event: { action: string; location: string; notes?: string }
  ): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('agriculture-pro', {
        body: {
          action: 'add_trace_event',
          params: { productId, event }
        }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Evento de trazabilidad registrado');
        return true;
      }
      return false;
    } catch (err) {
      toast.error('Error al registrar evento');
      return false;
    }
  }, []);

  // === IRRIGATION AI ===
  const getIrrigationPlan = useCallback(async (
    fieldId: string
  ): Promise<IrrigationPlan | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('agriculture-pro', {
        body: {
          action: 'get_irrigation_plan',
          params: { fieldId }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error fetching irrigation plan:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const executeIrrigation = useCallback(async (
    fieldId: string,
    zoneIds: string[]
  ): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('agriculture-pro', {
        body: {
          action: 'execute_irrigation',
          params: { fieldId, zoneIds }
        }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Riego iniciado');
        return true;
      }
      return false;
    } catch (err) {
      toast.error('Error al iniciar riego');
      return false;
    }
  }, []);

  // === CROP HEALTH DETECTION ===
  const analyzeCropHealth = useCallback(async (
    fieldId: string,
    imageUrl: string
  ): Promise<CropHealthAnalysis | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('agriculture-pro', {
        body: {
          action: 'analyze_crop_health',
          params: { fieldId, imageUrl }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error analyzing crop:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    // Precision Farming
    getPrecisionFarmingData,
    getSatelliteImagery,
    // IoT Sensors
    getSensorReadings,
    configureSensorAlert,
    // Weather AI
    getWeatherPredictions,
    // Field Notebook
    addFieldNotebookEntry,
    getFieldNotebookEntries,
    // Blockchain Traceability
    getProductTrace,
    addTraceEvent,
    // Irrigation AI
    getIrrigationPlan,
    executeIrrigation,
    // Crop Health
    analyzeCropHealth,
  };
}

export default useAgriculturePro;
