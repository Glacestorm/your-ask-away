/**
 * Hook para gestión de auditoría ERP
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ERPAuditEvent, ERPAuditFilters } from '@/types/erp';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';

export function useERPAudit() {
  const { currentCompany, hasPermission } = useERPContext();
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<ERPAuditEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Cargar eventos de auditoría
  const fetchAuditEvents = useCallback(async (
    filters?: ERPAuditFilters,
    page = 0,
    pageSize = 50
  ) => {
    if (!currentCompany?.id) return;
    if (!hasPermission('audit.read')) {
      toast.error('Sin permisos para ver auditoría');
      return;
    }

    setIsLoading(true);
    try {
      let query = supabase
        .from('erp_audit_events')
        .select('*', { count: 'exact' })
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      // Aplicar filtros
      if (filters?.entity_type) {
        query = query.eq('entity_type', filters.entity_type);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.actor_user_id) {
        query = query.eq('actor_user_id', filters.actor_user_id);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setEvents((data || []) as ERPAuditEvent[]);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('[useERPAudit] fetchAuditEvents error:', err);
      toast.error('Error cargando auditoría');
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id, hasPermission]);

  // Obtener tipos de entidad únicos
  const getEntityTypes = useCallback(async (): Promise<string[]> => {
    if (!currentCompany?.id) return [];

    try {
      const { data } = await supabase
        .from('erp_audit_events')
        .select('entity_type')
        .eq('company_id', currentCompany.id);

      const unique = [...new Set((data || []).map(d => d.entity_type))];
      return unique.sort();
    } catch (err) {
      return [];
    }
  }, [currentCompany?.id]);

  // Obtener acciones únicas
  const getActions = useCallback(async (): Promise<string[]> => {
    if (!currentCompany?.id) return [];

    try {
      const { data } = await supabase
        .from('erp_audit_events')
        .select('action')
        .eq('company_id', currentCompany.id);

      const unique = [...new Set((data || []).map(d => d.action))];
      return unique.sort();
    } catch (err) {
      return [];
    }
  }, [currentCompany?.id]);

  // Registrar evento manual
  const logEvent = useCallback(async (
    entityType: string,
    entityId: string,
    action: string,
    metadata?: Record<string, unknown>
  ): Promise<boolean> => {
    if (!currentCompany?.id) return false;

    try {
      const { error } = await supabase
        .from('erp_audit_events')
        .insert([{
          company_id: currentCompany.id,
          entity_type: entityType,
          entity_id: entityId,
          action,
          metadata: (metadata || {}) as any,
        }]);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[useERPAudit] logEvent error:', err);
      return false;
    }
  }, [currentCompany?.id]);

  // Exportar a CSV
  const exportToCSV = useCallback(async (filters?: ERPAuditFilters): Promise<void> => {
    if (!currentCompany?.id) return;

    try {
      let query = supabase
        .from('erp_audit_events')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (filters?.entity_type) query = query.eq('entity_type', filters.entity_type);
      if (filters?.action) query = query.eq('action', filters.action);
      if (filters?.date_from) query = query.gte('created_at', filters.date_from);
      if (filters?.date_to) query = query.lte('created_at', filters.date_to);

      const { data } = await query;

      if (!data?.length) {
        toast.info('No hay datos para exportar');
        return;
      }

      // Crear CSV
      const headers = ['Fecha', 'Usuario', 'Entidad', 'ID Entidad', 'Acción'];
      const rows = data.map(e => [
        new Date(e.created_at).toLocaleString('es-ES'),
        e.actor_user_id || 'Sistema',
        e.entity_type,
        e.entity_id || '',
        e.action,
      ]);

      const csv = [
        headers.join(';'),
        ...rows.map(r => r.join(';'))
      ].join('\n');

      // Descargar
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast.success('Exportación completada');
    } catch (err) {
      toast.error('Error exportando');
    }
  }, [currentCompany?.id]);

  return {
    events,
    totalCount,
    isLoading,
    fetchAuditEvents,
    getEntityTypes,
    getActions,
    logEvent,
    exportToCSV,
  };
}

export default useERPAudit;
