/**
 * useLowCodeReports - KB 2.0 Migration
 * Low-code report management with state machine
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LowCodeReport, ReportColumn, ReportFilter, ReportGrouping, ReportSorting, ChartConfig } from '@/components/lowcode/types';
import { toast } from 'sonner';
import { KBStatus, KBError, parseError, collectTelemetry } from '@/hooks/core';

export function useLowCodeReports(moduleId?: string) {
  const queryClient = useQueryClient();
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reportsQuery = useQuery({
    queryKey: ['lowcode-reports', moduleId],
    queryFn: async () => {
      const startTime = Date.now();
      setStatus('loading');
      
      let query = supabase
        .from('lowcode_report_definitions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (moduleId) {
        query = query.eq('module_id', moduleId);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        setStatus('error');
        throw fetchError;
      }
      
      setStatus('success');
      setLastRefresh(new Date());
      collectTelemetry('useLowCodeReports', 'fetchReports', 'success', Date.now() - startTime);
      
      return data.map(report => ({
        id: report.id,
        report_key: report.report_key,
        report_name: report.report_name,
        description: report.description || '',
        module_id: report.module_id || undefined,
        data_source: (report.data_source as unknown as { table?: string })?.table || 'companies',
        columns: (report.columns as unknown as ReportColumn[]) || [],
        filters: (report.filters as unknown as ReportFilter[]) || [],
        grouping: (report.grouping as unknown as ReportGrouping[]) || [],
        sorting: (report.sorting as unknown as ReportSorting[]) || [],
        chart_config: (report.visualizations as unknown as ChartConfig) || undefined,
        is_public: false,
        created_by: report.created_by || undefined,
        created_at: report.created_at || undefined,
        updated_at: report.updated_at || undefined,
      })) as LowCodeReport[];
    },
  });

  const createReport = useMutation({
    mutationFn: async (report: Partial<LowCodeReport>) => {
      const startTime = Date.now();
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error: insertError } = await supabase
        .from('lowcode_report_definitions')
        .insert({
          report_name: report.report_name || 'Nuevo Reporte',
          report_key: report.report_key || `report_${Date.now()}`,
          description: report.description,
          module_id: report.module_id,
          data_source: JSON.parse(JSON.stringify({ table: report.data_source || 'companies' })),
          columns: JSON.parse(JSON.stringify(report.columns || [])),
          filters: JSON.parse(JSON.stringify(report.filters || [])),
          grouping: JSON.parse(JSON.stringify(report.grouping || [])),
          sorting: JSON.parse(JSON.stringify(report.sorting || [])),
          visualizations: report.chart_config ? JSON.parse(JSON.stringify(report.chart_config)) : null,
          status: report.is_public ? 'published' : 'draft',
          created_by: user.user?.id,
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      collectTelemetry('useLowCodeReports', 'createReport', 'success', Date.now() - startTime);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-reports'] });
      toast.success('Reporte creado correctamente');
    },
    onError: (err: Error) => {
      const kbError = parseError(err);
      setError(kbError);
      toast.error('Error al crear reporte: ' + err.message);
    },
  });

  const updateReport = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LowCodeReport> & { id: string }) => {
      const startTime = Date.now();
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.report_name) updateData.report_name = updates.report_name;
      if (updates.report_key) updateData.report_key = updates.report_key;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.data_source) updateData.data_source = JSON.parse(JSON.stringify({ table: updates.data_source }));
      if (updates.columns) updateData.columns = JSON.parse(JSON.stringify(updates.columns));
      if (updates.filters) updateData.filters = JSON.parse(JSON.stringify(updates.filters));
      if (updates.grouping) updateData.grouping = JSON.parse(JSON.stringify(updates.grouping));
      if (updates.sorting) updateData.sorting = JSON.parse(JSON.stringify(updates.sorting));
      if (updates.chart_config !== undefined) updateData.visualizations = updates.chart_config ? JSON.parse(JSON.stringify(updates.chart_config)) : null;
      if (updates.is_public !== undefined) updateData.status = updates.is_public ? 'published' : 'draft';

      const { data, error: updateError } = await supabase
        .from('lowcode_report_definitions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      collectTelemetry('useLowCodeReports', 'updateReport', 'success', Date.now() - startTime);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-reports'] });
      toast.success('Reporte actualizado');
    },
    onError: (err: Error) => {
      const kbError = parseError(err);
      setError(kbError);
      toast.error('Error al actualizar reporte: ' + err.message);
    },
  });

  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const startTime = Date.now();
      const { error: deleteError } = await supabase
        .from('lowcode_report_definitions')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      collectTelemetry('useLowCodeReports', 'deleteReport', 'success', Date.now() - startTime);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-reports'] });
      toast.success('Reporte eliminado');
    },
    onError: (err: Error) => {
      const kbError = parseError(err);
      setError(kbError);
      toast.error('Error al eliminar reporte: ' + err.message);
    },
  });

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoading = reportsQuery.isLoading;
  const isSuccess = status === 'success';
  const isError = status === 'error' || !!reportsQuery.error;

  return {
    reports: reportsQuery.data || [],
    isLoading,
    error: error || (reportsQuery.error ? parseError(reportsQuery.error) : null),
    createReport,
    updateReport,
    deleteReport,
    // === KB 2.0 ===
    status,
    isIdle,
    isSuccess,
    isError,
    lastRefresh,
    clearError,
  };
}
