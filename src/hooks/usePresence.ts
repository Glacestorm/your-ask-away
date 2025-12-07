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
      if (!channelRef.current || !user?.id || !profileDataRef.current) return;

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
      } catch (error) {
        console.error('[Presence] Error tracking presence:', error);
      }
    },
    [user?.id, user?.email]
  );

  useEffect(() => {
    if (!enabled || !user?.id) return;

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
            // Get the most recent presence for each user
            users.push(presences[0] as OnlineUser);
          }
        });

        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[Presence] User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[Presence] User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // Wait for profile data to be loaded
          const waitForProfile = async () => {
            let attempts = 0;
            while (!profileDataRef.current && attempts < 10) {
              await new Promise((resolve) => setTimeout(resolve, 100));
              attempts++;
            }
            if (profileDataRef.current) {
              trackPresence(trackPage ? window.location.pathname : undefined);
            }
          };
          waitForProfile();
        } else {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    // Track page changes
    const handleRouteChange = () => {
      if (trackPage && channelRef.current) {
        trackPresence(window.location.pathname);
      }
    };

    window.addEventListener('popstate', handleRouteChange);

    // Heartbeat to keep presence alive
    const heartbeatInterval = setInterval(() => {
      if (channelRef.current && profileDataRef.current) {
        trackPresence(trackPage ? window.location.pathname : undefined);
      }
    }, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      clearInterval(heartbeatInterval);

      if (channelRef.current) {
        channelRef.current.untrack();
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
