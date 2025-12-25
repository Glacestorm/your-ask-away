/**
 * useAcademiaNotificationsAI - Hook para notificaciones inteligentes con IA
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface SmartNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'achievement' | 'reminder' | 'recommendation';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  isRead: boolean;
  isActionable: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  aiGenerated: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface NotificationDigest {
  summary: string;
  highlights: string[];
  actionItems: Array<{
    title: string;
    priority: string;
    dueDate?: string;
  }>;
  recommendations: string[];
  unreadCount: number;
  urgentCount: number;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  digestFrequency: 'realtime' | 'daily' | 'weekly';
  categories: Record<string, boolean>;
  quietHours?: { start: string; end: string };
}

export function useAcademiaNotificationsAI() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [digest, setDigest] = useState<NotificationDigest | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH NOTIFICATIONS ===
  const fetchNotifications = useCallback(async (options?: {
    unreadOnly?: boolean;
    category?: string;
    limit?: number;
  }) => {
    if (!user?.id) return null;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-notifications',
        {
          body: {
            action: 'get_notifications',
            context: {
              userId: user.id,
              ...options
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setNotifications(data.data?.notifications || []);
        setLastRefresh(new Date());
        return data.data;
      }

      throw new Error(data?.error || 'Error fetching notifications');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useAcademiaNotificationsAI] fetchNotifications error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // === GET AI DIGEST ===
  const getDigest = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-notifications',
        {
          body: {
            action: 'generate_digest',
            context: { userId: user.id }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data.data?.digest) {
        setDigest(data.data.digest);
        return data.data.digest;
      }

      return null;
    } catch (err) {
      console.error('[useAcademiaNotificationsAI] getDigest error:', err);
      return null;
    }
  }, [user?.id]);

  // === MARK AS READ ===
  const markAsRead = useCallback(async (notificationIds: string | string[]) => {
    if (!user?.id) return false;

    const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-notifications',
        {
          body: {
            action: 'mark_read',
            params: {
              notificationIds: ids,
              userId: user.id
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setNotifications(prev => 
          prev.map(n => ids.includes(n.id) ? { ...n, isRead: true } : n)
        );
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useAcademiaNotificationsAI] markAsRead error:', err);
      return false;
    }
  }, [user?.id]);

  // === MARK ALL AS READ ===
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return false;

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-notifications',
        {
          body: {
            action: 'mark_all_read',
            params: { userId: user.id }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        toast.success('Todas las notificaciones marcadas como leídas');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useAcademiaNotificationsAI] markAllAsRead error:', err);
      return false;
    }
  }, [user?.id]);

  // === DELETE NOTIFICATION ===
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user?.id) return false;

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-notifications',
        {
          body: {
            action: 'delete',
            params: {
              notificationId,
              userId: user.id
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useAcademiaNotificationsAI] deleteNotification error:', err);
      return false;
    }
  }, [user?.id]);

  // === GET/UPDATE PREFERENCES ===
  const getPreferences = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-notifications',
        {
          body: {
            action: 'get_preferences',
            context: { userId: user.id }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data.data?.preferences) {
        setPreferences(data.data.preferences);
        return data.data.preferences;
      }

      return null;
    } catch (err) {
      console.error('[useAcademiaNotificationsAI] getPreferences error:', err);
      return null;
    }
  }, [user?.id]);

  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user?.id) return false;

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-notifications',
        {
          body: {
            action: 'update_preferences',
            params: {
              userId: user.id,
              preferences: newPreferences
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setPreferences(prev => prev ? { ...prev, ...newPreferences } : null);
        toast.success('Preferencias actualizadas');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useAcademiaNotificationsAI] updatePreferences error:', err);
      toast.error('Error al actualizar preferencias');
      return false;
    }
  }, [user?.id]);

  // === GENERATE SMART REMINDERS ===
  const generateSmartReminders = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-notifications',
        {
          body: {
            action: 'generate_reminders',
            context: { userId: user.id }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        await fetchNotifications();
        return data.data?.reminders || [];
      }

      return null;
    } catch (err) {
      console.error('[useAcademiaNotificationsAI] generateSmartReminders error:', err);
      return null;
    }
  }, [user?.id, fetchNotifications]);

  // === COMPUTED VALUES ===
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const urgentNotifications = notifications.filter(n => n.priority === 'urgent' && !n.isRead);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 30000) => {
    stopAutoRefresh();
    fetchNotifications();
    autoRefreshInterval.current = setInterval(() => {
      fetchNotifications();
    }, intervalMs);
  }, [fetchNotifications]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    isLoading,
    notifications,
    digest,
    preferences,
    error,
    lastRefresh,
    unreadCount,
    urgentNotifications,
    fetchNotifications,
    getDigest,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getPreferences,
    updatePreferences,
    generateSmartReminders,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useAcademiaNotificationsAI;
