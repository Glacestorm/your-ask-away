import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChartConfig {
  id: string;
  chart_type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'radar' | 'treemap' | 'sankey';
  title: string;
  data_source: string;
  x_axis: string;
  y_axis: string[];
  color_scheme: string;
  animations: boolean;
  responsive: boolean;
  legend_position: 'top' | 'bottom' | 'left' | 'right';
}

export interface VisualizationData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
  metadata?: Record<string, unknown>;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  schedule?: string;
  recipients?: string[];
}

export interface ReportSection {
  id: string;
  type: 'chart' | 'table' | 'text' | 'metric' | 'image';
  title: string;
  content: unknown;
  order: number;
}

export function useDataVisualization() {
  const [isLoading, setIsLoading] = useState(false);
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [visualizationData, setVisualizationData] = useState<VisualizationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = useCallback(async (chartConfig: ChartConfig) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'data-visualization',
        {
          body: {
            action: 'get_chart_data',
            config: chartConfig
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setVisualizationData(data.visualization);
        return data.visualization;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useDataVisualization] fetchChartData error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateChart = useCallback(async (
    dataSource: string,
    chartType: ChartConfig['chart_type'],
    options?: Partial<ChartConfig>
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'data-visualization',
        {
          body: {
            action: 'generate_chart',
            dataSource,
            chartType,
            options
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        return data.chart;
      }

      return null;
    } catch (err) {
      console.error('[useDataVisualization] generateChart error:', err);
      toast.error('Error al generar gráfico');
      return null;
    }
  }, []);

  const createReport = useCallback(async (template: Partial<ReportTemplate>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'data-visualization',
        {
          body: {
            action: 'create_report',
            template
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Reporte creado');
        return data.report;
      }

      return null;
    } catch (err) {
      console.error('[useDataVisualization] createReport error:', err);
      toast.error('Error al crear reporte');
      return null;
    }
  }, []);

  const exportChart = useCallback(async (
    chartId: string,
    format: 'png' | 'svg' | 'pdf'
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'data-visualization',
        {
          body: {
            action: 'export_chart',
            chartId,
            format
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Gráfico exportado');
        return data.downloadUrl;
      }

      return null;
    } catch (err) {
      console.error('[useDataVisualization] exportChart error:', err);
      toast.error('Error al exportar gráfico');
      return null;
    }
  }, []);

  const getRecommendedVisualization = useCallback(async (
    dataProfile: Record<string, unknown>
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'data-visualization',
        {
          body: {
            action: 'recommend_visualization',
            dataProfile
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        return data.recommendations;
      }

      return null;
    } catch (err) {
      console.error('[useDataVisualization] getRecommendedVisualization error:', err);
      return null;
    }
  }, []);

  return {
    isLoading,
    charts,
    visualizationData,
    error,
    fetchChartData,
    generateChart,
    createReport,
    exportChart,
    getRecommendedVisualization,
    setCharts,
  };
}

export default useDataVisualization;
