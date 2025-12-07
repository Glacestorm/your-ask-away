import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, invalidateRelatedQueries } from '@/lib/queryClient';
import { useRealtimeChannel, REALTIME_CHANNELS } from './useRealtimeChannel';
import { useAuth } from './useAuth';
import { useMemo } from 'react';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  severity: string;
  metric_value?: number;
  threshold_value?: number;
  is_read: boolean;
  created_at: string;
}

export function useNotificationsQuery() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Set up realtime subscription
  const subscriptions = useMemo(
    () => [
      {
        table: 'notifications',
        event: 'INSERT' as const,
        filter: user?.id ? `user_id=eq.${user.id}` : undefined,
        callback: () => {
          invalidateRelatedQueries.onNotificationChange();
        },
      },
    ],
    [user?.id]
  );

  useRealtimeChannel({
    channelName: REALTIME_CHANNELS.NOTIFICATIONS,
    subscriptions,
    enabled: !!user?.id,
  });

  const query = useQuery({
    queryKey: queryKeys.notifications.unread(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const unreadCount = useMemo(() => {
    return query.data?.filter((n) => !n.is_read).length ?? 0;
  }, [query.data]);

  return {
    notifications: query.data ?? [],
    unreadCount,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
