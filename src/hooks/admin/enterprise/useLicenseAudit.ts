/**
 * License Audit Trail Hook
 * Registro completo de auditoría de licencias
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LicenseAuditLog {
  id: string;
  license_id: string | null;
  action: string;
  actor_id: string | null;
  actor_type: string;
  actor_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface AuditFilters {
  licenseId?: string;
  action?: string;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const AUDIT_ACTIONS = [
  { value: 'license.created', label: 'Licencia creada', category: 'license' },
  { value: 'license.activated', label: 'Licencia activada', category: 'license' },
  { value: 'license.suspended', label: 'Licencia suspendida', category: 'license' },
  { value: 'license.revoked', label: 'Licencia revocada', category: 'license' },
  { value: 'license.renewed', label: 'Licencia renovada', category: 'license' },
  { value: 'license.updated', label: 'Licencia actualizada', category: 'license' },
  { value: 'device.activated', label: 'Dispositivo activado', category: 'device' },
  { value: 'device.deactivated', label: 'Dispositivo desactivado', category: 'device' },
  { value: 'validation.success', label: 'Validación exitosa', category: 'validation' },
  { value: 'validation.failed', label: 'Validación fallida', category: 'validation' },
  { value: 'anomaly.detected', label: 'Anomalía detectada', category: 'security' },
  { value: 'transfer.initiated', label: 'Transferencia iniciada', category: 'transfer' },
  { value: 'transfer.completed', label: 'Transferencia completada', category: 'transfer' },
  { value: 'grace.activated', label: 'Período de gracia activado', category: 'grace' },
  { value: 'grace.ended', label: 'Período de gracia terminado', category: 'grace' },
];

export function useLicenseAudit() {
  const [logs, setLogs] = useState<LicenseAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [totalCount, setTotalCount] = useState(0);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchLogs = useCallback(async (page = 0, pageSize = 50) => {
    setLoading(true);
    try {
      let query = supabase
        .from('license_audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (filters.licenseId) {
        query = query.eq('license_id', filters.licenseId);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.actorId) {
        query = query.eq('actor_id', filters.actorId);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setLogs((data || []) as LicenseAuditLog[]);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('[useLicenseAudit] fetchLogs error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const logAction = useCallback(async (
    action: string,
    licenseId?: string,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>,
    details?: Record<string, unknown>
  ) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      await supabase
        .from('license_audit_logs')
        .insert([{
          license_id: licenseId || null,
          action,
          actor_id: userData?.user?.id || null,
          actor_email: userData?.user?.email || null,
          old_values: (oldValues || null) as unknown as null,
          new_values: (newValues || null) as unknown as null,
          details: (details || {}) as unknown as null,
        }]);

      return true;
    } catch (err) {
      console.error('[useLicenseAudit] logAction error:', err);
      return false;
    }
  }, []);

  const exportLogs = useCallback(async (format: 'csv' | 'json') => {
    try {
      let query = supabase
        .from('license_audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.licenseId) query = query.eq('license_id', filters.licenseId);
      if (filters.action) query = query.eq('action', filters.action);
      if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
      if (filters.dateTo) query = query.lte('created_at', filters.dateTo);

      const { data, error } = await query;
      if (error) throw error;

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const headers = ['ID', 'License ID', 'Action', 'Actor', 'Created At'];
        const csvRows = [
          headers.join(','),
          ...(data || []).map(log => [
            log.id,
            log.license_id || '',
            log.action,
            log.actor_email || log.actor_id || '',
            log.created_at
          ].join(','))
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      return true;
    } catch (err) {
      console.error('[useLicenseAudit] exportLogs error:', err);
      return false;
    }
  }, [filters]);

  // Subscribe to realtime updates
  useEffect(() => {
    subscriptionRef.current = supabase
      .channel('license_audit_logs_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'license_audit_logs' },
        (payload) => {
          const newLog = payload.new as LicenseAuditLog;
          setLogs(prev => [newLog, ...prev.slice(0, 99)]);
        }
      )
      .subscribe();

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    filters,
    totalCount,
    setFilters,
    fetchLogs,
    logAction,
    exportLogs,
  };
}

export default useLicenseAudit;
