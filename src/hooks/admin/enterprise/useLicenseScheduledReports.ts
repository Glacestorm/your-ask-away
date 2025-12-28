/**
 * License Scheduled Reports Hook
 * Gestión de reportes programados de licencias
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ScheduledReport {
  id: string;
  name: string;
  report_type: string;
  schedule: string;
  recipients: string[];
  filters: Record<string, unknown>;
  format: 'pdf' | 'csv' | 'excel';
  is_active: boolean;
  last_sent_at: string | null;
  next_send_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportHistory {
  id: string;
  scheduled_report_id: string | null;
  report_type: string;
  generated_by: string | null;
  recipients: string[] | null;
  file_url: string | null;
  file_size_bytes: number | null;
  status: 'pending' | 'generating' | 'sent' | 'failed';
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreateScheduledReportParams {
  name: string;
  report_type: string;
  schedule: string;
  recipients: string[];
  filters?: Record<string, unknown>;
  format?: 'pdf' | 'csv' | 'excel';
}

export const REPORT_TYPES = [
  { value: 'license_summary', label: 'Resumen de licencias' },
  { value: 'expiration_forecast', label: 'Previsión de expiraciones' },
  { value: 'usage_analytics', label: 'Análisis de uso' },
  { value: 'device_activations', label: 'Activaciones de dispositivos' },
  { value: 'anomaly_report', label: 'Reporte de anomalías' },
  { value: 'revenue_report', label: 'Reporte de ingresos' },
  { value: 'compliance_report', label: 'Reporte de cumplimiento' },
];

export const SCHEDULE_OPTIONS = [
  { value: 'daily', label: 'Diario', cron: '0 8 * * *' },
  { value: 'weekly', label: 'Semanal (Lunes)', cron: '0 8 * * 1' },
  { value: 'biweekly', label: 'Quincenal', cron: '0 8 1,15 * *' },
  { value: 'monthly', label: 'Mensual (día 1)', cron: '0 8 1 * *' },
  { value: 'quarterly', label: 'Trimestral', cron: '0 8 1 1,4,7,10 *' },
];

export function useLicenseScheduledReports() {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [history, setHistory] = useState<ReportHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('license_scheduled_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports((data || []) as ScheduledReport[]);
    } catch (err) {
      console.error('[useLicenseScheduledReports] fetchReports error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (reportId?: string) => {
    try {
      let query = supabase
        .from('license_report_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (reportId) {
        query = query.eq('scheduled_report_id', reportId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setHistory((data || []) as ReportHistory[]);
    } catch (err) {
      console.error('[useLicenseScheduledReports] fetchHistory error:', err);
    }
  }, []);

  const createReport = useCallback(async (params: CreateScheduledReportParams) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const schedule = SCHEDULE_OPTIONS.find(s => s.value === params.schedule);
      const nextSendDate = calculateNextSendDate(schedule?.value || 'daily');

      const { data, error } = await supabase
        .from('license_scheduled_reports')
        .insert([{
          name: params.name,
          report_type: params.report_type,
          schedule: params.schedule,
          recipients: params.recipients,
          filters: (params.filters || {}) as unknown as null,
          format: params.format || 'pdf',
          is_active: true,
          next_send_at: nextSendDate.toISOString(),
          created_by: userData?.user?.id || null,
        }])
        .select()
        .single();

      if (error) throw error;

      setReports(prev => [data as ScheduledReport, ...prev]);
      toast.success('Reporte programado creado');
      return data as ScheduledReport;
    } catch (err) {
      console.error('[useLicenseScheduledReports] createReport error:', err);
      toast.error('Error al crear reporte programado');
      return null;
    }
  }, []);

  const updateReport = useCallback(async (id: string, updates: Partial<CreateScheduledReportParams & { is_active: boolean }>) => {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
        filters: updates.filters ? (updates.filters as unknown as null) : undefined,
      };
      const { error } = await supabase
        .from('license_scheduled_reports')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setReports(prev => prev.map(r => 
        r.id === id ? { ...r, ...updates } as ScheduledReport : r
      ));
      toast.success('Reporte actualizado');
      return true;
    } catch (err) {
      console.error('[useLicenseScheduledReports] updateReport error:', err);
      toast.error('Error al actualizar reporte');
      return false;
    }
  }, []);

  const deleteReport = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('license_scheduled_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReports(prev => prev.filter(r => r.id !== id));
      toast.success('Reporte eliminado');
      return true;
    } catch (err) {
      console.error('[useLicenseScheduledReports] deleteReport error:', err);
      toast.error('Error al eliminar reporte');
      return false;
    }
  }, []);

  const runNow = useCallback(async (report: ScheduledReport) => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      // Create history entry
      const { data: historyEntry, error: historyError } = await supabase
        .from('license_report_history')
        .insert([{
          scheduled_report_id: report.id,
          report_type: report.report_type,
          generated_by: userData?.user?.id || null,
          recipients: report.recipients,
          status: 'generating',
        }])
        .select()
        .single();

      if (historyError) throw historyError;

      // Simulate report generation (would call edge function in real implementation)
      setTimeout(async () => {
        await supabase
          .from('license_report_history')
          .update({ status: 'sent' })
          .eq('id', historyEntry.id);
        
        await supabase
          .from('license_scheduled_reports')
          .update({ last_sent_at: new Date().toISOString() })
          .eq('id', report.id);
      }, 2000);

      toast.success('Reporte en generación');
      return true;
    } catch (err) {
      console.error('[useLicenseScheduledReports] runNow error:', err);
      toast.error('Error al ejecutar reporte');
      return false;
    }
  }, []);

  useEffect(() => {
    fetchReports();
    fetchHistory();
  }, [fetchReports, fetchHistory]);

  return {
    reports,
    history,
    loading,
    fetchReports,
    fetchHistory,
    createReport,
    updateReport,
    deleteReport,
    runNow,
  };
}

function calculateNextSendDate(schedule: string): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(8, 0, 0, 0);

  switch (schedule) {
    case 'daily':
      if (now.getHours() >= 8) next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
      next.setDate(next.getDate() + daysUntilMonday);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      break;
    default:
      next.setDate(next.getDate() + 1);
  }

  return next;
}

export default useLicenseScheduledReports;
