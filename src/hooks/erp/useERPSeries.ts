/**
 * Hook para gestión de series documentales
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ERPSeries, CreateSeriesForm } from '@/types/erp';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';

export function useERPSeries() {
  const { currentCompany, hasPermission } = useERPContext();
  const [isLoading, setIsLoading] = useState(false);
  const [series, setSeries] = useState<ERPSeries[]>([]);

  // Cargar series
  const fetchSeries = useCallback(async (module?: string) => {
    if (!currentCompany?.id) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('erp_series')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('module')
        .order('code');

      if (module) {
        query = query.eq('module', module);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSeries((data || []) as ERPSeries[]);
    } catch (err) {
      console.error('[useERPSeries] fetchSeries error:', err);
      toast.error('Error cargando series');
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  // Crear serie
  const createSeries = useCallback(async (form: CreateSeriesForm): Promise<ERPSeries | null> => {
    if (!currentCompany?.id) return null;
    if (!hasPermission('config.write')) {
      toast.error('Sin permisos');
      return null;
    }

    setIsLoading(true);
    try {
      // Si es default, quitar default de otras series del mismo módulo/tipo
      if (form.is_default) {
        await supabase
          .from('erp_series')
          .update({ is_default: false })
          .eq('company_id', currentCompany.id)
          .eq('module', form.module)
          .eq('document_type', form.document_type);
      }

      const { data, error } = await supabase
        .from('erp_series')
        .insert([{
          company_id: currentCompany.id,
          module: form.module,
          document_type: form.document_type,
          code: form.code,
          name: form.name,
          prefix: form.prefix || '',
          suffix: form.suffix || '',
          padding: form.padding || 6,
          reset_annually: form.reset_annually ?? true,
          is_default: form.is_default ?? false,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Serie creada');
      await fetchSeries();
      return data as ERPSeries;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creando serie';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id, hasPermission, fetchSeries]);

  // Actualizar serie
  const updateSeries = useCallback(async (
    seriesId: string, 
    updates: Partial<CreateSeriesForm>
  ): Promise<boolean> => {
    if (!hasPermission('config.write')) {
      toast.error('Sin permisos');
      return false;
    }

    try {
      const { error } = await supabase
        .from('erp_series')
        .update(updates)
        .eq('id', seriesId);

      if (error) throw error;

      toast.success('Serie actualizada');
      await fetchSeries();
      return true;
    } catch (err) {
      toast.error('Error actualizando serie');
      return false;
    }
  }, [hasPermission, fetchSeries]);

  // Obtener siguiente número
  const getNextNumber = useCallback(async (seriesId: string): Promise<string | null> => {
    if (!currentCompany?.id) return null;

    try {
      const { data, error } = await supabase
        .rpc('erp_get_next_document_number', {
          p_company_id: currentCompany.id,
          p_series_id: seriesId,
        });

      if (error) throw error;
      return data as string;
    } catch (err) {
      console.error('[useERPSeries] getNextNumber error:', err);
      toast.error('Error obteniendo número');
      return null;
    }
  }, [currentCompany?.id]);

  // Obtener serie por defecto
  const getDefaultSeries = useCallback((module: string, documentType: string): ERPSeries | undefined => {
    return series.find(s => 
      s.module === module && 
      s.document_type === documentType && 
      s.is_default && 
      s.is_active
    );
  }, [series]);

  return {
    series,
    isLoading,
    fetchSeries,
    createSeries,
    updateSeries,
    getNextNumber,
    getDefaultSeries,
  };
}

export default useERPSeries;
