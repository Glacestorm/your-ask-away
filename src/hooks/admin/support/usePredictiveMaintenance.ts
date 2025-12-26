// Predictive Maintenance Module - IoT Telemetry & Proactive Support
// Telemetría IoT, detección anomalías, predicción fallos, soporte proactivo

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface IoTDevice {
  id: string;
  deviceType: string;
  name: string;
  customerId: string;
  status: 'online' | 'offline' | 'warning' | 'critical' | 'maintenance';
  lastSeen: string;
  firmwareVersion: string;
  healthScore: number;
  location?: string;
  metadata: Record<string, unknown>;
}

export interface TelemetryData {
  deviceId: string;
  timestamp: string;
  metrics: {
    cpu?: number;
    memory?: number;
    temperature?: number;
    networkLatency?: number;
    errorRate?: number;
    responseTime?: number;
    customMetrics?: Record<string, number>;
  };
  events: TelemetryEvent[];
}

export interface TelemetryEvent {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  code: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Anomaly {
  id: string;
  deviceId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: string;
  metrics: Record<string, number>;
  expectedRange: { min: number; max: number };
  actualValue: number;
  confidence: number;
  resolved: boolean;
  resolvedAt?: string;
}

export interface FailurePrediction {
  id: string;
  deviceId: string;
  componentPredicted: string;
  failureProbability: number;
  estimatedTimeToFailure: number; // hours
  confidenceInterval: { low: number; high: number };
  contributingFactors: string[];
  recommendedActions: string[];
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
}

export interface ProactiveSession {
  id: string;
  deviceId: string;
  customerId: string;
  triggerType: 'anomaly' | 'prediction' | 'scheduled' | 'pattern';
  triggerId: string;
  status: 'pending' | 'notified' | 'scheduled' | 'in_progress' | 'completed' | 'declined';
  priority: number;
  description: string;
  proposedActions: string[];
  customerResponse?: string;
  scheduledAt?: string;
  completedAt?: string;
  outcome?: string;
  createdAt: string;
}

export interface MaintenancePattern {
  id: string;
  deviceType: string;
  patternName: string;
  symptoms: string[];
  typicalProgression: string[];
  preventiveActions: string[];
  avgTimeToFailure: number;
  occurrences: number;
  lastSeen: string;
}

export interface DeviceHealthReport {
  deviceId: string;
  overallHealth: number;
  components: {
    name: string;
    health: number;
    trend: 'improving' | 'stable' | 'declining';
    concerns: string[];
  }[];
  recentAnomalies: Anomaly[];
  predictions: FailurePrediction[];
  maintenanceHistory: {
    date: string;
    type: string;
    outcome: string;
  }[];
  recommendations: string[];
}

// === HOOK ===
export function usePredictiveMaintenance() {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [telemetry, setTelemetry] = useState<Map<string, TelemetryData>>(new Map());
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [predictions, setPredictions] = useState<FailurePrediction[]>([]);
  const [proactiveSessions, setProactiveSessions] = useState<ProactiveSession[]>([]);
  const [patterns, setPatterns] = useState<MaintenancePattern[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);
  const realtimeChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // === FETCH DEVICES ===
  const fetchDevices = useCallback(async (customerId?: string) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-maintenance-iot', {
        body: {
          action: 'get_devices',
          customerId
        }
      });

      if (fnError) throw fnError;

