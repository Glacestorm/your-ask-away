import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback, useRef } from 'react';
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

interface PresenceContextType {
  onlineUsers: OnlineUser[];
  isConnected: boolean;
  onlineCount: number;
  updateCurrentPage: (page: string) => void;
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: [],
  isConnected: false,
  onlineCount: 0,
  updateCurrentPage: () => {},
});

interface PresenceProviderProps {
  children: ReactNode;
}

// Deferred presence provider - doesn't block initial render
export function PresenceProvider({ children }: PresenceProviderProps) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const initRef = useRef(false);
  const profileDataRef = useRef<{ full_name: string; role: string; avatar_url?: string; oficina?: string } | null>(null);

  // Initialize presence after a delay to not block initial render
  useEffect(() => {
    if (!user?.id || initRef.current) return;

    // Defer presence initialization by 3 seconds
    const timer = setTimeout(() => {
      initRef.current = true;
      initializePresence();
    }, 3000);

    return () => clearTimeout(timer);
  }, [user?.id]);

  const initializePresence = useCallback(async () => {
    if (!user?.id) return;

    // Fetch profile data
    const [profileRes, roleRes] = await Promise.all([
      supabase.from('profiles').select('full_name, avatar_url, oficina').eq('id', user.id).single(),
      supabase.from('user_roles').select('role').eq('user_id', user.id).single(),
    ]);

    profileDataRef.current = {
      full_name: profileRes.data?.full_name || user.email || 'Unknown',
      role: roleRes.data?.role || 'user',
      avatar_url: profileRes.data?.avatar_url,
      oficina: profileRes.data?.oficina,
    };

    // Create presence channel
    const channel = supabase.channel('online-users', {
      config: { presence: { key: user.id } },
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
          setIsConnected(true);
          // Track presence
          if (profileDataRef.current) {
            await channel.track({
              id: user.id,
              full_name: profileDataRef.current.full_name,
              email: user.email || '',
              role: profileDataRef.current.role,
              avatar_url: profileDataRef.current.avatar_url,
              oficina: profileDataRef.current.oficina,
              online_at: new Date().toISOString(),
              current_page: window.location.pathname,
            });
          }
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.untrack().catch(() => {});
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user?.id, user?.email]);

  const updateCurrentPage = useCallback((page: string) => {
    if (!channelRef.current || !profileDataRef.current || !user?.id) return;
    
    channelRef.current.track({
      id: user.id,
      full_name: profileDataRef.current.full_name,
      email: user.email || '',
      role: profileDataRef.current.role,
      avatar_url: profileDataRef.current.avatar_url,
      oficina: profileDataRef.current.oficina,
      online_at: new Date().toISOString(),
      current_page: page,
    }).catch(() => {});
  }, [user?.id, user?.email]);

  return (
    <PresenceContext.Provider value={{
      onlineUsers,
      isConnected,
      onlineCount: onlineUsers.length,
      updateCurrentPage,
    }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresenceContext() {
  return useContext(PresenceContext);
}
