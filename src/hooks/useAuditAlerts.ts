import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { differenceInDays } from 'date-fns';

export interface AuditAlert {
  id: string;
  organization_id: string | null;
  alert_type: string;
  severity: string;
  title: string;
  description: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  due_date: string | null;
  days_until_due: number | null;
  is_read: boolean;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  auto_generated: boolean;
  created_at: string;
}

export function useAuditAlerts() {
  const [alerts, setAlerts] = useState<AuditAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchAlerts = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('severity', { ascending: false })
        .order('due_date', { ascending: true });

      if (error) throw error;
      setAlerts((data as AuditAlert[]) || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const createAlert = useCallback(async (alert: Partial<AuditAlert>) => {
    try {
      const insertData = {
        alert_type: alert.alert_type || 'general',
        title: alert.title || 'Nueva alerta',
        severity: alert.severity,
        description: alert.description,
        related_entity_type: alert.related_entity_type,
        related_entity_id: alert.related_entity_id,
        due_date: alert.due_date,
        organization_id: alert.organization_id
      };

      const { data, error } = await supabase
        .from('audit_alerts')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      setAlerts(prev => [data as AuditAlert, ...prev]);
      return data as AuditAlert;
    } catch (error) {
      console.error('Error creating alert:', error);
      return null;
    }
  }, []);

  const markAsRead = useCallback(async (alertId: string) => {
    try {
      await supabase
        .from('audit_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, is_read: true } : a
      ));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  }, []);

  const resolveAlert = useCallback(async (alertId: string) => {
    if (!user?.id) return false;

    try {
      await supabase
        .from('audit_alerts')
        .update({ 
          is_resolved: true, 
          resolved_at: new Date().toISOString(),
          resolved_by: user.id
        })
        .eq('id', alertId);

      setAlerts(prev => prev.filter(a => a.id !== alertId));
      return true;
    } catch (error) {
      console.error('Error resolving alert:', error);
      return false;
    }
  }, [user?.id]);

  const getUnreadCount = useCallback(() => {
    return alerts.filter(a => !a.is_read).length;
  }, [alerts]);

  const getCriticalAlerts = useCallback(() => {
    return alerts.filter(a => a.severity === 'critical' || a.severity === 'high');
  }, [alerts]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    createAlert,
    markAsRead,
    resolveAlert,
    getUnreadCount,
    getCriticalAlerts,
    fetchAlerts
  };
}
