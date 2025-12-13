import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface OnlineUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
  oficina?: string;
  online_at: string;
  current_page?: string;
}

interface UsePresenceOptions {
  enabled?: boolean;
  trackPage?: boolean;
}

export function usePresence(options: UsePresenceOptions = {}) {
  const { enabled = true, trackPage = true } = options;
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const profileDataRef = useRef<{ full_name: string; role: string; avatar_url?: string; oficina?: string } | null>(null);
  const isSubscribedRef = useRef(false);
  const lastTrackTimeRef = useRef(0);

  // Fetch user profile data once
  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, oficina')
        .eq('id', user.id)
        .single();

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      profileDataRef.current = {
        full_name: profile?.full_name || user.email || 'Unknown',
        role: roleData?.role || 'user',
        avatar_url: profile?.avatar_url,
        oficina: profile?.oficina,
      };
    };

    fetchProfile();
  }, [user?.id, user?.email]);

  const trackPresence = useCallback(
    async (currentPage?: string) => {
      if (!channelRef.current || !user?.id || !profileDataRef.current || !isSubscribedRef.current) return;

      // Debounce: don't track more than once per 5 seconds
      const now = Date.now();
      if (now - lastTrackTimeRef.current < 5000) return;
      lastTrackTimeRef.current = now;

      const presenceData: OnlineUser = {
        id: user.id,
        full_name: profileDataRef.current.full_name,
        email: user.email || '',
        role: profileDataRef.current.role,
        avatar_url: profileDataRef.current.avatar_url,
        oficina: profileDataRef.current.oficina,
        online_at: new Date().toISOString(),
        current_page: currentPage,
      };

      try {
        await channelRef.current.track(presenceData);
      } catch {
        // Silently handle errors to avoid console spam
      }
    },
    [user?.id, user?.email]
  );

  useEffect(() => {
    if (!enabled || !user?.id) return;

    // Prevent double subscription
    if (channelRef.current) return;

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<OnlineUser>();
        const users: OnlineUser[] = [];

        Object.values(state).forEach((presences) => {
          if (Array.isArray(presences) && presences.length > 0) {
            users.push(presences[0] as OnlineUser);
          }
        });

        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
          setIsConnected(true);
          
          // Wait for profile data then track once
          let attempts = 0;
          while (!profileDataRef.current && attempts < 10) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            attempts++;
          }
          if (profileDataRef.current) {
            trackPresence(trackPage ? window.location.pathname : undefined);
          }
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          isSubscribedRef.current = false;
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    // Heartbeat every 60 seconds (reduced frequency)
    const heartbeatInterval = setInterval(() => {
      if (channelRef.current && profileDataRef.current && isSubscribedRef.current) {
        lastTrackTimeRef.current = 0; // Reset debounce for heartbeat
        trackPresence(trackPage ? window.location.pathname : undefined);
      }
    }, 60000);

    return () => {
      clearInterval(heartbeatInterval);
      isSubscribedRef.current = false;

      if (channelRef.current) {
        channelRef.current.untrack().catch(() => {});
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, user?.id, trackPresence, trackPage]);

  const updateCurrentPage = useCallback(
    (page: string) => {
      trackPresence(page);
    },
    [trackPresence]
  );

  return {
    onlineUsers,
    isConnected,
    onlineCount: onlineUsers.length,
    updateCurrentPage,
  };
}
