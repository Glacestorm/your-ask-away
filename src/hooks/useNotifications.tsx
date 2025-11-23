import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export type NotificationPermission = 'default' | 'granted' | 'denied';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: any;
  onClick?: () => void;
}

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setSupported(true);
      setPermission(Notification.permission as NotificationPermission);
    }
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      toast.error('Tu navegador no soporta notificaciones');
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);
      
      if (result === 'granted') {
        toast.success('Notificaciones activadas correctamente');
        // Send test notification
        showNotification({
          title: '✅ Notificaciones Activadas',
          body: 'Recibirás alertas importantes y recordatorios de visitas',
          icon: '/favicon.ico',
        });
      } else if (result === 'denied') {
        toast.error('Notificaciones bloqueadas. Por favor, habilítalas en la configuración del navegador');
      }
      
      return result as NotificationPermission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Error al solicitar permisos de notificación');
      return 'denied';
    }
  };

  const showNotification = ({
    title,
    body,
    icon = '/favicon.ico',
    badge = '/favicon.ico',
    tag,
    requireInteraction = false,
    data,
    onClick,
  }: NotificationOptions): Notification | null => {
    if (!supported) {
      console.warn('Notifications not supported');
      return null;
    }

    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon,
        badge,
        tag,
        requireInteraction,
        data,
      });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        if (onClick) onClick();
      };

      // Auto-close after 10 seconds if not requireInteraction
      if (!requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 10000);
      }

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  };

  const scheduleNotification = (
    options: NotificationOptions,
    delayMs: number
  ): number => {
    const timeoutId = window.setTimeout(() => {
      showNotification(options);
    }, delayMs);

    return timeoutId;
  };

  const cancelScheduledNotification = (timeoutId: number) => {
    window.clearTimeout(timeoutId);
  };

  return {
    permission,
    supported,
    requestPermission,
    showNotification,
    scheduleNotification,
    cancelScheduledNotification,
  };
};

// Utility function to check if a visit needs a reminder
export const shouldSendVisitReminder = (
  visitDate: string,
  reminderMinutesBefore: number
): boolean => {
  const now = new Date();
  const visit = new Date(visitDate);
  const reminderTime = new Date(visit.getTime() - reminderMinutesBefore * 60 * 1000);
  
  return now >= reminderTime && now < visit;
};

// Format notification body for visit reminders
export const formatVisitReminderBody = (
  companyName: string,
  visitDate: string,
  minutesBefore: number
): string => {
  const visit = new Date(visitDate);
  const timeStr = visit.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  if (minutesBefore < 60) {
    return `Visita en ${minutesBefore} minutos a las ${timeStr}`;
  } else if (minutesBefore < 1440) {
    const hours = Math.floor(minutesBefore / 60);
    return `Visita en ${hours} hora${hours > 1 ? 's' : ''} a las ${timeStr}`;
  } else {
    const days = Math.floor(minutesBefore / 1440);
    return `Visita en ${days} día${days > 1 ? 's' : ''} a las ${timeStr}`;
  }
};
