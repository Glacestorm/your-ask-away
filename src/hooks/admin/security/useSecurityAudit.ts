import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AuditEvent {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  user_email?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  location?: string;
  status: 'success' | 'failure' | 'blocked';
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface AuditSummary {
  total_events: number;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
  recent_critical: AuditEvent[];
  top_users: Array<{ user_id: string; event_count: number }>;
  suspicious_patterns: Array<{
    pattern_type: string;
    description: string;
    risk_score: number;
  }>;
}

export interface SecurityAuditContext {
  timeRange: 'hour' | 'day' | 'week' | 'month';
  filters?: {
    severity?: string[];
    event_types?: string[];
    user_ids?: string[];
  };
}

export function useSecurityAudit() {
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchAuditEvents = useCallback(async (context?: SecurityAuditContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'security-audit',
        {
          body: {
            action: 'get_events',
            context: context || { timeRange: 'day' }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setEvents(data.events || []);
        setSummary(data.summary || null);
        setLastRefresh(new Date());
        return data;
      }

      throw new Error(data?.error || 'Error fetching audit events');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useSecurityAudit] fetchAuditEvents error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeSecurityRisks = useCallback(async (context?: SecurityAuditContext) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'security-audit',
        {
          body: {
            action: 'analyze_risks',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Análisis de riesgos completado');
        return data.analysis;
      }

      return null;
    } catch (err) {
      console.error('[useSecurityAudit] analyzeSecurityRisks error:', err);
      toast.error('Error en análisis de riesgos');
      return null;
    }
  }, []);

  const exportAuditLog = useCallback(async (
    format: 'json' | 'csv' | 'pdf',
    context?: SecurityAuditContext
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'security-audit',
        {
          body: {
            action: 'export_log',
            format,
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(`Log exportado en formato ${format.toUpperCase()}`);
        return data.export;
      }

      return null;
    } catch (err) {
      console.error('[useSecurityAudit] exportAuditLog error:', err);
      toast.error('Error al exportar log');
      return null;
    }
  }, []);

  const startAutoRefresh = useCallback((context: SecurityAuditContext, intervalMs = 30000) => {
    stopAutoRefresh();
    fetchAuditEvents(context);
    autoRefreshInterval.current = setInterval(() => {
      fetchAuditEvents(context);
    }, intervalMs);
  }, [fetchAuditEvents]);

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
    events,
    summary,
    error,
    lastRefresh,
    fetchAuditEvents,
    analyzeSecurityRisks,
    exportAuditLog,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useSecurityAudit;
