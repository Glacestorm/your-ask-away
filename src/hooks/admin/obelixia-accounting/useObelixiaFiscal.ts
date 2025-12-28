/**
 * useObelixiaFiscal Hook
 * Declaraciones fiscales: IVA, IRPF, Impuesto Sociedades
 * Fase 11.2 - Enterprise SaaS 2025-2026
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface TaxDeclaration {
  id: string;
  declaration_type: 'vat_303' | 'vat_390' | 'irpf_111' | 'irpf_190' | 'is_200' | 'modelo_347' | 'modelo_349';
  fiscal_year: number;
  period: string; // Q1, Q2, Q3, Q4 or 'annual'
  period_start: string;
  period_end: string;
  status: 'draft' | 'calculated' | 'reviewed' | 'submitted' | 'paid';
  due_date: string;
  amount_due: number;
  amount_to_compensate: number;
  net_amount: number;
  submission_date?: string;
  submission_reference?: string;
  calculation_details: Record<string, unknown>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VATSummary {
  base_imponible_21: number;
  cuota_21: number;
  base_imponible_10: number;
  cuota_10: number;
  base_imponible_4: number;
  cuota_4: number;
  total_cuotas_devengadas: number;
  iva_soportado_deducible: number;
  resultado: number;
  compensacion_periodos_anteriores: number;
  resultado_liquidacion: number;
}

export interface TaxCalendar {
  date: string;
  declaration_type: string;
  description: string;
  due_date: string;
  days_remaining: number;
  status: 'pending' | 'upcoming' | 'overdue' | 'completed';
  estimated_amount?: number;
}

export interface FiscalPeriodClose {
  id: string;
  fiscal_year: number;
  period_number: number;
  period_name: string;
  close_date?: string;
  status: 'open' | 'closing' | 'closed' | 'locked';
  closed_by?: string;
  regularization_entry_id?: string;
  notes?: string;
}

// === HOOK ===
export function useObelixiaFiscal() {
  const [isLoading, setIsLoading] = useState(false);
  const [declarations, setDeclarations] = useState<TaxDeclaration[]>([]);
  const [currentDeclaration, setCurrentDeclaration] = useState<TaxDeclaration | null>(null);
  const [vatSummary, setVatSummary] = useState<VATSummary | null>(null);
  const [taxCalendar, setTaxCalendar] = useState<TaxCalendar[]>([]);
  const [periodCloses, setPeriodCloses] = useState<FiscalPeriodClose[]>([]);
  const [error, setError] = useState<string | null>(null);

  // === FETCH DECLARATIONS ===
  const fetchDeclarations = useCallback(async (fiscalYear?: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'get_tax_declarations',
            params: { fiscal_year: fiscalYear || new Date().getFullYear() }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setDeclarations(data.data.declarations || []);
        setTaxCalendar(data.data.calendar || []);
        return data.data;
      }

      throw new Error(data?.error || 'Error al obtener declaraciones');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useObelixiaFiscal] fetchDeclarations error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CALCULATE VAT (Modelo 303) ===
  const calculateVAT = useCallback(async (
    period: 'Q1' | 'Q2' | 'Q3' | 'Q4',
    fiscalYear?: number
  ) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'calculate_vat_303',
            params: {
              period,
              fiscal_year: fiscalYear || new Date().getFullYear()
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setVatSummary(data.data.summary as VATSummary);
        if (data.data.declaration) {
          setCurrentDeclaration(data.data.declaration);
        }
        toast.success('IVA calculado correctamente');
        return data.data;
      }

      throw new Error(data?.error || 'Error al calcular IVA');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      console.error('[useObelixiaFiscal] calculateVAT error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CALCULATE IRPF (Modelo 111) ===
  const calculateIRPF = useCallback(async (
    period: 'Q1' | 'Q2' | 'Q3' | 'Q4',
    fiscalYear?: number
  ) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'calculate_irpf_111',
            params: {
              period,
              fiscal_year: fiscalYear || new Date().getFullYear()
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        if (data.data.declaration) {
          setCurrentDeclaration(data.data.declaration);
        }
        toast.success('IRPF calculado correctamente');
        return data.data;
      }

      throw new Error(data?.error || 'Error al calcular IRPF');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      console.error('[useObelixiaFiscal] calculateIRPF error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CALCULATE CORPORATE TAX (IS 200) ===
  const calculateCorporateTax = useCallback(async (fiscalYear?: number) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'calculate_is_200',
            params: {
              fiscal_year: fiscalYear || new Date().getFullYear() - 1
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        if (data.data.declaration) {
          setCurrentDeclaration(data.data.declaration);
        }
        toast.success('Impuesto de Sociedades calculado');
        return data.data;
      }

      throw new Error(data?.error || 'Error al calcular IS');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      console.error('[useObelixiaFiscal] calculateCorporateTax error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === SUBMIT DECLARATION ===
  const submitDeclaration = useCallback(async (
    declarationId: string,
    submissionReference?: string
  ) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'submit_declaration',
            params: {
              declaration_id: declarationId,
              submission_reference: submissionReference,
              submission_date: new Date().toISOString()
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Declaración marcada como presentada');
        await fetchDeclarations();
        return true;
      }

      throw new Error(data?.error || 'Error al registrar presentación');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchDeclarations]);

  // === GET TAX CALENDAR ===
  const getTaxCalendar = useCallback(async (fiscalYear?: number) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'get_tax_calendar',
            params: { fiscal_year: fiscalYear || new Date().getFullYear() }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setTaxCalendar(data.data.calendar || []);
        return data.data.calendar;
      }

      return [];
    } catch (err) {
      console.error('[useObelixiaFiscal] getTaxCalendar error:', err);
      return [];
    }
  }, []);

  // === CLOSE FISCAL PERIOD ===
  const closePeriod = useCallback(async (
    periodId: string,
    generateRegularization: boolean = true
  ) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'close_fiscal_period',
            params: {
              period_id: periodId,
              generate_regularization: generateRegularization
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Período cerrado correctamente');
        return data.data;
      }

      throw new Error(data?.error || 'Error al cerrar período');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CLOSE FISCAL YEAR ===
  const closeFiscalYear = useCallback(async (
    fiscalYear: number,
    options?: {
      generate_closing_entries: boolean;
      distribute_result: boolean;
      result_distribution?: Record<string, number>;
    }
  ) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'close_fiscal_year',
            params: {
              fiscal_year: fiscalYear,
              ...options
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(`Ejercicio ${fiscalYear} cerrado correctamente`);
        return data.data;
      }

      throw new Error(data?.error || 'Error al cerrar ejercicio');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GENERATE CLOSING ENTRIES ===
  const generateClosingEntries = useCallback(async (fiscalYear: number) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'generate_closing_entries',
            params: { fiscal_year: fiscalYear }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Asientos de cierre generados');
        return data.data;
      }

      throw new Error(data?.error || 'Error al generar asientos de cierre');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    isLoading,
    declarations,
    currentDeclaration,
    vatSummary,
    taxCalendar,
    periodCloses,
    error,
    // Actions
    fetchDeclarations,
    calculateVAT,
    calculateIRPF,
    calculateCorporateTax,
    submitDeclaration,
    getTaxCalendar,
    closePeriod,
    closeFiscalYear,
    generateClosingEntries,
    setCurrentDeclaration
  };
}

export default useObelixiaFiscal;
