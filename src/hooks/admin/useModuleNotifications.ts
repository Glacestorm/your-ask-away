import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ModuleNotification {
  id: string;
  type: 'deploy' | 'error' | 'update' | 'security' | 'performance' | 'info';
  severity: 'critical' | 'warning' | 'info' | 'success';
  moduleKey: string;
  moduleName: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreferences {
  enableDesktop: boolean;
  enableEmail: boolean;
  enableSound: boolean;
  severityFilter: ('critical' | 'warning' | 'info' | 'success')[];
  moduleFilter: string[];
}

export function useModuleNotifications() {
  const [notifications, setNotifications] = useState<ModuleNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enableDesktop: true,
    enableEmail: false,
    enableSound: true,
    severityFilter: ['critical', 'warning', 'info', 'success'],
    moduleFilter: []
  });
  const realtimeChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchNotifications = useCallback(async (limit = 50) => {
    setIsLoading(true);
    try {
      // Simular notificaciones recientes
      const mockNotifications: ModuleNotification[] = [
        {
          id: '1',
          type: 'deploy',
          severity: 'success',
          moduleKey: 'crm',
          moduleName: 'CRM Core',
          title: 'Despliegue completado',
          message: 'CRM Core v2.1.0 desplegado exitosamente en producción',
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          read: false
        },
        {
          id: '2',
          type: 'performance',
          severity: 'warning',
          moduleKey: 'analytics',
          moduleName: 'Analytics Suite',
          title: 'Alto tiempo de respuesta',
          message: 'El tiempo de respuesta promedio supera 500ms',
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          read: false
        },
        {
          id: '3',
          type: 'security',
          severity: 'critical',
          moduleKey: 'auth',
          moduleName: 'Authentication',
          title: 'Vulnerabilidad detectada',
          message: 'Se detectó una vulnerabilidad CVE-2024-1234 en dependencias',
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
          read: false
        },
        {
          id: '4',
          type: 'update',
          severity: 'info',
          moduleKey: 'marketplace',
          moduleName: 'Marketplace',
          title: 'Nueva versión disponible',
          message: 'Marketplace v1.3.0 está disponible para actualizar',
          timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
          read: true
        }
      ];

      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('[useModuleNotifications] Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    toast.success('Todas las notificaciones marcadas como leídas');
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(c => Math.max(0, c - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);
    toast.success('Notificaciones eliminadas');
  }, []);

  const updatePreferences = useCallback((newPrefs: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
    toast.success('Preferencias actualizadas');
  }, []);

  const subscribeToRealtime = useCallback(() => {
    realtimeChannel.current = supabase
      .channel('module-notifications')
      .on('broadcast', { event: 'notification' }, (payload) => {
        const newNotification = payload.payload as ModuleNotification;
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        if (preferences.enableSound) {
          // Play notification sound
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => {});
        }

        if (preferences.enableDesktop && 'Notification' in window) {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(newNotification.title, {
                body: newNotification.message,
                icon: '/favicon.ico'
              });
            }
          });
        }
      })
      .subscribe();
  }, [preferences]);

  const unsubscribeFromRealtime = useCallback(() => {
    if (realtimeChannel.current) {
      supabase.removeChannel(realtimeChannel.current);
      realtimeChannel.current = null;
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    subscribeToRealtime();
    return () => unsubscribeFromRealtime();
  }, [fetchNotifications, subscribeToRealtime, unsubscribeFromRealtime]);

  return {
    notifications,
    unreadCount,
    isLoading,
    preferences,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updatePreferences,
    subscribeToRealtime,
    unsubscribeFromRealtime
  };
}

export default useModuleNotifications;
