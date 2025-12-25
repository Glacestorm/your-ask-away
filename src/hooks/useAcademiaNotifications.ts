import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';

export interface AcademiaNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'course_update' | 'achievement' | 'reminder' | 'certificate' | 'announcement' | 'discussion';
  reference_type?: string | null;
  reference_id?: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationPreferences {
  course_updates: boolean;
  achievements: boolean;
  reminders: boolean;
  certificates: boolean;
  announcements: boolean;
  discussions: boolean;
  email_notifications: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  course_updates: true,
  achievements: true,
  reminders: true,
  certificates: true,
  announcements: true,
  discussions: true,
  email_notifications: false
};

export function useAcademiaNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['academia-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .or('severity.eq.info,severity.eq.success,severity.eq.warning')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Map to AcademiaNotification format
      return (data || []).map(n => ({
        id: n.id,
        user_id: n.user_id,
        title: n.title,
        message: n.message,
        type: mapSeverityToType(n.severity),
        reference_type: null,
        reference_id: null,
        is_read: n.is_read,
        created_at: n.created_at
      })) as AcademiaNotification[];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000 // 30 seconds
  });

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('academia-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as any;
          
          // Show toast for new notification
          toast.info(newNotification.title, {
            description: newNotification.message
          });
          
          // Refetch notifications
          queryClient.invalidateQueries({ queryKey: ['academia-notifications'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Mark as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academia-notifications'] });
    }
  });

  // Mark all as read
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
      queryClient.invalidateQueries({ queryKey: ['academia-notifications'] });
      toast.success('Todas las notificaciones marcadas como leídas');
    }
  });

  // Delete notification
  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academia-notifications'] });
    }
  });

  // Create notification (for system use)
  const createNotification = useCallback(async (
    targetUserId: string,
    title: string,
    message: string,
    type: AcademiaNotification['type'] = 'announcement',
    referenceType?: string,
    referenceId?: string
  ) => {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: targetUserId,
        title,
        message,
        severity: mapTypeToSeverity(type),
        is_read: false
      }]);

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }, []);

  // Computed values
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.is_read).length;
  }, [notifications]);

  const unreadNotifications = useMemo(() => {
    return notifications.filter(n => !n.is_read);
  }, [notifications]);

  const groupedNotifications = useMemo(() => {
    const today: AcademiaNotification[] = [];
    const thisWeek: AcademiaNotification[] = [];
    const older: AcademiaNotification[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    notifications.forEach(n => {
      const date = new Date(n.created_at);
      if (date >= todayStart) {
        today.push(n);
      } else if (date >= weekStart) {
        thisWeek.push(n);
      } else {
        older.push(n);
      }
    });

    return { today, thisWeek, older };
  }, [notifications]);

  // Preferences (stored in localStorage for now)
  const getPreferences = useCallback((): NotificationPreferences => {
    try {
      const stored = localStorage.getItem('academia-notification-preferences');
      return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }, []);

  const updatePreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    const current = getPreferences();
    const updated = { ...current, ...updates };
    localStorage.setItem('academia-notification-preferences', JSON.stringify(updated));
    toast.success('Preferencias actualizadas');
  }, [getPreferences]);

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    groupedNotifications,
    isLoading,
    refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    getPreferences,
    updatePreferences
  };
}

// Helper functions
function mapSeverityToType(severity: string): AcademiaNotification['type'] {
  switch (severity) {
    case 'success': return 'achievement';
    case 'warning': return 'reminder';
    case 'info':
    default: return 'announcement';
  }
}

function mapTypeToSeverity(type: AcademiaNotification['type']): string {
  switch (type) {
    case 'achievement':
    case 'certificate':
      return 'success';
    case 'reminder':
      return 'warning';
    case 'course_update':
    case 'announcement':
    case 'discussion':
    default:
      return 'info';
  }
}

export default useAcademiaNotifications;
