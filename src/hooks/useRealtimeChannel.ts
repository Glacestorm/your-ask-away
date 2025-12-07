import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ChannelSubscription {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
  filter?: string;
  callback: (payload: unknown) => void;
}

interface UseRealtimeChannelOptions {
  channelName: string;
  subscriptions: ChannelSubscription[];
  enabled?: boolean;
  debounceMs?: number;
}

export function useRealtimeChannel({
  channelName,
  subscriptions,
  enabled = true,
  debounceMs = 300,
}: UseRealtimeChannelOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const debouncedCallback = useCallback(
    (key: string, callback: (payload: unknown) => void, payload: unknown) => {
      const existingTimer = debounceTimers.current.get(key);
      if (existingTimer) clearTimeout(existingTimer);

      const timer = setTimeout(() => {
        callback(payload);
        debounceTimers.current.delete(key);
      }, debounceMs);

      debounceTimers.current.set(key, timer);
    },
    [debounceMs]
  );

  useEffect(() => {
    if (!enabled || subscriptions.length === 0) return;

    const channel = supabase.channel(channelName);

    subscriptions.forEach((sub, index) => {
      const key = `${sub.table}-${sub.event}-${index}`;
      
      // Use the schema-db-changes pattern
      (channel as RealtimeChannel).on(
        'postgres_changes' as never,
        {
          event: sub.event,
          schema: sub.schema || 'public',
          table: sub.table,
          filter: sub.filter,
        } as never,
        (payload: unknown) => debouncedCallback(key, sub.callback, payload)
      );
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      debounceTimers.current.forEach((t) => clearTimeout(t));
      debounceTimers.current.clear();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channelName, subscriptions, enabled, debouncedCallback]);

  return { channel: channelRef.current };
}

export const REALTIME_CHANNELS = {
  GOALS: 'goals-unified-channel',
  NOTIFICATIONS: 'notifications-unified-channel',
  VISITS: 'visits-unified-channel',
  COMPANIES: 'companies-unified-channel',
} as const;
