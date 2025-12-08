import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, BellRing, Smartphone, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreference[] = [
  { id: 'goals', label: 'Objectius', description: 'Alertes quan s\'assoleixen o s\'acosten objectius', enabled: true },
  { id: 'visits', label: 'Visites', description: 'Recordatoris de visites programades', enabled: true },
  { id: 'alerts', label: 'Alertes críticas', description: 'Oportunitats de negoci importants', enabled: true },
  { id: 'system', label: 'Sistema', description: 'Actualitzacions i manteniment del sistema', enabled: false },
];

export function PushNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference[]>(DEFAULT_PREFERENCES);

  useEffect(() => {
    // Check if push notifications are supported
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setSupported(isSupported);

    if (isSupported) {
      setPermission(Notification.permission);
      
      // Load saved preferences
      const saved = localStorage.getItem('push-notification-preferences');
      if (saved) {
        try {
          setPreferences(JSON.parse(saved));
        } catch (e) {
          console.error('Error loading preferences:', e);
        }
      }

      // Check if already subscribed
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const requestPermission = async () => {
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        await subscribeToNotifications();
        toast.success('Notificacions push activades');
      } else if (result === 'denied') {
        toast.error('Permís denegat per les notificacions');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('Error al sol·licitar permís');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = async () => {
    try {
      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push - using a simple approach without VAPID for demo
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
      });

      console.log('Push subscription:', subscription);
      setSubscribed(true);

      // Send subscription to server (you would implement this)
      // await supabase.functions.invoke('register-push-subscription', { body: { subscription } });

    } catch (error) {
      console.error('Error subscribing:', error);
      throw error;
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        setSubscribed(false);
        toast.success('Notificacions push desactivades');
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Error al desactivar notificacions');
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = (id: string) => {
    const updated = preferences.map(p => 
      p.id === id ? { ...p, enabled: !p.enabled } : p
    );
    setPreferences(updated);
    localStorage.setItem('push-notification-preferences', JSON.stringify(updated));
    toast.success('Preferències actualitzades');
  };

  const sendTestNotification = () => {
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
  };

  if (!supported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5 text-muted-foreground" />
            Alertes Push Mòvils
          </CardTitle>
          <CardDescription>
            El teu navegador no suporta notificacions push
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Per rebre notificacions push, utilitza un navegador modern com Chrome, Firefox o Edge.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Alertes Push Mòvils
            </CardTitle>
            <CardDescription>
              Rep notificacions en temps real al teu dispositiu
            </CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              subscribed 
                ? 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {subscribed ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Actiu
              </>
            ) : (
              <>
                <X className="h-3 w-3 mr-1" />
                Inactiu
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission Status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            {permission === 'granted' ? (
              <BellRing className="h-5 w-5 text-green-500" />
            ) : permission === 'denied' ? (
              <BellOff className="h-5 w-5 text-red-500" />
            ) : (
              <Bell className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {permission === 'granted' ? 'Notificacions activades' :
                 permission === 'denied' ? 'Notificacions bloquejades' :
                 'Notificacions no configurades'}
              </p>
              <p className="text-xs text-muted-foreground">
                {permission === 'denied' 
                  ? 'Canvia la configuració del navegador per permetre notificacions'
                  : 'Les alertes importants es mostraran al teu dispositiu'}
              </p>
            </div>
          </div>
          
          {permission !== 'granted' ? (
            <Button onClick={requestPermission} disabled={loading || permission === 'denied'}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Activar'
              )}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={sendTestNotification}>
                Prova
              </Button>
              <Button variant="destructive" size="sm" onClick={unsubscribe} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Desactivar'}
              </Button>
            </div>
          )}
        </div>

        {/* Notification Preferences */}
        {permission === 'granted' && (
          <div className="space-y-4">
            <Label className="text-sm font-medium">Tipus de notificacions:</Label>
            <div className="space-y-3">
              {preferences.map(pref => (
                <div key={pref.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label htmlFor={pref.id} className="text-sm font-medium cursor-pointer">
                      {pref.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{pref.description}</p>
                  </div>
                  <Switch
                    id={pref.id}
                    checked={pref.enabled}
                    onCheckedChange={() => togglePreference(pref.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
