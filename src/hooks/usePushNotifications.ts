import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from './core';

interface PushSubscriptionData {
  id: string;
  endpoint: string;
  device_type?: string;
  device_name?: string;
  is_active: boolean;
  created_at: string;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<PushSubscriptionData[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const loading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

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

  const requestPermission = useCallback(async (): Promise<boolean> => {
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
    } catch (err) {
      const kbError = parseError(err);
      setError(kbError);
      console.error('Error requesting permission:', err);
      toast.error('Error sol·licitant permís');
      return false;
    }
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!user || !isSupported) return;

    setStatus('loading');
    setError(null);
    const startTime = Date.now();
    
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
      });

      const subscriptionJSON = subscription.toJSON();

      // Save to database
      const { error: dbError } = await supabase
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

      if (dbError) throw dbError;

      await loadSubscriptions();
      toast.success('Notificacions push activades');
      setLastSuccess(new Date());
      setStatus('success');
      setRetryCount(0);
      collectTelemetry('usePushNotifications', 'subscribe', 'success', Date.now() - startTime);
    } catch (err) {
      const kbError = parseError(err);
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('usePushNotifications', 'subscribe', 'error', Date.now() - startTime, kbError);
      console.error('Subscribe error:', err);
      toast.error('Error activant notificacions');
    }
  }, [user, isSupported]);

  const unsubscribe = useCallback(async (subscriptionId?: string) => {
    setStatus('loading');
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
      setStatus('success');
    } catch (err) {
      const kbError = parseError(err);
      setError(kbError);
      setStatus('error');
      console.error('Unsubscribe error:', err);
      toast.error('Error desactivant notificacions');
    }
  }, [user]);

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
    // === KB 2.0 ===
    status,
    isIdle,
    isSuccess,
    isError,
    error,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError
  };
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}
