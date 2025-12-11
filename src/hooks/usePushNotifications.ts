import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface PushSubscription {
  id: string;
  endpoint: string;
  device_type?: string;
  device_name?: string;
  is_active: boolean;
  created_at: string;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<PushSubscription[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadSubscriptions();
    }
  }, [user]);

  const loadSubscriptions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSubscriptions(data);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('El teu navegador no suporta notificacions push');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        await subscribe();
        return true;
      } else if (result === 'denied') {
        toast.error('Permís denegat per les notificacions');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('Error sol·licitant permís');
      return false;
    }
  };

  const subscribe = async () => {
    if (!user || !isSupported) return;

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
      });

      const subscriptionJSON = subscription.toJSON();

      // Save to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionJSON.endpoint || '',
          p256dh_key: subscriptionJSON.keys?.p256dh,
          auth_key: subscriptionJSON.keys?.auth,
          device_type: getDeviceType(),
          device_name: navigator.userAgent.split(' ').slice(-2).join(' '),
          is_active: true,
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (error) throw error;

      await loadSubscriptions();
      toast.success('Notificacions push activades');
    } catch (error) {
      console.error('Subscribe error:', error);
      toast.error('Error activant notificacions');
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async (subscriptionId?: string) => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      if (subscriptionId) {
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('id', subscriptionId);
      } else if (user) {
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('user_id', user.id);
      }

      await loadSubscriptions();
      toast.success('Notificacions push desactivades');
    } catch (error) {
      console.error('Unsubscribe error:', error);
      toast.error('Error desactivant notificacions');
    } finally {
      setLoading(false);
    }
  };

  const sendPushNotification = async (
    userId: string | null,
    title: string,
    body: string,
    options?: { icon?: string; url?: string; data?: Record<string, unknown> }
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: userId,
          title,
          body,
          ...options,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Send push error:', error);
      throw error;
    }
  };

  const sendTestNotification = useCallback(() => {
    if (permission !== 'granted') {
      toast.error('Primer has d\'activar les notificacions');
      return;
    }

    new Notification('Prova de notificació', {
      body: 'Les notificacions push funcionen correctament!',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'test-notification',
    });

    toast.success('Notificació de prova enviada');
  }, [permission]);

  return {
    subscriptions,
    isSupported,
    permission,
    loading,
    requestPermission,
    subscribe,
    unsubscribe,
    sendPushNotification,
    sendTestNotification,
    loadSubscriptions,
  };
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}
