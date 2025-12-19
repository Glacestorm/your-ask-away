import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LowCodeReport } from '@/components/lowcode/types';
import { toast } from 'sonner';

export function useLowCodeReports(moduleId?: string) {
  const queryClient = useQueryClient();

  const reportsQuery = useQuery({
    queryKey: ['lowcode-reports', moduleId],
    queryFn: async () => {
      let query = supabase
        .from('lowcode_report_definitions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (moduleId) {
        query = query.eq('module_id', moduleId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return data.map(report => ({
        ...report,
        columns: (report.columns as unknown as LowCodeReport['columns']) || [],
        filters: (report.filters as unknown as LowCodeReport['filters']) || [],
        grouping: (report.grouping as unknown as LowCodeReport['grouping']) || [],
        sorting: (report.sorting as unknown as LowCodeReport['sorting']) || [],
        chart_config: (report.chart_config as unknown as LowCodeReport['chart_config']) || undefined,
      })) as LowCodeReport[];
    },
  });

  const createReport = useMutation({
    mutationFn: async (report: Partial<LowCodeReport>) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('lowcode_report_definitions')
        .insert({
          report_name: report.report_name || 'Nuevo Reporte',
          report_key: report.report_key || `report_${Date.now()}`,
          description: report.description,
          module_id: report.module_id,
          data_source: report.data_source || 'companies',
          columns: JSON.parse(JSON.stringify(report.columns || [])),
          filters: JSON.parse(JSON.stringify(report.filters || [])),
          grouping: JSON.parse(JSON.stringify(report.grouping || [])),
          sorting: JSON.parse(JSON.stringify(report.sorting || [])),
          chart_config: report.chart_config ? JSON.parse(JSON.stringify(report.chart_config)) : null,
          is_public: report.is_public ?? false,
          created_by: user.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-reports'] });
      toast.success('Reporte creado correctamente');
    },
    onError: (error) => {
      toast.error('Error al crear reporte: ' + error.message);
    },
  });

  const updateReport = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LowCodeReport> & { id: string }) => {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.report_name) updateData.report_name = updates.report_name;
      if (updates.report_key) updateData.report_key = updates.report_key;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.data_source) updateData.data_source = updates.data_source;
      if (updates.columns) updateData.columns = JSON.parse(JSON.stringify(updates.columns));
      if (updates.filters) updateData.filters = JSON.parse(JSON.stringify(updates.filters));
      if (updates.grouping) updateData.grouping = JSON.parse(JSON.stringify(updates.grouping));
      if (updates.sorting) updateData.sorting = JSON.parse(JSON.stringify(updates.sorting));
      if (updates.chart_config !== undefined) updateData.chart_config = updates.chart_config ? JSON.parse(JSON.stringify(updates.chart_config)) : null;
      if (updates.is_public !== undefined) updateData.is_public = updates.is_public;

      const { data, error } = await supabase
        .from('lowcode_report_definitions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-reports'] });
      toast.success('Reporte actualizado');
    },
    onError: (error) => {
      toast.error('Error al actualizar reporte: ' + error.message);
    },
  });

  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lowcode_report_definitions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-reports'] });
      toast.success('Reporte eliminado');
    },
    onError: (error) => {
      toast.error('Error al eliminar reporte: ' + error.message);
    },
  });

  return {
    reports: reportsQuery.data || [],
    isLoading: reportsQuery.isLoading,
    error: reportsQuery.error,
    createReport,
    updateReport,
    deleteReport,
  };
}
