/**
 * Hook para gestión de asientos contables ERP
 * Migrado y adaptado de obelixia-accounting con soporte multi-país
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';

// === INTERFACES ===
export interface JournalEntryLine {
  id?: string;
  entry_id?: string;
  line_number: number;
  account_id: string;
  account_code?: string;
  account_name?: string;
  description?: string;
  debit_amount: number;
  credit_amount: number;
  partner_type?: 'customer' | 'supplier' | null;
  partner_id?: string | null;
  tax_id?: string | null;
  cost_center_id?: string | null;
  project_id?: string | null;
  currency_code?: string;
  currency_amount?: number;
  exchange_rate?: number;
}

export interface JournalEntry {
  id?: string;
  company_id: string;
  journal_id: string;
  journal_name?: string;
  period_id: string;
  period_name?: string;
  fiscal_year_id?: string;
  entry_number?: string;
  entry_date: string;
  reference?: string;
  description?: string;
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  is_posted: boolean;
  is_cancelled?: boolean;
  cancelled_reason?: string;
  source_document?: string;
  source_document_id?: string;
  lines?: JournalEntryLine[];
  created_at?: string;
  updated_at?: string;
}

export interface JournalEntryFilters {
  journalId?: string;
  periodId?: string;
  fiscalYearId?: string;
  isPosted?: boolean;
  isCancelled?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// === HOOK ===
export function useERPJournalEntries() {
  const { currentCompany } = useERPContext();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // === FETCH ENTRIES ===
  const fetchEntries = useCallback(async (filters: JournalEntryFilters = {}) => {
    if (!currentCompany?.id) {
      setError('No hay empresa seleccionada');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('erp_journal_entries')
        .select(`
          *,
          erp_journals!inner(name, journal_type),
          erp_periods!inner(name, start_date, end_date)
        `, { count: 'exact' })
        .eq('company_id', currentCompany.id)
        .order('entry_date', { ascending: false })
        .order('entry_number', { ascending: false });

      // Aplicar filtros
      if (filters.journalId) {
        query = query.eq('journal_id', filters.journalId);
      }
      if (filters.periodId) {
        query = query.eq('period_id', filters.periodId);
      }
      if (filters.fiscalYearId) {
        query = query.eq('fiscal_year_id', filters.fiscalYearId);
      }
      if (filters.isPosted !== undefined) {
        query = query.eq('is_posted', filters.isPosted);
      }
      if (filters.isCancelled !== undefined) {
        query = query.eq('is_cancelled', filters.isCancelled);
      }
      if (filters.dateFrom) {
        query = query.gte('entry_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('entry_date', filters.dateTo);
      }
      if (filters.search) {
        query = query.or(`description.ilike.%${filters.search}%,reference.ilike.%${filters.search}%,entry_number.ilike.%${filters.search}%`);
      }

      // Paginación
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      const mappedEntries: JournalEntry[] = (data || []).map((entry: any) => ({
        ...entry,
        journal_name: entry.erp_journals?.name,
        period_name: entry.erp_periods?.name
      }));

      setEntries(mappedEntries);
      setTotalCount(count || 0);
      return mappedEntries;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar asientos';
      setError(message);
      console.error('[useERPJournalEntries] fetchEntries error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  // === FETCH SINGLE ENTRY WITH LINES ===
  const fetchEntry = useCallback(async (entryId: string) => {
    if (!currentCompany?.id) return null;

    setIsLoading(true);
    setError(null);

    try {
      // Obtener asiento
      const { data: entry, error: entryError } = await supabase
        .from('erp_journal_entries')
        .select(`
          *,
          erp_journals(name, journal_type),
          erp_periods(name, start_date, end_date, is_closed)
        `)
        .eq('id', entryId)
        .eq('company_id', currentCompany.id)
        .single();

      if (entryError) throw entryError;

      // Obtener líneas
      const { data: lines, error: linesError } = await supabase
        .from('erp_journal_entry_lines')
        .select(`
          *,
          erp_chart_accounts(code, name)
        `)
        .eq('entry_id', entryId)
        .order('line_number');

      if (linesError) throw linesError;

      const mappedEntry: JournalEntry = {
        ...entry,
        journal_name: entry.erp_journals?.name,
        period_name: entry.erp_periods?.name,
        lines: (lines || []).map((line: any) => ({
          ...line,
          account_code: line.erp_chart_accounts?.code,
          account_name: line.erp_chart_accounts?.name
        }))
      };

      setCurrentEntry(mappedEntry);
      return mappedEntry;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar asiento';
      setError(message);
      console.error('[useERPJournalEntries] fetchEntry error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  // === CHECK PERIOD IS OPEN ===
  const checkPeriodOpen = useCallback(async (periodId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('erp_periods')
        .select('is_closed')
        .eq('id', periodId)
        .single();

      if (error) throw error;
      return !data?.is_closed;
    } catch (err) {
      console.error('[useERPJournalEntries] checkPeriodOpen error:', err);
      return false;
    }
  }, []);

  // === CREATE ENTRY ===
  const createEntry = useCallback(async (
    entry: Omit<JournalEntry, 'id' | 'entry_number' | 'created_at' | 'updated_at'>,
    lines: Omit<JournalEntryLine, 'id' | 'entry_id'>[]
  ) => {
    if (!currentCompany?.id) {
      toast.error('No hay empresa seleccionada');
      return null;
    }

    // Validar período abierto
    const isOpen = await checkPeriodOpen(entry.period_id);
    if (!isOpen) {
      toast.error('El período está cerrado. No se pueden crear asientos.');
      return null;
    }

    // Validar cuadre
    const totalDebit = lines.reduce((sum, l) => sum + (l.debit_amount || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (l.credit_amount || 0), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      toast.error('El asiento no está cuadrado');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Crear asiento
      const { data: newEntry, error: entryError } = await supabase
        .from('erp_journal_entries')
        .insert({
          company_id: currentCompany.id,
          journal_id: entry.journal_id,
          period_id: entry.period_id,
          fiscal_year_id: entry.fiscal_year_id,
          entry_date: entry.entry_date,
          reference: entry.reference,
          description: entry.description,
          total_debit: totalDebit,
          total_credit: totalCredit,
          is_balanced: true,
          is_posted: false,
          source_document: entry.source_document,
          source_document_id: entry.source_document_id
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Crear líneas
      const linesToInsert = lines.map((line, index) => ({
        entry_id: newEntry.id,
        line_number: index + 1,
        account_id: line.account_id,
        description: line.description,
        debit_amount: line.debit_amount || 0,
        credit_amount: line.credit_amount || 0,
        partner_type: line.partner_type,
        partner_id: line.partner_id,
        tax_id: line.tax_id,
        cost_center_id: line.cost_center_id,
        project_id: line.project_id,
        currency_code: line.currency_code,
        currency_amount: line.currency_amount,
        exchange_rate: line.exchange_rate
      }));

      const { error: linesError } = await supabase
        .from('erp_journal_entry_lines')
        .insert(linesToInsert);

      if (linesError) throw linesError;

      toast.success('Asiento creado correctamente');
      return newEntry;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear asiento';
      setError(message);
      toast.error(message);
      console.error('[useERPJournalEntries] createEntry error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id, checkPeriodOpen]);

  // === UPDATE ENTRY (solo borradores) ===
  const updateEntry = useCallback(async (
    entryId: string,
    entry: Partial<JournalEntry>,
    lines?: Omit<JournalEntryLine, 'entry_id'>[]
  ) => {
    if (!currentCompany?.id) {
      toast.error('No hay empresa seleccionada');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Verificar que es borrador
      const { data: existing, error: checkError } = await supabase
        .from('erp_journal_entries')
        .select('is_posted, period_id')
        .eq('id', entryId)
        .single();

      if (checkError) throw checkError;
      if (existing.is_posted) {
        toast.error('No se puede editar un asiento contabilizado');
        return null;
      }

      // Validar período abierto
      const isOpen = await checkPeriodOpen(existing.period_id);
      if (!isOpen) {
        toast.error('El período está cerrado');
        return null;
      }

      // Calcular totales si hay líneas
      let totalDebit = entry.total_debit;
      let totalCredit = entry.total_credit;

      if (lines) {
        totalDebit = lines.reduce((sum, l) => sum + (l.debit_amount || 0), 0);
        totalCredit = lines.reduce((sum, l) => sum + (l.credit_amount || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.001) {
          toast.error('El asiento no está cuadrado');
          return null;
        }
      }

      // Actualizar asiento
      const updateData: any = {
        ...entry,
        updated_at: new Date().toISOString()
      };
      if (totalDebit !== undefined) updateData.total_debit = totalDebit;
      if (totalCredit !== undefined) updateData.total_credit = totalCredit;

      const { error: updateError } = await supabase
        .from('erp_journal_entries')
        .update(updateData)
        .eq('id', entryId);

      if (updateError) throw updateError;

      // Actualizar líneas si se proporcionan
      if (lines) {
        // Eliminar líneas existentes
        await supabase
          .from('erp_journal_entry_lines')
          .delete()
          .eq('entry_id', entryId);

        // Insertar nuevas líneas
        const linesToInsert = lines.map((line, index) => ({
          entry_id: entryId,
          line_number: index + 1,
          account_id: line.account_id,
          description: line.description,
          debit_amount: line.debit_amount || 0,
          credit_amount: line.credit_amount || 0,
          partner_type: line.partner_type,
          partner_id: line.partner_id,
          tax_id: line.tax_id,
          cost_center_id: line.cost_center_id,
          project_id: line.project_id,
          currency_code: line.currency_code,
          currency_amount: line.currency_amount,
          exchange_rate: line.exchange_rate
        }));

        const { error: linesError } = await supabase
          .from('erp_journal_entry_lines')
          .insert(linesToInsert);

        if (linesError) throw linesError;
      }

      toast.success('Asiento actualizado');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar asiento';
      setError(message);
      toast.error(message);
      console.error('[useERPJournalEntries] updateEntry error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id, checkPeriodOpen]);

  // === POST ENTRY (contabilizar) ===
  const postEntry = useCallback(async (entryId: string) => {
    if (!currentCompany?.id) {
      toast.error('No hay empresa seleccionada');
      return false;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('erp_journal_entries')
        .update({
          is_posted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId)
        .eq('company_id', currentCompany.id)
        .eq('is_posted', false);

      if (error) throw error;

      toast.success('Asiento contabilizado');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al contabilizar';
      toast.error(message);
      console.error('[useERPJournalEntries] postEntry error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  // === REVERSE ENTRY (anular con contraasiento) ===
  const reverseEntry = useCallback(async (entryId: string, reason: string) => {
    if (!currentCompany?.id) {
      toast.error('No hay empresa seleccionada');
      return null;
    }

    setIsLoading(true);
    try {
      // Obtener asiento original con líneas
      const original = await fetchEntry(entryId);
      if (!original || !original.lines) {
        throw new Error('No se encontró el asiento');
      }

      if (!original.is_posted) {
        toast.error('Solo se pueden anular asientos contabilizados');
        return null;
      }

      // Verificar período abierto
      const isOpen = await checkPeriodOpen(original.period_id);
      if (!isOpen) {
        toast.error('El período está cerrado');
        return null;
      }

      // Crear líneas invertidas
      const reversedLines = original.lines.map((line, index) => ({
        line_number: index + 1,
        account_id: line.account_id,
        description: `Anulación: ${line.description || ''}`,
        debit_amount: line.credit_amount, // Invertir
        credit_amount: line.debit_amount, // Invertir
        partner_type: line.partner_type,
        partner_id: line.partner_id
      }));

      // Crear contraasiento
      const reversal = await createEntry({
        company_id: currentCompany.id,
        journal_id: original.journal_id,
        period_id: original.period_id,
        fiscal_year_id: original.fiscal_year_id,
        entry_date: new Date().toISOString().split('T')[0],
        reference: `REV-${original.entry_number}`,
        description: `Anulación de ${original.entry_number}: ${reason}`,
        total_debit: original.total_credit,
        total_credit: original.total_debit,
        is_balanced: true,
        is_posted: false,
        source_document: 'reversal',
        source_document_id: entryId
      }, reversedLines);

      if (reversal) {
        // Marcar original como anulado
        await supabase
          .from('erp_journal_entries')
          .update({
            is_cancelled: true,
            cancelled_reason: reason,
            updated_at: new Date().toISOString()
          })
          .eq('id', entryId);

        // Contabilizar contraasiento automáticamente
        await postEntry(reversal.id);

        toast.success('Asiento anulado correctamente');
      }

      return reversal;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al anular asiento';
      toast.error(message);
      console.error('[useERPJournalEntries] reverseEntry error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id, fetchEntry, createEntry, postEntry, checkPeriodOpen]);

  // === DELETE ENTRY (solo borradores) ===
  const deleteEntry = useCallback(async (entryId: string) => {
    if (!currentCompany?.id) {
      toast.error('No hay empresa seleccionada');
      return false;
    }

    setIsLoading(true);
    try {
      // Verificar que es borrador
      const { data: existing, error: checkError } = await supabase
        .from('erp_journal_entries')
        .select('is_posted')
        .eq('id', entryId)
        .single();

      if (checkError) throw checkError;
      if (existing.is_posted) {
        toast.error('No se puede eliminar un asiento contabilizado. Use anulación.');
        return false;
      }

      // Eliminar líneas primero
      await supabase
        .from('erp_journal_entry_lines')
        .delete()
        .eq('entry_id', entryId);

      // Eliminar asiento
      const { error } = await supabase
        .from('erp_journal_entries')
        .delete()
        .eq('id', entryId)
        .eq('company_id', currentCompany.id);

      if (error) throw error;

      toast.success('Asiento eliminado');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar';
      toast.error(message);
      console.error('[useERPJournalEntries] deleteEntry error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  // === POST MULTIPLE (contabilizar en lote) ===
  const postMultiple = useCallback(async (entryIds: string[]) => {
    if (!currentCompany?.id || entryIds.length === 0) return false;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('erp_journal_entries')
        .update({
          is_posted: true,
          updated_at: new Date().toISOString()
        })
        .in('id', entryIds)
        .eq('company_id', currentCompany.id)
        .eq('is_posted', false);

      if (error) throw error;

      toast.success(`${entryIds.length} asientos contabilizados`);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al contabilizar';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  return {
    // Estado
    entries,
    currentEntry,
    isLoading,
    error,
    totalCount,
    // Acciones
    fetchEntries,
    fetchEntry,
    createEntry,
    updateEntry,
    postEntry,
    reverseEntry,
    deleteEntry,
    postMultiple,
    checkPeriodOpen,
    setCurrentEntry
  };
}

export default useERPJournalEntries;
