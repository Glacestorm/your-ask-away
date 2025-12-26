// Support Report Generator Hook - Phase 6B: Reports and Export
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface MetricsReport {
  report_id: string;
  title: string;
  generated_at: string;
  period: { start: string; end: string };
  summary: {
    total_sessions: number;
    avg_resolution_time_minutes: number;
    satisfaction_score: number;
    first_contact_resolution_rate: number;
  };
  metrics: Array<{
    name: string;
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    change_percentage: number;
    target: number;
    status: 'on_track' | 'at_risk' | 'off_track';
  }>;
  charts_data: {
    sessions_by_day: Array<{ date: string; count: number }>;
    resolution_times: Array<{ category: string; avg_time: number }>;
    agent_performance: Array<{ agent: string; score: number; sessions: number }>;
  };
  insights: string[];
  recommendations: string[];
}

export interface SessionReport {
  report_id: string;
  title: string;
  generated_at: string;
  period: { start: string; end: string };
  sessions: {
    total: number;
    completed: number;
    cancelled: number;
    in_progress: number;
    avg_duration_minutes: number;
    peak_hours: string[];
  };
  by_type: Array<{ type: string; count: number; percentage: number }>;
  by_agent: Array<{ agent: string; sessions: number; avg_rating: number; resolution_rate: number }>;
  issues_resolved: Array<{ category: string; count: number; percentage: number }>;
  satisfaction: {
    avg_score: number;
    promoters: number;
    passives: number;
    detractors: number;
    nps: number;
  };
}

export interface PerformanceReport {
  report_id: string;
  title: string;
  generated_at: string;
  system_health: {
    overall_score: number;
    uptime_percentage: number;
    avg_response_time_ms: number;
    error_rate: number;
  };
  resources: {
    cpu_avg: number;
    memory_avg: number;
    bandwidth_used_gb: number;
    storage_used_percentage: number;
  };
  performance_trends: Array<{ date: string; latency: number; errors: number }>;
  bottlenecks: Array<{ component: string; severity: string; recommendation: string }>;
  recommendations: string[];
}

export interface ExportResult {
  export_id: string;
  requested_at: string;
  format: string;
  status: string;
  download_url: string;
  expires_at: string;
  rows_count: number;
  file_size_kb: number;
}

export interface ReportSchedule {
  schedule_id: string;
  report_type: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  next_run: string;
  status: string;
  format: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  default_format: string;
}

// === HOOK ===
export function useSupportReportGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [metricsReport, setMetricsReport] = useState<MetricsReport | null>(null);
  const [sessionReport, setSessionReport] = useState<SessionReport | null>(null);
  const [performanceReport, setPerformanceReport] = useState<PerformanceReport | null>(null);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);

  // === GENERATE METRICS REPORT ===
  const generateMetricsReport = useCallback(async (params?: {
    start_date?: string;
    end_date?: string;
    metrics?: string[];
    format?: 'pdf' | 'excel' | 'csv' | 'json';
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-report-generator', {
        body: { action: 'generate_metrics_report', params }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setMetricsReport(data.data);
        toast.success('Informe de métricas generado');
        return data.data;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generating metrics report';
      setError(message);
      toast.error('Error al generar informe de métricas');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GENERATE SESSION REPORT ===
  const generateSessionReport = useCallback(async (params?: {
    start_date?: string;
    end_date?: string;
    format?: 'pdf' | 'excel' | 'csv' | 'json';
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-report-generator', {
        body: { action: 'generate_session_report', params }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setSessionReport(data.data);
        toast.success('Informe de sesiones generado');
        return data.data;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generating session report';
      setError(message);
      toast.error('Error al generar informe de sesiones');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GENERATE PERFORMANCE REPORT ===
  const generatePerformanceReport = useCallback(async (params?: {
    start_date?: string;
    end_date?: string;
    format?: 'pdf' | 'excel' | 'csv' | 'json';
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-report-generator', {
        body: { action: 'generate_performance_report', params }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setPerformanceReport(data.data);
        toast.success('Informe de rendimiento generado');
        return data.data;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generating performance report';
      setError(message);
      toast.error('Error al generar informe de rendimiento');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === EXPORT DATA ===
  const exportData = useCallback(async (params: {
    format: 'pdf' | 'excel' | 'csv' | 'json';
    filters?: Record<string, unknown>;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-report-generator', {
        body: { action: 'export_data', params }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setExportResult(data.data);
        toast.success(`Exportación ${params.format.toUpperCase()} lista`);
        return data.data;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error exporting data';
      setError(message);
      toast.error('Error al exportar datos');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === SCHEDULE REPORT ===
  const scheduleReport = useCallback(async (params: {
    report_type: string;
    format?: 'pdf' | 'excel' | 'csv' | 'json';
    schedule: {
      frequency: 'daily' | 'weekly' | 'monthly';
      recipients: string[];
      time: string;
    };
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-report-generator', {
        body: { action: 'schedule_report', params }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setSchedules(prev => [...prev, data.data]);
        toast.success('Informe programado correctamente');
        return data.data;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error scheduling report';
      setError(message);
      toast.error('Error al programar informe');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET TEMPLATES ===
  const getTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-report-generator', {
        body: { action: 'get_templates' }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setTemplates(data.data.templates || []);
        return data.data.templates;
      }

      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching templates';
      setError(message);
      toast.error('Error al obtener plantillas');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CLEAR STATE ===
  const clearError = useCallback(() => setError(null), []);
  
  const reset = useCallback(() => {
    setMetricsReport(null);
    setSessionReport(null);
    setPerformanceReport(null);
    setExportResult(null);
    setSchedules([]);
    setTemplates([]);
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    metricsReport,
    sessionReport,
    performanceReport,
    exportResult,
    schedules,
    templates,
    error,
    // Actions
    generateMetricsReport,
    generateSessionReport,
    generatePerformanceReport,
    exportData,
    scheduleReport,
    getTemplates,
    clearError,
    reset
  };
}

export default useSupportReportGenerator;
