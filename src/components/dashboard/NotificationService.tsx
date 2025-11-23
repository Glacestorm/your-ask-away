import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  created_at: string;
}

export const NotificationService = () => {
  const { user } = useAuth();
  const { permission, showNotification } = useNotifications();
  const lastNotificationTime = useRef<number>(0);

  useEffect(() => {
    if (!user || permission !== 'granted') return;

    console.log('Setting up realtime notification listener...');

    // Subscribe to new notifications for this user
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as Notification;
          
          // Prevent duplicate notifications (debounce 5 seconds)
          const now = Date.now();
          if (now - lastNotificationTime.current < 5000) {
            console.log('Skipping duplicate notification');
            return;
          }
          lastNotificationTime.current = now;

          console.log('New notification received:', notification);

          // Show browser notification
          showNotification({
            title: notification.title,
            body: notification.message,
            requireInteraction: notification.severity === 'error',
            tag: notification.id,
            onClick: () => {
              // Mark as read
              supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notification.id)
                .then(() => {
                  console.log('Notification marked as read');
                });
              
              // Navigate based on notification type
              if (notification.title.includes('Visita')) {
                window.location.href = '/map';
              } else if (notification.title.includes('Alerta')) {
                window.location.href = '/dashboard';
              }
            },
          });

          // Also show toast
          const toastVariant = 
            notification.severity === 'error' ? 'destructive' :
            notification.severity === 'warning' ? 'default' :
            'default';

          toast(notification.title, {
            description: notification.message,
            duration: 5000,
          });
        }
      )
      .subscribe((status) => {
        console.log('Notification channel status:', status);
      });

    return () => {
      console.log('Unsubscribing from notifications channel');
      supabase.removeChannel(channel);
    };
  }, [user, permission]);

  return null; // This is a service component, no UI
};
