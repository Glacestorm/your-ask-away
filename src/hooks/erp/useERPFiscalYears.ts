/**
 * Hook para gestión de ejercicios fiscales y periodos
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ERPFiscalYear, ERPPeriod, CreateFiscalYearForm } from '@/types/erp';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';

export function useERPFiscalYears() {
  const { currentCompany, hasPermission } = useERPContext();
  const [isLoading, setIsLoading] = useState(false);
  const [fiscalYears, setFiscalYears] = useState<ERPFiscalYear[]>([]);
  const [periods, setPeriods] = useState<ERPPeriod[]>([]);

  // Cargar ejercicios fiscales
  const fetchFiscalYears = useCallback(async () => {
    if (!currentCompany?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('erp_fiscal_years')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setFiscalYears((data || []) as ERPFiscalYear[]);
    } catch (err) {
      console.error('[useERPFiscalYears] fetchFiscalYears error:', err);
      toast.error('Error cargando ejercicios fiscales');
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  // Cargar periodos de un ejercicio
  const fetchPeriods = useCallback(async (fiscalYearId: string) => {
    if (!currentCompany?.id) return;

    try {
      const { data, error } = await supabase
        .from('erp_periods')
        .select('*')
        .eq('fiscal_year_id', fiscalYearId)
        .order('month');

      if (error) throw error;
      setPeriods((data || []) as ERPPeriod[]);
    } catch (err) {
      console.error('[useERPFiscalYears] fetchPeriods error:', err);
    }
  }, [currentCompany?.id]);

  // Crear ejercicio fiscal con periodos
  const createFiscalYear = useCallback(async (form: CreateFiscalYearForm): Promise<ERPFiscalYear | null> => {
    if (!currentCompany?.id) return null;
    if (!hasPermission('config.write')) {
      toast.error('Sin permisos');
      return null;
    }

    setIsLoading(true);
    try {
      // Crear ejercicio
      const { data: fy, error: fyError } = await supabase
        .from('erp_fiscal_years')
        .insert([{
          company_id: currentCompany.id,
          name: form.name,
          start_date: form.start_date,
          end_date: form.end_date,
        }])
        .select()
        .single();

      if (fyError) throw fyError;

      // Crear 12 periodos mensuales
      const startDate = new Date(form.start_date);
      const periodsToCreate = [];

      for (let i = 0; i < 12; i++) {
        const periodStart = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const periodEnd = new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, 0);
        
        periodsToCreate.push({
          fiscal_year_id: fy.id,
          company_id: currentCompany.id,
          month: i + 1,
          name: periodStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
          start_date: periodStart.toISOString().split('T')[0],
          end_date: periodEnd.toISOString().split('T')[0],
        });
      }

      const { error: pError } = await supabase
        .from('erp_periods')
        .insert(periodsToCreate);

      if (pError) console.warn('Error creando periodos:', pError);

      toast.success('Ejercicio fiscal creado con 12 periodos');
      await fetchFiscalYears();
      return fy as ERPFiscalYear;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creando ejercicio';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id, hasPermission, fetchFiscalYears]);

  // Cerrar ejercicio
  const closeFiscalYear = useCallback(async (fiscalYearId: string): Promise<boolean> => {
    if (!hasPermission('accounting.close')) {
      toast.error('Sin permisos para cerrar ejercicios');
      return false;
    }

    setIsLoading(true);
    try {
      // Cerrar todos los periodos
      await supabase
        .from('erp_periods')
        .update({ is_closed: true, closed_at: new Date().toISOString() })
        .eq('fiscal_year_id', fiscalYearId);

      // Cerrar ejercicio
      const { error } = await supabase
        .from('erp_fiscal_years')
        .update({ 
          is_closed: true, 
          closed_at: new Date().toISOString() 
        })
        .eq('id', fiscalYearId);

      if (error) throw error;

      toast.success('Ejercicio cerrado');
      await fetchFiscalYears();
      return true;
    } catch (err) {
      toast.error('Error cerrando ejercicio');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission, fetchFiscalYears]);

  // Cerrar periodo
  const closePeriod = useCallback(async (periodId: string): Promise<boolean> => {
    if (!hasPermission('accounting.close')) {
      toast.error('Sin permisos para cerrar periodos');
      return false;
    }

    try {
      const { error } = await supabase
        .from('erp_periods')
        .update({ 
          is_closed: true, 
          closed_at: new Date().toISOString() 
        })
        .eq('id', periodId);

      if (error) throw error;

      toast.success('Periodo cerrado');
      return true;
    } catch (err) {
      toast.error('Error cerrando periodo');
      return false;
    }
  }, [hasPermission]);

  return {
    fiscalYears,
    periods,
    isLoading,
    fetchFiscalYears,
    fetchPeriods,
    createFiscalYear,
    closeFiscalYear,
    closePeriod,
  };
}

export default useERPFiscalYears;
