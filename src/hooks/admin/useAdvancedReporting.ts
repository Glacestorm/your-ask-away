import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface ReportSection {
  id: string;
  title: string;
  content: string;
  charts?: Array<{
    type: 'bar' | 'line' | 'pie' | 'area' | 'metric';
    title: string;
    data: Record<string, unknown>[];
    config: Record<string, unknown>;
  }>;
  insights: string[];
  recommendations?: string[];
}

export interface GeneratedReport {
  id: string;
  title: string;
  type: 'executive' | 'operational' | 'financial' | 'performance' | 'custom';
  period: { start: string; end: string };
  sections: ReportSection[];
  executive_summary: string;
  key_metrics: Array<{ label: string; value: string | number; change?: number }>;
  generated_at: string;
  format?: 'html' | 'pdf' | 'excel';
}

export interface ReportTemplate {
  id: string;
  name: string;
  type: string;
  sections: string[];
  default_period: string;
  ai_enhancements: boolean;
}

export interface ReportSchedule {
  id: string;
  template_id: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  next_run: string;
  enabled: boolean;
}

// === HOOK ===
export function useAdvancedReporting() {
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // === GENERATE REPORT ===
  const generateReport = useCallback(async (
    templateId: string,
    period: { start: string; end: string },
    options?: { includeAIInsights?: boolean; format?: string }
  ): Promise<GeneratedReport | null> => {
    setIsLoading(true);
    setProgress(0);
    setError(null);

    try {
      setProgress(20);
      
      const { data, error: fnError } = await supabase.functions.invoke('advanced-reporting', {
        body: { action: 'generate', templateId, period, options }
      });

      setProgress(80);

      if (fnError) throw fnError;

      if (data?.success && data?.report) {
        setReport(data.report);
        setProgress(100);
        toast.success('Reporte generado');
        return data.report;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generating report';
      setError(message);
      console.error('[useAdvancedReporting] generateReport error:', err);
      toast.error('Error al generar reporte');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GENERATE INSIGHTS ===
  const generateInsights = useCallback(async (reportId: string): Promise<string[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('advanced-reporting', {
        body: { action: 'generate_insights', reportId }
      });

      if (fnError) throw fnError;

      return data?.insights || [];
    } catch (err) {
      console.error('[useAdvancedReporting] generateInsights error:', err);
      return [];
    }
  }, []);

  // === FETCH TEMPLATES ===
  const fetchTemplates = useCallback(async (): Promise<ReportTemplate[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('advanced-reporting', {
        body: { action: 'list_templates' }
      });

      if (fnError) throw fnError;

      if (data?.templates) {
        setTemplates(data.templates);
        return data.templates;
      }

      return [];
    } catch (err) {
      console.error('[useAdvancedReporting] fetchTemplates error:', err);
      return [];
    }
  }, []);

  // === FETCH SCHEDULES ===
  const fetchSchedules = useCallback(async (): Promise<ReportSchedule[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('advanced-reporting', {
        body: { action: 'list_schedules' }
      });

      if (fnError) throw fnError;

      if (data?.schedules) {
        setSchedules(data.schedules);
        return data.schedules;
      }

      return [];
    } catch (err) {
      console.error('[useAdvancedReporting] fetchSchedules error:', err);
      return [];
    }
  }, []);

  // === CREATE SCHEDULE ===
  const createSchedule = useCallback(async (schedule: Partial<ReportSchedule>): Promise<ReportSchedule | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('advanced-reporting', {
        body: { action: 'create_schedule', schedule }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.schedule) {
        setSchedules(prev => [...prev, data.schedule]);
        toast.success('Programación creada');
        return data.schedule;
      }

      return null;
    } catch (err) {
      console.error('[useAdvancedReporting] createSchedule error:', err);
      toast.error('Error al crear programación');
      return null;
    }
  }, []);

  // === EXPORT REPORT ===
  const exportReport = useCallback(async (
    reportId: string,
    format: 'pdf' | 'excel' | 'html'
  ): Promise<string | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('advanced-reporting', {
        body: { action: 'export', reportId, format }
      });

      if (fnError) throw fnError;

      if (data?.downloadUrl) {
        toast.success(`Reporte exportado como ${format.toUpperCase()}`);
        return data.downloadUrl;
      }

      return null;
    } catch (err) {
      console.error('[useAdvancedReporting] exportReport error:', err);
      toast.error('Error al exportar reporte');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === ASK ABOUT REPORT ===
  const askAboutReport = useCallback(async (reportId: string, question: string): Promise<string | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('advanced-reporting', {
        body: { action: 'ask', reportId, question }
      });

      if (fnError) throw fnError;

      return data?.answer || null;
    } catch (err) {
      console.error('[useAdvancedReporting] askAboutReport error:', err);
      return null;
    }
  }, []);

  // === COMPARE PERIODS ===
  const comparePeriods = useCallback(async (
    templateId: string,
    period1: { start: string; end: string },
    period2: { start: string; end: string }
  ): Promise<{
    comparison: Array<{ metric: string; period1: number; period2: number; change: number }>;
    insights: string[];
  } | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('advanced-reporting', {
        body: { action: 'compare', templateId, period1, period2 }
      });

      if (fnError) throw fnError;

      return data?.comparison || null;
    } catch (err) {
      console.error('[useAdvancedReporting] comparePeriods error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    report,
    templates,
    schedules,
    isLoading,
    progress,
    error,
    generateReport,
    generateInsights,
    fetchTemplates,
    fetchSchedules,
    createSchedule,
    exportReport,
    askAboutReport,
    comparePeriods,
  };
}

export default useAdvancedReporting;
