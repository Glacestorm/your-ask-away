import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ThreatIndicator {
  id: string;
  threat_type: 'malware' | 'phishing' | 'brute_force' | 'ddos' | 'data_exfiltration' | 'insider_threat' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  source_ip?: string;
  target_resource?: string;
  indicators: string[];
  first_seen: string;
  last_seen: string;
  occurrence_count: number;
  status: 'active' | 'investigating' | 'mitigated' | 'false_positive';
  mitre_tactics?: string[];
  mitre_techniques?: string[];
}

export interface ThreatAlert {
  id: string;
  indicator_id: string;
  alert_type: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggered_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  recommended_actions: string[];
}

export interface ThreatIntelligence {
  id: string;
  source: string;
  ioc_type: 'ip' | 'domain' | 'hash' | 'url' | 'email';
  ioc_value: string;
  threat_type: string;
  confidence: number;
  first_reported: string;
  last_updated: string;
  tags: string[];
}

export function useThreatDetection() {
  const [isLoading, setIsLoading] = useState(false);
  const [indicators, setIndicators] = useState<ThreatIndicator[]>([]);
  const [alerts, setAlerts] = useState<ThreatAlert[]>([]);
  const [intelligence, setIntelligence] = useState<ThreatIntelligence[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchThreats = useCallback(async (timeRange?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'threat-detection',
        {
          body: {
            action: 'get_threats',
            timeRange: timeRange || '24h'
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setIndicators(data.indicators || []);
        setAlerts(data.alerts || []);
        setIntelligence(data.intelligence || []);
        setLastRefresh(new Date());
        return data;
      }

      throw new Error(data?.error || 'Error fetching threats');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useThreatDetection] fetchThreats error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runThreatScan = useCallback(async (scope: 'full' | 'quick' | 'targeted', target?: string) => {
    try {
      toast.info('Iniciando escaneo de amenazas...');
      
      const { data, error: fnError } = await supabase.functions.invoke(
        'threat-detection',
        {
          body: {
            action: 'run_scan',
            scope,
            target
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(`Escaneo ${scope} completado`);
        await fetchThreats();
        return data.scan_results;
      }

      return null;
    } catch (err) {
      console.error('[useThreatDetection] runThreatScan error:', err);
      toast.error('Error en escaneo de amenazas');
      return null;
    }
  }, [fetchThreats]);

  const investigateThreat = useCallback(async (indicatorId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'threat-detection',
        {
          body: {
            action: 'investigate',
            indicatorId
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        return data.investigation;
      }

      return null;
    } catch (err) {
      console.error('[useThreatDetection] investigateThreat error:', err);
      toast.error('Error en investigación');
      return null;
    }
  }, []);

  const mitigateThreat = useCallback(async (indicatorId: string, action: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'threat-detection',
        {
          body: {
            action: 'mitigate',
            indicatorId,
            mitigationAction: action
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Amenaza mitigada correctamente');
        await fetchThreats();
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useThreatDetection] mitigateThreat error:', err);
      toast.error('Error en mitigación');
      return false;
    }
  }, [fetchThreats]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'threat-detection',
        {
          body: {
            action: 'acknowledge_alert',
            alertId
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Alerta reconocida');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useThreatDetection] acknowledgeAlert error:', err);
      return false;
    }
  }, []);

  const startAutoRefresh = useCallback((intervalMs = 60000) => {
    stopAutoRefresh();
    fetchThreats();
    autoRefreshInterval.current = setInterval(() => {
      fetchThreats();
    }, intervalMs);
  }, [fetchThreats]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    isLoading,
    indicators,
    alerts,
    intelligence,
    error,
    lastRefresh,
    fetchThreats,
    runThreatScan,
    investigateThreat,
    mitigateThreat,
    acknowledgeAlert,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useThreatDetection;
