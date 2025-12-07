import React, { createContext, useContext, ReactNode } from 'react';
import { usePresence, OnlineUser } from '@/hooks/usePresence';

interface PresenceContextType {
  onlineUsers: OnlineUser[];
  isConnected: boolean;
  onlineCount: number;
  updateCurrentPage: (page: string) => void;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

interface PresenceProviderProps {
  children: ReactNode;
}

export function PresenceProvider({ children }: PresenceProviderProps) {
  const presence = usePresence({ enabled: true, trackPage: true });

  return (
    <PresenceContext.Provider value={presence}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresenceContext() {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresenceContext must be used within a PresenceProvider');
  }
  return context;
}