      setDevices(data?.devices || []);
      return data?.devices || [];
    } catch (err) {
      console.error('[usePredictiveMaintenance] fetchDevices error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET DEVICE TELEMETRY ===
  const getDeviceTelemetry = useCallback(async (
    deviceId: string,
    timeRange: 'hour' | 'day' | 'week' = 'day'
  ): Promise<TelemetryData | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-maintenance-iot', {
        body: {
          action: 'get_telemetry',
          deviceId,
          timeRange
        }
      });

      if (fnError) throw fnError;

      if (data?.telemetry) {
        setTelemetry(prev => new Map(prev).set(deviceId, data.telemetry));
        return data.telemetry;
      }

      return null;
    } catch (err) {
      console.error('[usePredictiveMaintenance] getDeviceTelemetry error:', err);
      return null;
    }
  }, []);

  // === DETECT ANOMALIES ===
  const detectAnomalies = useCallback(async (deviceId?: string): Promise<Anomaly[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-maintenance-iot', {
        body: {
          action: 'detect_anomalies',
          deviceId
        }
      });

      if (fnError) throw fnError;

      const detected = data?.anomalies || [];
      setAnomalies(prev => {
        const existingIds = new Set(prev.map(a => a.id));
        const newAnomalies = detected.filter((a: Anomaly) => !existingIds.has(a.id));
        return [...newAnomalies, ...prev].slice(0, 100);
      });

      // Notify for critical anomalies
      const critical = detected.filter((a: Anomaly) => a.severity === 'critical' && !a.resolved);
      if (critical.length > 0) {
        toast.error(`🚨 ${critical.length} anomalía(s) crítica(s) detectada(s)`, {
          description: 'Se requiere atención inmediata'
        });
      }

      return detected;
    } catch (err) {
      console.error('[usePredictiveMaintenance] detectAnomalies error:', err);
      return [];
    }
  }, []);

  // === PREDICT FAILURES ===
  const predictFailures = useCallback(async (deviceId?: string): Promise<FailurePrediction[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-maintenance-iot', {
        body: {
          action: 'predict_failures',
          deviceId
        }
      });

      if (fnError) throw fnError;

      const predicted = data?.predictions || [];
      setPredictions(predicted);

      // Notify for high-probability predictions
      const urgent = predicted.filter((p: FailurePrediction) => 
        p.failureProbability > 0.7 && p.estimatedTimeToFailure < 48
      );

      if (urgent.length > 0) {
        toast.warning(`⚠️ ${urgent.length} fallo(s) predicho(s) en las próximas 48h`, {
          description: 'Se recomienda mantenimiento preventivo'
        });
      }

      return predicted;
    } catch (err) {
      console.error('[usePredictiveMaintenance] predictFailures error:', err);
      return [];
    }
  }, []);

  // === CREATE PROACTIVE SESSION ===
  const createProactiveSession = useCallback(async (
    deviceId: string,
    customerId: string,
    triggerType: ProactiveSession['triggerType'],
    triggerId: string,
    description: string,
    proposedActions: string[]
  ): Promise<ProactiveSession | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-maintenance-iot', {
        body: {
          action: 'create_proactive_session',
          deviceId,
          customerId,
          triggerType,
          triggerId,
          description,
          proposedActions
        }
      });

      if (fnError) throw fnError;

      if (data?.session) {
        setProactiveSessions(prev => [data.session, ...prev]);
        toast.success('Sesión proactiva creada', {
          description: 'El cliente será notificado'
        });
        return data.session;
      }

      return null;
    } catch (err) {
      console.error('[usePredictiveMaintenance] createProactiveSession error:', err);
      return null;
    }
  }, []);

  // === UPDATE PROACTIVE SESSION ===
  const updateProactiveSession = useCallback(async (
    sessionId: string,
    updates: Partial<ProactiveSession>
  ): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-maintenance-iot', {
        body: {
          action: 'update_proactive_session',
          sessionId,
          updates
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setProactiveSessions(prev => prev.map(s => 
          s.id === sessionId ? { ...s, ...updates } : s
        ));
        return true;
      }

      return false;
    } catch (err) {
      console.error('[usePredictiveMaintenance] updateProactiveSession error:', err);
      return false;
    }
  }, []);

  // === GET DEVICE HEALTH REPORT ===
  const getDeviceHealthReport = useCallback(async (deviceId: string): Promise<DeviceHealthReport | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-maintenance-iot', {
        body: {
          action: 'get_health_report',
          deviceId
        }
      });

      if (fnError) throw fnError;

      return data?.report || null;
    } catch (err) {
      console.error('[usePredictiveMaintenance] getDeviceHealthReport error:', err);
      return null;
    }
  }, []);

  // === FETCH MAINTENANCE PATTERNS ===
  const fetchPatterns = useCallback(async (deviceType?: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-maintenance-iot', {
        body: {
          action: 'get_patterns',
          deviceType
        }
      });

      if (fnError) throw fnError;

      setPatterns(data?.patterns || []);
      return data?.patterns || [];
    } catch (err) {
      console.error('[usePredictiveMaintenance] fetchPatterns error:', err);
      return [];
    }
  }, []);

  // === START MONITORING ===
  const startMonitoring = useCallback(async (intervalMs = 60000) => {
    stopMonitoring();
    setIsMonitoring(true);

    // Initial fetch
    await Promise.all([
      fetchDevices(),
      detectAnomalies(),
      predictFailures()
    ]);

    // Periodic monitoring
    monitoringInterval.current = setInterval(async () => {
      await detectAnomalies();
      await predictFailures();
    }, intervalMs);

    // Setup realtime subscription
    realtimeChannel.current = supabase
      .channel('iot-telemetry')
      .on('broadcast', { event: 'telemetry' }, (payload) => {
        const data = payload.payload as TelemetryData;
        setTelemetry(prev => new Map(prev).set(data.deviceId, data));
      })
      .on('broadcast', { event: 'anomaly' }, (payload) => {
        const anomaly = payload.payload as Anomaly;
        setAnomalies(prev => [anomaly, ...prev].slice(0, 100));
        
        if (anomaly.severity === 'critical') {
          toast.error('Anomalía crítica detectada', {
            description: anomaly.description
          });
        }
      })
      .subscribe();

    toast.success('Monitoreo IoT iniciado');
  }, [fetchDevices, detectAnomalies, predictFailures]);

  // === STOP MONITORING ===
  const stopMonitoring = useCallback(() => {
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }

    if (realtimeChannel.current) {
      supabase.removeChannel(realtimeChannel.current);
      realtimeChannel.current = null;
    }

    setIsMonitoring(false);
  }, []);

  // === RESOLVE ANOMALY ===
  const resolveAnomaly = useCallback(async (anomalyId: string, resolution: string): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-maintenance-iot', {
        body: {
          action: 'resolve_anomaly',
          anomalyId,
          resolution
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setAnomalies(prev => prev.map(a => 
          a.id === anomalyId 
            ? { ...a, resolved: true, resolvedAt: new Date().toISOString() }
            : a
        ));
        toast.success('Anomalía resuelta');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[usePredictiveMaintenance] resolveAnomaly error:', err);
      return false;
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    // State
    devices,
    telemetry,
    anomalies,
    predictions,
    proactiveSessions,
    patterns,
    isLoading,
    isMonitoring,
    error,
    // Actions
    fetchDevices,
    getDeviceTelemetry,
    detectAnomalies,
    predictFailures,
    createProactiveSession,
    updateProactiveSession,
    getDeviceHealthReport,
    fetchPatterns,
    startMonitoring,
    stopMonitoring,
    resolveAnomaly,
  };
}

export default usePredictiveMaintenance;
